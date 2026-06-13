// ───────────────────────────────────────────────────────────────────────────
// Vuori View — synthetic data generator.
//
// Everything here is fabricated for a portfolio demo. It is deterministic:
// the same seed always produces the same dataset. No proprietary data, no
// scraped assets. Numbers are tuned to tell coherent commercial stories
// (seasonality, launches, promos, event halos, market opportunity, etc.).
// ───────────────────────────────────────────────────────────────────────────

import { Rng, clamp, round } from "./seed";
import type {
  AiUseCase,
  ChannelSummary,
  CohortRow,
  Competitor,
  DailyMetric,
  EventRow,
  EventType,
  ExternalTrendRow,
  FunnelStage,
  GrowthInitiative,
  InventoryRow,
  MarketSignal,
  Persona,
  PersonaName,
  Product,
  Recommendation,
  TrendSource,
  VisitorSignal,
} from "./types";

// ── Time anchoring (UTC, deterministic regardless of viewer timezone) ───────
const DAY_MS = 86_400_000;
export const ANCHOR_MS = Date.UTC(2026, 5, 13); // 2026-06-13
const HISTORY_DAYS = 730; // 24 months

function isoDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}
function dayOffset(offset: number): string {
  return isoDate(ANCHOR_MS + offset * DAY_MS);
}
function monthOf(iso: string): number {
  return Number(iso.slice(5, 7));
}
function weekdayOf(iso: string): number {
  return new Date(iso + "T00:00:00Z").getUTCDay(); // 0 = Sun
}

// ── Seasonality + spike model ───────────────────────────────────────────────
const MONTH_SEASON: Record<number, number> = {
  1: 1.08, // January fitness / new-year
  2: 0.94,
  3: 0.97,
  4: 1.0,
  5: 1.03,
  6: 1.01,
  7: 1.05, // summer travel / shorts
  8: 0.99,
  9: 1.03,
  10: 1.06,
  11: 1.24, // BFCM ramp
  12: 1.3, // holiday gifting
};

// Hand-placed spike windows (promos, launches, holidays) within the window.
const SPIKE_DAYS: Record<string, number> = {
  "2024-11-29": 2.4, // Black Friday
  "2024-11-30": 1.7,
  "2024-12-02": 2.1, // Cyber Monday
  "2024-12-14": 1.35,
  "2024-12-21": 1.4,
  "2025-01-02": 1.25, // New-year fitness
  "2025-05-26": 1.3, // Memorial Day
  "2025-07-04": 1.35, // Summer event
  "2025-09-01": 1.28, // Labor Day
  "2025-11-28": 2.5, // Black Friday
  "2025-11-29": 1.8,
  "2025-12-01": 2.2, // Cyber Monday
  "2025-12-13": 1.35,
  "2025-12-20": 1.42,
  "2026-01-02": 1.27,
  "2026-05-25": 1.3, // Memorial Day
};

// Product launches create demand spikes + forecast misses around them.
const LAUNCH_DAYS = new Set<string>([
  "2024-09-12",
  "2025-02-20",
  "2025-09-11",
  "2026-03-05",
]);

function annualSeason(iso: string): number {
  return MONTH_SEASON[monthOf(iso)] ?? 1;
}
function weekdayFactor(iso: string): number {
  const d = weekdayOf(iso);
  // DTC apparel: Sunday/Monday strong, mid-week dip, slight Friday lift.
  const f = [1.08, 1.06, 0.99, 0.96, 0.97, 1.02, 1.04];
  return f[d];
}
function spikeFactor(iso: string): number {
  let s = SPIKE_DAYS[iso] ?? 1;
  if (LAUNCH_DAYS.has(iso)) s *= 1.3;
  return s;
}

// ───────────────────────────────────────────────────────────────────────────
// DAILY METRICS — the backbone time series
// ───────────────────────────────────────────────────────────────────────────
const rng = new Rng("vuori-view-v1");

function buildDailyMetrics(): DailyMetric[] {
  const rows: DailyMetric[] = [];
  const startLevel = 568_000; // daily revenue 24 months ago
  const dailyGrowth = Math.pow(1.225, 1 / 365) - 1; // ~22.5% annual

  for (let t = -HISTORY_DAYS + 1; t <= 0; t++) {
    const iso = dayOffset(t);
    const idx = t + HISTORY_DAYS - 1; // 0..729
    const trend = startLevel * Math.pow(1 + dailyGrowth, idx);
    const season = annualSeason(iso);
    const wd = weekdayFactor(iso);
    const spike = spikeFactor(iso);
    const noise = clamp(rng.normal(1, 0.045), 0.85, 1.2);
    const revenue = Math.round(trend * season * wd * spike * noise);

    // Repeat share creeps up over time (growth concentrating in repeat).
    const repeatShare = clamp(0.52 + (idx / HISTORY_DAYS) * 0.09 + rng.normal(0, 0.01), 0.48, 0.64);
    const repeatRevenue = Math.round(revenue * repeatShare);
    const newRevenue = revenue - repeatRevenue;

    const aov = round(132 + season * 8 + spike * 2 + rng.normal(0, 3), 2);
    const orders = Math.round(revenue / aov);
    const conversionRate = round(clamp(0.029 + (season - 1) * 0.02 + rng.normal(0, 0.0012), 0.02, 0.05), 4);
    const sessions = Math.round(orders / conversionRate);

    // New customers flatten in later periods despite revenue growth.
    const acqEfficiency = 1 - (idx / HISTORY_DAYS) * 0.22;
    const newCustomers = Math.round((newRevenue / 150) * acqEfficiency * clamp(rng.normal(1, 0.05), 0.85, 1.15));

    const grossMargin = round(clamp(0.585 - (season - 1) * 0.12 + rng.normal(0, 0.008), 0.5, 0.64), 4);
    const marketingSpend = Math.round(revenue * clamp(0.205 + (season - 1) * 0.05 + rng.normal(0, 0.01), 0.16, 0.3));

    rows.push({
      date: iso,
      revenue,
      orders,
      sessions,
      newCustomers,
      repeatRevenue,
      newRevenue,
      grossMargin,
      aov,
      conversionRate,
      marketingSpend,
    });
  }
  return rows;
}

export const dailyMetrics = buildDailyMetrics();

// ── Weekly revenue/forecast timeline for charts ─────────────────────────────
export interface TimelinePoint {
  date: string;
  label: string;
  actual: number | null;
  plan: number;
  forecast: number;
  lower: number;
  upper: number;
  isFuture: boolean;
}

function buildRevenueTimeline(): TimelinePoint[] {
  // Aggregate dailyMetrics into ISO weeks, keep trailing 78 weeks, extend 26.
  const weeks: { date: string; revenue: number }[] = [];
  for (let i = 0; i < dailyMetrics.length; i += 7) {
    const slice = dailyMetrics.slice(i, i + 7);
    if (slice.length < 4) continue;
    const revenue = slice.reduce((s, d) => s + d.revenue, 0);
    weeks.push({ date: slice[0].date, revenue });
  }
  const trailing = weeks.slice(-78);
  const points: TimelinePoint[] = [];
  const fr = new Rng("timeline");

  trailing.forEach((w) => {
    const planFactor = 1 - 0.034; // running ~3.4% ahead of plan
    const fcErr = fr.normal(0, 0.03);
    points.push({
      date: w.date,
      label: w.date.slice(0, 7),
      actual: w.revenue,
      plan: Math.round(w.revenue * planFactor * clamp(fr.normal(1, 0.015), 0.95, 1.05)),
      forecast: Math.round(w.revenue * (1 + fcErr)),
      lower: Math.round(w.revenue * 0.93),
      upper: Math.round(w.revenue * 1.07),
      isFuture: false,
    });
  });

  // Extend 26 weeks of forecast from last actual.
  const last = trailing[trailing.length - 1];
  const weeklyGrowth = Math.pow(1.2, 7 / 365) - 1;
  let lvl = last.revenue;
  for (let k = 1; k <= 26; k++) {
    const futureMs = ANCHOR_MS + k * 7 * DAY_MS;
    const iso = isoDate(futureMs);
    const season = annualSeason(iso);
    lvl = lvl * (1 + weeklyGrowth);
    const forecast = Math.round(lvl * season * clamp(fr.normal(1, 0.01), 0.97, 1.03));
    const band = 0.06 + (k / 26) * 0.1; // widening uncertainty
    points.push({
      date: iso,
      label: iso.slice(0, 7),
      actual: null,
      plan: Math.round(forecast * 0.965),
      forecast,
      lower: Math.round(forecast * (1 - band)),
      upper: Math.round(forecast * (1 + band)),
      isFuture: true,
    });
  }
  return points;
}

export const revenueTimeline = buildRevenueTimeline();

// ── Forecast accuracy by month ──────────────────────────────────────────────
export interface ForecastAccuracy {
  month: string;
  mape: number; // %
  bias: number; // % (signed)
  note: string;
}
function buildForecastAccuracy(): ForecastAccuracy[] {
  const months = [
    "2025-07", "2025-08", "2025-09", "2025-10", "2025-11", "2025-12",
    "2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06",
  ];
  const fr = new Rng("accuracy");
  return months.map((m) => {
    const launch = m === "2025-09" || m === "2026-03";
    const holiday = m === "2025-11" || m === "2025-12";
    const base = 4.2 + (launch ? 4.5 : 0) + (holiday ? 3.1 : 0);
    const mape = round(base + Math.abs(fr.normal(0, 1)), 1);
    return {
      month: m,
      mape,
      bias: round(fr.normal(launch ? -3 : 0, 1.4), 1),
      note: launch
        ? "Launch demand under-forecast"
        : holiday
          ? "Promo elasticity widened error"
          : "Stable mature-market accuracy",
    };
  });
}
export const forecastAccuracy = buildForecastAccuracy();

// ───────────────────────────────────────────────────────────────────────────
// DIMENSION SHARES — power the global filters cheaply & deterministically
// ───────────────────────────────────────────────────────────────────────────
export const CHANNELS = [
  "Paid Search", "Paid Social", "Affiliate", "Influencer", "Email",
  "SMS", "Organic Search", "Direct", "Retail Halo", "Brand Campaigns",
] as const;

export const DEVICES = ["Mobile", "Desktop", "Tablet"] as const;
export const CATEGORIES = [
  "Bottoms", "Tops", "Outerwear", "Layers", "Shorts", "Dresses", "Accessories",
] as const;
export const PRODUCT_LINES = [
  "Performance", "Studio", "Travel", "Trail", "Coastal", "Essentials",
] as const;

function shareMap<T extends string>(keys: readonly T[], weights: number[]): Record<T, number> {
  const total = weights.reduce((a, b) => a + b, 0);
  const out = {} as Record<T, number>;
  keys.forEach((k, i) => (out[k] = weights[i] / total));
  return out;
}

export const channelShares = shareMap(CHANNELS, [18, 22, 8, 9, 12, 6, 11, 9, 3, 2]);
export const deviceShares = shareMap(DEVICES, [62, 31, 7]);
export const categoryShares = shareMap(CATEGORIES, [30, 26, 10, 12, 9, 8, 5]);
export const productLineShares = shareMap(PRODUCT_LINES, [26, 18, 16, 15, 12, 13]);
export const newRepeatShares = { New: 0.42, Repeat: 0.58 };

