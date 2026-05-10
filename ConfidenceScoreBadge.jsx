import React from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Shield, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

function getTier(score) {
  if (score >= 90) return { label: "Excellent", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", icon: ShieldCheck };
  if (score >= 70) return { label: "Strong", color: "text-primary", bg: "bg-primary/10", border: "border-primary/30", icon: ShieldCheck };
  if (score >= 50) return { label: "Moderate", color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/30", icon: Shield };
  return { label: "Limited", color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/30", icon: ShieldAlert };
}

export default function ConfidenceScoreBadge({ score = 0, size = "md" }) {
  const tier = getTier(score);
  const Icon = tier.icon;
  const isLg = size === "lg";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border",
        tier.bg, tier.border,
        isLg ? "px-3.5 py-2" : "px-2.5 py-1"
      )}
    >
      <Icon className={cn(tier.color, isLg ? "h-4 w-4" : "h-3.5 w-3.5")} />
      <div className="flex items-baseline gap-1.5">
        <span className={cn("font-bold tabular-nums", tier.color, isLg ? "text-base" : "text-xs")}>
          {score}
        </span>
        <span className={cn("text-muted-foreground", isLg ? "text-xs" : "text-[10px]")}>
          /100
        </span>
        <span className={cn("font-semibold uppercase tracking-wide", tier.color, isLg ? "text-[10px]" : "text-[9px]")}>
          · {tier.label}
        </span>
      </div>
    </motion.div>
  );
}