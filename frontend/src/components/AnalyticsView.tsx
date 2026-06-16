import React from "react";
import { 
  TrendingUp, 
  BarChart3, 
  Clock, 
  Layers, 
  Tag, 
  CheckCircle2, 
  Flame,
  Calendar
} from "lucide-react";
import { Bookmark, AppearanceSettings } from "../types";

interface AnalyticsViewProps {
  bookmarks: Bookmark[];
  appearance: AppearanceSettings;
}

export default function AnalyticsView({ bookmarks, appearance }: AnalyticsViewProps) {
  
  // Tag counts
  const tagStats = React.useMemo(() => {
    const stats: Record<string, number> = {};
    bookmarks.forEach(b => {
      b.tags.forEach(t => {
        const clean = t.toUpperCase().trim();
        stats[clean] = (stats[clean] || 0) + 1;
      });
    });
    return Object.entries(stats).sort((a, b) => b[1] - a[1]);
  }, [bookmarks]);

  // Status breakdown
  const statusStats = React.useMemo(() => {
    let revived = 0;
    let archived = 0;
    let processing = 0;
    bookmarks.forEach(b => {
      if (b.status === "REVIVED") revived++;
      else if (b.status === "PROCESSING") processing++;
      else archived++;
    });
    return { revived, archived, processing };
  }, [bookmarks]);

  const total = bookmarks.length;

  const isLightTheme = appearance.theme === "light";

  // Raw mock hours distribution mapped dynamically to mock height
  const slots = [23, 14, 45, 62, 28, 51, 89, 72, 34, 41, 19, 29];
  const maxSlot = Math.max(...slots);

  return (
    <div className={`flex-grow flex-1 overflow-y-auto p-8 max-w-5xl mx-auto w-full font-sans select-none animate-fadeIn bg-transparent scrollbar-thin ${isLightTheme ? "text-gray-900" : "text-[#e3e2e6]"}`}>
      
      {/* Header */}
      <div className={`border-b pb-6 mb-8 ${isLightTheme ? "border-indigo-100/50" : "border-[#262530]"}`}>
        <h1 className={`text-xl font-headline font-bold flex items-center gap-2 ${isLightTheme ? "text-gray-900" : "text-gray-100"}`}>
          Diagnostic Analytics
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Scannable statistics on curation tags, crawl timelines, and researcher intensity slots.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Summary Card 1 */}
        <div className={`border p-6 rounded-2xl relative ${isLightTheme ? "glass-card-light" : "glass-card"}`}>
          <div className="flex items-center gap-2 text-[10px] font-mono tracking-widest text-[#a1a3b5] uppercase">
            <Flame className="w-4 h-4 text-rose-500" />
            <span className="font-semibold text-gray-550">Research Intensity</span>
          </div>
          <h3 className={`text-2xl font-headline font-bold mt-2 ${isLightTheme ? "text-indigo-950" : "text-white"}`}>Active Curation</h3>
          <p className="text-[11px] text-gray-500 mt-1 leading-normal">Average saving speed is 2.4 entities per day during peak phases.</p>
        </div>

        {/* Summary Card 2 */}
        <div className={`border p-6 rounded-2xl relative ${isLightTheme ? "glass-card-light" : "glass-card"}`}>
          <div className="flex items-center gap-2 text-[10px] font-mono tracking-widest text-[#a1a3b5] uppercase">
            <Layers className="w-4 h-4 text-emerald-500" />
            <span className="font-semibold text-gray-550">Archive Health</span>
          </div>
          <h3 className={`text-2xl font-headline font-bold mt-2 ${isLightTheme ? "text-indigo-955" : "text-white"}`}>Nominal</h3>
          <p className="text-[11px] text-gray-500 mt-1 leading-normal">Zero dead connections detected. Dynamic summaries stand ready.</p>
        </div>

        {/* Summary Card 3 */}
        <div className={`border p-6 rounded-2xl relative ${isLightTheme ? "glass-card-light" : "glass-card"}`}>
          <div className="flex items-center gap-2 text-[10px] font-mono tracking-widest text-[#a1a3b5] uppercase">
            <CheckCircle2 className="w-4 h-4 text-indigo-500" />
            <span className="font-semibold text-gray-550">Resurgence Rate</span>
          </div>
          <h3 className={`text-2xl font-headline font-bold mt-2 ${isLightTheme ? "text-indigo-955" : "text-white"}`}>
            {total > 0 ? Math.round((statusStats.revived / total) * 100) : 0}%
          </h3>
          <p className="text-[11px] text-gray-500 mt-1 leading-normal">Bookmarks resurrected from graveyard state this month.</p>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        
        {/* Dynamic Activity Graph Area - 2/3 Width */}
        <div className={`border rounded-2xl p-6 space-y-6 ${isLightTheme ? "glass-card-light" : "glass-card"}`}>
          <div className={`flex items-center justify-between pb-3 border-b ${isLightTheme ? "border-indigo-100/40" : "border-[#1b1c25]"}`}>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-500" />
              <h4 className={`text-xs font-mono font-bold uppercase tracking-widest ${isLightTheme ? "text-indigo-950" : "text-gray-200"}`}>Hourly Density Slot Distribution</h4>
            </div>
            <span className="text-[10px] font-mono text-gray-500">PAST 30 CYCLES</span>
          </div>

          {/* Interactive Custom SVG/CSS Bar Graph */}
          <div className="h-48 flex items-end justify-between gap-2.5 pt-4">
            {slots.map((val, idx) => {
              const heightPct = Math.max(12, Math.round((val / maxSlot) * 100));
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group self-stretch justify-end">
                  <span className="text-[9px] font-mono text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    {val}
                  </span>
                  <div 
                    title={`Hour ${idx * 2}:00 - Intensity: ${val}`}
                    className={`w-full rounded-t-md transition-all duration-300 relative group-hover:brightness-125 ${
                      val > 60 
                        ? "bg-indigo-600" 
                        : val > 30 
                          ? "bg-indigo-500/80" 
                          : isLightTheme 
                            ? "bg-indigo-55" 
                            : "bg-[#181920]"
                    }`}
                    style={{ height: `${heightPct}%` }}
                  />
                  <span className="text-[9px] font-mono text-gray-500 block pt-1 select-none">
                    {idx * 2}h
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right side Tag Distribution Cloud - 1/3 Width */}
        <div className={`border rounded-2xl p-6 space-y-6 h-fit ${isLightTheme ? "glass-card-light" : "glass-card"}`}>
          <div className={`pb-3 border-b flex items-center justify-between ${isLightTheme ? "border-indigo-100/40" : "border-[#1b1c25]"}`}>
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-indigo-500" />
              <h4 className={`text-xs font-mono font-bold uppercase tracking-widest ${isLightTheme ? "text-indigo-950" : "text-gray-200"}`}>Archive Tags concentration</h4>
            </div>
          </div>

          {tagStats.length === 0 ? (
            <p className="text-xs text-gray-500 italic py-12 text-center">Bury links with hashtags to build study graphs.</p>
          ) : (
            <div className="space-y-3">
              {tagStats.map(([tagName, count]) => {
                const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={tagName} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className={`font-semibold font-mono text-[11px] ${isLightTheme ? "text-[#3b3d54]" : "text-indigo-300"}`}>#{tagName}</span>
                      <span className="text-gray-500 font-mono text-[10px]">{count} archives ({percentage}%)</span>
                    </div>
                    {/* Visual Meter */}
                    <div className={`w-full h-1 rounded overflow-hidden ${isLightTheme ? "bg-indigo-50" : "bg-[#15161f]"}`}>
                      <div 
                        className="h-full bg-indigo-500/85" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
