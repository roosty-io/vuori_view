// Deterministic scoring models surfaced in the UI (with transparent inputs).

import { clamp, round } from "@/data/seed";
import type { EventType } from "@/data/types";

// ── Event ROI model ─────────────────────────────────────────────────────────
export interface EventInputs {
  eventDurationDays: number;
  eventCost: number;
  expectedAttendance: number;
  leadCaptureRate: number; // 0..1
  localMediaSpend: number;
  partnerCount: number;
  promoDepth: number; // 0..1
  followUpIntensity: number; // 0..1
  conversionRate: number; // event-period conversion, 0..1
  aov: number;
  postEventConversionRate: number; // 0..1
}

export interface EventOutputs {
  eventRevenue: number;
  leadsCaptured: number;
  newCustomers: number;
  cac: number;
  haloRevenue30d: number;
  haloRevenue60d: number;
  haloRevenue90d: number;
  projectedRoi: number;
  totalRevenue: number;
  confidence: number;
}

export function computeEventRoi(i: EventInputs): EventOutputs {
  const attendance = i.expectedAttendance * (1 + (i.eventDurationDays - 1) * 0.28);
  const promoUplift = 1 + i.promoDepth * 0.35;
  const eventRevenue = Math.round(attendance * i.conversionRate * i.aov * promoUplift);

  const leadsCaptured = Math.round(attendance * (1 + (i.eventDurationDays - 1) * 0.45) * i.leadCaptureRate * (1 + i.partnerCount * 0.04));

  const followUpMultiplier = 2.6 + i.followUpIntensity * 2.4; // 90-day compounding
  const predictedAov = i.aov * 1.05;
  const haloRevenue90d = Math.round(
    leadsCaptured * i.postEventConversionRate * predictedAov * followUpMultiplier,
  );
  const haloRevenue30d = Math.round(haloRevenue90d * 0.42);
  const haloRevenue60d = Math.round(haloRevenue90d * 0.74);

  const newCustomers = Math.round(leadsCaptured * (0.24 + i.followUpIntensity * 0.1));
  const totalInvestment = i.eventCost + i.localMediaSpend;
  const cac = newCustomers > 0 ? Math.round(totalInvestment / newCustomers) : 0;
  const projectedRoi = round((eventRevenue + haloRevenue90d - totalInvestment) / totalInvestment, 2);
  const totalRevenue = eventRevenue + haloRevenue90d;

  // Confidence: higher with more partners, follow-up, and reasonable promo.
  const confidence = round(
    clamp(
      66 + i.partnerCount * 2.5 + i.followUpIntensity * 14 - Math.abs(i.promoDepth - 0.35) * 20 + (i.eventDurationDays - 1) * 2,
      52,
      92,
    ),
    0,
  );

  return {
    eventRevenue,
    leadsCaptured,
    newCustomers,
    cac,
    haloRevenue30d,
    haloRevenue60d,
    haloRevenue90d,
    projectedRoi,
    totalRevenue,
    confidence,
  };
}

/** Event-period conversion + AOV priors by event type. */
export const EVENT_TYPE_PRIORS: Record<EventType, { conversionRate: number; aov: number; leadCaptureRate: number }> = {
  "Run club event": { conversionRate: 0.62, aov: 148, leadCaptureRate: 0.72 },
  "Yoga/pilates studio takeover": { conversionRate: 0.58, aov: 138, leadCaptureRate: 0.68 },
  "Surf/coastal wellness activation": { conversionRate: 0.55, aov: 132, leadCaptureRate: 0.64 },
  "Outdoor trail event": { conversionRate: 0.6, aov: 158, leadCaptureRate: 0.66 },
  "Shopping pop-up": { conversionRate: 0.66, aov: 142, leadCaptureRate: 0.58 },
  "Product launch preview": { conversionRate: 0.64, aov: 156, leadCaptureRate: 0.7 },
  "Ambassador/community event": { conversionRate: 0.57, aov: 140, leadCaptureRate: 0.74 },
  "Recovery studio partnership": { conversionRate: 0.59, aov: 146, leadCaptureRate: 0.7 },
};

