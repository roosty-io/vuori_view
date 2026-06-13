// Aggregations, KPI deltas, filter scaling, and scenario math.

import { clamp, round } from "./seed";
import {
  CATEGORIES,
  CHANNELS,
  DEVICES,
  PRODUCT_LINES,
  categoryShares,
  channelShares,
  dailyMetrics,
  deviceShares,
  inventoryRisk,
  markets,
  newRepeatShares,
  personas,
  productLineShares,
  revenueTimeline,
} from "./syntheticData";
import type { DailyMetric, ScenarioName } from "./types";

// ── Filters ─────────────────────────────────────────────────────────────────
export type DateRangeKey = "30d" | "90d" | "180d" | "365d" | "730d";

export interface Filters {
  dateRange: DateRangeKey;
  market: string; // "All" or market name
  country: string; // "All" or country
  channel: string; // "All" or channel
  category: string; // "All" or category
  productLine: string; // "All" or line
  persona: string; // "All" or persona
  newVsRepeat: "All" | "New" | "Repeat";
  device: string; // "All" or device
}

export const DEFAULT_FILTERS: Filters = {
  dateRange: "90d",
  market: "All",
  country: "All",
  channel: "All",
  category: "All",
  productLine: "All",
  persona: "All",
  newVsRepeat: "All",
  device: "All",
};

export const DATE_RANGE_OPTIONS: { key: DateRangeKey; label: string; days: number }[] = [
  { key: "30d", label: "Last 30 days", days: 30 },
  { key: "90d", label: "Last 90 days", days: 90 },
  { key: "180d", label: "Last 180 days", days: 180 },
  { key: "365d", label: "Last 12 months", days: 365 },
  { key: "730d", label: "Last 24 months", days: 730 },
];

export const COUNTRIES = Array.from(new Set(markets.map((m) => m.country)));

// ── Dimension shares for filter scaling ─────────────────────────────────────
const totalMarketRevenue = markets.reduce((s, m) => s + m.ecommerceRevenue, 0);
export const marketShares: Record<string, number> = Object.fromEntries(
  markets.map((m) => [m.market, m.ecommerceRevenue / totalMarketRevenue]),
);
export const countryShares: Record<string, number> = (() => {
  const out: Record<string, number> = {};
  markets.forEach((m) => {
    out[m.country] = (out[m.country] ?? 0) + m.ecommerceRevenue / totalMarketRevenue;
  });
  return out;
})();
export const personaShares: Record<string, number> = Object.fromEntries(
  personas.map((p) => [p.personaName, p.share]),
);

function dimFactor(value: string, shares: Record<string, number>): number {
  if (value === "All") return 1;
  return shares[value] ?? 1;
}

/** Multiplicative scaling factor applied to additive metrics. */
export function filterFactor(f: Filters): number {
  return (
    dimFactor(f.market, marketShares) *
    dimFactor(f.country, countryShares) *
    dimFactor(f.channel, channelShares) *
    dimFactor(f.category, categoryShares) *
    dimFactor(f.productLine, productLineShares) *
    dimFactor(f.persona, personaShares) *
    dimFactor(f.device, deviceShares) *
    (f.newVsRepeat === "All" ? 1 : newRepeatShares[f.newVsRepeat])
  );
}

/** Qualitative nudges so rate metrics visibly respond to filters. */
export function qualitativeAdjust(f: Filters): { margin: number; conversion: number; aov: number } {
  let margin = 0;
  let conversion = 0;
  let aov = 0;
  if (f.channel === "Paid Social" || f.channel === "Influencer") {
    margin -= 0.03;
    conversion -= 0.003;
  }
  if (f.channel === "Email" || f.channel === "SMS" || f.channel === "Direct") {
    margin += 0.04;
    conversion += 0.012;
    aov += 6;
  }
  if (f.newVsRepeat === "New") {
    margin -= 0.035;
    aov -= 14;
    conversion -= 0.004;
  }
  if (f.newVsRepeat === "Repeat") {
    margin += 0.03;
    aov += 12;
    conversion += 0.01;
  }
  if (f.device === "Mobile") conversion -= 0.006;
  if (f.device === "Desktop") conversion += 0.008;
  return { margin, conversion, aov };
}

