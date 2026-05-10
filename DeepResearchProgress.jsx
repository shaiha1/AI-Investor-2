import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Mic, Newspaper, Brain, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { key: "sec", icon: FileText, label: "Fetching SEC filings…", sublabel: "10-K, 10-Q, 8-K from EDGAR" },
  { key: "earnings", icon: Mic, label: "Analyzing earnings calls…", sublabel: "Management commentary & guidance" },
  { key: "news", icon: Newspaper, label: "Processing press releases…", sublabel: "Recent announcements & news" },
  { key: "ai", icon: Brain, label: "Generating deep analysis…", sublabel: "AI synthesizing all documents" },
];

export default function DeepResearchProgress({ currentStep }) {
  const currentIdx = STEPS.findIndex(s => s.key === currentStep);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-primary/20 rounded-2xl p-6 shadow-lg shadow-primary/5"
    >
      <div className="flex items-center gap-2 mb-5">
        <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
        <span className="text-sm font-semibold text-primary">Deep Research Mode Active</span>
      </div>

      <div className="space-y-3">
        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isDone = idx < currentIdx;
          const isActive = idx === currentIdx;
          const isPending = idx > currentIdx;

          return (
            <div key={step.key} className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300",
              isActive && "bg-primary/10 border border-primary/20",
              isDone && "opacity-60",
              isPending && "opacity-30",
            )}>
              <div className={cn(
                "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                isActive && "bg-primary/20",
                isDone && "bg-emerald-500/15",
                isPending && "bg-secondary",
              )}>
                {isDone
                  ? <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  : isActive
                  ? <Loader2 className="h-4 w-4 text-primary animate-spin" />
                  : <Icon className="h-4 w-4 text-muted-foreground" />
                }
              </div>
              <div className="min-w-0">
                <p className={cn("text-sm font-medium", isActive ? "text-foreground" : "text-muted-foreground")}>
                  {step.label}
                </p>
                <p className="text-xs text-muted-foreground/70">{step.sublabel}</p>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}