// ── Persona confidence (behavioral signal matching) ─────────────────────────
export interface PersonaSignalWeights {
  categoryViews: number;
  productViews: number;
  viewedColors: number;
  market: number;
  acquisitionChannel: number;
  landingPage: number;
  searchTerms: number;
  emailSmsEngagement: number;
  cartBehavior: number;
  eventRsvp: number;
}

export const PERSONA_SIGNAL_LABELS: { key: keyof PersonaSignalWeights; label: string }[] = [
  { key: "categoryViews", label: "Category views" },
  { key: "productViews", label: "Product views" },
  { key: "viewedColors", label: "Viewed colors" },
  { key: "market", label: "Market" },
  { key: "acquisitionChannel", label: "Acquisition channel" },
  { key: "landingPage", label: "Landing page" },
  { key: "searchTerms", label: "Search terms" },
  { key: "emailSmsEngagement", label: "Email / SMS engagement" },
  { key: "cartBehavior", label: "Cart behavior" },
  { key: "eventRsvp", label: "Event RSVP" },
];

// ── Commission strategy model (Community Commerce Lab) ──────────────────────
export interface CommissionInputs {
  baseRevenue: number;
  baseNewCustomers: number;
  baseLeads: number;
  commissionRate: number; // 0..1
  newCustomerBonus: number; // $ per new customer
  leadBonus: number; // $ per lead
  marginRate: number; // 0..1
  returnRate: number; // 0..1
  ltvPerCustomer: number;
  returnAdjusted: boolean;
}

export interface CommissionOutputs {
  revenue: number;
  creatorPayout: number;
  grossMargin: number;
  marginAfterCommission: number;
  marginAfterCommissionRate: number; // %
  newCustomers: number;
  leads: number;
  projectedLtv: number;
  effectiveCommissionRate: number; // %
}

/**
 * Models a creator/affiliate commission structure. Richer incentives lift
 * creator effort (more revenue & new customers) but compress margin per dollar.
 */
export function computeCommission(i: CommissionInputs): CommissionOutputs {
  const incentiveRichness =
    (i.commissionRate - 0.1) * 1.1 + i.newCustomerBonus * 0.0016 + i.leadBonus * 0.004;
  const effortLift = clamp(incentiveRichness, -0.12, 0.3);

  const revenue = Math.round(i.baseRevenue * (1 + effortLift));
  const newCustomers = Math.round(i.baseNewCustomers * (1 + effortLift * 1.25));
  const leads = Math.round(i.baseLeads * (1 + effortLift * 0.8));

  const commissionableRevenue = i.returnAdjusted ? revenue * (1 - i.returnRate) : revenue;
  const creatorPayout = Math.round(
    commissionableRevenue * i.commissionRate + newCustomers * i.newCustomerBonus + leads * i.leadBonus,
  );
  const grossMargin = Math.round(revenue * i.marginRate);
  const marginAfterCommission = grossMargin - creatorPayout;
  const projectedLtv = Math.round(newCustomers * i.ltvPerCustomer);

  return {
    revenue,
    creatorPayout,
    grossMargin,
    marginAfterCommission,
    marginAfterCommissionRate: round((marginAfterCommission / revenue) * 100, 1),
    newCustomers,
    leads,
    projectedLtv,
    effectiveCommissionRate: round((creatorPayout / revenue) * 100, 1),
  };
}

// ── AI use case priority (re-stated for the methodology panel) ──────────────
export const AI_PRIORITY_FORMULA =
  "priorityScore = businessImpact·0.35 + dataReadiness·0.25 + confidence·0.20 + timeToValue·0.10 + feasibility·0.10";

export function statusTone(
  status: string,
): "positive" | "warning" | "negative" | "info" | "neutral" | "sage" {
  switch (status) {
    case "Ahead of Plan":
    case "High Confidence":
    case "Ready to Scale":
    case "Data Ready":
    case "On Track":
    case "Top Performer":
      return "positive";
    case "Watch":
    case "Needs Test":
    case "In Test":
    case "POC Candidate":
    case "Human Approval Required":
      return "warning";
    case "At Risk":
    case "Not Recommended Yet":
      return "negative";
    case "Opportunity":
    case "Ready for POC":
    case "Active":
      return "sage";
    case "Discovery":
    case "Needs Data":
    case "Proposed":
      return "info";
    default:
      return "neutral";
  }
}
