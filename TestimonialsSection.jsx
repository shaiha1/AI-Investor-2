import React from "react";

const testimonials = [
  {
    quote: "Feels like having a Wall Street analyst on demand. The price target rationale alone is worth it.",
    name: "Michael R.",
    title: "Retail Investor · 12 years experience",
    initials: "MR",
  },
  {
    quote: "I used to spend hours reading 10-Ks and earnings calls. Now I get the same quality insight in 30 seconds.",
    name: "Sarah K.",
    title: "Portfolio Manager · Self-directed",
    initials: "SK",
  },
  {
    quote: "The portfolio analysis feature completely changed how I think about diversification. Genuinely impressive.",
    name: "James T.",
    title: "Finance Professional · Active Trader",
    initials: "JT",
  },
];

export default function TestimonialsSection() {
  return (
    <section className="py-24 px-6 bg-card/30">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">Testimonials</p>
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight">Trusted by smart investors.</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {testimonials.map(({ quote, name, title, initials }) => (
            <div key={name} className="bg-card border border-border rounded-2xl p-6 flex flex-col gap-5">
              {/* Stars */}
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-amber-400 text-sm">★</span>
                ))}
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed flex-1">"{quote}"</p>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-primary">{initials}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{name}</p>
                  <p className="text-xs text-muted-foreground">{title}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}