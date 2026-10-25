// src/telegram/telegram.service.ts

import { Injectable, Logger } from '@nestjs/common';
import type { Types } from 'mongoose';

import {
  type Order,
  PaymentMethod,
  PaymentStatus,
} from '../orders/schemas/order.schema.js';

type TelegramOrder = Order & { _id: Types.ObjectId; createdAt: Date };

type InlineKeyboard = {
  inline_keyboard: { text: string; url: string }[][];
};

const PAYMENT_STATUS_EMOJI: Record<PaymentStatus, string> = {
  [PaymentStatus.PENDING]: '⏳',
  [PaymentStatus.PARTIAL]: '🔵',
  [PaymentStatus.PAID]: '✅',
  [PaymentStatus.FAILED]: '❌',
  [PaymentStatus.REFUNDED]: '↩️',
};

const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  [PaymentStatus.PENDING]: 'Unpaid',
  [PaymentStatus.PARTIAL]: 'Partial',
  [PaymentStatus.PAID]: 'Paid',
  [PaymentStatus.FAILED]: 'Failed',
  [PaymentStatus.REFUNDED]: 'Refunded',
};

const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  [PaymentMethod.COD]: 'Cash on delivery',
  [PaymentMethod.BKASH]: 'bKash',
  [PaymentMethod.NAGAD]: 'Nagad',
  [PaymentMethod.CARD]: 'Card',
};

// Telegram HTML mode breaks on < > & in customer text, so every value is escaped
const esc = (value: unknown): string =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const taka = (amount: number): string =>
  `৳${Number(amount || 0).toLocaleString('en-BD')}`;

const formatDate = (date: Date): string =>
  new Date(date).toLocaleString('en-BD', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Dhaka',
  });

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);

  /**
   * Sends the "new order" message. Never throws: a Telegram problem must not
   * break checkout, so every failure is only logged.
   */
  async notifyNewOrder(
    order: TelegramOrder,
    placedByAdmin?: string,
  ): Promise<void> {
    try {
      await this.sendMessage(
        this.formatNewOrder(order, placedByAdmin),
        this.buildKeyboard(String(order._id)),
      );
    } catch (error) {
      this.logger.error(
        `Telegram notification failed for ${order.orderNumber}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  // ───────────────────────── Internals ─────────────────────────

  private async sendMessage(
    text: string,
    replyMarkup?: InlineKeyboard,
  ): Promise<void> {
    // Read at call time, so the .env is always loaded by then
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      this.logger.warn(
        'Telegram is not configured (TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID), skipping',
      );
      return;
    }

    const response = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
          ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
        }),
        signal: AbortSignal.timeout(8000),
      },
    );

    if (!response.ok) {
      throw new Error(
        `Telegram API ${response.status}: ${await response.text()}`,
      );
    }
  }

  // The button is shown only when the admin orders page URL is set in .env
  private buildKeyboard(orderId: string): InlineKeyboard | undefined {
    const base = process.env.TELEGRAM_ADMIN_ORDERS_URL?.replace(/\/+$/, '');

    if (!base) return undefined;

    return {
      inline_keyboard: [
        [{ text: '🔗 Open in Admin Panel', url: `${base}/${orderId}` }],
      ],
    };
  }

  private formatNewOrder(order: TelegramOrder, placedByAdmin?: string): string {
    const address = order.shippingAddress;
    const method = PAYMENT_METHOD_LABEL[order.paymentMethod];
    const isMobile =
      order.paymentMethod === PaymentMethod.BKASH ||
      order.paymentMethod === PaymentMethod.NAGAD;

    const items = order.items
      .map((item, index) => {
        const option = [item.size, item.color].filter(Boolean).join(' / ');

        return (
          `${index + 1}. <b>${esc(item.name)}</b>` +
          (option ? ` <i>(${esc(option)})</i>` : '') +
          `\n      ${item.quantity} × ${taka(item.unitPrice)} = <b>${taka(item.lineTotal)}</b>`
        );
      })
      .join('\n');

    const location = [address.addressLine, address.city, address.district]
      .filter(Boolean)
      .map(esc)
      .join(', ');

    const lines: string[] = [
      order.source === 'admin'
        ? '🛍 <b>NEW ORDER (ADMIN) · ZUHR</b>'
        : '🛍 <b>NEW ORDER · ZUHR</b>',
      `<code>${esc(order.orderNumber)}</code>`,
      `🕒 ${esc(formatDate(order.createdAt))}`,
      ...(order.source === 'admin'
        ? [`🧑‍💼 Placed by admin: <b>${esc(placedByAdmin ?? 'Admin')}</b>`]
        : []),
      '',
      '👤 <b>Customer</b>',
      `   ${esc(address.fullName)}`,
      `   📞 ${esc(address.phone)}`,
      ...(order.customer.email ? [`   ✉️ ${esc(order.customer.email)}`] : []),
      `   📍 ${location}${address.postalCode ? ` - ${esc(address.postalCode)}` : ''}`,
      '',
      `🧾 <b>Items (${order.items.length})</b>`,
      items,
      '',
      '━━━━━━━━━━━━━━━━━━',
      `   Subtotal: ${taka(order.subtotal)}`,
    ];

    if (order.discountTotal > 0) {
      lines.push(`   Discount: −${taka(order.discountTotal)}`);
    }

    lines.push(
      `   Delivery: ${taka(order.shippingFee)}`,
      `💰 <b>Total: ${taka(order.total)}</b>`,
    );

    if (order.paidAmount > 0 && order.paidAmount < order.total) {
      lines.push(
        `   Received: ${taka(order.paidAmount)}`,
        `   Due: <b>${taka(order.total - order.paidAmount)}</b>`,
      );
    }

    lines.push(
      '━━━━━━━━━━━━━━━━━━',
      `💳 <b>${esc(method)}</b> · ${PAYMENT_STATUS_EMOJI[order.paymentStatus]} ${PAYMENT_STATUS_LABEL[order.paymentStatus]}`,
    );

    if (isMobile && order.paymentTransactionId) {
      lines.push(`   TrxID: <code>${esc(order.paymentTransactionId)}</code>`);
    }

    if (isMobile && order.paymentSenderPhone) {
      lines.push(`   Sent from: <code>${esc(order.paymentSenderPhone)}</code>`);
    }

    if (isMobile && order.paymentStatus !== PaymentStatus.PAID) {
      lines.push('   ⚠️ <i>Verify the payment before processing</i>');
    }

    if (order.note) {
      lines.push('', `📝 <b>Customer note</b>\n   <i>${esc(order.note)}</i>`);
    }

    if (order.adminNote) {
      lines.push('', `🗒 <b>Admin note</b>\n   <i>${esc(order.adminNote)}</i>`);
    }

    return lines.join('\n');
  }
}
