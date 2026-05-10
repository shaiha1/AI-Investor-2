import React from "react";
import { motion } from "framer-motion";
import { Building2, TrendingUp, TrendingDown, Minus, DollarSign, BarChart3, Newspaper, AlertTriangle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const MOMENTUM_CONFIG = {
  bullish: { label: "Bullish", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", icon: TrendingUp },
  neutral: { label: "Neutral", color: "text-amber-400", bg: "bg-amber-400/10 border-amber-400/20", icon: Minus },
  bearish: { label: "Bearish", color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20", icon: TrendingDown },
  unknown: { label: "N/A", color: "text-muted-foreground", bg: "bg-secondary border-border", icon: Minus },
};

const SENTIMENT_CONFIG = {
  positive: { label: "Positive", color: "text-emerald-400", dot: "bg-emerald-400" },
  negative: { label: "Negative", color: "text-rose-400", dot: "bg-rose-400" },
  mixed: { label: "Mixed", color: "text-amber-400", dot: "bg-amber-400" },
  neutral: { label: "Neutral", color: "text-muted-foreground", dot: "bg-muted-foreground" },
};

const GROWTH_LABELS = {
  high_growth: "High Growth",
  moderate_growth: "Moderate Growth",
  stable: "Stable",
  declining: "Declining",
  unknown: "N/A",
};

const PROFIT_LABELS = {
  highly_profitable: "Highly Profitable",
  profitable: "Profitable",
  unprofitable: "Unprofitable",
  unknown: "N/A",
};

const VALUATION_LABELS = {
  expensive: "Expensive",
  fair_to_rich: "Fair to Rich",
  fair: "Fair",
  cheap: "Cheap",
  unknown: "N/A",
};

function Pill({ label, className }) {
  return (
    <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap", className)}>
      {label}
    </span>
  );
}

export default function CompanyContextCard({ stockData, newsData }) {
  if (!stockData) return null;

  const {
    companyName, ticker, sector, industry, marketCapLabel,
    growthProfile, profitabilityProfile, valuationLevel, momentum,
    trailingPE, eps, revenueGrowth, grossMargins, operatingMargins,
    fiftyTwoWeekHigh, fiftyTwoWeekLow, currentPrice, beta,
  } = stockData;

  const momentumCfg = MOMENTUM_CONFIG[momentum] || MOMENTUM_CONFIG.unknown;
  const MomentumIcon = momentumCfg.icon;
  const sentimentCfg = SENTIMENT_CONFIG[newsData?.sentiment] || SENTIMENT_CONFIG.neutral;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="bg-card border border-border rounded-xl overflow-hidden shadow-sm"
    >
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-border flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
          <Building2 className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground">{companyName}</p>
          <p className="text-[11px] text-muted-foreground">{sector}{industry ? ` · ${industry}` : ""}</p>
        </div>
        {/* Momentum badge */}
        <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold", momentumCfg.bg, momentumCfg.color)}>
          <MomentumIcon className="h-3.5 w-3.5" />
          {momentumCfg.label}
        </div>
      </div>

      <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Market Cap */}
        <div className="bg-muted/30 rounded-lg p-3 border border-border">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Market Cap</p>
          <p className="text-xs font-semibold text-foreground leading-tight">{marketCapLabel || "N/A"}</p>
        </div>

        {/* Growth */}
        <div className="bg-muted/30 rounded-lg p-3 border border-border">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Growth</p>
          <p className="text-xs font-semibold text-foreground">{GROWTH_LABELS[growthProfile] || "N/A"}</p>
          {revenueGrowth != null && (
            <p className={cn("text-[10px] mt-0.5", revenueGrowth >= 0 ? "text-emerald-400" : "text-rose-400")}>
              {revenueGrowth >= 0 ? "+" : ""}{(revenueGrowth * 100).toFixed(1)}% YoY
            </p>
          )}
        </div>

        {/* Profitability */}
        <div className="bg-muted/30 rounded-lg p-3 border border-border">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Profitability</p>
          <p className="text-xs font-semibold text-foreground">{PROFIT_LABELS[profitabilityProfile] || "N/A"}</p>
          {operatingMargins != null && (
            <p className={cn("text-[10px] mt-0.5", operatingMargins >= 0 ? "text-emerald-400" : "text-rose-400")}>
              {(operatingMargins * 100).toFixed(1)}% op. margin
            </p>
          )}
        </div>

        {/* Valuation */}
        <div className="bg-muted/30 rounded-lg p-3 border border-border">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Valuation</p>
          <p className="text-xs font-semibold text-foreground">{VALUATION_LABELS[valuationLevel] || "N/A"}</p>
          {trailingPE != null && (
            <p className="text-[10px] text-muted-foreground mt-0.5">{trailingPE.toFixed(1)}x P/E</p>
          )}
        </div>
      </div>

      {/* Key metrics row */}
      <div className="px-4 pb-3 flex flex-wrap gap-2">
        {eps != null && <Pill label={`EPS $${eps.toFixed(2)}`} className="bg-secondary border-border text-muted-foreground" />}
        {beta != null && <Pill label={`Beta ${beta.toFixed(2)}`} className="bg-secondary border-border text-muted-foreground" />}
        {fiftyTwoWeekHigh && fiftyTwoWeekLow && (
          <Pill label={`52W $${fiftyTwoWeekLow.toFixed(2)} – $${fiftyTwoWeekHigh.toFixed(2)}`} className="bg-secondary border-border text-muted-foreground" />
        )}
        {grossMargins != null && (
          <Pill label={`Gross Margin ${(grossMargins * 100).toFixed(1)}%`} className="bg-secondary border-border text-muted-foreground" />
        )}
      </div>

      {/* News sentiment */}
      {newsData && (newsData.themes?.length > 0 || newsData.majorEvent) && (
        <div className="border-t border-border px-4 py-3 space-y-2">
          <div className="flex items-center gap-2">
            <Newspaper className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Recent News</span>
            <span className={cn("text-[10px] font-bold ml-auto flex items-center gap-1", sentimentCfg.color)}>
              <span className={cn("h-1.5 w-1.5 rounded-full inline-block", sentimentCfg.dot)} />
              {sentimentCfg.label} Sentiment
            </span>
          </div>
          {newsData.majorEvent && (
            <p className="text-xs text-foreground/80 font-medium">📌 {newsData.majorEvent}</p>
          )}
          {newsData.themes?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {newsData.themes.map((theme, i) => (
                <Pill key={i} label={theme} className="bg-primary/8 border-primary/20 text-primary/80" />
              ))}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}