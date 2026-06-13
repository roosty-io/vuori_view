import { Link } from "react-router-dom";
import { ArrowRight, Mail, MessageSquareText, MousePointerClick, Smartphone, Target } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { HeroPanel } from "@/components/ui/HeroPanel";
import { Card, CardContent, SectionHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import { personas } from "@/data/syntheticData";

const STAGES = [
  { stage: "Discover", trigger: "First visit from paid social", action: "Persona-fit hero + soft email capture", channel: "Onsite" },
  { stage: "Consider", trigger: "Viewed Meta Pant 3x, no cart", action: "Commuter/workwear creative + fit content", channel: "Paid Social" },
  { stage: "Convert", trigger: "Added Villa Wideleg, abandoned cart", action: "SMS fit guidance + social proof", channel: "SMS" },
  { stage: "Onboard", trigger: "First purchase complete", action: "Welcome series + care + styling", channel: "Email" },
  { stage: "Grow", trigger: "Purchased joggers 45 days ago", action: "Polo / outerwear attach recommendation", channel: "Email" },
  { stage: "Advocate", trigger: "High activity in Austin market", action: "Invite to local pop-up + referral", channel: "Email / SMS" },
];

interface Trigger {
  trigger: string;
  action: string;
  channel: string;
  impact: string;
  confidence: number;
  owner: string;
  signals: string;
}

const TRIGGERS: Trigger[] = [
  { trigger: "Viewed Meta Pant 3× with no cart add", action: "Serve commuter/workwear creative with fit content", channel: "Paid Social · Onsite", impact: "+$140K / mo", confidence: 79, owner: "Growth / Lifecycle", signals: "Product views, dwell time, category affinity" },
  { trigger: "Added Villa Wideleg, abandoned cart", action: "SMS fit guidance + social proof within 30 min", channel: "SMS", impact: "+$190K / mo", confidence: 84, owner: "Lifecycle CRM", signals: "Cart add, size-guide use, abandonment timing" },
  { trigger: "Purchased joggers ~45 days ago", action: "Recommend polo / outerwear attach", channel: "Email", impact: "+$220K / mo", confidence: 81, owner: "Lifecycle CRM", signals: "Order history, replenishment window, persona" },
  { trigger: "Browsing from a cold-weather market", action: "Prioritize layers & outerwear modules", channel: "Onsite", impact: "+$160K / mo", confidence: 76, owner: "Ecommerce / Merch", signals: "Geo, weather index, category views" },
  { trigger: "High activity in Austin market", action: "Invite to local pop-up + early access", channel: "Email · SMS", impact: "+$95K / mo", confidence: 82, owner: "Retail / Growth", signals: "Market, session depth, event RSVP propensity" },
  { trigger: "Gift buyer from November cohort", action: "Holiday gift-guide flow + reorder nudge", channel: "Email", impact: "+$130K / mo", confidence: 74, owner: "Lifecycle CRM", signals: "Seasonal purchase pattern, AOV, low self-purchase" },
];

const CHANNEL_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  Email: Mail,
  SMS: Smartphone,
  Onsite: MousePointerClick,
  "Paid Social": Target,
};

function channelIcon(channel: string) {
  const key = Object.keys(CHANNEL_ICON).find((k) => channel.includes(k));
  const Icon = key ? CHANNEL_ICON[key] : MessageSquareText;
  return <Icon className="h-3.5 w-3.5 text-ink-muted" />;
}

