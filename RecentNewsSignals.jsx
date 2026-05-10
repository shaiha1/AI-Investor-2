import React from "react";
import { motion } from "framer-motion";
import { Newspaper, TrendingUp, TrendingDown, Minus, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

const SENTIMENT_CFG = {
  positive: {
    label: "Positive",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    dot: "bg-emerald-400",
    icon: TrendingUp,
  },
  negative: {
    label: "Negative",
    color: "text-rose-400",
    bg: "bg-rose-500/10 border-rose-500/20",
    dot: "bg-rose-400",
    icon: TrendingDown,
  },
  mixed: {
    label: "Mixed",
    color: "text-amber-400",
    bg: "bg-amber-400/10 border-amber-400/20",
    dot: "bg-amber-400",
    icon: Minus,
  },
  neutral: {
    label: "Neutral",
    color: "text-muted-foreground",
    bg: "bg-secondary border-border",
    dot: "bg-muted-foreground",
    icon: Minus,
  },
};

function SentimentTag({ sentiment }) {
  const cfg = SENTIMENT_CFG[sentiment] || SENTIMENT_CFG.neutral;
  return (
    <span className={cn("inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md border whitespace-nowrap", cfg.bg, cfg.color)}>
      <span className={cn("h-1 w-1 rounded-full", cfg.dot)} />
      {cfg.label}
    </span>
  );
}

export default function RecentNewsSignals({ newsData }) {
  if (!newsData) return null;

  const articles = (newsData.articles || []).slice(0, 5);
  const themes = newsData.themes || [];
  const overallCfg = SENTIMENT_CFG[newsData.sentiment] || SENTIMENT_CFG.neutral;
  const OverallIcon = overallCfg.icon;

  if (articles.length === 0 && themes.length === 0 && !newsData.majorEvent) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="bg-card border border-border rounded-xl overflow-hidden shadow-sm"
    >
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-border flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
          <Newspaper className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground">Recent News & Market Signals</p>
          <p className="text-[11px] text-muted-foreground">Headlines, themes & sentiment</p>
        </div>
        <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold", overallCfg.bg, overallCfg.color)}>
          <OverallIcon className="h-3.5 w-3.5" />
          {overallCfg.label}
        </div>
      </div>

      {/* Major event */}
      {newsData.majorEvent && (
        <div className="px-5 py-3 bg-muted/20 border-b border-border">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-1">📌 Major Event</p>
          <p className="text-xs text-foreground/90 leading-relaxed">{newsData.majorEvent}</p>
        </div>
      )}

      {/* Articles */}
      {articles.length > 0 && (
        <div className="divide-y divide-border">
          {articles.map((article, i) => {
            const summary = article.aiSummary || article.summary || "";
            const timeAgo = article.publishedAt
              ? formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })
              : null;
            return (
              <a
                key={i}
                href={article.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block px-5 py-3 hover:bg-muted/20 transition-colors group"
              >
                <div className="flex items-start gap-2.5">
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-start gap-2 flex-wrap">
                      <SentimentTag sentiment={article.sentiment} />
                      <p className="text-xs font-semibold text-foreground leading-snug flex-1 group-hover:text-primary transition-colors">
                        {article.title}
                      </p>
                    </div>
                    {summary && (
                      <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-1">{summary}</p>
                    )}
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground/70">
                      {article.publisher && <span className="font-medium">{article.publisher}</span>}
                      {timeAgo && <span>· {timeAgo}</span>}
                    </div>
                  </div>
                  {article.link && (
                    <ExternalLink className="h-3 w-3 text-muted-foreground/50 group-hover:text-primary shrink-0 mt-1" />
                  )}
                </div>
              </a>
            );
          })}
        </div>
      )}

      {/* Footer: Themes */}
      {themes.length > 0 && (
        <div className="px-5 py-3 border-t border-border bg-muted/10">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-1.5">Key Themes</p>
          <div className="flex flex-wrap gap-1.5">
            {themes.map((theme, i) => (
              <span
                key={i}
                className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/8 border border-primary/20 text-primary/90"
              >
                {theme}
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}