// ───────────────────────────────────────────────────────────────────────────
// Vuori View — synthetic data generator.
//
// Everything here is fabricated for a portfolio demo. It is deterministic:
// the same seed always produces the same dataset. No proprietary data, no
// scraped assets. Numbers are tuned to tell coherent commercial stories
// (seasonality, launches, promos, event halos, market opportunity, etc.).
// ───────────────────────────────────────────────────────────────────────────

import { Rng, clamp, round } from "./seed";
import { customerQualityScore, returnAdjustedGrossProfit } from "../lib/scoring";
import type {
  ActivationLandingPage,
  AiUseCase,
  ChannelSummary,
  CohortRow,
  CommissionScenario,
  Competitor,
  CreativePerformance,
  CreatorPartner,
  DailyMetric,
  EventRow,
  EventType,
  Experiment,
  ExecutiveAlert,
  ExternalTrendRow,
  FunnelStage,
  GrowthInitiative,
  IncrementalityTest,
  InventoryRow,
  MarketSignal,
  OnsiteSearchIntent,
  PartnerStatus,
  PartnerType,
  PdpQuality,
  Persona,
  PersonaName,
  Product,
  ProductLaunch,
  Recommendation,
  ReturnsFitData,
  TrendSource,
  VisitorSignal,
  WaitlistDemand,
  WeatherDemandTrigger,
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
      customerQualityScore: customerQualityScore({
        ltv: (norm(m.inc, 80, 175) + norm(m.rep, 0.22, 0.48)) / 2,
        margin: clamp(60 + (m.rep - 0.35) * 110, 35, 92),
        repeat: norm(m.rep, 0.22, 0.48),
        returnInverse: clamp(74 + mr.normal(0, 4), 60, 86),
        promoInverse: clamp(100 - m.comp * 0.62, 30, 95),
        categoryExpansion: m.pf,
        engagement: clamp(58 + m.socV * 0.3, 40, 95),
        affinityDepth: m.pf,
        timeToSecond: norm(m.rep, 0.22, 0.48),
      }),
      communityCommerceOpportunity: round(
        clamp((m.well + m.run) / 2 * 0.45 + norm(m.socV, -10, 62) * 0.35 + m.pf * 0.2, 0, 100),
        0,
      ),
      incrementalityReadiness: round(
        clamp(58 + norm(m.tg, -5, 35) * 0.2 + (m.revTier <= 6 ? 12 : 0) - (m.comp > 70 ? 10 : 0) + mr.normal(0, 3), 40, 95),
        0,
      ),
      recommendedControlMarkets: [] as string[],
    } satisfies MarketSignal;
  });

  // Rank by revenue.
  [...out]
    .sort((a, b) => b.ecommerceRevenue - a.ecommerceRevenue)
    .forEach((m, i) => (m.revenueRank = i + 1));

  // Recommended control markets (matched-market similarity, US-to-US).
  const seedByName = new Map(MARKET_SEEDS.map((s) => [s.name, s]));
  out.forEach((m) => {
    if (m.market === "Austin") {
      m.recommendedControlMarkets = ["Nashville", "Salt Lake City", "Denver"];
      return;
    }
    const self = seedByName.get(m.market)!;
    m.recommendedControlMarkets = out
      .filter((o) => o.market !== m.market && o.country === m.country)
      .map((o) => {
        const s = seedByName.get(o.market)!;
        const overlap = s.topPersonas.filter((p) => self.topPersonas.includes(p)).length;
        const sim = -Math.abs(s.revTier - self.revTier) * 2 - Math.abs(s.tg - self.tg) * 0.3 + overlap * 5;
        return { market: o.market, sim };
      })
      .sort((a, b) => b.sim - a.sim)
      .slice(0, 3)
      .map((x) => x.market);
  });

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
      customerQualityScore: customerQualityScore({
        ltv: norm(p.ltv, 220, 640),
        margin: clamp(100 - p.promo * 90, 20, 92),
        repeat: clamp(p.repeat * 170, 20, 95),
        returnInverse: 100 - norm(p.churn, 0.12, 0.52) * 0.7,
        promoInverse: clamp(100 - p.promo * 130, 15, 92),
        categoryExpansion: clamp(p.categories.length * 22 + 30, 40, 95),
        engagement: clamp(p.channels.includes("Email") || p.channels.includes("SMS") ? 82 : 58, 40, 92),
        affinityDepth: clamp(p.products.length * 18 + 24, 40, 95),
        timeToSecond: clamp(p.repeat * 160, 20, 92),
      }),
      repeatProbability: round(clamp(p.repeat * 1.15, 0.1, 0.85), 2),
      categoryExpansionPotential: round(clamp(p.categories.length * 22 + 30, 40, 95), 0),
      promoDependency: p.promo,
      marginContribution: round(clamp(0.62 - p.promo * 0.18, 0.45, 0.66), 3),
      timeToSecondPurchasePrediction: Math.round(clamp(120 - p.repeat * 150, 24, 140)),
      returnRisk: round(clamp(p.churn * 0.5 + 0.04, 0.04, 0.3), 2),
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
    const B = CHANNEL_CQS[s.channel];
    const ownedish = ["Email", "SMS", "Direct", "Organic Search", "Retail Halo"].includes(s.channel);
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
      customerQualityScore: customerQualityScore({
        ltv: B, margin: B - 4, repeat: B, returnInverse: 74, promoInverse: B - 2,
        categoryExpansion: B - 8, engagement: B + 4, affinityDepth: B - 6, timeToSecond: B - 4,
      }),
      returnAdjustedRoas: round(s.roas * (1 - (ownedish ? 0.05 : 0.12)), 2),
      incrementalShare: CHANNEL_INCREMENTAL[s.channel],
    } satisfies ChannelSummary;
  });
}