export function RightMessage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Right Message, Right Moment"
        businessQuestion="What should Vuori show each customer next?"
        subtitle="A trigger-based decisioning layer: behavioral signals map to a next-best-action across onsite, email, SMS, and paid media — each with confidence, expected impact, and a test design."
        badge={{ label: "Human-approved actions", tone: "warning" }}
        actions={
          <Link to="/consumer-intelligence">
            <Button variant="outline" size="sm"><ArrowRight className="h-4 w-4" /> Persona graph</Button>
          </Link>
        }
      />

      <HeroPanel
        eyebrow="Decisioning"
        title="Every signal has a best next action — orchestrated, measured, and human-approved."
        body="The system listens for behavioral triggers and recommends the highest-expected-value action per customer, sequenced across the lifecycle. Recommendations never auto-send without approval, and each carries a confidence score and measurement plan."
        icon={<MessageSquareText className="h-3.5 w-3.5" />}
        badge={{ label: "Next-best-action", tone: "sage" }}
        stats={[
          { label: "Active triggers", value: String(TRIGGERS.length), sub: "across lifecycle" },
          { label: "Highest-impact", value: "Cart SMS", sub: "+$190K / mo", tone: "positive" },
          { label: "Avg. confidence", value: `${Math.round(TRIGGERS.reduce((s, t) => s + t.confidence, 0) / TRIGGERS.length)}%`, sub: "test before scaling" },
          { label: "Channels", value: "4", sub: "onsite · email · SMS · paid" },
        ]}
      />

      {/* Journey canvas */}
      <Card>
        <CardContent className="pt-5">
          <SectionHeader question="What does the customer journey look like, stage by stage?" hint="Each stage has a representative trigger and recommended action." />
          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
            {STAGES.map((s, i) => (
              <div key={s.stage} className="relative rounded-xl border border-border bg-surface-2/30 p-3">
                <div className="mb-1 flex items-center gap-1.5">
                  <span className="tabular flex h-5 w-5 items-center justify-center rounded-full bg-sage text-[11px] font-semibold text-white">{i + 1}</span>
                  <span className="text-[13px] font-semibold text-ink">{s.stage}</span>
                </div>
                <p className="text-[12px] leading-snug text-ink-secondary"><span className="font-medium text-ink-secondary/90">Trigger:</span> {s.trigger}</p>
                <p className="mt-1.5 text-[12px] leading-snug text-ink-secondary"><span className="font-medium text-ink-secondary/90">Action:</span> {s.action}</p>
                <Badge tone="ocean" className="mt-2">{s.channel}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Trigger library / NBA table */}
      <Card>
        <CardContent className="pt-5">
          <SectionHeader question="Which triggers should we act on, and what's the best next action?" hint="Trigger library with channel, expected impact, confidence, and owner." />
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-ink-muted">
                  <th className="py-2 pr-3 font-medium">Trigger</th>
                  <th className="py-2 pr-3 font-medium">Recommended action</th>
                  <th className="py-2 pr-3 font-medium">Channel</th>
                  <th className="py-2 pr-3 text-right font-medium">Expected impact</th>
                  <th className="py-2 pr-3 font-medium">Confidence</th>
                  <th className="py-2 pl-3 font-medium">Owner</th>
                </tr>
              </thead>
              <tbody>
                {TRIGGERS.map((t, i) => (
                  <tr key={i} className="border-b border-border/60 align-top hover:bg-surface-2/40">
                    <td className="py-2.5 pr-3">
                      <div className="font-medium text-ink">{t.trigger}</div>
                      <div className="text-[11px] text-ink-muted">Signals: {t.signals}</div>
                    </td>
                    <td className="py-2.5 pr-3 text-ink-secondary">{t.action}</td>
                    <td className="py-2.5 pr-3">
                      <span className="inline-flex items-center gap-1.5 text-ink-secondary">{channelIcon(t.channel)} {t.channel}</span>
                    </td>
                    <td className="tabular py-2.5 pr-3 text-right font-semibold text-sage-deep">{t.impact}</td>
                    <td className="py-2.5 pr-3">
                      <div className="flex items-center gap-2">
                        <Progress value={t.confidence} tone={t.confidence >= 82 ? "positive" : "sage"} className="w-14" />
                        <span className="tabular text-[12px] font-semibold text-ink">{t.confidence}%</span>
                      </div>
                    </td>
                    <td className="py-2.5 pl-3 text-[12px] text-ink-secondary">{t.owner}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[11px] text-ink-muted">
            Measurement plan for each trigger: holdout vs treated audience; measure incremental revenue, conversion lift,
            and unsubscribe/opt-out rate before scaling. Human approval required on all message copy.
          </p>
        </CardContent>
      </Card>

      {/* Persona message matrix */}
      <Card>
        <CardContent className="pt-5">
          <SectionHeader question="What's the best message and next action per persona?" hint="Persona-to-message matrix drawn from the consumer intelligence graph." />
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-ink-muted">
                  <th className="py-2 pr-3 font-medium">Persona</th>
                  <th className="py-2 pr-3 font-medium">Best message</th>
                  <th className="py-2 pr-3 font-medium">Best next action</th>
                  <th className="py-2 pl-3 font-medium">Preferred channels</th>
                </tr>
              </thead>
              <tbody>
                {personas.map((p) => (
                  <tr key={p.personaName} className="border-b border-border/60 hover:bg-surface-2/40">
                    <td className="py-2.5 pr-3">
                      <span className="flex items-center gap-2 font-medium text-ink"><span>{p.emoji}</span>{p.personaName}</span>
                    </td>
                    <td className="py-2.5 pr-3 italic text-ink-secondary">"{p.bestMessage}"</td>
                    <td className="py-2.5 pr-3 text-ink-secondary">{p.bestNextAction}</td>
                    <td className="py-2.5 pl-3">
                      <div className="flex flex-wrap gap-1">
                        {p.preferredChannels.map((c) => <span key={c} className="rounded-md bg-surface-2/70 px-1.5 py-0.5 text-[11px] text-ink-secondary">{c}</span>)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
