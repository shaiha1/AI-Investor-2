import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Newspaper, ChevronDown, ExternalLink, CheckCircle2, Database } from "lucide-react";
import { cn } from "@/lib/utils";

function FilingRow({ filing }) {
  const [open, setOpen] = useState(false);
  const hasText = filing.extractedText && (
    filing.extractedText.managementDiscussion ||
    filing.extractedText.riskFactors ||
    filing.extractedText.forwardGuidance
  );

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-accent/50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <span className={cn(
            "text-xs font-bold px-2 py-0.5 rounded-md",
            filing.type === "10-K" && "bg-blue-500/15 text-blue-400",
            filing.type === "10-Q" && "bg-violet-500/15 text-violet-400",
            filing.type === "8-K" && "bg-amber-500/15 text-amber-400",
          )}>{filing.type}</span>
          <span className="text-sm text-foreground/80">{filing.date}</span>
          {hasText && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
        </div>
        <div className="flex items-center gap-2">
          {filing.url && (
            <a href={filing.url} target="_blank" rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="p-1 hover:text-primary transition-colors text-muted-foreground">
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
          {hasText && <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />}
        </div>
      </button>

      <AnimatePresence>
        {open && hasText && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border px-4 py-4 space-y-4">
              {filing.extractedText.managementDiscussion && (
                <div>
                  <p className="text-xs font-semibold text-primary mb-1.5">Management Discussion</p>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-6">
                    {filing.extractedText.managementDiscussion.substring(0, 800)}…
                  </p>
                </div>
              )}
              {filing.extractedText.riskFactors && (
                <div>
                  <p className="text-xs font-semibold text-amber-400 mb-1.5">Risk Factors</p>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-4">
                    {filing.extractedText.riskFactors.substring(0, 500)}…
                  </p>
                </div>
              )}
              {filing.extractedText.forwardGuidance && (
                <div>
                  <p className="text-xs font-semibold text-emerald-400 mb-1.5">Forward Guidance</p>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                    {filing.extractedText.forwardGuidance.substring(0, 400)}…
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NewsRow({ item }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-3 px-4 py-3 rounded-xl hover:bg-accent/50 transition-colors border border-border"
    >
      <Newspaper className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-sm text-foreground/80 leading-snug line-clamp-2">{item.title}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-muted-foreground">{item.publisher}</span>
          {item.date && <span className="text-xs text-muted-foreground">· {item.date}</span>}
        </div>
      </div>
      <ExternalLink className="h-3 w-3 text-muted-foreground/50 shrink-0 mt-1" />
    </a>
  );
}

export default function ResearchSourcesPanel({ documents, fromCache, fetchedAt }) {
  const [activeTab, setActiveTab] = useState("filings");
  const secFilings = documents?.secFilings || [];
  const pressReleases = documents?.pressReleases || [];

  const tabs = [
    { key: "filings", label: "SEC Filings", count: secFilings.length, icon: FileText },
    { key: "news", label: "Press Releases", count: pressReleases.length, icon: Newspaper },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm"
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Database className="h-4 w-4 text-primary" />
          <div>
            <p className="text-sm font-semibold text-foreground">Research Sources</p>
            <p className="text-xs text-muted-foreground">
              {fromCache ? "Cached · " : "Live · "}
              {fetchedAt ? new Date(fetchedAt).toLocaleDateString() : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                  activeTab === tab.key
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
                <span className={cn(
                  "ml-0.5 text-[10px] px-1.5 py-0.5 rounded-full",
                  activeTab === tab.key ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
                )}>{tab.count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-2.5 max-h-72 overflow-y-auto">
        {activeTab === "filings" && (
          secFilings.length > 0
            ? secFilings.map((f, i) => <FilingRow key={i} filing={f} />)
            : <p className="text-sm text-muted-foreground text-center py-4">No SEC filings found for this ticker.</p>
        )}
        {activeTab === "news" && (
          pressReleases.length > 0
            ? pressReleases.map((n, i) => <NewsRow key={i} item={n} />)
            : <p className="text-sm text-muted-foreground text-center py-4">No recent news found.</p>
        )}
      </div>
    </motion.div>
  );
}