const CHANNEL_CQS: Record<ChannelSummary["channel"], number> = {
  "Paid Social": 71, "Brand Campaigns": 68, Influencer: 73, "Paid Search": 77, Affiliate: 81,
  "Retail Halo": 83, "Organic Search": 86, Email: 90, SMS: 89, Direct: 92,
};
const CHANNEL_INCREMENTAL: Record<ChannelSummary["channel"], number> = {
  "Paid Social": 0.62, Influencer: 0.58, "Brand Campaigns": 0.55, "Retail Halo": 0.5, Affiliate: 0.46,
  "Organic Search": 0.4, "Paid Search": 0.34, Email: 0.22, SMS: 0.2, Direct: 0.12,
};
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
    { name: "Customer Quality Score optimization", domain: "Growth / Data Science", q: "Are we acquiring the right customers, or just more?", impact: 2_700_000, impactLabel: "+ quality-weighted growth", data: 80, complexity: 52, ttv: 3, confidence: 79, bizImpact: 85, owner: "Growth / Analytics", status: "POC Candidate", requiredData: ["Predicted LTV", "Margin & return signals", "Engagement", "Promo dependency"], model: "Composite quality score feeding bidding & targeting", activation: "Value-based bidding, audience selection, lifecycle", measure: "Quality-adjusted LTV:CAC vs volume baseline", governance: "Transparent weights; no PII to model" },
    { name: "Creator / activation landing page performance model", domain: "Affiliate / Community", q: "Which creators & pages drive incremental, high-quality DTC growth?", impact: 1_600_000, impactLabel: "+$1.6M incremental", data: 72, complexity: 48, ttv: 3, confidence: 77, bizImpact: 76, owner: "Growth / Retail", status: "In Test", requiredData: ["Landing-page analytics", "QR/UTM", "Commission", "CQS"], model: "Uplift + customer-quality model by partner/page", activation: "Partner selection & commission design", measure: "Incremental revenue & CQS vs generic page", governance: "Affiliate disclosure & human approval" },
    { name: "Incrementality test planner", domain: "Experimentation", q: "How do we prove incrementality, not just attribution?", impact: 1_500_000, impactLabel: "Decision clarity", data: 78, complexity: 50, ttv: 2, confidence: 81, bizImpact: 78, owner: "Ecommerce Analytics", status: "POC Candidate", requiredData: ["Market panel", "Baselines", "Similarity features"], model: "Matched-market selection + MDE + power analysis", activation: "Geo-holdout & matched-market design", measure: "Backtest predicted vs realized lift", governance: "Pre-registered decision rules" },
    { name: "Back-in-stock demand recovery model", domain: "Merchandising / CRM", q: "How much constrained demand can we recover?", impact: 1_800_000, impactLabel: "+$1.8M recovered", data: 82, complexity: 42, ttv: 2, confidence: 84, bizImpact: 79, owner: "Merch Planning / CRM", status: "Ready to Scale", requiredData: ["Waitlist & back-in-stock", "Inventory", "PDP OOS views"], model: "Lost-sales + recovery-rate forecast → triggers", activation: "Replenishment priority & restock SMS", measure: "Recovered revenue per restock vs holdout", governance: "Frequency caps; human-approved offers" },
    { name: "PDP quality scoring", domain: "Ecommerce / Merch", q: "Which product pages limit conversion or drive returns?", impact: 1_300_000, impactLabel: "+$1.3M conversion", data: 76, complexity: 38, ttv: 2, confidence: 80, bizImpact: 72, owner: "Ecommerce / Merch", status: "POC Candidate", requiredData: ["PDP content", "Reviews", "Conversion", "Returns"], model: "Weighted digital-shelf quality score", activation: "PDP fix prioritization & A/B tests", measure: "Conversion & return-adjusted GP lift", governance: "Human review of content changes" },
    { name: "Onsite search intent clustering", domain: "Ecommerce / Analytics", q: "What are shoppers telling us they want?", impact: 1_100_000, impactLabel: "Content-gap revenue", data: 74, complexity: 44, ttv: 3, confidence: 76, bizImpact: 70, owner: "Ecommerce / Analytics", status: "Discovery", requiredData: ["Onsite search logs", "Catalog taxonomy", "Conversion"], model: "Query normalization + intent clustering", activation: "Landing pages, merchandising, content", measure: "Zero-result reduction & intent conversion", governance: "Transparent intent mapping" },
    { name: "Creative resonance prediction", domain: "Creative / Growth", q: "Which creative themes resonate by persona & market?", impact: 1_200_000, impactLabel: "+$1.2M efficiency", data: 64, complexity: 56, ttv: 4, confidence: 73, bizImpact: 71, owner: "Creative / Analytics", status: "Discovery", requiredData: ["Creative performance", "Persona mix", "CQS"], model: "Theme × persona × market resonance ranking", activation: "Localized creative & budget weighting", measure: "Creative lift & CQS by theme", governance: "Human creative approval" },
    { name: "Weather-triggered demand model", domain: "Localization / Planning", q: "How should weather shape product & lifecycle timing?", impact: 900_000, impactLabel: "+$900K timing", data: 70, complexity: 46, ttv: 3, confidence: 74, bizImpact: 66, owner: "Demand Planning / Lifecycle", status: "Discovery", requiredData: ["Weather feeds", "Category demand", "Market"], model: "Weather → category demand-lift regression", activation: "Triggered campaigns & assortment timing", measure: "Incremental category lift vs control", governance: "Backtest before activation" },
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
  { id: "GI-9", name: "Customer Quality Score optimization", description: "Bid, target, and message to customer quality, not just volume.", revenueImpact: 2_700_000, grossProfitImpact: 1_780_000, cacReduction: 6, ltvLift: 9, conversionLift: 0, retentionLift: 5, inventoryRiskReduction: 0, confidence: 79, owner: "Growth / Analytics", testDesign: "Geo holdout; quality-adjusted LTV:CAC vs volume baseline.", timeToValue: "1–2 quarters", stage: "Next", status: "Ready for POC" },
  { id: "GI-10", name: "Return reduction / fit guidance", description: "PDP fit guidance + review snippets to lift return-adjusted profit.", revenueImpact: 0, grossProfitImpact: 1_240_000, cacReduction: 0, ltvLift: 2, conversionLift: 0, retentionLift: 3, inventoryRiskReduction: 0, confidence: 80, owner: "Product / UX", testDesign: "PDP A/B on high-return styles; return-adjusted GP.", timeToValue: "1 quarter", stage: "Now", status: "Ready for POC" },
  { id: "GI-11", name: "Inventory recovery / waitlist capture", description: "Replenishment priority + back-in-stock triggers recover constrained demand.", revenueImpact: 1_800_000, grossProfitImpact: 1_053_000, cacReduction: 0, ltvLift: 0, conversionLift: 0, retentionLift: 0, inventoryRiskReduction: 1_800_000, confidence: 84, owner: "Merch Planning / CRM", testDesign: "Lifecycle holdout; recovered revenue per restock.", timeToValue: "Now", stage: "Now", status: "Data Ready" },
  { id: "GI-12", name: "Experimentation operating system", description: "Standardize hypotheses, controls, and decision rules across teams.", revenueImpact: 1_400_000, grossProfitImpact: 840_000, cacReduction: 3, ltvLift: 2, conversionLift: 2, retentionLift: 2, inventoryRiskReduction: 0, confidence: 78, owner: "Ecommerce Analytics", testDesign: "Track win rate, velocity, and decision quality.", timeToValue: "1–2 quarters", stage: "Next", status: "High Confidence" },
  { id: "GI-13", name: "Community commerce landing page test", description: "Curated creator/event pages to drive incremental, higher-quality customers.", revenueImpact: 1_600_000, grossProfitImpact: 920_000, cacReduction: 0, ltvLift: 5, conversionLift: 4, retentionLift: 4, inventoryRiskReduction: 0, confidence: 77, owner: "Growth / Retail", testDesign: "Landing-page test; CQS & incremental revenue vs generic.", timeToValue: "1 quarter", stage: "Now", status: "Needs Test" },
  { id: "GI-14", name: "Geo-holdout measurement program", description: "Standing matched-market capability to prove incrementality.", revenueImpact: 0, grossProfitImpact: 0, cacReduction: 8, ltvLift: 0, conversionLift: 0, retentionLift: 0, inventoryRiskReduction: 0, confidence: 81, owner: "Ecommerce Analytics", testDesign: "Backtest predicted vs realized lift; pre-registered rules.", timeToValue: "1 quarter", stage: "Next", status: "High Confidence" },
  { id: "GI-15", name: "PDP quality improvement", description: "Fix low-scoring PDPs: fit clarity, visual merchandising, reviews.", revenueImpact: 1_300_000, grossProfitImpact: 760_000, cacReduction: 0, ltvLift: 0, conversionLift: 5, retentionLift: 0, inventoryRiskReduction: 0, confidence: 80, owner: "Ecommerce / Merch", testDesign: "PDP A/B; conversion & return-adjusted GP.", timeToValue: "1 quarter", stage: "Now", status: "Ready for POC" },
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

// ───────────────────────────────────────────────────────────────────────────
// COMMUNITY COMMERCE — creators, ambassadors, affiliates, activation pages
// ───────────────────────────────────────────────────────────────────────────
interface CreatorSeed {
  name: string;
  type: PartnerType;
  market: string;
  persona: PersonaName;
  audience: number;
  engagement: number;
  brandFit: number;
  commission: number;
  content: string;
  event: string;
  status: PartnerStatus;
}

const CREATOR_SEEDS: CreatorSeed[] = [
  { name: "Austin Run Collective", type: "Run Club", market: "Austin", persona: "Performance Commuter", audience: 28000, engagement: 0.085, brandFit: 94, commission: 0.1, content: "Group runs + sunrise miles", event: "Austin Run Club + Recovery", status: "Top Performer" },
  { name: "Eastside Recovery Studio", type: "Recovery Studio", market: "Austin", persona: "Trail & Recovery", audience: 16000, engagement: 0.072, brandFit: 91, commission: 0.1, content: "Recovery + mobility sessions", event: "Austin Run Club + Recovery", status: "Active" },
  { name: "Maya Render", type: "Wellness Creator", market: "Austin", persona: "Wellness Socialite", audience: 320000, engagement: 0.054, brandFit: 88, commission: 0.14, content: "Wellness + community reels", event: "Austin Run Club + Recovery", status: "Active" },
  { name: "Trailhead Co.", type: "Outdoor Community", market: "Denver", persona: "Trail & Recovery", audience: 42000, engagement: 0.061, brandFit: 89, commission: 0.11, content: "Trail meetups + vlogs", event: "Denver Trail Series", status: "Active" },
  { name: "Jordan Vale", type: "Ambassador", market: "Boston", persona: "Performance Commuter", audience: 95000, engagement: 0.048, brandFit: 85, commission: 0.12, content: "Commuter style + run", event: "Boston Studio Takeover", status: "In Test" },
  { name: "Coast & Current", type: "Affiliate Creator", market: "Miami", persona: "Coastal Active", audience: 540000, engagement: 0.039, brandFit: 82, commission: 0.15, content: "Surf + coastal lifestyle", event: "Miami Coastal Activation", status: "Active" },
  { name: "Sol Pilates", type: "Pilates Studio", market: "Los Angeles", persona: "Studio Minimalist", audience: 24000, engagement: 0.07, brandFit: 90, commission: 0.1, content: "Pilates flows + sets", event: "LA Flagship Preview", status: "Active" },
  { name: "The Weekend Edit", type: "Affiliate Creator", market: "New York", persona: "Travel Weekender", audience: 180000, engagement: 0.032, brandFit: 80, commission: 0.16, content: "Affiliate edits + travel", event: "—", status: "Active" },
  { name: "Nashville Run Society", type: "Run Club", market: "Nashville", persona: "Wellness Socialite", audience: 19000, engagement: 0.079, brandFit: 87, commission: 0.1, content: "Run + community events", event: "Nashville Community Night", status: "Proposed" },
  { name: "Peak & Powder", type: "Outdoor Community", market: "Salt Lake City", persona: "Trail & Recovery", audience: 33000, engagement: 0.058, brandFit: 86, commission: 0.11, content: "Ski + recovery content", event: "SLC Recovery Pop-Up", status: "Proposed" },
  { name: "Coach Liv", type: "Local Trainer", market: "Chicago", persona: "Modern Dad Uniform", audience: 64000, engagement: 0.052, brandFit: 83, commission: 0.12, content: "Strength + everyday training", event: "—", status: "In Test" },
  { name: "Bayside Yoga", type: "Yoga Instructor", market: "Seattle", persona: "Studio Minimalist", audience: 21000, engagement: 0.066, brandFit: 84, commission: 0.1, content: "Mobility + studio sets", event: "Seattle Pop-Up", status: "Proposed" },
];

const COMMUNITY_TYPES: PartnerType[] = [
  "Run Club", "Recovery Studio", "Pilates Studio", "Yoga Instructor", "Local Trainer",
  "Outdoor Community", "Local Partner",
];
function creatorCqsPremium(type: PartnerType): number {
  if (COMMUNITY_TYPES.includes(type)) return 11;
  if (type === "Ambassador") return 5;
  if (type === "Resort / Hotel Partner") return 2;
  return -3; // broad creators / affiliates
}

