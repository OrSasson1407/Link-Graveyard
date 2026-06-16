import React, { useState } from "react";
import { 
  Skull, 
  Sparkles, 
  ArrowRight, 
  Play, 
  Terminal, 
  Check, 
  Compass, 
  Lock,
  Zap,
  Layers,
  Search,
  CheckCircle2
} from "lucide-react";
import { AppearanceSettings } from "../types";

interface LandingViewProps {
  onEnterApp: () => void;
  bookmarksCount: number;
  appearance: AppearanceSettings;
}

export default function LandingView({ onEnterApp, bookmarksCount, appearance }: LandingViewProps) {
  const [selectedPlan, setSelectedPlan] = useState<"hobby" | "premium">("premium");
  const [demoUrlInput, setDemoUrlInput] = useState("");
  const [simulatedCrawlMsg, setSimulatedCrawlMsg] = useState("");

  const handleSimulatedCrawl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoUrlInput) return;
    setSimulatedCrawlMsg("Crawl pending... initializing headless AI browser nodes...");
    setTimeout(() => {
      setSimulatedCrawlMsg(`Success! Identified Web-standards document. Redirecting to dashboard archive context...`);
      setTimeout(() => {
        onEnterApp();
      }, 1500);
    }, 2000);
  };

  const isLightTheme = appearance.theme === "light";

  return (
    <div className={`flex-grow flex-1 overflow-y-auto select-none font-sans scroll-smooth pb-24 bg-transparent relative z-10 w-full scrollbar-thin ${isLightTheme ? "text-gray-900" : "text-[#e3e2e6]"}`}>
      {/* Top Marketing Navigation Header Bar */}
      <header className={`h-16 px-8 flex items-center justify-between border-b sticky top-0 z-40 backdrop-blur-md ${
        isLightTheme ? "border-indigo-100/50 bg-white/45" : "border-[#1b1c25] bg-[#0c0d10]/45"
      }`}>
        <div className="flex items-center gap-2 animate-fadeIn">
          <Skull className="w-5 h-5 text-indigo-500 rotate-6 animate-pulse" />
          <span className={`font-headline font-bold text-sm tracking-widest uppercase ${isLightTheme ? "text-indigo-950" : "text-white"}`}>Link Graveyard</span>
        </div>

        <div className="flex items-center gap-6">
          <span className={`inline-flex items-center gap-1.5 text-[9px] font-mono border px-2 py-0.5 rounded-full uppercase font-bold ${
            isLightTheme 
              ? "text-emerald-700 bg-emerald-50 border-emerald-200" 
              : "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
          }`}>
            v2.0 LIVE
          </span>
          <button 
            onClick={onEnterApp}
            className={`text-xs font-semibold hover:text-indigo-600 transition-colors cursor-pointer ${isLightTheme ? "text-gray-700" : "text-gray-400"}`}
          >
            Sign In
          </button>
          <button 
            onClick={onEnterApp}
            className={`px-4 py-2 border rounded-xl text-xs font-semibold cursor-pointer select-none transition-all hover:scale-[1.01] ${
              isLightTheme 
                ? "bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-500 shadow-sm" 
                : "bg-indigo-500/15 text-indigo-300 border-indigo-500/20 hover:bg-indigo-500/30"
            }`}
          >
            Launch Archive
          </button>
        </div>
      </header>

      {/* Hero Header Space Section */}
      <section className="text-center py-20 px-6 max-w-4xl mx-auto space-y-6 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />
        
        {/* Release Pill */}
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono shadow-sm leading-none mx-auto border ${
          isLightTheme 
            ? "bg-white text-indigo-700 border-indigo-150" 
            : "bg-[#1c1d27] text-indigo-300 border-indigo-500/20"
        }`}>
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          <span>Intelligent Bookmarking for Digital Archivists</span>
        </div>

        {/* Epic Headliner */}
        <h1 className={`text-5xl font-headline font-extrabold tracking-tight leading-tight max-w-3xl mx-auto ${
          isLightTheme ? "text-gray-900" : "text-white"
        }`}>
          Where bookmarks come <span className="bg-gradient-to-r from-indigo-550 via-emerald-500 to-rose-455 bg-clip-text text-transparent">back to life.</span>
        </h1>

        <p className={`text-sm leading-relaxed max-w-2xl mx-auto font-sans ${isLightTheme ? "text-gray-650 font-medium" : "text-gray-400"}`}>
          A sovereign, fully persistent workspace to bury references, prevent link rot, 
          and let server-hosted Gemini AI models compute context summaries and intent graphs.
        </p>

        {/* CTAs */}
        <div className="flex items-center justify-center gap-4 pt-4">
          <button
            onClick={onEnterApp}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg hover:scale-[1.01] transition-transform flex items-center gap-2 cursor-pointer"
          >
            <span>Start Reviving</span>
            <span className="text-[10px] font-mono bg-indigo-700/80 px-1.5 py-0.5 rounded border border-indigo-500">⌘K</span>
          </button>
          <button
            onClick={() => {
              const el = document.getElementById("product-demo-view");
              el?.scrollIntoView({ behavior: "smooth" });
            }}
            className={`px-6 py-3 border text-xs font-semibold flex items-center gap-2 cursor-pointer rounded-xl transition-colors ${
              isLightTheme 
                ? "bg-white hover:bg-indigo-50/20 border-indigo-150 text-indigo-700" 
                : "bg-[#1e1f2b] hover:bg-[#252837] border-[#2b2a3d] text-gray-300"
            }`}
          >
            <Play className="w-3.5 h-3.5 text-indigo-500 fill-current" />
            <span>Interactive Demo</span>
          </button>
        </div>
      </section>

      {/* Interactive Browser Demo Sandbox Mockup */}
      <section id="product-demo-view" className="max-w-5xl mx-auto px-6 mb-24 select-none">
        <div className={`relative rounded-2xl border shadow-2xl overflow-hidden ${
          isLightTheme ? "glass-card-light border-indigo-100" : "glass-card border-[#232432]"
        }`}>
          {/* Header Bar */}
          <div className={`h-10 border-b px-4 flex items-center justify-between ${
            isLightTheme ? "bg-indigo-55/40 border-indigo-100/50" : "bg-[#07080a] border-[#232432]"
          }`}>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
            </div>
            <div className={`px-12 py-1 rounded text-[10px] font-mono truncate max-w-sm border ${
              isLightTheme 
                ? "bg-white text-indigo-700 border-indigo-100" 
                : "bg-[#14151e] border-[#232432] text-gray-400"
            }`}>
              https://graveyard.ai/demo-sandbox
            </div>
            <div className="w-6" />
          </div>

          {/* Sandbox Inside content */}
          <div className="p-8 space-y-6">
            <div className="text-center space-y-2">
              <span className="text-[10px] font-mono tracking-widest text-gray-500 uppercase block font-semibold">Interactive AI Sandbox</span>
              <h3 className={`text-lg font-headline font-bold ${isLightTheme ? "text-indigo-950" : "text-gray-205"}`}>Preserve your first reference in real-time</h3>
            </div>

            <form onSubmit={handleSimulatedCrawl} className="max-w-lg mx-auto flex gap-2">
              <input
                type="text"
                placeholder="Paste any article link, e.g., github.com/react/rfc..."
                value={demoUrlInput}
                onChange={(e) => setDemoUrlInput(e.target.value)}
                className={`flex-1 text-xs h-10 px-4 rounded-xl border focus:outline-none transition-colors ${
                  isLightTheme 
                    ? "glass-input-light text-gray-805 border-indigo-150 focus:bg-white focus:border-indigo-500" 
                    : "glass-input text-gray-300 focus:bg-white/5 focus:border-indigo-500 text-xs"
                }`}
              />
              <button 
                type="submit" 
                className="px-5 bg-emerald-605 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-sm"
              >
                Crawl
              </button>
            </form>

            {simulatedCrawlMsg && (
              <div className="p-3.5 max-w-lg mx-auto bg-emerald-500/5 border border-emerald-500/25 text-emerald-605 rounded-xl text-xs flex items-center gap-2.5 font-semibold">
                <Compass className="w-4 h-4 text-emerald-500 rotate-12 animate-spin" />
                <span>{simulatedCrawlMsg}</span>
              </div>
            )}

            {/* Simulated Live preview UI mock */}
            <div className={`border rounded-xl p-5 max-w-md mx-auto space-y-3 shadow-md relative overflow-hidden ${
              isLightTheme ? "bg-white/90 border-indigo-150" : "bg-[#0e1014] border-[#1f202c]"
            }`}>
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-indigo-500/5 pointer-events-none rounded-full" />
              <div className="flex items-center justify-between text-[10px] font-mono text-gray-500">
                <span>github.com/react</span>
                <span>Active Vault: {bookmarksCount} items</span>
              </div>
              <h4 className={`text-xs font-bold ${isLightTheme ? "text-indigo-950" : "text-gray-300"}`}>React Server Components design models</h4>
              <p className="text-[11px] text-gray-500 leading-normal">
                "RSCs run exclusively on servers. This lets authors leverage Node-side data adapters seamlessly..."
              </p>
              <div className="flex gap-2">
                <span className={`text-[9.5px] font-mono px-2 py-0.5 rounded border ${isLightTheme ? "bg-indigo-50 text-indigo-600 border-indigo-100" : "bg-indigo-500/10 text-indigo-300 border-indigo-500/15"}`}>#react</span>
                <span className={`text-[9.5px] font-mono px-2 py-0.5 rounded border ${isLightTheme ? "bg-indigo-50 text-indigo-600 border-indigo-100" : "bg-indigo-500/10 text-indigo-300 border-indigo-500/15"}`}>#architecture</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Bento Grid Block */}
      <section className="max-w-5xl mx-auto px-6 mb-24 space-y-4">
        <h3 className="text-xs font-mono font-bold tracking-widest text-gray-500 uppercase text-center mb-6">Designed for cognitive storage</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className={`border p-6 rounded-2xl space-y-3 relative overflow-hidden ${
            isLightTheme ? "glass-card-light" : "glass-card"
          }`}>
            <div className="w-8 h-8 rounded-lg bg-indigo-550/10 flex items-center justify-center text-indigo-500">
              <Zap className="w-4 h-4" />
            </div>
            <h4 className={`text-sm font-bold ${isLightTheme ? "text-indigo-950" : "text-gray-200"}`}>AI-Powered Summaries</h4>
            <p className="text-xs text-gray-500 leading-relaxed">
              Our automated browser queues crawl URLs on the server to distill semantic summaries using Gemini's context logic. No more empty bookmarks folders.
            </p>
          </div>

          <div className={`border p-6 rounded-2xl space-y-3 relative overflow-hidden ${
            isLightTheme ? "glass-card-light" : "glass-card"
          }`}>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-505">
              <Layers className="w-4 h-4" />
            </div>
            <h4 className={`text-sm font-bold ${isLightTheme ? "text-indigo-950" : "text-gray-200"}`}>Inferred Intent Tracker</h4>
            <p className="text-xs text-gray-500 leading-relaxed">
              We catalog not just *what* you bookmarked, but *why* you saved it. Linking related terms based on active study models.
            </p>
          </div>

          <div className={`border p-6 rounded-2xl space-y-3 relative overflow-hidden ${
            isLightTheme ? "glass-card-light" : "glass-card"
          }`}>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-500">
              <Lock className="w-4 h-4" />
            </div>
            <h4 className={`text-sm font-bold ${isLightTheme ? "text-indigo-950" : "text-gray-200"}`}>Anti Link-Rot Guard</h4>
            <p className="text-xs text-gray-500 leading-relaxed">
              Tombstoned files are frozen in time. Even if source sites disappear, your sovereign archive preserves the extracted textual substance forever.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Tiers Section */}
      <section className="max-w-4xl mx-auto px-6 mb-12 select-none font-bold">
        <div className="text-center space-y-2 mb-12">
          <span className="text-[10px] font-mono tracking-widest text-gray-550 uppercase block">No commitments</span>
          <h2 className={`text-2xl font-headline font-extrabold ${isLightTheme ? "text-indigo-950" : "text-white"}`}>Sovereign utility, priced right.</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          {/* Card A: Free tier */}
          <div 
            onClick={() => setSelectedPlan("hobby")}
            className={`p-6 rounded-2xl border cursor-pointer transition-all ${
              selectedPlan === "hobby" 
                ? isLightTheme 
                  ? "bg-white/95 border-indigo-500 shadow-md scale-[1.01]" 
                  : "border-indigo-500/40 relative bg-[#14151c] scale-[1.01]" 
                : isLightTheme 
                  ? "glass-row-light border-indigo-100 hover:border-indigo-300" 
                  : "glass-row border-[#1c1d25] hover:border-gray-800"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-gray-400 uppercase font-mono">Hobbyist</h4>
              <span className="text-xs font-semibold text-gray-300">Free</span>
            </div>
            <p className={`text-3xl font-headline font-bold ${isLightTheme ? "text-indigo-950" : "text-white"}`}>$0 <span className="text-xs text-gray-500 font-normal">/ month</span></p>
            <p className="text-[11px] text-gray-500 mt-2 font-normal">Simple workspace to sample core features.</p>
            
            <ul className={`space-y-2 mt-6 text-xs border-t pt-4 ${isLightTheme ? "border-indigo-50 text-gray-600" : "border-[#1b1c25] text-gray-400"}`}>
              <li className="flex gap-2 items-center"><Check className={`w-3.5 h-3.5 ${isLightTheme ? "text-indigo-600" : "text-indigo-400"}`} /> Limit: 25 links buried</li>
              <li className="flex gap-2 items-center"><Check className={`w-3.5 h-3.5 ${isLightTheme ? "text-indigo-600" : "text-indigo-400"}`} /> Static summaries only</li>
              <li className="flex gap-2 items-center"><Check className={`w-3.5 h-3.5 ${isLightTheme ? "text-indigo-600" : "text-indigo-400"}`} /> Standard web portal access</li>
            </ul>
          </div>

          {/* Card B: Premium Tier */}
          <div 
            onClick={() => setSelectedPlan("premium")}
            className={`p-6 rounded-2xl border cursor-pointer transition-all relative overflow-hidden ${
              selectedPlan === "premium" 
                ? isLightTheme 
                  ? "bg-white/95 border-indigo-650 shadow-md scale-[1.01]" 
                  : "border-indigo-500/50 bg-[#161722] scale-[1.01]" 
                : isLightTheme 
                  ? "glass-row-light border-indigo-150 hover:border-indigo-350" 
                  : "glass-row border-[#1c1d25] hover:border-gray-800"
            }`}
          >
            <div className="absolute top-0 right-0 px-2.5 py-0.5 bg-indigo-500 text-white rounded-bl-lg font-mono text-[9px] uppercase tracking-wider font-semibold">
              RECOMMENDED
            </div>
            <div className="flex items-center justify-between mb-4 font-bold">
              <h4 className="text-sm font-bold text-indigo-500 uppercase font-mono">Archivist Premium</h4>
              <span className="text-xs font-semibold text-indigo-500">Popular</span>
            </div>
            <p className={`text-3xl font-headline font-bold ${isLightTheme ? "text-indigo-955" : "text-white"}`}>$12 <span className="text-xs text-indigo-500 font-normal">/ month</span></p>
            <p className="text-[11px] text-gray-500 mt-2 font-normal">Deep learning crawlers configured for active researchers.</p>

            <ul className={`space-y-2 mt-6 text-xs border-t pt-4 ${isLightTheme ? "border-indigo-50 text-gray-600" : "border-indigo-500/10 text-gray-305"}`}>
              <li className="flex gap-2 items-center"><Check className="w-3.5 h-3.5 text-indigo-500" /> Up to 10,000 links preserved</li>
              <li className="flex gap-2 items-center"><Check className="w-3.5 h-3.5 text-indigo-500" /> Dynamic server-side AI summaries</li>
              <li className="flex gap-2 items-center"><Check className="w-3.5 h-3.5 text-indigo-500" /> API access token limits</li>
              <li className="flex gap-2 items-center"><Check className="w-3.5 h-3.5 text-indigo-500" /> Real-time active memory query assistant</li>
            </ul>
          </div>
        </div>

        <div className="text-center mt-12 pb-12">
          <button 
            onClick={onEnterApp}
            className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg cursor-pointer transform hover:scale-[1.01] transition-transform inline-flex items-center gap-2"
          >
            <span>Proceed to Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center text-xs text-gray-500 border-t border-indigo-100/30 pt-8 max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <p>© 2026 Sovereign Archival Systems Corp. All data stored is encrypted under client keys.</p>
        <div className="flex items-center gap-4">
          <a href="#privacy" onClick={(e) => e.preventDefault()} className="hover:text-indigo-650">Privacy</a>
          <a href="#terms" onClick={(e) => e.preventDefault()} className="hover:text-indigo-650">Terms</a>
          <a href="#system" onClick={(e) => { e.preventDefault(); alert("SYSTEM STATUS: NOMINAL (Core Node 01)"); }} className="hover:text-emerald-500">System State: Live</a>
        </div>
      </footer>

    </div>
  );
}
