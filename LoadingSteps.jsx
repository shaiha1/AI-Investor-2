import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Loader2, Circle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: "market", label: "Loading market data" },
  { id: "cache", label: "Checking research cache" },
  { id: "applying", label: "Applying company research" },
  { id: "generating", label: "Generating analyst report" },
];

// Optionally show a 5th step only when refreshing cache
const REFRESH_STEP = { id: "refreshing", label: "Refreshing deep research sources" };

export default function LoadingSteps({ currentStep, isRefreshingCache }) {
  const steps = isRefreshingCache
    ? [STEPS[0], STEPS[1], REFRESH_STEP, STEPS[2], STEPS[3]]
    : STEPS;

  const currentIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-primary/20 rounded-xl px-5 py-5 shadow-sm"
    >
      <div className="space-y-3">
        {steps.map((step, idx) => {
          const isDone = idx < currentIndex;
          const isActive = idx === currentIndex;
          const isPending = idx > currentIndex;

          return (
            <div key={step.id} className="flex items-center gap-3">
              <div className="shrink-0 h-5 w-5 flex items-center justify-center">
                {isDone && <CheckCircle2 className="h-5 w-5 text-emerald-400" />}
                {isActive && (
                  <Loader2 className={cn(
                    "h-5 w-5 animate-spin",
                    step.id === "refreshing" ? "text-amber-400" : "text-primary"
                  )} />
                )}
                {isPending && <Circle className="h-4 w-4 text-muted-foreground/30" />}
              </div>
              <AnimatePresence mode="wait">
                <span className={cn(
                  "text-sm transition-colors",
                  isDone && "text-muted-foreground line-through",
                  isActive && (step.id === "refreshing" ? "text-amber-400 font-medium" : "text-foreground font-medium"),
                  isPending && "text-muted-foreground/40"
                )}>
                  {step.label}
                  {step.id === "refreshing" && isActive && (
                    <span className="ml-2 text-xs text-amber-400/70">(this may take a moment)</span>
                  )}
                </span>
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}