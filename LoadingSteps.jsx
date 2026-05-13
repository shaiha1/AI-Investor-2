import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Loader2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: "market",     label: "Fetching live price & market data",        sub: "Finnhub · Yahoo Finance" },
  { id: "cache",      label: "Loading institutional research cache",      sub: "SEC · FMP · Finnhub" },
  { id: "applying",   label: "Applying filings & earnings context",       sub: "10-K · 10-Q · Transcripts" },
  { id: "generating", label: "Generating analyst report",                 sub: "AI model · structured output" },
];

const REFRESH_STEP = {
  id: "refreshing",
  label: "Refreshing deep research sources",
  sub: "SEC EDGAR · FMP · earnings data",
};

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
            <div key={step.id} className="flex items-start gap-3">
              <div className="shrink-0 h-5 w-5 flex items-center justify-center mt-0.5">
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
                <div>
                  <span className={cn(
                    "text-sm transition-colors",
                    isDone && "text-muted-foreground line-through",
                    isActive && (step.id === "refreshing" ? "text-amber-400 font-medium" : "text-foreground font-medium"),
                    isPending && "text-muted-foreground/40"
                  )}>
                    {step.label}
                  </span>
                  {isActive && step.sub && (
                    <p className={cn(
                      "text-[10px] mt-0.5",
                      step.id === "refreshing" ? "text-amber-400/60" : "text-muted-foreground/50"
                    )}>
                      {step.sub}
                      {step.id === "refreshing" && " — this may take a moment"}
                    </p>
                  )}
                </div>
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
