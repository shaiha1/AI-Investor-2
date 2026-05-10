import React from "react";
import { Search, Cpu, Lightbulb } from "lucide-react";

const steps = [
  {
    icon: Search,
    number: "01",
    title: "Enter a Stock Ticker",
    desc: "Type any stock symbol or company name. AI-Investor fetches live market data instantly.",
  },
  {
    icon: Cpu,
    number: "02",
    title: "Generate AI Analysis",
    desc: "Our AI model runs a full equity research workflow — fundamentals, valuation, catalysts, and risk — in seconds.",
  },
  {
    icon: Lightbulb,
    number: "03",
    title: "Get Actionable Insights",
    desc: "Receive a price target, Buy/Hold/Sell recommendation, and a complete research report ready to act on.",
  },
];

export default function HowItWorksSection() {
  return (
    <section className="py-24 px-6 bg-card/30">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">How It Works</p>
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight">Three steps to clarity.</h2>
        </div>

        <div className="relative">
          {/* Connecting line (desktop) */}
          <div className="hidden sm:block absolute top-10 left-[16.66%] right-[16.66%] h-px bg-gradient-to-r from-transparent via-border to-transparent" />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
            {steps.map(({ icon: Icon, number, title, desc }) => (
              <div key={number} className="flex flex-col items-center text-center">
                <div className="relative mb-6">
                  <div className="h-20 w-20 rounded-2xl bg-card border border-border flex items-center justify-center shadow-lg">
                    <Icon className="h-8 w-8 text-primary" />
                  </div>
                  <span className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                    {number.replace("0", "")}
                  </span>
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}