// ───────────────────────────────────────────────────────────────────────────
// MARKETS
// ───────────────────────────────────────────────────────────────────────────
interface MarketSeed {
  name: string;
  country: string;
  dma: string;
  lat: number;
  lng: number;
  revTier: number; // 1..10 relative ecommerce revenue
  tg: number; // traffic growth YoY %
  conv: number;
  rep: number;
  search: number; // 0..160 index
  socV: number; // social velocity %
  well: number; // 0..100
  run: number; // 0..100
  out: number; // outdoor index 0..100
  inc: number; // income index 80..175
  comp: number; // competitor intensity 0..100
  ws: number; // retail whitespace 0..100
  pf: number; // persona fit 0..100
  topPersonas: PersonaName[];
  action: string;
}

const MARKET_SEEDS: MarketSeed[] = [
  { name: "Austin", country: "USA", dma: "Austin TX", lat: 30.27, lng: -97.74, revTier: 6, tg: 33, conv: 0.038, rep: 0.45, search: 165, socV: 58, well: 88, run: 92, out: 70, inc: 150, comp: 22, ws: 90, pf: 95, topPersonas: ["Performance Commuter", "Wellness Socialite", "Studio Minimalist"], action: "Localized activation + community event" },
  { name: "Denver", country: "USA", dma: "Denver CO", lat: 39.74, lng: -104.99, revTier: 6, tg: 18, conv: 0.034, rep: 0.4, search: 128, socV: 30, well: 70, run: 66, out: 95, inc: 130, comp: 40, ws: 72, pf: 86, topPersonas: ["Trail & Recovery", "Performance Commuter", "Modern Dad Uniform"], action: "Outdoor / trail localization" },
  { name: "Miami", country: "USA", dma: "Miami FL", lat: 25.76, lng: -80.19, revTier: 6, tg: 22, conv: 0.031, rep: 0.33, search: 120, socV: 44, well: 64, run: 40, out: 60, inc: 128, comp: 52, ws: 66, pf: 82, topPersonas: ["Coastal Active", "Travel Weekender", "Wellness Socialite"], action: "Coastal capsule + paid social" },
  { name: "Boston", country: "USA", dma: "Boston MA", lat: 42.36, lng: -71.06, revTier: 7, tg: 16, conv: 0.033, rep: 0.43, search: 110, socV: 22, well: 58, run: 70, out: 62, inc: 150, comp: 50, ws: 60, pf: 84, topPersonas: ["Performance Commuter", "Premium Basics Loyalist", "Trail & Recovery"], action: "Commuter / premium basics lifecycle" },
  { name: "Los Angeles", country: "USA", dma: "Los Angeles CA", lat: 34.05, lng: -118.24, revTier: 9, tg: 9, conv: 0.035, rep: 0.41, search: 140, socV: 18, well: 82, run: 60, out: 72, inc: 135, comp: 78, ws: 32, pf: 88, topPersonas: ["Coastal Active", "Studio Minimalist", "Wellness Socialite"], action: "Retention + creator amplification" },
  { name: "San Diego", country: "USA", dma: "San Diego CA", lat: 32.72, lng: -117.16, revTier: 7, tg: 11, conv: 0.034, rep: 0.42, search: 118, socV: 20, well: 76, run: 64, out: 80, inc: 132, comp: 64, ws: 44, pf: 85, topPersonas: ["Coastal Active", "Travel Weekender", "Studio Minimalist"], action: "Coastal retention + retail halo" },
  { name: "San Francisco", country: "USA", dma: "San Francisco CA", lat: 37.77, lng: -122.42, revTier: 8, tg: 8, conv: 0.036, rep: 0.44, search: 125, socV: 16, well: 78, run: 58, out: 70, inc: 168, comp: 72, ws: 38, pf: 86, topPersonas: ["Performance Commuter", "Premium Basics Loyalist", "Studio Minimalist"], action: "Premium basics replenishment" },
  { name: "New York", country: "USA", dma: "New York NY", lat: 40.71, lng: -74.01, revTier: 10, tg: 12, conv: 0.032, rep: 0.42, search: 150, socV: 26, well: 80, run: 74, out: 58, inc: 160, comp: 82, ws: 30, pf: 87, topPersonas: ["Performance Commuter", "Premium Basics Loyalist", "Wellness Socialite"], action: "Margin-aware acquisition + commuter" },
  { name: "Chicago", country: "USA", dma: "Chicago IL", lat: 41.88, lng: -87.63, revTier: 7, tg: 14, conv: 0.031, rep: 0.38, search: 112, socV: 24, well: 62, run: 60, out: 56, inc: 126, comp: 56, ws: 58, pf: 80, topPersonas: ["Performance Commuter", "Trail & Recovery", "Modern Dad Uniform"], action: "Layering / cold-weather lifecycle" },
  { name: "Seattle", country: "USA", dma: "Seattle WA", lat: 47.61, lng: -122.33, revTier: 6, tg: 15, conv: 0.033, rep: 0.4, search: 116, socV: 28, well: 66, run: 58, out: 84, inc: 140, comp: 54, ws: 56, pf: 82, topPersonas: ["Trail & Recovery", "Performance Commuter", "Premium Basics Loyalist"], action: "Outdoor / layering + commuter" },
  { name: "Nashville", country: "USA", dma: "Nashville TN", lat: 36.16, lng: -86.78, revTier: 5, tg: 26, conv: 0.03, rep: 0.34, search: 108, socV: 48, well: 60, run: 56, out: 58, inc: 118, comp: 34, ws: 78, pf: 80, topPersonas: ["Wellness Socialite", "Performance Commuter", "Travel Weekender"], action: "Emerging-market activation test" },
  { name: "Salt Lake City", country: "USA", dma: "Salt Lake City UT", lat: 40.76, lng: -111.89, revTier: 5, tg: 20, conv: 0.032, rep: 0.39, search: 104, socV: 34, well: 58, run: 60, out: 96, inc: 120, comp: 38, ws: 74, pf: 81, topPersonas: ["Trail & Recovery", "Performance Commuter", "Modern Dad Uniform"], action: "Ski / recovery seasonal localization" },
  { name: "Phoenix", country: "USA", dma: "Phoenix AZ", lat: 33.45, lng: -112.07, revTier: 5, tg: 17, conv: 0.029, rep: 0.35, search: 100, socV: 30, well: 56, run: 44, out: 66, inc: 116, comp: 44, ws: 70, pf: 78, topPersonas: ["Coastal Active", "Travel Weekender", "Modern Dad Uniform"], action: "Warm-weather capsule test" },
  { name: "Dallas", country: "USA", dma: "Dallas TX", lat: 32.78, lng: -96.8, revTier: 6, tg: 19, conv: 0.031, rep: 0.37, search: 114, socV: 32, well: 58, run: 50, out: 58, inc: 124, comp: 46, ws: 68, pf: 79, topPersonas: ["Performance Commuter", "Modern Dad Uniform", "Wellness Socialite"], action: "Metro expansion + lifecycle" },
  { name: "London", country: "UK", dma: "London", lat: 51.51, lng: -0.13, revTier: 5, tg: 24, conv: 0.027, rep: 0.31, search: 96, socV: 40, well: 70, run: 64, out: 60, inc: 138, comp: 60, ws: 64, pf: 76, topPersonas: ["Performance Commuter", "Premium Basics Loyalist", "Travel Weekender"], action: "International localization POC" },
  { name: "Seoul", country: "South Korea", dma: "Seoul", lat: 37.57, lng: 126.98, revTier: 4, tg: 30, conv: 0.025, rep: 0.28, search: 92, socV: 56, well: 84, run: 50, out: 54, inc: 134, comp: 58, ws: 72, pf: 74, topPersonas: ["Studio Minimalist", "Wellness Socialite", "Performance Commuter"], action: "APAC localization + creator" },
  { name: "Beijing", country: "China", dma: "Beijing", lat: 39.9, lng: 116.41, revTier: 3, tg: 28, conv: 0.022, rep: 0.25, search: 84, socV: 50, well: 66, run: 40, out: 48, inc: 122, comp: 54, ws: 76, pf: 70, topPersonas: ["Studio Minimalist", "Performance Commuter", "Premium Basics Loyalist"], action: "APAC market-entry study" },
  { name: "Shanghai", country: "China", dma: "Shanghai", lat: 31.23, lng: 121.47, revTier: 4, tg: 27, conv: 0.024, rep: 0.27, search: 88, socV: 52, well: 72, run: 44, out: 50, inc: 130, comp: 56, ws: 74, pf: 72, topPersonas: ["Studio Minimalist", "Wellness Socialite", "Travel Weekender"], action: "APAC localization + premium" },
];

// Opportunity scoring weights (sum to 1.0).
export const OPP_WEIGHTS = {
  trafficGrowth: 0.15,
  conversion: 0.1,
  repeat: 0.1,
  search: 0.12,
  social: 0.1,
  wellnessRun: 0.1,
  personaFit: 0.12,
  income: 0.06,
  whitespace: 0.08,
  competitorInverse: 0.07,
} as const;

function norm(v: number, min: number, max: number): number {
  return clamp(((v - min) / (max - min)) * 100, 0, 100);
}

export interface OppComponents {
  trafficGrowth: number;
  conversion: number;
  repeat: number;
  search: number;
  social: number;
  wellnessRun: number;
  personaFit: number;
  income: number;
  whitespace: number;
  competitorInverse: number;
}

export function oppComponents(m: MarketSeed): OppComponents {
  return {
    trafficGrowth: norm(m.tg, -5, 35),
    conversion: norm(m.conv, 0.018, 0.04),
    repeat: norm(m.rep, 0.22, 0.48),
    search: norm(m.search, 60, 165),
    social: norm(m.socV, -10, 62),
    wellnessRun: (m.well + m.run) / 2,
    personaFit: m.pf,
    income: norm(m.inc, 80, 175),
    whitespace: m.ws,
    competitorInverse: 100 - m.comp,
  };
}

function oppScore(c: OppComponents): number {
  return (
    c.trafficGrowth * OPP_WEIGHTS.trafficGrowth +
    c.conversion * OPP_WEIGHTS.conversion +
    c.repeat * OPP_WEIGHTS.repeat +
    c.search * OPP_WEIGHTS.search +
    c.social * OPP_WEIGHTS.social +
    c.wellnessRun * OPP_WEIGHTS.wellnessRun +
    c.personaFit * OPP_WEIGHTS.personaFit +
    c.income * OPP_WEIGHTS.income +
    c.whitespace * OPP_WEIGHTS.whitespace +
    c.competitorInverse * OPP_WEIGHTS.competitorInverse
  );
}

export const marketComponents: Record<string, OppComponents> = {};

