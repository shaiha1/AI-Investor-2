import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const SCENARIOS = [
  "Inflation rate increases",
  "Inflation rate decreases",
  "Fed interest rate increases",
  "Fed interest rate decreases",
  "AI adoption accelerates",
  "AI disruption risk increases",
  "Oil prices increase",
  "Oil prices decrease",
  "Recession risk increases",
  "Consumer demand weakens",
  "Strong economic growth",
  "USD strengthens",
  "USD weakens",
  "Regulation risk increases",
  "Geopolitical risk increases",
];

export default function ScenarioInputs({ selectedScenarios, setSelectedScenarios, customThesis, setCustomThesis }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = (s) => {
    setSelectedScenarios((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Scenario &amp; Thesis Assumptions</h3>
      </div>

      {/* Multi-select dropdown */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Market Scenario</label>
        <div className="relative" ref={ref}>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="w-full h-10 px-3 flex items-center justify-between gap-2 rounded-lg border border-input bg-background text-sm text-left hover:bg-accent transition-colors"
          >
            <span className={cn("truncate", selectedScenarios.length === 0 && "text-muted-foreground")}>
              {selectedScenarios.length === 0
                ? "Select macro scenarios…"
                : `${selectedScenarios.length} scenario${selectedScenarios.length > 1 ? "s" : ""} selected`}
            </span>
            <ChevronDown className={cn("h-4 w-4 text-muted-foreground shrink-0 transition-transform", open && "rotate-180")} />
          </button>

          {open && (
            <div className="absolute z-50 mt-1 w-full bg-popover border border-border rounded-xl shadow-xl py-1 max-h-56 overflow-y-auto">
              {SCENARIOS.map((s) => {
                const active = selectedScenarios.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggle(s)}
                    className={cn(
                      "w-full text-left px-3 py-2 text-sm flex items-center gap-2.5 hover:bg-accent transition-colors",
                      active && "text-primary"
                    )}
                  >
                    <span className={cn("h-4 w-4 rounded border flex items-center justify-center shrink-0 text-[10px] font-bold",
                      active ? "bg-primary border-primary text-primary-foreground" : "border-border"
                    )}>
                      {active && "✓"}
                    </span>
                    {s}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Chips */}
        {selectedScenarios.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {selectedScenarios.map((s) => (
              <span key={s} className="inline-flex items-center gap-1 bg-primary/10 text-primary border border-primary/20 text-xs px-2 py-0.5 rounded-full">
                {s}
                <button type="button" onClick={() => toggle(s)} className="hover:text-primary/60">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Custom thesis */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Custom Scenario or Thesis</label>
        <textarea
          value={customThesis}
          onChange={(e) => setCustomThesis(e.target.value)}
          rows={2}
          placeholder="Example: I believe Nvidia will benefit from stronger AI data center demand over the next 12 months."
          className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition"
        />
      </div>
    </div>
  );
}