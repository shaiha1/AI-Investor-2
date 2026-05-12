/**
 * SummaryCard.jsx — UPDATED
 *
 * Changes:
 * - Confidence now rendered as a radial arc gauge (SVG)
 *   instead of a plain badge — reads much more intuitively
 * - Overall layout tightened to feel more like a Bloomberg terminal card
 */

import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, MinusCircle, Clock, Quote } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Radial Confidence Gauge ──────────────────────────────────────────────────

function ConfidenceGauge({ confidence }) {
  const levels = { High: 85, Medium: 55, Low: 25 };
  const score = levels[confidence] ?? 55;

  // Arc parameters
  const r = 22;
  const cx = 28;
  const cy = 28;
  const circumference = Math.PI * r; // half-circle arc
  const dashOffset = circumference * (1 - score / 100);

  const arcColor =
    confidence === "High"
      ? "#34d399" // emerald-400
      : confidence === "Low"
      ? "#f87171" // rose-400
      : "#fbbf24"; // amber-400

  const textColor =
    confidence === "High"
      ? "text-emerald-400"
      : confidence === "Low"
      ? "text-rose-400"
      : "text-amber-400";

  return (
    <div className="flex flex-col items-center gap-0.5">
      <svg width="56" height="34" viewBox="0 0 56 34">
        {/* Background arc */}
        <path
          d={`M 6 28 A ${r} ${r} 0 0 1 50 28`}
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
          className="text-border/60"
        />
        {/* Foreground arc */}
        <motion.path
          d={`M 6 28 A ${r} ${r} 0 0 1 50 28`}
          fill="none"
          stroke={arcColor}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 0.9, ease: "easeOut", delay: 0.3 }}
        />
      </svg>
      <span className={cn("text-[9px] font-bold uppercase tracking-wide", textColor)}>
        {confidence}
      </span>
      <span className="text-[8px] text-muted-foreground">Confidence</span>
    </div>
  );
}

// ─── Rec config ───────────────────────────────────────────────────────────────

const recConfig = {
  Buy: {
    icon: TrendingUp,
    badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  },
  Hold: {
    icon: MinusCircle,
    badge: "bg-amber-400/15 text-amber-400 border-amber-400/25",
  },
  Sell: {
    icon: TrendingDown,
    badge: "bg-rose-500/15 text-rose-400 border-rose-500/25",
  },
};

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function SummaryCard({ recommendation, confidence, timeframe, thesis }) {
  const rec = recConfig[recommendation] || recConfig.Hold;
  const RecIcon = rec.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut", delay: 0.1 }}
      className="bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300"
    >
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
        Quick Summary
      </p>

      <div className="flex items-start gap-4">
        {/* Left: rec + timeframe */}
        <div className="flex flex-col gap-2 flex-1">
          <div className="flex flex-wrap gap-2">
            {/* Recommendation */}
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.3, type: "spring", stiffness: 200 }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-bold",
                rec.badge
              )}
            >
              <RecIcon className="h-3.5 w-3.5" />
              {recommendation}
            </motion.div>

            {/* Timeframe */}
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.28, duration: 0.3, type: "spring", stiffness: 200 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-secondary text-xs font-medium text-muted-foreground"
            >
              <Clock className="h-3.5 w-3.5" />
              {timeframe}
            </motion.div>
          </div>

          {thesis && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45, duration: 0.4 }}
              className="flex items-start gap-2 bg-muted/50 rounded-lg px-3 py-2.5"
            >
              <Quote className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
              <p className="text-sm text-foreground/75 leading-relaxed italic">{thesis}</p>
            </motion.div>
          )}
        </div>

        {/* Right: confidence gauge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          className="shrink-0"
        >
          <ConfidenceGauge confidence={confidence} />
        </motion.div>
      </div>
    </motion.div>
  );
}
