import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, RefreshCw, Clock, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";

function SourceRow({ label, value, status }) {
  const isAvailable = status === "available";
  const isMissing = status === "missing";
  const isRefreshing = status === "refreshing";

  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-border last:border-0">
      <div className="shrink-0 mt-0.5">
        {isAvailable && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
        {isMissing && <XCircle className="h-4 w-4 text-muted-foreground/40" />}
        {isRefreshing && <RefreshCw className="h-4 w-4 text-amber-400 animate-spin" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-xs font-medium",
          isAvailable && "text-foreground",
          isMissing && "text-muted-foreground/50",
          isRefreshing && "text-amber-400"
        )}>{label}</p>
        {value && isAvailable && (
          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">{value}</p>
        )}
        {isMissing && <p className="text-[11px] text-muted-foreground/40 mt-0.5">Not available</p>}
        {isRefreshing && <p className="text-[11px] text-amber-400/60 mt-0.5">Fetching latest data…</p>}
      </div>
    </div>
  );
}

function getStatus(value, isRefreshing) {
  if (isRefreshing) return "refreshing";
  if (!value || value === "Data not available") return "missing";
  return "available";
}

export default function ResearchStatusPanel({ cache, isRefreshing, onRefresh, userPlan = "free" }) {
  const canRefresh = userPlan === "pro" || userPlan === "elite";
  const hasCache = !!cache;

  const lastUpdated = cache?.lastUpdated
    ? formatDistanceToNow(new Date(cache.lastUpdated), { addSuffix: true })
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-card border border-border rounded-xl shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-border flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Database className="h-4 w-4 text-primary" />
          <div>
            <p className="text-sm font-semibold text-foreground">Research Sources</p>
            {lastUpdated && (
              <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                <Clock className="h-3 w-3" />
                Updated {lastUpdated}
              </p>
            )}
          </div>
        </div>
        {canRefresh ? (
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1.5"
            onClick={onRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn("h-3 w-3", isRefreshing && "animate-spin")} />
            {isRefreshing ? "Refreshing…" : "Refresh"}
          </Button>
        ) : (
          <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-1 rounded-full">
            Pro+ to refresh
          </span>
        )}
      </div>

      {/* Sources */}
      <div className="px-5 py-1">
        <SourceRow
          label="SEC Filings"
          value={cache?.secSummary}
          status={getStatus(cache?.secSummary, isRefreshing)}
        />
        <SourceRow
          label="Earnings Call"
          value={cache?.earningsCallSummary}
          status={getStatus(cache?.earningsCallSummary, isRefreshing)}
        />
        <SourceRow
          label="Press Releases"
          value={cache?.pressReleaseSummary}
          status={getStatus(cache?.pressReleaseSummary, isRefreshing)}
        />
        <SourceRow
          label="Management Tone"
          value={cache?.managementToneSummary}
          status={getStatus(cache?.managementToneSummary, isRefreshing)}
        />
        <SourceRow
          label="Forward Guidance"
          value={cache?.guidanceSummary}
          status={getStatus(cache?.guidanceSummary, isRefreshing)}
        />
      </div>
    </motion.div>
  );
}