function buildMarkets(): MarketSignal[] {
  const mr = new Rng("markets");
  // Revenue scale: tier 10 ≈ $46M trailing-year ecommerce, scaling down.
  const out = MARKET_SEEDS.map((m) => {
    const comp = oppComponents(m);
    marketComponents[m.name] = comp;
    const score = round(oppScore(comp), 0);
    const ecommerceRevenue = Math.round(m.revTier * 4_600_000 * clamp(mr.normal(1, 0.04), 0.9, 1.1));
    const ecommerceTraffic = Math.round(ecommerceRevenue / (m.conv * 138));
    return {
      date: dayOffset(0),
      market: m.name,
      dma: m.dma,
      country: m.country,
      ecommerceRevenue,
      ecommerceTraffic,
      ecommerceTrafficGrowth: m.tg,
      conversionRate: m.conv,
      repeatPurchaseRate: m.rep,
      emailSubscribers: Math.round(ecommerceTraffic * 0.18),
      smsSubscribers: Math.round(ecommerceTraffic * 0.07),
      searchDemandIndex: m.search,
      socialMentionIndex: Math.round(60 + m.socV * 0.8 + mr.normal(0, 4)),
      socialMentionVelocity: m.socV,
      competitorIntensityIndex: m.comp,
      wellnessStudioDensity: m.well,
      runClubDensity: m.run,
      outdoorActivityIndex: m.out,
      incomeIndex: m.inc,
      weatherIndex: Math.round(50 + mr.normal(0, 12)),
      retailProximityScore: round(100 - m.ws, 0),
      wholesalePresenceScore: Math.round(clamp(m.revTier * 8 + mr.normal(0, 6), 10, 95)),
      personaFit: m.pf,
      opportunityScore: score,
      recommendedAction: m.action,
      topPersonas: m.topPersonas,
      lat: m.lat,
      lng: m.lng,
      revenueRank: 0,
    } satisfies MarketSignal;
  });

  // Rank by revenue.
  [...out]
    .sort((a, b) => b.ecommerceRevenue - a.ecommerceRevenue)
    .forEach((m, i) => (m.revenueRank = i + 1));
  return out.sort((a, b) => b.opportunityScore - a.opportunityScore);
}

export const markets = buildMarkets();
export const marketNames = MARKET_SEEDS.map((m) => m.name);
export const austin = markets.find((m) => m.market === "Austin")!;

// ── Per-market weekly trend series (search / social / sentiment) ─────────────
export interface MarketTrendPoint {
  week: string;
  market: string;
  search: number;
  social: number;
  sentiment: number;
}
function buildMarketTrends(): MarketTrendPoint[] {
  const out: MarketTrendPoint[] = [];
  MARKET_SEEDS.forEach((m) => {
    const tr = new Rng("trend-" + m.name);
    for (let w = 51; w >= 0; w--) {
      const iso = isoDate(ANCHOR_MS - w * 7 * DAY_MS);
      const progress = (51 - w) / 51;
      const accel = 1 + (m.socV / 100) * progress; // accelerating demand
      out.push({
        week: iso,
        market: m.name,
        search: Math.round(m.search * (0.8 + 0.4 * progress) * accel * clamp(tr.normal(1, 0.04), 0.9, 1.1)),
        social: Math.round((60 + m.socV) * (0.7 + 0.5 * progress) * accel * clamp(tr.normal(1, 0.05), 0.88, 1.12)),
        sentiment: round(clamp(0.28 + (m.socV / 200) + progress * 0.08 + tr.normal(0, 0.04), -0.2, 0.85), 2),
      });
    }
  });
  return out;
}
export const marketTrends = buildMarketTrends();

// ───────────────────────────────────────────────────────────────────────────
// PERSONAS
// ───────────────────────────────────────────────────────────────────────────
interface PersonaSeed {
  name: PersonaName;
  emoji: string;
  description: string;
  activities: string[];
  categories: Persona["preferredCategories"];
  products: string[];
  colors: string[];
  channels: Persona["preferredChannels"];
  aov: number;
  ltv: number;
  promo: number;
  churn: number;
  repeat: number;
  cac: number;
  share: number;
  message: string;
  action: string;
}

const PERSONA_SEEDS: PersonaSeed[] = [
  { name: "Performance Commuter", emoji: "🚲", description: "Versatile pieces for work, travel, and daily movement.", activities: ["Commute", "Travel", "Training"], categories: ["Bottoms", "Tops", "Layers"], products: ["Meta Pant", "Strato Tech Tee", "Transit Commuter Shirt", "Restore Half Zip"], colors: ["Charcoal", "Storm", "Black", "Stone"], channels: ["Paid Search", "Email", "Direct"], aov: 142, ltv: 520, promo: 0.3, churn: 0.22, repeat: 0.46, cac: 64, share: 0.16, message: "Built to move. Styled for every day.", action: "Commuter/workwear creative + replenishment" },
  { name: "Coastal Active", emoji: "🏄", description: "Surf, beach, and warm-weather activity in relaxed fits and lighter palettes.", activities: ["Surf", "Travel", "Training"], categories: ["Shorts", "Tops", "Dresses"], products: ["Kore Short", "Coastal Training Tank", "Villa Wideleg"], colors: ["Coastal Blue", "Oat", "Sand", "Ocean"], channels: ["Paid Social", "Influencer", "Organic Search"], aov: 124, ltv: 410, promo: 0.42, churn: 0.3, repeat: 0.36, cac: 72, share: 0.11, message: "Made for sun, salt, and motion.", action: "Warm-weather capsule + creator content" },
  { name: "Studio Minimalist", emoji: "🧘", description: "Yoga, pilates, matching sets, soft fabrics, and neutral colors.", activities: ["Yoga", "Pilates", "Recovery"], categories: ["Bottoms", "Tops"], products: ["Daily Legging", "DreamKnit Layer", "Villa Wideleg"], colors: ["Heather Sage", "Oat", "Stone", "Black"], channels: ["Paid Social", "Email", "Organic Search"], aov: 132, ltv: 480, promo: 0.34, churn: 0.24, repeat: 0.43, cac: 60, share: 0.13, message: "Soft performance for stillness and flow.", action: "Set bundling + studio partnerships" },
  { name: "Trail & Recovery", emoji: "⛰️", description: "Outdoor, trail, layering, durability, recovery, and cold-weather performance.", activities: ["Trail", "Ski", "Recovery"], categories: ["Outerwear", "Layers", "Bottoms"], products: ["Sunday Performance Jogger", "Canyon Insulated Jacket", "Restore Half Zip", "Meta Pant"], colors: ["Dusty Olive", "Storm", "Clay", "Charcoal"], channels: ["Paid Search", "Affiliate", "Direct"], aov: 158, ltv: 540, promo: 0.28, churn: 0.26, repeat: 0.41, cac: 70, share: 0.1, message: "Built for the climb and the recovery.", action: "Outdoor localization + layering attach" },
  { name: "Travel Weekender", emoji: "✈️", description: "Resort, airport, comfort, wrinkle-resistant apparel, and elevated casual.", activities: ["Travel", "Lounge", "Commute"], categories: ["Tops", "Bottoms", "Outerwear"], products: ["Villa Wideleg", "Transit Commuter Shirt", "DreamKnit Layer", "Halo Essential Hoodie"], colors: ["Stone", "Oat", "Storm", "Sand"], channels: ["Email", "Paid Social", "Direct"], aov: 150, ltv: 500, promo: 0.3, churn: 0.25, repeat: 0.4, cac: 66, share: 0.1, message: "From the gate to the table.", action: "Travel capsule + lifecycle attach" },
  { name: "Modern Dad Uniform", emoji: "👕", description: "Repeat buyer of pants, shorts, joggers — high loyalty, lower fashion risk.", activities: ["Lounge", "Training", "Commute"], categories: ["Bottoms", "Shorts"], products: ["Sunday Performance Jogger", "Kore Short", "Meta Pant"], colors: ["Black", "Charcoal", "Storm", "Stone"], channels: ["Email", "Direct", "Paid Search"], aov: 136, ltv: 560, promo: 0.22, churn: 0.18, repeat: 0.5, cac: 58, share: 0.12, message: "The pieces you reach for daily.", action: "Replenishment + color refresh" },
  { name: "Wellness Socialite", emoji: "💬", description: "Events, community, matching sets, creator-responsive, high engagement.", activities: ["Yoga", "Run", "Recovery"], categories: ["Bottoms", "Tops", "Dresses"], products: ["Daily Legging", "Coastal Training Tank", "Villa Wideleg", "Halo Essential Hoodie"], colors: ["Heather Sage", "Clay", "Coastal Blue", "Oat"], channels: ["Influencer", "Paid Social", "SMS"], aov: 138, ltv: 460, promo: 0.4, churn: 0.3, repeat: 0.38, cac: 74, share: 0.08, message: "Show up. Move together.", action: "Community events + creator amplification" },
  { name: "Gift Giver", emoji: "🎁", description: "Seasonal spikes, high AOV, lower self-purchase signal.", activities: ["Lounge", "Travel"], categories: ["Layers", "Outerwear", "Accessories"], products: ["DreamKnit Layer", "Halo Essential Hoodie", "Canyon Insulated Jacket"], colors: ["Stone", "Sand", "Charcoal", "Clay"], channels: ["Paid Search", "Email", "Brand Campaigns"], aov: 168, ltv: 300, promo: 0.36, churn: 0.45, repeat: 0.22, cac: 80, share: 0.06, message: "The gift that gets worn all year.", action: "Gift guide + win-back flow" },
  { name: "Premium Basics Loyalist", emoji: "🔁", description: "High repeat, low promo sensitivity, replenishment potential.", activities: ["Training", "Commute", "Lounge"], categories: ["Tops", "Bottoms", "Layers"], products: ["Strato Tech Tee", "Daily Legging", "Halo Essential Hoodie", "Meta Pant"], colors: ["Black", "Stone", "Charcoal", "Oat"], channels: ["Email", "Direct", "SMS"], aov: 130, ltv: 620, promo: 0.18, churn: 0.15, repeat: 0.52, cac: 54, share: 0.09, message: "Your essentials, restocked.", action: "Replenishment + early access" },
  { name: "New Explorer", emoji: "🧭", description: "High browse activity, not enough signal yet — needs onboarding.", activities: ["Training", "Lounge"], categories: ["Tops", "Bottoms"], products: ["Kore Short", "Strato Tech Tee", "Daily Legging"], colors: ["Oat", "Stone", "Heather Sage"], channels: ["Paid Social", "Organic Search", "Paid Search"], aov: 108, ltv: 240, promo: 0.5, churn: 0.5, repeat: 0.18, cac: 86, share: 0.05, message: "Find your first favorite.", action: "Onboarding flow + first-purchase nudge" },
];

function buildPersonas(): Persona[] {
  return PERSONA_SEEDS.map((p, i) => {
    const marketIndex: Record<string, number> = {};
    const pr = new Rng("persona-" + p.name);
    MARKET_SEEDS.forEach((m) => {
      let idx = 100 + pr.normal(0, 8);
      const rank = m.topPersonas.indexOf(p.name);
      if (rank === 0) idx += 42;
      else if (rank === 1) idx += 26;
      else if (rank === 2) idx += 14;
      else idx -= 6;
      marketIndex[m.name] = round(clamp(idx, 60, 175), 0);
    });
    return {
      personaId: `P-${String(i + 1).padStart(2, "0")}`,
      personaName: p.name,
      description: p.description,
      primaryActivities: p.activities,
      preferredCategories: p.categories,
      preferredProducts: p.products,
      preferredColors: p.colors,
      preferredChannels: p.channels,
      avgAov: p.aov,
      predictedLtv: p.ltv,
      promoSensitivity: p.promo,
      churnRisk: p.churn,
      bestMessage: p.message,
      bestNextAction: p.action,
      marketIndex,
      share: p.share,
      cac: p.cac,
      repeatRate: p.repeat,
      emoji: p.emoji,
    } satisfies Persona;
  });
}
export const personas = buildPersonas();
export const personaNames = PERSONA_SEEDS.map((p) => p.name);

