export interface LineItemInput {
  sellingPrice: number;
  quantity: number;
}

export function lineAmount(sellingPrice: number, quantity: number): number {
  return round2(sellingPrice * quantity);
}

export function computeSubtotal(items: LineItemInput[]): number {
  return round2(items.reduce((sum, it) => sum + it.sellingPrice * it.quantity, 0));
}

export interface TotalsInput {
  subtotal: number;
  discountPercent: number;
  taxPercent: number;
  /** Manual +/- adjustment applied after tax, e.g. to round the grand total to a whole number. Defaults to 0. */
  roundOff?: number;
}

export interface TotalsResult {
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  taxAmount: number;
  roundOff: number;
  grandTotal: number;
}

/** Clamps a percentage input to a sane 0-100 range, treating NaN/undefined as 0. */
export function clampPercent(value: number | null | undefined): number {
  if (value === null || value === undefined || Number.isNaN(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

/** Reasonable bound on a manual round-off adjustment — it's meant for rounding, not a hidden discount/markup. */
const MAX_ROUND_OFF = 9999;

/** Clamps a round-off adjustment to a sane range, treating NaN/undefined as 0. */
export function clampRoundOff(value: number | null | undefined): number {
  if (value === null || value === undefined || Number.isNaN(value)) return 0;
  return Math.min(MAX_ROUND_OFF, Math.max(-MAX_ROUND_OFF, round2(value)));
}

/** The nearest-whole-number correction for `amount` — e.g. 20713.6 -> +0.4 (rounds to 20714). */
export function suggestRoundOff(amount: number): number {
  return round2(Math.round(amount) - amount);
}

export function computeTotals({ subtotal, discountPercent, taxPercent, roundOff }: TotalsInput): TotalsResult {
  const safeSubtotal = Math.max(0, subtotal || 0);
  const discountAmount = round2((safeSubtotal * clampPercent(discountPercent)) / 100);
  const taxableAmount = round2(safeSubtotal - discountAmount);
  const taxAmount = round2((taxableAmount * clampPercent(taxPercent)) / 100);
  const safeRoundOff = clampRoundOff(roundOff);
  const grandTotal = round2(taxableAmount + taxAmount + safeRoundOff);
  return { subtotal: round2(safeSubtotal), discountAmount, taxableAmount, taxAmount, roundOff: safeRoundOff, grandTotal };
}

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function formatCurrency(value: number, currency = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value || 0);
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "-";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
}
