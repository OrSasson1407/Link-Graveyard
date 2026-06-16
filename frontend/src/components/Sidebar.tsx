import React from "react";
import { 
  Skull, 
  LayoutDashboard, 
  FolderHeart, 
  TrendingUp, 
  Settings, 
  Plus, 
  CreditCard, 
  HelpCircle,
  Eye,
  LogOut
} from "lucide-react";
import { UserProfile, AppearanceSettings } from "../types";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenNewEntryModal: () => void;
  profile: UserProfile;
  appearance: AppearanceSettings;
  linksCount: number;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  onOpenNewEntryModal,
  profile,
  appearance,
  linksCount
}: SidebarProps) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "collections", label: "Collections", icon: FolderHeart, badge: String(linksCount) },
    { id: "analytics", label: "Analytics", icon: TrendingUp },
    { id: "billing", label: "Plan & Billing", icon: CreditCard },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const isLightTheme = appearance.theme === "light";
  const sidebarGlassClass = isLightTheme 
    ? "glass-sidebar-light border-r border-[#6366f1]/10 bg-white/60 text-gray-800" 
    : "glass-sidebar border-r border-white/5 text-gray-300";

  const accentBg = {
    indigo: "bg-[#6366f1] hover:bg-indigo-500 text-white",
    emerald: "bg-emerald-600 hover:bg-emerald-500 text-white",
    rose: "bg-rose-600 hover:bg-rose-500 text-white"
  }[appearance.accent] || "bg-[#6366f1] hover:bg-indigo-500 text-white";

  const accentText = {
    indigo: "text-[#6366f1]",
    emerald: "text-emerald-500",
    rose: "text-rose-500"
  }[appearance.accent] || "text-[#6366f1]";

  return (
    <aside className={`w-64 flex flex-col justify-between h-screen sticky top-0 select-none ${sidebarGlassClass}`}>
      {/* Upper Brand Section */}
      <div className="p-5">
        <div 
          onClick={() => setActiveTab("landing")} 
          className="flex items-center gap-3 cursor-pointer hover:opacity-90 transition-opacity mb-8 group"
          id="brand-logo"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6366f1] to-[#ec4899] flex items-center justify-center relative shadow-inner group-hover:scale-105 transition-transform duration-300">
            <Skull className="w-5 h-5 text-white" />
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <div>
            <h1 className={`font-headline font-bold text-sm tracking-widest uppercase ${isLightTheme ? "text-[#4f46e5]" : "text-[#e3e2e6]"}`}>
              Graveyard
            </h1>
            <span className={`text-[10px] font-mono tracking-widest block ${isLightTheme ? "text-gray-500" : "text-gray-400"}`}>
              SOVEREIGN ARCHIVE
            </span>
          </div>
        </div>
 
        {/* Action Button: New Entry */}
        <button
          onClick={onOpenNewEntryModal}
          className={`w-full py-3 px-4 rounded-xl font-sans font-semibold text-xs flex items-center justify-center gap-2 mb-6 shadow-lg transition-all duration-300 active:scale-95 ${accentBg}`}
          id="sidebar-new-entry-btn"
        >
          <Plus className="w-4 h-4" />
          <span>New Tombstone</span>
        </button>
 
        {/* Navigation Items */}
        <nav className="space-y-1">
          <span className={`text-[10px] font-mono tracking-widest uppercase px-3 block mb-2 ${isLightTheme ? "text-gray-400" : "text-gray-500"}`}>
            Archive Hub
          </span>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-150 ${
                  isActive
                    ? isLightTheme 
                      ? "glass-nav-item-active-light shadow-sm" 
                      : "glass-nav-item-active shadow-inner"
                    : isLightTheme 
                      ? "hover:bg-indigo-500/5 hover:text-indigo-600 text-gray-500" 
                      : "hover:bg-white/5 hover:text-white text-gray-400"
                }`}
                id={`nav-${item.id}`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? (isLightTheme ? "text-indigo-600" : accentText) : (isLightTheme ? "text-gray-400" : "text-gray-500")}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                    isLightTheme 
                      ? "bg-[#6366f1]/5 text-indigo-600 border-[#6366f1]/10" 
                      : "bg-[#1e1f26] text-gray-400 border-[#2b2a3a]"
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
 
      {/* Account and Footer block */}
      <div className={`p-4 border-t space-y-4 ${isLightTheme ? "border-gray-200/50" : "border-white/5"}`}>
        {/* Switch to Landing Page View (Quick Link) */}
        <button 
          onClick={() => setActiveTab("landing")}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-colors ${
            isLightTheme 
              ? "text-gray-500 hover:bg-indigo-500/5 hover:text-indigo-600" 
              : "text-gray-400 hover:bg-white/5 hover:text-white"
          }`}
          id="nav-marketing-link"
        >
          <Eye className="w-4 h-4" />
          <span>Interactive Landing</span>
        </button>
 
        {/* User Profile Summary */}
        <div className={`flex items-center gap-3 p-2 rounded-lg ${isLightTheme ? "bg-black/5" : "bg-white/5"}`}>
          <div className={`w-8 h-8 rounded-full overflow-hidden border ${isLightTheme ? "border-indigo-150" : "border-[#2b2a3a]"}`}>
            {profile.avatar ? (
              <img src={profile.avatar} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className={`w-full h-full flex items-center justify-center font-mono text-xs ${isLightTheme ? "bg-indigo-100 text-indigo-600" : "bg-[#20212a] text-[#c0c1ff]"}`}>
                CR
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className={`text-xs font-semibold truncate ${isLightTheme ? "text-gray-800" : "text-gray-200"}`}>{profile.displayName}</h4>
            <p className="text-[10px] font-mono text-emerald-500 truncate font-semibold">Premium Member</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