// Persona → color affinity matrix (0..100)
export const COLORS = [
  "Heather Sage", "Black", "Coastal Blue", "Clay", "Stone",
  "Dusty Olive", "Oat", "Storm", "Sand", "Charcoal",
];
export function personaColorMatrix(): { persona: PersonaName; values: Record<string, number> }[] {
  return PERSONA_SEEDS.map((p) => {
    const cr = new Rng("pcolor-" + p.name);
    const values: Record<string, number> = {};
    COLORS.forEach((c) => {
      const base = p.colors.includes(c) ? 78 : 28;
      values[c] = round(clamp(base + cr.normal(0, 12), 5, 98), 0);
    });
    return { persona: p.name, values };
  });
}

// Persona → product affinity matrix (0..100)
export function personaProductMatrix(productNames: string[]): {
  persona: PersonaName;
  values: Record<string, number>;
}[] {
  return PERSONA_SEEDS.map((p) => {
    const cr = new Rng("pprod-" + p.name);
    const values: Record<string, number> = {};
    productNames.forEach((n) => {
      const base = p.products.includes(n) ? 80 : 24;
      values[n] = round(clamp(base + cr.normal(0, 14), 4, 98), 0);
    });
    return { persona: p.name, values };
  });
}

// ───────────────────────────────────────────────────────────────────────────
// PRODUCTS
// ───────────────────────────────────────────────────────────────────────────
interface ProductSeed {
  name: string;
  category: Product["category"];
  line: Product["productLine"];
  gender: Product["gender"];
  color: string;
  role: Product["productRole"];
  price: number;
  marginRate: number;
  returnRate: number;
  personas: PersonaName[];
}
const PRODUCT_SEEDS: ProductSeed[] = [
  { name: "Sunday Performance Jogger", category: "Bottoms", line: "Performance", gender: "Unisex", color: "Heather Sage", role: "Hero", price: 98, marginRate: 0.62, returnRate: 0.08, personas: ["Modern Dad Uniform", "Trail & Recovery", "Performance Commuter"] },
  { name: "Kore Short", category: "Shorts", line: "Performance", gender: "Men", color: "Storm", role: "Driver", price: 68, marginRate: 0.6, returnRate: 0.07, personas: ["Coastal Active", "Modern Dad Uniform", "New Explorer"] },
  { name: "Meta Pant", category: "Bottoms", line: "Performance", gender: "Men", color: "Charcoal", role: "Hero", price: 128, marginRate: 0.64, returnRate: 0.09, personas: ["Performance Commuter", "Trail & Recovery", "Premium Basics Loyalist"] },
  { name: "Strato Tech Tee", category: "Tops", line: "Performance", gender: "Men", color: "Stone", role: "Driver", price: 54, marginRate: 0.58, returnRate: 0.06, personas: ["Performance Commuter", "Premium Basics Loyalist", "New Explorer"] },
  { name: "Villa Wideleg", category: "Bottoms", line: "Travel", gender: "Women", color: "Oat", role: "Hero", price: 118, marginRate: 0.63, returnRate: 0.13, personas: ["Travel Weekender", "Studio Minimalist", "Wellness Socialite"] },
  { name: "DreamKnit Layer", category: "Layers", line: "Essentials", gender: "Women", color: "Heather Sage", role: "Newness", price: 128, marginRate: 0.6, returnRate: 0.11, personas: ["Studio Minimalist", "Travel Weekender", "Gift Giver"] },
  { name: "Canyon Insulated Jacket", category: "Outerwear", line: "Trail", gender: "Unisex", color: "Dusty Olive", role: "Seasonal", price: 198, marginRate: 0.55, returnRate: 0.1, personas: ["Trail & Recovery", "Gift Giver"] },
  { name: "Daily Legging", category: "Bottoms", line: "Studio", gender: "Women", color: "Black", role: "Hero", price: 88, marginRate: 0.61, returnRate: 0.16, personas: ["Studio Minimalist", "Wellness Socialite", "Premium Basics Loyalist"] },
  { name: "Halo Essential Hoodie", category: "Layers", line: "Essentials", gender: "Unisex", color: "Stone", role: "Replenishment", price: 108, marginRate: 0.59, returnRate: 0.07, personas: ["Premium Basics Loyalist", "Travel Weekender", "Gift Giver"] },
  { name: "Transit Commuter Shirt", category: "Tops", line: "Travel", gender: "Men", color: "Storm", role: "Driver", price: 88, marginRate: 0.6, returnRate: 0.09, personas: ["Performance Commuter", "Travel Weekender"] },
  { name: "Coastal Training Tank", category: "Tops", line: "Coastal", gender: "Women", color: "Coastal Blue", role: "Driver", price: 52, marginRate: 0.57, returnRate: 0.08, personas: ["Coastal Active", "Wellness Socialite"] },
  { name: "Restore Half Zip", category: "Layers", line: "Trail", gender: "Unisex", color: "Clay", role: "Margin", price: 118, marginRate: 0.66, returnRate: 0.06, personas: ["Trail & Recovery", "Performance Commuter"] },
  { name: "Strato Tech Polo", category: "Tops", line: "Performance", gender: "Men", color: "Charcoal", role: "Driver", price: 78, marginRate: 0.61, returnRate: 0.07, personas: ["Performance Commuter", "Modern Dad Uniform"] },
  { name: "Cloudridge Lined Pant", category: "Bottoms", line: "Trail", gender: "Men", color: "Dusty Olive", role: "Seasonal", price: 138, marginRate: 0.58, returnRate: 0.12, personas: ["Trail & Recovery", "Modern Dad Uniform"] },
];

function buildProducts(): Product[] {
  const pr = new Rng("products");
  const sizes = ["XS", "S", "M", "L", "XL"];
  return PRODUCT_SEEDS.map((p, i) => {
    const cost = round(p.price * (1 - p.marginRate), 2);
    const unitsSold = Math.round(
      (p.role === "Hero" ? 42000 : p.role === "Driver" ? 26000 : 15000) *
        clamp(pr.normal(1, 0.15), 0.6, 1.5),
    );
    const revenue = Math.round(unitsSold * p.price * 0.92);
    const velocity = Math.round(unitsSold / 52);
    const sellThrough = round(clamp(0.55 + pr.normal(0, 0.14), 0.3, 0.95), 2);
    let recommendation: Product["recommendation"] = "Hold";
    if (sellThrough > 0.75 && p.returnRate < 0.1) recommendation = "Push";
    else if (p.role === "Replenishment" || p.role === "Margin") recommendation = "Replenish";
    else if (p.returnRate > 0.12) recommendation = "Protect";
    else if (["Villa Wideleg", "Canyon Insulated Jacket", "Coastal Training Tank"].includes(p.name)) recommendation = "Localize";
    return {
      productId: `SKU-${String(i + 1).padStart(3, "0")}`,
      productName: p.name,
      category: p.category,
      productLine: p.line,
      gender: p.gender,
      color: p.color,
      size: pr.pick(sizes),
      launchDate: dayOffset(-pr.int(60, 700)),
      price: p.price,
      cost,
      marginRate: p.marginRate,
      returnRate: p.returnRate,
      productRole: p.role,
      personaAffinity: p.personas,
      revenue,
      unitsSold,
      velocity,
      sellThrough,
      recommendation,
    } satisfies Product;
  });
}
export const products = buildProducts();
export const productNames = PRODUCT_SEEDS.map((p) => p.name);

// ───────────────────────────────────────────────────────────────────────────
// EVENTS
// ───────────────────────────────────────────────────────────────────────────
export const EVENT_TYPES: EventType[] = [
  "Run club event",
  "Yoga/pilates studio takeover",
  "Surf/coastal wellness activation",
  "Outdoor trail event",
  "Shopping pop-up",
  "Product launch preview",
  "Ambassador/community event",
  "Recovery studio partnership",
];

function buildEvents(): EventRow[] {
  const er = new Rng("events");
  const specs: { market: string; type: EventType; partner: string; days: number }[] = [
    { market: "Austin", type: "Run club event", partner: "Local run club + recovery studio", days: -42 },
    { market: "Denver", type: "Outdoor trail event", partner: "Trail collective", days: -120 },
    { market: "Miami", type: "Surf/coastal wellness activation", partner: "Beach wellness club", days: -180 },
    { market: "Boston", type: "Yoga/pilates studio takeover", partner: "Studio network", days: -90 },
    { market: "Nashville", type: "Ambassador/community event", partner: "Creator collective", days: -64 },
    { market: "Los Angeles", type: "Product launch preview", partner: "Flagship + creators", days: -150 },
    { market: "Salt Lake City", type: "Recovery studio partnership", partner: "Recovery + ski club", days: -210 },
    { market: "Seattle", type: "Shopping pop-up", partner: "Pop-up retail", days: -75 },
    { market: "San Diego", type: "Surf/coastal wellness activation", partner: "Surf collective", days: -240 },
    { market: "Chicago", type: "Run club event", partner: "Lakefront run club", days: -100 },
  ];
  return specs.map((s, i) => {
    const expectedAttendance = er.int(280, 900);
    const actualAttendance = Math.round(expectedAttendance * clamp(er.normal(0.96, 0.12), 0.7, 1.2));
    const aov = er.range(128, 168);
    const eventRevenue = Math.round(actualAttendance * er.range(0.55, 0.78) * aov);
    const leadsCaptured = Math.round(actualAttendance * er.range(2.6, 3.6));
    const cost = er.int(38000, 92000);
    const halo90 = Math.round(leadsCaptured * er.range(0.16, 0.24) * aov * er.range(3.4, 4.6));
    const projectedRoi = round((eventRevenue + halo90 - cost) / cost, 2);
    return {
      eventId: `EV-${String(i + 1).padStart(3, "0")}`,
      market: s.market,
      eventType: s.type,
      partnerType: s.partner,
      eventDate: dayOffset(s.days),
      cost,
      expectedAttendance,
      actualAttendance,
      leadsCaptured,
      eventRevenue,
      haloRevenue30d: Math.round(halo90 * 0.42),
      haloRevenue60d: Math.round(halo90 * 0.74),
      haloRevenue90d: halo90,
      newCustomers: Math.round(leadsCaptured * er.range(0.22, 0.32)),
      repeatCustomers: Math.round(leadsCaptured * er.range(0.08, 0.16)),
      projectedRoi,
      actualRoi: round(projectedRoi * clamp(er.normal(1, 0.1), 0.8, 1.2), 2),
      recommendedProducts: [er.pick(productNames), er.pick(productNames), er.pick(productNames)],
      recommendedLifecycleFlow: "Lead capture → welcome series → local event invite → first-purchase incentive",
    } satisfies EventRow;
  });
}
export const events = buildEvents();

