import React from "react";
import { TrendingUp, TrendingDown, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

function formatMarketCap(value) {
  if (!value) return "N/A";
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  return `$${value.toLocaleString()}`;
}

export default function StockSummaryBar({ stockData, isLoading, error }) {
  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-xl px-5 py-3.5 flex items-center gap-3 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span className="text-sm">Fetching live market data…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card border border-amber-500/20 rounded-xl px-5 py-3.5 flex items-center gap-3">
        <AlertCircle className="h-4 w-4 shrink-0 text-amber-400" />
        <span className="text-sm text-amber-400">Market data is temporarily unavailable.</span>
      </div>
    );
  }

  if (!stockData) return null;

  const { ticker, companyName, currentPrice, priceChange, percentChange, marketCap, currency } = stockData;

  const hasChange = priceChange != null && percentChange != null;
  const isPositive = hasChange ? percentChange >= 0 : null;

  const changeColor = isPositive === null
    ? "text-muted-foreground"
    : isPositive
    ? "text-emerald-400"
    : "text-rose-400";

  const changeBg = isPositive === null
    ? "bg-secondary text-muted-foreground"
    : isPositive
    ? "bg-emerald-500/10 text-emerald-400"
    : "bg-rose-500/10 text-rose-400";

  return (
    <div className="bg-card border border-border rounded-xl px-5 py-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Left: ticker + name */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-primary">{ticker?.slice(0, 2)}</span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">{ticker}</p>
            <p className="text-sm font-semibold text-foreground truncate">{companyName}</p>
          </div>
        </div>

        {/* Center: price + change */}
        <div className="flex items-baseline gap-3">
          <span className="text-2xl font-bold font-mono text-foreground">
            {currency && currency !== 'USD' ? currency + ' ' : '$'}{currentPrice?.toFixed(2) ?? '—'}
          </span>
          {hasChange && (
            <>
              <div className={cn("flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold", changeBg)}>
                {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {isPositive ? "+" : ""}{percentChange.toFixed(2)}%
              </div>
              <span className={cn("text-sm font-mono", changeColor)}>
                {isPositive ? "+" : ""}${priceChange.toFixed(2)}
              </span>
            </>
          )}
        </div>

        {/* Right: stats */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Mkt Cap</p>
            <p className="text-xs font-semibold text-foreground">{formatMarketCap(marketCap)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}