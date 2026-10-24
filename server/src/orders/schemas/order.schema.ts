// src/orders/schemas/order.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PARTIAL = 'partial',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum PaymentMethod {
  COD = 'cod',
  BKASH = 'bkash',
  NAGAD = 'nagad',
  CARD = 'card',
}

// A copy of the product line at the moment of ordering. Prices and names never
// change afterwards, even if the product is edited or deleted.
@Schema({ _id: false })
export class OrderItem {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  product!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  variant!: Types.ObjectId;

  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  slug!: string;

  @Prop({ type: String })
  image?: string;

  @Prop({ required: true })
  size!: string;

  @Prop({ type: String })
  color?: string;

  @Prop({ required: true })
  sku!: string;

  @Prop({ required: true, min: 0 })
  unitPrice!: number;

  @Prop({ required: true, min: 0 })
  costPrice!: number;

  @Prop({ required: true, min: 1 })
  quantity!: number;

  @Prop({ required: true, min: 0 })
  lineTotal!: number;
}
export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

@Schema({ _id: false })
export class OrderCustomer {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, trim: true })
  phone!: string;

  @Prop({ required: true, trim: true, lowercase: true })
  email!: string;
}
export const OrderCustomerSchema = SchemaFactory.createForClass(OrderCustomer);

@Schema({ _id: false })
export class ShippingAddress {
  @Prop({ required: true, trim: true })
  fullName!: string;

  @Prop({ required: true, trim: true })
  phone!: string;

  @Prop({ required: true, trim: true })
  addressLine!: string;

  @Prop({ required: true, trim: true })
  city!: string;

  @Prop({ type: String, trim: true })
  district?: string;

  @Prop({ type: String, trim: true })
  postalCode?: string;
}
export const ShippingAddressSchema =
  SchemaFactory.createForClass(ShippingAddress);

// Short history of what happened to the order (created, status changes, edits)
@Schema({ _id: false })
export class TimelineEntry {
  @Prop({ required: true })
  event!: string;

  @Prop({ required: true })
  at!: Date;

  @Prop({ type: Types.ObjectId })
  by?: Types.ObjectId;

  @Prop({ type: String })
  note?: string;
}
export const TimelineEntrySchema = SchemaFactory.createForClass(TimelineEntry);

@Schema({ timestamps: true })
export class Order {
  // Human friendly and unique, e.g. ORD-261016-7K3QF9
  @Prop({ required: true, unique: true, uppercase: true, trim: true })
  orderNumber!: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user!: Types.ObjectId;

  @Prop({ type: OrderCustomerSchema, required: true })
  customer!: OrderCustomer;

  @Prop({ type: ShippingAddressSchema, required: true })
  shippingAddress!: ShippingAddress;

  @Prop({
    type: [OrderItemSchema],
    validate: {
      validator: (value: unknown[]) => Array.isArray(value) && value.length > 0,
      message: 'An order needs at least one item',
    },
  })
  items!: OrderItem[];

  @Prop({ required: true, min: 0 })
  subtotal!: number;

  // Filled by the coupons module later
  @Prop({ required: true, min: 0, default: 0 })
  discountTotal!: number;

  @Prop({ required: true, min: 0, default: 0 })
  shippingFee!: number;

  @Prop({ required: true, min: 0 })
  total!: number;

  @Prop({
    type: String,
    enum: Object.values(OrderStatus),
    default: OrderStatus.PENDING,
  })
  status!: OrderStatus;

  @Prop({
    type: String,
    enum: Object.values(PaymentMethod),
    default: PaymentMethod.COD,
  })
  paymentMethod!: PaymentMethod;

  @Prop({
    type: String,
    enum: Object.values(PaymentStatus),
    default: PaymentStatus.PENDING,
  })
  paymentStatus!: PaymentStatus;

  // Money received so far (advance or full). 0 until someone pays.
  // Orders saved before this field existed count as fully received when paid.
  @Prop({ type: Number, default: 0, min: 0 })
  paidAmount!: number;

  // bKash / Nagad only. The admin checks these against the real payment.
  @Prop({ type: String, trim: true, uppercase: true })
  paymentTransactionId?: string;

  @Prop({ type: String, trim: true })
  paymentSenderPhone?: string;

  // Written by the customer at checkout
  @Prop({ type: String, trim: true, maxlength: 500 })
  note?: string;

  // Internal, admin only
  @Prop({ type: String, trim: true, maxlength: 500 })
  adminNote?: string;

  // Same key from the same user = the same order (double click / retry safe)
  @Prop({ type: String })
  idempotencyKey?: string;

  @Prop({ type: [TimelineEntrySchema], default: [] })
  timeline!: TimelineEntry[];

  @Prop({ type: Date })
  cancelledAt?: Date;

  @Prop({ type: Date })
  deliveredAt?: Date;
}

export type OrderDocument = HydratedDocument<Order>;
export const OrderSchema = SchemaFactory.createForClass(Order);

// Admin list: newest first, with or without a status / payment filter
OrderSchema.index({ status: 1, _id: -1 });
OrderSchema.index({ paymentStatus: 1, _id: -1 });
// "My orders"
OrderSchema.index({ user: 1, _id: -1 });
// Admin search (anchored prefix searches)
OrderSchema.index({ 'customer.phone': 1 });
OrderSchema.index({ 'customer.email': 1 });
// One order per (user, idempotency key)
OrderSchema.index(
  { user: 1, idempotencyKey: 1 },
  {
    unique: true,
    partialFilterExpression: { idempotencyKey: { $type: 'string' } },
  },
);
// One transaction ID can pay for one order only (also used by admin search)
OrderSchema.index(
  { paymentTransactionId: 1 },
  {
    unique: true,
    partialFilterExpression: { paymentTransactionId: { $type: 'string' } },
  },
);
