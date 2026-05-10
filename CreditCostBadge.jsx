import React from "react";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CreditCostBadge({ cost, label, className }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border",
      "bg-primary/10 text-primary border-primary/20",
      className
    )}>
      <Zap className="h-2.5 w-2.5" />
      {cost} credit{cost !== 1 ? "s" : ""}
      {label && <span className="text-primary/70 font-normal">· {label}</span>}
    </span>
  );
}