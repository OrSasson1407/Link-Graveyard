import React, { useState } from "react";
import { 
  Search, 
  Sparkles, 
  Bell, 
  ArrowUpRight, 
  BookOpen, 
  Loader2, 
  Clock, 
  FileText,
  Compass,
  AlertCircle
} from "lucide-react";
import { Bookmark, UserProfile, AppearanceSettings } from "../types";

interface DashboardViewProps {
  bookmarks: Bookmark[];
  profile: UserProfile;
  appearance: AppearanceSettings;
  onSelectBookmark: (bookmark: Bookmark) => void;
  onOpenNewEntryModal: () => void;
  onQueryAi: (prompt: string) => Promise<{ query: string; response: string; timestamp: string }>;
  aiHistory: Array<{ query: string; response: string; timestamp: string }>;
}

export default function DashboardView({
  bookmarks,
  profile,
  appearance,
  onSelectBookmark,
  onOpenNewEntryModal,
  onQueryAi,
  aiHistory
}: DashboardViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAiDrawer, setShowAiDrawer] = useState(false);
  const [aiPromptInput, setAiPromptInput] = useState("");
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [tempAlert, setTempAlert] = useState("");

  const accentColorText = {
    indigo: "text-indigo-400",
    emerald: "text-emerald-400",
    rose: "text-rose-400"
  }[appearance.accent];

  const accentBorder = {
    indigo: "border-indigo-500/20 hover:border-indigo-500/50",
    emerald: "border-emerald-500/20 hover:border-emerald-500/50",
    rose: "border-rose-500/20 hover:border-rose-500/50"
  }[appearance.accent];

  const accentBg = {
    indigo: "bg-[#1f2030]",
    emerald: "bg-[#182620]",
    rose: "bg-[#281a1d]"
  }[appearance.accent];

  const themeThemeClass = {
    indigo: "text-indigo-400 border-indigo-400 bg-indigo-500/10",
    emerald: "text-emerald-400 border-emerald-400 bg-emerald-500/10",
    rose: "text-rose-400 border-rose-400 bg-rose-500/10"
  }[appearance.accent];

  // Filter Bookmarks based on query
  const filteredBurials = bookmarks.filter(b => 
    b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
    b.domain.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Take top 5 recent
  const recentBurials = filteredBurials.slice(0, 5);

  // Revivals surfaced: status === "REVIVED"
  const recentRevivals = bookmarks.filter(b => b.status === "REVIVED").slice(0, 3);

  // Dynamic values
  const totalBuriest = bookmarks.length;
  const totalRevived = bookmarks.filter(b => b.status === "REVIVED").length;
  const totalSummaries = bookmarks.filter(b => b.summary && b.summary.length > 5).length;

  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPromptInput.trim()) return;
    setIsLoadingAi(true);
    try {
      await onQueryAi(aiPromptInput);
      setAiPromptInput("");
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingAi(false);
    }
  };

  const triggerSearchRedirect = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setTempAlert(`Filtered ${filteredBurials.length} records. See them below!`);
      setTimeout(() => setTempAlert(""), 3000);
    }
  };

  const isLightTheme = appearance.theme === "light";

  return (
    <div className="flex-1 min-h-screen bg-transparent flex flex-col font-sans relative">
      {/* Dynamic Top Bar */}
      <header className={`h-16 border-b px-8 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md ${
        isLightTheme 
          ? "border-[#6366f1]/10 bg-white/40 text-gray-800" 
          : "border-white/5 bg-[#05070a]/40 text-white"
      }`}>
        {/* Search input with trigger */}
        <form onSubmit={triggerSearchRedirect} className="w-96 relative group">
          <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${
            isLightTheme ? "text-gray-400 group-focus-within:text-indigo-600" : "text-gray-500 group-focus-within:text-indigo-400"
          }`} />
          <input
            type="text"
            placeholder="Search buried archives... (⌘K)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full h-10 pl-10 pr-4 rounded-xl border focus:outline-none text-xs transition-all duration-200 ${
              isLightTheme 
                ? "glass-input-light text-gray-800 focus:bg-white focus:border-indigo-500" 
                : "glass-input text-gray-200 focus:bg-white/5 focus:border-indigo-400"
            }`}
            id="global-search-input"
          />
          <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-mono border px-1.5 py-0.5 rounded shadow-sm ${
            isLightTheme 
              ? "bg-gray-100 text-gray-500 border-gray-200" 
              : "bg-[#1c1d24] text-gray-400 border-[#2e2f3d]"
          }`}>
            ⌘K
          </span>
        </form>
 
        {/* Global Nav Elements */}
        <div className={`flex items-center gap-6 text-xs font-semibold select-none ${isLightTheme ? "text-gray-600" : "text-gray-400"}`}>
          <a href="#docs" onClick={(e) => { e.preventDefault(); setTempAlert("Docs: Accessing deep preservation protocols..."); }} className={`transition-colors ${isLightTheme ? "hover:text-indigo-600" : "hover:text-white"}`}>Docs</a>
          <span className={`w-1.5 h-1.5 rounded-full ${isLightTheme ? "bg-gray-300" : "bg-gray-700"}`} />
          <a href="#api" onClick={(e) => { e.preventDefault(); setTempAlert("API key vectors ready. See Settings -> Integrations."); }} className={`transition-colors ${isLightTheme ? "hover:text-indigo-600" : "hover:text-white"}`}>API</a>
          <span className={`w-1.5 h-1.5 rounded-full ${isLightTheme ? "bg-gray-300" : "bg-gray-700"}`} />
          <a href="#changelog" onClick={(e) => { e.preventDefault(); setTempAlert("Changelog: v2.0 is fully active. System: Nominal."); }} className={`transition-colors ${isLightTheme ? "hover:text-indigo-600" : "hover:text-white"}`}>Changelog</a>
 
          <div className={`flex items-center gap-3 border-l pl-6 ${isLightTheme ? "border-gray-200" : "border-white/5"}`}>
            <button 
              onClick={() => setTempAlert("Notifications: 0 unprocessed deadlocks in the pipeline.")}
              className={`p-2 rounded-lg border transition-all duration-200 hover:scale-105 ${
                isLightTheme 
                  ? "bg-white/80 border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-900" 
                  : "bg-white/5 border-white/5 text-gray-400 hover:text-white"
              }`}
            >
              <Bell className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setShowAiDrawer(true)} 
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md cursor-pointer hover:scale-[1.02] ${themeThemeClass}`}
              id="header-query-ai-btn"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Query AI</span>
            </button>
          </div>
        </div>
      </header>
 
      {/* Main Container */}
      <div className="p-8 max-w-7xl mx-auto w-full space-y-8 flex-1 grid-bg xl:px-12 select-none relative z-10">
        {/* Alerts / Success Notifications */}
        {tempAlert && (
          <div className="p-3.5 rounded-xl border border-indigo-500/20 bg-indigo-500/5 text-xs text-indigo-400 flex items-center gap-2.5 animate-fadeIn">
            <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
            <span>{tempAlert}</span>
          </div>
        )}
 
        {/* Welcome Banner */}
        <div className={`rounded-2xl p-6 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6 ${
          isLightTheme ? "glass-panel-light text-gray-800" : "glass-panel text-white"
        }`}>
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-rose-500/5 via-transparent to-transparent pointer-events-none rounded-full blur-3xl animate-pulse" />
          <div className="relative z-10">
            <h2 className="text-lg font-headline font-bold flex items-center gap-2">
              Welcome back, <span className={isLightTheme ? "text-indigo-600" : "text-[#c0c1ff]"}>Archivist</span>
            </h2>
            <p className={`text-xs mt-1 max-w-xl leading-relaxed ${isLightTheme ? "text-gray-600" : "text-gray-400"}`}>
              Your server-side AI model is highly optimized. Active index: <strong className={isLightTheme ? "text-gray-800" : "text-gray-200"}>{totalBuriest}</strong> entities.
              Any new link you add will be summarized and tagged instantly using server-grade AI capabilities.
            </p>
          </div>
          <button 
            onClick={onOpenNewEntryModal}
            className={`px-4 py-2.5 border text-xs font-semibold rounded-xl transition-all shadow-sm flex items-center gap-1.5 ${
              isLightTheme 
                ? "bg-white/80 hover:bg-gray-100/50 border-indigo-100 text-indigo-700" 
                : "bg-white/5 hover:bg-white/10 border-white/10 text-gray-200"
            }`}
          >
            <span>Bury New Link</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
 
        {/* Core Multi-Module Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Stat 1 */}
          <div className={`p-6 rounded-2xl relative shadow-md ${
            isLightTheme ? "glass-card-light text-gray-800" : "glass-card text-white"
          }`}>
            <span className={`text-[10px] font-mono tracking-widest uppercase block ${isLightTheme ? "text-gray-500" : "text-[#a6a4b5]"}`}>
              Total Links Buried
            </span>
            <div className="flex items-baseline gap-3 mt-2">
              <h3 className={`text-3xl font-headline font-bold ${isLightTheme ? "text-indigo-950" : "text-gray-100"}`}>{totalBuriest}</h3>
              <span className="text-[10px] font-mono text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-full font-bold">
                +12 this week
              </span>
            </div>
            <p className={`text-[11px] mt-2 ${isLightTheme ? "text-gray-500" : "text-gray-400"}`}>Permanently preserved from server rot.</p>
          </div>
 
          {/* Stat 2 */}
          <div className={`p-6 rounded-2xl relative shadow-md ${
            isLightTheme ? "glass-card-light text-gray-800" : "glass-card text-white"
          }`}>
            <span className={`text-[10px] font-mono tracking-widest uppercase block ${isLightTheme ? "text-gray-500" : "text-[#a6a4b5]"}`}>
              Revived Today
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <h3 className={`text-3xl font-headline font-bold ${isLightTheme ? "text-indigo-950" : "text-gray-100"}`}>{totalRevived}</h3>
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full font-bold ${isLightTheme ? "text-indigo-600 bg-indigo-50" : "text-indigo-400 bg-indigo-500/10"}`}>
                Surfaced via contextual AI
              </span>
            </div>
            <p className={`text-[11px] mt-2 ${isLightTheme ? "text-gray-500" : "text-gray-400"}`}>Entities pulled from active research intent.</p>
          </div>
 
          {/* Stat 3 */}
          <div className={`p-6 rounded-2xl relative shadow-md ${
            isLightTheme ? "glass-card-light text-gray-800" : "glass-card text-white"
          }`}>
            <span className={`text-[10px] font-mono tracking-widest uppercase block ${isLightTheme ? "text-gray-500" : "text-[#a6a4b5]"}`}>
              AI Summaries Active
            </span>
            <div className="flex items-baseline gap-1.5 mt-2">
              <h3 className={`text-3xl font-headline font-bold ${isLightTheme ? "text-indigo-950" : "text-gray-100"}`}>{totalSummaries}</h3>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                isLightTheme ? "bg-gray-100 border-gray-200 text-gray-500" : "bg-[#1f2029] border-[#2d2c3d] text-gray-400"
              }`}>
                Queue: 00
              </span>
            </div>
            <p className={`text-[11px] mt-2 ${isLightTheme ? "text-gray-500" : "text-gray-400"}`}>Clean semantic layers successfully computed.</p>
          </div>
        </div>

        {/* Dynamic Inner Layout split Column */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Burials Segment: 2/3 width */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between pb-2">
              <h3 className={`text-xs font-mono font-bold tracking-widest uppercase ${isLightTheme ? "text-gray-500" : "text-gray-400"}`}>
                Recent Burials
              </h3>
              <span className={`text-xs font-semibold cursor-pointer transition-colors ${isLightTheme ? "text-indigo-600 hover:text-indigo-700" : "text-indigo-400 hover:text-indigo-300"}`}>
                Active Filtering: {recentBurials.length}
              </span>
            </div>
 
            {recentBurials.length === 0 ? (
              <div className={`p-12 text-center rounded-2xl border border-dashed ${
                isLightTheme ? "border-indigo-100 bg-white" : "border-[#2b2a3a] bg-white/5"
              }`}>
                <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-xs text-gray-500">No tombstones matches active filters.</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {recentBurials.map((bookmark) => {
                  const isHighlighted = bookmark.status === "REVIVED";
                  return (
                    <div
                      key={bookmark.id}
                      onClick={() => onSelectBookmark(bookmark)}
                      className={`p-5 rounded-2xl border cursor-pointer transition-all duration-200 flex items-start gap-4 justify-between relative overflow-hidden ${
                        isLightTheme ? "glass-row-light" : "glass-row"
                      } ${
                        isHighlighted 
                          ? "border-emerald-500/40 relative before:content-[''] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[3px] before:bg-emerald-400" 
                          : isLightTheme ? "border-indigo-50/60" : "border-white/5"
                      }`}
                      id={`tombstone-${bookmark.id}`}
                    >
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className={`text-[10px] uppercase tracking-wider font-mono px-1.5 py-0.5 rounded border ${
                            isLightTheme 
                              ? "text-indigo-700 bg-indigo-50/50 border-indigo-100/30" 
                              : "text-gray-400 bg-white/5 border-white/5"
                          }`}>
                            {bookmark.domain}
                          </span>
                          <span className={`text-[10px] font-mono ${isLightTheme ? "text-gray-500" : "text-gray-400"}`}>
                            {bookmark.readingTime || "5m read"}
                          </span>
                        </div>
                        <h4 className={`text-xs font-bold transition-colors truncate ${isLightTheme ? "text-gray-900 group-hover:text-indigo-600" : "text-gray-200 group-hover:text-white"}`}>
                          {bookmark.title}
                        </h4>
                        <p className={`text-xs mt-1 line-clamp-2 md:line-clamp-1 ${isLightTheme ? "text-gray-600" : "text-gray-400"}`}>
                          {bookmark.summary}
                        </p>
                        <div className="flex items-center gap-1.5 mt-2.5">
                          {bookmark.tags.map(tag => (
                            <span 
                              key={tag} 
                              className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                                isLightTheme ? "text-indigo-600 bg-indigo-50" : "text-[#c0c1ff] bg-white/5"
                              }`}
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className={`flex flex-col items-end justify-between self-stretch text-[10px] font-mono whitespace-nowrap ${isLightTheme ? "text-gray-500" : "text-gray-400"}`}>
                        <span>{new Date(bookmark.addedAt).toLocaleDateString([], { month: "short", day: "numeric" })}</span>
                        <div className="flex items-center gap-1">
                          <span className={`w-2 h-2 rounded-full ${
                            bookmark.status === "REVIVED" ? "bg-emerald-500" :
                            bookmark.status === "PROCESSING" ? "bg-amber-500 animate-pulse" : "bg-gray-750"
                          }`} />
                          <span className="text-[9px] tracking-wider uppercase font-semibold">{bookmark.status}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
 
          {/* Right Column Segment: Ambient Intelligence & Recent Revivals */}
          <div className="space-y-6">
            <div className="pb-1">
              <h3 className={`text-xs font-mono font-bold tracking-widest uppercase ${isLightTheme ? "text-gray-500" : "text-gray-400"}`}>
                Contextual Revivals
              </h3>
              <p className={`text-[10px] mt-1 ${isLightTheme ? "text-gray-650" : "text-gray-400"}`}>
                Surfaced based on research trends related to architecture & development systems.
              </p>
            </div>
 
            <div className={`border p-5 rounded-2xl space-y-4 ${
              isLightTheme ? "glass-card-light" : "glass-card"
            }`}>
              {recentRevivals.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-500">
                  No revived active files. Trigger revival via lists!
                </div>
              ) : (
                <div className={`space-y-4 divide-y ${isLightTheme ? "divide-indigo-100/50" : "divide-white/5"}`}>
                  {recentRevivals.map((rec) => (
                    <div 
                      key={rec.id}
                      onClick={() => onSelectBookmark(rec)}
                      className="group cursor-pointer block pb-3 last:border-0 last:pb-0"
                    >
                      <span className="text-[9px] font-mono text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-full uppercase font-bold">
                        Sovereign Resurgence
                      </span>
                      <h4 className={`text-xs font-bold transition-colors mt-2 group-hover:text-indigo-600 ${
                        isLightTheme ? "text-gray-900" : "text-gray-300 group-hover:text-emerald-300"
                      }`}>
                        {rec.title}
                      </h4>
                      <p className={`text-[10px] mt-0.5 ${isLightTheme ? "text-gray-500" : "text-gray-450"}`}>
                        {rec.domain} • Saved {new Date(rec.addedAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
 
            {/* Quick AI Terminal Widget preview */}
            <div className={`border rounded-2xl p-5 space-y-3 relative overflow-hidden ${
              isLightTheme ? "glass-card-light" : "glass-card"
            }`}>
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 blur-xl rounded-full" />
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                <h4 className={`text-xs font-bold ${isLightTheme ? "text-indigo-950" : "text-gray-200"}`}>Sovereign Intel Core</h4>
              </div>
              <p className={`text-[11px] leading-relaxed ${isLightTheme ? "text-gray-600" : "text-gray-400"}`}>
                Ask anything about your saved files. Example: <em>“Do I have any WebGL shaders?”</em> or <em>“Find my Figma component library bookmarks.”</em>
              </p>
              <button
                onClick={() => setShowAiDrawer(true)}
                className={`w-full py-2 border rounded-xl text-[11px] font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer hover:scale-[1.01] ${
                  isLightTheme 
                    ? "bg-white hover:bg-neutral-50/50 border-indigo-100 text-indigo-700" 
                    : "bg-[#212333] hover:bg-[#282a3d] border-[#3e415a] text-indigo-200"
                }`}
              >
                <span>Initialize Memory Query</span>
              </button>
            </div>
          </div>
        </div>
      </div>
 
      {/* AI Memory Search and Grounding Drawer Modal (Drawer overlay) */}
      {showAiDrawer && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex justify-end animate-fadeIn">
          <div className={`w-[450px] h-full border-l p-6 flex flex-col justify-between shadow-2xl relative select-text backdrop-blur-2xl ${
            isLightTheme 
              ? "glass-sidebar-light border-indigo-100 bg-white/75 text-indigo-955" 
              : "glass-sidebar border-white/5 bg-[#0c0d10]/75 text-white"
          }`}>
            {/* Drawer Header */}
            <div>
              <div className={`flex items-center justify-between pb-4 border-b ${isLightTheme ? "border-indigo-100/50" : "border-[#23242f]"}`}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className={`text-xs font-mono font-bold uppercase tracking-widest ${isLightTheme ? "text-gray-900" : "text-gray-200"}`}>AI Contextual Search</h3>
                    <span className={`text-[10px] block ${isLightTheme ? "text-gray-500" : "text-gray-400"}`}>Grounding via {bookmarks.length} turing vectors</span>
                  </div>
                </div>
                <button 
                  onClick={() => setShowAiDrawer(false)}
                  className={`p-1 px-2.5 text-xs rounded transition-colors cursor-pointer ${
                    isLightTheme ? "hover:bg-indigo-500/5 text-gray-500 hover:text-indigo-600" : "hover:bg-[#1a1c25] text-gray-400 hover:text-white"
                  }`}
                >
                  Close
                </button>
              </div>
 
              {/* Saved Query logs inline content */}
              <div className="mt-5 space-y-4 h-[calc(100vh-220px)] overflow-y-auto pr-2">
                {aiHistory.length === 0 ? (
                  <div className="py-24 text-center text-gray-500 text-xs">
                    <Compass className="w-8 h-8 text-indigo-500 mx-auto mb-2 animate-spin" style={{ animationDuration: "12s" }} />
                    <p>Enter a query below. Grounding models will analyze your bookmarks state on the server context.</p>
                  </div>
                ) : (
                  aiHistory.map((hist, i) => (
                    <div key={i} className={`p-4 rounded-xl border space-y-2 ${
                      isLightTheme ? "bg-white border-indigo-100" : "bg-black/20 border-white/5"
                    }`}>
                      <div className={`flex items-center justify-between text-[10px] font-mono pb-1 border-b ${
                        isLightTheme ? "text-gray-500 border-gray-100" : "text-gray-400 border-white/5"
                      }`}>
                        <span>QUERY</span>
                        <span>{new Date(hist.timestamp).toLocaleTimeString([], { hour: "numeric", minute: "numeric" })}</span>
                      </div>
                      <p className={`text-xs font-semibold ${isLightTheme ? "text-gray-900" : "text-gray-300"}`}>"{hist.query}"</p>
                      <div className={`text-[11px] p-3 rounded border whitespace-pre-line leading-relaxed ${
                        isLightTheme ? "bg-indigo-50/30 border-indigo-100 text-indigo-950" : "bg-black/10 border-white/5 text-gray-300"
                      }`}>
                        {hist.response}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
 
            {/* Input field Form */}
            <form onSubmit={handleAiSubmit} className={`pt-4 border-t flex gap-2 ${isLightTheme ? "border-indigo-100/50" : "border-[#23242f]"}`}>
              <input
                type="text"
                placeholder="Ask your archive, e.g., webgl, react..."
                value={aiPromptInput}
                onChange={(e) => setAiPromptInput(e.target.value)}
                disabled={isLoadingAi}
                className={`flex-1 h-10 px-4 rounded-xl border focus:outline-none text-xs transition-all ${
                  isLightTheme 
                    ? "glass-input-light text-gray-800 focus:bg-white focus:border-indigo-500" 
                    : "glass-input text-gray-200 focus:bg-white/5 focus:border-indigo-400"
                }`}
              />
              <button
                type="submit"
                disabled={isLoadingAi || !aiPromptInput.trim()}
                className="px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 justify-center cursor-pointer"
              >
                {isLoadingAi ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <span>Query</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
