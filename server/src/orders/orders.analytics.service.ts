import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  Order,
  type OrderDocument,
  OrderStatus,
} from './schemas/order.schema.js';
import type { OrderSummary } from './orders.service.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_DAYS = 30;
const TOP_PRODUCTS_LIMIT = 10;

const startOfBdDay = (value: string): Date =>
  value.length <= 10 ? new Date(`${value}T00:00:00+06:00`) : new Date(value);

export interface AnalyticsDailyPoint {
  date: string; // "2026-10-01"
  revenue: number;
  orders: number;
}

export interface AnalyticsProductPoint {
  sku: string;
  name: string;
  size: string;
  color?: string;
  revenue: number;
  orders: number;
}

export interface AnalyticsResult {
  from: string; // ISO
  to: string;
  revenue: number;
  orders: number;
  daily: AnalyticsDailyPoint[];
  products: AnalyticsProductPoint[];
  statuses: OrderSummary;
}

@Injectable()
export class OrdersAnalyticsService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
  ) {}

  async getAnalytics(
    fromInput?: string,
    toInput?: string,
  ): Promise<AnalyticsResult> {
    const { from, to } = this.resolveRange(fromInput, toInput);

    // ObjectId-এর প্রথম ৪ byte = creation time, তাই _id দিয়েই date filter
    // → নতুন index লাগে না, existing `status + _id` index-ই কাজে লাগে
    const idFilter = {
      $gte: Types.ObjectId.createFromTime(Math.floor(from.getTime() / 1000)),
      $lt: Types.ObjectId.createFromTime(Math.floor(to.getTime() / 1000)),
    };
    const activeMatch = {
      _id: idFilter,
      status: { $ne: OrderStatus.CANCELLED },
    };

    const [dailyRows, productRows, statusRows] = await Promise.all([
      // ১. প্রতিদিনের revenue + order count (cancelled বাদ)
      this.orderModel.aggregate<{
        _id: string;
        revenue: number;
        orders: number;
      }>([
        { $match: activeMatch },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$createdAt',
                timezone: 'Asia/Dhaka',
              },
            },
            revenue: { $sum: '$total' },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // ২. Top products / variants (cancelled বাদ) — SKU দিয়ে গ্রুপ
      this.orderModel.aggregate<{
        _id: string;
        name: string;
        size: string;
        color?: string;
        revenue: number;
        orderIds: Types.ObjectId[];
      }>([
        { $match: activeMatch },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.sku',
            name: { $first: '$items.name' },
            size: { $first: '$items.size' },
            color: { $first: '$items.color' },
            revenue: { $sum: '$items.lineTotal' },
            orderIds: { $addToSet: '$_id' },
          },
        },
        { $sort: { revenue: -1 } },
        { $limit: TOP_PRODUCTS_LIMIT },
      ]),

      // ৩. Status breakdown (সব order — cancelled-ও বটে)
      this.orderModel.aggregate<{ _id: OrderStatus; count: number }>([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    const daily: AnalyticsDailyPoint[] = dailyRows.map((row) => ({
      date: row._id,
      revenue: row.revenue,
      orders: row.orders,
    }));

    const products: AnalyticsProductPoint[] = productRows.map((row) => ({
      sku: row._id,
      name: row.name,
      size: row.size,
      color: row.color,
      revenue: row.revenue,
      orders: row.orderIds.length,
    }));

    const revenue = dailyRows.reduce((sum, row) => sum + row.revenue, 0);
    const orders = dailyRows.reduce((sum, row) => sum + row.orders, 0);

    const statuses: OrderSummary = {
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
      total: 0,
    };
    for (const row of statusRows) {
      statuses[row._id] = row.count;
      statuses.total += row.count;
    }

    return {
      from: from.toISOString(),
      to: to.toISOString(),
      revenue,
      orders,
      daily,
      products,
      statuses,
    };
  }

  private resolveRange(fromInput?: string, toInput?: string) {
    const now = new Date();
    let from = fromInput
      ? startOfBdDay(fromInput)
      : new Date(now.getTime() - DEFAULT_DAYS * DAY_MS);

    let to = toInput ? startOfBdDay(toInput) : now;

    // date-only ("2026-10-26") = পুরো বাংলাদেশ দিন, তাই পরদিনের শুরু পর্যন্ত
    if (toInput && toInput.length <= 10) {
      to = new Date(to.getTime() + DAY_MS);
    }

    return { from, to };
  }
}