// ───────────────────────────────────────────────────────────────────────────
// CHANNELS (marketing efficiency)
// ───────────────────────────────────────────────────────────────────────────
function buildChannels(): ChannelSummary[] {
  const cr = new Rng("channels");
  const specs: {
    channel: ChannelSummary["channel"];
    spend: number;
    roas: number;
    cac: number;
    newShare: number;
    quality: number;
    marginal: number;
  }[] = [
    { channel: "Paid Social", spend: 9_800_000, roas: 2.6, cac: 78, newShare: 0.71, quality: 64, marginal: 1.7 },
    { channel: "Paid Search", spend: 7_200_000, roas: 3.4, cac: 62, newShare: 0.46, quality: 72, marginal: 2.1 },
    { channel: "Brand Campaigns", spend: 3_400_000, roas: 1.8, cac: 96, newShare: 0.62, quality: 58, marginal: 1.2 },
    { channel: "Influencer", spend: 3_100_000, roas: 2.9, cac: 74, newShare: 0.68, quality: 66, marginal: 1.8 },
    { channel: "Affiliate", spend: 2_400_000, roas: 4.1, cac: 58, newShare: 0.4, quality: 70, marginal: 1.9 },
    { channel: "Email", spend: 980_000, roas: 11.5, cac: 22, newShare: 0.12, quality: 92, marginal: 4.2 },
    { channel: "SMS", spend: 620_000, roas: 13.2, cac: 18, newShare: 0.1, quality: 90, marginal: 4.6 },
    { channel: "Organic Search", spend: 1_350_000, roas: 8.4, cac: 30, newShare: 0.52, quality: 86, marginal: 3.1 },
    { channel: "Direct", spend: 540_000, roas: 16.0, cac: 14, newShare: 0.18, quality: 94, marginal: 5.0 },
    { channel: "Retail Halo", spend: 760_000, roas: 6.2, cac: 36, newShare: 0.44, quality: 82, marginal: 2.4 },
  ];
  return specs.map((s) => {
    const attributedRevenue = Math.round(s.spend * s.roas);
    const newCustomers = Math.round((attributedRevenue * s.newShare) / (s.cac * 2.4));
    const ltv = s.channel === "Email" || s.channel === "SMS" || s.channel === "Direct" ? 560 : 420;
    return {
      channel: s.channel,
      spend: s.spend,
      revenue: attributedRevenue,
      attributedRevenue,
      newCustomers,
      cac: s.cac,
      roas: s.roas,
      mer: round(attributedRevenue / s.spend, 2),
      ltvCacRatio: round(ltv / s.cac, 2),
      newCustomerShare: s.newShare,
      paybackMonths: round((s.cac / (ltv / 12)) * clamp(cr.normal(1, 0.05), 0.85, 1.2), 1),
      marginalRoas: s.marginal,
      qualityScore: s.quality,
    } satisfies ChannelSummary;
  });
}
export const channels = buildChannels();

// ───────────────────────────────────────────────────────────────────────────
// COHORTS (retention heatmap)
// ───────────────────────────────────────────────────────────────────────────
function buildCohorts(): CohortRow[] {
  const cr = new Rng("cohorts");
  const out: CohortRow[] = [];
  for (let m = 13; m >= 0; m--) {
    const ms = ANCHOR_MS - m * 30 * DAY_MS;
    const cohort = isoDate(ms).slice(0, 7);
    const size = Math.round(cr.range(5200, 9800));
    const months = m + 1;
    const retention: number[] = [];
    // Newer cohorts retain slightly better (improving lifecycle).
    const quality = 1 + (13 - m) * 0.012;
    for (let k = 0; k < months && k < 13; k++) {
      if (k === 0) retention.push(100);
      else {
        const base = 100 * Math.pow(0.78, k) * quality;
        retention.push(round(clamp(base + cr.normal(0, 2), 4, 100), 1));
      }
    }
    out.push({ cohort, size, retention });
  }
  return out;
}
export const cohorts = buildCohorts();

// ───────────────────────────────────────────────────────────────────────────
// FUNNEL
// ───────────────────────────────────────────────────────────────────────────
export const funnel: FunnelStage[] = (() => {
  const sessions = 4_820_000;
  const productViews = Math.round(sessions * 0.62);
  const addToCart = Math.round(productViews * 0.21);
  const checkoutStarts = Math.round(addToCart * 0.58);
  const orders = Math.round(checkoutStarts * 0.49);
  const stages = [
    { stage: "Sessions", value: sessions },
    { stage: "Product Views", value: productViews },
    { stage: "Add to Cart", value: addToCart },
    { stage: "Checkout Starts", value: checkoutStarts },
    { stage: "Orders", value: orders },
  ];
  return stages.map((s, i) => ({
    ...s,
    conversionFromPrev: i === 0 ? 100 : round((s.value / stages[i - 1].value) * 100, 1),
  }));
})();

export const deviceFunnel = [
  { device: "Mobile", sessions: 62, conversionRate: 2.4, addToCart: 18, checkout: 9.1 },
  { device: "Desktop", sessions: 31, conversionRate: 3.9, addToCart: 24, checkout: 13.2 },
  { device: "Tablet", sessions: 7, conversionRate: 3.1, addToCart: 21, checkout: 11.0 },
];

export interface FunnelOpportunity {
  opportunity: string;
  estimatedImpact: string;
  monthlyImpact: number;
  confidence: "High" | "Medium" | "Low";
  owner: string;
  stage: string;
}
export const funnelOpportunities: FunnelOpportunity[] = [
  { opportunity: "Improve mobile PDP image load time", estimatedImpact: "$680K / mo", monthlyImpact: 680000, confidence: "High", owner: "Ecommerce Tech", stage: "Product Views → Add to Cart" },
  { opportunity: "Add size guidance to high-return leggings", estimatedImpact: "$310K / mo", monthlyImpact: 310000, confidence: "Medium", owner: "Product / UX", stage: "Add to Cart → Checkout" },
  { opportunity: "Promote best-selling colorways sooner", estimatedImpact: "$220K / mo", monthlyImpact: 220000, confidence: "High", owner: "Merchandising", stage: "Product Views" },
  { opportunity: "Streamline guest checkout on mobile", estimatedImpact: "$540K / mo", monthlyImpact: 540000, confidence: "High", owner: "Ecommerce Tech", stage: "Checkout → Orders" },
  { opportunity: "Persona-based homepage modules", estimatedImpact: "$350K / mo", monthlyImpact: 350000, confidence: "Medium", owner: "Growth / Analytics", stage: "Sessions → Product Views" },
  { opportunity: "Cart recovery SMS within 30 min", estimatedImpact: "$190K / mo", monthlyImpact: 190000, confidence: "High", owner: "Lifecycle CRM", stage: "Add to Cart → Checkout" },
];

export const siteSearchTerms = [
  { term: "joggers", volume: 38400, ctr: 0.42, conversion: 0.061, trend: 12 },
  { term: "wide leg pant", volume: 29100, ctr: 0.38, conversion: 0.054, trend: 28 },
  { term: "dreamknit", volume: 24800, ctr: 0.51, conversion: 0.072, trend: 41 },
  { term: "leggings", volume: 22600, ctr: 0.44, conversion: 0.058, trend: 6 },
  { term: "men's shorts", volume: 19300, ctr: 0.4, conversion: 0.05, trend: 9 },
  { term: "travel pant", volume: 16200, ctr: 0.36, conversion: 0.047, trend: 19 },
  { term: "half zip", volume: 13900, ctr: 0.39, conversion: 0.052, trend: 15 },
  { term: "insulated jacket", volume: 11700, ctr: 0.34, conversion: 0.044, trend: -3 },
];

// ───────────────────────────────────────────────────────────────────────────
// INVENTORY RISK
// ───────────────────────────────────────────────────────────────────────────
function buildInventory(): InventoryRow[] {
  const ir = new Rng("inventory");
  const rows: InventoryRow[] = [];
  const specs: { product: string; market: string; size: string; risk: "High" | "Medium" | "Low" }[] = [
    { product: "Meta Pant", market: "New York", size: "M", risk: "High" },
    { product: "Meta Pant", market: "Boston", size: "L", risk: "High" },
    { product: "Daily Legging", market: "Los Angeles", size: "S", risk: "High" },
    { product: "Daily Legging", market: "Austin", size: "XS", risk: "Medium" },
    { product: "Canyon Insulated Jacket", market: "Denver", size: "L", risk: "High" },
    { product: "Sunday Performance Jogger", market: "Chicago", size: "M", risk: "Medium" },
    { product: "Villa Wideleg", market: "Miami", size: "S", risk: "Medium" },
    { product: "Halo Essential Hoodie", market: "Seattle", size: "L", risk: "Low" },
    { product: "Restore Half Zip", market: "Salt Lake City", size: "M", risk: "Medium" },
    { product: "Strato Tech Tee", market: "San Francisco", size: "M", risk: "Low" },
    { product: "Cloudridge Lined Pant", market: "Denver", size: "L", risk: "High" },
    { product: "Coastal Training Tank", market: "San Diego", size: "S", risk: "Medium" },
  ];
  specs.forEach((s, i) => {
    const prod = products.find((p) => p.productName === s.product)!;
    const daysOfCover = s.risk === "High" ? ir.int(3, 9) : s.risk === "Medium" ? ir.int(10, 20) : ir.int(28, 60);
    const sizeAvail = s.risk === "High" ? ir.range(0.32, 0.55) : s.risk === "Medium" ? ir.range(0.6, 0.8) : ir.range(0.85, 0.98);
    const lost = s.risk === "High" ? ir.int(120000, 320000) : s.risk === "Medium" ? ir.int(40000, 110000) : ir.int(5000, 30000);
    rows.push({
      date: dayOffset(0),
      productId: prod.productId,
      productName: s.product,
      market: s.market,
      size: s.size,
      inventoryUnits: ir.int(40, 1200),
      daysOfCover,
      stockoutFlag: s.risk === "High",
      sizeAvailabilityRate: round(sizeAvail, 2),
      lostRevenueEstimate: lost,
      riskLevel: s.risk,
    });
    void i;
  });
  return rows.sort((a, b) => b.lostRevenueEstimate - a.lostRevenueEstimate);
}
export const inventoryRisk = buildInventory();

// ───────────────────────────────────────────────────────────────────────────
// EXTERNAL TRENDS + COMPETITOR SHARE OF VOICE
// ───────────────────────────────────────────────────────────────────────────
const TREND_SOURCES: TrendSource[] = [
  "Search", "TikTok", "Instagram", "YouTube", "Reddit / forums",
  "Editorial / affiliate", "Retail partner visibility",
];
const COMPETITORS: Competitor[] = [
  "Lululemon", "Alo Yoga", "Rhone", "Outdoor Voices", "Nike",
  "On", "Tracksmith", "Athleta", "Fabletics",
];