function buildCreators(): CreatorPartner[] {
  const cr = new Rng("creators");
  return CREATOR_SEEDS.map((c, i) => {
    const persona = personas.find((p) => p.personaName === c.persona)!;
    const reach = c.audience * c.engagement;
    const attributedRevenue = Math.round(reach * cr.range(0.14, 0.24) * 142 * (c.brandFit / 85));
    const newCustomers = Math.round(attributedRevenue / cr.range(165, 215));
    // Local, high-fit partners convert more incrementally than broad affiliates.
    const incRate = clamp(
      0.5 + (c.brandFit - 80) * 0.012 + (c.type.includes("Affiliate") ? -0.12 : c.type.includes("Creator") ? -0.04 : 0.08),
      0.4,
      0.82,
    );
    const incrementalRevenue = Math.round(attributedRevenue * incRate);
    const payout = attributedRevenue * c.commission + 3500;
    const roi = round(attributedRevenue / payout, 2);
    const cqs = round(clamp(c.brandFit * 0.8 + creatorCqsPremium(c.type), 55, 95), 0);
    return {
      partnerId: `CP-${String(i + 1).padStart(3, "0")}`,
      name: c.name,
      partnerType: c.type,
      market: c.market,
      primaryPersona: c.persona,
      audienceSize: c.audience,
      engagementRate: c.engagement,
      brandFitScore: c.brandFit,
      personaFitScore: round(clamp(c.brandFit + cr.normal(0, 3), 60, 98), 0),
      commissionRate: c.commission,
      contentType: c.content,
      eventAssociated: c.event,
      status: c.status,
      expectedCustomerQualityScore: cqs,
      averageOrderValue: Math.round(persona.avgAov * clamp(cr.normal(1, 0.04), 0.9, 1.1)),
      returnRisk: persona.returnRisk,
      projectedLtv: Math.round(persona.predictedLtv * (cqs / 80)),
      incrementalLiftEstimate: round(incRate, 2),
      attributedRevenue,
      newCustomers,
      incrementalRevenue,
      roi,
    } satisfies CreatorPartner;
  });
}
export const creatorPartners = buildCreators();

// Persona → creator fit matrix (0..100)
export function personaCreatorMatrix(): { creator: string; primaryPersona: PersonaName; values: Record<string, number> }[] {
  return CREATOR_SEEDS.map((c) => {
    const mr = new Rng("pcreator-" + c.name);
    const values: Record<string, number> = {};
    personaNames.forEach((pn) => {
      let v = 22 + mr.normal(0, 8);
      if (pn === c.persona) v = 86 + mr.normal(0, 4);
      else if (RELATED_PERSONAS[c.persona]?.includes(pn)) v = 54 + mr.normal(0, 8);
      values[pn] = round(clamp(v, 8, 96), 0);
    });
    return { creator: c.name, primaryPersona: c.persona, values };
  });
}

const RELATED_PERSONAS: Partial<Record<PersonaName, PersonaName[]>> = {
  "Performance Commuter": ["Modern Dad Uniform", "Premium Basics Loyalist", "Trail & Recovery"],
  "Trail & Recovery": ["Performance Commuter", "Modern Dad Uniform"],
  "Wellness Socialite": ["Studio Minimalist", "Coastal Active"],
  "Coastal Active": ["Travel Weekender", "Wellness Socialite"],
  "Studio Minimalist": ["Wellness Socialite", "Premium Basics Loyalist"],
  "Travel Weekender": ["Coastal Active", "Premium Basics Loyalist"],
  "Modern Dad Uniform": ["Performance Commuter", "Premium Basics Loyalist"],
};

interface LandingSeed {
  name: string;
  market: string;
  partnerId: string;
  eventId: string;
  slug: string;
  hero: string;
  featured: string[];
  personas: PersonaName[];
  utm: string;
  scale: number;
  commission: number;
}

const LANDING_SEEDS: LandingSeed[] = [
  { name: "Denver Trail Series", market: "Denver", partnerId: "CP-004", eventId: "EV-002", slug: "/denver-trail", hero: "Made for the climb, the descent, and the recovery after.", featured: ["Sunday Performance Jogger", "Canyon Insulated Jacket", "Restore Half Zip", "Meta Pant"], personas: ["Trail & Recovery", "Performance Commuter", "Modern Dad Uniform"], utm: "den_trail_q3", scale: 0.46, commission: 0.11 },
  { name: "Miami Coastal Activation", market: "Miami", partnerId: "CP-006", eventId: "EV-003", slug: "/miami-coastal", hero: "Sun, salt, and everything in motion.", featured: ["Coastal Training Tank", "Kore Short", "Villa Wideleg", "Strato Tech Tee"], personas: ["Coastal Active", "Travel Weekender", "Wellness Socialite"], utm: "mia_coastal_q3", scale: 0.4, commission: 0.15 },
  { name: "Boston Studio Takeover", market: "Boston", partnerId: "CP-005", eventId: "EV-004", slug: "/boston-studio", hero: "From the commute to the mat to the meeting.", featured: ["Meta Pant", "Transit Commuter Shirt", "Daily Legging", "Restore Half Zip"], personas: ["Performance Commuter", "Premium Basics Loyalist", "Studio Minimalist"], utm: "bos_studio_q3", scale: 0.38, commission: 0.12 },
  { name: "LA Flagship Preview", market: "Los Angeles", partnerId: "CP-007", eventId: "EV-006", slug: "/la-flagship", hero: "A first look, styled for the coast.", featured: ["Daily Legging", "Villa Wideleg", "DreamKnit Layer", "Coastal Training Tank"], personas: ["Studio Minimalist", "Coastal Active", "Wellness Socialite"], utm: "la_flagship_q3", scale: 0.52, commission: 0.1 },
  { name: "Nashville Community Night", market: "Nashville", partnerId: "CP-009", eventId: "EV-005", slug: "/nashville-night", hero: "Run together. Recover together. Stay a while.", featured: ["Daily Legging", "Halo Essential Hoodie", "Coastal Training Tank", "Sunday Performance Jogger"], personas: ["Wellness Socialite", "Performance Commuter", "Travel Weekender"], utm: "nsh_night_q3", scale: 0.3, commission: 0.1 },
  { name: "NY Weekend Edit", market: "New York", partnerId: "CP-008", eventId: "—", slug: "/ny-weekend", hero: "From the gate to the table — your weekend edit.", featured: ["Villa Wideleg", "Halo Essential Hoodie", "DreamKnit Layer", "Transit Commuter Shirt"], personas: ["Travel Weekender", "Premium Basics Loyalist", "Performance Commuter"], utm: "ny_weekend_q3", scale: 0.5, commission: 0.16 },
];

function buildLandingPages(): ActivationLandingPage[] {
  const austinPage: ActivationLandingPage = {
    landingPageId: "LP-001",
    name: "Austin Run Club + Recovery Studio",
    market: "Austin",
    partnerId: "CP-001",
    eventId: "EV-001",
    urlSlug: "/austin-run-club",
    heroMessage: "Built for sunrise miles, recovery hangs, and everything after.",
    featuredProducts: ["Kore Short", "Strato Tech Tee", "Sunday Performance Jogger", "Transit Commuter Shirt", "Restore Half Zip"],
    targetPersonas: ["Performance Commuter", "Wellness Socialite", "Trail & Recovery"],
    qrCodeId: "QR-ATX-001",
    utmCampaign: "atx_runclub_q3",
    sessions: 4900,
    qrScans: 8400,
    emailCaptures: 2100,
    smsCaptures: 800,
    productViews: 3050,
    addToCart: 1740,
    orders: 1216,
    revenue: 180000,
    newCustomers: 920,
    repeatCustomers: 296,
    grossMargin: 105300,
    commissionPayout: 21600,
    marginAfterCommission: 83700,
    returnRate: 0.09,
    returnAdjustedRevenue: 163800,
    haloRevenue30d: 235200,
    haloRevenue60d: 414400,
    haloRevenue90d: 560000,
    incrementalRevenueEstimate: 540000,
    cannibalizedRevenueEstimate: 200000,
    customerQualityScore: 86,
    roi: 3.7,
    confidence: 84,
  };

  const others = LANDING_SEEDS.map((s, i) => {
    const lr = new Rng("landing-" + s.slug);
    const qrScans = Math.round(8400 * s.scale * lr.range(0.92, 1.08));
    const sessions = Math.round(qrScans * lr.range(0.5, 0.62));
    const productViews = Math.round(sessions * 0.62);
    const addToCart = Math.round(productViews * lr.range(0.5, 0.6));
    const orders = Math.round(addToCart * lr.range(0.4, 0.46));
    const aov = lr.range(140, 156);
    const revenue = Math.round(orders * aov);
    const leads = Math.round(sessions * lr.range(0.5, 0.62));
    const emailCaptures = Math.round(leads * 0.72);
    const smsCaptures = leads - emailCaptures;
    const newCustomers = Math.round(orders * lr.range(0.58, 0.66));
    const repeatCustomers = Math.round(orders * lr.range(0.26, 0.34));
    const grossMargin = Math.round(revenue * 0.585);
    const commissionPayout = Math.round(revenue * s.commission);
    const halo90 = Math.round(revenue * lr.range(2.6, 3.3));
    const returnRate = round(lr.range(0.07, 0.12), 2);
    const partner = creatorPartners.find((p) => p.partnerId === s.partnerId);
    return {
      landingPageId: `LP-${String(i + 2).padStart(3, "0")}`,
      name: s.name,
      market: s.market,
      partnerId: s.partnerId,
      eventId: s.eventId,
      urlSlug: s.slug,
      heroMessage: s.hero,
      featuredProducts: s.featured,
      targetPersonas: s.personas,
      qrCodeId: `QR-${s.market.slice(0, 3).toUpperCase()}-${String(i + 2).padStart(3, "0")}`,
      utmCampaign: s.utm,
      sessions,
      qrScans,
      emailCaptures,
      smsCaptures,
      productViews,
      addToCart,
      orders,
      revenue,
      newCustomers,
      repeatCustomers,
      grossMargin,
      commissionPayout,
      marginAfterCommission: grossMargin - commissionPayout,
      returnRate,
      returnAdjustedRevenue: Math.round(revenue * (1 - returnRate)),
      haloRevenue30d: Math.round(halo90 * 0.42),
      haloRevenue60d: Math.round(halo90 * 0.74),
      haloRevenue90d: halo90,
      incrementalRevenueEstimate: Math.round((revenue + halo90) * lr.range(0.7, 0.77)),
      cannibalizedRevenueEstimate: Math.round((revenue + halo90) * lr.range(0.14, 0.2)),
      customerQualityScore: partner ? round(clamp(partner.expectedCustomerQualityScore + lr.normal(0, 2), 55, 95), 0) : 74,
      roi: round((revenue + halo90) / (commissionPayout + revenue * 0.55), 2),
      confidence: round(lr.range(68, 82), 0),
    } satisfies ActivationLandingPage;
  });

  return [austinPage, ...others];
}
export const activationLandingPages = buildLandingPages();

