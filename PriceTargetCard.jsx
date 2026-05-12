/**
 * PriceTargetCard.jsx — UPDATED
 *
 * Changes:
 * - Added Bull / Base / Bear scenario range bar (the most distinctively
 *   "institutional" UI element in analyst tools — Bloomberg/Seeking Alpha style)
 * - Current price marker shown on the range bar
 * - Scenario table below the bar
 * - Original animated price display preserved
 */

import React from "react";
import { motion } from "framer-motion";
import { Target, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCountUp } from "@/hooks/useCountUp";

// ─── Scenario Range Bar ────────────────────────────────────────────────────────

function ScenarioRangeBar({ bearCase, baseCase, bullCase, currentPrice }) {
  if (!bearCase || !baseCase || !bullCase || !currentPrice) return null;

  // Calculate positions as percentages along the bar
  const min = Math.min(bearCase, currentPrice) * 0.97;
  const max = Math.max(bullCase, currentPrice) * 1.03;
  const range = max - min;

  const pct = (val) => ((val - min) / range) * 100;

  const bearPct = pct(bearCase);
  const basePct = pct(baseCase);
  const bullPct = pct(bullCase);
  const currentPct = pct(currentPrice);

  const isUpside = baseCase >= currentPrice;

  return (
    <div className="mb-4">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
        Scenario Range
      </p>

      {/* Range bar */}
      <div className="relative h-2 rounded-full bg-border/60 mb-6">
        {/* Colored fill from bear to bull */}
        <div
          className="absolute h-full rounded-full bg-gradient-to-r from-rose-500/40 via-amber-400/40 to-emerald-500/40"
          style={{ left: `${bearPct}%`, width: `${bullPct - bearPct}%` }}
        />

        {/* Bear marker */}
        <div
          className="absolute -top-1 flex flex-col items-center"
          style={{ left: `${bearPct}%`, transform: "translateX(-50%)" }}
        >
          <div className="h-4 w-1.5 rounded-sm bg-rose-500" />
          <span className="text-[9px] text-rose-400 font-mono mt-1 whitespace-nowrap">
            ${bearCase}
          </span>
          <span className="text-[8px] text-muted-foreground whitespace-nowrap">Bear</span>
        </div>

        {/* Base marker */}
        <div
          className="absolute -top-1 flex flex-col items-center z-10"
          style={{ left: `${basePct}%`, transform: "translateX(-50%)" }}
        >
          <div className="h-4 w-2 rounded-sm bg-amber-400" />
          <span className="text-[9px] text-amber-400 font-mono mt-1 whitespace-nowrap font-bold">
            ${baseCase}
          </span>
          <span className="text-[8px] text-muted-foreground whitespace-nowrap">Base</span>
        </div>

        {/* Bull marker */}
        <div
          className="absolute -top-1 flex flex-col items-center"
          style={{ left: `${bullPct}%`, transform: "translateX(-50%)" }}
        >
          <div className="h-4 w-1.5 rounded-sm bg-emerald-500" />
          <span className="text-[9px] text-emerald-400 font-mono mt-1 whitespace-nowrap">
            ${bullCase}
          </span>
          <span className="text-[8px] text-muted-foreground whitespace-nowrap">Bull</span>
        </div>

        {/* Current price marker */}
        <div
          className="absolute -top-2.5 flex flex-col items-center z-20"
          style={{ left: `${currentPct}%`, transform: "translateX(-50%)" }}
        >
          <div className="h-7 w-0.5 bg-foreground/60" />
          <div className="text-[8px] text-foreground/60 font-mono whitespace-nowrap mt-0.5">
            Now
          </div>
        </div>
      </div>

      {/* Scenario table */}
      <div className="grid grid-cols-3 gap-2 mt-2">
        {[
          { label: "🔴 Bear", value: bearCase, weight: "25%", color: "text-rose-400" },
          { label: "⚪ Base", value: baseCase, weight: "50%", color: "text-amber-400" },
          { label: "🟢 Bull", value: bullCase, weight: "25%", color: "text-emerald-400" },
        ].map((s) => {
          const updown = ((s.value - currentPrice) / currentPrice) * 100;
          return (
            <div
              key={s.label}
              className="bg-muted/30 rounded-lg p-2 text-center border border-border/50"
            >
              <p className="text-[9px] text-muted-foreground mb-0.5">{s.label}</p>
              <p className={cn("text-sm font-bold font-mono", s.color)}>${s.value}</p>
              <p className={cn("text-[9px] font-medium", s.color)}>
                {updown >= 0 ? "+" : ""}
                {updown.toFixed(1)}%
              </p>
              <p className="text-[8px] text-muted-foreground mt-0.5">{s.weight} weight</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function PriceTargetCard({
  priceTarget,
  currentPrice,
  updownPct,
  timeframe,
  rationale,
  bearCaseTarget,
  baseCaseTarget,
  bullCaseTarget,
}) {
  const animatedTarget = useCountUp(typeof priceTarget === "number" ? priceTarget : 0, 1200, 2);
  const animatedCurrent = useCountUp(typeof currentPrice === "number" ? currentPrice : 0, 900, 2);
  const animatedPct = useCountUp(typeof updownPct === "number" ? Math.abs(updownPct) : 0, 1000, 1);

  if (!priceTarget) return null;

  const isUpside = updownPct >= 0;
  const colorClass = isUpside ? "text-emerald-400" : "text-rose-400";
  const bgClass = isUpside
    ? "bg-emerald-500/8 border-emerald-500/20"
    : "bg-rose-500/8 border-rose-500/20";
  const iconBg = isUpside ? "bg-emerald-500/15" : "bg-rose-500/15";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className={cn("rounded-xl border p-5 hover:shadow-lg transition-shadow duration-300", bgClass)}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", iconBg)}>
            <Target className={cn("h-4 w-4", colorClass)} />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Price Target</p>
            <p className="text-xs text-muted-foreground">{timeframe}</p>
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.35, type: "spring", stiffness: 200 }}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold",
            isUpside
              ? "bg-emerald-500/15 text-emerald-400"
              : "bg-rose-500/15 text-rose-400"
          )}
        >
          {isUpside ? (
            <TrendingUp className="h-3.5 w-3.5" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5" />
          )}
          {isUpside ? "+" : "-"}
          {animatedPct.toFixed(1)}%
        </motion.div>
      </div>

      {/* Weighted price row */}
      <div className="flex items-end gap-6 mb-5">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-1">
            Weighted Target
          </p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className={cn("text-4xl font-bold font-mono tracking-tight", colorClass)}
          >
            ${animatedTarget.toFixed(2)}
          </motion.p>
        </div>
        {currentPrice && (
          <>
            <div className="h-10 w-px bg-border/60 mb-1" />
            <div>
              <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-1">
                Current Price
              </p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15, duration: 0.4 }}
                className="text-2xl font-semibold font-mono text-foreground/80"
              >
                ${animatedCurrent.toFixed(2)}
              </motion.p>
            </div>
          </>
        )}
      </div>

      {/* Bull / Base / Bear range bar */}
      {bearCaseTarget && baseCaseTarget && bullCaseTarget && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <ScenarioRangeBar
            bearCase={bearCaseTarget}
            baseCase={baseCaseTarget}
            bullCase={bullCaseTarget}
            currentPrice={currentPrice}
          />
        </motion.div>
      )}

      {/* Rationale */}
      {rationale && rationale.length > 0 && (
        <div className="border-t border-border/40 pt-3 mt-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
            Rationale
          </p>
          <ul className="space-y-1.5">
            {rationale.map((point, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.1, duration: 0.3 }}
                className="flex items-start gap-2 text-xs text-foreground/70 leading-relaxed"
              >
                <span
                  className={cn(
                    "mt-1.5 h-1 w-1 rounded-full shrink-0",
                    isUpside ? "bg-emerald-400" : "bg-rose-400"
                  )}
                />
                {point}
              </motion.li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
}
