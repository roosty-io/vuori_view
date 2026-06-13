// ───────────────────────────────────────────────────────────────────────────
// Domain types for Vuori View synthetic commercial-intelligence data.
// ───────────────────────────────────────────────────────────────────────────

export type Channel =
  | "Paid Search"
  | "Paid Social"
  | "Affiliate"
  | "Influencer"
  | "Email"
  | "SMS"
  | "Organic Search"
  | "Direct"
  | "Retail Halo"
  | "Brand Campaigns";

export type Device = "Mobile" | "Desktop" | "Tablet";

export type NewVsRepeat = "New" | "Repeat";

export type ProductCategory =
  | "Bottoms"
  | "Tops"
  | "Outerwear"
  | "Layers"
  | "Shorts"
  | "Dresses"
  | "Accessories";

export type ProductLine =
  | "Performance"
  | "Studio"
  | "Travel"
  | "Trail"
  | "Coastal"
  | "Essentials";

export type Status =
  | "Ahead of Plan"
  | "On Track"
  | "Watch"
  | "Opportunity"
  | "At Risk"
  | "Needs Test"
  | "Ready for POC"
  | "Human Approval Required"
  | "High Confidence"
  | "Data Ready";

export type ScenarioName =
  | "Base Case"
  | "Aggressive Growth"
  | "Margin Protection"
  | "Inventory Constrained"
  | "Localized Activation Push";

export type PersonaName =
  | "Performance Commuter"
  | "Coastal Active"
  | "Studio Minimalist"
  | "Trail & Recovery"
  | "Travel Weekender"
  | "Modern Dad Uniform"
  | "Wellness Socialite"
  | "Gift Giver"
  | "Premium Basics Loyalist"
  | "New Explorer";

export interface Order {
  orderId: string;
  customerId: string;
  orderDate: string; // ISO date
  channel: Channel;
  market: string;
  country: string;
  device: Device;
  revenue: number;
  discount: number;
  grossMargin: number;
  productCategory: ProductCategory;
  productLine: ProductLine;
  productId: string;
  quantity: number;
  newVsRepeat: NewVsRepeat;
  persona: PersonaName;
  campaignId?: string;
}

export interface Customer {
  customerId: string;
  firstOrderDate: string;
  acquisitionChannel: Channel;
  market: string;
  country: string;
  persona: PersonaName;
  genderPreference: "Women" | "Men" | "Unisex";
  predictedLtv: number;
  churnRisk: number; // 0..1
  totalOrders: number;
  totalRevenue: number;
  preferredColors: string[];
  preferredActivities: string[];
  promoSensitivity: number; // 0..1
  returnRisk: number; // 0..1
}

export interface SessionRow {
  date: string;
  market: string;
  channel: Channel;
  device: Device;
  sessions: number;
  productViews: number;
  addToCart: number;
  checkoutStarts: number;
  orders: number;
  conversionRate: number;
  bounceRate: number;
  avgSessionDuration: number; // seconds
  newVisitorRate: number;
}

export interface MarketingSpendRow {
  date: string;
  channel: Channel;
  campaign: string;
  market: string;
  spend: number;
  impressions: number;
  clicks: number;
  attributedRevenue: number;
  newCustomers: number;
  cac: number;
  roas: number;
  merContribution: number;
  personaFocus: PersonaName;
}

export type ProductRole =
  | "Hero"
  | "Driver"
  | "Replenishment"
  | "Newness"
  | "Margin"
  | "Seasonal";

export interface Product {
  productId: string;
  productName: string;
  category: ProductCategory;
  productLine: ProductLine;
  gender: "Women" | "Men" | "Unisex";
  color: string;
  size: string;
  launchDate: string;
  price: number;
  cost: number;
  marginRate: number;
  returnRate: number;
  productRole: ProductRole;
  personaAffinity: PersonaName[];
  // Derived demand metrics for merchandising views
  revenue: number;
  unitsSold: number;
  velocity: number; // units / week
  sellThrough: number; // 0..1
  recommendation: "Push" | "Hold" | "Replenish" | "Localize" | "Protect";
}

