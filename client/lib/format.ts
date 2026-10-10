const currency = new Intl.NumberFormat("en-BD", {
  style: "currency",
  currency: "BDT",
  maximumFractionDigits: 0,
});

export const formatCurrency = (value: number) => currency.format(value);

// timeZone fixed to UTC so server and client render the same date (no hydration mismatch)
export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  });