export const commissionScenarios: CommissionScenario[] = [
  { scenarioId: "CM-1", model: "Flat 10%", commissionRate: 0.1, newCustomerBonus: 0, leadBonus: 0, revenue: 176000, marginAfterCommission: 85360, creatorPayout: 17600, newCustomers: 840, projectedLtv: 401520, customerQualityScore: 79, returnAdjustedMargin: 76824, recommendation: "Margin-safe baseline" },
  { scenarioId: "CM-2", model: "Flat 15%", commissionRate: 0.15, newCustomerBonus: 0, leadBonus: 0, revenue: 194000, marginAfterCommission: 84390, creatorPayout: 29100, newCustomers: 1010, projectedLtv: 482780, customerQualityScore: 75, returnAdjustedMargin: 75951, recommendation: "Higher reach, lower margin" },
  { scenarioId: "CM-3", model: "New-customer bonus (8% + $20)", commissionRate: 0.08, newCustomerBonus: 20, leadBonus: 0, revenue: 186000, marginAfterCommission: 73130, creatorPayout: 35680, newCustomers: 1040, projectedLtv: 497120, customerQualityScore: 73, returnAdjustedMargin: 65817, recommendation: "Best for acquisition" },
  { scenarioId: "CM-4", model: "Lead + sale hybrid (10% + $3/lead)", commissionRate: 0.1, newCustomerBonus: 0, leadBonus: 3, revenue: 184000, marginAfterCommission: 79940, creatorPayout: 27700, newCustomers: 940, projectedLtv: 449320, customerQualityScore: 80, returnAdjustedMargin: 71946, recommendation: "Captures first-party leads" },
  { scenarioId: "CM-5", model: "Return-adjusted 12%", commissionRate: 0.12, newCustomerBonus: 0, leadBonus: 0, revenue: 182000, marginAfterCommission: 86596, creatorPayout: 19874, newCustomers: 910, projectedLtv: 434980, customerQualityScore: 84, returnAdjustedMargin: 79668, recommendation: "Recommended — protects margin" },
];

// ───────────────────────────────────────────────────────────────────────────
// EXPERIMENTATION & INCREMENTALITY
// ───────────────────────────────────────────────────────────────────────────
export const experiments: Experiment[] = [
  {
    experimentId: "EXP-001", name: "Austin localized activation", domain: "Pop-up / Events",
    businessQuestion: "Where should Vuori localize investment next?",
    hypothesis: "Austin market activation will create incremental ecommerce revenue beyond baseline market growth.",
    owner: "Retail / Growth", status: "Running", startDate: dayOffset(-21), endDate: dayOffset(69),
    testType: "Matched Market Test", testMarket: "Austin", controlMarkets: ["Nashville", "Salt Lake City", "Denver"],
    audience: "All Austin DMA traffic", primaryKpi: "Incremental 90-day DTC revenue",
    secondaryKpis: ["New-customer CAC", "Repeat rate", "Customer Quality Score"],
    baseline: "Austin trailing 90-day DTC revenue", testResult: "Reading at day 21 — tracking above control",
    lift: 11.4, confidence: 78, incrementalRevenue: 132000, marginImpact: 64000, customerQualityImpact: 9,
    decision: "Running", nextStep: "Read 30-day incrementality vs matched controls",
    relatedRecommendationId: "REC-001", relatedUseCaseId: "AI-02",
  },
  {
    experimentId: "EXP-002", name: "Persona-based homepage personalization", domain: "Ecommerce",
    businessQuestion: "What should each visitor see first?",
    hypothesis: "Persona-specific homepage modules increase conversion and AOV without increasing return rate.",
    owner: "Growth / Analytics", status: "Running", startDate: dayOffset(-34), endDate: dayOffset(11),
    testType: "A/B Test", testMarket: "Sitewide", controlMarkets: [], audience: "50/50 sitewide split",
    primaryKpi: "Conversion rate", secondaryKpis: ["AOV", "Return rate", "Margin per session", "Predicted LTV"],
    baseline: "Generic homepage", testResult: "+6.2% margin-adjusted conversion", lift: 6.2, confidence: 83,
    incrementalRevenue: 940000, marginImpact: 520000, customerQualityImpact: 4,
    decision: "Scale", nextStep: "Scale — margin-adjusted conversion lift exceeds 5% threshold",
    relatedRecommendationId: undefined, relatedUseCaseId: "AI-01",
  },
  {
    experimentId: "EXP-003", name: "Back-in-stock SMS flow", domain: "CRM",
    businessQuestion: "Can waitlist SMS recover constrained demand?",
    hypothesis: "Size/color waitlist SMS drives incremental revenue within 72 hours of replenishment.",
    owner: "Lifecycle CRM", status: "Reading Results", startDate: dayOffset(-48), endDate: dayOffset(-6),
    testType: "Lifecycle Holdout", testMarket: "Cold-weather markets", controlMarkets: [],
    audience: "Back-in-stock subscribers (10% holdout)", primaryKpi: "Revenue per recipient",
    secondaryKpis: ["Unsubscribes", "Margin", "Repeat purchase"], baseline: "No restock SMS (holdout)",
    testResult: "$4.80 revenue per recipient vs $0.90 holdout", lift: 31.0, confidence: 81,
    incrementalRevenue: 286000, marginImpact: 168000, customerQualityImpact: 3,
    decision: "Scale", nextStep: "Roll out to all constrained SKUs with 24h trigger SLA",
    relatedRecommendationId: undefined, relatedUseCaseId: "AI-06",
  },
  {
    experimentId: "EXP-004", name: "Creator landing page test", domain: "Affiliate / Community",
    businessQuestion: "Do curated landing pages attract better customers?",
    hypothesis: "Curated creator/event landing pages drive higher customer quality than generic collection pages.",
    owner: "Growth / Retail", status: "Running", startDate: dayOffset(-18), endDate: dayOffset(24),
    testType: "Landing Page Test", testMarket: "Austin, Denver, Miami", controlMarkets: [],
    audience: "QR + creator-link traffic", primaryKpi: "Customer Quality Score",
    secondaryKpis: ["Conversion rate", "LTV", "Margin after commission"], baseline: "Generic collection page",
    testResult: "CQS 86 vs 74 on generic page", lift: 16.2, confidence: 79,
    incrementalRevenue: 210000, marginImpact: 96000, customerQualityImpact: 12,
    decision: "Iterate", nextStep: "Expand to 3 more markets; test commission models",
    relatedRecommendationId: "REC-002", relatedUseCaseId: undefined,
  },
  {
    experimentId: "EXP-005", name: "PDP fit guidance test", domain: "PDP optimization",
    businessQuestion: "Can fit guidance cut returns without hurting conversion?",
    hypothesis: "Enhanced fit guidance reduces returns without lowering conversion.",
    owner: "Product / UX", status: "Reading Results", startDate: dayOffset(-40), endDate: dayOffset(2),
    testType: "PDP Optimization Test", testMarket: "Sitewide", controlMarkets: [],
    audience: "High-return styles (Daily Legging, Villa Wideleg)", primaryKpi: "Return-adjusted gross profit",
    secondaryKpis: ["Return rate", "Conversion rate", "Size-guide engagement"], baseline: "Standard PDP",
    testResult: "−18% returns, conversion flat", lift: 9.4, confidence: 80,
    incrementalRevenue: 162000, marginImpact: 162000, customerQualityImpact: 5,
    decision: "Scale", nextStep: "Roll fit guidance to all elevated-return styles",
    relatedRecommendationId: "REC-006", relatedUseCaseId: "AI-10",
  },
  {
    experimentId: "EXP-006", name: "LTV-based paid media bidding", domain: "Paid media",
    businessQuestion: "How do we bid to predicted lifetime value?",
    hypothesis: "Value-based bidding lowers CAC for equal-quality customers via geo holdout.",
    owner: "Performance Marketing", status: "Designing", startDate: dayOffset(7), endDate: dayOffset(67),
    testType: "Geo Holdout", testMarket: "West region", controlMarkets: ["Phoenix", "Dallas", "Chicago"],
    audience: "Prospecting paid social", primaryKpi: "Blended CAC",
    secondaryKpis: ["LTV:CAC", "Customer Quality Score", "New customers"], baseline: "Last-click ROAS bidding",
    testResult: "—", lift: 0, confidence: 72, incrementalRevenue: 0, marginImpact: 0, customerQualityImpact: 0,
    decision: "Proposed", nextStep: "Finalize geo holdout design and MDE",
    relatedRecommendationId: "REC-003", relatedUseCaseId: "AI-04",
  },
  {
    experimentId: "EXP-007", name: "DreamKnit localized lifecycle", domain: "Localization",
    businessQuestion: "Does localized layering creative lift cold-market revenue?",
    hypothesis: "Localized comfort/layering creative lifts PDP conversion in cold-weather markets.",
    owner: "Growth / Lifecycle", status: "Running", startDate: dayOffset(-12), endDate: dayOffset(30),
    testType: "Matched Market Test", testMarket: "Denver, Boston", controlMarkets: ["Chicago", "Seattle"],
    audience: "Cold-market lifecycle audience", primaryKpi: "Incremental revenue",
    secondaryKpis: ["PDP conversion", "Email/SMS revenue"], baseline: "Default creative",
    testResult: "Tracking +8% vs control", lift: 8.0, confidence: 75, incrementalRevenue: 118000,
    marginImpact: 64000, customerQualityImpact: 2, decision: "Running", nextStep: "Read 30-day lift",
    relatedRecommendationId: "REC-005", relatedUseCaseId: undefined,
  },
  {
    experimentId: "EXP-008", name: "Mobile PDP performance fix", domain: "Ecommerce",
    businessQuestion: "Where is mobile demand leaking before purchase?",
    hypothesis: "Faster mobile PDP image load recovers product-view-to-cart drop-off.",
    owner: "Ecommerce Tech", status: "Scale", startDate: dayOffset(-70), endDate: dayOffset(-14),
    testType: "A/B Test", testMarket: "Sitewide (mobile)", controlMarkets: [],
    audience: "Mobile sessions", primaryKpi: "Mobile conversion rate",
    secondaryKpis: ["PDP→cart", "Bounce rate"], baseline: "Current PDP", testResult: "+9% mobile conversion",
    lift: 9.0, confidence: 88, incrementalRevenue: 680000, marginImpact: 396000, customerQualityImpact: 1,
    decision: "Scale", nextStep: "Shipped — monitor Core Web Vitals",
    relatedRecommendationId: "REC-006", relatedUseCaseId: undefined,
  },
  {
    experimentId: "EXP-009", name: "Size availability optimization", domain: "Merchandising",
    businessQuestion: "Which size breaks are capping revenue?",
    hypothesis: "Closing M/L size breaks in hero styles recovers suppressed revenue.",
    owner: "Merch Planning", status: "Iterate", startDate: dayOffset(-55), endDate: dayOffset(-1),
    testType: "Matched Market Test", testMarket: "Mountain markets", controlMarkets: ["Phoenix", "Dallas"],
    audience: "Constrained hero styles", primaryKpi: "Recovered revenue",
    secondaryKpis: ["Size availability rate", "Stockout rate"], baseline: "Pre-replenishment",
    testResult: "$2.1M recovered run-rate", lift: 12.0, confidence: 85, incrementalRevenue: 2100000,
    marginImpact: 1280000, customerQualityImpact: 0, decision: "Scale", nextStep: "Codify size-curve guardrails",
    relatedRecommendationId: undefined, relatedUseCaseId: "AI-09",
  },
  {
    experimentId: "EXP-010", name: "Weather-triggered campaign automation", domain: "Localization",
    businessQuestion: "Should weather shape lifecycle timing?",
    hypothesis: "Weather-triggered creative lifts category demand within 7 days of a weather event.",
    owner: "Growth / Lifecycle", status: "Proposed", startDate: dayOffset(14), endDate: dayOffset(74),
    testType: "Incrementality Test", testMarket: "Denver, Seattle", controlMarkets: ["Chicago", "Boston"],
    audience: "Weather-triggered lifecycle", primaryKpi: "Incremental category revenue",
    secondaryKpis: ["Open/click rate", "Conversion"], baseline: "Standard calendar", testResult: "—",
    lift: 0, confidence: 70, incrementalRevenue: 0, marginImpact: 0, customerQualityImpact: 0,
    decision: "Needs More Data", nextStep: "Backtest weather-demand model before launch",
    relatedRecommendationId: undefined, relatedUseCaseId: undefined,
  },
];

