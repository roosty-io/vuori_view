import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppProvider } from "./hooks/AppProvider";
import { AppShell } from "./components/layout/AppShell";
import { CommandCenter } from "./pages/CommandCenter";
import { ForecastStudio } from "./pages/ForecastStudio";
import { ConsumerIntelligence } from "./pages/ConsumerIntelligence";
import { MarketOpportunity } from "./pages/MarketOpportunity";
import { EventSimulator } from "./pages/EventSimulator";
import { CommunityCommerceLab } from "./pages/CommunityCommerceLab";
import { Localization } from "./pages/Localization";
import { RightMessage } from "./pages/RightMessage";
import { MarketingEfficiency } from "./pages/MarketingEfficiency";
import { ExternalDemandRadar } from "./pages/ExternalDemandRadar";
import { Merchandising } from "./pages/Merchandising";
import { ConversionFunnel } from "./pages/ConversionFunnel";
import { AIOpportunityRegistry } from "./pages/AIOpportunityRegistry";
import { AIWorkbench } from "./pages/AIWorkbench";
import { GrowthImpactLab } from "./pages/GrowthImpactLab";
import { ExecutiveBrief } from "./pages/ExecutiveBrief";

export function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<CommandCenter />} />
            <Route path="/forecast" element={<ForecastStudio />} />
            <Route path="/consumer-intelligence" element={<ConsumerIntelligence />} />
            <Route path="/market-opportunity" element={<MarketOpportunity />} />
            <Route path="/event-simulator" element={<EventSimulator />} />
            <Route path="/community-commerce" element={<CommunityCommerceLab />} />
            <Route path="/localization" element={<Localization />} />
            <Route path="/right-message" element={<RightMessage />} />
            <Route path="/marketing-efficiency" element={<MarketingEfficiency />} />
            <Route path="/external-demand" element={<ExternalDemandRadar />} />
            <Route path="/merchandising" element={<Merchandising />} />
            <Route path="/conversion-funnel" element={<ConversionFunnel />} />
            <Route path="/ai-registry" element={<AIOpportunityRegistry />} />
            <Route path="/ai-workbench" element={<AIWorkbench />} />
            <Route path="/growth-impact" element={<GrowthImpactLab />} />
            <Route path="/executive-brief" element={<ExecutiveBrief />} />
            <Route path="*" element={<CommandCenter />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
