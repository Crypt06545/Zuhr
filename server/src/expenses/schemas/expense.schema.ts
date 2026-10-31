// src/expenses/schemas/expense.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

// Owner's drawings and stock purchases are NOT expenses, so they are not listed here
export enum ExpenseCategory {
  ADVERTISING = 'advertising',
  COURIER = 'courier',
  PACKAGING = 'packaging',
  SALARY = 'salary',
  RENT = 'rent',
  UTILITIES = 'utilities',
  GATEWAY_FEES = 'gateway_fees',
  SOFTWARE = 'software',
  STOCK_LOSS = 'stock_loss',
  OTHER = 'other',
}

// An expense is never deleted. A wrong entry is voided, and the report ignores it.
export enum ExpenseStatus {
  ACTIVE = 'active',
  VOIDED = 'voided',
}

@Schema({ timestamps: true })
export class Expense {
  @Prop({ type: String, required: true, trim: true, maxlength: 120 })
  title!: string;

  @Prop({
    type: String,
    enum: Object.values(ExpenseCategory),
    required: true,
  })
  category!: ExpenseCategory;

  // In taka (same as orders), at most 2 decimals
  @Prop({ type: Number, required: true, min: 0.01 })
  amount!: number;

  // The day the money was spent, stored as 00:00 of that Bangladesh day.
  // Different from createdAt (when the entry was typed in).
  @Prop({ type: Date, required: true })
  expenseDate!: Date;

  @Prop({ type: String, trim: true, maxlength: 500 })
  note?: string;

  @Prop({
    type: String,
    enum: Object.values(ExpenseStatus),
    default: ExpenseStatus.ACTIVE,
  })
  status!: ExpenseStatus;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  updatedBy?: Types.ObjectId;

  @Prop({ type: Date })
  voidedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  voidedBy?: Types.ObjectId;

  @Prop({ type: String, trim: true, maxlength: 300 })
  voidReason?: string;
}

export type ExpenseDocument = HydratedDocument<Expense>;
export const ExpenseSchema = SchemaFactory.createForClass(Expense);

// Finance report: active expenses in a date range
ExpenseSchema.index({ status: 1, expenseDate: -1, _id: -1 });
// Admin list: newest expense date first
ExpenseSchema.index({ expenseDate: -1, _id: -1 });
