import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, RefreshCw, Clock, Database,
  ChevronDown, ChevronUp, FileText, Mic, Newspaper,
  TrendingUp, AlertTriangle, Presentation, BarChart3, Info,
  BarChart2, DollarSign, Scale, Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

const STATUS_CONFIG = {
  available: {
    badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
    icon: CheckCircle2,
    iconClass: "text-emerald-400",
    label: "Available",
    dot: "bg-emerald-400",
  },
  limited: {
    badge: "bg-amber-400/15 text-amber-400 border-amber-400/25",
    icon: Info,
    iconClass: "text-amber-400",
    label: "Limited",
    dot: "bg-amber-400",
  },
  not_applicable: {
    badge: "bg-secondary text-muted-foreground border-border",
    icon: Info,
    iconClass: "text-muted-foreground/50",
    label: "N/A",
    dot: "bg-muted-foreground/25",
  },
  refreshing: {
    badge: "bg-amber-400/15 text-amber-400 border-amber-400/25",
    icon: RefreshCw,
    iconClass: "text-amber-400 animate-spin",
    label: "Refreshing",
    dot: "bg-amber-400 animate-pulse",
  },
};

function getStatus(value, isRefreshing) {
  if (isRefreshing) return "refreshing";
  if (!value || value === "Data not available") return null; // caller decides
  return "available";
}

