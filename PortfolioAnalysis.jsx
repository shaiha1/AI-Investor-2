import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { BarChart3, Loader2, ShieldCheck, Zap, ShoppingCart } from "lucide-react";

const PORTFOLIO_ANALYSIS_COST = 2;

export default function PortfolioAnalysis({ holdings, liveData }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    base44.auth.me().then((u) => {
      if (!u) return;
      base44.entities.UserSubscription.filter({ userId: u.email }).then((subs) => {
        if (subs.length > 0) setSubscription(subs[0]);
      });
    });
  }, []);

  const creditsBalance = subscription?.creditsBalance ?? 0;
  const cannotAfford = creditsBalance < PORTFOLIO_ANALYSIS_COST;

  const handleAnalyze = async () => {
    if (holdings.length === 0) return;
    if (cannotAfford) return;
    setLoading(true);
    setAnalysis(null);

    const holdingsSummary = holdings.map((h) => {
      const live = liveData[h.ticker];
      return `- ${h.ticker}${h.companyName ? ` (${h.companyName})` : ""}${h.positionSize ? `, ${h.positionSize} shares` : ""}${live ? `, current price $${live.price.toFixed(2)}, ${live.changePercent >= 0 ? "+" : ""}${live.changePercent.toFixed(2)}% today${live.sector ? `, sector: ${live.sector}` : ""}` : ""}`;
    }).join("\n");

    const prompt = `Act as a portfolio manager at a top-tier hedge fund. Analyze the following stock portfolio and provide a comprehensive assessment.

Portfolio Holdings:
${holdingsSummary}

Provide a thorough portfolio analysis using EXACTLY this structure in markdown:

## Overall Portfolio Assessment
A concise paragraph summarizing the portfolio's composition, quality, and positioning.

## Risk Level
**Overall Risk:** Low / Medium / High / Very High
Brief justification of the risk level.

## Diversification Analysis
- Sector breakdown and concentration
- Geographic exposure
- Market cap distribution
- Correlation risks between holdings

## Top Strengths
- Strength 1
- Strength 2
- Strength 3

## Key Weaknesses & Risks
- Risk 1
- Risk 2
- Risk 3

## Concentration Risks
Identify any dangerous over-concentration in specific stocks, sectors, or themes.

## Strongest Positions
Highlight the 1-2 holdings with the most favorable outlook and why.

## Weakest Positions
Highlight the 1-2 holdings that pose the most risk or have the worst outlook.

## Suggested Rebalancing Actions
- Action 1
- Action 2
- Action 3

## Summary Verdict
One paragraph final verdict on the portfolio health and readiness.

Be specific, cite the actual tickers, use real data where available. Be direct and actionable.`;

    const res = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      model: "gemini_3_1_pro",
    });

    // Deduct credits before showing result — if this fails, don't show analysis
    if (subscription) {
      const newBalance = Math.max(0, creditsBalance - PORTFOLIO_ANALYSIS_COST);
      const newTotalUsed = (subscription.totalCreditsUsed ?? 0) + PORTFOLIO_ANALYSIS_COST;
      await base44.entities.UserSubscription.update(subscription.id, {
        creditsBalance: newBalance,
        totalCreditsUsed: newTotalUsed,
      });
      setSubscription((prev) => ({ ...prev, creditsBalance: newBalance, totalCreditsUsed: newTotalUsed }));
      base44.entities.CreditTransaction.create({
        userId: subscription.userId,
        type: "spend",
        action: "portfolio_analysis",
        credits: -PORTFOLIO_ANALYSIS_COST,
        balanceAfter: newBalance,
        metadata: JSON.stringify({ holdingsCount: holdings.length }),
      }).catch(() => {});
    }

    setAnalysis(res);
    setLoading(false);
  };

  return (
    <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-6 py-5 border-b border-border flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <BarChart3 className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">AI Portfolio Analysis</h2>
            <p className="text-xs text-muted-foreground">Hedge-fund grade insights</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary">
            <Zap className="h-3 w-3" />
            {PORTFOLIO_ANALYSIS_COST} credits
          </span>
          <Button
            onClick={handleAnalyze}
            disabled={loading || holdings.length === 0 || cannotAfford}
            size="sm"
            className="gap-2 shrink-0"
          >
            {loading ? (
              <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Analyzing…</>
            ) : cannotAfford ? (
              <><ShoppingCart className="h-3.5 w-3.5" /> Buy Credits</>
            ) : (
              "Analyze Portfolio"
            )}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-6">
        {!analysis && !loading && (
          <div className="flex flex-col items-center justify-center text-center py-16 gap-4">
            <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center">
              <ShieldCheck className="h-7 w-7 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground mb-1">Portfolio analysis awaits</p>
              <p className="text-xs text-muted-foreground max-w-xs">
                {holdings.length === 0
                  ? "Add some stocks to your portfolio first."
                  : `Click "Analyze Portfolio" to get a comprehensive risk and rebalancing assessment for your ${holdings.length} holding${holdings.length > 1 ? "s" : ""}.`}
              </p>
            </div>
            {holdings.length > 0 && cannotAfford && (
              <Link to="/pricing">
                <Button variant="outline" className="gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Buy Credits — needs {PORTFOLIO_ANALYSIS_COST}
                </Button>
              </Link>
            )}
            {holdings.length > 0 && !cannotAfford && (
              <Button onClick={handleAnalyze} className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Analyze My Portfolio ({PORTFOLIO_ANALYSIS_COST} cr)
              </Button>
            )}
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-4 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm">Generating hedge-fund grade analysis…</p>
          </div>
        )}

        {analysis && !loading && (
          <ReactMarkdown
            className="prose prose-sm max-w-none
              prose-headings:font-semibold prose-headings:text-foreground prose-headings:tracking-tight
              prose-h2:text-base prose-h2:mt-6 prose-h2:mb-2 prose-h2:border-b prose-h2:border-border prose-h2:pb-2
              prose-h3:text-sm prose-h3:mt-4 prose-h3:mb-1.5
              prose-p:text-foreground/80 prose-p:leading-relaxed prose-p:my-2
              prose-ul:my-2 prose-li:text-foreground/80 prose-li:leading-relaxed
              prose-strong:text-foreground prose-strong:font-semibold
              prose-hr:border-border prose-hr:my-4
            "
          >
            {analysis}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
}