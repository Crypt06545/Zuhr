"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { ArrowLeft, Download, Loader2, Printer } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import type { InvoiceData } from "@/lib/invoice";
import { ORDERS_PATH } from "@/lib/routes";

/* Static business info: edit once here, used on every invoice */
const BUSINESS = {
  name: "ZUHR",
  tagline: "Rooted in Sunnah | Trusted for purity.",
  address: "Bogura, Rajshahi, Bangladesh",
  email: "orders@zuhrbd.com",
  phone: "+880 XXXXXXXXXX",
};

// ⚠️ adjust to your actual customer-facing track-order route
const TRACK_ORDER_BASE_URL = "https://zuhrbd.com/track-order";

// Print only the invoice (hides the dashboard sidebar/topbar) and keep
// background colors so the dark table header is printed
const PRINT_STYLES = `
@media print {
  body * { visibility: hidden; }
  #invoice-print-area, #invoice-print-area * { visibility: visible; }
  #invoice-print-area {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
}
`;

const formatCurrency = (value: number) =>
  `৳${Number(value || 0).toLocaleString("en-BD")}`;

// UTC so the server and the browser always render the same day
const formatDate = (date: string) =>
  date
    ? new Date(date).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      })
    : "—";

// Same badge color maps as before. No `variant="secondary"` fallback: that
// variant uses a CSS var color which can break PDF capture.
const paymentStatusBadge = (status: string) => {
  const map: Record<string, string> = {
    Paid: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
    Pending: "bg-amber-100 text-amber-700 hover:bg-amber-100",
    Unpaid: "bg-amber-100 text-amber-700 hover:bg-amber-100",
    Failed: "bg-red-100 text-red-700 hover:bg-red-100",
    Refunded: "bg-slate-100 text-slate-700 hover:bg-slate-100",
  };
  return (
    <Badge className={map[status] || "bg-gray-100 text-gray-700"}>
      {status || "—"}
    </Badge>
  );
};

const orderStatusBadge = (status: string) => {
  const map: Record<string, string> = {
    Processing: "bg-blue-100 text-blue-700 hover:bg-blue-100",
    Confirmed: "bg-indigo-100 text-indigo-700 hover:bg-indigo-100",
    Shipped: "bg-purple-100 text-purple-700 hover:bg-purple-100",
    Delivered: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
    Cancelled: "bg-red-100 text-red-700 hover:bg-red-100",
  };
  return (
    <Badge className={map[status] || "bg-gray-100 text-gray-700"}>
      {status || "—"}
    </Badge>
  );
};