export const incrementalityTests: IncrementalityTest[] = [
  {
    testId: "INC-001", name: "Austin activation geo-holdout", testType: "Matched Market Test",
    testMarket: "Austin", controlMarkets: ["Nashville", "Salt Lake City", "Denver"], marketSimilarityScore: 88,
    startDate: dayOffset(-21), endDate: dayOffset(69), baselineRevenue: 4_140_000, expectedLift: 9, actualLift: 11.4,
    incrementalRevenue: 132000, attributedRevenue: 184000, cannibalizedRevenue: 52000, confidence: 78,
    minimumDetectableEffect: 4.5, recommendedDuration: 13, status: "Running", owner: "Ecommerce Analytics",
    decisionRule: "Scale if incremental lift > MDE (4.5%) at ≥80% confidence after 90 days.",
    similarityFactors: [
      { factor: "Baseline ecommerce revenue", score: 86 }, { factor: "Traffic trend", score: 84 },
      { factor: "Persona mix", score: 91 }, { factor: "Category mix", score: 88 },
      { factor: "Seasonality", score: 90 }, { factor: "Paid media exposure", score: 83 },
      { factor: "Retail/store influence", score: 92 }, { factor: "External demand trend", score: 85 },
    ],
  },
  {
    testId: "INC-002", name: "LTV bidding geo-holdout (West)", testType: "Geo Holdout", testMarket: "West region",
    controlMarkets: ["Phoenix", "Dallas", "Chicago"], marketSimilarityScore: 82, startDate: dayOffset(7),
    endDate: dayOffset(67), baselineRevenue: 9_800_000, expectedLift: 6, actualLift: null, incrementalRevenue: 0,
    attributedRevenue: 0, cannibalizedRevenue: 0, confidence: 72, minimumDetectableEffect: 3.8, recommendedDuration: 9,
    status: "Designing", owner: "Performance Marketing",
    decisionRule: "Scale if CAC drop ≥8% with stable Customer Quality Score.",
    similarityFactors: [
      { factor: "Baseline ecommerce revenue", score: 80 }, { factor: "Traffic trend", score: 78 },
      { factor: "Persona mix", score: 84 }, { factor: "Category mix", score: 83 },
      { factor: "Seasonality", score: 86 }, { factor: "Paid media exposure", score: 79 },
    ],
  },
  {
    testId: "INC-003", name: "DreamKnit cold-market lift", testType: "Matched Market Test", testMarket: "Denver, Boston",
    controlMarkets: ["Chicago", "Seattle"], marketSimilarityScore: 85, startDate: dayOffset(-12), endDate: dayOffset(30),
    baselineRevenue: 5_600_000, expectedLift: 7, actualLift: 8.0, incrementalRevenue: 118000, attributedRevenue: 162000,
    cannibalizedRevenue: 44000, confidence: 75, minimumDetectableEffect: 4.0, recommendedDuration: 8, status: "Running",
    owner: "Growth / Lifecycle", decisionRule: "Scale if incremental lift > 4% at ≥75% confidence.",
    similarityFactors: [
      { factor: "Baseline ecommerce revenue", score: 84 }, { factor: "Traffic trend", score: 82 },
      { factor: "Persona mix", score: 86 }, { factor: "Category mix", score: 88 }, { factor: "Seasonality", score: 89 },
    ],
  },
  {
    testId: "INC-004", name: "Creator landing page incrementality", testType: "Landing Page Test",
    testMarket: "Austin, Miami", controlMarkets: ["Nashville", "Phoenix"], marketSimilarityScore: 80,
    startDate: dayOffset(-18), endDate: dayOffset(24), baselineRevenue: 3_900_000, expectedLift: 8, actualLift: 9.1,
    incrementalRevenue: 96000, attributedRevenue: 138000, cannibalizedRevenue: 38000, confidence: 76,
    minimumDetectableEffect: 5.0, recommendedDuration: 6, status: "Running", owner: "Growth / Retail",
    decisionRule: "Scale if CQS > generic page and incremental lift > MDE.",
    similarityFactors: [
      { factor: "Baseline ecommerce revenue", score: 79 }, { factor: "Persona mix", score: 83 },
      { factor: "Category mix", score: 81 }, { factor: "External demand trend", score: 84 },
    ],
  },
  {
    testId: "INC-005", name: "Nashville emerging-market test", testType: "Incrementality Test", testMarket: "Nashville",
    controlMarkets: ["Salt Lake City", "Phoenix", "Dallas"], marketSimilarityScore: 83, startDate: dayOffset(21),
    endDate: dayOffset(111), baselineRevenue: 2_300_000, expectedLift: 10, actualLift: null, incrementalRevenue: 0,
    attributedRevenue: 0, cannibalizedRevenue: 0, confidence: 71, minimumDetectableEffect: 5.5, recommendedDuration: 13,
    status: "Proposed", owner: "Ecommerce Analytics", decisionRule: "Scale to next emerging market if lift > 6%.",
    similarityFactors: [
      { factor: "Baseline ecommerce revenue", score: 82 }, { factor: "Persona mix", score: 80 },
      { factor: "Seasonality", score: 85 }, { factor: "External demand trend", score: 86 },
    ],
  },
];

