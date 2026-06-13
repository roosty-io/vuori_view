import {
  Beaker,
  Brain,
  CalendarRange,
  Compass,
  FileText,
  FlaskConical,
  Gauge,
  Globe2,
  LayoutDashboard,
  type LucideIcon,
  Megaphone,
  MessageSquareText,
  Radar,
  Shirt,
  Sprout,
  Store,
  TrendingUp,
  Users,
} from "lucide-react";

export interface NavItem {
  path: string;
  label: string;
  short: string;
  icon: LucideIcon;
  tier1?: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Performance",
    items: [
      { path: "/", label: "Command Center", short: "Command Center", icon: LayoutDashboard, tier1: true },
      { path: "/forecast", label: "Forecast Studio", short: "Forecast Studio", icon: TrendingUp, tier1: true },
    ],
  },
  {
    label: "Customer & Market",
    items: [
      { path: "/consumer-intelligence", label: "Consumer Intelligence Graph", short: "Consumer Intelligence", icon: Users, tier1: true },
      { path: "/market-opportunity", label: "Market Opportunity Engine", short: "Market Opportunity", icon: Compass, tier1: true },
      { path: "/external-demand", label: "External Demand Radar", short: "Demand Radar", icon: Radar },
      { path: "/localization", label: "Localization Intelligence", short: "Localization", icon: Globe2 },
    ],
  },
  {
    label: "Activation",
    items: [
      { path: "/event-simulator", label: "Pop-Up & Event Simulator", short: "Event Simulator", icon: CalendarRange, tier1: true },
      { path: "/community-commerce", label: "Community Commerce Lab", short: "Community Commerce", icon: Store, tier1: true },
      { path: "/right-message", label: "Right Message, Right Moment", short: "Right Message", icon: MessageSquareText },
      { path: "/marketing-efficiency", label: "Marketing Efficiency Lab", short: "Marketing Efficiency", icon: Megaphone },
    ],
  },
  {
    label: "Product",
    items: [
      { path: "/merchandising", label: "Merchandising & Assortment", short: "Merchandising", icon: Shirt },
      { path: "/conversion-funnel", label: "Conversion Funnel", short: "Conversion Funnel", icon: Gauge },
    ],
  },
  {
    label: "Testing & AI",
    items: [
      { path: "/experimentation", label: "Experimentation Command Center", short: "Experimentation", icon: Beaker, tier1: true },
      { path: "/ai-registry", label: "AI Opportunity Registry", short: "AI Registry", icon: Brain, tier1: true },
      { path: "/ai-workbench", label: "AI Analytics Workbench", short: "AI Workbench", icon: FlaskConical },
      { path: "/growth-impact", label: "Growth Impact Lab", short: "Growth Impact", icon: Sprout, tier1: true },
    ],
  },
  {
    label: "Output",
    items: [{ path: "/executive-brief", label: "Executive Brief", short: "Executive Brief", icon: FileText, tier1: true }],
  },
];

export const ALL_NAV: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);

export function navByPath(path: string): NavItem | undefined {
  return ALL_NAV.find((n) => n.path === path);
}
