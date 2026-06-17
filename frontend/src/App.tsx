import React, { useState, useEffect } from "react";
import {
  Skull, Plus, Loader2, CheckCircle, AlertCircle, Sparkles, Link2, X, Eye, EyeOff
} from "lucide-react";
import Sidebar from "./components/Sidebar";
import DashboardView from "./components/DashboardView";
import CollectionsView from "./components/CollectionsView";
import AnalyticsView from "./components/AnalyticsView";
import SettingsView from "./components/SettingsView";
import BillingView from "./components/BillingView";
import LandingView from "./components/LandingView";
import { Bookmark, UserProfile, AppearanceSettings } from "./types";
import { useAuth } from "./hooks/useAuth";
import { useLinks, useCreateLink } from "./hooks/useLinks";
import { linksApi } from "./services/apiClient";

const isValidUrl = (urlStr: string): boolean => {
  if (!urlStr) return false;
  try {
    const parsed = new URL(urlStr);
    return (parsed.protocol === "http:" || parsed.protocol === "https:") && parsed.hostname.includes(".");
  } catch { return false; }
};

function mapLink(link: any): Bookmark {
  return {
    id: link.id || link.link_id,
    title: link.title || link.metadata?.title || link.url,
    url: link.url,
    summary: link.metadata?.aiSummary || link.aiSummary || "",
    intent: link.intent?.reconstructedStory || "",
    tags: link.metadata?.category ? [link.metadata.category] : [],
    addedAt: link.createdAt || link.created_at || new Date().toISOString(),
    status: link.status === "ARCHIVED" ? "ARCHIVED" : link.status === "PENDING" ? "PROCESSING" : "REVIVED",
    domain: (() => { try { return new URL(link.url).hostname.replace("www.", ""); } catch { return ""; } })(),
    readingTime: undefined,
    isRead: link.status === "ARCHIVED",
  };
}

