// src/orders/orders.service.ts

import { randomBytes } from 'node:crypto';

import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import {
  type ClientSession,
  type Connection,
  type QueryFilter as FilterQuery,
  Model,
  Types,
} from 'mongoose';

import { RedisService } from '../common/redis/redis.service.js';
import { StockUpdateType } from '../products/dto/update-stock.dto.js';
import { DEFAULT_PAGE_LIMIT } from '../products/products.constants.js';
import {
  type CheckoutLine,
  ProductsService,
  type StockChangeResult,
} from '../products/products.service.js';
import type { CreateOrderDto } from './dto/create-order.dto.js';

import type { UpdateOrderStatusDto } from './dto/update-order-status.dto.js';

import {
  Order,
  type OrderDocument,
  type OrderItem,
  OrderSource,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from './schemas/order.schema.js';
import {
  ADMIN_LIST_PROJECTION,
  CUSTOMER_PROJECTION,
  getShippingFee,
  MAX_LINE_QUANTITY,
  SUMMARY_CACHE_TTL,
  SUMMARY_VERSION_KEY,
  summaryCacheKey,
} from './orders.constants.js';
import {
  AdminQueryOrdersDto,
  QueryMyOrdersDto,
} from './dto/query-orders.dto.js';
import type { CreateAdminOrderDto } from './dto/create-admin-order.dto.js';
import {
  ADMIN_CANCELLABLE,
  CUSTOMER_CANCELLABLE,
  derivePaymentStatus,
  EDITABLE_STATUSES,
  receivedAmount,
  statusesThatCanMoveTo,
} from './orders.rules.js';
import { UpdateOrderDto } from './dto/update-order.dto.js';
import { TelegramService } from '../telegram/telegram.service.js';
type OrderLean = Order & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

type LineInput = { productId: string; variantId: string; quantity: number };

type TimelineInput = {
  event: string;
  at: Date;
  by: Types.ObjectId;
  note?: string;
};

type PaymentOutcome = {
  status: PaymentStatus;
  paid: number;
  event?: string;
  note?: string;
};

export interface OrderListResult {
  items: unknown[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface OrderSummary {
  pending: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  total: number;
}

// Crockford base32: no I, L, O or U, so order numbers are easy to read out loud
const ORDER_NUMBER_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

// Bangladesh is UTC+6 with no daylight saving
const BD_OFFSET_MS = 6 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

// Date only ("2026-10-16") = start of that day in Bangladesh. A full ISO date is used as sent.
const startOfBdDay = (value: string): Date =>
  value.length <= 10 ? new Date(`${value}T00:00:00+06:00`) : new Date(value);

// Money is added up in whole cents so 0.1 + 0.2 style errors cannot appear
const toCents = (amount: number) => Math.round(amount * 100);
const fromCents = (cents: number) => cents / 100;
const lineTotal = (unitPrice: number, quantity: number) =>
  fromCents(toCents(unitPrice) * quantity);

// failed / refunded mean no money is held for this order
const isVoidPayment = (
  value?: PaymentStatus,
): value is PaymentStatus.FAILED | PaymentStatus.REFUNDED =>
  value === PaymentStatus.FAILED || value === PaymentStatus.REFUNDED;

// Written on the timeline when COD money is collected at delivery, so a
// "delivered -> shipped" correction can put the payment back as it was
const COD_COLLECTED_NOTE = 'Collected on delivery';

const receivedBeforeDelivery = (note?: string): number => {
  const match = note?.match(/received before: ([\d.]+)/);
  const value = match ? Number(match[1]) : 0;

  return Number.isFinite(value) ? value : 0;
};

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const keyOf = (productId: string, variantId: string) =>
  `${productId}:${variantId}`;

const isDuplicateKey = (error: unknown, field: string): boolean => {
  if (typeof error !== 'object' || error === null) return false;
  const { code, keyPattern } = error as {
    code?: number;
    keyPattern?: Record<string, unknown>;
  };
  return code === 11000 && !!keyPattern && field in keyPattern;
};

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    @InjectConnection() private readonly connection: Connection,
    private readonly products: ProductsService,
    private readonly redis: RedisService,
    private readonly telegram: TelegramService,
  ) {}

  // ───────────────────────── Customer ─────────────────────────

  /**
   * Checkout. Prices and stock always come from the database, never from the client.
   * Stock is taken with an atomic "only if enough is left" update, in the same
   * transaction that saves the order: either both happen or neither does.
   */
  async create(
    user: { userId: string; email: string },
    dto: CreateOrderDto,
    idempotencyKey?: string,
  ) {
    const userId = new Types.ObjectId(user.userId);

    // The same request sent again returns the order that was already created
    if (idempotencyKey) {
      const existing = await this.findByIdempotencyKey(userId, idempotencyKey);
      if (existing) return this.forCustomer(existing);
    }

    const requested = this.mergeLines(dto.items);
    const lines = await this.products.resolveCheckoutItems(requested);
    const items = lines.map((line) => this.toOrderItem(line));
    const totals = this.computeTotals(
      items,
      getShippingFee(dto.shippingAddress.district),
      0,
    );
    const paymentMethod = dto.paymentMethod ?? PaymentMethod.COD;
    const isMobilePayment =
      paymentMethod === PaymentMethod.BKASH ||
      paymentMethod === PaymentMethod.NAGAD;

    for (let attempt = 0; attempt < 3; attempt++) {
      const orderNumber = this.generateOrderNumber();

      try {
        let stockResults: StockChangeResult[] = [];

        const order = await this.connection.transaction(async (session) => {
          stockResults = []; // the callback can run again after a transient error

          // `items` is already in a fixed order, so two orders never lock
          // the same products in opposite orders
          for (const item of items) {
            stockResults.push(
              await this.products.applyStockChange(
                String(item.product),
                String(item.variant),
                { type: StockUpdateType.ADJUST, quantity: -item.quantity },
                session,
              ),
            );
          }

          const [created] = await this.orderModel.create(
            [
              {
                orderNumber,
                user: userId,
                customer: {
                  name: dto.shippingAddress.fullName,
                  phone: dto.shippingAddress.phone,
                  email: user.email,
                },
                shippingAddress: dto.shippingAddress,
                items,
                ...totals,
                paymentMethod,
                ...(isMobilePayment
                  ? {
                      paymentTransactionId: dto.paymentTransactionId,
                      paymentSenderPhone: dto.paymentSenderPhone,
                    }
                  : {}),
                note: dto.note,
                idempotencyKey,
                timeline: [{ event: 'created', at: new Date(), by: userId }],
              },
            ],
            { session },
          );

          return created!.toObject() as unknown as OrderLean;
        });

        // Only after the commit: cache invalidation must never run for a rolled-back order
        await this.products.afterStockChanged(stockResults);
        await this.bumpSummary();

        // Fire and forget: the customer never waits for Telegram, and a failure
        // there cannot undo the order (the service catches and logs its own errors)
        void this.telegram.notifyNewOrder(order);

        return this.forCustomer(order);
      } catch (error) {
        if (isDuplicateKey(error, 'orderNumber')) continue; // very rare: new number, try again

        if (isDuplicateKey(error, 'paymentTransactionId')) {
          throw new ConflictException(
            'This transaction ID has already been used',
          );
        }

        if (idempotencyKey && isDuplicateKey(error, 'idempotencyKey')) {
          // Two identical requests raced; the other one won
          const winner = await this.findByIdempotencyKey(
            userId,
            idempotencyKey,
          );
          if (winner) return this.forCustomer(winner);
        }

        throw error;
      }
    }

    throw new ConflictException('Could not create the order, please try again');
  }

  async findMine(userId: string, query: QueryMyOrdersDto) {
    const filter: FilterQuery<OrderDocument> = {
      user: new Types.ObjectId(userId),
    };

    if (query.status) filter.status = query.status;

    return this.paginate(
      filter,
      query.limit,
      query.cursor,
      CUSTOMER_PROJECTION,
    );
  }

  async findMineById(userId: string, id: string) {
    const order = await this.orderModel
      .findOne({ _id: id, user: new Types.ObjectId(userId) })
      .select(CUSTOMER_PROJECTION)
      .lean<OrderLean>()
      .exec();

    if (!order) throw new NotFoundException('Order not found');

    return order;
  }

  async cancelMine(userId: string, id: string) {
    const order = await this.cancelOrder(
      { _id: new Types.ObjectId(id), user: new Types.ObjectId(userId) },
      CUSTOMER_CANCELLABLE,
      userId,
      'Cancelled by the customer',
    );

    return this.forCustomer(order);
  }

  // ───────────────────────── Admin: place an order for a customer ─────────────────────────

  /**
   * An admin enters an order for a customer (phone / social media).
   * Same rules as checkout: prices and stock come from the database and the
   * stock is taken in the same transaction. The order remembers which admin
   * placed it (`placedBy`) and the customer's details are typed in by the admin.
   */
  async createByAdmin(
    admin: { userId: string; email: string },
    dto: CreateAdminOrderDto,
    idempotencyKey?: string,
  ) {
    const adminId = new Types.ObjectId(admin.userId);

    // The same request sent again returns the order that was already created
    if (idempotencyKey) {
      const existing = await this.findAdminOrderByKey(adminId, idempotencyKey);
      if (existing) return existing;
    }

    const requested = this.mergeLines(dto.items);
    const lines = await this.products.resolveCheckoutItems(requested);
    const items = lines.map((line) => this.toOrderItem(line));

    const shippingFee =
      dto.shippingFee ?? getShippingFee(dto.shippingAddress.district);
    const totals = this.computeTotals(items, shippingFee, 0);

    const paymentMethod = dto.paymentMethod ?? PaymentMethod.COD;
    const isMobilePayment =
      paymentMethod === PaymentMethod.BKASH ||
      paymentMethod === PaymentMethod.NAGAD;

    // Advance or full payment already received
    const paid = dto.paidAmount ?? 0;

    if (toCents(paid) > toCents(totals.total)) {
      throw new BadRequestException(
        'The received amount cannot be more than the order total',
      );
    }

    const paymentStatus = derivePaymentStatus(paid, totals.total);

    for (let attempt = 0; attempt < 3; attempt++) {
      const orderNumber = this.generateOrderNumber();

      try {
        let stockResults: StockChangeResult[] = [];

        const order = await this.connection.transaction(async (session) => {
          stockResults = [];

          for (const item of items) {
            stockResults.push(
              await this.products.applyStockChange(
                String(item.product),
                String(item.variant),
                { type: StockUpdateType.ADJUST, quantity: -item.quantity },
                session,
              ),
            );
          }

          const now = new Date();
          const timeline: TimelineInput[] = [
            { event: 'created', at: now, by: adminId, note: 'Placed by admin' },
          ];

          if (toCents(paid) > 0) {
            timeline.push({
              event:
                paymentStatus === PaymentStatus.PAID
                  ? 'payment:paid'
                  : 'payment:advance',
              at: now,
              by: adminId,
              note: `Received ${paid} BDT (${paid} of ${totals.total} BDT)`,
            });
          }

          const [created] = await this.orderModel.create(
            [
              {
                orderNumber,
                source: OrderSource.ADMIN,
                placedBy: adminId,
                customer: {
                  name: dto.shippingAddress.fullName,
                  phone: dto.shippingAddress.phone,
                  ...(dto.customerEmail ? { email: dto.customerEmail } : {}),
                },
                shippingAddress: dto.shippingAddress,
                items,
                ...totals,
                paymentMethod,
                paymentStatus,
                paidAmount: paid,
                ...(isMobilePayment
                  ? {
                      paymentTransactionId: dto.paymentTransactionId,
                      paymentSenderPhone: dto.paymentSenderPhone,
                    }
                  : {}),
                adminNote: dto.adminNote,
                idempotencyKey,
                timeline,
              },
            ],
            { session },
          );

          return created!.toObject() as unknown as OrderLean;
        });

        await this.products.afterStockChanged(stockResults);
        await this.bumpSummary();

        // Fire and forget, with the admin's name so the message says who placed it
        void this.adminName(adminId).then((name) =>
          this.telegram.notifyNewOrder(order, name),
        );

        return order;
      } catch (error) {
        if (isDuplicateKey(error, 'orderNumber')) continue;

        if (isDuplicateKey(error, 'paymentTransactionId')) {
          throw new ConflictException(
            'This transaction ID has already been used',
          );
        }

        if (idempotencyKey && isDuplicateKey(error, 'idempotencyKey')) {
          const winner = await this.findAdminOrderByKey(
            adminId,
            idempotencyKey,
          );
          if (winner) return winner;
        }

        throw error;
      }
    }

    throw new ConflictException('Could not create the order, please try again');
  }

  private findAdminOrderByKey(adminId: Types.ObjectId, key: string) {
    return this.orderModel
      .findOne({ placedBy: adminId, idempotencyKey: key })
      .lean<OrderLean>()
      .exec();
  }

  // Only used for the Telegram message; a missing name is not an error
  private async adminName(id: Types.ObjectId): Promise<string | undefined> {
    try {
      const user = await this.connection
        .model('User')
        .findById(id)
        .select('name')
        .lean<{ name?: string }>()
        .exec();

      return user?.name;
    } catch {
      return undefined;
    }
  }

  // ───────────────────────── Admin: read ─────────────────────────

  findAllAdmin(query: AdminQueryOrdersDto): Promise<OrderListResult> {
    const filter: FilterQuery<OrderDocument> = {};

    if (query.status) filter.status = query.status;
    if (query.paymentStatus) filter.paymentStatus = query.paymentStatus;

    if (query.search) {
      // Anchored (starts-with) searches on lower/upper-cased values can use the indexes
      const term = escapeRegex(query.search);

      filter.$or = [
        { orderNumber: { $regex: `^${term.toUpperCase()}` } },
        { paymentTransactionId: { $regex: `^${term.toUpperCase()}` } },
        { 'customer.phone': { $regex: `^${term}` } },
        { 'customer.email': { $regex: `^${term.toLowerCase()}` } },
      ];
    }

    return this.paginate(
      filter,
      query.limit,
      query.cursor,
      ADMIN_LIST_PROJECTION,
      query.dateFrom,
      query.dateTo,
    );
  }

  async findOneAdmin(id: string): Promise<OrderLean> {
    // Only names are loaded (no email, no password hash)
    const order = await this.orderModel
      .findById(id)
      .populate([
        { path: 'timeline.by', model: 'User', select: 'name' },
        { path: 'placedBy', model: 'User', select: 'name' },
      ])
      .lean<OrderLean>()
      .exec();

    if (!order) throw new NotFoundException('Order not found');

    return order;
  }
  // Counts per status for the dashboard cards. Cached for a few seconds, so
  // many admins refreshing the page cost one query, not one each.
  async getSummary(): Promise<OrderSummary> {
    const version = (await this.redis.get<number>(SUMMARY_VERSION_KEY)) ?? 0;

    return this.redis.remember(
      summaryCacheKey(version),
      SUMMARY_CACHE_TTL,
      async () => {
        const rows = await this.orderModel
          .aggregate<{ _id: OrderStatus; count: number }>([
            { $group: { _id: '$status', count: { $sum: 1 } } },
          ])
          .exec();

        const summary: OrderSummary = {
          pending: 0,
          processing: 0,
          shipped: 0,
          delivered: 0,
          cancelled: 0,
          total: 0,
        };

        for (const row of rows) {
          summary[row._id] = row.count;
          summary.total += row.count;
        }

        return summary;
      },
    );
  }

  // ───────────────────────── Admin: status ─────────────────────────

  async updateStatus(id: string, dto: UpdateOrderStatusDto, actorId: string) {
    if (dto.status === OrderStatus.CANCELLED) {
      return this.cancelOrder(
        { _id: new Types.ObjectId(id) },
        ADMIN_CANCELLABLE,
        actorId,
        dto.note,
      );
    }

    const allowedFrom = statusesThatCanMoveTo(dto.status);

    if (!allowedFrom.length) {
      throw new BadRequestException(`Orders cannot be moved to ${dto.status}`);
    }

    // Leaving cancelled: the stock was given back, so take it again
    const current = await this.orderModel
      .findById(id)
      .select('status')
      .lean<Pick<OrderLean, 'status'>>()
      .exec();

    if (!current) throw new NotFoundException('Order not found');

    if (current.status === OrderStatus.CANCELLED) {
      return this.reopenOrder(id, dto, actorId);
    }

    const now = new Date();
    const by = new Types.ObjectId(actorId);

    const filter: FilterQuery<OrderDocument> = {
      _id: id,
      status: { $in: allowedFrom },
    };

    // bKash / Nagad orders can be processed only after the admin marks them paid
    if (dto.status === OrderStatus.PROCESSING) {
      filter.$or = [
        { paymentMethod: PaymentMethod.COD },
        { paymentStatus: PaymentStatus.PAID },
      ];
    }

    // One atomic step: the status changes only if the order is still in a
    // status it may move from. Two admins clicking at once cannot both win.
    // Any status other than delivered clears deliveredAt.
    let updated = await this.orderModel
      .findOneAndUpdate(
        filter,
        {
          $set: {
            status: dto.status,
            ...(dto.status === OrderStatus.DELIVERED
              ? { deliveredAt: now }
              : {}),
          },
          ...(dto.status !== OrderStatus.DELIVERED
            ? { $unset: { deliveredAt: '' } }
            : {}),
          $push: {
            timeline: {
              event: `status:${dto.status}`,
              at: now,
              by,
              note: dto.note,
            },
          },
        },
        { returnDocument: 'after' },
      )
      .lean<OrderLean>()
      .exec();

    if (!updated) {
      const latest = await this.orderModel
        .findById(id)
        .select('status paymentMethod paymentStatus')
        .lean<Pick<OrderLean, 'status' | 'paymentMethod' | 'paymentStatus'>>()
        .exec();

      if (!latest) throw new NotFoundException('Order not found');

      if (latest.status === dto.status) {
        throw new ConflictException(`The order is already ${dto.status}`);
      }

      if (
        dto.status === OrderStatus.PROCESSING &&
        latest.paymentMethod !== PaymentMethod.COD &&
        latest.paymentStatus !== PaymentStatus.PAID
      ) {
        throw new ConflictException(
          `Mark the ${latest.paymentMethod} payment as Paid before processing (now: ${latest.paymentStatus})`,
        );
      }

      throw new ConflictException(
        'The order was changed by someone else. Reload and try again',
      );
    }

    updated = await this.applyCodPaymentRules(id, updated, dto.status, now, by);

    await this.bumpSummary();

    return updated;
  }

  /**
   * COD money is collected at the door, so Delivered marks it paid. If the
   * order leaves Delivered, and that was the only reason it was paid, the
   * payment goes back to what it was before.
   */
  private async applyCodPaymentRules(
    id: string,
    order: OrderLean,
    target: OrderStatus,
    now: Date,
    by: Types.ObjectId,
  ): Promise<OrderLean> {
    if (order.paymentMethod !== PaymentMethod.COD) return order;

    if (
      target === OrderStatus.DELIVERED &&
      (order.paymentStatus === PaymentStatus.PENDING ||
        order.paymentStatus === PaymentStatus.PARTIAL)
    ) {
      const before = receivedAmount(order);

      return (
        (await this.orderModel
          .findOneAndUpdate(
            {
              _id: id,
              paymentStatus: {
                $in: [PaymentStatus.PENDING, PaymentStatus.PARTIAL],
              },
            },
            {
              $set: {
                paymentStatus: PaymentStatus.PAID,
                paidAmount: order.total,
              },
              $push: {
                timeline: {
                  event: 'payment:paid',
                  at: now,
                  by,
                  note: `${COD_COLLECTED_NOTE}; received before: ${before}`,
                },
              },
            },
            { returnDocument: 'after' },
          )
          .lean<OrderLean>()
          .exec()) ?? order
      );
    }

    if (
      target !== OrderStatus.DELIVERED &&
      order.paymentStatus === PaymentStatus.PAID
    ) {
      // Only undo a payment that the delivery step itself collected
      const lastPaid = [...order.timeline]
        .reverse()
        .find((entry) => entry.event === 'payment:paid');

      if (lastPaid?.note?.startsWith(COD_COLLECTED_NOTE)) {
        const restored = receivedBeforeDelivery(lastPaid.note);
        const status = derivePaymentStatus(restored, order.total);

        return (
          (await this.orderModel
            .findOneAndUpdate(
              { _id: id, paymentStatus: PaymentStatus.PAID },
              {
                $set: { paymentStatus: status, paidAmount: restored },
                $push: {
                  timeline: {
                    event: `payment:${status}`,
                    at: now,
                    by,
                    note: 'Moved back from Delivered, payment restored',
                  },
                },
              },
              { returnDocument: 'after' },
            )
            .lean<OrderLean>()
            .exec()) ?? order
        );
      }
    }

    return order;
  }

  /**
   * Cancelled -> any other status. The stock was given back at cancel time, so
   * it is taken again, in the same transaction as the status change. If there
   * is not enough stock, nothing changes and the admin sees why.
   */
  private async reopenOrder(
    id: string,
    dto: UpdateOrderStatusDto,
    actorId: string,
  ): Promise<OrderLean> {
    let stockResults: StockChangeResult[] = [];
    const by = new Types.ObjectId(actorId);

    const reopened = await this.connection.transaction(async (session) => {
      stockResults = [];
      const now = new Date();

      const order = await this.orderModel
        .findOneAndUpdate(
          { _id: id, status: OrderStatus.CANCELLED },
          {
            $set: {
              status: dto.status,
              ...(dto.status === OrderStatus.DELIVERED
                ? { deliveredAt: now }
                : {}),
            },
            $unset: {
              cancelledAt: '',
              ...(dto.status !== OrderStatus.DELIVERED
                ? { deliveredAt: '' }
                : {}),
            },
            $push: {
              timeline: {
                event: `status:${dto.status}`,
                at: now,
                by,
                note: dto.note ?? 'Reopened from Cancelled',
              },
            },
          },
          { returnDocument: 'after', session },
        )
        .lean<OrderLean>()
        .exec();

      if (!order) {
        throw new ConflictException(
          'The order was changed by someone else. Reload and try again',
        );
      }

      if (
        dto.status === OrderStatus.PROCESSING &&
        order.paymentMethod !== PaymentMethod.COD &&
        order.paymentStatus !== PaymentStatus.PAID
      ) {
        throw new ConflictException(
          `Mark the ${order.paymentMethod} payment as Paid before processing (now: ${order.paymentStatus})`,
        );
      }

      // Same fixed order as checkout, so two orders never lock in opposite orders.
      // applyStockChange refuses when stock is short, which rolls everything back.
      for (const item of this.sortedItems(order.items)) {
        stockResults.push(
          await this.products.applyStockChange(
            String(item.product),
            String(item.variant),
            { type: StockUpdateType.ADJUST, quantity: -item.quantity },
            session,
          ),
        );
      }

      return order;
    });

    await this.products.afterStockChanged(stockResults);

    const final = await this.applyCodPaymentRules(
      id,
      reopened,
      dto.status,
      new Date(),
      by,
    );

    await this.bumpSummary();

    return final;
  }

  // ───────────────────────── Admin: edit ─────────────────────────

  /**
   * Edit items, address, shipping fee, payment or note.
   * Changing a quantity moves only the difference in stock, inside one
   * transaction with the order change. Two edits of the same order at once
   * cannot overwrite each other: Mongo detects the conflict and this runs again.
   *
   * Items, address and delivery charge can change only while the order is
   * pending or processing. Payment and the internal note stay editable in
   * every status (late payments, refunds after a cancel).
   */
  async update(id: string, dto: UpdateOrderDto, actorId: string) {
    let stockResults: StockChangeResult[] = [];

    const updated = await this.connection.transaction(async (session) => {
      stockResults = [];

      const order = await this.orderModel
        .findById(id)
        .session(session)
        .lean<OrderLean>()
        .exec();

      if (!order) throw new NotFoundException('Order not found');

      const changesOrderContent =
        dto.items !== undefined ||
        dto.shippingAddress !== undefined ||
        dto.shippingFee !== undefined;

      if (changesOrderContent && !EDITABLE_STATUSES.includes(order.status)) {
        throw new ConflictException(
          `Items, address and delivery charge cannot be changed on a ${order.status} order`,
        );
      }

      if (
        dto.expectedUpdatedAt &&
        new Date(dto.expectedUpdatedAt).getTime() !== order.updatedAt.getTime()
      ) {
        throw new ConflictException(
          'This order was changed by someone else. Reload and try again',
        );
      }

      const set: Record<string, unknown> = {};
      let items = order.items;

      if (dto.items) {
        items = await this.applyItemChanges(
          order,
          dto.items,
          session,
          stockResults,
        );
        set.items = items;
      }

      if (dto.shippingAddress) {
        set.shippingAddress = dto.shippingAddress;
        set['customer.name'] = dto.shippingAddress.fullName;
        set['customer.phone'] = dto.shippingAddress.phone;
      }

      if (dto.adminNote !== undefined) set.adminNote = dto.adminNote;

      const shippingFee = dto.shippingFee ?? order.shippingFee;
      const totals = this.computeTotals(
        items,
        shippingFee,
        order.discountTotal,
      );

      // Payment is worked out against the new total, so an edit that changes
      // the total also keeps pending / partial / paid correct
      const payment = this.resolvePayment(order, dto, totals.total);

      Object.assign(set, totals, {
        paymentStatus: payment.status,
        paidAmount: payment.paid,
      });

      const now = new Date();
      const by = new Types.ObjectId(actorId);
      const timeline: TimelineInput[] = [{ event: 'edited', at: now, by }];

      if (payment.event) {
        timeline.push({
          event: payment.event,
          at: now,
          by,
          note: payment.note,
        });
      }

      const result = await this.orderModel
        .findOneAndUpdate(
          { _id: order._id, status: order.status, updatedAt: order.updatedAt },
          {
            $set: set,
            $push: { timeline: { $each: timeline } },
          },
          { returnDocument: 'after', session },
        )
        .lean<OrderLean>()
        .exec();

      if (!result) {
        throw new ConflictException(
          'The order changed while saving. Reload and try again',
        );
      }

      return result;
    });

    await this.products.afterStockChanged(stockResults);
    await this.bumpSummary();

    return updated;
  }

  // ───────────────────────── Admin: delete ─────────────────────────

  // Only cancelled orders (their stock is already back) can be removed
  async remove(id: string) {
    const deleted = await this.orderModel
      .findOneAndDelete({ _id: id, status: OrderStatus.CANCELLED })
      .lean<OrderLean>()
      .exec();

    if (!deleted) {
      const exists = await this.orderModel.exists({ _id: id });

      if (!exists) throw new NotFoundException('Order not found');

      throw new ConflictException(
        'Only cancelled orders can be deleted. Cancel it first',
      );
    }

    await this.bumpSummary();

    return { id };
  }

  // ───────────────────────── Internals ─────────────────────────

  /**
   * Works out how much money has been received and the payment status after
   * an edit. `paidAmount` is the total received so far, not the new installment.
   *
   *  - paidAmount sent   -> it decides (0 = pending, all = paid, else partial);
   *                         only failed / refunded can be forced next to it
   *  - only paymentStatus -> paid = whole total, pending / failed / refunded = 0,
   *                         partial needs an amount
   *  - neither           -> status follows the money already received, so a
   *                         total that grew or shrank is reflected
   *                         (failed / refunded stay until the admin changes them)
   */
  private resolvePayment(
    order: OrderLean,
    dto: UpdateOrderDto,
    newTotal: number,
  ): PaymentOutcome {
    const before = receivedAmount(order);
    let paid = before;
    let status = order.paymentStatus;

    if (dto.paidAmount !== undefined) {
      if (isVoidPayment(dto.paymentStatus) && dto.paidAmount > 0) {
        throw new BadRequestException(
          `A ${dto.paymentStatus} payment cannot have a received amount`,
        );
      }

      paid = dto.paidAmount;
      status = isVoidPayment(dto.paymentStatus)
        ? dto.paymentStatus
        : derivePaymentStatus(paid, newTotal);
    } else if (dto.paymentStatus !== undefined) {
      if (dto.paymentStatus === PaymentStatus.PARTIAL) {
        throw new BadRequestException(
          'Send the received amount for a partial payment',
        );
      }

      paid = dto.paymentStatus === PaymentStatus.PAID ? newTotal : 0;
      status = dto.paymentStatus;
    } else if (!isVoidPayment(order.paymentStatus)) {
      status = derivePaymentStatus(paid, newTotal);
    }

    if (toCents(paid) > toCents(newTotal)) {
      throw new BadRequestException(
        'The received amount cannot be more than the order total. Lower the received amount first',
      );
    }

    // One timeline entry for the money side of this edit
    const delta = toCents(paid) - toCents(before);
    let event: string | undefined;
    let note: string | undefined;

    if (delta > 0) {
      event =
        status === PaymentStatus.PAID ? 'payment:paid' : 'payment:advance';
      note = `Received ${fromCents(delta)} BDT (${paid} of ${newTotal} BDT)`;
    } else if (status !== order.paymentStatus) {
      event = `payment:${status}`;
      if (delta < 0)
        note = `Received amount lowered by ${fromCents(-delta)} BDT`;
    } else if (delta < 0) {
      event = 'payment:adjusted';
      note = `Received amount lowered by ${fromCents(-delta)} BDT`;
    }

    return { status, paid, event, note };
  }

  /**
   * Cancel and give the stock back, in one transaction.
   * The status change is the "claim": only one request can move the order to
   * cancelled, so the stock can never be given back twice.
   */
  private async cancelOrder(
    filter: Record<string, unknown>,
    allowedFrom: OrderStatus[],
    actorId: string,
    note?: string,
  ): Promise<OrderLean> {
    let stockResults: StockChangeResult[] = [];

    const cancelled = await this.connection.transaction(async (session) => {
      stockResults = [];

      const order = await this.orderModel
        .findOneAndUpdate(
          { ...filter, status: { $in: allowedFrom } },
          {
            $set: { status: OrderStatus.CANCELLED, cancelledAt: new Date() },
            $push: {
              timeline: {
                event: `status:${OrderStatus.CANCELLED}`,
                at: new Date(),
                by: new Types.ObjectId(actorId),
                note,
              },
            },
          },
          { returnDocument: 'after', session },
        )
        .lean<OrderLean>()
        .exec();

      if (!order) {
        const exists = await this.orderModel.exists(filter).session(session);

        throw exists
          ? new ConflictException('This order can no longer be cancelled')
          : new NotFoundException('Order not found');
      }

      for (const item of this.sortedItems(order.items)) {
        await this.restoreStock(
          String(item.product),
          String(item.variant),
          item.quantity,
          session,
          stockResults,
        );
      }

      return order;
    });

    await this.products.afterStockChanged(stockResults);
    await this.bumpSummary();

    return cancelled;
  }

  // Works out the stock difference of an edit and applies it. Returns the new item list.
  private async applyItemChanges(
    order: OrderLean,
    wantedInput: LineInput[],
    session: ClientSession,
    stockResults: StockChangeResult[],
  ): Promise<OrderItem[]> {
    const wanted = this.mergeLines(wantedInput);
    const wantedByKey = new Map(
      wanted.map((line) => [keyOf(line.productId, line.variantId), line]),
    );
    const currentByKey = new Map(
      order.items.map((item) => [
        keyOf(String(item.product), String(item.variant)),
        item,
      ]),
    );

    // Lines that are new to this order are priced from the database now
    const newLines = wanted.filter(
      (line) => !currentByKey.has(keyOf(line.productId, line.variantId)),
    );
    const fresh = newLines.length
      ? await this.products.resolveCheckoutItems(newLines)
      : [];

    // Move only the difference, in a fixed order
    const keys = [
      ...new Set([...currentByKey.keys(), ...wantedByKey.keys()]),
    ].sort();

    for (const key of keys) {
      const before = currentByKey.get(key)?.quantity ?? 0;
      const after = wantedByKey.get(key)?.quantity ?? 0;
      const delta = after - before;

      if (delta === 0) continue;

      const [productId, variantId] = key.split(':') as [string, string];

      if (delta > 0) {
        stockResults.push(
          await this.products.applyStockChange(
            productId,
            variantId,
            { type: StockUpdateType.ADJUST, quantity: -delta },
            session,
          ),
        );
      } else {
        await this.restoreStock(
          productId,
          variantId,
          -delta,
          session,
          stockResults,
        );
      }
    }

    const result: OrderItem[] = [];

    for (const [key, item] of currentByKey) {
      const line = wantedByKey.get(key);

      if (line) {
        result.push({
          ...item,
          quantity: line.quantity,
          lineTotal: lineTotal(item.unitPrice, line.quantity),
        });
      }
    }

    for (const line of fresh) result.push(this.toOrderItem(line));

    if (!result.length) {
      throw new BadRequestException('An order needs at least one item');
    }

    return result;
  }

  // Gives stock back. If the product or variant was deleted meanwhile there is
  // nothing to give back to, and that must not block a cancel or an edit.
  private async restoreStock(
    productId: string,
    variantId: string,
    quantity: number,
    session: ClientSession,
    stockResults: StockChangeResult[],
  ): Promise<void> {
    try {
      stockResults.push(
        await this.products.applyStockChange(
          productId,
          variantId,
          { type: StockUpdateType.ADJUST, quantity },
          session,
        ),
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        this.logger.warn(
          `Stock not restored, product or variant is gone: ${productId}/${variantId}`,
        );
        return;
      }

      throw error;
    }
  }

  // Sums repeated lines of the same variant and puts them in a fixed order
  private mergeLines(items: LineInput[]): LineInput[] {
    const merged = new Map<string, LineInput>();

    for (const item of items) {
      const key = keyOf(item.productId, item.variantId);
      const current = merged.get(key);

      if (current) {
        current.quantity += item.quantity;
      } else {
        merged.set(key, { ...item });
      }
    }

    const lines = [...merged.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, line]) => line);

    if (lines.some((line) => line.quantity > MAX_LINE_QUANTITY)) {
      throw new BadRequestException(
        `You can order at most ${MAX_LINE_QUANTITY} of one item`,
      );
    }

    return lines;
  }

  private sortedItems(items: OrderItem[]): OrderItem[] {
    return [...items].sort((a, b) =>
      keyOf(String(a.product), String(a.variant)).localeCompare(
        keyOf(String(b.product), String(b.variant)),
      ),
    );
  }

  private toOrderItem(line: CheckoutLine): OrderItem {
    return {
      product: new Types.ObjectId(line.productId),
      variant: new Types.ObjectId(line.variantId),
      name: line.name,
      slug: line.slug,
      image: line.image,
      size: line.size,
      color: line.color,
      sku: line.sku,
      unitPrice: line.unitPrice,
      costPrice: line.costPrice,
      quantity: line.quantity,
      lineTotal: lineTotal(line.unitPrice, line.quantity),
    };
  }

  private computeTotals(
    items: OrderItem[],
    shippingFee: number,
    discountTotal: number,
  ) {
    const subtotalCents = items.reduce(
      (sum, item) => sum + toCents(item.unitPrice) * item.quantity,
      0,
    );
    const totalCents = Math.max(
      0,
      subtotalCents - toCents(discountTotal) + toCents(shippingFee),
    );

    return {
      subtotal: fromCents(subtotalCents),
      discountTotal,
      shippingFee,
      total: fromCents(totalCents),
    };
  }

  // Bangladesh date + random suffix. No shared counter, so orders never queue behind each other.
  private generateOrderNumber(): string {
    const now = new Date(Date.now() + BD_OFFSET_MS); // shifted, so the UTC getters give the Bangladesh date
    const date =
      String(now.getUTCFullYear()).slice(2) +
      String(now.getUTCMonth() + 1).padStart(2, '0') +
      String(now.getUTCDate()).padStart(2, '0');

    let suffix = '';
    for (const byte of randomBytes(6)) {
      suffix += ORDER_NUMBER_ALPHABET.charAt(byte % 32); // 256 / 32: every character equally likely
    }

    return `ORD-${date}-${suffix}`;
  }

  private findByIdempotencyKey(userId: Types.ObjectId, key: string) {
    return this.orderModel
      .findOne({ user: userId, idempotencyKey: key })
      .lean<OrderLean>()
      .exec();
  }

  // Customers never get cost price, admin notes or the internal timeline
  private forCustomer<T extends OrderLean>(order: T) {
    const { adminNote: _a, idempotencyKey: _k, timeline: _t, ...rest } = order;

    return {
      ...rest,
      items: order.items.map(({ costPrice: _c, ...item }) => item),
    };
  }

  // A new version makes the old cached counts unreachable (same idea as the products cache)
  private async bumpSummary(): Promise<void> {
    try {
      await this.redis.incr(SUMMARY_VERSION_KEY);
    } catch {
      // The cache expires in a few seconds anyway
    }
  }

  private async paginate(
    base: FilterQuery<OrderDocument>,
    limitInput: number | undefined,
    cursor: string | undefined,
    projection: string,
    dateFrom?: string,
    dateTo?: string,
  ): Promise<OrderListResult> {
    const limit = limitInput ?? DEFAULT_PAGE_LIMIT;
    const filter: FilterQuery<OrderDocument> = { ...base };

    // Dates become _id bounds (an ObjectId starts with its creation time), so the
    // newest-first index does the work and no createdAt index is needed
    const idRange: { $gte?: Types.ObjectId; $lt?: Types.ObjectId } = {};

    if (dateFrom) {
      idRange.$gte = Types.ObjectId.createFromTime(
        Math.floor(startOfBdDay(dateFrom).getTime() / 1000),
      );
    }

    if (dateTo) {
      const end = startOfBdDay(dateTo);
      // date only = the whole Bangladesh day
      const endMs =
        dateTo.length <= 10 ? end.getTime() + DAY_MS : end.getTime();

      idRange.$lt = Types.ObjectId.createFromTime(Math.floor(endMs / 1000));
    }

    if (cursor) {
      const cursorId = new Types.ObjectId(cursor);
      if (!idRange.$lt || cursorId.toHexString() < idRange.$lt.toHexString()) {
        idRange.$lt = cursorId;
      }
    }

    if (idRange.$gte || idRange.$lt) filter._id = idRange;

    // limit + 1: one extra document tells us there is another page (no count query)
    const docs = await this.orderModel
      .find(filter)
      .select(projection)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .lean<OrderLean[]>()
      .exec();

    const hasMore = docs.length > limit;
    const items = hasMore ? docs.slice(0, limit) : docs;
    const last = items[items.length - 1];

    return {
      items,
      nextCursor: hasMore && last ? String(last._id) : null,
      hasMore,
    };
  }
}