// ── Period slicing ──────────────────────────────────────────────────────────
export function rangeDays(key: DateRangeKey): number {
  return DATE_RANGE_OPTIONS.find((o) => o.key === key)?.days ?? 90;
}

export interface PeriodSlice {
  current: DailyMetric[];
  prior: DailyMetric[];
}
export function slicePeriods(days: number): PeriodSlice {
  const n = dailyMetrics.length;
  const current = dailyMetrics.slice(Math.max(0, n - days));
  const prior = dailyMetrics.slice(Math.max(0, n - days * 2), Math.max(0, n - days));
  return { current, prior };
}

// ── Aggregation ─────────────────────────────────────────────────────────────
export interface MetricSummary {
  revenue: number;
  orders: number;
  sessions: number;
  newCustomers: number;
  repeatRevenue: number;
  newRevenue: number;
  marketingSpend: number;
  grossMarginRate: number;
  conversionRate: number;
  aov: number;
  repeatRevenueShare: number;
  mer: number;
}

function aggregate(rows: DailyMetric[]): MetricSummary {
  if (rows.length === 0) {
    return {
      revenue: 0, orders: 0, sessions: 0, newCustomers: 0, repeatRevenue: 0,
      newRevenue: 0, marketingSpend: 0, grossMarginRate: 0, conversionRate: 0,
      aov: 0, repeatRevenueShare: 0, mer: 0,
    };
  }
  const revenue = rows.reduce((s, r) => s + r.revenue, 0);
  const orders = rows.reduce((s, r) => s + r.orders, 0);
  const sessions = rows.reduce((s, r) => s + r.sessions, 0);
  const newCustomers = rows.reduce((s, r) => s + r.newCustomers, 0);
  const repeatRevenue = rows.reduce((s, r) => s + r.repeatRevenue, 0);
  const newRevenue = rows.reduce((s, r) => s + r.newRevenue, 0);
  const marketingSpend = rows.reduce((s, r) => s + r.marketingSpend, 0);
  const grossMarginRate = rows.reduce((s, r) => s + r.grossMargin, 0) / rows.length;
  const conversionRate = rows.reduce((s, r) => s + r.conversionRate, 0) / rows.length;
  return {
    revenue,
    orders,
    sessions,
    newCustomers,
    repeatRevenue,
    newRevenue,
    marketingSpend,
    grossMarginRate,
    conversionRate,
    aov: orders > 0 ? revenue / orders : 0,
    repeatRevenueShare: revenue > 0 ? repeatRevenue / revenue : 0,
    mer: marketingSpend > 0 ? revenue / marketingSpend : 0,
  };
}

function scaleSummary(s: MetricSummary, f: Filters): MetricSummary {
  const factor = filterFactor(f);
  const adj = qualitativeAdjust(f);
  const grossMarginRate = clamp(s.grossMarginRate + adj.margin, 0.4, 0.72);
  const conversionRate = clamp(s.conversionRate + adj.conversion, 0.012, 0.06);
  const aov = Math.max(40, s.aov + adj.aov);
  const orders = s.orders * factor;
  const revenue = s.revenue * factor;
  return {
    revenue,
    orders,
    sessions: s.sessions * factor,
    newCustomers: s.newCustomers * factor,
    repeatRevenue: s.repeatRevenue * factor,
    newRevenue: s.newRevenue * factor,
    marketingSpend: s.marketingSpend * factor,
    grossMarginRate,
    conversionRate,
    aov,
    repeatRevenueShare: clamp(
      s.repeatRevenueShare + (f.newVsRepeat === "Repeat" ? 0.4 : f.newVsRepeat === "New" ? -0.4 : 0),
      0,
      1,
    ),
    mer: s.mer,
  };
}

export interface FilteredResult {
  current: MetricSummary;
  prior: MetricSummary;
  series: DailyMetric[];
  factor: number;
}

