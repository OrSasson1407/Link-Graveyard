import React, { useState, useMemo } from "react";
import { 
  ArrowUpRight, 
  Trash2, 
  Sparkles, 
  BellRing, 
  BookmarkCheck, 
  Plus, 
  Search, 
  ExternalLink,
  Archive,
  RefreshCw,
  FolderOpen
} from "lucide-react";
import { Bookmark, AppearanceSettings } from "../types";

interface CollectionsViewProps {
  bookmarks: Bookmark[];
  appearance: AppearanceSettings;
  selectedBookmark: Bookmark | null;
  onSelectBookmark: (bookmark: Bookmark) => void;
  onUpdateBookmarkStatus: (id: string, updates: Partial<Bookmark>) => void;
  onDeleteBookmark: (id: string) => void;
  onOpenNewEntryModal: () => void;
}

type FeedFilter = "ALL" | "UNREAD" | "REVIVED" | "ARCHIVED";

export default function CollectionsView({
  bookmarks,
  appearance,
  selectedBookmark,
  onSelectBookmark,
  onUpdateBookmarkStatus,
  onDeleteBookmark,
  onOpenNewEntryModal
}: CollectionsViewProps) {
  const [filter, setFilter] = useState<FeedFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [scheduledReminderMsg, setScheduledReminderMsg] = useState("");

  const accentColorText = {
    indigo: "text-indigo-400",
    emerald: "text-emerald-400",
    rose: "text-rose-400"
  }[appearance.accent];

  const primaryBadgeOutline = {
    indigo: "border-indigo-500/25 bg-indigo-500/5 text-indigo-300",
    emerald: "border-emerald-500/25 bg-emerald-500/5 text-emerald-300",
    rose: "border-rose-500/25 bg-rose-500/5 text-rose-300"
  }[appearance.accent];

  // Filter Bookmarks based on Category Tab and Search Input
  const filteredList = useMemo(() => {
    return bookmarks.filter((b) => {
      // Category Tab matches
      const categoryMatch = (() => {
        if (filter === "UNREAD") return !b.isRead;
        if (filter === "REVIVED") return b.status === "REVIVED";
        if (filter === "ARCHIVED") return b.status === "ARCHIVED";
        return true;
      })();

      // Search matching titles or tags
      const searchMatch = !searchQuery 
        || b.title.toLowerCase().includes(searchQuery.toLowerCase())
        || b.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
        || b.domain.toLowerCase().includes(searchQuery.toLowerCase());

      return categoryMatch && searchMatch;
    });
  }, [bookmarks, filter, searchQuery]);

  // Determine current active selection (fallback to first of filtered list if currently null or not in filtered)
  const currentSelection = useMemo(() => {
    if (selectedBookmark && bookmarks.some(b => b.id === selectedBookmark.id)) {
      return bookmarks.find(b => b.id === selectedBookmark.id) || null;
    }
    return filteredList[0] || bookmarks[0] || null;
  }, [selectedBookmark, bookmarks, filteredList]);

  // Compute related links in archive (based on sharing at least one tag, excluding the current items itself)
  const relatedLinks = useMemo(() => {
    if (!currentSelection) return [];
    return bookmarks.filter(b => 
      b.id !== currentSelection.id && 
      b.tags.some(tag => currentSelection.tags.includes(tag))
    ).slice(0, 3);
  }, [currentSelection, bookmarks]);

  // Handle reminder action click
  const triggerReminderScheduler = (timeLabel: string) => {
    const title = currentSelection?.title || "Entity";
    setScheduledReminderMsg(`Sovereign alarm armed! We will remind you to study "${title}" ${timeLabel.toLowerCase()}.`);
    setTimeout(() => {
      setScheduledReminderMsg("");
    }, 4500);
  };

  // Turn paragraph summaries into cleaner bullet points for AI Details box format
  const summaryBullets = useMemo(() => {
    if (!currentSelection) return [];
    // Split on periods but discard empty lines
    const bullets = currentSelection.summary.split(".")
      .map(part => part.trim())
      .filter(part => part.length > 8);
    // Ensure we at least have one
    return bullets.length > 0 ? bullets : [currentSelection.summary];
  }, [currentSelection]);

  // Toggle Read state
  const handleMarkProcessed = () => {
    if (!currentSelection) return;
    const isCurrentlyRead = currentSelection.isRead;
    onUpdateBookmarkStatus(currentSelection.id, { 
      isRead: !isCurrentlyRead,
      status: !isCurrentlyRead ? "ARCHIVED" : "REVIVED"
    });
  };

  const handleToggleRevived = () => {
    if (!currentSelection) return;
    const isRevivedStatus = currentSelection.status === "REVIVED";
    onUpdateBookmarkStatus(currentSelection.id, { 
      status: isRevivedStatus ? "ARCHIVED" : "REVIVED" 
    });
  };

  const isLightTheme = appearance.theme === "light";

  return (
    <div className={`flex-grow flex h-screen overflow-hidden select-none bg-transparent ${isLightTheme ? "text-gray-900" : "text-[#e3e2e6]"}`}>
      {/* LEFT COLUMN: Feed lists panel (1/3 Width) */}
      <div className={`w-[380px] border-r flex flex-col h-full flex-shrink-0 backdrop-blur-2xl ${
        isLightTheme ? "border-indigo-100/50 bg-white/45" : "border-white/5 bg-[#0d0e11]/45"
      }`}>
        {/* Header Search Box */}
        <div className={`p-4 border-b ${isLightTheme ? "border-indigo-100/55" : "border-white/5"}`}>
          <div className="relative">
            <Search className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 ${isLightTheme ? "text-gray-400" : "text-gray-500"}`} />
            <input
              type="text"
              placeholder="Filter by collection, tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full h-9 pl-9 pr-4 rounded-lg border text-xs focus:outline-none transition-colors ${
                isLightTheme 
                  ? "glass-input-light text-gray-800 focus:bg-white focus:border-indigo-500" 
                  : "glass-input text-gray-200 focus:bg-[#1a1b24] focus:border-indigo-500"
              }`}
            />
          </div>
 
          {/* Filtering category Tabs */}
          <div className={`flex items-center gap-1 mt-3 border-t pt-3 overflow-x-auto ${isLightTheme ? "border-indigo-100/30" : "border-white/5"}`}>
            {(["ALL", "UNREAD", "REVIVED", "ARCHIVED"] as FeedFilter[]).map((tab) => {
              const isActive = filter === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-2.5 py-1 rounded text-[10px] font-mono tracking-wider font-semibold transition-all cursor-pointer ${
                    isActive 
                      ? isLightTheme 
                        ? "bg-indigo-600 text-white shadow-sm" 
                        : "bg-indigo-500/20 text-[#c0c1ff] border border-indigo-500/30" 
                      : isLightTheme 
                        ? "text-gray-500 hover:text-indigo-600 hover:bg-indigo-50/50" 
                        : "text-gray-500 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        </div>
 
        {/* Scrollable lists body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 select-none scrollbar-thin">
          {filteredList.length === 0 ? (
            <div className="py-24 text-center">
              <FolderOpen className="w-8 h-8 text-gray-400 mx-auto mb-2 animate-pulse" />
              <p className="text-[11px] font-mono text-gray-500 uppercase tracking-widest">Archive Empty</p>
              <button 
                onClick={onOpenNewEntryModal}
                className="text-[10px] text-indigo-500 mt-2 hover:underline cursor-pointer font-bold"
              >
                + Bury first entity
              </button>
            </div>
          ) : (
            filteredList.map((bookmark) => {
              const isSelected = currentSelection && currentSelection.id === bookmark.id;
              const isRevivedHighlight = bookmark.status === "REVIVED";
              return (
                <div
                  key={bookmark.id}
                  onClick={() => onSelectBookmark(bookmark)}
                  className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all duration-150 relative overflow-hidden flex flex-col justify-between ${
                    isSelected 
                      ? isLightTheme 
                        ? "bg-indigo-500/10 border-indigo-500 text-indigo-950 font-bold" 
                        : "border-indigo-500/50 bg-white/10 text-white" 
                      : isLightTheme 
                        ? "glass-row-light text-gray-800 border-indigo-100/30" 
                        : "glass-row text-gray-300 border-[#1c1d24]"
                  }`}
                  id={`feed-item-${bookmark.id}`}
                >
                  {isRevivedHighlight && (
                    <div className="absolute top-0 left-0 bottom-0 w-[3px] bg-emerald-500" />
                  )}
                  {isSelected && !isRevivedHighlight && (
                    <div className="absolute top-0 left-0 bottom-0 w-[3px] bg-indigo-500" />
                  )}
 
                  <div className={`flex items-center justify-between text-[9px] font-mono mb-1.5 flex-nowrap ${isLightTheme ? "text-gray-500" : "text-gray-400"}`}>
                    <span className="uppercase truncate max-w-[150px] font-semibold">{bookmark.domain}</span>
                    <span>{new Date(bookmark.addedAt).toLocaleDateString([], { month: "short", day: "numeric" })}</span>
                  </div>
 
                  <h3 className={`text-xs font-bold leading-snug line-clamp-2 transition-colors ${
                    isSelected 
                      ? isLightTheme ? "text-indigo-950" : "text-white" 
                      : isLightTheme ? "text-gray-800 group-hover:text-indigo-600" : "text-gray-300 group-hover:text-white"
                  }`}>
                    {bookmark.title}
                  </h3>
 
                  <div className="flex items-center justify-between mt-3 flex-wrap gap-1">
                    {/* Tags row */}
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      {bookmark.tags.slice(0, 2).map((tag, i) => (
                        <span 
                          key={i} 
                          className={`text-[8px] font-mono uppercase px-1.5 py-0.5 rounded border ${
                            isLightTheme 
                              ? "text-indigo-600 bg-indigo-50 border-indigo-100" 
                              : "text-[#c0c1ff] bg-white/5 border-white/5"
                          }`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
 
                    {/* Status small text */}
                    <span className={`text-[9px] font-mono flex items-center gap-1 ${isLightTheme ? "text-gray-500" : "text-gray-400"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        bookmark.status === "REVIVED" ? "bg-emerald-500" :
                        bookmark.status === "PROCESSING" ? "bg-amber-500 animate-pulse" : "bg-gray-400"
                      }`} />
                      {bookmark.status}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
 
      {/* RIGHT COLUMN: AI Context details viewport (2/3 Width) */}
      <div className={`flex-1 flex flex-col h-full overflow-y-auto select-text bg-transparent ${isLightTheme ? "text-gray-900" : "text-[#e3e2e6]"}`}>
        {currentSelection ? (
          <div className="p-8 max-w-4xl mx-auto w-full space-y-6 flex-1 flex flex-col justify-between relative z-10">
            
            {/* Top Info Bar */}
            <div className="space-y-4">
              <div className={`flex items-center justify-between text-xs pb-3 border-b ${isLightTheme ? "border-indigo-100" : "border-white/5"}`}>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-gray-500 uppercase">Archive reference</span>
                  <span className={`w-1.5 h-1.5 rounded-full ${isLightTheme ? "bg-gray-300" : "bg-gray-700"}`} />
                  <span className={`font-mono px-2 py-0.5 rounded uppercase text-[10px] border ${
                    isLightTheme 
                      ? "text-indigo-600 bg-indigo-50 border-indigo-100" 
                      : "text-emerald-400 bg-emerald-500/5 border-emerald-500/15"
                  }`}>
                    Saved {new Date(currentSelection.addedAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
 
                <div className="flex items-center gap-2">
                  <a
                    href={currentSelection.url}
                    target="_blank"
                    rel="noreferrer referrer"
                    className={`px-3 py-1.5 border rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                      isLightTheme 
                        ? "bg-white hover:bg-neutral-50/50 border-indigo-100 text-indigo-700" 
                        : "bg-[#1a1c24] hover:bg-[#20232e] border-[#2b2d3d] text-gray-200"
                    }`}
                  >
                    <span>Open Original</span>
                    <ExternalLink className={`w-3.5 h-3.5 ${isLightTheme ? "text-indigo-500" : "text-gray-400"}`} />
                  </a>
 
                  <button
                    onClick={handleToggleRevived}
                    title="Toggle resurrection profile"
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                      currentSelection.status === "REVIVED"
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
                        : isLightTheme 
                          ? "border-indigo-100 bg-white text-gray-650 hover:text-indigo-600" 
                          : "border-[#2b2d3d] bg-transparent text-gray-400 hover:text-white"
                    }`}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${currentSelection.status === "REVIVED" ? "animate-spin" : ""}`} style={{ animationDuration: "10s" }} />
                    <span>{currentSelection.status === "REVIVED" ? "Revived" : "Revive"}</span>
                  </button>
 
                  <button
                    onClick={() => onDeleteBookmark(currentSelection.id)}
                    className={`p-1.5 border rounded-lg cursor-pointer transition-colors ${
                      isLightTheme 
                        ? "bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-100" 
                        : "bg-[#1b1314] hover:bg-[#2e1c1e] text-rose-400 border-rose-500/20"
                    }`}
                    title="Exfiltrate forever"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
 
              {/* Main Title of active reference */}
              <div>
                <h1 className={`text-xl font-headline font-bold tracking-tight leading-snug ${isLightTheme ? "text-gray-900" : "text-gray-100"}`}>
                  {currentSelection.title}
                </h1>
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                  <span className={`font-mono truncate max-w-sm ${isLightTheme ? "text-indigo-600" : "text-gray-400"}`}>{currentSelection.url}</span>
                  <span>•</span>
                  <span className={isLightTheme ? "text-gray-600" : "text-gray-400"}>{currentSelection.readingTime || "5m study time"}</span>
                </p>
              </div>
 
              {/* SCHEDULED ALERT */}
              {scheduledReminderMsg && (
                <div className="p-3.5 rounded-xl border border-emerald-500/25 bg-emerald-500/5 text-xs text-emerald-600 flex items-center gap-2 animate-fadeIn font-semibold">
                  <BellRing className="w-4 h-4 text-emerald-500 animate-bounce" />
                  <span>{scheduledReminderMsg}</span>
                </div>
              )}
 
              {/* Bento Grid layout containing AI summaries & inferred intent */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {/* Bento box 1: AI summary bullet points */}
                <div className={`border p-5 rounded-2xl space-y-3.5 relative overflow-hidden ${
                  isLightTheme ? "glass-card-light" : "glass-card"
                }`}>
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-indigo-500/5 pointer-events-none rounded-full blur-xl" />
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    <h2 className={`text-xs font-mono font-bold uppercase tracking-widest ${isLightTheme ? "text-indigo-950" : "text-gray-200"}`}>AI Contextual Summary</h2>
                  </div>
                  <ul className={`space-y-2.5 text-xs leading-relaxed pr-2 ${isLightTheme ? "text-gray-700 font-medium" : "text-gray-300"}`}>
                    {summaryBullets.map((bullet, idx) => (
                      <li key={idx} className="flex gap-2.5 items-start">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 self-start mt-1.5 flex-shrink-0" />
                        <span>{bullet}.</span>
                      </li>
                    ))}
                  </ul>
                </div>
 
                {/* Bento box 2: Inferred Intent summary */}
                <div className={`border p-5 rounded-2xl space-y-3.5 relative overflow-hidden ${
                  isLightTheme ? "glass-card-light" : "glass-card"
                }`}>
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-emerald-500/5 pointer-events-none rounded-full blur-xl" />
                  <div className="flex items-center gap-2">
                    <BookmarkCheck className="w-4 h-4 text-emerald-500" />
                    <h2 className={`text-xs font-mono font-bold uppercase tracking-widest ${isLightTheme ? "text-indigo-950" : "text-gray-200"}`}>Inferred Researcher Intent</h2>
                  </div>
                  <div className={`text-xs leading-relaxed p-4 rounded-xl border ${
                    isLightTheme ? "bg-white/80 border-indigo-100" : "bg-black/20 border-white/5"
                  }`}>
                    <p className={`font-semibold ${isLightTheme ? "text-indigo-950" : "text-gray-200"}`}>{currentSelection.intent}</p>
                    <p className={`mt-2 text-[10px] leading-normal font-mono ${isLightTheme ? "text-gray-500" : "text-gray-450"}`}>
                      Calculated using contextual graphs matching related query blocks inside browser frames.
                    </p>
                  </div>
                </div>
              </div>
 
              {/* Related Links in user research archive */}
              <div className="pt-2">
                <h3 className="text-xs font-mono font-bold tracking-widest text-gray-500 uppercase mb-3">
                  Related in Research Archive
                </h3>
                {relatedLinks.length === 0 ? (
                  <p className="text-xs text-gray-500 italic">No direct semantic matches inside other graves. Continue burying items with similar tags.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {relatedLinks.map((rel) => (
                      <div
                        key={rel.id}
                        onClick={() => onSelectBookmark(rel)}
                        className={`border p-3.5 rounded-xl cursor-pointer transition-colors space-y-2 flex flex-col justify-between h-full ${
                          isLightTheme 
                            ? "bg-white hover:bg-indigo-50/20 border-indigo-100 text-gray-800" 
                            : "bg-[#0a0b0e] hover:bg-[#121319] border-[#1f2029] hover:border-[#333544]"
                        }`}
                      >
                        <h4 className={`text-xs font-bold line-clamp-2 leading-tight ${isLightTheme ? "text-gray-900" : "text-gray-300"}`}>
                          {rel.title}
                        </h4>
                        <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono mt-2">
                          <span>{rel.domain}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
 
            {/* Bottom Form Action bar */}
            <div className={`mt-8 pt-4 border-t flex flex-wrap items-center justify-between gap-4 select-none ${isLightTheme ? "border-indigo-100" : "border-white/5"}`}>
              <div className="flex items-center gap-2.5">
                <span className="text-xs text-gray-500 font-semibold font-sans">Sovereign Alarms:</span>
                <button
                  onClick={() => triggerReminderScheduler("Tomorrow")}
                  className={`px-3 py-1.5 border rounded-xl text-xs transition-colors cursor-pointer ${
                    isLightTheme 
                      ? "bg-white hover:bg-indigo-55/40 border-indigo-100 text-indigo-700 font-medium" 
                      : "bg-[#14151a] hover:bg-[#1e1f29] text-gray-400 hover:text-white border border-[#2b2c3c]"
                  }`}
                >
                  Tomorrow
                </button>
                <button
                  onClick={() => triggerReminderScheduler("This Weekend")}
                  className={`px-3 py-1.5 border rounded-xl text-xs transition-colors cursor-pointer ${
                    isLightTheme 
                      ? "bg-white hover:bg-indigo-55/40 border-indigo-100 text-indigo-700 font-medium" 
                      : "bg-[#14151a] hover:bg-[#1e1f29] text-gray-400 hover:text-white border border-[#2b2c3c]"
                  }`}
                >
                  This Weekend
                </button>
              </div>
 
              <button
                onClick={handleMarkProcessed}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 border border-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
              >
                <Archive className="w-3.5 h-3.5" />
                <span>{currentSelection.isRead ? "Unbury from Archives" : "Archive in Catacombs"}</span>
              </button>
            </div>
 
          </div>
        ) : (
          <div className="p-16 text-center select-none flex-1 flex flex-col justify-center items-center">
            <FolderOpen className="w-10 h-10 text-gray-400 mb-3" />
            <p className="text-xs text-gray-500">Pick an archive item on the left feed to view detailed AI contextual insights.</p>
          </div>
        )}
      </div>
    </div>
  );
}
