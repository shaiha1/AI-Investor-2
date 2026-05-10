import React from "react";
import { BarChart2, Target, TrendingUp, Brain } from "lucide-react";

const benefits = [
  {
    icon: BarChart2,
    color: "text-primary",
    bg: "bg-primary/10 border-primary/20",
    title: "AI-Generated Equity Research",
    desc: "Get comprehensive, hedge fund-style research reports with fundamental analysis, sector context, and catalyst watch — all generated in seconds.",
  },
  {
    icon: Target,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    title: "Price Targets with Clear Rationale",
    desc: "Every price target is backed by real valuation methodology — DCF, comparable multiples, and growth expectations — not guesswork.",
  },
  {
    icon: TrendingUp,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10 border-cyan-500/20",
    title: "Real-Time Market Data",
    desc: "Live price feeds, volume, P/E ratios, and 90-day price charts give your analysis the most current market context available.",
  },
  {
    icon: Brain,
    color: "text-violet-400",
    bg: "bg-violet-500/10 border-violet-500/20",
    title: "Portfolio-Level Insights",
    desc: "Analyze your entire portfolio at once with AI-powered diversification scoring, risk assessment, and rebalancing recommendations.",
  },
];

export default function BenefitsSection() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">Why AI-Investor</p>
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight">
            Everything a Wall Street analyst has.
            <br />
            <span className="text-muted-foreground font-normal">At a fraction of the cost.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {benefits.map(({ icon: Icon, color, bg, title, desc }) => (
            <div key={title} className="bg-card border border-border rounded-2xl p-6 hover:border-border/80 hover:bg-card/80 transition-colors group">
              <div className={`h-11 w-11 rounded-xl border flex items-center justify-center mb-5 ${bg}`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}