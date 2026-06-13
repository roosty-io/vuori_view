import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowUpRight, Compass, Radar, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { HeroPanel } from "@/components/ui/HeroPanel";
import { Card, CardContent, SectionHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { ShareOfVoiceChart } from "@/components/charts/ShareOfVoiceChart";
import { SERIES_COLORS, TooltipShell, axisProps } from "@/components/charts/chartUtils";
import { externalTrends, marketTrends, shareOfVoice, topicClusters } from "@/data/syntheticData";
import { compactNumber, percentRaw, signedPercent } from "@/lib/formatters";
import { format, parseISO } from "date-fns";

const RADAR_MARKETS = ["Austin", "Denver", "Miami", "Boston"];

export function ExternalDemandRadar() {
  const [metric, setMetric] = useState<"search" | "social" | "sentiment">("search");

  const pivot = useMemo(() => {
    const byWeek = new Map<string, Record<string, number | string>>();
    marketTrends
      .filter((t) => RADAR_MARKETS.includes(t.market))
      .forEach((t) => {
        const row = byWeek.get(t.week) ?? { week: t.week };
        row[t.market] = t[metric];
        byWeek.set(t.week, row);
      });
    return Array.from(byWeek.values()).sort((a, b) => (a.week as string).localeCompare(b.week as string));
  }, [metric]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="External Demand Radar"
        businessQuestion="What demand signals are forming outside Vuori.com?"
        subtitle="Search, social, sentiment, topic clusters, and competitor share-of-voice — synthetic signals that reveal where demand is accelerating before it shows up in revenue."
        badge={{ label: "Synthetic signals", tone: "ocean" }}
        actions={
          <Link to="/market-opportunity">
            <Button variant="outline" size="sm"><Compass className="h-4 w-4" /> Market opportunity</Button>
          </Link>
        }
      />

      <HeroPanel
        eyebrow="Demand alert"
        title="DreamKnit-related demand is accelerating in cold-weather markets."
        body="Search demand and sentiment are rising fastest in Denver, Boston, Chicago, and Seattle around comfort, travel, and layering. In parallel, Austin's run-club and wellness conversation is climbing. Recommend localized lifecycle and paid social campaigns ahead of the curve."
        icon={<Radar className="h-3.5 w-3.5" />}
        badge={{ label: "Rising", tone: "sage" }}
        stats={[
          { label: "Fastest-rising topic", value: "Run club", sub: "+52% velocity", tone: "positive" },
          { label: "Vuori share of voice", value: percentRaw(shareOfVoice.find((s) => s.brand === "Vuori")?.shareOfVoice ?? 0), sub: "+18% velocity", tone: "positive" },
          { label: "Top rising market", value: "Austin", sub: "search & social" },
          { label: "Topic clusters", value: String(topicClusters.length), sub: "tracked" },
        ]}
      />

      <Card>
        <CardContent className="pt-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SectionHeader question="Where is demand accelerating, and on which signal?" hint="Indexed trend across the four rising markets over the last 52 weeks." className="mb-0" />
            <Tabs
              items={[
                { value: "search", label: "Search demand" },
                { value: "social", label: "Social mentions" },
                { value: "sentiment", label: "Sentiment" },
              ]}
              value={metric}
              onChange={(v) => setMetric(v as typeof metric)}
            />
          </div>
          <div className="mt-4">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={pivot} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="week" {...axisProps} minTickGap={40} tickFormatter={(v: string) => format(parseISO(v), "MMM ''yy")} />
                <YAxis {...axisProps} width={40} tickFormatter={(v: number) => (metric === "sentiment" ? v.toFixed(1) : String(v))} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <TooltipShell
                        title={format(parseISO(label as string), "MMM d, yyyy")}
                        rows={payload.map((p) => ({ label: p.name as string, value: metric === "sentiment" ? Number(p.value).toFixed(2) : compactNumber(Number(p.value)), color: p.color as string }))}
                      />
                    );
                  }}
                />
                {RADAR_MARKETS.map((m, i) => (
                  <Line key={m} dataKey={m} stroke={SERIES_COLORS[i]} strokeWidth={m === "Austin" ? 2.75 : 1.75} dot={false} name={m} />
                ))}
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-[11px] text-ink-secondary">
              {RADAR_MARKETS.map((m, i) => (
                <span key={m} className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: SERIES_COLORS[i] }} /> {m}</span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardContent className="pt-5">
            <SectionHeader question="Who owns the conversation — and is Vuori gaining?" hint="Synthetic competitor share-of-voice. Vuori highlighted." />
            <ShareOfVoiceChart data={shareOfVoice} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardContent className="pt-5">
            <SectionHeader question="Which topics are heating up?" hint="Conversation clusters by volume & velocity." />
            <div className="space-y-2.5">
              {topicClusters.map((t) => (
                <div key={t.cluster} className="rounded-lg border border-border bg-surface p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-semibold text-ink">{t.cluster}</span>
                    <Badge tone={t.velocity >= 40 ? "positive" : "sage"} className="gap-1">
                      <ArrowUpRight className="h-3 w-3" /> {t.velocity}%
                    </Badge>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11.5px] text-ink-muted">
                    <span>{compactNumber(t.volume)} mentions · {t.persona}</span>
                    <span className="tabular">sentiment {t.sentiment.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-5">
          <SectionHeader question="Which product trends are accelerating — and what should we do?" hint="Highest-velocity product signals with a recommended localized action." />
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-ink-muted">
                  <th className="py-2 pr-3 font-medium">Product / topic</th>
                  <th className="py-2 pr-3 font-medium">Market</th>
                  <th className="py-2 pr-3 font-medium">Source</th>
                  <th className="py-2 pr-3 text-right font-medium">Mentions</th>
                  <th className="py-2 pr-3 text-right font-medium">Sentiment</th>
                  <th className="py-2 pr-3 text-right font-medium">Velocity</th>
                  <th className="py-2 pl-3 font-medium">Recommended action</th>
                </tr>
              </thead>
              <tbody>
                {externalTrends.slice(0, 12).map((t, i) => (
                  <tr key={i} className="border-b border-border/60 hover:bg-surface-2/40">
                    <td className="py-2.5 pr-3">
                      <div className="font-medium text-ink">{t.productKeyword}</div>
                      <div className="text-[11px] text-ink-muted">{t.topic}</div>
                    </td>
                    <td className="py-2.5 pr-3 text-ink-secondary">{t.market}</td>
                    <td className="py-2.5 pr-3 text-ink-secondary">{t.source}</td>
                    <td className="tabular py-2.5 pr-3 text-right text-ink-secondary">{compactNumber(t.mentionVolume)}</td>
                    <td className="tabular py-2.5 pr-3 text-right text-ink-secondary">{t.sentimentScore.toFixed(2)}</td>
                    <td className="py-2.5 pr-3 text-right">
                      <span className="tabular inline-flex items-center gap-0.5 font-semibold text-sage-deep">
                        <TrendingUp className="h-3 w-3" /> {signedPercent(t.trendVelocity)}
                      </span>
                    </td>
                    <td className="py-2.5 pl-3 text-[12px] text-ink-secondary">{t.recommendedAction}</td>
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
