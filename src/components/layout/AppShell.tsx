import { useEffect, useRef, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { GuidedDemo } from "./GuidedDemo";

export function AppShell() {
  const [mobileNav, setMobileNav] = useState(false);
  const { pathname } = useLocation();
  const mainRef = useRef<HTMLDivElement>(null);

  // Scroll to top on navigation.
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div className="min-h-screen bg-canvas">
      <Sidebar mobileOpen={mobileNav} onClose={() => setMobileNav(false)} />

      <div className="lg:pl-64 print:pl-0">
        <TopBar onMenu={() => setMobileNav(true)} />

        <main ref={mainRef} className="min-h-[calc(100vh-104px)]">
          <div className="mx-auto max-w-[1320px] px-4 py-6 lg:px-8 lg:py-8">
            <Outlet />
          </div>

          <footer className="mt-8 border-t border-border bg-surface/50 print:hidden">
            <div className="mx-auto flex max-w-[1320px] flex-col gap-2 px-4 py-5 text-[11.5px] text-ink-muted sm:flex-row sm:items-center sm:justify-between lg:px-8">
              <p>
                <span className="font-medium text-ink-secondary">Vuori View</span> — Commercial Intelligence
                for DTC Growth · Synthetic-data prototype
              </p>
              <p className="max-w-xl sm:text-right">
                Portfolio demo using synthetic data. Not affiliated with Vuori and does not use proprietary
                Vuori data.
              </p>
            </div>
          </footer>
        </main>
      </div>

      <GuidedDemo />
    </div>
  );
}
