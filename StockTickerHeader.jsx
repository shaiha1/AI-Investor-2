/**
 * StockTickerHeader.jsx
 * Sticky header that appears after a stock is analyzed.
 * Shows: ticker, company name, live price, day change, key stats,
 * Buy/Hold/Sell badge, price target, and quick actions.
 *
 * Finance design convention: always-visible price bar at the top,
 * similar to Yahoo Finance / Bloomberg terminal top strip.
 */

import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, RefreshCw, Plus, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const recColors = {
  Buy: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  Hold: "bg-amber-400/20 text-amber-400 border-amber-400/30",
  Sell: "bg-rose-500/20 text-rose-400 border-rose-500/30",
};

export default function StockTickerHeader({
  stockData,
  result,
  onNewAnalysis,
  onRefresh,
  isRefreshing,
}) {
  if (!stockData || !result) return null;

  const isUp = (stockData.priceChange ?? 0) >= 0;
  const isUpside = result.updownPct >= 0;
  const changeColor = isUp ? "text-emerald-400" : "text-rose-400";

  const stats = [
    stockData.marketCap
      ? { label: "Mkt Cap", value: `$${(stockData.marketCap / 1e9).toFixed(1)}B` }
      : null,
    stockData.peRatio ? { label: "P/E", value: stockData.peRatio.toFixed(1) } : null,
    stockData.fiftyTwoWeekHigh && stockData.fiftyTwoWeekLow
      ? {
          label: "52W",
          value: `$${stockData.fiftyTwoWeekLow.toFixed(0)}–$${stockData.fiftyTwoWeekHigh.toFixed(0)}`,
        }
      : null,
    stockData.volume
      ? {
          label: "Vol",
          value:
            stockData.volume >= 1e6
              ? `${(stockData.volume / 1e6).toFixed(1)}M`
              : `${(stockData.volume / 1e3).toFixed(0)}K`,
        }
      : null,
  ].filter(Boolean);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="shrink-0 border-b border-border bg-card/95 backdrop-blur-md z-10 px-4 py-2"
    >
      <div className="max-w-6xl mx-auto flex items-center gap-4 flex-wrap">
        {/* Back */}
        <button
          onClick={onNewAnalysis}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          New
        </button>

        <div className="h-4 w-px bg-border" />

        {/* Ticker + name */}
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-bold text-foreground font-mono">
            {stockData.ticker}
          </span>
          {stockData.companyName && (
            <span className="text-xs text-muted-foreground hidden sm:inline truncate max-w-[160px]">
              {stockData.companyName}
            </span>
          )}
        </div>

        {/* Price + change */}
        <div className="flex items-baseline gap-2">
          <span className="text-base font-bold font-mono text-foreground">
            ${stockData.currentPrice?.toFixed(2)}
          </span>
          <span className={cn("text-xs font-medium flex items-center gap-0.5", changeColor)}>
            {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {isUp ? "+" : ""}
            {(stockData.priceChange ?? 0).toFixed(2)} ({isUp ? "+" : ""}
            {(stockData.percentChange ?? 0).toFixed(2)}%)
          </span>
        </div>

        <div className="h-4 w-px bg-border hidden sm:block" />

        {/* Key stats */}
        <div className="flex items-center gap-3 hidden sm:flex">
          {stats.map((s) => (
            <div key={s.label} className="flex items-baseline gap-1">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                {s.label}
              </span>
              <span className="text-xs font-medium text-foreground/80 font-mono">{s.value}</span>
            </div>
          ))}
        </div>

        <div className="flex-1" />

        {/* Rating + target */}
        <div className="flex items-center gap-2">
          {result.recommendation && (
            <span
              className={cn(
                "text-xs font-bold px-2 py-0.5 rounded border",
                recColors[result.recommendation]
              )}
            >
              {result.recommendation}
            </span>
          )}
          {result.priceTarget && (
            <div className="flex items-baseline gap-1">
              <span className="text-[10px] text-muted-foreground">Target</span>
              <span
                className={cn(
                  "text-xs font-bold font-mono",
                  isUpside ? "text-emerald-400" : "text-rose-400"
                )}
              >
                ${result.priceTarget}
                <span className="font-normal ml-1">
                  ({isUpside ? "+" : ""}
                  {result.updownPct?.toFixed(1)}%)
                </span>
              </span>
            </div>
          )}
        </div>

        {/* Refresh */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="h-6 w-6 p-0"
        >
          <RefreshCw className={cn("h-3 w-3", isRefreshing && "animate-spin")} />
        </Button>
      </div>
    </motion.div>
  );
}
