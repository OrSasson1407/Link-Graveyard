import React, { useState, useEffect } from "react";
import { 
  Skull, 
  Plus, 
  Loader2, 
  Globe, 
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Link2,
  X
} from "lucide-react";
import Sidebar from "./components/Sidebar";
import DashboardView from "./components/DashboardView";
import CollectionsView from "./components/CollectionsView";
import AnalyticsView from "./components/AnalyticsView";
import SettingsView from "./components/SettingsView";
import BillingView from "./components/BillingView";
import LandingView from "./components/LandingView";
import { Bookmark, UserProfile, AppearanceSettings, BillingHistory } from "./types";

const isValidUrl = (urlStr: string): boolean => {
  if (!urlStr) return false;
  try {
    const parsed = new URL(urlStr);
    return (parsed.protocol === "http:" || parsed.protocol === "https:") && parsed.hostname.includes(".");
  } catch (e) {
    return false;
  }
};

export default function App() {
  // Navigation states
  const [activeTab, setActiveTab] = useState<string>("landing");

  // System states
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [profile, setProfile] = useState<UserProfile>({ displayName: "Crypt", bio: "", avatar: "" });
  const [billingHistory, setBillingHistory] = useState<BillingHistory[]>([]);
  const [appearance, setAppearance] = useState<AppearanceSettings>({ theme: "dark", accent: "indigo", density: "comfortable" });
  const [aiHistory, setAiHistory] = useState<Array<{ query: string; response: string; timestamp: string }>>([]);

  const [selectedBookmark, setSelectedBookmark] = useState<Bookmark | null>(null);

  // Modal / Interaction states
  const [isNewEntryModalOpen, setIsNewEntryModalOpen] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [isSubmittingNewEntry, setIsSubmittingNewEntry] = useState(false);
  const [globalNotification, setGlobalNotification] = useState("");

  // Fetch initial state from the server on load
  useEffect(() => {
    fetch("/api/state")
      .then((res) => {
        if (!res.ok) throw new Error("Server down");
        return res.json();
      })
      .then((data) => {
        setBookmarks(data.bookmarks);
        setProfile(data.profile);
        setBillingHistory(data.billingHistory);
        setAppearance(data.appearance);
        setAiHistory(data.aiQueryHistory || []);
      })
      .catch((err) => {
        console.warn("Could not synchronize with full-stack endpoints. Booting in local preview vector.", err);
      });
  }, []);

  // Update appearance theme settings dynamically on the body to allow dark/light modes
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("dark", "light");
    if (appearance.theme === "dark") {
      root.classList.add("dark");
    } else if (appearance.theme === "light") {
      root.classList.add("light");
    } else {
      // System mode
      const systemPreference = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      root.classList.add(systemPreference);
    }
  }, [appearance.theme]);

  // Sync state modifications helper
  const handleUpdateAppearanceOnServer = async (updates: Partial<AppearanceSettings>) => {
    const updatedAppearance = { ...appearance, ...updates };
    setAppearance(updatedAppearance);

    try {
      await fetch("/api/appearance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
    } catch (e) {
      console.warn("Failed syncing appearance state:", e);
    }
  };

  const handleUpdateProfileOnServer = async (updates: Partial<UserProfile>) => {
    const updatedProfile = { ...profile, ...updates };
    setProfile(updatedProfile);

    try {
      await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
    } catch (e) {
      console.warn("Failed syncing profile state:", e);
    }
  };

  const handleCreateNewBookmark = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl.trim()) return;

    setIsSubmittingNewEntry(true);
    try {
      const response = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: newUrl, title: newTitle }),
      });
      if (!response.ok) throw new Error("Crawl error");
      const addedItem = await response.json();
      
      // Pre-add
      setBookmarks((prev) => [addedItem, ...prev]);
      
      // Update Selection in collections automatically
      setSelectedBookmark(addedItem);
      
      // Reset inputs & close
      setNewUrl("");
      setNewTitle("");
      setIsNewEntryModalOpen(false);
      
      // Flash success trigger
      setGlobalNotification(`Successfully tombstoned: "${addedItem.title}"! Server AI summarized and tagged.`);
      setTimeout(() => setGlobalNotification(""), 5000);

      // Simulate crawler completion animation
      setTimeout(() => {
        setBookmarks((prev) => 
          prev.map(b => b.id === addedItem.id ? { ...b, status: "REVIVED" } : b)
        );
      }, 4000);

    } catch (err) {
      console.error(err);
      setGlobalNotification("AI metadata crawler timeout. Adding link in custom backlog.");
      setTimeout(() => setGlobalNotification(""), 4000);
    } finally {
      setIsSubmittingNewEntry(false);
    }
  };

  const handleUpdateBookmarkStatus = async (id: string, updates: Partial<Bookmark>) => {
    setBookmarks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...updates } : b))
    );

    try {
      await fetch(`/api/bookmarks/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
    } catch (e) {
      console.warn("Could not sync bookmark state:", e);
    }
  };

  const handleDeleteBookmark = async (id: string) => {
    if (!confirm("Are you sure you want to exhume and exfiltrate this tombstone permanently?")) return;
    
    // Optimistic delete
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
    if (selectedBookmark?.id === id) {
      setSelectedBookmark(null);
    }

    try {
      await fetch(`/api/bookmarks/${id}`, {
        method: "DELETE",
      });
      setGlobalNotification("Sovereign entity exhumed successfully.");
      setTimeout(() => setGlobalNotification(""), 3500);
    } catch (e) {
      console.warn("Could not delete from server:", e);
    }
  };

  const handleQueryAiOnServer = async (prompt: string) => {
    try {
      const response = await fetch("/api/query-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await response.json();
      setAiHistory((prev) => [data, ...prev]);
      return data;
    } catch (err) {
      console.error("AI query failed:", err);
      const errResponse = { query: prompt, response: "Server indexing error. Verify connections.", timestamp: new Date().toISOString() };
      setAiHistory((prev) => [errResponse, ...prev]);
      return errResponse;
    }
  };

  const selectAndRouteToBookmark = (item: Bookmark) => {
    setSelectedBookmark(item);
    setActiveTab("collections");
  };

  // Render proper interior view based on chosen Sidebar Tab
  const renderViewContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <DashboardView
            bookmarks={bookmarks}
            profile={profile}
            appearance={appearance}
            onSelectBookmark={selectAndRouteToBookmark}
            onOpenNewEntryModal={() => setIsNewEntryModalOpen(true)}
            onQueryAi={handleQueryAiOnServer}
            aiHistory={aiHistory}
          />
        );
      case "collections":
        return (
          <CollectionsView
            bookmarks={bookmarks}
            appearance={appearance}
            selectedBookmark={selectedBookmark}
            onSelectBookmark={setSelectedBookmark}
            onUpdateBookmarkStatus={handleUpdateBookmarkStatus}
            onDeleteBookmark={handleDeleteBookmark}
            onOpenNewEntryModal={() => setIsNewEntryModalOpen(true)}
          />
        );
      case "analytics":
        return (
          <AnalyticsView 
            bookmarks={bookmarks} 
            appearance={appearance} 
          />
        );
      case "settings":
        return (
          <SettingsView
            profile={profile}
            appearance={appearance}
            onUpdateProfile={handleUpdateProfileOnServer}
            onUpdateAppearance={handleUpdateAppearanceOnServer}
          />
        );
      case "billing":
        return (
          <BillingView
            billingHistory={billingHistory}
            appearance={appearance}
            bookmarksCount={bookmarks.length}
          />
        );
      case "landing":
      default:
        return (
          <LandingView
            bookmarksCount={bookmarks.length}
            onEnterApp={() => setActiveTab("dashboard")}
            appearance={appearance}
          />
        );
    }
  };

  // Map global theme backgrounds to layout wrapper
  const isLandingView = activeTab === "landing";
  const isLightTheme = appearance.theme === "light";
  const bgClass = isLightTheme ? "frosted-bg-light" : "frosted-bg";

  return (
    <div className={`min-h-screen ${bgClass} flex flex-col md:flex-row transition-colors text-sans antialiased relative overflow-hidden`}>
      
      {/* Background blobs for Frosted Glass theme */}
      <div className={`bg-blob ${isLightTheme ? "blob-1-light" : "blob-1"}`} />
      <div className={`bg-blob ${isLightTheme ? "blob-2-light" : "blob-2"}`} />

      {/* Global Toast Banner */}
      {globalNotification && (
        <div className={`fixed top-20 right-8 z-[100] max-w-sm p-4 rounded-xl shadow-2xl text-xs flex items-start gap-3 animate-fadeIn ${
          isLightTheme 
            ? "glass-panel-light border-indigo-200 text-indigo-950" 
            : "glass-panel border-indigo-500/20 text-indigo-200"
        }`}>
          <Sparkles className="w-5 h-5 text-indigo-500 mt-0.5 animate-pulse flex-shrink-0" />
          <div>
            <h5 className={`font-semibold ${isLightTheme ? "text-indigo-950" : "text-white"}`}>System Signal</h5>
            <p className="mt-0.5 leading-relaxed">{globalNotification}</p>
          </div>
        </div>
      )}

      {/* Render sidebar unless we are on the Marketing Landing View */}
      {!isLandingView && (
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenNewEntryModal={() => setIsNewEntryModalOpen(true)}
          profile={profile}
          appearance={appearance}
          linksCount={bookmarks.length}
        />
      )}

      {/* Main Container Workspace */}
      <main className="flex-1 flex flex-col min-w-0 max-h-screen overflow-hidden relative z-10">
        {renderViewContent()}
      </main>

      {/* NEW TOMBSTONE ENTRY / CRAWLER MODAL */}
      {isNewEntryModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-center justify-center animate-fadeIn select-text">
          <div className={`w-[460px] ${isLightTheme ? "glass-panel-light" : "glass-panel"} rounded-2xl p-6 shadow-2xl relative z-50`}>
            
            {/* Close */}
            <button 
              onClick={() => setIsNewEntryModalOpen(false)}
              className={`absolute top-4 right-4 p-1 rounded-lg transition-colors cursor-pointer ${
                isLightTheme ? "text-gray-400 hover:text-gray-800 hover:bg-black/5" : "text-gray-500 hover:text-white hover:bg-white/5"
              }`}
            >
              <X className="w-4 h-4" />
            </button>

            {/* Title */}
            <div className={`flex items-center gap-3 mb-5 border-b pb-4 ${isLightTheme ? "border-black/5" : "border-white/5"}`}>
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                <Link2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`text-sm font-headline font-semibold uppercase tracking-wider ${isLightTheme ? "text-gray-900" : "text-gray-100"}`}>
                  Bury New Entity
                </h3>
                <span className={`text-[10px] font-mono block ${isLightTheme ? "text-gray-500" : "text-gray-400"}`}>AI summarized against dynamic rot factors</span>
              </div>
            </div>

             {/* Submission Form */}
            <form onSubmit={handleCreateNewBookmark} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono tracking-widest uppercase text-gray-500 block">Source URL</label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    required
                    disabled={isSubmittingNewEntry}
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    className={`w-full h-10 pl-4 pr-10 rounded-xl border focus:outline-none text-xs transition-colors ${
                      newUrl.trim() === ""
                        ? isLightTheme 
                          ? "glass-input-light text-gray-800 focus:border-indigo-500 focus:bg-white" 
                          : "glass-input text-gray-300 focus:border-indigo-500 focus:bg-white/5"
                        : isValidUrl(newUrl)
                          ? "border-emerald-500 focus:border-emerald-500 text-emerald-700 dark:text-emerald-300 bg-emerald-500/5 focus:bg-white"
                          : "border-rose-505 focus:border-rose-505 text-rose-700 dark:text-rose-300 bg-rose-500/5 focus:bg-white"
                    }`}
                    placeholder="E.g., https://github.com/reactjs/rfcs/..."
                    id="modal-url-input"
                  />
                  {newUrl.trim() !== "" && (
                    <span className="absolute right-3 cursor-default flex items-center justify-center">
                      {isValidUrl(newUrl) ? (
                        <CheckCircle className="w-4 h-4 text-emerald-500 animate-fadeIn" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-500 animate-fadeIn" />
                      )}
                    </span>
                  )}
                </div>
                {newUrl.trim() !== "" && !isValidUrl(newUrl) && (
                  <p className="text-[10px] text-rose-500 font-mono animate-fadeIn pl-1">
                    Please use a valid absolute protocol (e.g. https://example.com)
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono tracking-widest uppercase text-gray-500 block">Optional Title</label>
                <input
                  type="text"
                  disabled={isSubmittingNewEntry}
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className={`w-full h-10 px-4 rounded-xl border focus:outline-none text-xs transition-colors ${
                    isLightTheme 
                      ? "glass-input-light text-gray-800 focus:border-indigo-500 focus:bg-white" 
                      : "glass-input text-[#e3e2e6] focus:border-indigo-500 focus:bg-white/5"
                  }`}
                  placeholder="Leave empty for AI auto-extraction"
                  id="modal-title-input"
                />
              </div>

              {/* Loader feedback */}
              {isSubmittingNewEntry && (
                <div className="p-3.5 bg-indigo-500/5 border border-indigo-500/15 rounded-xl text-xs text-indigo-300 flex items-center gap-2.5 animate-pulse">
                  <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                  <span>Headless nodes crawling source document parameters. Calling Gemini. Please stand by...</span>
                </div>
              )}

              {/* Action */}
              <div className={`pt-4 border-t flex justify-end gap-3 select-none ${isLightTheme ? "border-black/5" : "border-white/5"}`}>
                <button
                  type="button"
                  disabled={isSubmittingNewEntry}
                  onClick={() => setIsNewEntryModalOpen(false)}
                  className={`px-4 py-2 bg-transparent rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                    isLightTheme ? "text-gray-500 hover:text-gray-900 hover:bg-black/5" : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingNewEntry || !newUrl.trim() || !isValidUrl(newUrl)}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg transition-all hover:scale-[1.01] flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                  id="modal-submit-btn"
                >
                  <span>Crawl & Bury</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
