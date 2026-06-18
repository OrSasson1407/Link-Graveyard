import React, { useState, useEffect, useCallback } from "react";
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
  const dynData = link.metadata?.dynamic_data ?? {};
  return {
    id: link.id || link.link_id,
    title: link.metadata?.title || link.title || link.url,
    url: link.url,
    summary: link.metadata?.ai_summary || link.metadata?.aiSummary || "",
    intent: link.intent?.inferred_action || link.intent?.reconstructedStory || "",
    tags: dynData.tags ?? (link.metadata?.category ? [link.metadata.category] : []),
    addedAt: link.createdAt || link.created_at || new Date().toISOString(),
    status: link.status === "ARCHIVED" ? "ARCHIVED" : link.status === "PENDING" ? "PROCESSING" : "REVIVED",
    domain: (() => { try { return new URL(link.url).hostname.replace("www.", ""); } catch { return ""; } })(),
    readingTime: dynData.readingTimeMinutes ? `${dynData.readingTimeMinutes} min` : undefined,
    isRead: link.status === "ARCHIVED",
    confidence: dynData.confidence,
  };
}

// Optimistic placeholder
function makeOptimisticBookmark(url: string): Bookmark {
  return {
    id: `optimistic-${Date.now()}`,
    title: url,
    url,
    summary: "",
    intent: "",
    tags: [],
    addedAt: new Date().toISOString(),
    status: "PROCESSING",
    domain: (() => { try { return new URL(url).hostname.replace("www.", ""); } catch { return ""; } })(),
    readingTime: undefined,
    isRead: false,
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
  const [optimisticLinks, setOptimisticLinks] = useState<Bookmark[]>([]);

  const { links, loading: linksLoading, refetch } = useLinks();
  const { createLink, loading: createLoading } = useCreateLink();

  const serverBookmarks: Bookmark[] = links.map(mapLink);
  const bookmarks: Bookmark[] = [
    ...optimisticLinks.filter((o) => !serverBookmarks.some((s) => s.url === o.url)),
    ...serverBookmarks,
  ];

  // Step 15: Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const tag = (e.target as HTMLElement).tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") return;

    // Cmd/Ctrl+K -> open add-link modal
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      setIsNewEntryModalOpen(true);
    }
    // / -> focus global search
    if (e.key === "/" && !isNewEntryModalOpen) {
      e.preventDefault();
      (document.getElementById("global-search-input") as HTMLInputElement)?.focus();
    }
    // Escape -> close modal
    if (e.key === "Escape") {
      setIsNewEntryModalOpen(false);
    }
  }, [isNewEntryModalOpen]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

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

    // Step 14: Optimistic UI
    const optimistic = makeOptimisticBookmark(newUrl);
    setOptimisticLinks((prev) => [optimistic, ...prev]);
    setNewUrl(""); setNewTitle(""); setIsNewEntryModalOpen(false);
    notify("Link submitted — AI will summarize shortly.");

    try {
      await createLink(newUrl, newTitle || undefined);
      await refetch();
    } catch {
      setOptimisticLinks((prev) => prev.filter((o) => o.id !== optimistic.id));
      notify("Failed to save link. Is the backend running?");
    } finally {
      setOptimisticLinks((prev) => prev.filter((o) => o.id !== optimistic.id));
    }
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
      await linksApi.softDelete(id);
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
        return <BillingView appearance={appearance} />;
      case "landing":
      default:
        return <LandingView onGetStarted={() => setActiveTab("dashboard")} />;
    }
  };

  return (
    <div className={`flex min-h-screen ${bgClass} relative overflow-hidden`}>
      <div className="bg-blob blob-1" />
      <div className="bg-blob blob-2" />
      {activeTab !== "landing" && (
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} appearance={appearance}
          onOpenNewEntry={() => setIsNewEntryModalOpen(true)} onLogout={() => { logout(); setAuthed(false); }} />
      )}
      <main className="flex-1 relative z-10">{renderViewContent()}</main>

      {/* Add Link Modal */}
      {isNewEntryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass-panel rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <button onClick={() => setIsNewEntryModalOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white cursor-pointer">
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 mb-5">
              <Link2 className="w-5 h-5 text-indigo-400" />
              <h2 className="text-sm font-semibold text-white">Bury a Link</h2>
              <span className="ml-auto text-[10px] font-mono text-gray-600">⌘K</span>
            </div>
            <form onSubmit={handleCreateNewBookmark} className="space-y-3">
              <input type="url" required value={newUrl} onChange={(e) => setNewUrl(e.target.value)}
                className="glass-input w-full h-10 px-4 rounded-xl text-xs text-gray-300 focus:outline-none focus:border-indigo-500"
                placeholder="https://..." autoFocus />
              <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                className="glass-input w-full h-10 px-4 rounded-xl text-xs text-gray-400 focus:outline-none focus:border-indigo-500"
                placeholder="Context (optional)" />
              <button type="submit" disabled={createLoading || !newUrl.trim()}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer">
                {createLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Bury It
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Global notification */}
      {globalNotification && (
        <div className="fixed bottom-6 right-6 z-50 glass-panel px-4 py-3 rounded-xl text-xs text-white flex items-center gap-2 shadow-xl">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          {globalNotification}
        </div>
      )}
    </div>
  );
}