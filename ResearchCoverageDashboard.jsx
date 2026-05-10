import React from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2, XCircle, AlertCircle, RefreshCw, Database,
  BarChart3, FileText, Mic, Newspaper, Users, TrendingUp, Building2, LineChart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import ConfidenceScoreBadge from "./ConfidenceScoreBadge";

const COVERAGE_CARDS = [
  { key: "marketData", label: "Market Data", icon: BarChart3, defaultSource: "Finnhub → Yahoo" },
  { key: "financialStatements", label: "Financial Statements", icon: LineChart, defaultSource: "FMP → Intrinio → EODHD → SEC XBRL → Yahoo" },
  { key: "valuationMetrics", label: "Valuation Metrics", icon: TrendingUp, defaultSource: "FMP" },
  { key: "secFilings", label: "SEC Filings", icon: FileText, defaultSource: "SEC EDGAR" },
  { key: "earningsTranscript", label: "Earnings Insights", icon: Mic, defaultSource: "Transcript → Press release → 8-K → News" },
  { key: "news", label: "Company News", icon: Newspaper, defaultSource: "Finnhub → EODHD" },
  { key: "insiderActivity", label: "Insider Activity", icon: Users, defaultSource: "Finnhub" },
  { key: "analystRecommendations", label: "Analyst Trends", icon: Building2, defaultSource: "Finnhub" },
];

const STATUS_CFG = {
  available: { icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/25", label: "Available", dot: "bg-emerald-400" },
  partial: { icon: AlertCircle, color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/25", label: "Partial", dot: "bg-amber-400" },
  missing: { icon: XCircle, color: "text-muted-foreground/60", bg: "bg-secondary", border: "border-border", label: "Missing", dot: "bg-muted-foreground/30" },
};

// Backward-compat: coverage entries used to be plain strings ("available"/"partial"/"missing").
// Now they may be objects { status, sourceUsed, reason, attempts }.
function normalizeEntry(entry) {
  if (!entry) return { status: "missing" };
  if (typeof entry === "string") return { status: entry };
  return entry;
}

function CoverageCard({ card, entry, lastUpdatedText, delay }) {
  const status = entry.status || "missing";
  const cfg = STATUS_CFG[status] || STATUS_CFG.missing;
  const Icon = card.icon;
  const sourceLine = entry.sourceUsed || card.defaultSource;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className={cn("border rounded-xl px-3.5 py-3 flex items-start gap-3", cfg.bg, cfg.border)}
    >
      <div className={cn(
        "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
        status === "available" ? "bg-primary/15 border border-primary/20" : "bg-muted/40 border border-border"
      )}>
        <Icon className={cn("h-4 w-4", status === "available" ? "text-primary" : "text-muted-foreground/60")} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className={cn("text-xs font-semibold", status === "missing" ? "text-muted-foreground/70" : "text-foreground")}>
            {card.label}
          </p>
          <span className={cn("text-[10px] font-bold uppercase tracking-wide flex items-center gap-1", cfg.color)}>
            <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
            {cfg.label}
          </span>
        </div>
        <p className="text-[10px] text-muted-foreground mt-0.5 truncate" title={sourceLine}>
          <span className="text-muted-foreground/70">via</span>{" "}
          <span className={status !== "missing" ? "text-foreground/80 font-medium" : ""}>{sourceLine}</span>
        </p>
        {entry.reason && (
          <p className="text-[10px] text-amber-400/80 mt-1 leading-snug" title={entry.reason}>
            {entry.reason}
          </p>
        )}
        {lastUpdatedText && status !== "missing" && (
          <p className="text-[9px] text-muted-foreground/60 mt-1">Updated {lastUpdatedText}</p>
        )}
      </div>
    </motion.div>
  );
}

export default function ResearchCoverageDashboard({ cache, isRefreshing, onRefresh }) {
  if (!cache) return null;

  let coverageRaw = {};
  try { coverageRaw = cache.sourceCoverageJson ? JSON.parse(cache.sourceCoverageJson) : {}; }
  catch { coverageRaw = {}; }

  const score = cache.sourceConfidenceScore ?? 0;
  const lastUpdated = cache.lastUpdated
    ? formatDistanceToNow(new Date(cache.lastUpdated), { addSuffix: true })
    : null;

  const canRefresh = !!onRefresh;

  const entries = COVERAGE_CARDS.map(c => ({ card: c, entry: normalizeEntry(coverageRaw[c.key]) }));
  const availableCount = entries.filter(e => e.entry.status === "available").length;
  const partialCount = entries.filter(e => e.entry.status === "partial").length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-card border border-border rounded-xl shadow-sm overflow-hidden"
    >
      <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Database className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">Research Coverage</p>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-[11px] text-emerald-400 font-semibold">{availableCount} available</span>
              {partialCount > 0 && <span className="text-[11px] text-amber-400 font-semibold">{partialCount} partial</span>}
              {lastUpdated && (
                <span className="text-[11px] text-muted-foreground">· updated {lastUpdated}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ConfidenceScoreBadge score={score} size="lg" />
          {canRefresh && (
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
          )}
        </div>
      </div>

      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {entries.map(({ card, entry }, i) => (
          <CoverageCard
            key={card.key}
            card={card}
            entry={entry}
            lastUpdatedText={lastUpdated}
            delay={i * 0.04}
          />
        ))}
      </div>

      <div className="px-5 py-3 border-t border-border bg-muted/10 flex items-center justify-between gap-3 flex-wrap">
        <p className="text-[10px] text-muted-foreground">
          Sources: Finnhub · FMP · Intrinio · EODHD · SEC EDGAR · Yahoo Finance
        </p>
        {cache.missingSources?.length > 0 && (
          <p className="text-[10px] text-muted-foreground">
            <span className="font-semibold">Missing:</span> {cache.missingSources.join(", ")}
          </p>
        )}
      </div>
    </motion.div>
  );
}