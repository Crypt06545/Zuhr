// The dashboard lives under /admin. Change it here if the route prefix ever changes.
export const ORDERS_PATH = "/admin/dashboard/orders";

export const toPublicOrderId = (id: string) => id.replace(/^#/, "");

export const getInvoicePath = (orderId: string) =>
  `${ORDERS_PATH}/${encodeURIComponent(toPublicOrderId(orderId))}/invoice`;
