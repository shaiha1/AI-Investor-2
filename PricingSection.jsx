import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, Zap, Infinity as InfinityIcon } from "lucide-react";

const packs = [
  {
    name: "Starter Pack",
    price: "$9.90",
    credits: 25,
    perCredit: "$0.40 / credit",
    desc: "Great for occasional research.",
    cta: "Buy 25 Credits",
    ctaVariant: "outline",
    highlighted: false,
    badge: null,
    features: ["25 credits", "Never expire", "All AI features"],
  },
  {
    name: "Pro Pack",
    price: "$14.90",
    credits: 50,
    perCredit: "$0.30 / credit",
    desc: "Best balance of value and volume.",
    cta: "Buy 50 Credits",
    ctaVariant: "default",
    highlighted: true,
    badge: "Most Popular",
    features: ["50 credits", "Never expire", "All AI features", "~25% better value"],
  },
  {
    name: "Power Pack",
    price: "$24.90",
    credits: 100,
    perCredit: "$0.25 / credit",
    desc: "For active research investors.",
    cta: "Buy 100 Credits",
    ctaVariant: "outline",
    highlighted: false,
    badge: "Best Value",
    features: ["100 credits", "Never expire", "All AI features", "~38% better value"],
  },
];

export default function PricingSection() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">Pricing</p>
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight">Pay only for what you use.</h2>
          <p className="mt-4 text-muted-foreground">
            Buy credits once. Use them anytime. <span className="text-foreground font-medium">Credits never expire.</span>
          </p>
          <div className="mt-5 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-semibold">
            <InfinityIcon className="h-3.5 w-3.5" />
            10 free credits when you sign up
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {packs.map((pack) => (
            <div
              key={pack.name}
              className={`relative rounded-2xl border p-6 flex flex-col ${
                pack.highlighted
                  ? "border-primary/50 bg-primary/5 shadow-xl shadow-primary/10"
                  : "border-border bg-card"
              }`}
            >
              {pack.badge && (
                <div
                  className={`absolute -top-3.5 left-1/2 -translate-x-1/2 text-xs font-bold px-4 py-1 rounded-full tracking-wide uppercase whitespace-nowrap ${
                    pack.highlighted ? "bg-primary text-primary-foreground" : "bg-amber-400 text-black"
                  }`}
                >
                  {pack.badge}
                </div>
              )}
              <div className="mb-5">
                <p className="text-sm font-semibold text-muted-foreground mb-1">{pack.name}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-foreground">{pack.price}</span>
                  <span className="text-sm text-muted-foreground">one-time</span>
                </div>
                <div className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-primary">
                  <Zap className="h-3 w-3" />
                  {pack.credits} credits — {pack.perCredit}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{pack.desc}</p>
              </div>
              <ul className="space-y-2.5 mb-6 flex-1">
                {pack.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-foreground/80">
                    <Check className="h-3.5 w-3.5 text-emerald-400 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/pricing">
                <Button
                  variant={pack.ctaVariant}
                  className={`w-full h-10 font-semibold text-sm ${pack.highlighted ? "shadow-lg shadow-primary/20" : ""}`}
                >
                  {pack.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}