export const InvoiceView = ({ invoice }: { invoice: InvoiceData }) => {
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  const { items } = invoice;
  const subTotal = items.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const trackUrl = `${TRACK_ORDER_BASE_URL}/${encodeURIComponent(invoice.orderId)}`;

  const handlePrint = () => window.print();

  const handleDownloadPdf = async () => {
    if (!invoiceRef.current) return;
    setGeneratingPdf(true);
    try {
      // Loaded on demand: browser-only libraries, kept out of the server render
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas-pro"), // supports the oklch() colors used by Tailwind v4
        import("jspdf"),
      ]);

      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [canvas.width, canvas.height],
      });
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save(
        `ZUHR-Invoice-${invoice.orderId.replace(/[^A-Za-z0-9_-]/g, "")}.pdf`,
      );
    } catch (err) {
      console.error("PDF generation failed:", err);
      toast.error("Couldn't generate the PDF. Please try again.");
    } finally {
      setGeneratingPdf(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <style>{PRINT_STYLES}</style>

      {/* Action bar: hidden on print/PDF */}
      <div className="mb-5 flex items-center justify-between print:hidden">
        <Link
          href={ORDERS_PATH}
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={13} /> Back to orders
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-lg border px-4 py-2 text-xs font-semibold hover:bg-muted"
          >
            <Printer size={14} /> Print
          </button>
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={generatingPdf}
            className="flex items-center gap-1.5 rounded-lg bg-gray-900 px-4 py-2 text-xs font-semibold text-white hover:bg-gray-800 disabled:opacity-60"
          >
            {generatingPdf ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Download size={14} />
            )}
            {generatingPdf ? "Generating..." : "Download PDF"}
          </button>
        </div>
      </div>

      {/* Invoice sheet: captured for the PDF, printed as-is.
          min-h-[820px] keeps the watermark the same size on short and long
          invoices (a shorter card used to clip it). */}
      <div
        id="invoice-print-area"
        ref={invoiceRef}
        className="relative flex min-h-[820px] overflow-hidden rounded-2xl border bg-white p-8 sm:p-10 print:rounded-none print:border-0"
      >
        {/* Watermark: fixed width so it is identical on every invoice */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/ZUHR_logo_transparent.svg"
          alt=""
          aria-hidden="true"
          style={{ opacity: 0.2 }}
          className="pointer-events-none absolute left-1/2 top-1/2 z-0 w-95 max-w-[75%] -translate-x-1/2 -translate-y-1/2 select-none"
        />

        {/* Content sits above the watermark. flex-col + the flex-1 spacer
            below pushes the footer to the card's bottom edge on short invoices. */}
        <div className="relative z-10 flex w-full flex-col">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Invoice</h1>
              <div className="mt-4 space-y-1.5 text-xs text-gray-500">
                <p>
                  Invoice #{" "}
                  <span className="font-semibold text-gray-800">
                    {invoice.orderId}
                  </span>
                </p>
                <p>
                  Invoice Date{" "}
                  <span className="font-semibold text-gray-800">
                    {formatDate(invoice.createdAt)}
                  </span>
                </p>
                <div className="flex items-center gap-1.5 pt-0.5">
                  {orderStatusBadge(invoice.orderStatus)}
                  {paymentStatusBadge(invoice.paymentStatus)}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end text-right">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/ZUHR_logo_transparent.svg"
                alt={BUSINESS.name}
                className="h-16 w-auto object-contain"
              />
              <p className="mt-1.5 text-xs text-gray-400">{BUSINESS.tagline}</p>
            </div>
          </div>

          {/* Billed by / Billed to.
              bg-gray-50/60 is translucent on purpose so the watermark shows
              through these boxes (an opaque background hid it). */}
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-gray-50/60 p-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Billed by
              </p>
              <p className="text-sm font-semibold text-gray-900">
                {BUSINESS.name}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-gray-500">
                {BUSINESS.address}
              </p>
              <p className="mt-2 text-xs text-gray-500">{BUSINESS.email}</p>
              <p className="text-xs text-gray-500">{BUSINESS.phone}</p>
            </div>

            <div className="rounded-xl bg-gray-50/60 p-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Billed to
              </p>
              <p className="text-sm font-semibold text-gray-900">
                {invoice.customerName || "—"}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-gray-500">
                {invoice.address || "—"}
              </p>
              <p className="mt-2 text-xs text-gray-500">
                {invoice.customerPhone || "—"}
              </p>
              {invoice.customerEmail && (
                <p className="text-xs text-gray-500">{invoice.customerEmail}</p>
              )}
            </div>
          </div>

          {/* Items table */}
          <div className="mt-8 overflow-hidden rounded-xl border border-gray-100">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-gray-900 text-white">
                  <th className="w-10 px-4 py-3 font-medium">#</th>
                  <th className="px-4 py-3 font-medium">Item description</th>
                  <th className="px-4 py-3 font-medium">Qty</th>
                  <th className="px-4 py-3 font-medium">Unit Price</th>
                  <th className="px-4 py-3 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item, idx) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{item.name}</p>
                      {item.variantLabel && (
                        <p className="text-[11px] text-gray-400">
                          {item.variantLabel}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{item.quantity}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {formatCurrency(item.price)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {formatCurrency(item.price * item.quantity)}
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-6 text-center text-gray-400"
                    >
                      No item details available for this order.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Payment method */}
          <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
            <span>
              Payment method:{" "}
              <span className="font-medium text-gray-800">
                {invoice.paymentMethod || "COD"}
              </span>
            </span>
            {invoice.transactionId && (
              <span>
                TXN:{" "}
                <span className="font-medium text-gray-800">
                  {invoice.transactionId}
                </span>
              </span>
            )}
          </div>

          {/* QR (track order) + Summary */}
          <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2">
            <div className="flex flex-col items-start">
              <p className="mb-3 text-sm font-semibold text-gray-900">
                Scan to track this order
              </p>
              <div className="flex w-fit flex-col items-center gap-2 rounded-xl border border-gray-100 p-4">
                <QRCodeSVG value={trackUrl} size={100} />
                <p className="max-w-[140px] text-center text-[11px] leading-relaxed text-gray-400">
                  Scan this code anytime to see live order status
                </p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-gray-500">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(subTotal)}
                </span>
              </div>
              {invoice.discount > 0 && (
                <div className="flex justify-between">
                  <span>
                    Discount
                    {invoice.couponCode ? ` (${invoice.couponCode})` : ""}
                  </span>
                  <span className="font-medium text-red-500">
                    − {formatCurrency(invoice.discount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="font-medium text-gray-900">
                  {invoice.shippingCharge === 0
                    ? "Free"
                    : formatCurrency(invoice.shippingCharge)}
                </span>
              </div>
              <div className="my-2 border-t border-gray-100" />
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-semibold text-gray-900">
                  Total
                </span>
                <span className="text-lg font-bold text-gray-900">
                  {formatCurrency(invoice.total)}
                </span>
              </div>
            </div>
          </div>

          {/* Spacer: absorbs leftover height so the footer sits at the bottom */}
          <div className="flex-1" />

          {/* Footer */}
          <div className="mt-10 border-t border-gray-100 pt-5 text-[11px] text-gray-400">
            <p>Thank you for shopping with {BUSINESS.name}.</p>
            <p>
              For any enquiries, email {BUSINESS.email} or call {BUSINESS.phone}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
