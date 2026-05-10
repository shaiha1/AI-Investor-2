import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, MinusCircle, ShieldCheck, Clock, Quote } from "lucide-react";
import { cn } from "@/lib/utils";

const recConfig = {
  Buy: {
    icon: TrendingUp,
    badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
    bar: "bg-emerald-500",
  },
  Hold: {
    icon: MinusCircle,
    badge: "bg-amber-400/15 text-amber-400 border-amber-400/25",
    bar: "bg-amber-400",
  },
  Sell: {
    icon: TrendingDown,
    badge: "bg-rose-500/15 text-rose-400 border-rose-500/25",
    bar: "bg-rose-500",
  },
};

const confidenceConfig = {
  High: { color: "text-emerald-400", bg: "bg-emerald-500/15 border-emerald-500/25" },
  Medium: { color: "text-amber-400", bg: "bg-amber-400/15 border-amber-400/25" },
  Low: { color: "text-rose-400", bg: "bg-rose-500/15 border-rose-500/25" },
};

export default function SummaryCard({ recommendation, confidence, timeframe, thesis }) {
  const rec = recConfig[recommendation] || recConfig.Hold;
  const RecIcon = rec.icon;
  const conf = confidenceConfig[confidence] || confidenceConfig.Medium;

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

      <div className="flex flex-wrap gap-2 mb-4">
        {/* Recommendation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.3, type: "spring", stiffness: 200 }}
          className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-bold", rec.badge)}
        >
          <RecIcon className="h-3.5 w-3.5" />
          {recommendation}
        </motion.div>

        {/* Confidence */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.28, duration: 0.3, type: "spring", stiffness: 200 }}
          className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium", conf.bg)}
        >
          <ShieldCheck className={cn("h-3.5 w-3.5", conf.color)} />
          <span className="text-muted-foreground">Confidence:</span>
          <span className={cn("font-bold", conf.color)}>{confidence}</span>
        </motion.div>

        {/* Timeframe */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.36, duration: 0.3, type: "spring", stiffness: 200 }}
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
    </motion.div>
  );
}