function buildExternalTrends(): ExternalTrendRow[] {
  const tr = new Rng("exttrends");
  const topics = [
    { topic: "Layering & comfort", keyword: "DreamKnit Layer", persona: "Travel Weekender" as PersonaName, markets: ["Denver", "Boston", "Chicago", "Seattle"] },
    { topic: "Run club culture", keyword: "Sunday Performance Jogger", persona: "Performance Commuter" as PersonaName, markets: ["Austin", "New York", "Chicago"] },
    { topic: "Wide-leg silhouettes", keyword: "Villa Wideleg", persona: "Studio Minimalist" as PersonaName, markets: ["Los Angeles", "Miami", "Austin"] },
    { topic: "Recovery & wellness", keyword: "Restore Half Zip", persona: "Trail & Recovery" as PersonaName, markets: ["Salt Lake City", "Denver", "Austin"] },
    { topic: "Coastal warm-weather", keyword: "Coastal Training Tank", persona: "Coastal Active" as PersonaName, markets: ["Miami", "San Diego", "Phoenix"] },
    { topic: "Commuter tech apparel", keyword: "Meta Pant", persona: "Performance Commuter" as PersonaName, markets: ["New York", "Boston", "San Francisco"] },
  ];
  const out: ExternalTrendRow[] = [];
  topics.forEach((t) => {
    t.markets.forEach((mk) => {
      const source = tr.pick(TREND_SOURCES);
      out.push({
        date: dayOffset(-tr.int(2, 30)),
        source,
        market: mk,
        topic: t.topic,
        productKeyword: t.keyword,
        mentionVolume: tr.int(4200, 38000),
        sentimentScore: round(tr.range(0.25, 0.78), 2),
        trendVelocity: round(tr.range(8, 64), 1),
        competitor: tr.chance(0.3) ? tr.pick(COMPETITORS) : "Vuori",
        shareOfVoice: round(tr.range(0.06, 0.34), 3),
        relatedPersona: t.persona,
        recommendedAction: `Localized ${source === "Search" ? "paid search" : "paid social"} + lifecycle around "${t.topic.toLowerCase()}"`,
      });
    });
  });
  return out.sort((a, b) => b.trendVelocity - a.trendVelocity);
}
export const externalTrends = buildExternalTrends();

export interface ShareOfVoiceRow {
  brand: Competitor | "Vuori";
  shareOfVoice: number; // %
  velocity: number; // % change
  sentiment: number;
}
export const shareOfVoice: ShareOfVoiceRow[] = (() => {
  const sr = new Rng("sov");
  const brands: (Competitor | "Vuori")[] = ["Lululemon", "Vuori", "Alo Yoga", "Nike", "On", "Athleta", "Rhone", "Outdoor Voices", "Fabletics", "Tracksmith"];
  const raw = brands.map((b) => ({ brand: b, w: b === "Lululemon" ? 26 : b === "Vuori" ? 17 : b === "Nike" ? 15 : sr.range(4, 12) }));
  const total = raw.reduce((s, r) => s + r.w, 0);
  return raw
    .map((r) => ({
      brand: r.brand,
      shareOfVoice: round((r.w / total) * 100, 1),
      velocity: round(r.brand === "Vuori" ? sr.range(14, 22) : sr.range(-6, 12), 1),
      sentiment: round(sr.range(0.3, 0.72), 2),
    }))
    .sort((a, b) => b.shareOfVoice - a.shareOfVoice);
})();

export const topicClusters = [
  { cluster: "Comfort & layering", volume: 142000, velocity: 38, sentiment: 0.62, persona: "Travel Weekender" },
  { cluster: "Run club & community", volume: 98000, velocity: 52, sentiment: 0.7, persona: "Wellness Socialite" },
  { cluster: "Recovery & wellness", volume: 76000, velocity: 44, sentiment: 0.66, persona: "Trail & Recovery" },
  { cluster: "Wide-leg & studio", volume: 64000, velocity: 29, sentiment: 0.58, persona: "Studio Minimalist" },
  { cluster: "Travel & airport", volume: 58000, velocity: 24, sentiment: 0.6, persona: "Travel Weekender" },
  { cluster: "Coastal & warm-weather", volume: 47000, velocity: 33, sentiment: 0.64, persona: "Coastal Active" },
];

// ───────────────────────────────────────────────────────────────────────────
// VISITOR SIGNALS
// ───────────────────────────────────────────────────────────────────────────
function buildVisitors(): VisitorSignal[] {
  const vr = new Rng("visitors");
  const specs: {
    market: string;
    device: VisitorSignal["device"];
    channel: VisitorSignal["acquisitionChannel"];
    landing: string;
    cats: VisitorSignal["viewedCategories"];
    products: string[];
    colors: string[];
    probs: { persona: PersonaName; probability: number }[];
    ltv: number;
    action: string;
    message: string;
    carousel: string[];
  }[] = [
    {
      market: "Austin", device: "Mobile", channel: "Paid Social", landing: "/collections/womens-bottoms",
      cats: ["Bottoms", "Tops"], products: ["Villa Wideleg", "Daily Legging"], colors: ["Oat", "Heather Sage"],
      probs: [
        { persona: "Studio Minimalist", probability: 42 },
        { persona: "Travel Weekender", probability: 31 },
        { persona: "Premium Basics Loyalist", probability: 18 },
        { persona: "Gift Giver", probability: 9 },
      ],
      ltv: 286, action: "Homepage module: soft performance layers for movement and travel",
      message: "Built to move. Styled for every day.",
      carousel: ["Villa Wideleg", "Daily Legging", "Halo Essential Hoodie"],
    },
    {
      market: "Denver", device: "Desktop", channel: "Paid Search", landing: "/collections/mens-outerwear",
      cats: ["Outerwear", "Layers"], products: ["Canyon Insulated Jacket", "Restore Half Zip"], colors: ["Dusty Olive", "Storm"],
      probs: [
        { persona: "Trail & Recovery", probability: 54 },
        { persona: "Performance Commuter", probability: 24 },
        { persona: "Modern Dad Uniform", probability: 14 },
        { persona: "Gift Giver", probability: 8 },
      ],
      ltv: 342, action: "Surface layering & recovery bundle with cold-weather creative",
      message: "Built for the climb and the recovery.",
      carousel: ["Canyon Insulated Jacket", "Restore Half Zip", "Sunday Performance Jogger"],
    },
    {
      market: "Miami", device: "Mobile", channel: "Influencer", landing: "/collections/womens-tops",
      cats: ["Tops", "Shorts"], products: ["Coastal Training Tank", "Kore Short"], colors: ["Coastal Blue", "Sand"],
      probs: [
        { persona: "Coastal Active", probability: 48 },
        { persona: "Wellness Socialite", probability: 27 },
        { persona: "Travel Weekender", probability: 16 },
        { persona: "New Explorer", probability: 9 },
      ],
      ltv: 248, action: "Warm-weather capsule carousel + local creator content",
      message: "Made for sun, salt, and motion.",
      carousel: ["Coastal Training Tank", "Villa Wideleg", "Kore Short"],
    },
    {
      market: "Boston", device: "Desktop", channel: "Email", landing: "/products/meta-pant",
      cats: ["Bottoms", "Tops"], products: ["Meta Pant", "Transit Commuter Shirt"], colors: ["Charcoal", "Storm"],
      probs: [
        { persona: "Performance Commuter", probability: 51 },
        { persona: "Premium Basics Loyalist", probability: 28 },
        { persona: "Modern Dad Uniform", probability: 13 },
        { persona: "Trail & Recovery", probability: 8 },
      ],
      ltv: 398, action: "Commuter/workwear creative + replenishment reminder",
      message: "From the commute to the meeting.",
      carousel: ["Meta Pant", "Transit Commuter Shirt", "Restore Half Zip"],
    },
    {
      market: "New York", device: "Mobile", channel: "Organic Search", landing: "/products/daily-legging",
      cats: ["Bottoms"], products: ["Daily Legging"], colors: ["Black"],
      probs: [
        { persona: "Wellness Socialite", probability: 39 },
        { persona: "Studio Minimalist", probability: 33 },
        { persona: "New Explorer", probability: 18 },
        { persona: "Premium Basics Loyalist", probability: 10 },
      ],
      ltv: 264, action: "Studio set bundle + event invite for NYC community",
      message: "Show up. Move together.",
      carousel: ["Daily Legging", "Coastal Training Tank", "DreamKnit Layer"],
    },
    {
      market: "Seattle", device: "Tablet", channel: "Paid Social", landing: "/collections/layers",
      cats: ["Layers", "Outerwear"], products: ["Halo Essential Hoodie", "Restore Half Zip"], colors: ["Stone", "Clay"],
      probs: [
        { persona: "Trail & Recovery", probability: 36 },
        { persona: "Travel Weekender", probability: 29 },
        { persona: "Premium Basics Loyalist", probability: 22 },
        { persona: "Gift Giver", probability: 13 },
      ],
      ltv: 312, action: "Layering essentials carousel + cold-weather lifecycle",
      message: "The layers you live in.",
      carousel: ["Halo Essential Hoodie", "Restore Half Zip", "DreamKnit Layer"],
    },
  ];
  return specs.map((s, i) => ({
    visitorId: `VIS-${String(i + 1).padStart(4, "0")}`,
    sessionId: `SES-${vr.int(100000, 999999)}`,
    market: s.market,
    device: s.device,
    acquisitionChannel: s.channel,
    landingPage: s.landing,
    viewedCategories: s.cats,
    viewedProducts: s.products,
    viewedColors: s.colors,
    sizeGuideUsed: vr.chance(0.4),
    wishlistAdds: vr.int(0, 4),
    cartAdds: vr.int(0, 3),
    searchTerms: [],
    emailClicks: vr.int(0, 3),
    smsClicks: vr.int(0, 2),
    eventRsvp: s.market === "Austin",
    predictedPersona: s.probs[0].persona,
    personaConfidence: s.probs[0].probability,
    personaProbabilities: s.probs,
    predictedLtv: s.ltv,
    recommendedAction: s.action,
    recommendedMessage: s.message,
    recommendedProductCarousel: s.carousel,
  }));
}
export const visitorSignals = buildVisitors();

// ───────────────────────────────────────────────────────────────────────────
// AI USE CASES
// ───────────────────────────────────────────────────────────────────────────
export const AI_PRIORITY_WEIGHTS = {
  businessImpact: 0.35,
  dataReadiness: 0.25,
  confidence: 0.2,
  timeToValue: 0.1,
  feasibility: 0.1,
} as const;

function tvScore(months: number): number {
  return clamp(100 - (months - 1) * 12, 10, 100);
}
function feasScore(complexity: number): number {
  return clamp(100 - complexity, 0, 100);
}