export interface InventoryRow {
  date: string;
  productId: string;
  productName: string;
  market: string;
  size: string;
  inventoryUnits: number;
  daysOfCover: number;
  stockoutFlag: boolean;
  sizeAvailabilityRate: number;
  lostRevenueEstimate: number;
  riskLevel: "Low" | "Medium" | "High";
}

export interface StoreRow {
  storeId: string;
  market: string;
  country: string;
  openingDate: string;
  storeRevenue: number;
  ecommerceRevenueNearby: number;
  haloLiftEstimate: number;
  maturityStage: "Pre-Open" | "Ramp" | "Growth" | "Mature";
  nearbyCustomerOverlap: number;
}

export interface ForecastPoint {
  date: string;
  forecastRevenue: number;
  actualRevenue: number | null;
  planRevenue: number;
  lowerBound: number;
  upperBound: number;
  forecastError: number | null;
  scenario: ScenarioName;
  driverNotes?: string;
}

export interface ExternalSignalRow {
  date: string;
  market: string;
  country: string;
  weatherIndex: number;
  consumerConfidenceIndex: number;
  competitorPromoIntensity: number;
  holidayFlag: boolean;
  seasonalityIndex: number;
  eventDensity: number;
  wellnessTrendIndex: number;
}

export interface MarketSignal {
  date: string;
  market: string;
  dma: string;
  country: string;
  ecommerceRevenue: number;
  ecommerceTraffic: number;
  ecommerceTrafficGrowth: number; // YoY %
  conversionRate: number;
  repeatPurchaseRate: number;
  emailSubscribers: number;
  smsSubscribers: number;
  searchDemandIndex: number;
  socialMentionIndex: number;
  socialMentionVelocity: number;
  competitorIntensityIndex: number;
  wellnessStudioDensity: number;
  runClubDensity: number;
  outdoorActivityIndex: number;
  incomeIndex: number;
  weatherIndex: number;
  retailProximityScore: number;
  wholesalePresenceScore: number;
  personaFit: number;
  opportunityScore: number;
  recommendedAction: string;
  topPersonas: PersonaName[];
  lat: number;
  lng: number;
  revenueRank: number;
}

export type EventType =
  | "Run club event"
  | "Yoga/pilates studio takeover"
  | "Surf/coastal wellness activation"
  | "Outdoor trail event"
  | "Shopping pop-up"
  | "Product launch preview"
  | "Ambassador/community event"
  | "Recovery studio partnership";

export interface EventRow {
  eventId: string;
  market: string;
  eventType: EventType;
  partnerType: string;
  eventDate: string;
  cost: number;
  expectedAttendance: number;
  actualAttendance: number;
  leadsCaptured: number;
  eventRevenue: number;
  haloRevenue30d: number;
  haloRevenue60d: number;
  haloRevenue90d: number;
  newCustomers: number;
  repeatCustomers: number;
  projectedRoi: number;
  actualRoi: number;
  recommendedProducts: string[];
  recommendedLifecycleFlow: string;
}

export interface Persona {
  personaId: string;
  personaName: PersonaName;
  description: string;
  primaryActivities: string[];
  preferredCategories: ProductCategory[];
  preferredProducts: string[];
  preferredColors: string[];
  preferredChannels: Channel[];
  avgAov: number;
  predictedLtv: number;
  promoSensitivity: number; // 0..1
  churnRisk: number; // 0..1
  bestMessage: string;
  bestNextAction: string;
  marketIndex: Record<string, number>; // market -> index (100 = avg)
  share: number; // share of customer base, 0..1
  cac: number;
  repeatRate: number;
  emoji: string;
}

