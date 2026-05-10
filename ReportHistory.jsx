import React from "react";
import { format } from "date-fns";
import { TrendingUp, TrendingDown, MinusCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const recDot = {
  Buy: "bg-emerald-500",
  Hold: "bg-amber-400",
  Sell: "bg-rose-500",
};

const recLabel = {
  Buy: "text-emerald-400",
  Hold: "text-amber-400",
  Sell: "text-rose-400",
};

export default function ReportHistory({ reports, selectedId, onSelect }) {
  return (
    <div className="flex flex-col h-full">
      {/* Section label */}
      <div className="px-3 pt-4 pb-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/50">
          Recent Reports
          {reports.length > 0 && (
            <span className="ml-2 bg-sidebar-accent text-sidebar-foreground/60 rounded-full px-1.5 py-0.5 text-[9px]">
              {reports.length}
            </span>
          )}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
            <Clock className="h-6 w-6 text-sidebar-foreground/20 mb-2" />
            <p className="text-xs text-sidebar-foreground/40">No reports yet</p>
          </div>
        ) : (
          <ul className="space-y-0.5 px-2 pb-2">
            {reports.map((r) => (
              <li key={r.id}>
                <button
                  onClick={() => onSelect(r)}
                  className={cn(
                    "w-full text-left px-3 py-2.5 rounded-lg transition-colors group",
                    selectedId === r.id
                      ? "bg-sidebar-primary/15 border border-sidebar-primary/25"
                      : "hover:bg-sidebar-accent border border-transparent"
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", recDot[r.recommendation])} />
                    <span className={cn("text-[11px] font-bold uppercase tracking-wide", recLabel[r.recommendation])}>
                      {r.recommendation}
                    </span>
                    <span className="ml-auto text-[10px] text-sidebar-foreground/40">
                      {r.created_date ? format(new Date(r.created_date), "MMM d") : ""}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-sidebar-foreground/90 truncate">{r.ticker}</p>
                  <p className="text-[11px] text-sidebar-foreground/40 mt-0.5 truncate">
                    {r.timeframe}
                    {r.riskProfile ? ` · ${r.riskProfile}` : ""}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}