// ───────────────────────────────────────────────────────────────────────────
// BACK-IN-STOCK & WAITLIST DEMAND
// ───────────────────────────────────────────────────────────────────────────
function buildWaitlist(): WaitlistDemand[] {
  const wr = new Rng("waitlist");
  const specs: { product: string; market: string; size: string; persona: PersonaName; sev: "High" | "Medium" | "Low" }[] = [
    { product: "Sunday Performance Jogger", market: "Denver", size: "M", persona: "Trail & Recovery", sev: "High" },
    { product: "Sunday Performance Jogger", market: "Salt Lake City", size: "L", persona: "Trail & Recovery", sev: "High" },
    { product: "Meta Pant", market: "New York", size: "M", persona: "Performance Commuter", sev: "High" },
    { product: "Daily Legging", market: "Los Angeles", size: "S", persona: "Studio Minimalist", sev: "High" },
    { product: "Canyon Insulated Jacket", market: "Denver", size: "L", persona: "Trail & Recovery", sev: "Medium" },
    { product: "Villa Wideleg", market: "Miami", size: "S", persona: "Travel Weekender", sev: "Medium" },
    { product: "Daily Legging", market: "Austin", size: "XS", persona: "Wellness Socialite", sev: "Medium" },
    { product: "Restore Half Zip", market: "Salt Lake City", size: "M", persona: "Trail & Recovery", sev: "Medium" },
    { product: "Cloudridge Lined Pant", market: "Denver", size: "L", persona: "Modern Dad Uniform", sev: "High" },
    { product: "Coastal Training Tank", market: "San Diego", size: "S", persona: "Coastal Active", sev: "Low" },
    { product: "Meta Pant", market: "Boston", size: "L", persona: "Performance Commuter", sev: "Medium" },
    { product: "Halo Essential Hoodie", market: "Seattle", size: "L", persona: "Premium Basics Loyalist", sev: "Low" },
  ];
  return specs.map((s, i) => {
    const prod = products.find((p) => p.productName === s.product)!;
    const waitlistSignups = s.sev === "High" ? wr.int(900, 2400) : s.sev === "Medium" ? wr.int(300, 850) : wr.int(80, 280);
    const backInStock = Math.round(waitlistSignups * wr.range(0.55, 0.78));
    const lost = s.sev === "High" ? wr.int(180000, 460000) : s.sev === "Medium" ? wr.int(60000, 160000) : wr.int(12000, 50000);
    const recoveryRate = wr.range(0.58, 0.78);
    return {
      waitlistId: `WL-${String(i + 1).padStart(3, "0")}`,
      date: dayOffset(-wr.int(1, 14)),
      productId: prod.productId,
      productName: s.product,
      category: prod.category,
      productLine: prod.productLine,
      color: prod.color,
      size: s.size,
      market: s.market,
      persona: s.persona,
      waitlistSignups,
      backInStockSignups: backInStock,
      pdpViewsWhileOutOfStock: Math.round(waitlistSignups * wr.range(6, 12)),
      cartAttemptsWhileOutOfStock: Math.round(waitlistSignups * wr.range(0.8, 1.6)),
      sizeAvailabilityRate: round(s.sev === "High" ? wr.range(0.28, 0.5) : s.sev === "Medium" ? wr.range(0.55, 0.75) : wr.range(0.8, 0.95), 2),
      estimatedLostRevenue: lost,
      expectedRecoveryRevenue: Math.round(lost * recoveryRate),
      expectedRecoveryRate: round(recoveryRate, 2),
      recommendedAction: s.sev === "High" ? "Prioritize replenishment + trigger back-in-stock SMS" : "Capture waitlist on PDP + recommend substitutes",
      priorityScore: round(clamp((lost / 4600) + waitlistSignups / 30 + (1 - (s.sev === "High" ? 0.4 : 0.7)) * 40, 0, 100), 0),
      lifecycleTrigger: "Back-in-stock SMS within 24h of replenishment",
      inventoryOwner: "Merch Planning",
      crmOwner: "Lifecycle CRM",
    } satisfies WaitlistDemand;
  }).sort((a, b) => b.estimatedLostRevenue - a.estimatedLostRevenue);
}
export const waitlistDemand = buildWaitlist();
export const waitlistRecoverable = waitlistDemand.reduce((s, w) => s + w.expectedRecoveryRevenue, 0);

// ───────────────────────────────────────────────────────────────────────────
// RETURNS, FIT & SIZE
// ───────────────────────────────────────────────────────────────────────────
function buildReturnsFit(): ReturnsFitData[] {
  const rr = new Rng("returns");
  const reasons: ReturnsFitData["reasonMix"][number]["reason"][] = [
    "Too small", "Too large", "Fit not as expected", "Color not as expected", "Fabric expectation mismatch",
    "Bought multiple sizes", "Style preference", "Quality issue", "Gift return", "Late delivery",
  ];
  const specs: { product: string; persona: PersonaName; topReason: ReturnsFitData["topReason"]; dir: "Up" | "Down" | "Balanced" }[] = [
    { product: "Daily Legging", persona: "Studio Minimalist", topReason: "Too small", dir: "Up" },
    { product: "Villa Wideleg", persona: "Travel Weekender", topReason: "Fit not as expected", dir: "Down" },
    { product: "Cloudridge Lined Pant", persona: "Trail & Recovery", topReason: "Too large", dir: "Down" },
    { product: "DreamKnit Layer", persona: "Travel Weekender", topReason: "Fabric expectation mismatch", dir: "Balanced" },
    { product: "Meta Pant", persona: "Performance Commuter", topReason: "Too small", dir: "Up" },
    { product: "Canyon Insulated Jacket", persona: "Trail & Recovery", topReason: "Bought multiple sizes", dir: "Balanced" },
    { product: "Kore Short", persona: "Coastal Active", topReason: "Style preference", dir: "Balanced" },
    { product: "Halo Essential Hoodie", persona: "Premium Basics Loyalist", topReason: "Gift return", dir: "Balanced" },
    { product: "Coastal Training Tank", persona: "Wellness Socialite", topReason: "Color not as expected", dir: "Balanced" },
    { product: "Sunday Performance Jogger", persona: "Modern Dad Uniform", topReason: "Too large", dir: "Down" },
  ];
  return specs.map((s) => {
    const prod = products.find((p) => p.productName === s.product)!;
    const returnRate = prod.returnRate;
    const refundAmount = Math.round(prod.revenue * returnRate);
    const marginLoss = Math.round(refundAmount * prod.marginRate + refundAmount * 0.08);
    const reasonMix = reasons
      .map((reason) => ({ reason, share: reason === s.topReason ? rr.range(0.26, 0.4) : rr.range(0.02, 0.12) }))
      .sort((a, b) => b.share - a.share)
      .slice(0, 5);
    const reasonTotal = reasonMix.reduce((a, b) => a + b.share, 0);
    reasonMix.forEach((m) => (m.share = round(m.share / reasonTotal, 2)));
    const sizeGuideReduction = round(rr.range(12, 22), 0);
    const preventable = Math.round(refundAmount * rr.range(0.22, 0.4));
    return {
      productId: prod.productId,
      productName: s.product,
      category: prod.category,
      productLine: prod.productLine,
      persona: s.persona,
      returnRate,
      exchangeRate: round(returnRate * rr.range(0.3, 0.5), 3),
      topReason: s.topReason,
      reasonMix,
      sizeExchangeDirection: s.dir,
      refundAmount,
      marginLoss,
      fitRiskScore: round(clamp(returnRate * 480 + (s.topReason.includes("small") || s.topReason.includes("large") ? 18 : 4) + rr.normal(0, 4), 10, 95), 0),
      sizeGuideUsedRate: round(rr.range(0.18, 0.42), 2),
      sizeGuideReturnReduction: sizeGuideReduction,
      reviewSentiment: round(rr.range(0.45, 0.78), 2),
      preventableReturnEstimate: preventable,
      returnAdjustedGrossProfit: returnAdjustedGrossProfit({ revenue: prod.revenue, marginRate: prod.marginRate, returnRate }),
      recommendedAction: returnRate > 0.12 ? "Add fit guidance + review snippets on PDP; suppress in paid acquisition" : "Monitor; protect return-adjusted margin",
    } satisfies ReturnsFitData;
  }).sort((a, b) => b.marginLoss - a.marginLoss);
}
export const returnsFitData = buildReturnsFit();

// ───────────────────────────────────────────────────────────────────────────
// CREATIVE INTELLIGENCE
// ───────────────────────────────────────────────────────────────────────────
function buildCreative(): CreativePerformance[] {
  const cr = new Rng("creative");
  const specs: { theme: CreativePerformance["creativeTheme"]; channel: ChannelSummary["channel"]; market: string; persona: PersonaName; product: string; strong: boolean }[] = [
    { theme: "Work-to-weekend", channel: "Paid Search", market: "Boston", persona: "Performance Commuter", product: "Meta Pant", strong: true },
    { theme: "Softness / comfort", channel: "Paid Social", market: "Los Angeles", persona: "Studio Minimalist", product: "DreamKnit Layer", strong: true },
    { theme: "Travel", channel: "Email", market: "New York", persona: "Travel Weekender", product: "Villa Wideleg", strong: true },
    { theme: "Outdoor recovery", channel: "Affiliate", market: "Denver", persona: "Trail & Recovery", product: "Restore Half Zip", strong: true },
    { theme: "Coastal lifestyle", channel: "Influencer", market: "Miami", persona: "Coastal Active", product: "Coastal Training Tank", strong: false },
    { theme: "Performance", channel: "Paid Social", market: "Austin", persona: "Performance Commuter", product: "Sunday Performance Jogger", strong: true },
    { theme: "Studio-to-street", channel: "Paid Social", market: "Austin", persona: "Wellness Socialite", product: "Daily Legging", strong: false },
    { theme: "Premium basics", channel: "Email", market: "San Francisco", persona: "Premium Basics Loyalist", product: "Strato Tech Tee", strong: true },
    { theme: "Giftability", channel: "Paid Search", market: "Chicago", persona: "Gift Giver", product: "Halo Essential Hoodie", strong: false },
    { theme: "New color drop", channel: "SMS", market: "Nashville", persona: "Wellness Socialite", product: "Villa Wideleg", strong: false },
    { theme: "Travel", channel: "Paid Social", market: "Miami", persona: "Travel Weekender", product: "Transit Commuter Shirt", strong: false },
    { theme: "Outdoor recovery", channel: "Paid Search", market: "Salt Lake City", persona: "Trail & Recovery", product: "Canyon Insulated Jacket", strong: true },
  ];
  return specs.map((s, i) => {
    const impressions = cr.int(280000, 1400000);
    const ctr = round((s.strong ? cr.range(0.012, 0.02) : cr.range(0.006, 0.012)), 4);
    const clicks = Math.round(impressions * ctr);
    const conversionRate = round((s.strong ? cr.range(0.03, 0.05) : cr.range(0.018, 0.032)), 4);
    const orders = Math.round(clicks * conversionRate);
    const aov = cr.range(128, 162);
    const revenue = Math.round(orders * aov);
    const newCustomers = Math.round(orders * cr.range(0.5, 0.7));
    const cac = Math.round((revenue * 0.22) / Math.max(1, newCustomers));
    const cqs = round(clamp((s.strong ? 80 : 70) + cr.normal(0, 4), 58, 92), 0);
    const returnRate = round(cr.range(0.07, 0.13), 2);
    return {
      creativeId: `CRV-${String(i + 1).padStart(3, "0")}`,
      creativeTheme: s.theme,
      channel: s.channel,
      market: s.market,
      persona: s.persona,
      productFocus: s.product,
      impressions,
      clicks,
      ctr,
      conversionRate,
      revenue,
      newCustomers,
      customerQualityScore: cqs,
      cac,
      roas: round(revenue / (revenue * 0.22), 2),
      ltvCac: round((cqs * 6) / cac, 2),
      returnRate,
      marginAfterReturns: returnAdjustedGrossProfit({ revenue, marginRate: 0.585, returnRate }),
      recommendedAction: s.strong ? "Scale spend + expand to similar personas/markets" : "Iterate creative or reallocate budget",
    } satisfies CreativePerformance;
  });
}
export const creativePerformance = buildCreative();

