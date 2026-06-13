// Display formatters. All figures use tabular numerals in the UI.

const USD0 = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const USD2 = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const NUM0 = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const NUM1 = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });

/** Currency with no decimals. */
export function currency(n: number): string {
  return USD0.format(n);
}

/** Currency with cents. */
export function currency2(n: number): string {
  return USD2.format(n);
}

/** Compact currency: $1.2M, $560K, $980. */
export function compactCurrency(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1_000_000_000) return `${sign}$${(abs / 1_000_000_000).toFixed(abs >= 10_000_000_000 ? 0 : 1)}B`;
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(abs >= 10_000_000 ? 1 : 2)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(abs >= 10_000 ? 0 : 1)}K`;
  return `${sign}$${abs.toFixed(0)}`;
}

/** Compact number: 1.2M, 560K, 980. */
export function compactNumber(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(abs >= 10_000 ? 0 : 1)}K`;
  return `${sign}${NUM0.format(abs)}`;
}

/** Plain integer with thousands separators. */
export function number(n: number): string {
  return NUM0.format(n);
}

export function number1(n: number): string {
  return NUM1.format(n);
}

/** Percent from a 0..1 ratio. */
export function percent(ratio: number, decimals = 1): string {
  return `${(ratio * 100).toFixed(decimals)}%`;
}

/** Percent from an already-scaled value (e.g. 3.4 → "3.4%"). */
export function percentRaw(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/** Signed delta with a leading + or −. */
export function signed(value: number, decimals = 1): string {
  const s = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${s}${Math.abs(value).toFixed(decimals)}`;
}

/** Signed percent: +3.4% / −1.2%. */
export function signedPercent(value: number, decimals = 1): string {
  return `${signed(value, decimals)}%`;
}

/** Multiplier: 3.7x. */
export function multiplier(n: number, decimals = 1): string {
  return `${n.toFixed(decimals)}x`;
}

/** Confidence label from a 0..100 score. */
export function confidenceLabel(score: number): string {
  if (score >= 82) return "High";
  if (score >= 70) return "Medium";
  return "Low";
}