function SourceCard({ icon: IconComponent, label, sublabel, value, status, unavailableReason, delay = 0 }) {
  const Icon = IconComponent;
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.not_applicable;
  const StatusIcon = cfg.icon;
  const isAvailable = status === "available";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="bg-card border border-border rounded-xl overflow-hidden transition-all duration-200"
    >
      <div
        className={cn("px-4 py-3 flex items-center gap-3", isAvailable && value && "cursor-pointer hover:bg-accent/30")}
        onClick={() => isAvailable && value && setExpanded(!expanded)}
      >
        {/* Source Icon */}
        <div className={cn(
          "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
          isAvailable ? "bg-primary/10 border border-primary/20" : "bg-muted border border-border"
        )}>
          <Icon className={cn("h-4 w-4", isAvailable ? "text-primary" : "text-muted-foreground/40")} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className={cn("text-xs font-semibold", isAvailable ? "text-foreground" : "text-muted-foreground/70")}>
            {label}
          </p>
          {sublabel && (
            <p className="text-[10px] text-muted-foreground/50 mt-0.5">{sublabel}</p>
          )}
          {isAvailable && value && !expanded && (
            <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1 leading-relaxed">{value}</p>
          )}
          {!isAvailable && unavailableReason && (
            <p className="text-[11px] text-muted-foreground/50 mt-0.5 italic">
              {status === "refreshing" ? "Fetching latest data…" : unavailableReason}
            </p>
          )}
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap", cfg.badge)}>
            <span className={cn("inline-block h-1.5 w-1.5 rounded-full mr-1 mb-px", cfg.dot)} />
            {cfg.label}
          </span>
          {isAvailable && value && (
            expanded ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Expanded Summary */}
      <AnimatePresence>
        {expanded && isAvailable && value && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-border bg-accent/20 px-4 py-3"
          >
            <p className="text-xs text-foreground/80 leading-relaxed">{value}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function resolveStatus(value, isRefreshing, fallbackStatus = "limited") {
  if (isRefreshing) return "refreshing";
  const s = getStatus(value, isRefreshing);
  if (s === "available") return "available";
  return fallbackStatus;
}

export default function ResearchSourcesDashboard({ cache, isRefreshing, onRefresh, userPlan = "free", stockData }) {
  const canRefresh = userPlan === "pro" || userPlan === "elite";
  const hasUS = !!(cache?.cik);

  const lastUpdated = cache?.lastUpdated
    ? formatDistanceToNow(new Date(cache.lastUpdated), { addSuffix: true })
    : null;

  const sources = [
    {
      icon: BarChart3,
      label: "Yahoo Finance — Live Market Data",
      sublabel: "Primary source · price, volume, market cap",
      value: stockData
        ? `$${stockData.currentPrice?.toFixed(2)} · Mkt Cap ${stockData.marketCap ? `$${(stockData.marketCap / 1e9).toFixed(1)}B` : "N/A"} · ${stockData.companyName}`
        : null,
      status: stockData ? "available" : "limited",
      unavailableReason: "Live data temporarily unavailable — analysis uses last known market data.",
    },
    {
      icon: Database,
      label: "SEC EDGAR — Filing Registry",
      sublabel: hasUS ? `CIK: ${cache?.cik}` : "US-listed companies only",
      value: hasUS ? `CIK ${cache?.cik} | 10-K: ${cache?.latestTenKDate || "N/A"} | 10-Q: ${cache?.latestTenQDate || "N/A"} | 8-K: ${cache?.latestEightKDate || "N/A"}` : null,
      status: hasUS ? "available" : "not_applicable",
      unavailableReason: "Available for US-listed companies only. Non-US companies use equivalent home-market disclosures.",
    },
    {
      icon: BarChart2,
      label: "XBRL Structured Financial Data",
      sublabel: "Revenue, income, EPS series from SEC",
      value: cache?.financialStatementSummary,
      status: resolveStatus(cache?.financialStatementSummary, isRefreshing, hasUS ? "limited" : "not_applicable"),
      unavailableReason: hasUS ? "XBRL data temporarily unavailable. Analysis uses filing text and general knowledge." : "Available for US-listed companies only.",
    },
    {
      icon: FileText,
      label: "SEC 10-K Annual Report",
      sublabel: hasUS ? `Filed: ${cache?.latestTenKDate || "date N/A"}` : "US-listed companies only",
      value: cache?.tenKSummary,
      status: resolveStatus(cache?.tenKSummary, isRefreshing, hasUS ? "limited" : "not_applicable"),
      unavailableReason: hasUS ? "10-K text extraction had limited coverage. Analysis uses XBRL data and general knowledge." : "Available for US-listed companies only. Analysis uses publicly available annual report equivalents.",
    },
    {
      icon: FileText,
      label: "SEC 10-Q Quarterly Report",
      sublabel: hasUS ? `Filed: ${cache?.latestTenQDate || "date N/A"}` : "US-listed companies only",
      value: cache?.tenQSummary,
      status: resolveStatus(cache?.tenQSummary, isRefreshing, hasUS ? "limited" : "not_applicable"),
      unavailableReason: hasUS ? "10-Q extraction had limited coverage. Quarterly analysis uses available data." : "Available for US-listed companies only. Analysis uses quarterly earnings releases.",
    },
    {
      icon: FileText,
      label: "SEC 8-K Material Events",
      sublabel: hasUS ? `Latest: ${cache?.latestEightKDate || "N/A"}` : "US-listed companies only",
      value: cache?.eightKSummary,
      status: resolveStatus(cache?.eightKSummary, isRefreshing, hasUS ? "limited" : "not_applicable"),
      unavailableReason: hasUS ? "8-K data from submission index. Full text extraction varies." : "Available for US-listed companies only. Material announcements sourced from news.",
    },
    {
      icon: DollarSign,
      label: "Revenue & Margin Trends",
      sublabel: "Multi-year trend analysis",
      value: cache?.revenueTrendSummary,
      status: resolveStatus(cache?.revenueTrendSummary, isRefreshing, "limited"),
      unavailableReason: "Revenue trend analysis uses available financial data and public disclosures.",
    },
    {
      icon: Activity,
      label: "Cash Flow & Balance Sheet",
      sublabel: "FCF quality, debt, liquidity",
      value: cache?.cashFlowSummary,
      status: resolveStatus(cache?.cashFlowSummary, isRefreshing, "limited"),
      unavailableReason: "Cash flow analysis uses available XBRL data and public disclosures.",
    },
    {
      icon: Mic,
      label: "Earnings Call Highlights",
      sublabel: "Management tone & guidance",
      value: cache?.earningsCallSummary,
      status: resolveStatus(cache?.earningsCallSummary, isRefreshing, "limited"),
      unavailableReason: "Limited availability depending on data coverage. Analysis uses reported earnings call commentary.",
    },
    {
      icon: AlertTriangle,
      label: "Red Flags & Risk Factors",
      sublabel: "Filing-based risk detection",
      value: cache?.redFlags,
      status: resolveStatus(cache?.redFlags, isRefreshing, "limited"),
      unavailableReason: "Risk factor analysis uses SEC filings when available, otherwise industry-standard framework.",
    },
    {
      icon: TrendingUp,
      label: "Management Tone",
      sublabel: cache?.managementTone ? `Assessed: ${cache.managementTone}` : "From filings & calls",
      value: cache?.managementDiscussionSummary,
      status: resolveStatus(cache?.managementDiscussionSummary, isRefreshing, "limited"),
      unavailableReason: "MD&A analysis uses available filing text and public management statements.",
    },
    {
      icon: Newspaper,
      label: "Press Releases & News",
      sublabel: "Recent announcements",
      value: cache?.pressReleaseSummary,
      status: resolveStatus(cache?.pressReleaseSummary, isRefreshing, "limited"),
      unavailableReason: "News sourced from Yahoo Finance. Coverage varies by company.",
    },
  ];

  const availableCount = sources.filter(s => s.status === "available").length;
  const limitedCount = sources.filter(s => s.status === "limited").length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-card border border-border rounded-xl shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Database className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">Research Sources</p>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-[11px] text-emerald-400 font-semibold">{availableCount} available</span>
              {limitedCount > 0 && (
                <span className="text-[11px] text-amber-400 font-semibold">{limitedCount} limited</span>
              )}
              {lastUpdated && (
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {lastUpdated}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Source health dots */}
          <div className="hidden sm:flex items-center gap-1">
            {sources.map((s, i) => (
              <div
                key={i}
                className={cn("h-2 w-2 rounded-full", {
                  "bg-emerald-400": s.status === "available",
                  "bg-amber-400": s.status === "limited" || s.status === "refreshing",
                  "bg-muted-foreground/20": s.status === "not_applicable",
                })}
              />
            ))}
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
              {isRefreshing ? "Refreshing…" : "Refresh Sources"}
            </Button>
          ) : (
            <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-1 rounded-full border border-border">
              Pro+ to refresh
            </span>
          )}
        </div>
      </div>

      {/* Source Grid */}
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {sources.map((src, i) => (
          <SourceCard
            key={src.label}
            delay={i * 0.04}
            {...src}
          />
        ))}
      </div>

      <div className="px-5 py-3 border-t border-border bg-muted/10">
        <p className="text-[10px] text-muted-foreground/50 text-center">
          SEC filings available for US-listed companies · Limited sources do not reduce analysis quality — AI uses financial reasoning to fill gaps
        </p>
      </div>
    </motion.div>
  );
}