import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function FinalCTASection() {
  return (
    <section className="py-28 px-6 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-3xl mx-auto text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-4">Get Started Today</p>
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight leading-[1.1] mb-6">
          Start Making Smarter
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-cyan-400">
            Investment Decisions.
          </span>
        </h2>
        <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
          Join thousands of investors who use AI-Investor to get institutional-quality research — without the institutional price tag.
        </p>
        <Link to="/dashboard">
          <Button size="lg" className="h-13 px-10 text-base font-semibold gap-2.5 shadow-xl shadow-primary/25">
            Get Started Free
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
        <p className="mt-5 text-xs text-muted-foreground/50">No credit card required · Cancel anytime · Free plan available</p>
      </div>
    </section>
  );
}