function buildUseCases(): AiUseCase[] {
  interface Seed {
    name: string;
    domain: string;
    q: string;
    impact: number;
    impactLabel: string;
    data: number;
    complexity: number;
    ttv: number;
    confidence: number;
    bizImpact: number;
    owner: string;
    status: AiUseCase["status"];
    requiredData: string[];
    model: string;
    activation: string;
    measure: string;
    governance: string;
  }
  const seeds: Seed[] = [
    { name: "Persona-based homepage personalization", domain: "Onsite / Growth", q: "What should each visitor see first?", impact: 4_200_000, impactLabel: "+$4.2M revenue", data: 84, complexity: 42, ttv: 3, confidence: 82, bizImpact: 90, owner: "Growth / Analytics", status: "POC Candidate", requiredData: ["Visitor signals", "Persona model", "Product catalog"], model: "Gradient-boosted persona classifier + rules engine", activation: "Onsite CMS modules + product carousels", measure: "A/B test: conversion, AOV, RPV vs control", governance: "No PII to model; human-approved module copy" },
    { name: "Market opportunity scoring", domain: "Strategy / Expansion", q: "Where should Vuori localize next?", impact: 3_100_000, impactLabel: "+$3.1M revenue", data: 88, complexity: 36, ttv: 2, confidence: 86, bizImpact: 86, owner: "Ecommerce Analytics", status: "Ready to Scale", requiredData: ["Market signals", "External demand", "Persona fit"], model: "Weighted composite score + trend detection", activation: "Quarterly localization planning", measure: "Backtest vs realized market growth", governance: "Transparent weights; documented methodology" },
    { name: "Event ROI prediction", domain: "Retail / Community", q: "Which activation creates the strongest halo?", impact: 1_900_000, impactLabel: "+$1.9M revenue", data: 72, complexity: 48, ttv: 3, confidence: 80, bizImpact: 78, owner: "Retail / Growth", status: "In Test", requiredData: ["Event history", "Lead capture", "Halo attribution"], model: "Regression on attendance, leads, follow-up intensity", activation: "Pre-event budget & partner selection", measure: "Predicted vs actual 90-day halo", governance: "Matched-control test before scaling" },
    { name: "LTV-based paid media bidding", domain: "Marketing", q: "How do we bid to predicted lifetime value?", impact: 2_600_000, impactLabel: "-11% CAC", data: 78, complexity: 58, ttv: 4, confidence: 76, bizImpact: 84, owner: "Performance Marketing", status: "POC Candidate", requiredData: ["LTV model", "Ad platform APIs", "First-party signals"], model: "Predicted LTV → value-based bidding", activation: "Bid strategies in ad platforms", measure: "Geo holdout: CAC, blended ROAS, LTV:CAC", governance: "Privacy-safe audiences; human budget caps" },
    { name: "Churn-risk lifecycle flow", domain: "Retention / CRM", q: "Who is about to lapse, and what re-engages them?", impact: 1_700_000, impactLabel: "+8% repeat revenue", data: 80, complexity: 40, ttv: 3, confidence: 79, bizImpact: 76, owner: "Lifecycle CRM", status: "POC Candidate", requiredData: ["Order history", "Engagement signals", "Persona"], model: "Survival/churn classifier + next-best-action", activation: "Triggered email/SMS journeys", measure: "Holdout: repeat rate, reactivation, revenue", governance: "Frequency caps; human-approved offers" },
    { name: "Inventory stockout revenue risk", domain: "Merchandising / Ops", q: "Where will we lose revenue to stockouts?", impact: 2_100_000, impactLabel: "+$2.1M recovered", data: 82, complexity: 44, ttv: 2, confidence: 88, bizImpact: 80, owner: "Merch Planning", status: "Ready to Scale", requiredData: ["Inventory feed", "Demand forecast", "Size curves"], model: "Demand vs cover + lost-sales estimation", activation: "Replenishment & allocation alerts", measure: "Recovered revenue vs baseline stockouts", governance: "Ops review before auto-allocation" },
    { name: "Product launch early-read model", domain: "Merchandising", q: "Will this launch beat or miss plan?", impact: 1_400_000, impactLabel: "+15% forecast accuracy", data: 70, complexity: 52, ttv: 3, confidence: 81, bizImpact: 74, owner: "Merch Analytics", status: "In Test", requiredData: ["Early sell-through", "Traffic", "Comparable launches"], model: "Bayesian early-read vs comparable curves", activation: "Buy adjustments & marketing weighting", measure: "Early-read vs final outcome error", governance: "Human sign-off on buy changes" },
    { name: "Visitor persona prediction", domain: "Onsite / Data Science", q: "Which persona is this anonymous visitor?", impact: 1_500_000, impactLabel: "+$1.5M revenue", data: 76, complexity: 50, ttv: 3, confidence: 78, bizImpact: 75, owner: "Data Science", status: "POC Candidate", requiredData: ["Clickstream", "Catalog taxonomy", "Labeled cohorts"], model: "Sequence classifier on session behavior", activation: "Feeds personalization & messaging", measure: "Persona precision vs post-hoc labels", governance: "No PII; explainable feature set" },
    { name: "Size availability optimization", domain: "Merchandising / Ops", q: "Which size breaks are capping revenue?", impact: 1_800_000, impactLabel: "+$1.8M recovered", data: 84, complexity: 38, ttv: 2, confidence: 85, bizImpact: 77, owner: "Merch Planning", status: "Ready to Scale", requiredData: ["Size-level inventory", "Demand by size", "Returns"], model: "Size-curve gap detection + lost-sales", activation: "Size buy & allocation guidance", measure: "Availability rate & recovered revenue", governance: "Planner review of recommendations" },
    { name: "Return-risk prediction by style/fit", domain: "Product / Ops", q: "Which styles drive costly returns?", impact: 1_100_000, impactLabel: "-9% return cost", data: 68, complexity: 46, ttv: 4, confidence: 73, bizImpact: 68, owner: "Product / Data Science", status: "Discovery", requiredData: ["Return reasons", "Fit data", "Reviews"], model: "Return classifier by style/fit/size", activation: "PDP fit guidance & size tools", measure: "Return rate vs control styles", governance: "Bias review on fit guidance" },
    { name: "Next-best-action engine", domain: "Growth / CRM", q: "What is the single best next action per customer?", impact: 2_300_000, impactLabel: "+$2.3M revenue", data: 66, complexity: 64, ttv: 5, confidence: 71, bizImpact: 82, owner: "Data Science / Growth", status: "Discovery", requiredData: ["Unified profile", "Action catalog", "Outcome labels"], model: "Contextual bandit / uplift modeling", activation: "Orchestrated across email/SMS/onsite", measure: "Uplift vs rules-based baseline", governance: "Human-approved action library; caps" },
    { name: "Product demand forecasting", domain: "Planning", q: "How much will we sell, by week and market?", impact: 2_000_000, impactLabel: "+12% accuracy", data: 86, complexity: 54, ttv: 4, confidence: 83, bizImpact: 79, owner: "Demand Planning", status: "In Test", requiredData: ["Sales history", "Seasonality", "Promo calendar"], model: "Hierarchical time-series + external regressors", activation: "Buy plans & inventory allocation", measure: "MAPE vs current planning baseline", governance: "Planner-in-the-loop overrides" },
    { name: "Multi-touch attribution", domain: "Marketing Analytics", q: "What is each touchpoint really worth?", impact: 1_600_000, impactLabel: "Reallocation clarity", data: 64, complexity: 60, ttv: 5, confidence: 70, bizImpact: 72, owner: "Marketing Analytics", status: "Discovery", requiredData: ["Touchpoint logs", "Conversions", "Holdouts"], model: "Markov / Shapley + incrementality tests", activation: "Budget reallocation decisions", measure: "Validated against geo holdouts", governance: "Triangulate with experiments" },
    { name: "Media mix modeling", domain: "Marketing Analytics", q: "How should total budget split across channels?", impact: 2_400_000, impactLabel: "Budget efficiency", data: 70, complexity: 62, ttv: 5, confidence: 72, bizImpact: 80, owner: "Marketing Analytics", status: "POC Candidate", requiredData: ["Spend by channel", "Revenue", "External factors"], model: "Bayesian MMM with adstock & saturation", activation: "Quarterly budget planning", measure: "Out-of-sample fit + lift tests", governance: "Documented priors; experiment validation" },
    { name: "Localized creative recommendation engine", domain: "Creative / Growth", q: "Which message and product resonate by market?", impact: 1_300_000, impactLabel: "+$1.3M revenue", data: 62, complexity: 56, ttv: 4, confidence: 74, bizImpact: 70, owner: "Creative / Analytics", status: "Discovery", requiredData: ["Market signals", "Creative performance", "Persona mix"], model: "Market-persona affinity → creative ranking", activation: "Localized paid social & onsite", measure: "Creative lift by market vs default", governance: "Human creative approval" },
    { name: "AI-generated executive insight summaries", domain: "Analytics Enablement", q: "Can we draft trustworthy executive readouts faster?", impact: 600_000, impactLabel: "Analyst time saved", data: 90, complexity: 34, ttv: 1, confidence: 84, bizImpact: 58, owner: "Ecommerce Analytics", status: "POC Candidate", requiredData: ["Curated metrics", "Definitions", "Templates"], model: "LLM over governed metrics with citations", activation: "Drafts for human review in Executive Brief", measure: "Editor acceptance rate & time saved", governance: "Human-approved; cite every figure" },
    { name: "Experiment prioritization engine", domain: "Analytics Enablement", q: "Which tests should we run first?", impact: 900_000, impactLabel: "Test throughput", data: 78, complexity: 40, ttv: 2, confidence: 80, bizImpact: 64, owner: "Experimentation", status: "POC Candidate", requiredData: ["Idea backlog", "Impact estimates", "Effort"], model: "Expected-value ranking with uncertainty", activation: "Experiment roadmap & resourcing", measure: "Win rate & velocity vs baseline", governance: "Transparent scoring inputs" },
  ];

  return seeds.map((s, i) => {
    const priorityScore = round(
      s.bizImpact * AI_PRIORITY_WEIGHTS.businessImpact +
        s.data * AI_PRIORITY_WEIGHTS.dataReadiness +
        s.confidence * AI_PRIORITY_WEIGHTS.confidence +
        tvScore(s.ttv) * AI_PRIORITY_WEIGHTS.timeToValue +
        feasScore(s.complexity) * AI_PRIORITY_WEIGHTS.feasibility,
      0,
    );
    return {
      useCaseId: `AI-${String(i + 1).padStart(2, "0")}`,
      name: s.name,
      businessDomain: s.domain,
      businessQuestion: s.q,
      estimatedAnnualImpact: s.impact,
      estimatedAnnualImpactLabel: s.impactLabel,
      dataReadiness: s.data,
      technicalComplexity: s.complexity,
      timeToValue: s.ttv,
      confidence: s.confidence,
      owner: s.owner,
      status: s.status,
      requiredData: s.requiredData,
      modelApproach: s.model,
      activationPath: s.activation,
      measurementPlan: s.measure,
      governanceNotes: s.governance,
      businessImpactScore: s.bizImpact,
      feasibilityScore: feasScore(s.complexity),
      priorityScore,
    } satisfies AiUseCase;
  }).sort((a, b) => b.priorityScore - a.priorityScore);
}
export const aiUseCases = buildUseCases();