function AuthScreen({ onSuccess }: { onSuccess: () => void }) {
  const { login, register, loading, error } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");
    try {
      if (mode === "login") await login(email, password);
      else await register(email, password);
      onSuccess();
    } catch (err: any) {
      setLocalError(err?.response?.data?.message || error || "Authentication failed");
    }
  };

  return (
    <div className="min-h-screen frosted-bg flex items-center justify-center relative overflow-hidden">
      <div className="bg-blob blob-1" />
      <div className="bg-blob blob-2" />
      <div className="glass-panel rounded-2xl p-8 w-full max-w-sm relative z-10 shadow-2xl">
        <div className="flex items-center gap-3 mb-7">
          <Skull className="w-7 h-7 text-indigo-500 rotate-6 animate-pulse" />
          <div>
            <h1 className="text-sm font-semibold uppercase tracking-widest text-white">Link Graveyard</h1>
            <p className="text-[10px] font-mono text-gray-500">Sovereign Archive System</p>
          </div>
        </div>
        <div className="flex rounded-xl overflow-hidden mb-6 border border-white/5">
          {(["login", "register"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)}
              className={`flex-1 py-2 text-xs font-semibold transition-colors cursor-pointer ${mode === m ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"}`}>
              {m === "login" ? "Sign In" : "Register"}
            </button>
          ))}
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono tracking-widest uppercase text-gray-500 block">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="glass-input w-full h-10 px-4 rounded-xl text-xs text-gray-300 focus:outline-none focus:border-indigo-500"
              placeholder="you@example.com" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono tracking-widest uppercase text-gray-500 block">Password</label>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)}
                className="glass-input w-full h-10 pl-4 pr-10 rounded-xl text-xs text-gray-300 focus:outline-none focus:border-indigo-500"
                placeholder="••••••••" />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 cursor-pointer">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          {(localError || error) && (
            <p className="text-[10px] text-rose-400 font-mono flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {localError || error}
            </p>
          )}
          <button type="submit" disabled={loading}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer mt-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {mode === "login" ? "Enter the Graveyard" : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function App() {
  const { isAuthenticated, logout } = useAuth();
  const [authed, setAuthed] = useState(isAuthenticated);
  const [activeTab, setActiveTab] = useState<string>("landing");
  const [appearance, setAppearance] = useState<AppearanceSettings>({ theme: "dark", accent: "indigo", density: "comfortable" });
  const [profile, setProfile] = useState<UserProfile>({ displayName: "", bio: "", avatar: "" });
  const [aiHistory, setAiHistory] = useState<Array<{ query: string; response: string; timestamp: string }>>([]);
  const [selectedBookmark, setSelectedBookmark] = useState<Bookmark | null>(null);
  const [isNewEntryModalOpen, setIsNewEntryModalOpen] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [globalNotification, setGlobalNotification] = useState("");

  const { links, loading: linksLoading, refetch } = useLinks();
  const { createLink, loading: createLoading } = useCreateLink();
  const bookmarks: Bookmark[] = links.map(mapLink);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("dark", "light");
    if (appearance.theme === "dark") root.classList.add("dark");
    else if (appearance.theme === "light") root.classList.add("light");
    else root.classList.add(window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  }, [appearance.theme]);

  const notify = (msg: string, ms = 4500) => {
    setGlobalNotification(msg);
    setTimeout(() => setGlobalNotification(""), ms);
  };

  const handleCreateNewBookmark = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl.trim()) return;
    try {
      await createLink(newUrl, newTitle || undefined);
      setNewUrl(""); setNewTitle(""); setIsNewEntryModalOpen(false);
      notify("Link submitted — AI will summarize shortly.");
      refetch();
    } catch { notify("Failed to save link. Is the backend running?"); }
  };

  const handleUpdateBookmarkStatus = async (id: string, updates: Partial<Bookmark>) => {
    try {
      const status = updates.status === "ARCHIVED" ? "ARCHIVED" : updates.status === "PROCESSING" ? "PENDING" : "ACTIVE";
      await linksApi.updateStatus(id, status as any);
      refetch();
    } catch { notify("Failed to update status."); }
  };

  const handleDeleteBookmark = async (id: string) => {
    if (!confirm("Permanently delete this link?")) return;
    if (selectedBookmark?.id === id) setSelectedBookmark(null);
    try {
      await fetch(`/api/v1/links/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` } });
      notify("Link deleted."); refetch();
    } catch { notify("Failed to delete link."); }
  };

  const handleQueryAi = async (prompt: string) => {
    try {
      const res = await fetch("/api/v1/links/why-did-i-save-this", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("access_token")}` },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      const entry = { query: prompt, response: data.reconstructed_story || JSON.stringify(data), timestamp: new Date().toISOString() };
      setAiHistory((prev) => [entry, ...prev]);
      return entry;
    } catch {
      const entry = { query: prompt, response: "Backend unavailable.", timestamp: new Date().toISOString() };
      setAiHistory((prev) => [entry, ...prev]);
      return entry;
    }
  };

  const selectAndRouteToBookmark = (item: Bookmark) => {
    setSelectedBookmark(item); setActiveTab("collections");
  };

  if (!authed) return <AuthScreen onSuccess={() => setAuthed(true)} />;

  const isLandingView = activeTab === "landing";
  const isLightTheme = appearance.theme === "light";
  const bgClass = isLightTheme ? "frosted-bg-light" : "frosted-bg";

  const renderViewContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardView bookmarks={bookmarks} profile={profile} appearance={appearance}
          onSelectBookmark={selectAndRouteToBookmark} onOpenNewEntryModal={() => setIsNewEntryModalOpen(true)}
          onQueryAi={handleQueryAi} aiHistory={aiHistory} />;
      case "collections":
        return <CollectionsView bookmarks={bookmarks} appearance={appearance} selectedBookmark={selectedBookmark}
          onSelectBookmark={setSelectedBookmark} onUpdateBookmarkStatus={handleUpdateBookmarkStatus}
          onDeleteBookmark={handleDeleteBookmark} onOpenNewEntryModal={() => setIsNewEntryModalOpen(true)} />;
      case "analytics":
        return <AnalyticsView bookmarks={bookmarks} appearance={appearance} />;
      case "settings":
        return <SettingsView profile={profile} appearance={appearance}
          onUpdateProfile={(u) => setProfile((p) => ({ ...p, ...u }))}
          onUpdateAppearance={(u) => setAppearance((a) => ({ ...a, ...u }))} />;
      case "billing":
        return <BillingView billingHistory={[]} appearance={appearance} bookmarksCount={bookmarks.length} />;
      case "landing":
      default:
        return <LandingView bookmarksCount={bookmarks.length} onEnterApp={() => setActiveTab("dashboard")} appearance={appearance} />;
    }
  };

  return (
    <div className={`min-h-screen ${bgClass} flex flex-col md:flex-row transition-colors text-sans antialiased relative overflow-hidden`}>
      <div className={`bg-blob ${isLightTheme ? "blob-1-light" : "blob-1"}`} />
      <div className={`bg-blob ${isLightTheme ? "blob-2-light" : "blob-2"}`} />

      {globalNotification && (
        <div className={`fixed top-20 right-8 z-[100] max-w-sm p-4 rounded-xl shadow-2xl text-xs flex items-start gap-3 animate-fadeIn ${isLightTheme ? "glass-panel-light border-indigo-200 text-indigo-950" : "glass-panel border-indigo-500/20 text-indigo-200"}`}>
          <Sparkles className="w-5 h-5 text-indigo-500 mt-0.5 animate-pulse flex-shrink-0" />
          <div>
            <h5 className={`font-semibold ${isLightTheme ? "text-indigo-950" : "text-white"}`}>System Signal</h5>
            <p className="mt-0.5 leading-relaxed">{globalNotification}</p>
          </div>
        </div>
      )}

      {!isLandingView && (
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onOpenNewEntryModal={() => setIsNewEntryModalOpen(true)}
          profile={profile} appearance={appearance} linksCount={bookmarks.length} />
      )}

      <main className="flex-1 flex flex-col min-w-0 max-h-screen overflow-hidden relative z-10">
        {linksLoading && authed && activeTab !== "landing"
          ? <div className="flex-1 flex items-center justify-center"><Loader2 className="w-6 h-6 text-indigo-500 animate-spin" /></div>
          : renderViewContent()}
      </main>

      {isNewEntryModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-center justify-center animate-fadeIn">
          <div className={`w-[460px] ${isLightTheme ? "glass-panel-light" : "glass-panel"} rounded-2xl p-6 shadow-2xl relative`}>
            <button onClick={() => setIsNewEntryModalOpen(false)}
              className={`absolute top-4 right-4 p-1 rounded-lg transition-colors cursor-pointer ${isLightTheme ? "text-gray-400 hover:text-gray-800 hover:bg-black/5" : "text-gray-500 hover:text-white hover:bg-white/5"}`}>
              <X className="w-4 h-4" />
            </button>
            <div className={`flex items-center gap-3 mb-5 border-b pb-4 ${isLightTheme ? "border-black/5" : "border-white/5"}`}>
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                <Link2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`text-sm font-headline font-semibold uppercase tracking-wider ${isLightTheme ? "text-gray-900" : "text-gray-100"}`}>Bury New Entity</h3>
                <span className="text-[10px] font-mono block text-gray-400">AI summarized on save</span>
              </div>
            </div>
            <form onSubmit={handleCreateNewBookmark} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono tracking-widest uppercase text-gray-500 block">Source URL</label>
                <div className="relative flex items-center">
                  <input type="text" required disabled={createLoading} value={newUrl} onChange={(e) => setNewUrl(e.target.value)}
                    className={`w-full h-10 pl-4 pr-10 rounded-xl border focus:outline-none text-xs transition-colors ${newUrl.trim() === "" ? isLightTheme ? "glass-input-light text-gray-800 focus:border-indigo-500" : "glass-input text-gray-300 focus:border-indigo-500" : isValidUrl(newUrl) ? "border-emerald-500 text-emerald-700 dark:text-emerald-300 bg-emerald-500/5" : "border-rose-500 text-rose-700 dark:text-rose-300 bg-rose-500/5"}`}
                    placeholder="https://example.com/article" />
                  {newUrl.trim() !== "" && (
                    <span className="absolute right-3">
                      {isValidUrl(newUrl) ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <AlertCircle className="w-4 h-4 text-rose-500" />}
                    </span>
                  )}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono tracking-widest uppercase text-gray-500 block">Optional Title</label>
                <input type="text" disabled={createLoading} value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                  className={`w-full h-10 px-4 rounded-xl border focus:outline-none text-xs transition-colors ${isLightTheme ? "glass-input-light text-gray-800 focus:border-indigo-500" : "glass-input text-gray-300 focus:border-indigo-500"}`}
                  placeholder="Leave empty for AI auto-extraction" />
              </div>
              {createLoading && (
                <div className="p-3.5 bg-indigo-500/5 border border-indigo-500/15 rounded-xl text-xs text-indigo-300 flex items-center gap-2.5 animate-pulse">
                  <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                  <span>Submitting to backend...</span>
                </div>
              )}
              <div className={`pt-4 border-t flex justify-end gap-3 ${isLightTheme ? "border-black/5" : "border-white/5"}`}>
                <button type="button" disabled={createLoading} onClick={() => setIsNewEntryModalOpen(false)}
                  className={`px-4 py-2 bg-transparent rounded-xl text-xs font-semibold cursor-pointer transition-colors ${isLightTheme ? "text-gray-500 hover:text-gray-900 hover:bg-black/5" : "text-gray-400 hover:text-white hover:bg-white/5"}`}>
                  Cancel
                </button>
                <button type="submit" disabled={createLoading || !newUrl.trim() || !isValidUrl(newUrl)}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none">
                  Save Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
