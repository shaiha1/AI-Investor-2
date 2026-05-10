import React from "react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { Zap, ShoppingCart } from "lucide-react";

export default function UsageBadge({ creditsBalance = 0 }) {
  const isOut = creditsBalance <= 0;
  const isLow = creditsBalance > 0 && creditsBalance <= 5;

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold",
          isOut
            ? "bg-rose-500/10 border-rose-500/25 text-rose-400"
            : isLow
            ? "bg-amber-400/10 border-amber-400/25 text-amber-400"
            : "bg-primary/10 border-primary/25 text-primary"
        )}
        title={`${creditsBalance} credits available`}
      >
        <Zap className="h-3 w-3" />
        <span className="font-mono tabular-nums">{creditsBalance}</span>
        <span className="hidden sm:inline">credits</span>
      </div>
      <Link to="/pricing">
        <button
          className={cn(
            "hidden sm:inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border transition-colors",
            isOut || isLow
              ? "bg-amber-400/10 border-amber-400/30 text-amber-400 hover:bg-amber-400/20"
              : "bg-secondary border-border text-foreground/80 hover:bg-secondary/80"
          )}
        >
          <ShoppingCart className="h-3 w-3" />
          Buy Credits
        </button>
      </Link>
    </div>
  );
}