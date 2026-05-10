import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";

export default function HeroSection({ onSeeExample }) {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-6 overflow-hidden pt-20">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[300px] bg-primary/5 rounded-full blur-[100px]" />
      </div>

      {/* Badge */}
      <div className="relative mb-6 inline-flex items-center gap-2 bg-primary/10 border border-primary/25 rounded-full px-4 py-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
        <span className="text-xs font-semibold text-primary tracking-wide uppercase">AI-Powered Equity Research</span>
      </div>

      {/* Headline */}
      <h1 className="relative text-center text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-foreground max-w-4xl leading-[1.08]">
        Institutional-Grade{" "}
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-cyan-400">
          Stock Analysis.
        </span>
        <br />
        Powered by AI.
      </h1>

      {/* Subheadline */}
      <p className="relative mt-6 text-center text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
        Generate hedge fund-quality equity research, price targets, and portfolio insights in seconds — no Bloomberg terminal required.
      </p>

      {/* CTAs */}
      <div className="relative mt-10 flex flex-col sm:flex-row items-center gap-4">
        <Link to="/dashboard">
          <Button size="lg" className="h-12 px-8 text-base font-semibold gap-2 shadow-lg shadow-primary/20">
            Start Free Analysis
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
        <button
          onClick={onSeeExample}
          className="flex items-center gap-2.5 h-12 px-6 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <div className="h-7 w-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Play className="h-3 w-3 text-primary fill-primary ml-0.5" />
          </div>
          See Example Report
        </button>
      </div>

      {/* Mock dashboard preview */}
      <div className="relative mt-16 w-full max-w-4xl">
        <div className="relative rounded-2xl border border-border/60 bg-card shadow-2xl overflow-hidden">
          {/* Window chrome */}
          <div className="flex items-center gap-1.5 px-4 py-3 border-b border-border/50 bg-card/80">
            <span className="h-3 w-3 rounded-full bg-rose-500/70" />
            <span className="h-3 w-3 rounded-full bg-amber-400/70" />
            <span className="h-3 w-3 rounded-full bg-emerald-500/70" />
            <span className="ml-4 text-xs text-muted-foreground font-mono">AI-Investor · Equity Research</span>
          </div>
          {/* Mock content */}
          <div className="p-6 grid grid-cols-3 gap-4">
            {/* Price target mock */}
            <div className="col-span-3 sm:col-span-1 bg-emerald-500/8 border border-emerald-500/20 rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">Price Target · Next Quarter</p>
              <p className="text-3xl font-bold font-mono text-emerald-400">$247.50</p>
              <p className="text-sm text-muted-foreground mt-1">vs. current <span className="text-foreground font-semibold">$198.20</span></p>
              <div className="mt-3 inline-flex items-center gap-1 bg-emerald-500/15 text-emerald-400 text-sm font-bold px-2.5 py-1 rounded-lg">↑ +24.9%</div>
            </div>
            {/* Rec mock */}
            <div className="col-span-3 sm:col-span-1 bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-2">Recommendation</p>
              <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 font-bold px-3 py-1 rounded-lg text-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> BUY
              </div>
              <p className="text-xs text-muted-foreground mt-3 leading-relaxed">Strong revenue growth driven by AI adoption and expanding cloud margins.</p>
            </div>
            {/* Chart mock */}
            <div className="col-span-3 sm:col-span-1 bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-2">Confidence</p>
              <p className="text-lg font-bold text-foreground">High</p>
              <div className="mt-2 space-y-1.5">
                {[85, 60, 40].map((w, i) => (
                  <div key={i} className="h-1.5 bg-border rounded-full overflow-hidden">
                    <div className="h-full bg-primary/60 rounded-full" style={{ width: `${w}%` }} />
                  </div>
                ))}
              </div>
            </div>
            {/* Report lines */}
            <div className="col-span-3 bg-card border border-border rounded-xl p-4">
              <p className="text-xs font-semibold text-muted-foreground mb-3">Equity Research Report · AAPL</p>
              <div className="space-y-2">
                {[100, 85, 92, 70, 55, 80].map((w, i) => (
                  <div key={i} className="h-2 bg-border/60 rounded-full" style={{ width: `${w}%` }} />
                ))}
              </div>
            </div>
          </div>
        </div>
        {/* Glow under preview */}
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-3/4 h-16 bg-primary/15 blur-2xl rounded-full" />
      </div>

      {/* Trust line */}
      <p className="relative mt-10 text-xs text-muted-foreground/50">No credit card required · Free plan available · Instant results</p>
    </section>
  );
}