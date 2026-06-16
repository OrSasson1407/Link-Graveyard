import React, { useState } from "react";
import { 
  User, 
  Settings, 
  Palette, 
  Download, 
  Chrome, 
  Save, 
  Check, 
  Sparkles,
  Eye,
  Info
} from "lucide-react";
import { UserProfile, AppearanceSettings } from "../types";

interface SettingsViewProps {
  profile: UserProfile;
  appearance: AppearanceSettings;
  onUpdateProfile: (profile: Partial<UserProfile>) => void;
  onUpdateAppearance: (appearance: Partial<AppearanceSettings>) => void;
}

export default function SettingsView({
  profile,
  appearance,
  onUpdateProfile,
  onUpdateAppearance
}: SettingsViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<"profile" | "appearance" | "integrations">("profile");

  // Local Profile state for single-batch saving
  const [dispName, setDispName] = useState(profile.displayName);
  const [bText, setBText] = useState(profile.bio);
  const [saveStatus, setSaveStatus] = useState("");

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({ displayName: dispName, bio: bText });
    setSaveStatus("Profile customized successfully!");
    setTimeout(() => setSaveStatus(""), 4000);
  };

  const accentColorText = {
    indigo: "text-indigo-400",
    emerald: "text-emerald-400",
    rose: "text-rose-400"
  }[appearance.accent];

  const accentBorder = {
    indigo: "border-indigo-400",
    emerald: "border-emerald-400",
    rose: "border-rose-400"
  }[appearance.accent];

  const accentBg = {
    indigo: "bg-indigo-600 hover:bg-indigo-500 text-white",
    emerald: "bg-emerald-600 hover:bg-emerald-500 text-white",
    rose: "bg-rose-600 hover:bg-rose-500 text-white"
  }[appearance.accent];

  const isLightTheme = appearance.theme === "light";

  return (
    <div className={`flex-1 overflow-y-auto p-8 max-w-5xl mx-auto w-full font-sans select-none scrollbar-thin bg-transparent ${isLightTheme ? "text-gray-900" : "text-[#e3e2e6]"}`}>
      
      {/* Header info */}
      <div className={`border-b pb-6 mb-8 ${isLightTheme ? "border-indigo-100/50" : "border-[#262530]"}`}>
        <h1 className={`text-xl font-headline font-bold flex items-center gap-2 ${isLightTheme ? "text-gray-900" : "text-gray-100"}`}>
          Cabinet Settings
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Adjust visual themes, edit research credentials, or download browser integrations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Sub Navigation Sidebar */}
        <div className="space-y-1 md:col-span-1">
          <button
            onClick={() => setActiveSubTab("profile")}
            className={`w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer ${
              activeSubTab === "profile" 
                ? isLightTheme 
                  ? "bg-indigo-600 text-white shadow-sm" 
                  : "bg-indigo-500/20 text-[#c0c1ff] border border-indigo-500/30" 
                : isLightTheme 
                  ? "text-gray-600 hover:text-indigo-600 hover:bg-neutral-100" 
                  : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <User className="w-4 h-4" />
            <span>Public Profile</span>
          </button>

          <button
            onClick={() => setActiveSubTab("appearance")}
            className={`w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer ${
              activeSubTab === "appearance" 
                ? isLightTheme 
                  ? "bg-indigo-600 text-white shadow-sm" 
                  : "bg-indigo-500/20 text-[#c0c1ff] border border-indigo-500/30" 
                : isLightTheme 
                  ? "text-gray-600 hover:text-indigo-600 hover:bg-neutral-100" 
                  : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>Appearance</span>
          </button>

          <button
            onClick={() => setActiveSubTab("integrations")}
            className={`w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer ${
              activeSubTab === "integrations" 
                ? isLightTheme 
                  ? "bg-indigo-600 text-white shadow-sm" 
                  : "bg-indigo-500/20 text-[#c0c1ff] border border-indigo-500/30" 
                : isLightTheme 
                  ? "text-gray-600 hover:text-indigo-600 hover:bg-neutral-100" 
                  : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Chrome className="w-4 h-4" />
            <span>Integrations</span>
          </button>
        </div>

        {/* Dynamic Panels */}
        <div className="md:col-span-3">

          {/* PANEL 1: Public Profile */}
          {activeSubTab === "profile" && (
            <div className="space-y-6 animate-fadeIn">
              <h2 className={`text-sm font-mono tracking-widest uppercase font-bold ${isLightTheme ? "text-gray-700" : "text-gray-400"}`}>Public Credentials</h2>

              {saveStatus && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-xl text-xs text-emerald-600 flex items-center gap-2 font-semibold">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span>{saveStatus}</span>
                </div>
              )}

              <form onSubmit={handleProfileSave} className="space-y-5">
                {/* Avatar Display */}
                <div>
                  <label className="text-[10px] font-mono tracking-widest uppercase text-gray-500 block mb-2">Researcher Avatar</label>
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-full overflow-hidden border bg-neutral-900 relative group ${
                      isLightTheme ? "border-indigo-100" : "border-[#2c2a3b]"
                    }`}>
                      <img src={profile.avatar} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] font-mono text-gray-300 transition-opacity cursor-pointer">
                        Update
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      <p className={`font-semibold ${isLightTheme ? "text-gray-800" : "text-gray-400"}`}>Gravatar Sync Active</p>
                      <p className="mt-0.5">Vector logs read from sovereign cryptographic profiles.</p>
                    </div>
                  </div>
                </div>

                {/* Display Name Input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono tracking-widest uppercase text-gray-500 block">Display Name</label>
                  <input
                    type="text"
                    value={dispName}
                    onChange={(e) => setDispName(e.target.value)}
                    className={`w-full h-10 px-4 rounded-xl border text-xs focus:outline-none transition-colors ${
                      isLightTheme 
                        ? "glass-input-light text-gray-800 focus:bg-white focus:border-indigo-500 border-indigo-100" 
                        : "glass-input text-gray-200 focus:bg-[#1f2029] target-input-normal focus:border-indigo-500 text-xs"
                    }`}
                    placeholder="E.g., Crypt Researcher"
                  />
                </div>

                {/* Bio text area */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono tracking-widest uppercase text-gray-500 block">Research Biography</label>
                  <textarea
                    rows={4}
                    value={bText}
                    onChange={(e) => setBText(e.target.value)}
                    className={`w-full p-4 rounded-xl border text-xs focus:outline-none transition-colors leading-relaxed pr-8 resize-none ${
                       isLightTheme 
                        ? "glass-input-light text-gray-800 focus:bg-white focus:border-indigo-500 border-indigo-100" 
                        : "glass-input text-gray-200 focus:bg-[#1f2029] focus:border-indigo-500 text-xs"
                    }`}
                    placeholder="Archiving the forgotten web..."
                  />
                </div>

                <button
                  type="submit"
                  className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg cursor-pointer transition-transform hover:scale-[1.01] ${accentBg}`}
                >
                  <Save className="w-4 h-4" />
                  <span>Save Changes ⌘S</span>
                </button>
              </form>
            </div>
          )}

          {/* PANEL 2: Appearance Options & Real-Time Live Preview */}
          {activeSubTab === "appearance" && (
            <div className="space-y-8 animate-fadeIn">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Configuration side */}
                <div className="space-y-6">
                  {/* Option A: Theme Choice */}
                  <div>
                    <h3 className="text-[10px] font-mono tracking-widest text-gray-500 uppercase block mb-3">Theme Mode</h3>
                    <div className="grid grid-cols-3 gap-2.5">
                      {(["light", "dark", "system"] as const).map((mode) => {
                        const isActive = appearance.theme === mode;
                        return (
                          <button
                            key={mode}
                            onClick={() => onUpdateAppearance({ theme: mode })}
                            className={`py-2 px-3 rounded-lg text-xs font-semibold capitalize border transition-all cursor-pointer ${
                              isActive
                                ? isLightTheme 
                                  ? "bg-indigo-600 border-indigo-600 text-white shadow-sm" 
                                  : "bg-[#1f212f] border-indigo-500/50 text-[#c0c1ff]"
                                : isLightTheme 
                                  ? "border-indigo-100 bg-white hover:bg-neutral-50 text-gray-600" 
                                  : "border-[#1e202a] bg-[#14151a] hover:bg-[#1b1c28] text-gray-400"
                            }`}
                          >
                            {mode}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Option B: Accent Accent */}
                  <div>
                    <h3 className="text-[10px] font-mono tracking-widest text-gray-500 uppercase block mb-3">Accent Accent</h3>
                    <div className="grid grid-cols-3 gap-2.5">
                      {(["indigo", "emerald", "rose"] as const).map((color) => {
                        const isActive = appearance.accent === color;
                        const marker = {
                          indigo: "bg-[#7173e2]",
                          emerald: "bg-[#2ebc83]",
                          rose: "bg-[#df254b]"
                        }[color];

                        return (
                          <button
                            key={color}
                            onClick={() => onUpdateAppearance({ accent: color })}
                            className={`py-2 px-3 rounded-lg text-xs font-semibold capitalize border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                              isActive
                                ? isLightTheme 
                                  ? "bg-indigo-600 border-indigo-600 text-white shadow-sm" 
                                  : "bg-[#1f212f] border-indigo-500/50 text-[#c0c1ff]"
                                : isLightTheme 
                                  ? "border-indigo-100 bg-white hover:bg-neutral-50 text-gray-600" 
                                  : "border-[#1e202a] bg-[#14151a] hover:bg-[#1b1c28] text-gray-400"
                            }`}
                          >
                            <span className={`w-2.5 h-2.5 rounded-full ${marker}`} />
                            <span>{color}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Option C: Density */}
                  <div>
                    <h3 className="text-[10px] font-mono tracking-widest text-[#898c9f] uppercase block mb-3">Layout Density</h3>
                    <div className="space-y-2">
                      {(["comfortable", "compact"] as const).map((densityOpt) => {
                        const isActive = appearance.density === densityOpt;
                        return (
                          <button
                            key={densityOpt}
                            onClick={() => onUpdateAppearance({ density: densityOpt })}
                            className={`w-full text-left py-2.5 px-4 rounded-xl text-xs font-semibold border flex items-center justify-between transition-all cursor-pointer ${
                              isActive
                                ? isLightTheme 
                                  ? "bg-indigo-600 border-indigo-600 text-white shadow-sm" 
                                  : "bg-[#1f212f] border-indigo-500/50 text-[#c0c1ff]"
                                : isLightTheme 
                                  ? "border-indigo-100 bg-white hover:bg-neutral-50 text-gray-600" 
                                  : "border-[#1e202a] bg-[#14151a] hover:bg-[#1b1c28] text-gray-400"
                            }`}
                          >
                            <span>{densityOpt === "comfortable" ? "Comfortable (Default)" : "Compact"}</span>
                            <span className="text-[10px] font-mono text-gray-500">
                              {densityOpt === "comfortable" ? "Spacious" : "No negative space"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Real-time preview side MATCHING THE SCREENSHOT mockup! */}
                <div className={`border p-5 rounded-2xl flex flex-col justify-between select-none ${
                  isLightTheme ? "glass-card-light" : "glass-card"
                }`}>
                  <div>
                    <div className={`flex items-center justify-between pb-3 border-b mb-4 ${isLightTheme ? "border-indigo-100" : "border-[#1b1d27]"}`}>
                      <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">Tombstone Live Preview</span>
                      <span className="flex items-center gap-1.5 text-[9px] font-mono text-emerald-500">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                        SYNCED
                      </span>
                    </div>

                    {/* Highly interactive visual previews reacting to selection */}
                    <div className={`p-4 rounded-xl border relative shadow-md select-none transition-all ${
                      appearance.theme === "light" 
                        ? "bg-white text-black border-gray-200" 
                        : "bg-[#0f1013] text-[#e3e2e6] border-[#1c1d24]"
                    }`}
                    style={{
                      padding: appearance.density === "compact" ? "8px" : "16px"
                    }}
                    >
                      <div className="flex items-center justify-between text-[8px] font-mono text-gray-500 mb-1">
                        <span>github.com/react</span>
                        <span>Saved 2h ago</span>
                      </div>

                      <h4 className="text-xs font-bold leading-snug">
                        Understanding React Server Components Architecture
                      </h4>

                      <p className={`text-[10px] mt-1 leading-normal line-clamp-2 ${
                        appearance.theme === "light" ? "text-gray-600" : "text-gray-400"
                      }`}>
                        RSCs execute entirely on the server, resulting in zero bundle size cost for the client.
                      </p>

                      <div className="flex gap-1.5 mt-3 select-none">
                        <span className={`text-[8px] font-mono px-1 py-0.2 rounded ${
                          appearance.accent === "indigo" ? "bg-indigo-500/10 text-indigo-400" :
                          appearance.accent === "emerald" ? "bg-emerald-500/10 text-emerald-400" :
                          "bg-rose-500/10 text-rose-400"
                        }`}>
                          #react
                        </span>
                        <span className={`text-[8px] font-mono px-1 py-0.2 rounded ${
                          appearance.accent === "indigo" ? "bg-indigo-500/10 text-indigo-400" :
                          appearance.accent === "emerald" ? "bg-emerald-500/10 text-emerald-400" :
                          "bg-rose-500/10 text-rose-400"
                        }`}>
                          #architecture
                        </span>
                      </div>

                      {/* Accent-colored custom highlighter */}
                      <div className={`absolute left-0 top-0 bottom-0 w-[3px] rounded-l ${
                        appearance.accent === "indigo" ? "bg-indigo-400" :
                        appearance.accent === "emerald" ? "bg-emerald-400" :
                        "bg-rose-400"
                      }`} />
                    </div>
                  </div>

                  <div className={`mt-6 border-t pt-3 text-[10px] font-mono text-gray-500 leading-relaxed ${isLightTheme ? "border-indigo-100" : "border-[#1b1c25]"}`}>
                    <Info className="w-3.5 h-3.5 text-indigo-500 inline mr-1" />
                    Preview adapts to theme states immediately. Live panels reflect globally across Dashboard, Feed and Collection viewports.
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* PANEL 3: Browser integrations */}
          {activeSubTab === "integrations" && (
            <div className="space-y-6 animate-fadeIn">
              <h2 className={`text-sm font-mono tracking-widest uppercase font-bold ${isLightTheme ? "text-gray-700" : "text-[#818395]"}`}>Extension Sync</h2>
              
              <div className={`border p-6 rounded-2xl relative overflow-hidden flex flex-col md:flex-row items-center gap-6 justify-between ${
                isLightTheme ? "glass-card-light" : "glass-card"
              }`}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#4285f4]/5 pointer-events-none rounded-full blur-2xl" />
                <div className="space-y-2 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-2.5">
                    <Chrome className="w-5 h-5 text-indigo-500" />
                    <h3 className={`text-sm font-semibold ${isLightTheme ? "text-gray-900" : "text-gray-100"}`}>Chrome web extension (v1.2.4)</h3>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed max-w-md">
                    Bury content instantly with a simple ⌘G macro without breaking research flows inside Chrome or Arc profiles. Synchronizes securely with AI Summaries.
                  </p>
                </div>
                <button 
                  onClick={() => alert("Downloading extension pack: link_graveyard-v1.2.4.zip")}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold hover:scale-[1.01] flex items-center justify-center gap-1.5 cursor-pointer border transition-transform ${
                    isLightTheme 
                      ? "bg-white hover:bg-indigo-50/50 text-indigo-600 border-indigo-100" 
                      : "bg-[#2c2d3c] hover:bg-[#34364c] border-[#40415a] text-[#c0c1ff]"
                  }`}
                >
                  <Download className="w-4 h-4" />
                  <span>Download Package</span>
                </button>
              </div>

              {/* Developer credentials */}
              <div className="mt-8 space-y-4">
                <span className="text-[10px] font-mono tracking-widest text-gray-550 uppercase block border-b pb-2">Archive API Access</span>
                <div className={`p-4 rounded-xl border space-y-2 ${
                  isLightTheme 
                    ? "bg-white/80 border-indigo-100" 
                    : "bg-[#0a0b0d] border border-[#1a1c22]"
                }`}>
                  <p className="text-xs text-gray-500">
                    Your dynamic endpoint base url is: <code className={`px-1.5 py-0.5 rounded font-mono text-[11px] ${isLightTheme ? "text-indigo-600 bg-indigo-50" : "text-indigo-400 bg-[#161720]"}`}>https://graveyard.ai-studio/api/v2</code>
                  </p>
                  <p className="text-[11px] text-gray-500">
                    Use this to send automated POST payloads containing article links from scripts, automation recipes, or command runners.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
