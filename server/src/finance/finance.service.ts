// src/finance/finance.service.ts

import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { RedisService } from '../common/redis/redis.service.js';
import { EXPENSES_VERSION_KEY } from '../expenses/expenses.constants.js';
import {
  type ExpenseCategory,
  Expense,
  type ExpenseDocument,
  ExpenseStatus,
} from '../expenses/schemas/expense.schema.js';
import { SUMMARY_VERSION_KEY } from '../orders/orders.constants.js';
import {
  Order,
  type OrderDocument,
  OrderStatus,
} from '../orders/schemas/order.schema.js';
import {
  FINANCE_CACHE_TTL,
  financeSummaryKey,
  MAX_REPORT_DAYS,
} from './finance.constants.js';

export interface FinanceDailyPoint {
  date: string; // "2026-10-01"
  orders: number;
  productRevenue: number;
  cogs: number;
  grossProfit: number;
}

export interface FinanceExpensePoint {
  category: ExpenseCategory;
  amount: number;
  count: number;
}

// Only numbers and strings, so it can be cached as plain JSON
export interface FinanceSummary {
  from: string; // "2026-10-01" (Bangladesh day, included)
  to: string; // "2026-10-31" (Bangladesh day, included)
  orders: number; // delivered orders in the range
  productRevenue: number; // subtotal - discount
  deliveryCharge: number; // delivery fee collected from customers
  cogs: number; // cost price x quantity of what was delivered
  grossProfit: number; // productRevenue - cogs
  expenses: number; // active expenses only
  netProfit: number; // grossProfit + deliveryCharge - expenses
  expensesByCategory: FinanceExpensePoint[];
  daily: FinanceDailyPoint[];
}

type OrderRow = {
  _id: string;
  orders: number;
  productRevenue: number;
  deliveryCharge: number;
  cogs: number;
};

type ExpenseRow = {
  _id: ExpenseCategory;
  amount: number;
  count: number;
};

// Bangladesh is UTC+6 with no daylight saving
const BD_OFFSET_MS = 6 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

// Money is added up in whole cents so 0.1 + 0.2 style errors cannot appear
const toCents = (amount: number) => Math.round(amount * 100);
const fromCents = (cents: number) => cents / 100;

// "2026-10-31" -> 00:00 of that day in Bangladesh. Rejects dates that do not exist.
const bdDayStart = (value: string): Date => {
  const date = new Date(`${value}T00:00:00+06:00`);
  const roundTrip = Number.isNaN(date.getTime())
    ? ''
    : new Date(date.getTime() + BD_OFFSET_MS).toISOString().slice(0, 10);

  if (roundTrip !== value) {
    throw new BadRequestException(`Invalid date: ${value}`);
  }

  return date;
};

@Injectable()
export class FinanceService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    @InjectModel(Expense.name)
    private readonly expenseModel: Model<ExpenseDocument>,
    private readonly redis: RedisService,
  ) {}

  async getSummary(
    fromInput?: string,
    toInput?: string,
  ): Promise<FinanceSummary> {
    const range = this.resolveRange(fromInput, toInput);

    const [ordersVersion, expensesVersion] = await Promise.all([
      this.redis.get<number>(SUMMARY_VERSION_KEY),
      this.redis.get<number>(EXPENSES_VERSION_KEY),
    ]);

    return this.redis.remember(
      financeSummaryKey(
        ordersVersion ?? 0,
        expensesVersion ?? 0,
        range.from,
        range.to,
      ),
      FINANCE_CACHE_TTL,
      () => this.compute(range),
    );
  }

  // ───────────────────────── Internals ─────────────────────────

  private async compute(range: {
    from: string;
    to: string;
    start: Date;
    end: Date;
  }): Promise<FinanceSummary> {
    const [orderRows, expenseRows] = await Promise.all([
      // Delivered orders only, counted on the day they were delivered.
      // A delivered order that is later cancelled stops being "delivered",
      // so it drops out of the report by itself.
      this.orderModel.aggregate<OrderRow>([
        {
          $match: {
            status: OrderStatus.DELIVERED,
            deliveredAt: { $gte: range.start, $lt: range.end },
          },
        },
        {
          $project: {
            day: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$deliveredAt',
                timezone: 'Asia/Dhaka',
              },
            },
            productRevenue: { $subtract: ['$subtotal', '$discountTotal'] },
            deliveryCharge: '$shippingFee',
            cogs: {
              $sum: {
                $map: {
                  input: '$items',
                  as: 'item',
                  in: { $multiply: ['$$item.costPrice', '$$item.quantity'] },
                },
              },
            },
          },
        },
        {
          $group: {
            _id: '$day',
            orders: { $sum: 1 },
            productRevenue: { $sum: '$productRevenue' },
            deliveryCharge: { $sum: '$deliveryCharge' },
            cogs: { $sum: '$cogs' },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // Active expenses only (voided ones are ignored)
      this.expenseModel.aggregate<ExpenseRow>([
        {
          $match: {
            status: ExpenseStatus.ACTIVE,
            expenseDate: { $gte: range.start, $lt: range.end },
          },
        },
        {
          $group: {
            _id: '$category',
            amount: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { amount: -1 } },
      ]),
    ]);

    let ordersCount = 0;
    let revenueCents = 0;
    let deliveryCents = 0;
    let cogsCents = 0;

    const daily: FinanceDailyPoint[] = orderRows.map((row) => {
      const revenue = toCents(row.productRevenue);
      const cogs = toCents(row.cogs);

      ordersCount += row.orders;
      revenueCents += revenue;
      deliveryCents += toCents(row.deliveryCharge);
      cogsCents += cogs;

      return {
        date: row._id,
        orders: row.orders,
        productRevenue: fromCents(revenue),
        cogs: fromCents(cogs),
        grossProfit: fromCents(revenue - cogs),
      };
    });

    let expensesCents = 0;

    const expensesByCategory: FinanceExpensePoint[] = expenseRows.map((row) => {
      const amount = toCents(row.amount);

      expensesCents += amount;

      return {
        category: row._id,
        amount: fromCents(amount),
        count: row.count,
      };
    });

    const grossCents = revenueCents - cogsCents;
    const netCents = grossCents + deliveryCents - expensesCents;

    return {
      from: range.from,
      to: range.to,
      orders: ordersCount,
      productRevenue: fromCents(revenueCents),
      deliveryCharge: fromCents(deliveryCents),
      cogs: fromCents(cogsCents),
      grossProfit: fromCents(grossCents),
      expenses: fromCents(expensesCents),
      netProfit: fromCents(netCents),
      expensesByCategory,
      daily,
    };
  }

  // Both dates are Bangladesh days and both are included.
  // `end` is the start of the day after `to`, so the whole last day counts.
  private resolveRange(fromInput?: string, toInput?: string) {
    const today = new Date(Date.now() + BD_OFFSET_MS)
      .toISOString()
      .slice(0, 10);
    const from = fromInput ?? `${today.slice(0, 8)}01`;
    const to = toInput ?? today;

    const start = bdDayStart(from);
    const end = new Date(bdDayStart(to).getTime() + DAY_MS);

    if (end <= start) {
      throw new BadRequestException('from must not be after to');
    }

    if ((end.getTime() - start.getTime()) / DAY_MS > MAX_REPORT_DAYS) {
      throw new BadRequestException(
        `A report can cover at most ${MAX_REPORT_DAYS} days`,
      );
    }

    return { from, to, start, end };
  }
}
