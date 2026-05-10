import React from "react";
import { motion } from "framer-motion";
import { Target, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCountUp } from "@/hooks/useCountUp";

export default function PriceTargetCard({ priceTarget, currentPrice, updownPct, timeframe, rationale }) {
  const animatedTarget = useCountUp(typeof priceTarget === "number" ? priceTarget : 0, 1200, 2);
  const animatedCurrent = useCountUp(typeof currentPrice === "number" ? currentPrice : 0, 900, 2);
  const animatedPct = useCountUp(typeof updownPct === "number" ? Math.abs(updownPct) : 0, 1000, 1);

  if (!priceTarget) return null;

  const isUpside = updownPct >= 0;
  const colorClass = isUpside ? "text-emerald-400" : "text-rose-400";
  const bgClass = isUpside ? "bg-emerald-500/8 border-emerald-500/20" : "bg-rose-500/8 border-rose-500/20";
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
          className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold", isUpside ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400")}
        >
          {isUpside ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
          {isUpside ? "+" : "-"}{animatedPct.toFixed(1)}%
        </motion.div>
      </div>

      {/* Price row */}
      <div className="flex items-end gap-6 mb-4">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-1">Target Price</p>
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
              <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-1">Current Price</p>
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

      {/* Rationale */}
      {rationale && rationale.length > 0 && (
        <div className="border-t border-border/40 pt-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Rationale</p>
          <ul className="space-y-1.5">
            {rationale.map((point, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.3 }}
                className="flex items-start gap-2 text-xs text-foreground/70 leading-relaxed"
              >
                <span className={cn("mt-1.5 h-1 w-1 rounded-full shrink-0", isUpside ? "bg-emerald-400" : "bg-rose-400")} />
                {point}
              </motion.li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
}