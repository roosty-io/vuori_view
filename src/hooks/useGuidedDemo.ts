import { useApp } from "./AppProvider";

export interface GuidedStep {
  title: string;
  page: string; // route path
  pageName: string;
  narrative: string;
  takeaway: string;
}

/** The flagship Austin storyline, told across eight pages. */
export const GUIDED_STEPS: GuidedStep[] = [
  {
    title: "DTC performance is healthy — but acquisition is concentrating",
    page: "/",
    pageName: "Command Center",
    narrative:
      "Revenue is running 3.4% ahead of plan, yet growth is increasingly carried by repeat customers. New-customer acquisition is flattening in mature markets.",
    takeaway: "The next leg of growth has to come from new, under-saturated markets.",
  },
  {
    title: "Demand is forming outside Vuori.com",
    page: "/external-demand",
    pageName: "External Demand Radar",
    narrative:
      "Austin, Denver, Miami, and Boston show rising search, social, and lifestyle demand — ahead of where current revenue capture sits.",
    takeaway: "Austin's external signals are accelerating fastest, before competitors saturate.",
  },
  {
    title: "Austin ranks #1 for localized investment",
    page: "/market-opportunity",
    pageName: "Market Opportunity Engine",
    narrative:
      "Austin scores 91 on the opportunity model — driven by ecommerce traffic growth, wellness density, repeat rate, persona fit, and manageable competitor intensity.",
    takeaway: "Demand is rising faster than revenue capture — a localization window is open.",
  },
  {
    title: "We understand the Austin customer",
    page: "/consumer-intelligence",
    pageName: "Consumer Intelligence Graph",
    narrative:
      "Austin over-indexes on Performance Commuter, Wellness Socialite, and Studio Minimalist personas — each with clear product, color, and channel affinities.",
    takeaway: "We know what to show Austin shoppers and how to message them.",
  },
  {
    title: "A run club + recovery activation creates the strongest halo",
    page: "/event-simulator",
    pageName: "Pop-Up & Event Simulator",
    narrative:
      "A 3-day run club + recovery studio activation is forecast to generate ~$180K event-period revenue, ~2,900 leads, and ~$560K of 90-day ecommerce halo at ~3.7x ROI.",
    takeaway: "The event is the spark; the ecommerce halo is the real prize.",
  },
  {
    title: "Routing offline activation into measurable on-site sales",
    page: "/community-commerce",
    pageName: "Community Commerce Lab",
    narrative:
      "The Austin activation routes QR scans and creator links to a curated on-site landing page (/austin-run-club), letting Vuori measure offline-to-online sales, new-customer capture, commission efficiency, customer quality, and 90-day ecommerce halo.",
    takeaway: "Creators and events become attributable, incremental, high-quality DTC revenue.",
  },
  {
    title: "Right message, right moment",
    page: "/right-message",
    pageName: "Right Message, Right Moment",
    narrative:
      "The system recommends localized paid social, onsite personalization, email/SMS follow-up, and persona-fit product bundles to convert the demand.",
    takeaway: "Every recommendation carries confidence, expected impact, and a test design.",
  },
  {
    title: "This becomes a portfolio of POCs",
    page: "/ai-registry",
    pageName: "AI Opportunity Registry",
    narrative:
      "Market scoring, event ROI prediction, persona-based lifecycle marketing, and next-best-action become prioritized data-science POCs — ranked by impact and feasibility.",
    takeaway: "The activation seeds a repeatable, evidence-based analytics roadmap.",
  },
  {
    title: "Decision-ready executive brief",
    page: "/executive-brief",
    pageName: "Executive Brief",
    narrative:
      "The brief summarizes the recommendation, evidence, expected impact, confidence, owners, and a matched-control test design — ready for leadership sign-off.",
    takeaway: "Recommend, evidence, quantify, test before scaling — human-approved.",
  },
];

export function useGuidedDemo(): {
  open: boolean;
  step: number;
  steps: GuidedStep[];
  openDemo: () => void;
  closeDemo: () => void;
  goToStep: (step: number) => void;
  next: () => void;
  prev: () => void;
} {
  const { demoOpen, demoStep, openDemo, closeDemo, setDemoStep } = useApp();
  return {
    open: demoOpen,
    step: demoStep,
    steps: GUIDED_STEPS,
    openDemo,
    closeDemo,
    goToStep: setDemoStep,
    next: () => setDemoStep(Math.min(GUIDED_STEPS.length - 1, demoStep + 1)),
    prev: () => setDemoStep(Math.max(0, demoStep - 1)),
  };
}
