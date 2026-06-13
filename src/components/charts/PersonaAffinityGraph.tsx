import { useMemo, useState } from "react";
import type { Persona } from "@/data/types";
import { SERIES_COLORS, CHART } from "./chartUtils";

const W = 560;
const H = 460;

interface Node {
  p: Persona;
  x: number;
  y: number;
  r: number;
  color: string;
}

/** Persona affinity constellation: shared-product overlap drawn as a network. */
export function PersonaAffinityGraph({
  personas,
  selected,
  onSelect,
}: {
  personas: Persona[];
  selected?: string;
  onSelect?: (persona: string) => void;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const active = hovered ?? selected ?? null;

  const { nodes, edges } = useMemo(() => {
    const cx = W / 2;
    const cy = H / 2;
    const R = 170;
    const maxShare = Math.max(...personas.map((p) => p.share));
    const nodes: Node[] = personas.map((p, i) => {
      const angle = (i / personas.length) * Math.PI * 2 - Math.PI / 2;
      return {
        p,
        x: cx + Math.cos(angle) * R,
        y: cy + Math.sin(angle) * R,
        r: 16 + (p.share / maxShare) * 18,
        color: SERIES_COLORS[i % SERIES_COLORS.length],
      };
    });
    const edges: { a: Node; b: Node; w: number }[] = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const shared = nodes[i].p.preferredProducts.filter((x) => nodes[j].p.preferredProducts.includes(x)).length;
        if (shared > 0) edges.push({ a: nodes[i], b: nodes[j], w: shared });
      }
    }
    return { nodes, edges };
  }, [personas]);

  return (
    <div className="w-full overflow-hidden rounded-xl border border-border bg-gradient-to-br from-surface to-surface-2/30">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ aspectRatio: `${W} / ${H}` }}>
        {/* edges */}
        {edges.map((e, i) => {
          const involved = active === e.a.p.personaName || active === e.b.p.personaName;
          return (
            <line
              key={i}
              x1={e.a.x}
              y1={e.a.y}
              x2={e.b.x}
              y2={e.b.y}
              stroke={involved ? CHART.sage : CHART.grid}
              strokeWidth={involved ? 1 + e.w * 0.7 : 0.6 + e.w * 0.3}
              strokeOpacity={active ? (involved ? 0.7 : 0.12) : 0.4}
              className="transition-all duration-200"
            />
          );
        })}
        {/* center label */}
        <text x={W / 2} y={H / 2 - 4} textAnchor="middle" fill={CHART.muted} fontSize={11} fontWeight={600}>
          Shared-product
        </text>
        <text x={W / 2} y={H / 2 + 11} textAnchor="middle" fill={CHART.muted} fontSize={11} fontWeight={600}>
          affinity
        </text>
        {/* nodes */}
        {nodes.map((n) => {
          const isActive = active === n.p.personaName;
          const dim = active && !isActive;
          return (
            <g
              key={n.p.personaName}
              transform={`translate(${n.x},${n.y})`}
              className="cursor-pointer"
              onMouseEnter={() => setHovered(n.p.personaName)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onSelect?.(n.p.personaName)}
              opacity={dim ? 0.45 : 1}
            >
              {isActive && <circle r={n.r + 5} fill="none" stroke={n.color} strokeWidth={1.5} strokeOpacity={0.5} />}
              <circle r={n.r} fill={n.color} fillOpacity={0.88} stroke={CHART.surface} strokeWidth={2} className="transition-all duration-200" />
              <text textAnchor="middle" dy={4} fontSize={n.r * 0.9}>
                {n.p.emoji}
              </text>
              <text
                textAnchor="middle"
                y={n.r + 13}
                fill={CHART.ink}
                fontSize={10.5}
                fontWeight={isActive ? 700 : 500}
                className="pointer-events-none"
              >
                {n.p.personaName}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
