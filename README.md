# Vuori View

**Commercial Intelligence for DTC Growth**

Vuori View is a synthetic-data prototype of an internal commercial intelligence platform for Vuori's DTC growth teams. It demonstrates how ecommerce analytics can connect forecasting, customer intelligence, market signals, product demand, marketing efficiency, localization, and AI-assisted recommendations into a single decision-making system. This demo uses synthetic data only and is not affiliated with Vuori.

> **Portfolio demo using synthetic data. Not affiliated with Vuori and does not use proprietary Vuori data.**

It was built as a portfolio piece for a **Sr. Manager, Ecommerce Analytics** role — designed to show that analytics can be translated into business action: every chart answers *what happened, why, what's next, what to do, how confident we are,* and *how we'll measure success.*

---

## What it answers

Vuori View is organized around four executive questions:

1. **Where is DTC growth forming?**
2. **Who is the customer, beyond basic pixel data?**
3. **What should Vuori do next?**
4. **What is the expected impact, confidence level, and test plan?**

---

## The flagship story

The built-in **Guided Demo** walks through one connected storyline:

> **"Austin is emerging as Vuori's next high-opportunity localized growth market."**

It moves across eight pages — Command Center → External Demand Radar → Market Opportunity Engine → Consumer Intelligence Graph → Pop-Up & Event Simulator → Right Message, Right Moment → AI Opportunity Registry → Executive Brief — with the page behind the panel updating at each step. Austin scores **91** on the opportunity model, and a simulated run-club + recovery-studio activation projects **~$184K** event-period revenue, a **~$534K** 90-day ecommerce halo, **~2,900** leads, and a **~3.7x** ROI at **84%** confidence.

---

## Key features

- **15 pages** spanning performance, customer & market intelligence, activation, product, AI/strategy, and executive output.
- **Command Center** — KPI deck, actual-vs-forecast-vs-plan, revenue decomposition waterfall, new-vs-repeat mix, AI-assisted weekly readout, and prioritized opportunities & risks.
- **Forecast Studio** — a driver-based scenario model with **working sliders** (paid media, conversion, AOV, email/SMS, promo, inventory, activation, launches, international), saved scenarios, confidence bands, and driver decomposition.
- **Consumer Intelligence Graph** — 10 behavioral personas, a shared-product affinity network, persona × product/color heatmaps, LTV:CAC analysis, and live persona prediction for anonymous visitors.
- **Market Opportunity Engine** — a transparent weighted opportunity score across 10 signals, a stylized market map, sortable ranking, and a demand-vs-competition bubble chart.
- **Pop-Up & Event Simulator** — **working controls** that compute event ROI, lead capture, CAC, and 30/60/90-day halo, with activation-type comparison and a test design.
- **AI Opportunity Registry** — a sortable/filterable (TanStack Table) registry of 17 AI/ML use cases scored on impact, data readiness, confidence, time-to-value, and feasibility, plus an impact-vs-feasibility matrix.
- **Growth Impact Lab** — internal-value scorecards and a Now / Next / Later roadmap (no external monetization).
- **Executive Brief** — a print/export-friendly summary with recommendation, evidence, expected impact, confidence, risks, owners, and a 30/60/90-day plan. Use **Send to brief** across pages to assemble it.
- **Global filters** (date range, market, country, channel, category, product line, persona, new vs repeat, device, scenario) that update KPIs and charts.
- **Evidence drawers** on recommendations — source signals, supporting metrics, assumptions, scoring logic, confidence rationale, recommended experiment, and risks.

---

## Tech stack

- **React + TypeScript + Vite**
- **Tailwind CSS** with a warm, coastal-California design system
- **Recharts** for charts, **TanStack Table** for advanced tables
- **date-fns** for dates, **lucide-react** for icons
- Deterministic, seeded synthetic data — **no backend, no auth, no external data**

---

## Synthetic data

All data is fabricated and generated through a deterministic seeded RNG (`src/data/seed.ts` → `src/data/syntheticData.ts`), so the dashboard renders identically on every load and deploy. It intentionally encodes realistic stories — seasonality, BFCM/holiday spikes, product launches, promo periods, forecast misses around launches, inventory and size-break constraints, channel saturation, cohort retention, event halo decay, climate effects by market, and persona-level behavior.

There is no scraping, no proprietary Vuori data, and no PII. The Vuori name is used only to frame the demo; the design is brand-*inspired*, not a copy, and uses a plain "Vuori View" text wordmark.

---

## Run locally

Requires Node 18+ (built and tested on Node 22).

```bash
npm install
npm run dev      # start the dev server (http://localhost:5173)
npm run build    # type-check + production build to /dist
npm run preview  # preview the production build
```

---

## Deploy

The app is a static SPA and deploys to any static host. SPA fallback rewrites are included for both platforms.

### Vercel
1. Import the repository in Vercel.
2. Framework preset: **Vite** (Build `npm run build`, Output `dist`).
3. `vercel.json` already rewrites all routes to `index.html`.

### Netlify
1. New site from Git.
2. Build command `npm run build`, publish directory `dist`.
3. `netlify.toml` and `public/_redirects` already provide the SPA fallback.

### Custom domain
After deploying, add your custom domain in the host's dashboard (Vercel: *Project → Settings → Domains*; Netlify: *Site → Domain management*) and point your DNS via the provider's instructions (a `CNAME` to the platform, or `A`/`ALIAS` for an apex domain). HTTPS is provisioned automatically.

---

## Project structure

```
src/
  data/        seed (RNG), types, syntheticData (generators), calculations
  lib/         formatters, scoring (event ROI, persona, AI priority), utils
  hooks/       AppProvider + useFilters / useScenario / useGuidedDemo
  components/
    layout/    AppShell, Sidebar, TopBar, PageHeader, GuidedDemo, nav
    ui/        Card, Badge, Button, Select, Tabs, Slider, Drawer, Tooltip,
               MetricCard, InsightCard, RecommendationCard, EvidenceDrawer, …
    charts/    RevenueForecast, Waterfall, MarketMap, MarketBubble,
               PersonaAffinityGraph, CohortHeatmap, Funnel, EventHalo,
               ShareOfVoice, MarginVelocityScatter, ColorPreferenceHeatmap
  pages/       15 pages (Command Center → Executive Brief)
```

---

## A note on AI

Throughout, AI is framed as **assistive, not autonomous**: outputs carry confidence scores, source signals, and explainability, and major commercial decisions remain **evidence-based, testable, and human-approved**. Generative summaries are drafted for human review and cite their figures — never auto-published.

---

*Portfolio demo using synthetic data. Not affiliated with Vuori and does not use proprietary Vuori data.*
