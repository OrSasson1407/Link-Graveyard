import React, { useState } from "react";
import { 
  CreditCard, 
  HelpCircle, 
  Download, 
  Sparkles, 
  Check, 
  Info, 
  Database,
  ArrowUpRight
} from "lucide-react";
import { BillingHistory, AppearanceSettings } from "../types";

interface BillingViewProps {
  billingHistory: BillingHistory[];
  appearance: AppearanceSettings;
  bookmarksCount: number;
}

export default function BillingView({
  billingHistory,
  appearance,
  bookmarksCount,
}: BillingViewProps) {
  const [downloadingId, setDownloadingId] = useState("");
  const [activePlan, setActivePlan] = useState("Premium Annual Plan");
  const [tempAlert, setTempAlert] = useState("");

  const handleDownloadReceipt = (id: string) => {
    setDownloadingId(id);
    setTimeout(() => {
      setDownloadingId("");
      setTempAlert(`Receipt ${id}.pdf successfully routed to local downloads.`);
      setTimeout(() => setTempAlert(""), 4500);
    }, 1500);
  };

  const currentUsageStats = {
    linksBuried: bookmarksCount,
    linksLimit: 10000,
    aiSummaries: 142,
    aiLimit: 500
  };

  const isLightTheme = appearance.theme === "light";

  return (
    <div className={`flex-grow flex-1 overflow-y-auto p-8 max-w-5xl mx-auto w-full font-sans select-none animate-fadeIn bg-transparent scrollbar-thin ${isLightTheme ? "text-gray-900" : "text-[#e3e2e6]"}`}>
      
      {/* Header Info */}
      <div className={`border-b pb-6 mb-8 ${isLightTheme ? "border-indigo-100/50" : "border-[#262530]"}`}>
        <h1 className={`text-xl font-headline font-bold flex items-center gap-2 ${isLightTheme ? "text-gray-900" : "text-gray-100"}`}>
          Plan & Billing
        </h1>
        <p className="text-xs text-gray-505 mt-1">
          Review subscription states, check dynamic usage quotas, or print transactional receipts.
        </p>
      </div>

      {tempAlert && (
        <div className={`p-3.5 mb-6 rounded-xl border font-semibold text-xs flex items-center gap-2.5 ${
          isLightTheme 
            ? "border-emerald-200 bg-emerald-50 text-emerald-800" 
            : "border-indigo-500/20 bg-indigo-500/5 text-indigo-300"
        }`}>
          <Sparkles className="w-4 h-4 text-emerald-500 animate-pulse" />
          <span>{tempAlert}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Tier Panel and Usage Meter Block */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Subscription State Box */}
          <div className={`border p-6 rounded-2xl relative overflow-hidden space-y-4 ${
            isLightTheme ? "glass-card-light" : "glass-card"
          }`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 pointer-events-none rounded-full blur-2xl" />
            <div className="flex items-center justify-between">
              <div>
                <span className={`text-[10px] font-mono tracking-widest px-2 py-0.5 rounded-full uppercase font-bold border ${
                  isLightTheme 
                    ? "text-emerald-700 bg-emerald-50 border-emerald-200" 
                    : "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                }`}>
                  ACTIVE SUBSCRIPTION
                </span>
                <h3 className={`text-lg font-headline font-semibold mt-2 ${isLightTheme ? "text-indigo-950" : "text-gray-100"}`}>{activePlan}</h3>
                <p className="text-xs text-gray-400 mt-1">Billed annually • Next renewal on November 14, 2026 ($120/year)</p>
              </div>
              <span className={`text-xl font-headline font-bold ${isLightTheme ? "text-indigo-950" : "text-gray-200"}`}>$120<span className="text-xs text-gray-500">/yr</span></span>
            </div>

            <div className={`pt-3 border-t flex items-center gap-3 ${isLightTheme ? "border-indigo-100/40" : "border-white/5"}`}>
              <button 
                onClick={() => setTempAlert("Plan modifications is disabled during the review period.")}
                className={`px-3.5 py-1.5 border text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  isLightTheme 
                    ? "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-150" 
                    : "bg-[#1b1d28] hover:bg-[#23263b] border-[#2e3146] text-indigo-300"
                }`}
              >
                Update Plan
              </button>
              <button 
                onClick={() => {
                  if (confirm("Are you sure you want to request cancellation for next year? Your data remains completely safe.")) {
                    setActivePlan("Hobbyist Free tier");
                    setTempAlert("Plan updated to trial-tier. Summaries are limited to 5 articles/month.");
                  }
                }}
                className="px-3.5 py-1.5 bg-transparent hover:bg-rose-500/5 text-xs font-semibold text-gray-500 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
              >
                Cancel Subscription
              </button>
            </div>
          </div>

          {/* Current Usage Quotas and Progress Bars */}
          <div className={`border p-6 rounded-2xl space-y-5 ${
            isLightTheme ? "glass-card-light" : "glass-card"
          }`}>
            <div>
              <h4 className={`text-xs font-mono font-bold tracking-widest uppercase ${isLightTheme ? "text-indigo-950" : "text-gray-300"}`}>Current Usage Meters</h4>
              <p className="text-[11px] text-gray-500 mt-0.5">Reset on November 14th annually.</p>
            </div>

            <div className="space-y-4">
              {/* Progress 1: Links Buried */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 font-medium flex items-center gap-1">
                    <Database className="w-3.5 h-3.5 text-gray-400" />
                    <span className={isLightTheme ? "text-gray-700" : "text-gray-300"}>Links Buried</span>
                  </span>
                  <span className="text-gray-400 font-mono text-[11px]">
                    {currentUsageStats.linksBuried.toLocaleString()} / {currentUsageStats.linksLimit.toLocaleString()}
                  </span>
                </div>
                {/* Bar */}
                <div className={`w-full h-2 rounded overflow-hidden border ${isLightTheme ? "bg-indigo-50 border-indigo-100" : "bg-[#16171f] border-[#21222c]"}`}>
                  <div 
                    className="h-full bg-indigo-500 transition-all duration-500" 
                    style={{ width: `${(currentUsageStats.linksBuried / currentUsageStats.linksLimit) * 100}%` }}
                  />
                </div>
              </div>

              {/* Progress 2: AI Summaries completed */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 font-medium flex items-center gap-1 text-nowrap">
                    <Sparkles className="w-3.5 h-3.5 text-gray-400" />
                    <span className={isLightTheme ? "text-gray-700" : "text-gray-300"}>AI Cloud Summaries</span>
                  </span>
                  <span className="text-gray-400 font-mono text-[11px]">
                    {currentUsageStats.aiSummaries} / {currentUsageStats.aiLimit}
                  </span>
                </div>
                {/* Bar */}
                <div className={`w-full h-2 rounded overflow-hidden border ${isLightTheme ? "bg-emerald-50 border-emerald-100" : "bg-[#16171f] border-[#21222c]"}`}>
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-500" 
                    style={{ width: `${(currentUsageStats.aiSummaries / currentUsageStats.aiLimit) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Simple visual check cards & help desk info */}
        <div className={`border p-6 rounded-2xl space-y-4 h-fit ${
          isLightTheme ? "glass-card-light" : "glass-card"
        }`}>
          <h4 className={`text-xs font-mono font-bold tracking-widest uppercase ${isLightTheme ? "text-[#3e415a]" : "text-gray-400"}`}>Premium Benefits</h4>
          <ul className={`space-y-3 text-xs leading-relaxed pr-2 select-text ${isLightTheme ? "text-gray-700" : "text-gray-300"}`}>
            {[
              "Unlimited instant server-side crawling.",
              "Permanent backups against link rot.",
              "API access key tokens.",
              "Weekly priority contextual reports."
            ].map((ben, idx) => (
              <li key={idx} className="flex gap-2.5 items-start">
                <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>{ben}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* LOWER PART: Billing list History Table */}
      <div className={`mt-8 pt-6 border-t space-y-4 ${isLightTheme ? "border-indigo-100" : "border-[#262530]"}`}>
        <h3 className={`text-xs font-mono font-bold tracking-widest uppercase ${isLightTheme ? "text-[#3e415a]" : "text-[#858798]"}`}>Billing History</h3>

        <div className={`w-full overflow-x-auto border rounded-xl select-none ${
          isLightTheme ? "border-indigo-100 bg-white" : "border-[#21222c] bg-[#0f1013]"
        }`}>
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className={`border-b text-gray-500 font-mono font-medium ${isLightTheme ? "bg-indigo-50/45 border-indigo-100" : "bg-[#0b0c0f] border-[#21222c]"}`}>
                <th className="p-4">Date</th>
                <th className="p-4">Description</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className={`divide-y font-sans ${isLightTheme ? "divide-indigo-50 text-gray-700" : "divide-[#21222c] text-gray-300"}`}>
              {billingHistory.map((invoice) => (
                <tr key={invoice.id} className={`transition-colors ${isLightTheme ? "hover:bg-indigo-50/10" : "hover:bg-[#13141a]"}`}>
                  <td className="p-4">{invoice.date}</td>
                  <td className="p-4 font-semibold">{invoice.description}</td>
                  <td className="p-4 font-mono">{invoice.amount}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-mono tracking-wider border px-2 py-0.5 rounded font-bold ${
                      isLightTheme 
                        ? "text-emerald-700 bg-emerald-50 border-emerald-100" 
                        : "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                    }`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleDownloadReceipt(invoice.id)}
                      disabled={downloadingId !== ""}
                      className={`p-1 px-2 border rounded transition-colors text-[11px] font-mono inline-flex items-center gap-1 cursor-pointer disabled:opacity-50 ${
                        isLightTheme 
                          ? "bg-white hover:bg-indigo-55 hover:border-indigo-200 text-indigo-700 border-indigo-100" 
                          : "bg-transparent hover:bg-[#20212f] text-gray-400 hover:text-[#c0c1ff] border-[#272836]"
                      }`}
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{downloadingId === invoice.id ? "Fetching..." : "PDF"}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
