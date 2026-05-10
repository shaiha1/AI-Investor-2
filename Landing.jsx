import React, { useRef } from "react";
import LandingNav from "../components/landing/LandingNav";
import HeroSection from "../components/landing/HeroSection";
import BenefitsSection from "../components/landing/BenefitsSection";
import HowItWorksSection from "../components/landing/HowItWorksSection";
import PricingSection from "../components/landing/PricingSection";
import TestimonialsSection from "../components/landing/TestimonialsSection";
import FinalCTASection from "../components/landing/FinalCTASection";

export default function Landing() {
  const pricingRef = useRef(null);

  const handleSeeExample = () => {
    pricingRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingNav />

      <HeroSection onSeeExample={handleSeeExample} />

      <div id="benefits">
        <BenefitsSection />
      </div>

      <div id="how-it-works">
        <HowItWorksSection />
      </div>

      <TestimonialsSection />

      <div id="pricing" ref={pricingRef}>
        <PricingSection />
      </div>

      <FinalCTASection />

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground/60">
          <span>© 2026 AI-Investor. All rights reserved.</span>
          <span>For informational purposes only. Not financial advice.</span>
        </div>
      </footer>
    </div>
  );
}