export function computeFiltered(f: Filters): FilteredResult {
  const days = rangeDays(f.dateRange);
  const { current, prior } = slicePeriods(days);
  return {
    current: scaleSummary(aggregate(current), f),
    prior: scaleSummary(aggregate(prior), f),
    series: current,
    factor: filterFactor(f),
  };
}

/** Percent change between two values, guarding divide-by-zero. */
export function pctChange(curr: number, prev: number): number {
  if (prev === 0) return 0;
  return round(((curr - prev) / prev) * 100, 1);
}

// ── Forecast vs plan (from the weekly timeline) ─────────────────────────────
export function forecastVsPlan(): { aheadPct: number; actual: number; plan: number } {
  const recent = revenueTimeline.filter((p) => !p.isFuture).slice(-13);
  const actual = recent.reduce((s, p) => s + (p.actual ?? 0), 0);
  const plan = recent.reduce((s, p) => s + p.plan, 0);
  return { aheadPct: pctChange(actual, plan), actual, plan };
}

// ── Revenue decomposition waterfall ─────────────────────────────────────────
export interface WaterfallItem {
  name: string;
  value: number; // signed contribution
  type: "start" | "delta" | "end";
}
export function revenueWaterfall(f: Filters): WaterfallItem[] {
  const { current, prior } = computeFiltered(f);
  const start = prior.revenue;
  const total = current.revenue - prior.revenue;
  // Attribute the delta to drivers (deterministic split that sums to total).
  const drivers = [
    { name: "New customers", w: 0.22 },
    { name: "Repeat / lifecycle", w: 0.46 },
    { name: "AOV & mix", w: 0.18 },
    { name: "Conversion", w: 0.2 },
    { name: "Promo depth", w: -0.06 },
  ];
  const items: WaterfallItem[] = [{ name: "Prior period", value: start, type: "start" }];
  drivers.forEach((d) => items.push({ name: d.name, value: total * d.w, type: "delta" }));
  items.push({ name: "Current period", value: current.revenue, type: "end" });
  return items;
}

// ── Scenario forecast math ──────────────────────────────────────────────────
export interface ScenarioInputs {
  paidMediaChange: number; // %
  conversionChange: number; // %
  aovChange: number; // %
  emailSmsLift: number; // %
  promoDepth: number; // %
  inventoryConstraint: number; // % (negative impact)
  marketActivationLift: number; // %
  productLaunchImpact: number; // %
  internationalGrowth: number; // %
}

export const SCENARIO_PRESETS: Record<ScenarioName, ScenarioInputs> = {
  "Base Case": { paidMediaChange: 0, conversionChange: 0, aovChange: 0, emailSmsLift: 0, promoDepth: 0, inventoryConstraint: 0, marketActivationLift: 0, productLaunchImpact: 0, internationalGrowth: 0 },
  "Aggressive Growth": { paidMediaChange: 35, conversionChange: 6, aovChange: 2, emailSmsLift: 12, promoDepth: 10, inventoryConstraint: -5, marketActivationLift: 14, productLaunchImpact: 10, internationalGrowth: 18 },
  "Margin Protection": { paidMediaChange: -8, conversionChange: 3, aovChange: 4, emailSmsLift: 8, promoDepth: -18, inventoryConstraint: 0, marketActivationLift: 4, productLaunchImpact: 2, internationalGrowth: 4 },
  "Inventory Constrained": { paidMediaChange: -4, conversionChange: -2, aovChange: 1, emailSmsLift: 4, promoDepth: -6, inventoryConstraint: -16, marketActivationLift: 2, productLaunchImpact: -4, internationalGrowth: 2 },
  "Localized Activation Push": { paidMediaChange: 10, conversionChange: 4, aovChange: 2, emailSmsLift: 10, promoDepth: -2, inventoryConstraint: -2, marketActivationLift: 22, productLaunchImpact: 6, internationalGrowth: 12 },
};

export interface ScenarioOutputs {
  revenue: number;
  baseRevenue: number;
  grossProfit: number;
  newCustomers: number;
  repeatRevenue: number;
  mer: number;
  forecastRisk: "Low" | "Moderate" | "Elevated";
  revenueLiftPct: number;
  drivers: { name: string; contribution: number }[];
}

