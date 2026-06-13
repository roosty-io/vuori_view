import { useMemo, useState } from "react";
import type { MarketSignal } from "@/data/types";
import { CHART } from "./chartUtils";

interface Placed {
  m: MarketSignal;
  x: number;
  y: number;
  r: number;
  intl: boolean;
}

const W = 760;
const H = 420;

function scoreColor(score: number): string {
  if (score >= 85) return CHART.sage;
  if (score >= 78) return "#8a9a7e";
  if (score >= 70) return CHART.ocean;
  if (score >= 62) return "#9aa9ac";
  return CHART.muted;
}

/** Stylized geographic market map (equirectangular-ish, no map library). */
export function MarketMap({
  markets,
  selected,
  onSelect,
}: {
  markets: MarketSignal[];
  selected?: string;
  onSelect?: (market: string) => void;
}) {
  const [hovered, setHovered] = useState<string | null>(null);

  const placed = useMemo<Placed[]>(() => {
    const intlOrder = ["London", "Seoul", "Beijing", "Shanghai"];
    const maxRev = Math.max(...markets.map((m) => m.ecommerceRevenue));
    return markets.map((m) => {
      const intl = m.country !== "USA";
      const r = 9 + (m.ecommerceRevenue / maxRev) * 16;
      if (intl) {
        const idx = intlOrder.indexOf(m.market);
        const col = idx % 2;
        const rowi = Math.floor(idx / 2);
        return {
          m,
          x: W * (0.8 + col * 0.13),
          y: H * (0.26 + rowi * 0.32),
          r,
          intl,
        };
      }
      // Domestic equirectangular projection over continental US bounds.
      const px = ((m.lng + 125) / (-67 + 125)) * (W * 0.62) + W * 0.03;
      const py = ((48 - m.lat) / (48 - 25)) * (H * 0.74) + H * 0.1;
      return { m, x: px, y: py, r, intl };
    });
  }, [markets]);

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-border bg-gradient-to-br from-surface-2/40 to-surface">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ aspectRatio: `${W} / ${H}` }}>
        {/* faint reference grid */}
        {[0.25, 0.5, 0.75].map((g) => (
          <line key={`v${g}`} x1={W * g * 0.85} y1={12} x2={W * g * 0.85} y2={H - 12} stroke={CHART.grid} strokeOpacity={0.35} strokeDasharray="2 6" />
        ))}
        {[0.3, 0.6].map((g) => (
          <line key={`h${g}`} x1={12} y1={H * g} x2={W * 0.74} y2={H * g} stroke={CHART.grid} strokeOpacity={0.35} strokeDasharray="2 6" />
        ))}
        {/* domestic / international divider */}
        <line x1={W * 0.74} y1={16} x2={W * 0.74} y2={H - 16} stroke={CHART.grid} strokeOpacity={0.6} />
        <text x={W * 0.36} y={H - 6} textAnchor="middle" fill={CHART.muted} fontSize={10} fontWeight={600} letterSpacing={1}>
          DOMESTIC (U.S. DTC)
        </text>
        <text x={W * 0.87} y={H - 6} textAnchor="middle" fill={CHART.muted} fontSize={10} fontWeight={600} letterSpacing={1}>
          INTERNATIONAL
        </text>

        {placed.map((p) => {
          const active = selected === p.m.market;
          const show = active || hovered === p.m.market || p.m.opportunityScore >= 84;
          return (
            <g
              key={p.m.market}
              transform={`translate(${p.x},${p.y})`}
              className="cursor-pointer"
              onMouseEnter={() => setHovered(p.m.market)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onSelect?.(p.m.market)}
            >
              {active && <circle r={p.r + 6} fill="none" stroke={scoreColor(p.m.opportunityScore)} strokeWidth={1.5} strokeOpacity={0.5} />}
              <circle
                r={p.r}
                fill={scoreColor(p.m.opportunityScore)}
                fillOpacity={active ? 0.95 : 0.72}
                stroke={CHART.surface}
                strokeWidth={1.5}
                className="transition-all duration-200"
              />
              <text textAnchor="middle" dy={3.5} fill="#fff" fontSize={9.5} fontWeight={700} className="tabular pointer-events-none">
                {p.m.opportunityScore}
              </text>
              {show && (
                <text
                  textAnchor="middle"
                  y={-p.r - 5}
                  fill={CHART.ink}
                  fontSize={11}
                  fontWeight={600}
                  className="pointer-events-none"
                >
                  {p.m.market}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* legend */}
      <div className="absolute left-3 top-3 flex flex-col gap-1 rounded-lg border border-border bg-surface/90 px-2.5 py-2 backdrop-blur">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-ink-muted">Opportunity score</div>
        <div className="flex items-center gap-1">
          {[62, 70, 78, 85, 91].map((s) => (
            <span key={s} className="h-2.5 w-5 rounded-sm" style={{ background: scoreColor(s) }} />
          ))}
        </div>
        <div className="flex justify-between text-[9px] text-ink-muted">
          <span>Lower</span>
          <span>Higher</span>
        </div>
      </div>
    </div>
  );
}
