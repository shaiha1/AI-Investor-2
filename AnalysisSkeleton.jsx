import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, BarChart2, Target, Sparkles } from "lucide-react";

const STEPS = [
  { icon: BarChart2, label: "Analyzing company fundamentals…" },
  { icon: Brain, label: "Evaluating valuation & sector peers…" },
  { icon: Target, label: "Generating price target…" },
  { icon: Sparkles, label: "Compiling research report…" },
];

export default function AnalysisSkeleton() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((s) => (s + 1) % STEPS.length);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  const { icon: Icon, label } = STEPS[step];

  return (
    <div className="space-y-4">
      {/* Animated status card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-primary/20 rounded-xl px-5 py-4 shadow-sm shadow-primary/5"
      >
        <div className="flex items-center gap-3">
          <div className="relative h-9 w-9 shrink-0">
            <div className="absolute inset-0 rounded-lg bg-primary/15 animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, scale: 0.7, rotate: -10 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.7, rotate: 10 }}
                  transition={{ duration: 0.25 }}
                >
                  <Icon className="h-4 w-4 text-primary" />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.p
                key={step}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.3 }}
                className="text-sm font-medium text-foreground"
              >
                {label}
              </motion.p>
            </AnimatePresence>
            {/* Progress bar */}
            <div className="mt-2 h-1 w-full bg-border rounded-full overflow-hidden">
              <motion.div
                key={step}
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 2.2, ease: "linear" }}
                className="h-full bg-primary rounded-full"
              />
            </div>
          </div>
        </div>
        {/* Step dots */}
        <div className="flex justify-center gap-1.5 mt-4">
          {STEPS.map((_, i) => (
            <motion.div
              key={i}
              animate={{ width: i === step ? 20 : 6, opacity: i === step ? 1 : 0.3 }}
              transition={{ duration: 0.3 }}
              className="h-1.5 rounded-full bg-primary"
            />
          ))}
        </div>
      </motion.div>

      {/* Skeleton cards */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1, duration: 0.4 }}
          className="bg-card border border-border rounded-xl p-5 space-y-3"
        >
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-muted rounded-lg animate-pulse" />
            <div className="h-4 bg-muted rounded w-36 animate-pulse" />
          </div>
          <div className="space-y-2 pt-1">
            {[100, 85, 72, 90].slice(0, i === 0 ? 2 : i === 1 ? 3 : 4).map((w, j) => (
              <div
                key={j}
                className="h-3 bg-muted rounded animate-pulse"
                style={{ width: `${w}%`, animationDelay: `${j * 150}ms` }}
              />
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}