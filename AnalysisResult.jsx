/**
 * AnalysisResult.jsx — UPDATED
 *
 * Changes:
 * - Added tabbed section navigation above the report
 * - Sections: Summary | Fundamentals | Price Target | Technicals | Risks | Catalysts
 * - Each tab scrolls to the matching heading inside the ReactMarkdown report
 * - SummaryCard moved here for a single cohesive result component
 * - priceTarget / updownPct now shown inline in the header area
 */

import React, { useState, useRef, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, ChevronDown } from "lucide-react";
import SummaryCard from "./SummaryCard";
import { cn } from "@/lib/utils";

// ─── Section tab definitions ──────────────────────────────────────────────────
// Each entry maps to a heading fragment that appears in the AI-generated markdown.

const TABS = [
  { id: "summary",       label: "Summary",       heading: "Executive Summary" },
  { id: "fundamentals",  label: "Fundamentals",  heading: "Fundamental Analysis" },
  { id: "price-target",  label: "Price Target",  heading: "Price Target Analysis" },
  { id: "technicals",    label: "Technicals",    heading: "Technical Validation" },
  { id: "risks",         label: "Risks",         heading: "Red Flags" },
  { id: "catalysts",     label: "Catalysts",     heading: "Catalyst Watch" },
];

// ─── Main Component ────────────────────────────────────────────────────────────

export default function AnalysisResult({ result, stockData, newsData }) {
  const [activeTab, setActiveTab] = useState("summary");
  const reportRef = useRef(null);

  const { recommendation, confidence, timeframe, thesis, report } = result || {};

  const scrollToSection = useCallback((heading) => {
    if (!reportRef.current) return;
    // Find all h2/h3 elements inside the prose div
    const headings = reportRef.current.querySelectorAll("h1,h2,h3,h4");
    for (const el of headings) {
      if (el.textContent.toLowerCase().includes(heading.toLowerCase())) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }
  }, []);

  const handleTabClick = useCallback(
    (tab) => {
      setActiveTab(tab.id);
      // Small delay so the tab UI updates first, then scroll
      setTimeout(() => scrollToSection(tab.heading), 50);
    },
    [scrollToSection]
  );

  if (!result) return null;

  return (
    <div className="space-y-4">
      {/* Quick summary card */}
      <SummaryCard
        recommendation={recommendation}
        confidence={confidence}
        timeframe={timeframe}
        thesis={thesis}
      />

      {/* Full report card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.25 }}
        className="bg-card border border-border rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300"
      >
        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="px-5 py-3.5 border-b border-border flex items-center gap-2.5">
          <FileText className="h-4 w-4 text-primary" />
          <div>
            <p className="text-sm font-semibold text-foreground">Equity Research Report</p>
            <p className="text-[11px] text-muted-foreground">
              AI-generated · for informational purposes only
            </p>
          </div>
        </div>

        {/* ── Section Tabs ─────────────────────────────────────────────── */}
        <div className="border-b border-border overflow-x-auto">
          <div className="flex px-2 min-w-max">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab)}
                className={cn(
                  "px-3 py-2.5 text-xs font-medium whitespace-nowrap transition-colors border-b-2 -mb-px",
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Report Content ───────────────────────────────────────────── */}
        <div className="px-6 py-6 max-h-[70vh] overflow-y-auto" ref={reportRef}>
          <ReactMarkdown
            className="prose prose-sm max-w-none
              prose-invert
              prose-headings:font-semibold prose-headings:text-foreground prose-headings:tracking-tight
              prose-h1:text-xl prose-h1:mb-3 prose-h1:mt-0
              prose-h2:text-base prose-h2:mt-7 prose-h2:mb-2.5 prose-h2:border-b prose-h2:border-border prose-h2:pb-1.5
              prose-h3:text-sm prose-h3:mt-4 prose-h3:mb-1.5 prose-h3:text-foreground/90
              prose-p:text-foreground/70 prose-p:leading-relaxed prose-p:my-1.5 prose-p:text-sm
              prose-ul:my-1.5 prose-li:text-foreground/70 prose-li:leading-relaxed prose-li:text-sm
              prose-ol:my-1.5
              prose-strong:text-foreground prose-strong:font-semibold
              prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground prose-blockquote:italic
              prose-table:text-xs prose-th:text-foreground prose-th:font-semibold prose-td:text-foreground/70
              prose-hr:border-border prose-hr:my-5
              prose-code:text-primary prose-code:bg-primary/8 prose-code:px-1 prose-code:rounded prose-code:text-xs
            "
          >
            {report}
          </ReactMarkdown>
        </div>

        {/* ── Scroll-to-top hint ─────────────────────────────────────── */}
        <div className="border-t border-border px-5 py-2 flex justify-end">
          <button
            onClick={() =>
              reportRef.current?.scrollTo({ top: 0, behavior: "smooth" })
            }
            className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronDown className="h-3 w-3 rotate-180" />
            Back to top
          </button>
        </div>
      </motion.div>
    </div>
  );
}