// ───────────────────────────────────────────────────────────────────────────
// ONSITE SEARCH & INTENT
// ───────────────────────────────────────────────────────────────────────────
function buildSearchIntent(): OnsiteSearchIntent[] {
  const sr = new Rng("searchintent");
  const specs: { query: string; intent: string; persona: PersonaName; products: string[]; gap: boolean; market: string; trend: number }[] = [
    { query: "travel pants", intent: "Travel & commuter bottoms", persona: "Travel Weekender", products: ["Villa Wideleg", "Meta Pant"], gap: true, market: "Boston", trend: 46 },
    { query: "work pants", intent: "Commuter / workwear bottoms", persona: "Performance Commuter", products: ["Meta Pant"], gap: true, market: "New York", trend: 38 },
    { query: "pilates set", intent: "Matching studio set", persona: "Studio Minimalist", products: ["Daily Legging"], gap: false, market: "Los Angeles", trend: 29 },
    { query: "running shorts", intent: "Run / training shorts", persona: "Performance Commuter", products: ["Kore Short"], gap: false, market: "Austin", trend: 22 },
    { query: "soft hoodie", intent: "Comfort layering", persona: "Premium Basics Loyalist", products: ["Halo Essential Hoodie", "DreamKnit Layer"], gap: false, market: "Seattle", trend: 18 },
    { query: "golf polo", intent: "Performance polo", persona: "Modern Dad Uniform", products: ["Strato Tech Polo"], gap: true, market: "Dallas", trend: 31 },
    { query: "airport outfit", intent: "Travel comfort set", persona: "Travel Weekender", products: ["Villa Wideleg", "Halo Essential Hoodie"], gap: true, market: "New York", trend: 41 },
    { query: "cold weather jogger", intent: "Insulated bottoms", persona: "Trail & Recovery", products: ["Cloudridge Lined Pant", "Sunday Performance Jogger"], gap: false, market: "Denver", trend: 34 },
    { query: "gift for dad", intent: "Gifting", persona: "Gift Giver", products: ["Halo Essential Hoodie", "Meta Pant"], gap: false, market: "Chicago", trend: 12 },
    { query: "matching set", intent: "Studio set", persona: "Wellness Socialite", products: ["Daily Legging", "Coastal Training Tank"], gap: false, market: "Austin", trend: 27 },
    { query: "lightweight layers", intent: "Transitional layering", persona: "Travel Weekender", products: ["DreamKnit Layer"], gap: true, market: "San Diego", trend: 24 },
    { query: "wideleg pants", intent: "Wide-leg silhouette", persona: "Studio Minimalist", products: ["Villa Wideleg"], gap: false, market: "Miami", trend: 33 },
    { query: "recovery hoodie", intent: "Recovery / mobility", persona: "Trail & Recovery", products: ["Restore Half Zip", "Halo Essential Hoodie"], gap: true, market: "Salt Lake City", trend: 36 },
  ];
  return specs.map((s, i) => {
    const sessions = sr.int(4200, 38000);
    const conversionRate = round(s.gap ? sr.range(0.018, 0.03) : sr.range(0.035, 0.06), 4);
    const orders = Math.round(sessions * conversionRate);
    return {
      searchId: `SQ-${String(i + 1).padStart(3, "0")}`,
      query: s.query,
      normalizedIntent: s.intent,
      market: s.market,
      resultCount: s.gap ? sr.int(0, 6) : sr.int(8, 40),
      sessions,
      productViews: Math.round(sessions * sr.range(0.5, 0.7)),
      addToCart: Math.round(orders * sr.range(1.6, 2.4)),
      conversionRate,
      revenue: Math.round(orders * sr.range(130, 158)),
      zeroResultRate: round(s.gap ? sr.range(0.18, 0.4) : sr.range(0.0, 0.06), 3),
      relatedPersona: s.persona,
      relatedProducts: s.products,
      recommendedAction: s.gap ? `Create a curated "${s.intent}" landing page and test vs search results` : "Surface intent earlier in onsite merchandising",
      contentGap: s.gap,
      demandSignalScore: round(clamp(s.trend * 1.4 + sessions / 600, 0, 100), 0),
      trend: s.trend,
    } satisfies OnsiteSearchIntent;
  }).sort((a, b) => b.demandSignalScore - a.demandSignalScore);
}
export const onsiteSearchIntent = buildSearchIntent();

// ───────────────────────────────────────────────────────────────────────────
// PRODUCT LAUNCH INTELLIGENCE
// ───────────────────────────────────────────────────────────────────────────
function launchCurve(rng: Rng, beat: number): { week: number; planned: number; actual: number }[] {
  return Array.from({ length: 8 }, (_, w) => {
    const planned = round(100 * (1 - Math.exp(-0.4 * (w + 1))), 0);
    return { week: w + 1, planned, actual: round(clamp(planned * (1 + beat / 100) * clamp(rng.normal(1, 0.04), 0.9, 1.1), 0, 100), 0) };
  });
}
export const productLaunches: ProductLaunch[] = (() => {
  const lr = new Rng("launches");
  const specs: { name: string; products: string[]; persona: PersonaName; beat: number; markets: string[]; risk: "Low" | "Medium" | "High"; cqs: number }[] = [
    { name: "Travel Weekender Capsule", products: ["Villa Wideleg", "DreamKnit Layer", "Transit Commuter Shirt"], persona: "Travel Weekender", beat: 18, markets: ["New York", "Miami", "Austin"], risk: "Medium", cqs: 79 },
    { name: "DreamKnit Comfort Layer", products: ["DreamKnit Layer"], persona: "Studio Minimalist", beat: 11, markets: ["Denver", "Boston", "Seattle"], risk: "Low", cqs: 82 },
    { name: "Cloudridge Trail Bottoms", products: ["Cloudridge Lined Pant"], persona: "Trail & Recovery", beat: -7, markets: ["Salt Lake City", "Denver"], risk: "High", cqs: 74 },
    { name: "Strato Performance Polo", products: ["Strato Tech Polo"], persona: "Modern Dad Uniform", beat: 6, markets: ["Dallas", "Chicago"], risk: "Low", cqs: 77 },
  ];
  return specs.map((s, i) => {
    const forecastRevenue = lr.int(1_400_000, 3_200_000);
    const actualRevenue = Math.round(forecastRevenue * (1 + s.beat / 100));
    const newShare = round(s.beat > 12 ? lr.range(0.24, 0.34) : lr.range(0.3, 0.46), 2);
    return {
      launchId: `LN-${String(i + 1).padStart(3, "0")}`,
      launchName: s.name,
      launchDate: dayOffset(-lr.int(30, 140)),
      productIds: s.products.map((n) => products.find((p) => p.productName === n)?.productId ?? n),
      category: products.find((p) => p.productName === s.products[0])?.category ?? "Bottoms",
      forecastRevenue,
      actualRevenue,
      forecastAccuracy: round(100 - Math.abs(s.beat) * 0.9, 1),
      newCustomerContribution: newShare,
      repeatCustomerContribution: round(1 - newShare, 2),
      sellThroughRate: round(clamp(0.6 + s.beat / 200 + lr.normal(0, 0.05), 0.35, 0.95), 2),
      sizeAvailabilityRate: round(s.risk === "High" ? lr.range(0.45, 0.65) : lr.range(0.7, 0.95), 2),
      returnRate: round(lr.range(0.07, 0.13), 2),
      grossMargin: Math.round(actualRevenue * 0.585),
      marketingSpend: Math.round(actualRevenue * lr.range(0.18, 0.26)),
      primaryPersona: s.persona,
      topMarkets: s.markets,
      inventoryRisk: s.risk,
      customerQualityScore: s.cqs,
      recommendedAction: s.beat < 0 ? "Hold incremental buy; reassess demand" : newShare < 0.3 ? "Shift creative to new-customer acquisition; protect XS/S inventory" : "Scale — strong, balanced demand",
      sellThroughCurve: launchCurve(lr, s.beat),
    } satisfies ProductLaunch;
  });
})();

