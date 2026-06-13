import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnFiltersState,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowUpDown, ChevronDown, Search, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { HeroPanel } from "@/components/ui/HeroPanel";
import { Card, CardContent, SectionHeader } from "@/components/ui/Card";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Progress } from "@/components/ui/Progress";
import { Drawer } from "@/components/ui/Drawer";
import { CHART, TooltipShell, axisProps } from "@/components/charts/chartUtils";
import { AI_PRIORITY_FORMULA } from "@/lib/scoring";
import { aiUseCases } from "@/data/syntheticData";
import type { AiUseCase, UseCaseStatus } from "@/data/types";
import { compactCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<UseCaseStatus, string> = {
  "Ready to Scale": CHART.positive,
  "In Test": CHART.ocean,
  "POC Candidate": CHART.sage,
  Discovery: CHART.muted,
  "Needs Data": CHART.warning,
  "Not Recommended Yet": CHART.negative,
};

const col = createColumnHelper<AiUseCase>();

export function AIOpportunityRegistry() {
  const [sorting, setSorting] = useState<SortingState>([{ id: "priorityScore", desc: true }]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [domainFilter, setDomainFilter] = useState("All");
  const [selected, setSelected] = useState<AiUseCase | null>(null);

  const domains = useMemo(() => ["All", ...Array.from(new Set(aiUseCases.map((u) => u.businessDomain)))], []);
  const statuses = useMemo(() => ["All", ...Array.from(new Set(aiUseCases.map((u) => u.status)))], []);

  const filtered = useMemo(
    () =>
      aiUseCases.filter(
        (u) => (statusFilter === "All" || u.status === statusFilter) && (domainFilter === "All" || u.businessDomain === domainFilter),
      ),
    [statusFilter, domainFilter],
  );

  const columns = useMemo(
    () => [
      col.accessor("name", {
        header: "Use case",
        cell: (c) => (
          <div className="min-w-[180px]">
            <div className="font-medium text-ink">{c.getValue()}</div>
            <div className="text-[11px] text-ink-muted">{c.row.original.businessDomain}</div>
          </div>
        ),
      }),
      col.accessor("status", {
        header: "Status",
        cell: (c) => <StatusBadge status={c.getValue()} />,
      }),
      col.accessor("priorityScore", {
        header: "Priority",
        cell: (c) => (
          <div className="flex w-[120px] items-center gap-2">
            <Progress value={c.getValue()} tone={c.getValue() >= 78 ? "positive" : c.getValue() >= 68 ? "sage" : "warning"} />
            <span className="tabular font-semibold text-ink">{c.getValue()}</span>
          </div>
        ),
      }),
      col.accessor("estimatedAnnualImpact", {
        header: "Est. impact",
        cell: (c) => <span className="tabular font-medium text-sage-deep">{c.row.original.estimatedAnnualImpactLabel}</span>,
      }),
      col.accessor("dataReadiness", { header: "Data ready", cell: (c) => <span className="tabular text-ink-secondary">{c.getValue()}</span> }),
      col.accessor("technicalComplexity", { header: "Complexity", cell: (c) => <span className="tabular text-ink-secondary">{c.getValue()}</span> }),
      col.accessor("timeToValue", { header: "TTV (mo)", cell: (c) => <span className="tabular text-ink-secondary">{c.getValue()}</span> }),
      col.accessor("confidence", { header: "Confidence", cell: (c) => <span className="tabular text-ink-secondary">{c.getValue()}%</span> }),
    ],
    [],
  );

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting, columnFilters, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const matrixData = filtered.map((u) => ({
    x: u.feasibilityScore,
    y: u.businessImpactScore,
    z: u.estimatedAnnualImpact,
    name: u.name,
    status: u.status,
  }));

  const top3 = [...aiUseCases].sort((a, b) => b.priorityScore - a.priorityScore).slice(0, 3);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="AI Opportunity Registry"
        businessQuestion="Which data science and AI POCs should ecommerce prioritize first?"
        subtitle="A governed registry of AI/ML use cases scored on business impact, data readiness, confidence, time-to-value, and feasibility — so investment goes to the highest-leverage POCs first."
        badge={{ label: `${aiUseCases.length} use cases`, tone: "sage" }}
        actions={
          <Link to="/ai-workbench">
            <Button variant="outline" size="sm"><Sparkles className="h-4 w-4" /> AI Workbench</Button>
          </Link>
        }
      />

      <HeroPanel
        eyebrow="Top POC priorities"
        title="Personalization, market scoring, and event ROI prediction lead the POC queue."
        body="Priority blends business impact (35%), data readiness (25%), confidence (20%), time-to-value (10%), and feasibility (10%). The top candidates pair high impact with data we already have — fast paths to evidence-based value."
        badge={{ label: "Ready for POC", tone: "sage" }}
        stats={top3.map((u) => ({ label: u.name.split(" ").slice(0, 3).join(" "), value: String(u.priorityScore), sub: u.estimatedAnnualImpactLabel }))}
      />

      <Card>
        <CardContent className="pt-5">
          <SectionHeader question="Which POCs combine high impact with real feasibility?" hint="Upper-right = do first. Bubble size = estimated annual impact; color = status." />
          <ResponsiveContainer width="100%" height={360}>
            <ScatterChart margin={{ top: 16, right: 24, left: 8, bottom: 16 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" dataKey="x" {...axisProps} domain={[30, 100]} label={{ value: "Feasibility →", position: "insideBottom", offset: -8, fill: CHART.muted, fontSize: 11 }} />
              <YAxis type="number" dataKey="y" {...axisProps} width={44} domain={[50, 95]} label={{ value: "Business impact", angle: -90, position: "insideLeft", fill: CHART.muted, fontSize: 11 }} />
              <ZAxis type="number" dataKey="z" range={[100, 1100]} />
              <ReferenceLine x={65} stroke={CHART.grid} strokeDasharray="4 4" />
              <ReferenceLine y={72} stroke={CHART.grid} strokeDasharray="4 4" />
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const p = payload[0].payload as (typeof matrixData)[number];
                  return (
                    <TooltipShell
                      title={p.name}
                      rows={[
                        { label: "Status", value: p.status, color: STATUS_COLORS[p.status] },
                        { label: "Business impact", value: String(p.y) },
                        { label: "Feasibility", value: String(p.x) },
                        { label: "Est. annual impact", value: compactCurrency(p.z) },
                      ]}
                    />
                  );
                }}
              />
              <Scatter data={matrixData} onClick={(d: { name?: string }) => { const u = aiUseCases.find((x) => x.name === d?.name); if (u) setSelected(u); }} cursor="pointer">
                {matrixData.map((d, i) => (
                  <Cell key={i} fill={STATUS_COLORS[d.status]} fillOpacity={0.78} stroke={STATUS_COLORS[d.status]} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Filters + table */}
      <Card>
        <CardContent className="pt-5">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-muted" />
              <input
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder="Search use cases…"
                className="h-9 w-56 rounded-lg border border-border-strong bg-surface pl-8 pr-3 text-sm text-ink placeholder:text-ink-muted focus:border-sage focus:outline-none"
              />
            </div>
            <Select size="md" value={statusFilter} onChange={setStatusFilter} options={statuses} />
            <Select size="md" value={domainFilter} onChange={setDomainFilter} options={domains} />
            <span className="ml-auto text-[12px] text-ink-muted">{table.getRowModel().rows.length} of {aiUseCases.length} shown</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id} className="border-b border-border text-left text-[11px] uppercase tracking-wide text-ink-muted">
                    {hg.headers.map((header) => {
                      const sortable = header.column.getCanSort();
                      const sorted = header.column.getIsSorted();
                      return (
                        <th key={header.id} className="py-2 pr-3 font-medium">
                          {sortable ? (
                            <button onClick={header.column.getToggleSortingHandler()} className={cn("inline-flex items-center gap-1 hover:text-ink", sorted && "text-ink")}>
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              {sorted ? <ChevronDown className={cn("h-3 w-3", sorted === "asc" && "rotate-180")} /> : <ArrowUpDown className="h-3 w-3 opacity-40" />}
                            </button>
                          ) : (
                            flexRender(header.column.columnDef.header, header.getContext())
                          )}
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id} onClick={() => setSelected(row.original)} className="cursor-pointer border-b border-border/60 transition-colors hover:bg-surface-2/50">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="py-2.5 pr-3 align-middle">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[11px] text-ink-muted">Methodology: {AI_PRIORITY_FORMULA}. Click any row for full detail.</p>
        </CardContent>
      </Card>

      <Drawer open={!!selected} onClose={() => setSelected(null)} title={selected?.name ?? ""} subtitle={selected?.businessDomain} width="max-w-lg">
        {selected && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={selected.status} />
              <Badge tone="sage">Priority {selected.priorityScore}</Badge>
              <Badge tone="positive">{selected.estimatedAnnualImpactLabel}</Badge>
            </div>
            <p className="text-[13px] italic leading-relaxed text-ink-secondary">"{selected.businessQuestion}"</p>

            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Business impact", value: selected.businessImpactScore },
                { label: "Data readiness", value: selected.dataReadiness },
                { label: "Confidence", value: selected.confidence },
                { label: "Feasibility", value: selected.feasibilityScore },
                { label: "Complexity", value: selected.technicalComplexity },
                { label: "TTV (months)", value: selected.timeToValue },
              ].map((m) => (
                <div key={m.label} className="rounded-lg border border-border bg-surface-2/40 p-2.5 text-center">
                  <div className="text-[10px] uppercase tracking-wide text-ink-muted">{m.label}</div>
                  <div className="tabular mt-0.5 text-[16px] font-semibold text-ink">{m.value}</div>
                </div>
              ))}
            </div>

            <DetailBlock label="Required data" items={selected.requiredData} />
            <DetailBlock label="Model approach" text={selected.modelApproach} />
            <DetailBlock label="Activation path" text={selected.activationPath} />
            <DetailBlock label="Measurement plan" text={selected.measurementPlan} />
            <DetailBlock label="Governance notes" text={selected.governanceNotes} />
          </div>
        )}
      </Drawer>
    </div>
  );
}

function DetailBlock({ label, text, items }: { label: string; text?: string; items?: string[] }) {
  return (
    <div className="border-t border-border pt-3">
      <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">{label}</div>
      {text && <p className="text-[13px] leading-relaxed text-ink-secondary">{text}</p>}
      {items && (
        <div className="flex flex-wrap gap-1.5">
          {items.map((it) => (
            <span key={it} className="rounded-md border border-border bg-surface-2/60 px-2 py-1 text-[12px] text-ink-secondary">{it}</span>
          ))}
        </div>
      )}
    </div>
  );
}
