import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Activity } from "lucide-react";

export default function LandingNav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <Activity className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-base font-bold tracking-tight text-foreground">AI-Investor</span>
        </div>

        <div className="hidden sm:flex items-center gap-6 text-sm text-muted-foreground">
          {["benefits", "how-it-works", "pricing"].map((id, i) => (
            <button
              key={id}
              onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })}
              className="hover:text-foreground transition-colors"
            >
              {["Features", "How It Works", "Pricing"][i]}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Link to="/dashboard">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground h-8">
              Sign In
            </Button>
          </Link>
          <Link to="/dashboard">
            <Button size="sm" className="h-8 px-4 font-semibold">
              Get Started Free
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}