// ───────────────────────────────────────────────────────────────────────────
// WEATHER-TRIGGERED DEMAND
// ───────────────────────────────────────────────────────────────────────────
export const weatherDemandTriggers: WeatherDemandTrigger[] = (() => {
  const wr = new Rng("weather");
  const specs: { market: string; event: string; tempChange: number; precip: number; category: WeatherDemandTrigger["productCategory"]; products: string[]; lift: number; urgency: "High" | "Medium" | "Low"; channel: string; message: string }[] = [
    { market: "Denver", event: "Cold front (−12°F)", tempChange: -12, precip: 30, category: "Outerwear", products: ["Canyon Insulated Jacket", "Restore Half Zip", "Sunday Performance Jogger"], lift: 18, urgency: "High", channel: "Email · SMS · Paid Social", message: "Recovery layers + cold-weather joggers" },
    { market: "Austin", event: "Heat wave (+9°F)", tempChange: 9, precip: 5, category: "Shorts", products: ["Kore Short", "Coastal Training Tank", "Strato Tech Tee"], lift: 14, urgency: "Medium", channel: "Paid Social · Onsite", message: "Lightweight tees + shorts for the heat" },
    { market: "Miami", event: "Resort season onset", tempChange: 4, precip: 8, category: "Tops", products: ["Coastal Training Tank", "Villa Wideleg"], lift: 12, urgency: "Medium", channel: "Email · Influencer", message: "Travel & coastal capsule" },
    { market: "Seattle", event: "Rainy stretch (10 days)", tempChange: -3, precip: 78, category: "Layers", products: ["Halo Essential Hoodie", "DreamKnit Layer", "Restore Half Zip"], lift: 11, urgency: "Medium", channel: "Email · Onsite", message: "Comfort, lounge, and layering" },
    { market: "Salt Lake City", event: "Ski season open", tempChange: -8, precip: 55, category: "Layers", products: ["Restore Half Zip", "Canyon Insulated Jacket"], lift: 16, urgency: "High", channel: "Paid Search · Email", message: "Recovery & cold-weather layers" },
    { market: "Boston", event: "First freeze", tempChange: -10, precip: 20, category: "Outerwear", products: ["Canyon Insulated Jacket", "Meta Pant"], lift: 13, urgency: "Medium", channel: "Email · SMS", message: "Commuter layers for the cold" },
  ];
  return specs.map((s, i) => ({
    triggerId: `WX-${String(i + 1).padStart(3, "0")}`,
    date: dayOffset(-wr.int(0, 5)),
    market: s.market,
    weatherEvent: s.event,
    temperatureChange: s.tempChange,
    precipitationIndex: s.precip,
    productCategory: s.category,
    recommendedProducts: s.products,
    expectedDemandLift: s.lift,
    recommendedChannel: s.channel,
    recommendedMessage: s.message,
    urgency: s.urgency,
    confidence: round(wr.range(70, 84), 0),
    owner: "Growth / Lifecycle",
    expectedRevenueImpact: wr.int(60000, 240000),
  }));
})();

// ───────────────────────────────────────────────────────────────────────────
// DIGITAL SHELF / PDP QUALITY
// ───────────────────────────────────────────────────────────────────────────
function buildPdpQuality(): PdpQuality[] {
  const pr = new Rng("pdp");
  return products.map((prod) => {
    const traffic = Math.round(prod.unitsSold * pr.range(7, 14));
    const fitClarity = round(clamp(82 - prod.returnRate * 220 + pr.normal(0, 5), 30, 95), 0);
    const imageCompleteness = round(clamp(70 + pr.normal(0, 14), 40, 98), 0);
    const video = pr.chance(0.45);
    const reviewCount = pr.int(40, 1400);
    const reviewRating = round(pr.range(4.1, 4.8), 1);
    const descQuality = round(clamp(72 + pr.normal(0, 12), 45, 95), 0);
    const loadSpeed = round(clamp(74 + pr.normal(0, 12), 45, 96), 0);
    const score = round(
      clamp(
        imageCompleteness * 0.16 + (video ? 100 : 55) * 0.1 + clamp(reviewCount / 14, 0, 100) * 0.12 +
          (reviewRating / 5) * 100 * 0.1 + fitClarity * 0.16 + descQuality * 0.1 + prod.sellThrough * 100 * 0.06 +
          loadSpeed * 0.1 + (100 - prod.returnRate * 400) * 0.1,
        25,
        98,
      ),
      0,
    );
    return {
      productId: prod.productId,
      productName: prod.productName,
      traffic,
      conversionRate: round(clamp(0.02 + (score - 60) * 0.0006 + pr.normal(0, 0.003), 0.012, 0.06), 4),
      addToCartRate: round(clamp(0.18 + (score - 60) * 0.002, 0.1, 0.34), 3),
      imageCompletenessScore: imageCompleteness,
      videoAvailable: video,
      reviewCount,
      reviewRating,
      fitClarityScore: fitClarity,
      sizeGuideEngagement: round(pr.range(0.14, 0.4), 2),
      descriptionQualityScore: descQuality,
      colorAvailabilityRate: round(pr.range(0.7, 0.98), 2),
      sizeAvailabilityRate: round(pr.range(0.6, 0.97), 2),
      loadSpeedScore: loadSpeed,
      returnRate: prod.returnRate,
      pdpQualityScore: score,
      revenueOpportunity: Math.round((85 - score) > 0 ? (85 - score) * traffic * 0.9 : traffic * 0.4),
      recommendedAction: score < 70 ? "Fix PDP: fit clarity + visual merchandising + review snippets" : score < 80 ? "Enhance fit guidance & add video" : "Maintain — strong digital shelf",
    } satisfies PdpQuality;
  }).sort((a, b) => a.pdpQualityScore - b.pdpQualityScore);
}
export const pdpQuality = buildPdpQuality();

// ───────────────────────────────────────────────────────────────────────────
// EXECUTIVE ALERTS
// ───────────────────────────────────────────────────────────────────────────
export const executiveAlerts: ExecutiveAlert[] = [
  {
    alertId: "AL-001", type: "Market opportunity signal", severity: "Opportunity",
    title: "Austin demand signal rising faster than revenue capture",
    businessImpact: "+$740K potential 90-day revenue", rootCause: "Search/social demand accelerating ahead of localized presence",
    recommendedAction: "Approve localized Austin activation test", owner: "Ecommerce / Brand Marketing",
    evidence: ["Opportunity score 91", "Traffic +33% YoY", "Wellness/run density over-index"],
    measurementPlan: "Matched-market test vs Nashville, SLC, Denver", page: "/market-opportunity",
  },
  {
    alertId: "AL-002", type: "Inventory cap", severity: "Revenue at Risk",
    title: "Sunday Performance Jogger size breaks suppressing mountain-market revenue",
    businessImpact: "$420K recoverable", rootCause: "Men's M/L stockouts in Denver & Salt Lake City",
    recommendedAction: "Replenish and trigger back-in-stock flow", owner: "Merchandising / Planning / CRM",
    evidence: ["Waitlist signups rising", "Size availability < 45%", "PDP views while OOS elevated"],
    measurementPlan: "Track recovered revenue vs baseline stockouts", page: "/merchandising",
  },
  {
    alertId: "AL-003", type: "New customer quality decline", severity: "Watch",
    title: "Paid social new-customer volume up, quality down",
    businessImpact: "LTV:CAC deterioration risk", rootCause: "Prospecting expansion reaching lower-quality cohorts",
    recommendedAction: "Shift optimization toward Customer Quality Score", owner: "Growth Marketing",
    evidence: ["Paid social CQS 71 vs blended 78", "Return rate +1.4pts", "Repeat probability softening"],
    measurementPlan: "Geo holdout on value-based bidding", page: "/marketing-efficiency",
  },
  {
    alertId: "AL-004", type: "Demand surge", severity: "Opportunity",
    title: "DreamKnit demand accelerating in cold-weather markets",
    businessImpact: "+$310K 60-day revenue", rootCause: "Search & social velocity rising in Denver, Boston, Chicago, Seattle",
    recommendedAction: "Launch localized layering lifecycle + paid social", owner: "Growth / Lifecycle",
    evidence: ["Search velocity +41%", "Sentiment rising", "Persona fit: Travel Weekender"],
    measurementPlan: "Matched-market creative test", page: "/external-demand",
  },
  {
    alertId: "AL-005", type: "Conversion anomaly", severity: "Revenue at Risk",
    title: "Mobile PDP load time dragging conversion",
    businessImpact: "$680K / month at risk", rootCause: "Mobile PDP image load correlates with bounce",
    recommendedAction: "Ship mobile PDP performance fix", owner: "Ecommerce Tech",
    evidence: ["Mobile 62% of sessions, −38% vs desktop conv.", "PDP→cart drop-off concentrated on mobile"],
    measurementPlan: "Before/after phased rollout", page: "/conversion-funnel",
  },
  {
    alertId: "AL-006", type: "Product launch under-performance", severity: "Watch",
    title: "Cloudridge Trail Bottoms reading below forecast",
    businessImpact: "−7% vs launch plan", rootCause: "Soft early sell-through + size availability gaps",
    recommendedAction: "Hold incremental buy; reassess demand", owner: "Merch Analytics",
    evidence: ["Early-read −7% vs plan", "Size availability 45–65%"],
    measurementPlan: "Launch early-read vs comparable curves", page: "/merchandising",
  },
];

export const incrementalRevenueIdentified = experiments.reduce((s, e) => s + e.incrementalRevenue, 0);
