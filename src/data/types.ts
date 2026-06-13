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
  customerQualityScore: number; // 0..100
  repeatProbability: number; // 0..1
  categoryExpansionPotential: number; // 0..100
  promoDependency: number; // 0..1
  marginContribution: number; // 0..1
  timeToSecondPurchasePrediction: number; // days
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
  customerQualityScore: number; // 0..100
  communityCommerceOpportunity: number; // 0..100
  incrementalityReadiness: number; // 0..100
  recommendedControlMarkets: string[];
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
  // Customer quality
  customerQualityScore: number; // 0..100
  repeatProbability: number; // 0..1
  categoryExpansionPotential: number; // 0..100
  promoDependency: number; // 0..1
  marginContribution: number; // 0..1
  timeToSecondPurchasePrediction: number; // days
  returnRisk: number; // 0..1
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
  customerQualityScore: number; // 0..100
  returnAdjustedRoas: number;
  incrementalShare: number; // 0..1 of attributed revenue that is incremental
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

// ── Community Commerce (creators, ambassadors, affiliates, activations) ──────

export type PartnerType =
  | "Run Club"
  | "Recovery Studio"
  | "Pilates Studio"
  | "Yoga Instructor"
  | "Local Trainer"
  | "Outdoor Community"
  | "Wellness Creator"
  | "Resort / Hotel Partner"
  | "Ambassador"
  | "Affiliate Creator"
  | "Creator"
  | "Local Partner"
  | "Affiliate";

export type PartnerStatus = "Top Performer" | "Active" | "In Test" | "Proposed" | "Paused";

export interface CreatorPartner {
  partnerId: string;
  name: string;
  partnerType: PartnerType;
  market: string;
  primaryPersona: PersonaName;
  audienceSize: number;
  engagementRate: number; // 0..1
  brandFitScore: number; // 0..100
  personaFitScore: number; // 0..100
  commissionRate: number; // 0..1
  contentType: string;
  eventAssociated: string;
  status: PartnerStatus;
  expectedCustomerQualityScore: number; // 0..100
  averageOrderValue: number;
  returnRisk: number; // 0..1
  projectedLtv: number;
  incrementalLiftEstimate: number; // 0..1
  // Derived performance
  attributedRevenue: number;
  newCustomers: number;
  incrementalRevenue: number;
  roi: number;
}

export interface ActivationLandingPage {
  landingPageId: string;
  name: string;
  market: string;
  partnerId: string;
  eventId: string;
  urlSlug: string;
  heroMessage: string;
  featuredProducts: string[];
  targetPersonas: PersonaName[];
  qrCodeId: string;
  utmCampaign: string;
  sessions: number;
  qrScans: number;
  emailCaptures: number;
  smsCaptures: number;
  productViews: number;
  addToCart: number;
  orders: number;
  revenue: number;
  newCustomers: number;
  repeatCustomers: number;
  grossMargin: number;
  commissionPayout: number;
  marginAfterCommission: number;
  returnRate: number;
  returnAdjustedRevenue: number;
  haloRevenue30d: number;
  haloRevenue60d: number;
  haloRevenue90d: number;
  incrementalRevenueEstimate: number;
  cannibalizedRevenueEstimate: number;
  customerQualityScore: number; // 0..100
  // Derived display
  roi: number;
  confidence: number;
}

export interface CommissionScenario {
  scenarioId: string;
  model: string;
  commissionRate: number; // 0..1
  newCustomerBonus: number; // $ per new customer
  leadBonus: number; // $ per lead
  revenue: number;
  marginAfterCommission: number;
  creatorPayout: number;
  newCustomers: number;
  projectedLtv: number;
  customerQualityScore: number;
  returnAdjustedMargin: number;
  recommendation: string;
}

// ── Experimentation & incrementality ────────────────────────────────────────
export type ExperimentStatus =
  | "Proposed"
  | "Designing"
  | "Running"
  | "Reading Results"
  | "Scale"
  | "Iterate"
  | "Stop"
  | "Needs More Data";

export type TestType =
  | "A/B Test"
  | "Geo Holdout"
  | "Matched Market Test"
  | "Incrementality Test"
  | "Lifecycle Holdout"
  | "Landing Page Test"
  | "Media Mix Test"
  | "Product Launch Read"
  | "PDP Optimization Test";

export interface Experiment {
  experimentId: string;
  name: string;
  businessQuestion: string;
  hypothesis: string;
  owner: string;
  domain: string;
  status: ExperimentStatus;
  startDate: string;
  endDate: string;
  testType: TestType;
  testMarket: string;
  controlMarkets: string[];
  audience: string;
  primaryKpi: string;
  secondaryKpis: string[];
  baseline: string;
  testResult: string;
  lift: number; // %
  confidence: number; // 0..100
  incrementalRevenue: number;
  marginImpact: number;
  customerQualityImpact: number; // delta points
  decision: string;
  nextStep: string;
  relatedRecommendationId?: string;
  relatedUseCaseId?: string;
}

export interface IncrementalityTest {
  testId: string;
  name: string;
  testType: TestType;
  testMarket: string;
  controlMarkets: string[];
  marketSimilarityScore: number; // 0..100
  startDate: string;
  endDate: string;
  baselineRevenue: number;
  expectedLift: number; // %
  actualLift: number | null; // %
  incrementalRevenue: number;
  attributedRevenue: number;
  cannibalizedRevenue: number;
  confidence: number;
  minimumDetectableEffect: number; // %
  recommendedDuration: number; // weeks
  decisionRule: string;
  status: ExperimentStatus;
  owner: string;
  similarityFactors: { factor: string; score: number }[];
}

