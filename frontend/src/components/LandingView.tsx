import React, { useState } from "react";
import { Skull, Sparkles, ArrowRight, Play, Check, Compass, Lock, Zap, Layers, Loader2 } from "lucide-react";
import { AppearanceSettings } from "../types";

interface LandingViewProps {
  onEnterApp: () => void;
  bookmarksCount: number;
  appearance: AppearanceSettings;
}

export default function LandingView({ onEnterApp, bookmarksCount, appearance }: LandingViewProps) {
  const [selectedPlan, setSelectedPlan] = useState<"hobby" | "premium">("premium");
  const [demoUrlInput, setDemoUrlInput] = useState("");
  const [demoState, setDemoState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [demoMsg, setDemoMsg] = useState("");
  const isLightTheme = appearance.theme === "light";

  const handleDemoCrawl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoUrlInput.trim()) return;
    setDemoState("loading");
    setDemoMsg("");
    try {
      const res = await fetch("/api/v1/links", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("access_token")}` },
        body: JSON.stringify({ url: demoUrlInput, source: "WEB_EXT" }),
      });
      if (!res.ok) throw new Error("Failed");
      setDemoState("done");
      setDemoMsg("Link saved! Redirecting to your archive...");
      setTimeout(onEnterApp, 1500);
    } catch {
      setDemoState("error");
      setDemoMsg("Could not save link. Make sure you are signed in.");
      setTimeout(() => setDemoState("idle"), 3000);
    }
  };

  return (
    <div className={`flex-grow flex-1 overflow-y-auto select-none font-sans scroll-smooth pb-24 bg-transparent relative z-10 w-full scrollbar-thin ${isLightTheme ? "text-gray-900" : "text-[#e3e2e6]"}`}>
      <header className={`h-16 px-8 flex items-center justify-between border-b sticky top-0 z-40 backdrop-blur-md ${isLightTheme ? "border-indigo-100/50 bg-white/45" : "border-[#1b1c25] bg-[#0c0d10]/45"}`}>
        <div className="flex items-center gap-2 animate-fadeIn">
          <Skull className="w-5 h-5 text-indigo-500 rotate-6 animate-pulse" />
          <span className={`font-headline font-bold text-sm tracking-widest uppercase ${isLightTheme ? "text-indigo-950" : "text-white"}`}>Link Graveyard</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={onEnterApp} className={`text-xs font-semibold cursor-pointer transition-colors ${isLightTheme ? "text-gray-700 hover:text-indigo-600" : "text-gray-400 hover:text-white"}`}>Sign In</button>
          <button onClick={onEnterApp} className={`px-4 py-2 border rounded-xl text-xs font-semibold cursor-pointer transition-all hover:scale-[1.01] ${isLightTheme ? "bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-500" : "bg-indigo-500/15 text-indigo-300 border-indigo-500/20 hover:bg-indigo-500/30"}`}>
            Launch Archive
          </button>
        </div>
      </header>

      <section className="text-center py-20 px-6 max-w-4xl mx-auto space-y-6 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono shadow-sm leading-none mx-auto border ${isLightTheme ? "bg-white text-indigo-700 border-indigo-150" : "bg-[#1c1d27] text-indigo-300 border-indigo-500/20"}`}>
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          <span>Intelligent Bookmarking for Digital Archivists</span>
        </div>
        <h1 className={`text-5xl font-headline font-extrabold tracking-tight leading-tight max-w-3xl mx-auto ${isLightTheme ? "text-gray-900" : "text-white"}`}>
          Where bookmarks come <span className="bg-gradient-to-r from-indigo-500 via-emerald-500 to-rose-500 bg-clip-text text-transparent">back to life.</span>
        </h1>
        <p className={`text-sm leading-relaxed max-w-2xl mx-auto font-sans ${isLightTheme ? "text-gray-600 font-medium" : "text-gray-400"}`}>
          A sovereign, fully persistent workspace to bury references, prevent link rot, and let AI models compute context summaries and intent graphs.
        </p>
        <div className="flex items-center justify-center gap-4 pt-4">
          <button onClick={onEnterApp} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg hover:scale-[1.01] transition-transform flex items-center gap-2 cursor-pointer">
            <span>Enter Archive</span>
          </button>
          <button onClick={() => document.getElementById("demo-section")?.scrollIntoView({ behavior: "smooth" })}
            className={`px-6 py-3 border text-xs font-semibold flex items-center gap-2 cursor-pointer rounded-xl transition-colors ${isLightTheme ? "bg-white hover:bg-indigo-50/20 border-indigo-150 text-indigo-700" : "bg-[#1e1f2b] hover:bg-[#252837] border-[#2b2a3d] text-gray-300"}`}>
            <Play className="w-3.5 h-3.5 text-indigo-500 fill-current" />
            <span>Try It Now</span>
          </button>
        </div>
      </section>

      <section id="demo-section" className="max-w-5xl mx-auto px-6 mb-24 select-none">
        <div className={`relative rounded-2xl border shadow-2xl overflow-hidden ${isLightTheme ? "glass-card-light border-indigo-100" : "glass-card border-[#232432]"}`}>
          <div className={`h-10 border-b px-4 flex items-center justify-between ${isLightTheme ? "bg-indigo-50/40 border-indigo-100/50" : "bg-[#07080a] border-[#232432]"}`}>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
            </div>
            <div className={`px-12 py-1 rounded text-[10px] font-mono truncate max-w-sm border ${isLightTheme ? "bg-white text-indigo-700 border-indigo-100" : "bg-[#14151e] border-[#232432] text-gray-400"}`}>
              linkgraveyard.app
            </div>
            <div className="w-6" />
          </div>
          <div className="p-8 space-y-6">
            <div className="text-center space-y-2">
              <span className="text-[10px] font-mono tracking-widest text-gray-500 uppercase block font-semibold">Save Your First Link</span>
              <h3 className={`text-lg font-headline font-bold ${isLightTheme ? "text-indigo-950" : "text-gray-200"}`}>Paste any URL to bury it now</h3>
            </div>
            <form onSubmit={handleDemoCrawl} className="max-w-lg mx-auto flex gap-2">
              <input
                type="url"
                required
                placeholder="https://example.com/article..."
                value={demoUrlInput}
                onChange={(e) => setDemoUrlInput(e.target.value)}
                disabled={demoState === "loading" || demoState === "done"}
                className={`flex-1 text-xs h-10 px-4 rounded-xl border focus:outline-none transition-colors ${isLightTheme ? "glass-input-light text-gray-800 border-indigo-150 focus:border-indigo-500" : "glass-input text-gray-300 focus:border-indigo-500"}`}
              />
              <button type="submit" disabled={demoState === "loading" || demoState === "done"}
                className="px-5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-sm flex items-center gap-1.5 transition-colors">
                {demoState === "loading" ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Save</span>}
              </button>
            </form>
            {demoMsg && (
              <div className={`p-3.5 max-w-lg mx-auto rounded-xl text-xs flex items-center gap-2.5 font-semibold border ${demoState === "error" ? "bg-rose-500/5 border-rose-500/25 text-rose-500" : "bg-emerald-500/5 border-emerald-500/25 text-emerald-600"}`}>
                <Compass className="w-4 h-4" />
                <span>{demoMsg}</span>
              </div>
            )}
            <p className={`text-center text-[11px] ${isLightTheme ? "text-gray-400" : "text-gray-500"}`}>
              {bookmarksCount > 0 ? `You have ${bookmarksCount} link${bookmarksCount > 1 ? "s" : ""} in your archive.` : "Sign in to save links to your archive."}
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 mb-24 space-y-4">
        <h3 className="text-xs font-mono font-bold tracking-widest text-gray-500 uppercase text-center mb-6">Designed for cognitive storage</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: <Zap className="w-4 h-4" />, color: "bg-indigo-500/10 text-indigo-500", title: "AI-Powered Summaries", desc: "Links are crawled and summarized automatically using AI. No more empty bookmark folders." },
            { icon: <Layers className="w-4 h-4" />, color: "bg-emerald-500/10 text-emerald-500", title: "Inferred Intent", desc: "We catalog not just what you bookmarked, but why — linking related research threads together." },
            { icon: <Lock className="w-4 h-4" />, color: "bg-rose-500/10 text-rose-500", title: "Anti Link-Rot Guard", desc: "Even if source sites disappear, your archive preserves the extracted content forever." },
          ].map((f, i) => (
            <div key={i} className={`border p-6 rounded-2xl space-y-3 ${isLightTheme ? "glass-card-light" : "glass-card"}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${f.color}`}>{f.icon}</div>
              <h4 className={`text-sm font-bold ${isLightTheme ? "text-indigo-950" : "text-gray-200"}`}>{f.title}</h4>
              <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 mb-12">
        <div className="text-center space-y-2 mb-12">
          <h2 className={`text-2xl font-headline font-extrabold ${isLightTheme ? "text-indigo-950" : "text-white"}`}>Simple pricing.</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          {[
            { key: "hobby", label: "Hobbyist", price: "$0", period: "forever", desc: "Try the core features.", features: ["25 links", "Basic summaries", "Web access"] },
            { key: "premium", label: "Archivist Premium", price: "$12", period: "month", desc: "For active researchers.", features: ["10,000 links", "AI summaries", "API access", "Memory query assistant"], recommended: true },
          ].map((plan) => (
            <div key={plan.key} onClick={() => setSelectedPlan(plan.key as any)}
              className={`p-6 rounded-2xl border cursor-pointer transition-all relative overflow-hidden ${selectedPlan === plan.key ? isLightTheme ? "bg-white/95 border-indigo-500 shadow-md scale-[1.01]" : "border-indigo-500/50 bg-[#161722] scale-[1.01]" : isLightTheme ? "glass-row-light border-indigo-100 hover:border-indigo-300" : "glass-row border-[#1c1d25] hover:border-gray-800"}`}>
              {plan.recommended && <div className="absolute top-0 right-0 px-2.5 py-0.5 bg-indigo-500 text-white rounded-bl-lg font-mono text-[9px] uppercase tracking-wider font-semibold">RECOMMENDED</div>}
              <h4 className={`text-sm font-bold uppercase font-mono mb-3 ${plan.recommended ? "text-indigo-500" : "text-gray-400"}`}>{plan.label}</h4>
              <p className={`text-3xl font-headline font-bold ${isLightTheme ? "text-indigo-950" : "text-white"}`}>{plan.price} <span className="text-xs text-gray-500 font-normal">/ {plan.period}</span></p>
              <p className="text-[11px] text-gray-500 mt-2 font-normal">{plan.desc}</p>
              <ul className={`space-y-2 mt-6 text-xs border-t pt-4 ${isLightTheme ? "border-indigo-50 text-gray-600" : "border-[#1b1c25] text-gray-400"}`}>
                {plan.features.map((f, i) => <li key={i} className="flex gap-2 items-center"><Check className={`w-3.5 h-3.5 ${plan.recommended ? "text-indigo-500" : isLightTheme ? "text-indigo-600" : "text-indigo-400"}`} />{f}</li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className="text-center mt-12 pb-12">
          <button onClick={onEnterApp} className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg cursor-pointer transform hover:scale-[1.01] transition-transform inline-flex items-center gap-2">
            <span>Enter the Archive</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      <footer className="text-center text-xs text-gray-500 border-t border-indigo-100/30 pt-8 max-w-4xl mx-auto">
        <p>2026 Link Graveyard. Your data, your archive.</p>
      </footer>
    </div>
  );
}