/** Apply scenario inputs to a forward 26-week base forecast. */
export function computeScenario(inputs: ScenarioInputs): ScenarioOutputs {
  const base = revenueTimeline.filter((p) => p.isFuture).reduce((s, p) => s + p.forecast, 0);

  // Each driver contributes a multiplicative-ish revenue delta (diminishing returns on paid).
  const paid = (Math.sign(inputs.paidMediaChange) * Math.sqrt(Math.abs(inputs.paidMediaChange)) * 1.1) / 100;
  const conv = inputs.conversionChange / 100;
  const aov = inputs.aovChange / 100;
  const emailSms = (inputs.emailSmsLift * 0.6) / 100;
  const promo = (inputs.promoDepth * 0.35) / 100; // revenue up but margin down
  const inv = (inputs.inventoryConstraint * 0.9) / 100;
  const activation = (inputs.marketActivationLift * 0.7) / 100;
  const launch = (inputs.productLaunchImpact * 0.5) / 100;
  const intl = (inputs.internationalGrowth * 0.4) / 100;

  const totalLift = paid + conv + aov + emailSms + promo + inv + activation + launch + intl;
  const revenue = Math.round(base * (1 + totalLift));

  // Margin erodes with promo depth and paid; improves with email/sms and aov.
  const baseMargin = 0.585;
  const marginAdj =
    -inputs.promoDepth * 0.0009 - Math.max(0, inputs.paidMediaChange) * 0.0003 +
    inputs.emailSmsLift * 0.0006 + inputs.aovChange * 0.0009;
  const margin = clamp(baseMargin + marginAdj, 0.5, 0.66);
  const grossProfit = Math.round(revenue * margin);

  const baseNew = 168000;
  const newCustomers = Math.round(baseNew * (1 + paid * 1.4 + activation * 1.2 + intl * 1.1 + conv * 0.6));
  const repeatRevenue = Math.round(revenue * (0.58 + emailSms * 1.5 + activation * 0.3));
  const baseSpend = revenueTimeline.filter((p) => p.isFuture).reduce((s, p) => s + p.forecast, 0) * 0.21;
  const spend = baseSpend * (1 + inputs.paidMediaChange / 100);
  const mer = round(revenue / spend, 2);

  const riskScore = Math.abs(inputs.inventoryConstraint) + Math.abs(inputs.promoDepth) * 0.4 + Math.max(0, inputs.paidMediaChange) * 0.2;
  const forecastRisk = riskScore > 24 ? "Elevated" : riskScore > 12 ? "Moderate" : "Low";

  const drivers = [
    { name: "Paid media", contribution: round(paid * base, 0) },
    { name: "Conversion", contribution: round(conv * base, 0) },
    { name: "AOV & mix", contribution: round(aov * base, 0) },
    { name: "Email / SMS", contribution: round(emailSms * base, 0) },
    { name: "Promo depth", contribution: round(promo * base, 0) },
    { name: "Inventory", contribution: round(inv * base, 0) },
    { name: "Market activation", contribution: round(activation * base, 0) },
    { name: "Launches", contribution: round(launch * base, 0) },
    { name: "International", contribution: round(intl * base, 0) },
  ].filter((d) => Math.abs(d.contribution) > 1);

  return {
    revenue,
    baseRevenue: Math.round(base),
    grossProfit,
    newCustomers,
    repeatRevenue,
    mer,
    forecastRisk,
    revenueLiftPct: round(totalLift * 100, 1),
    drivers,
  };
}

// ── Inventory revenue at risk (headline KPI) ────────────────────────────────
export function inventoryRevenueAtRisk(): number {
  return inventoryRisk.reduce((s, r) => s + r.lostRevenueEstimate, 0);
}

// ── Channel / category breakdowns for charts ────────────────────────────────
export const FILTER_OPTIONS = {
  channels: ["All", ...CHANNELS],
  devices: ["All", ...DEVICES],
  categories: ["All", ...CATEGORIES],
  productLines: ["All", ...PRODUCT_LINES],
  newVsRepeat: ["All", "New", "Repeat"] as const,
};
