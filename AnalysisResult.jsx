import React from "react";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import { FileText } from "lucide-react";
import SummaryCard from "./SummaryCard";

export default function AnalysisResult({ result }) {
  if (!result) return null;

  const { recommendation, confidence, timeframe, thesis, report, priceTarget, currentPrice, updownPct, priceTargetRationale } = result;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <SummaryCard
        recommendation={recommendation}
        confidence={confidence}
        timeframe={timeframe}
        thesis={thesis}
      />

      {/* Full Report */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.25 }}
        className="bg-card border border-border rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300"
      >
        <div className="px-5 py-3.5 border-b border-border flex items-center gap-2.5">
          <FileText className="h-4 w-4 text-primary" />
          <div>
            <p className="text-sm font-semibold text-foreground">Equity Research Report</p>
            <p className="text-[11px] text-muted-foreground">AI-generated · for informational purposes only</p>
          </div>
        </div>

        <div className="px-6 py-6">
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
      </motion.div>
    </div>
  );
}