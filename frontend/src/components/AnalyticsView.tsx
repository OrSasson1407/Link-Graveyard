import React from "react";
import { BarChart3, Layers, Tag, CheckCircle2, Flame, TrendingUp } from "lucide-react";
import { Bookmark, AppearanceSettings } from "../types";

interface AnalyticsViewProps {
  bookmarks: Bookmark[];
  appearance: AppearanceSettings;
}

export default function AnalyticsView({ bookmarks, appearance }: AnalyticsViewProps) {
  const total = bookmarks.length;
  const isLightTheme = appearance.theme === "light";

  const tagStats = React.useMemo(() => {
    const stats: Record<string, number> = {};
    bookmarks.forEach(b => b.tags.forEach(t => {
      const clean = t.toUpperCase().trim();
      stats[clean] = (stats[clean] || 0) + 1;
    }));
    return Object.entries(stats).sort((a, b) => b[1] - a[1]);
  }, [bookmarks]);

  const statusStats = React.useMemo(() => {
    let revived = 0, archived = 0, processing = 0;
    bookmarks.forEach(b => {
      if (b.status === "REVIVED") revived++;
      else if (b.status === "PROCESSING") processing++;
      else archived++;
    });
    return { revived, archived, processing };
  }, [bookmarks]);

  // Derive hourly activity from real createdAt timestamps
  const hourlySlots = React.useMemo(() => {
    const slots = Array(12).fill(0);
    bookmarks.forEach(b => {
      const h = new Date(b.addedAt).getHours();
      const bucket = Math.floor(h / 2);
      slots[bucket]++;
    });
    return slots;
  }, [bookmarks]);
  const maxSlot = Math.max(...hourlySlots, 1);

  // Save rate: links per day since first save
  const saveRate = React.useMemo(() => {
    if (bookmarks.length < 2) return null;
    const sorted = [...bookmarks].sort((a, b) => new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime());
    const days = (Date.now() - new Date(sorted[0].addedAt).getTime()) / 86400000;
    return days > 0 ? (bookmarks.length / days).toFixed(1) : null;
  }, [bookmarks]);

  const resurgenceRate = total > 0 ? Math.round((statusStats.revived / total) * 100) : 0;

  if (total < 3) {
    return (
      <div className={`flex-grow flex-1 overflow-y-auto p-8 max-w-5xl mx-auto w-full font-sans animate-fadeIn bg-transparent scrollbar-thin ${isLightTheme ? "text-gray-900" : "text-[#e3e2e6]"}`}>
        <div className={`border-b pb-6 mb-8 ${isLightTheme ? "border-indigo-100/50" : "border-[#262530]"}`}>
          <h1 className={`text-xl font-headline font-bold ${isLightTheme ? "text-gray-900" : "text-gray-100"}`}>Diagnostic Analytics</h1>
          <p className="text-xs text-gray-500 mt-1">Scannable statistics on curation tags, crawl timelines, and researcher intensity slots.</p>
        </div>
        <div className={`p-16 text-center rounded-2xl border border-dashed ${isLightTheme ? "border-indigo-100" : "border-[#2b2a3a]"}`}>
          <TrendingUp className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          <p className={`text-sm font-semibold ${isLightTheme ? "text-gray-700" : "text-gray-300"}`}>Not enough data yet</p>
          <p className="text-xs text-gray-500 mt-1">Save a few links to start seeing your analytics.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex-grow flex-1 overflow-y-auto p-8 max-w-5xl mx-auto w-full font-sans select-none animate-fadeIn bg-transparent scrollbar-thin ${isLightTheme ? "text-gray-900" : "text-[#e3e2e6]"}`}>
      <div className={`border-b pb-6 mb-8 ${isLightTheme ? "border-indigo-100/50" : "border-[#262530]"}`}>
        <h1 className={`text-xl font-headline font-bold ${isLightTheme ? "text-gray-900" : "text-gray-100"}`}>Diagnostic Analytics</h1>
        <p className="text-xs text-gray-500 mt-1">Scannable statistics on curation tags, crawl timelines, and researcher intensity slots.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`border p-6 rounded-2xl relative ${isLightTheme ? "glass-card-light" : "glass-card"}`}>
          <div className="flex items-center gap-2 text-[10px] font-mono tracking-widest text-[#a1a3b5] uppercase">
            <Flame className="w-4 h-4 text-rose-500" />
            <span>Research Intensity</span>
          </div>
          <h3 className={`text-2xl font-headline font-bold mt-2 ${isLightTheme ? "text-indigo-950" : "text-white"}`}>
            {saveRate ? `${saveRate}/day` : `${total} total`}
          </h3>
          <p className="text-[11px] text-gray-500 mt-1 leading-normal">
            {saveRate ? `Averaging ${saveRate} links saved per day.` : "Keep saving links to track your pace."}
          </p>
        </div>

        <div className={`border p-6 rounded-2xl relative ${isLightTheme ? "glass-card-light" : "glass-card"}`}>
          <div className="flex items-center gap-2 text-[10px] font-mono tracking-widest text-[#a1a3b5] uppercase">
            <Layers className="w-4 h-4 text-emerald-500" />
            <span>Archive Health</span>
          </div>
          <h3 className={`text-2xl font-headline font-bold mt-2 ${isLightTheme ? "text-indigo-950" : "text-white"}`}>
            {statusStats.processing > 0 ? "Processing" : "Nominal"}
          </h3>
          <p className="text-[11px] text-gray-500 mt-1 leading-normal">
            {statusStats.processing > 0
              ? `${statusStats.processing} link${statusStats.processing > 1 ? "s" : ""} still being processed.`
              : "All links processed. Archive is healthy."}
          </p>
        </div>

        <div className={`border p-6 rounded-2xl relative ${isLightTheme ? "glass-card-light" : "glass-card"}`}>
          <div className="flex items-center gap-2 text-[10px] font-mono tracking-widest text-[#a1a3b5] uppercase">
            <CheckCircle2 className="w-4 h-4 text-indigo-500" />
            <span>Resurgence Rate</span>
          </div>
          <h3 className={`text-2xl font-headline font-bold mt-2 ${isLightTheme ? "text-indigo-950" : "text-white"}`}>{resurgenceRate}%</h3>
          <p className="text-[11px] text-gray-500 mt-1 leading-normal">{statusStats.revived} of {total} links marked as active.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        <div className={`border rounded-2xl p-6 space-y-6 ${isLightTheme ? "glass-card-light" : "glass-card"}`}>
          <div className={`flex items-center justify-between pb-3 border-b ${isLightTheme ? "border-indigo-100/40" : "border-[#1b1c25]"}`}>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-500" />
              <h4 className={`text-xs font-mono font-bold uppercase tracking-widest ${isLightTheme ? "text-indigo-950" : "text-gray-200"}`}>Hourly Activity</h4>
            </div>
            <span className="text-[10px] font-mono text-gray-500">BY HOUR OF DAY</span>
          </div>
          <div className="h-48 flex items-end justify-between gap-2.5 pt-4">
            {hourlySlots.map((val, idx) => {
              const heightPct = Math.max(4, Math.round((val / maxSlot) * 100));
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group self-stretch justify-end">
                  <span className="text-[9px] font-mono text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">{val}</span>
                  <div
                    title={`${idx * 2}:00–${idx * 2 + 2}:00 — ${val} link${val !== 1 ? "s" : ""}`}
                    className={`w-full rounded-t-md transition-all duration-300 group-hover:brightness-125 ${
                      val > maxSlot * 0.7 ? "bg-indigo-600" : val > maxSlot * 0.3 ? "bg-indigo-500/80" : isLightTheme ? "bg-indigo-100" : "bg-[#181920]"
                    }`}
                    style={{ height: `${heightPct}%` }}
                  />
                  <span className="text-[9px] font-mono text-gray-500 block pt-1 select-none">{idx * 2}h</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className={`border rounded-2xl p-6 space-y-6 h-fit ${isLightTheme ? "glass-card-light" : "glass-card"}`}>
          <div className={`pb-3 border-b flex items-center justify-between ${isLightTheme ? "border-indigo-100/40" : "border-[#1b1c25]"}`}>
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-indigo-500" />
              <h4 className={`text-xs font-mono font-bold uppercase tracking-widest ${isLightTheme ? "text-indigo-950" : "text-gray-200"}`}>Tag Distribution</h4>
            </div>
          </div>
          {tagStats.length === 0 ? (
            <p className="text-xs text-gray-500 italic py-12 text-center">No tags yet. Tags are auto-assigned when links are processed.</p>
          ) : (
            <div className="space-y-3">
              {tagStats.map(([tagName, count]) => {
                const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={tagName} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className={`font-semibold font-mono text-[11px] ${isLightTheme ? "text-[#3b3d54]" : "text-indigo-300"}`}>#{tagName}</span>
                      <span className="text-gray-500 font-mono text-[10px]">{count} ({percentage}%)</span>
                    </div>
                    <div className={`w-full h-1 rounded overflow-hidden ${isLightTheme ? "bg-indigo-50" : "bg-[#15161f]"}`}>
                      <div className="h-full bg-indigo-500/85" style={{ width: `${percentage}%` }} />
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