// ── Back-in-stock & waitlist demand ─────────────────────────────────────────
export interface WaitlistDemand {
  waitlistId: string;
  date: string;
  productId: string;
  productName: string;
  category: ProductCategory;
  productLine: ProductLine;
  color: string;
  size: string;
  market: string;
  persona: PersonaName;
  waitlistSignups: number;
  backInStockSignups: number;
  pdpViewsWhileOutOfStock: number;
  cartAttemptsWhileOutOfStock: number;
  sizeAvailabilityRate: number;
  estimatedLostRevenue: number;
  expectedRecoveryRevenue: number;
  expectedRecoveryRate: number;
  recommendedAction: string;
  priorityScore: number;
  lifecycleTrigger: string;
  inventoryOwner: string;
  crmOwner: string;
}

// ── Returns, fit & size ─────────────────────────────────────────────────────
export type ReturnReason =
  | "Too small"
  | "Too large"
  | "Fit not as expected"
  | "Color not as expected"
  | "Fabric expectation mismatch"
  | "Bought multiple sizes"
  | "Style preference"
  | "Quality issue"
  | "Gift return"
  | "Late delivery";

export interface ReturnsFitData {
  productId: string;
  productName: string;
  category: ProductCategory;
  productLine: ProductLine;
  persona: PersonaName;
  returnRate: number;
  exchangeRate: number;
  topReason: ReturnReason;
  reasonMix: { reason: ReturnReason; share: number }[];
  sizeExchangeDirection: "Up" | "Down" | "Balanced";
  refundAmount: number;
  marginLoss: number;
  fitRiskScore: number; // 0..100
  sizeGuideUsedRate: number;
  sizeGuideReturnReduction: number; // %
  reviewSentiment: number;
  preventableReturnEstimate: number;
  returnAdjustedGrossProfit: number;
  recommendedAction: string;
}

// ── Creative intelligence ───────────────────────────────────────────────────
export type CreativeTheme =
  | "Performance"
  | "Softness / comfort"
  | "Travel"
  | "Work-to-weekend"
  | "Studio-to-street"
  | "Coastal lifestyle"
  | "Outdoor recovery"
  | "Giftability"
  | "Premium basics"
  | "New color drop";

export interface CreativePerformance {
  creativeId: string;
  creativeTheme: CreativeTheme;
  channel: Channel;
  market: string;
  persona: PersonaName;
  productFocus: string;
  impressions: number;
  clicks: number;
  ctr: number;
  conversionRate: number;
  revenue: number;
  newCustomers: number;
  customerQualityScore: number;
  cac: number;
  roas: number;
  ltvCac: number;
  returnRate: number;
  marginAfterReturns: number;
  recommendedAction: string;
}

// ── Onsite search & intent ──────────────────────────────────────────────────
export interface OnsiteSearchIntent {
  searchId: string;
  query: string;
  normalizedIntent: string;
  market: string;
  resultCount: number;
  sessions: number;
  productViews: number;
  addToCart: number;
  conversionRate: number;
  revenue: number;
  zeroResultRate: number;
  relatedPersona: PersonaName;
  relatedProducts: string[];
  recommendedAction: string;
  contentGap: boolean;
  demandSignalScore: number; // 0..100
  trend: number; // % change
}

// ── Product launch intelligence ─────────────────────────────────────────────
export interface ProductLaunch {
  launchId: string;
  launchName: string;
  launchDate: string;
  productIds: string[];
  category: ProductCategory;
  forecastRevenue: number;
  actualRevenue: number;
  forecastAccuracy: number; // %
  newCustomerContribution: number; // 0..1
  repeatCustomerContribution: number; // 0..1
  sellThroughRate: number;
  sizeAvailabilityRate: number;
  returnRate: number;
  grossMargin: number;
  marketingSpend: number;
  primaryPersona: PersonaName;
  topMarkets: string[];
  inventoryRisk: "Low" | "Medium" | "High";
  customerQualityScore: number;
  recommendedAction: string;
  sellThroughCurve: { week: number; planned: number; actual: number }[];
}

// ── Weather-triggered demand ────────────────────────────────────────────────
export interface WeatherDemandTrigger {
  triggerId: string;
  date: string;
  market: string;
  weatherEvent: string;
  temperatureChange: number; // °F
  precipitationIndex: number; // 0..100
  productCategory: ProductCategory;
  recommendedProducts: string[];
  expectedDemandLift: number; // %
  recommendedChannel: string;
  recommendedMessage: string;
  urgency: "High" | "Medium" | "Low";
  confidence: number;
  owner: string;
  expectedRevenueImpact: number;
}

// ── Digital shelf / PDP quality ─────────────────────────────────────────────
export interface PdpQuality {
  productId: string;
  productName: string;
  traffic: number;
  conversionRate: number;
  addToCartRate: number;
  imageCompletenessScore: number;
  videoAvailable: boolean;
  reviewCount: number;
  reviewRating: number;
  fitClarityScore: number;
  sizeGuideEngagement: number;
  descriptionQualityScore: number;
  colorAvailabilityRate: number;
  sizeAvailabilityRate: number;
  loadSpeedScore: number;
  returnRate: number;
  pdpQualityScore: number;
  revenueOpportunity: number;
  recommendedAction: string;
}

// ── Executive alerts ────────────────────────────────────────────────────────
export type AlertSeverity = "Opportunity" | "Revenue at Risk" | "Watch" | "Anomaly";

export interface ExecutiveAlert {
  alertId: string;
  type: string;
  severity: AlertSeverity;
  title: string;
  businessImpact: string;
  rootCause: string;
  recommendedAction: string;
  owner: string;
  evidence: string[];
  measurementPlan: string;
  page: string;
}