// ───────────────────────────────────────────────────────────────────────────
// GROWTH INITIATIVES (Growth Impact Lab)
// ───────────────────────────────────────────────────────────────────────────
export const growthInitiatives: GrowthInitiative[] = [
  { id: "GI-1", name: "Persona-based homepage personalization", description: "Match onsite modules and carousels to predicted persona.", revenueImpact: 4_200_000, grossProfitImpact: 2_520_000, cacReduction: 0, ltvLift: 6, conversionLift: 9, retentionLift: 4, inventoryRiskReduction: 0, confidence: 82, owner: "Growth / Analytics", testDesign: "Sitewide A/B vs control; measure RPV, AOV, conversion.", timeToValue: "1 quarter", stage: "Next", status: "Ready for POC" },
  { id: "GI-2", name: "LTV-based paid media bidding", description: "Bid to predicted lifetime value instead of last-click ROAS.", revenueImpact: 2_600_000, grossProfitImpact: 1_560_000, cacReduction: 11, ltvLift: 7, conversionLift: 0, retentionLift: 3, inventoryRiskReduction: 0, confidence: 76, owner: "Performance Marketing", testDesign: "Geo holdout; measure CAC, blended ROAS, LTV:CAC.", timeToValue: "1–2 quarters", stage: "Next", status: "Needs Test" },
  { id: "GI-3", name: "Austin localized activation", description: "Run club + recovery studio event with localized lifecycle.", revenueImpact: 740_000, grossProfitImpact: 444_000, cacReduction: 6, ltvLift: 4, conversionLift: 5, retentionLift: 6, inventoryRiskReduction: 0, confidence: 84, owner: "Retail / Growth", testDesign: "Austin vs matched control; 90-day halo + CAC.", timeToValue: "1 quarter", stage: "Now", status: "Human Approval Required" },
  { id: "GI-4", name: "Churn-risk lifecycle flow", description: "Trigger journeys for at-risk customers before they lapse.", revenueImpact: 1_700_000, grossProfitImpact: 1_088_000, cacReduction: 0, ltvLift: 5, conversionLift: 0, retentionLift: 8, inventoryRiskReduction: 0, confidence: 79, owner: "Lifecycle CRM", testDesign: "Holdout cohort; repeat rate & reactivation.", timeToValue: "1 quarter", stage: "Now", status: "Ready for POC" },
  { id: "GI-5", name: "Size availability optimization", description: "Close size-break gaps capping revenue in key styles.", revenueImpact: 2_100_000, grossProfitImpact: 1_323_000, cacReduction: 0, ltvLift: 0, conversionLift: 3, retentionLift: 0, inventoryRiskReduction: 2_100_000, confidence: 88, owner: "Merch Planning", testDesign: "Treated styles vs control; availability & recovered revenue.", timeToValue: "Now", stage: "Now", status: "Data Ready" },
  { id: "GI-6", name: "Product launch early-read model", description: "Predict launch outcomes from early sell-through signals.", revenueImpact: 1_400_000, grossProfitImpact: 840_000, cacReduction: 0, ltvLift: 0, conversionLift: 0, retentionLift: 0, inventoryRiskReduction: 900_000, confidence: 81, owner: "Merch Analytics", testDesign: "Backtest early-read vs final; forward validation.", timeToValue: "1–2 quarters", stage: "Next", status: "Needs Test" },
  { id: "GI-7", name: "Market opportunity scoring", description: "Standing model to rank localization opportunities.", revenueImpact: 3_100_000, grossProfitImpact: 1_860_000, cacReduction: 4, ltvLift: 3, conversionLift: 0, retentionLift: 0, inventoryRiskReduction: 0, confidence: 86, owner: "Ecommerce Analytics", testDesign: "Backtest vs realized growth; quarterly refresh.", timeToValue: "Now", stage: "Now", status: "High Confidence" },
  { id: "GI-8", name: "Next-best-action orchestration", description: "Unify onsite, email, and SMS into one decisioning layer.", revenueImpact: 2_300_000, grossProfitImpact: 1_380_000, cacReduction: 0, ltvLift: 6, conversionLift: 4, retentionLift: 5, inventoryRiskReduction: 0, confidence: 71, owner: "Data Science / Growth", testDesign: "Uplift test vs rules baseline across channels.", timeToValue: "2–3 quarters", stage: "Later", status: "Needs Test" },
];

// ───────────────────────────────────────────────────────────────────────────
// RECOMMENDATIONS (cross-module registry)
// ───────────────────────────────────────────────────────────────────────────
export const recommendations: Recommendation[] = [
  {
    recommendationId: "REC-001",
    date: dayOffset(-3),
    module: "Market Opportunity",
    title: "Activate Austin as next localized growth market",
    businessQuestion: "Where should Vuori localize investment next?",
    recommendation: "Launch a 3-day Austin run club + recovery studio activation with localized paid social, onsite personalization, and post-event email/SMS lifecycle flows.",
    expectedImpact: "$180K event-period revenue · $560K 90-day halo · 2,900 leads · 3.7x ROI",
    confidenceScore: 84,
    evidence: [
      "Austin ranks #1 in market opportunity score (91)",
      "Ecommerce traffic +33% YoY; repeat rate 14% above average",
      "Wellness & run-club density over-index",
      "Search/social demand rising faster than revenue capture",
    ],
    sourceSignals: ["Market signals", "External demand radar", "Persona fit", "Event history"],
    humanApprovalRequired: true,
    testDesign: "Austin vs matched control markets. Measure lead capture, new-customer CAC, conversion lift, repeat purchase rate, and 90-day ecommerce halo.",
    owner: "Retail / Growth",
    timeToValue: "1 quarter",
    status: "Human Approval Required",
    activationPath: ["Approve test budget", "Shortlist local partners", "Set assortment", "Activate CRM + paid media"],
  },
  {
    recommendationId: "REC-002",
    date: dayOffset(-6),
    module: "Merchandising",
    title: "Localize Villa Wideleg in warm-weather markets",
    businessQuestion: "Which products should Vuori push or localize?",
    recommendation: "Feature Villa Wideleg in localized creative and capsule bundles for Miami, San Diego, and Austin where Travel Weekender and Studio Minimalist personas over-index.",
    expectedImpact: "+$420K incremental 90-day revenue",
    confidenceScore: 77,
    evidence: ["High engagement in resort/warm markets", "Strong persona affinity", "Rising search velocity (+28%)"],
    sourceSignals: ["Product affinity", "Persona index", "Site search"],
    humanApprovalRequired: false,
    testDesign: "Localized creative test vs default in matched markets; measure PDP conversion and attach rate.",
    owner: "Merchandising",
    timeToValue: "6 weeks",
    status: "Opportunity",
    activationPath: ["Build capsule", "Localized creative", "Onsite merchandising"],
  },
  {
    recommendationId: "REC-003",
    date: dayOffset(-8),
    module: "Marketing Efficiency",
    title: "Shift branded search budget to prospecting social",
    businessQuestion: "Which channels drive profitable new-customer growth?",
    recommendation: "Reallocate $250K from branded search to prospecting paid social to expand incremental new-customer acquisition.",
    expectedImpact: "-$120K short-term revenue · +14K new customers · +$1.8M 12-month LTV",
    confidenceScore: 73,
    evidence: ["Branded search near saturation (marginal ROAS 2.1)", "Prospecting social adds incremental new customers", "LTV:CAC supports payback"],
    sourceSignals: ["Channel marginal ROAS", "New-customer share", "LTV model"],
    humanApprovalRequired: true,
    testDesign: "Geo holdout; measure incremental new customers, blended CAC, and 12-month LTV.",
    owner: "Performance Marketing",
    timeToValue: "1 quarter",
    status: "Needs Test",
    activationPath: ["Define geo holdout", "Shift budget", "Measure incrementality"],
  },
  {
    recommendationId: "REC-004",
    date: dayOffset(-10),
    module: "Forecast Studio",
    title: "Adopt Margin Protection scenario into Q3 plan",
    businessQuestion: "How do we protect profit without losing momentum?",
    recommendation: "Reduce promo depth and improve inventory allocation per the Margin Protection scenario.",
    expectedImpact: "Slightly lower revenue, higher gross profit (+180 bps margin)",
    confidenceScore: 80,
    evidence: ["Promo elasticity widening forecast error", "Inventory constraints in key sizes", "Repeat revenue resilient to lower promo"],
    sourceSignals: ["Forecast drivers", "Promo elasticity", "Inventory cover"],
    humanApprovalRequired: false,
    testDesign: "Phase promo reduction by market; monitor margin, revenue, and repeat rate.",
    owner: "Ecommerce Analytics",
    timeToValue: "Now",
    status: "On Track",
    activationPath: ["Set promo guardrails", "Reallocate inventory", "Monitor weekly"],
  },
  {
    recommendationId: "REC-005",
    date: dayOffset(-12),
    module: "External Demand Radar",
    title: "Localize DreamKnit lifecycle in cold-weather markets",
    businessQuestion: "What demand is forming outside Vuori.com?",
    recommendation: "Launch localized lifecycle and paid social around comfort, travel, and layering for Denver, Boston, Chicago, and Seattle.",
    expectedImpact: "+$310K 60-day revenue",
    confidenceScore: 75,
    evidence: ["DreamKnit mentions accelerating in cold markets", "Search & sentiment rising fastest in target markets", "Persona fit: Travel Weekender"],
    sourceSignals: ["Search velocity", "Social mentions", "Sentiment"],
    humanApprovalRequired: false,
    testDesign: "Localized vs default creative; measure PDP conversion and revenue lift.",
    owner: "Growth / Lifecycle",
    timeToValue: "4 weeks",
    status: "Opportunity",
    activationPath: ["Localized creative", "Lifecycle flow", "Paid social"],
  },
  {
    recommendationId: "REC-006",
    date: dayOffset(-14),
    module: "Conversion Funnel",
    title: "Fix mobile PDP image load time",
    businessQuestion: "Where is demand leaking before purchase?",
    recommendation: "Prioritize mobile PDP image performance to recover product-view-to-cart drop-off.",
    expectedImpact: "+$680K / month",
    confidenceScore: 86,
    evidence: ["Mobile is 62% of sessions but converts 38% below desktop", "PDP image load correlates with bounce", "High-traffic PDPs affected"],
    sourceSignals: ["Funnel device split", "Page performance", "Bounce rate"],
    humanApprovalRequired: false,
    testDesign: "Before/after with phased rollout; measure PDP→cart and conversion.",
    owner: "Ecommerce Tech",
    timeToValue: "6 weeks",
    status: "High Confidence",
    activationPath: ["Audit PDP assets", "Optimize delivery", "Measure conversion"],
  },
];

// ── Localization climate / seasonality helpers ──────────────────────────────
export const climateByMarket: Record<string, { season: string; demand: string }> = {
  Denver: { season: "Cold-weather peak Nov–Mar", demand: "Outerwear, layers, joggers" },
  "Salt Lake City": { season: "Ski season Dec–Mar", demand: "Insulated, recovery, layers" },
  Miami: { season: "Warm year-round", demand: "Shorts, tanks, coastal" },
  "San Diego": { season: "Mild coastal", demand: "Coastal, travel, training" },
  Austin: { season: "Warm spring/fall windows", demand: "Performance, travel, sets" },
  Boston: { season: "Four-season, cold winter", demand: "Commuter, layers, basics" },
  Seattle: { season: "Wet, mild; layering year-round", demand: "Layers, outerwear, commuter" },
  Chicago: { season: "Cold winter, warm summer", demand: "Layers, commuter, shorts" },
};