export interface VisitorSignal {
  visitorId: string;
  sessionId: string;
  market: string;
  device: Device;
  acquisitionChannel: Channel;
  landingPage: string;
  viewedCategories: ProductCategory[];
  viewedProducts: string[];
  viewedColors: string[];
  sizeGuideUsed: boolean;
  wishlistAdds: number;
  cartAdds: number;
  searchTerms: string[];
  emailClicks: number;
  smsClicks: number;
  eventRsvp: boolean;
  predictedPersona: PersonaName;
  personaConfidence: number;
  personaProbabilities: { persona: PersonaName; probability: number }[];
  predictedLtv: number;
  recommendedAction: string;
  recommendedMessage: string;
  recommendedProductCarousel: string[];
}

export type TrendSource =
  | "Search"
  | "TikTok"
  | "Instagram"
  | "YouTube"
  | "Reddit / forums"
  | "Editorial / affiliate"
  | "Retail partner visibility";

export type Competitor =
  | "Lululemon"
  | "Alo Yoga"
  | "Rhone"
  | "Outdoor Voices"
  | "Nike"
  | "On"
  | "Tracksmith"
  | "Athleta"
  | "Fabletics";

export interface ExternalTrendRow {
  date: string;
  source: TrendSource;
  market: string;
  topic: string;
  productKeyword: string;
  mentionVolume: number;
  sentimentScore: number; // -1..1
  trendVelocity: number; // % change
  competitor: Competitor | "Vuori";
  shareOfVoice: number; // 0..1
  relatedPersona: PersonaName;
  recommendedAction: string;
}

export interface Recommendation {
  recommendationId: string;
  date: string;
  module: string;
  title: string;
  businessQuestion: string;
  recommendation: string;
  expectedImpact: string;
  confidenceScore: number; // 0..100
  evidence: string[];
  sourceSignals: string[];
  humanApprovalRequired: boolean;
  testDesign: string;
  owner: string;
  timeToValue: string;
  status: Status;
  activationPath: string[];
}

export type UseCaseStatus =
  | "Discovery"
  | "POC Candidate"
  | "In Test"
  | "Ready to Scale"
  | "Needs Data"
  | "Not Recommended Yet";

export interface AiUseCase {
  useCaseId: string;
  name: string;
  businessDomain: string;
  businessQuestion: string;
  estimatedAnnualImpact: number; // $
  estimatedAnnualImpactLabel: string;
  dataReadiness: number; // 0..100
  technicalComplexity: number; // 0..100 (higher = harder)
  timeToValue: number; // months
  confidence: number; // 0..100
  owner: string;
  status: UseCaseStatus;
  requiredData: string[];
  modelApproach: string;
  activationPath: string;
  measurementPlan: string;
  governanceNotes: string;
  businessImpactScore: number; // 0..100
  feasibilityScore: number; // 0..100
  priorityScore: number; // 0..100
}

// ── Derived / aggregate shapes used across the UI ──────────────────────────

export interface DailyMetric {
  date: string;
  revenue: number;
  orders: number;
  sessions: number;
  newCustomers: number;
  repeatRevenue: number;
  newRevenue: number;
  grossMargin: number;
  aov: number;
  conversionRate: number;
  marketingSpend: number;
}

export interface ChannelSummary {
  channel: Channel;
  spend: number;
  revenue: number;
  attributedRevenue: number;
  newCustomers: number;
  cac: number;
  roas: number;
  mer: number;
  ltvCacRatio: number;
  newCustomerShare: number;
  paybackMonths: number;
  marginalRoas: number;
  qualityScore: number;
}

export interface CohortRow {
  cohort: string; // e.g. "2024-01"
  size: number;
  retention: number[]; // month 0..N retention %
}

export interface FunnelStage {
  stage: string;
  value: number;
  conversionFromPrev: number;
}

export interface GrowthInitiative {
  id: string;
  name: string;
  description: string;
  revenueImpact: number;
  grossProfitImpact: number;
  cacReduction: number; // %
  ltvLift: number; // %
  conversionLift: number; // %
  retentionLift: number; // %
  inventoryRiskReduction: number; // $
  confidence: number;
  owner: string;
  testDesign: string;
  timeToValue: string;
  stage: "Now" | "Next" | "Later";
  status: Status;
}
