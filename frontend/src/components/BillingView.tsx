import React, { useState } from "react";
import { CreditCard, Download, Sparkles, Check, Database } from "lucide-react";
import { BillingHistory, AppearanceSettings } from "../types";

interface BillingViewProps {
  billingHistory: BillingHistory[];
  appearance: AppearanceSettings;
  bookmarksCount: number;
  aiSummariesCount?: number;
}

export default function BillingView({ billingHistory, appearance, bookmarksCount, aiSummariesCount = 0 }: BillingViewProps) {
  const [tempAlert, setTempAlert] = useState("");
  const isLightTheme = appearance.theme === "light";

  return (
    <div className={`flex-grow flex-1 overflow-y-auto p-8 max-w-5xl mx-auto w-full font-sans select-none animate-fadeIn bg-transparent scrollbar-thin ${isLightTheme ? "text-gray-900" : "text-[#e3e2e6]"}`}>
      <div className={`border-b pb-6 mb-8 ${isLightTheme ? "border-indigo-100/50" : "border-[#262530]"}`}>
        <h1 className={`text-xl font-headline font-bold ${isLightTheme ? "text-gray-900" : "text-gray-100"}`}>Plan & Billing</h1>
        <p className="text-xs text-gray-500 mt-1">Review subscription states, check usage quotas, or download receipts.</p>
      </div>

      {tempAlert && (
        <div className={`p-3.5 mb-6 rounded-xl border font-semibold text-xs flex items-center gap-2.5 ${isLightTheme ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-indigo-500/20 bg-indigo-500/5 text-indigo-300"}`}>
          <Sparkles className="w-4 h-4 text-emerald-500 animate-pulse" />
          <span>{tempAlert}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className={`border p-6 rounded-2xl relative overflow-hidden space-y-4 ${isLightTheme ? "glass-card-light" : "glass-card"}`}>
            <div className="flex items-center justify-between">
              <div>
                <span className={`text-[10px] font-mono tracking-widest px-2 py-0.5 rounded-full uppercase font-bold border ${isLightTheme ? "text-emerald-700 bg-emerald-50 border-emerald-200" : "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"}`}>
                  FREE PLAN
                </span>
                <h3 className={`text-lg font-headline font-semibold mt-2 ${isLightTheme ? "text-indigo-950" : "text-gray-100"}`}>Hobbyist</h3>
                <p className="text-xs text-gray-400 mt-1">Upgrade anytime to unlock unlimited links and AI summaries.</p>
              </div>
              <span className={`text-xl font-headline font-bold ${isLightTheme ? "text-indigo-950" : "text-gray-200"}`}>$0<span className="text-xs text-gray-500">/mo</span></span>
            </div>
            <div className={`pt-3 border-t flex items-center gap-3 ${isLightTheme ? "border-indigo-100/40" : "border-white/5"}`}>
              <button
                onClick={() => setTempAlert("Upgrade flow coming soon.")}
                className={`px-3.5 py-1.5 border text-xs font-semibold rounded-lg transition-colors cursor-pointer ${isLightTheme ? "bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-600" : "bg-indigo-500/20 hover:bg-indigo-500/30 border-indigo-500/30 text-indigo-300"}`}
              >
                Upgrade Plan
              </button>
            </div>
          </div>

          <div className={`border p-6 rounded-2xl space-y-5 ${isLightTheme ? "glass-card-light" : "glass-card"}`}>
            <div>
              <h4 className={`text-xs font-mono font-bold tracking-widest uppercase ${isLightTheme ? "text-indigo-950" : "text-gray-300"}`}>Current Usage</h4>
              <p className="text-[11px] text-gray-500 mt-0.5">Based on your actual saved data.</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 font-medium flex items-center gap-1">
                    <Database className="w-3.5 h-3.5 text-gray-400" />
                    <span className={isLightTheme ? "text-gray-700" : "text-gray-300"}>Links Saved</span>
                  </span>
                  <span className="text-gray-400 font-mono text-[11px]">{bookmarksCount.toLocaleString()} / 25</span>
                </div>
                <div className={`w-full h-2 rounded overflow-hidden border ${isLightTheme ? "bg-indigo-50 border-indigo-100" : "bg-[#16171f] border-[#21222c]"}`}>
                  <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${Math.min((bookmarksCount / 25) * 100, 100)}%` }} />
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 font-medium flex items-center gap-1 text-nowrap">
                    <Sparkles className="w-3.5 h-3.5 text-gray-400" />
                    <span className={isLightTheme ? "text-gray-700" : "text-gray-300"}>AI Summaries Generated</span>
                  </span>
                  <span className="text-gray-400 font-mono text-[11px]">{aiSummariesCount} / 25</span>
                </div>
                <div className={`w-full h-2 rounded overflow-hidden border ${isLightTheme ? "bg-emerald-50 border-emerald-100" : "bg-[#16171f] border-[#21222c]"}`}>
                  <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${Math.min((aiSummariesCount / 25) * 100, 100)}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={`border p-6 rounded-2xl space-y-4 h-fit ${isLightTheme ? "glass-card-light" : "glass-card"}`}>
          <h4 className={`text-xs font-mono font-bold tracking-widest uppercase ${isLightTheme ? "text-[#3e415a]" : "text-gray-400"}`}>Premium Benefits</h4>
          <ul className={`space-y-3 text-xs leading-relaxed pr-2 select-text ${isLightTheme ? "text-gray-700" : "text-gray-300"}`}>
            {["Unlimited links saved.", "Permanent backups against link rot.", "API access tokens.", "Priority AI summaries."].map((ben, idx) => (
              <li key={idx} className="flex gap-2.5 items-start">
                <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>{ben}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className={`mt-8 pt-6 border-t space-y-4 ${isLightTheme ? "border-indigo-100" : "border-[#262530]"}`}>
        <h3 className={`text-xs font-mono font-bold tracking-widest uppercase ${isLightTheme ? "text-[#3e415a]" : "text-[#858798]"}`}>Billing History</h3>
        <div className={`w-full overflow-x-auto border rounded-xl ${isLightTheme ? "border-indigo-100 bg-white" : "border-[#21222c] bg-[#0f1013]"}`}>
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className={`border-b text-gray-500 font-mono font-medium ${isLightTheme ? "bg-indigo-50/45 border-indigo-100" : "bg-[#0b0c0f] border-[#21222c]"}`}>
                <th className="p-4">Date</th>
                <th className="p-4">Description</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className={`divide-y font-sans ${isLightTheme ? "divide-indigo-50 text-gray-700" : "divide-[#21222c] text-gray-300"}`}>
              {billingHistory.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-xs text-gray-500 italic">No billing history yet.</td>
                </tr>
              ) : (
                billingHistory.map((invoice) => (
                  <tr key={invoice.id} className={`transition-colors ${isLightTheme ? "hover:bg-indigo-50/10" : "hover:bg-[#13141a]"}`}>
                    <td className="p-4">{invoice.date}</td>
                    <td className="p-4 font-semibold">{invoice.description}</td>
                    <td className="p-4 font-mono">{invoice.amount}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-mono tracking-wider border px-2 py-0.5 rounded font-bold ${isLightTheme ? "text-emerald-700 bg-emerald-50 border-emerald-100" : "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"}`}>
                        {invoice.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
