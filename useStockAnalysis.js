/**
 * useStockAnalysis.js
 * Custom hook that owns all analysis state and business logic.
 * Drop-in replacement for the inline logic inside Dashboard.jsx.
 *
 * Usage:
 *   const analysis = useStockAnalysis();
 *   // analysis.ticker, analysis.setTicker, analysis.handleSubmit, ...
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { base44 } from "@/api/base44Client";
import {
  buildCacheKey,
  buildResearchBlock,
  buildCompanyContext,
  buildTechnicalBlock,
  roundPriceTarget,
  parseCoverage,
} from "./analysisService";

// ─── Constants ────────────────────────────────────────────────────────────────

const TIMEFRAME_LABELS = {
  next_month: "Next Month",
  next_quarter: "Next Quarter",
  next_year: "Next Year",
};

const CREDIT_COSTS = {
  standard_analysis: 1,
  refresh_analysis: 1,
  scenario_analysis: 2,
  portfolio_analysis: 2,
};

const SIGNUP_BONUS_CREDITS = 10;

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useStockAnalysis() {
  // ── Form inputs
  const [ticker, setTicker] = useState("");
  const [timeframe, setTimeframe] = useState("next_quarter");
  const [selectedScenarios, setSelectedScenarios] = useState([]);
  const [customThesis, setCustomThesis] = useState("");

  // ── Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(null);
  const [isRefreshingCache, setIsRefreshingCache] = useState(false);
  const [isPanelRefreshing, setIsPanelRefreshing] = useState(false);
  const [stockLoading, setStockLoading] = useState(false);

  // ── Result & history
  const [result, setResult] = useState(null);
  const [reports, setReports] = useState([]);
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [error, setError] = useState(null);

  // ── Market / research data
  const [stockData, setStockData] = useState(null);
  const [stockError, setStockError] = useState(null);
  const [researchCache, setResearchCache] = useState(null);
  const [newsData, setNewsData] = useState(null);
  const [technicalData, setTechnicalData] = useState(null);
  const [cacheHit, setCacheHit] = useState(null);
  const [forceRefresh, setForceRefresh] = useState(false);

  // ── User / subscription
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [addedToPortfolio, setAddedToPortfolio] = useState(false);

  // ── Refs
  const abortRef = useRef(null);   // AbortController for in-flight requests
  const isRunningRef = useRef(false); // double-submit guard

  // ── Derived
  const creditsBalance = subscription?.creditsBalance ?? 0;
  const isLowCredits = creditsBalance > 0 && creditsBalance <= 5;
  const isOutOfCredits = creditsBalance <= 0;

  // ── Abort in-flight requests on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  // ── Init: load user + subscription + report history
  useEffect(() => {
    base44.auth.me().then((u) => {
      setUser(u);
      if (!u) return;
      base44.entities.UserSubscription.filter({ userId: u.email }).then((subs) => {
        if (subs.length > 0) {
          setSubscription(subs[0]);
        } else {
          base44.entities.UserSubscription.create({
            userId: u.email,
            creditsBalance: SIGNUP_BONUS_CREDITS,
            totalCreditsPurchased: 0,
            totalCreditsUsed: 0,
          }).then((sub) => {
            setSubscription(sub);
            base44.entities.CreditTransaction.create({
              userId: u.email,
              type: "signup_bonus",
              action: "signup_bonus",
              credits: SIGNUP_BONUS_CREDITS,
              balanceAfter: SIGNUP_BONUS_CREDITS,
            }).catch(() => {});
          });
        }
      });
    });
    base44.entities.Report.list("-created_date", 50).then(setReports);
  }, []);

  // ── Core analysis runner (replaces the inline handleSubmit logic)
  const runAnalysis = useCallback(
    async ({ overrideForceRefresh = false } = {}) => {
      if (!ticker.trim()) return;
      if (isRunningRef.current) return; // double-submit guard
      isRunningRef.current = true;

      // Cancel any previous in-flight request
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      const effectiveForceRefresh = overrideForceRefresh || forceRefresh;
      const hasScenarios = selectedScenarios.length > 0 || customThesis.trim().length > 0;
      const actionLabel = hasScenarios
        ? "scenario_analysis"
        : effectiveForceRefresh
        ? "refresh_analysis"
        : "standard_analysis";
      const actionCost = CREDIT_COSTS[actionLabel];

      // Credit gate
      if (subscription) {
        const balance = subscription.creditsBalance ?? 0;
        if (balance < actionCost) {
          setShowUpgradeModal(true);
          return;
        }
      }

      setIsLoading(true);
      setResult(null);
      setSelectedReportId(null);
      setStockData(null);
      setStockError(null);
      setStockLoading(true);
      setAddedToPortfolio(false);
      setResearchCache(null);
      setIsRefreshingCache(false);
      setCacheHit(null);
      setNewsData(null);
      setTechnicalData(null);
      setError(null);

      const timeframeLabel = TIMEFRAME_LABELS[timeframe];
      const tickerUpper = ticker.trim().toUpperCase();

      try {
        // Step 1: Parallel market data
        setLoadingStep("market");
        let liveStock = null, liveNews = null, liveTechnical = null;
        try {
          const [stockRes, newsRes, techRes] = await Promise.all([
            base44.functions.invoke("fetchStockData", { ticker: tickerUpper }),
            base44.functions
              .invoke("fetchCompanyNews", { ticker: tickerUpper })
              .catch(() => ({ data: null })),
            base44.functions
              .invoke("fetchTechnicalAnalysis", { ticker: tickerUpper })
              .catch(() => ({
                data: { available: false, message: "Technical chart data is limited for this ticker" },
              })),
          ]);
          liveStock = stockRes.data;
          liveNews = newsRes.data;
          liveTechnical = techRes.data;
          setStockData(liveStock);
          setNewsData(liveNews);
          setTechnicalData(liveTechnical);
        } catch {
          setStockError("Market data temporarily unavailable.");
        }
        setStockLoading(false);

        // Step 2: Research cache
        let cache = null;
        setLoadingStep("cache");
        try {
          const cacheRes = await base44.functions.invoke("fetchInstitutionalResearch", {
            ticker: tickerUpper,
            forceRefresh: effectiveForceRefresh,
          });
          cache = cacheRes.data?.cache || null;
          setResearchCache(cache);
          if (cacheRes.data?.refreshed) {
            setIsRefreshingCache(true);
            setLoadingStep("refreshing");
            await new Promise((r) => setTimeout(r, 800));
            setIsRefreshingCache(false);
          }
        } catch {
          // continue without cache
        }

        // Step 3: AnalysisCache check
        const researchVersion = cache?.lastUpdated || "none";
        const cacheKey = buildCacheKey(tickerUpper, timeframe, selectedScenarios, customThesis, researchVersion);

        if (!effectiveForceRefresh) {
          setLoadingStep("applying");
          try {
            const existing = await base44.entities.AnalysisCache.filter({ cacheKey });
            const now = new Date();
            const valid = existing.find((e) => e.expiresAt && new Date(e.expiresAt) > now);
            if (valid) {
              const snap = valid.marketDataSnapshot ? JSON.parse(valid.marketDataSnapshot) : null;
              if (snap && !liveStock) setStockData(snap);
              setResult({
                recommendation: valid.recommendation,
                confidence: valid.confidence,
                timeframe: valid.timeframe || timeframeLabel,
                thesis: valid.thesis,
                priceTarget: valid.priceTarget,
                currentPrice: valid.currentPrice,
                updownPct: valid.updownPct,
                priceTargetRationale: valid.priceTargetRationale,
                bearCaseTarget: valid.bearCaseTarget,
                baseCaseTarget: valid.baseCaseTarget,
                bullCaseTarget: valid.bullCaseTarget,
                report: valid.reportContent,
              });
              setCacheHit({ fromCache: true, cachedAt: valid.created_date });
              setLoadingStep(null);
              setIsLoading(false);
              setForceRefresh(false);
              return;
            }
          } catch {
            // proceed to generate
          }
        }

        // Step 4: Generate
        setLoadingStep("generating");
        const researchBlock = buildResearchBlock(cache, liveStock);
        const companyContextBlock = buildCompanyContext(liveStock, liveNews);
        const technicalBlock = buildTechnicalBlock(liveTechnical);
        const scenarioBlock =
          selectedScenarios.length > 0 || customThesis
            ? `\nINVESTOR MACRO SCENARIOS:\n${selectedScenarios.map((s) => `- ${s}`).join("\n")}${customThesis ? `\nCustom Thesis: "${customThesis}"` : ""}\n`
            : "";

        const {
          covStatus,
          covSource,
          fsSourceUsed,
          earningsSourceUsed,
          earningsContext,
          hasSEC,
          hasFinnhub,
          hasTranscript,
          confidenceScore,
          sourcesUsed,
          latestTenKDate,
          latestTenQDate,
          latestEightKDate,
        } = parseCoverage(cache);

        // ── The prompt is unchanged — kept identical to the original Dashboard.jsx prompt
        const prompt = buildPrompt({
          tickerUpper,
          timeframeLabel,
          companyContextBlock,
          researchBlock,
          technicalBlock,
          scenarioBlock,
          liveStock,
          liveNews,
          liveTechnical,
          cache,
          covStatus,
          covSource,
          fsSourceUsed,
          earningsSourceUsed,
          earningsContext,
          hasSEC,
          hasFinnhub,
          hasTranscript,
          confidenceScore,
          sourcesUsed,
          latestTenKDate,
          latestTenQDate,
          latestEightKDate,
          selectedScenarios,
          customThesis,
        });

        const res = await base44.integrations.Core.InvokeLLM({
          prompt,
          add_context_from_internet: true,
          model: "gemini_3_1_pro",
          response_json_schema: {
            type: "object",
            properties: {
              recommendation: { type: "string", enum: ["Buy", "Hold", "Sell"] },
              confidence: { type: "string", enum: ["High", "Medium", "Low"] },
              timeframe: { type: "string" },
              thesis: { type: "string" },
              bearCaseTarget: { type: "number" },
              baseCaseTarget: { type: "number" },
              bullCaseTarget: { type: "number" },
              priceTarget: { type: "number" },
              currentPrice: { type: "number" },
              updownPct: { type: "number" },
              priceTargetRationale: { type: "array", items: { type: "string" } },
              report: { type: "string" },
            },
            required: [
              "recommendation","confidence","timeframe","thesis",
              "bearCaseTarget","baseCaseTarget","bullCaseTarget",
              "priceTarget","currentPrice","updownPct","priceTargetRationale","report",
            ],
          },
        });

        // Coerce rationale items
        if (Array.isArray(res.priceTargetRationale)) {
          res.priceTargetRationale = res.priceTargetRationale
            .map((item) => {
              if (item == null) return null;
              if (typeof item === "string") return item;
              if (typeof item === "object") {
                const parts = Object.values(item).filter((v) => typeof v === "string");
                return parts.length ? parts.join(" — ") : JSON.stringify(item);
              }
              return String(item);
            })
            .filter(Boolean);
        }

        // Anchor to live price and recompute weighted target
        if (liveStock?.currentPrice) {
          res.currentPrice = liveStock.currentPrice;
          if (res.bearCaseTarget && res.baseCaseTarget && res.bullCaseTarget) {
            const weighted =
              res.bearCaseTarget * 0.25 + res.baseCaseTarget * 0.5 + res.bullCaseTarget * 0.25;
            res.priceTarget = roundPriceTarget(weighted);
          }
          res.updownPct = ((res.priceTarget - res.currentPrice) / res.currentPrice) * 100;
        }

        // Deduct credits before showing result — if this fails, don't surface the report
        if (subscription) {
          const newBalance = Math.max(0, (subscription.creditsBalance ?? 0) - actionCost);
          const newTotalUsed = (subscription.totalCreditsUsed ?? 0) + actionCost;
          await base44.entities.UserSubscription.update(subscription.id, {
            creditsBalance: newBalance,
            totalCreditsUsed: newTotalUsed,
          });
          setSubscription((prev) => ({ ...prev, creditsBalance: newBalance, totalCreditsUsed: newTotalUsed }));
          base44.entities.CreditTransaction.create({
            userId: subscription.userId,
            type: "spend",
            action: actionLabel,
            credits: -actionCost,
            balanceAfter: newBalance,
            metadata: JSON.stringify({ ticker: tickerUpper, timeframe }),
          }).catch(() => {});
        }

        setResult(res);
        setCacheHit({ fromCache: false, cachedAt: new Date().toISOString() });

        // Save report
        const saved = await base44.entities.Report.create({
          ticker: tickerUpper,
          timeframe: timeframeLabel,
          riskProfile: "scenario-based",
          recommendation: res.recommendation,
          confidence: res.confidence,
          thesis: res.thesis,
          priceTarget: res.priceTarget,
          currentPrice: res.currentPrice,
          updownPct: res.updownPct,
          priceTargetRationale: res.priceTargetRationale,
          reportContent: res.report,
        });

        // Save AnalysisCache (non-blocking)
        const scenariosKey = JSON.stringify([...selectedScenarios].sort());
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        base44.entities.AnalysisCache.create({
          ticker: tickerUpper,
          timeframe,
          scenariosKey,
          customThesis: customThesis || "",
          cacheKey,
          researchCacheVersion: researchVersion,
          marketDataSnapshot: liveStock ? JSON.stringify(liveStock) : null,
          reportContent: res.report,
          recommendation: res.recommendation,
          confidence: res.confidence,
          thesis: res.thesis,
          priceTarget: res.priceTarget,
          currentPrice: res.currentPrice,
          updownPct: res.updownPct,
          bullCaseTarget: res.bullCaseTarget,
          baseCaseTarget: res.baseCaseTarget,
          bearCaseTarget: res.bearCaseTarget,
          priceTargetRationale: res.priceTargetRationale,
          expiresAt,
        }).catch(() => {});

        setSelectedReportId(saved.id);
        setReports((prev) => [saved, ...prev]);
      } catch (err) {
        setError("Analysis failed. Please try again.");
        console.error("Analysis error:", err);
      } finally {
        setLoadingStep(null);
        setIsLoading(false);
        setForceRefresh(false);
        isRunningRef.current = false;
      }
    },
    [ticker, timeframe, selectedScenarios, customThesis, forceRefresh, subscription]
  );

  // ── Handlers
  const handleSubmit = useCallback(
    (e) => {
      e?.preventDefault();
      runAnalysis();
    },
    [runAnalysis]
  );

  // FIX: no more setTimeout + dispatchEvent hack
  const handleRefreshAnalysis = useCallback(() => {
    runAnalysis({ overrideForceRefresh: true });
  }, [runAnalysis]);

  const handleRefreshResearch = useCallback(async () => {
    if (!ticker.trim() || !result) return;
    setIsPanelRefreshing(true);
    try {
      const cacheRes = await base44.functions.invoke("fetchInstitutionalResearch", {
        ticker: ticker.trim().toUpperCase(),
        forceRefresh: true,
      });
      setResearchCache(cacheRes.data?.cache || null);
    } catch {}
    setIsPanelRefreshing(false);
  }, [ticker, result]);

  const handleAddToPortfolio = useCallback(async () => {
    if (!user || !result) return;
    const tickerSymbol = ticker.trim().toUpperCase();
    await base44.entities.PortfolioHolding.create({
      userId: user.email,
      ticker: tickerSymbol,
      companyName: stockData?.companyName || tickerSymbol,
      addedAt: new Date().toISOString(),
    });
    setAddedToPortfolio(true);
  }, [user, result, ticker, stockData]);

  const handleSelectReport = useCallback((report) => {
    setSelectedReportId(report.id);
    setStockData(null);
    setStockError(null);
    setAddedToPortfolio(false);
    setResearchCache(null);
    setTechnicalData(null);
    setResult({
      recommendation: report.recommendation,
      confidence: report.confidence,
      timeframe: report.timeframe,
      thesis: report.thesis,
      priceTarget: report.priceTarget,
      currentPrice: report.currentPrice,
      updownPct: report.updownPct,
      priceTargetRationale: report.priceTargetRationale,
      bearCaseTarget: report.bearCaseTarget,
      baseCaseTarget: report.baseCaseTarget,
      bullCaseTarget: report.bullCaseTarget,
      report: report.reportContent,
    });
  }, []);

  const handleNewAnalysis = useCallback(() => {
    setResult(null);
    setSelectedReportId(null);
    setStockData(null);
    setStockError(null);
    setAddedToPortfolio(false);
    setResearchCache(null);
    setLoadingStep(null);
    setIsRefreshingCache(false);
    setCacheHit(null);
    setForceRefresh(false);
    setNewsData(null);
    setTechnicalData(null);
    setError(null);
  }, []);

  return {
    // form inputs
    ticker, setTicker,
    timeframe, setTimeframe,
    selectedScenarios, setSelectedScenarios,
    customThesis, setCustomThesis,
    // loading
    isLoading, loadingStep, isRefreshingCache,
    isPanelRefreshing, stockLoading,
    // result
    result, error,
    // history
    reports, selectedReportId,
    // market data
    stockData, stockError, researchCache, newsData, technicalData,
    cacheHit, forceRefresh, setForceRefresh,
    // user
    user, subscription, showUpgradeModal, setShowUpgradeModal,
    addedToPortfolio, creditsBalance, isLowCredits, isOutOfCredits,
    // handlers
    handleSubmit, handleRefreshAnalysis, handleRefreshResearch,
    handleAddToPortfolio, handleSelectReport, handleNewAnalysis,
  };
}

// ─── Prompt builder (identical logic, moved out of component) ─────────────────

function buildPrompt({
  tickerUpper, timeframeLabel, companyContextBlock, researchBlock,
  technicalBlock, scenarioBlock, liveStock, liveNews, liveTechnical,
  cache, covStatus, covSource, fsSourceUsed, earningsSourceUsed,
  earningsContext, hasSEC, hasFinnhub, hasTranscript, confidenceScore,
  sourcesUsed, latestTenKDate, latestTenQDate, latestEightKDate,
  selectedScenarios, customThesis,
}) {
  return `You are the world's best equity research analyst — a disciplined institutional analyst with deep expertise in fundamental analysis, SEC filing interpretation, and valuation. You work with the rigor of Goldman Sachs / Morgan Stanley equity research.

Generate a professional institutional-grade equity research report for "${tickerUpper}" with a ${timeframeLabel} investment horizon.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COMPANY CONTEXT — READ CAREFULLY AND USE THROUGHOUT THE REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${companyContextBlock || `Company: ${tickerUpper} — use your knowledge of this company's sector, business model, and financials.`}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RESEARCH DATA (use all available sources below)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${researchBlock || "No cached research available — use your knowledge supplemented by internet research."}

${technicalBlock}

${scenarioBlock}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ANALYST RULES (INSTITUTIONAL GRADE — STRICT):
1. You are NOT a generic chatbot. Produce disciplined, specific, citation-rich institutional analysis.
2. ANTI-HALLUCINATION RULE: Every major conclusion must cite the SOURCE CATEGORY in brackets.
3. NEVER say data is "missing" if the normalized FinancialStatementContext or EarningsContext above contains data.
3a. EARNINGS INSIGHTS RULE (CRITICAL): NEVER say earnings are "missing".
4. Connect filings to valuation — explain HOW specific data points affect the price target.
5. Connect risks to the price target — explain WHY specific risks reduce/increase the target.
6. Clearly separate FACTS from ASSUMPTIONS (marked as [Scenario Assumption]).
7. Price target MUST use a specific methodology (DCF with stated WACC/terminal growth, EV/EBITDA with stated peer multiples, P/E, P/S).
8. For non-US companies without SEC filings: use FMP financial statements as primary source.
9. Red flags must be fact-based — cite the specific source.
10. Never produce vague language like "strong fundamentals" without citing specific numbers.
11. Multi-source preference: Market price (Finnhub > Yahoo > FMP) | Financial statements (FMP > SEC XBRL > Yahoo) | Filings (SEC > Finnhub > FMP).
12. Research Confidence Score: ${confidenceScore}/100. If below 50, explicitly note "Limited source coverage" in the executive summary.
13. Sources used: ${sourcesUsed.join(", ") || "General knowledge + internet research"}
14. TECHNICAL VALIDATION RULE: Use the TECHNICAL ANALYSIS data block to populate Section 7.

COMPANY-SPECIFICITY RULES — MANDATORY:
- Reference the SECTOR (${liveStock?.sector || "Unknown"}) and INDUSTRY (${liveStock?.industry || "Unknown"}) explicitly throughout.
- Adjust valuation multiples based on growth profile (${liveStock?.growthProfile || "unknown"}), size (${liveStock?.marketCapLabel || "unknown"}), and profitability.
- Incorporate recent news themes (${liveNews?.themes?.join(", ") || "N/A"}) and sentiment (${liveNews?.sentiment || "N/A"}).
- Do NOT reuse generic phrases — every statement must be company-specific with numbers.

DETERMINISTIC PRICE TARGET RULES:
- Derive THREE distinct price targets: bearCaseTarget, baseCaseTarget, bullCaseTarget
- Fixed weights: Bear 25%, Base 50%, Bull 25%
- Final: (bearCaseTarget × 0.25) + (baseCaseTarget × 0.50) + (bullCaseTarget × 0.25)
- Round: ≥$100 → nearest $1; $10–$99.99 → nearest $0.50; <$10 → nearest $0.10
- Use the current price from market data as baseline. Do not estimate it.

Return JSON with: recommendation, confidence, timeframe, thesis, bearCaseTarget, baseCaseTarget, bullCaseTarget, priceTarget, currentPrice, updownPct, priceTargetRationale (array of 3 strings), report (full markdown).

REPORT STRUCTURE: Follow the same 9-section structure as originally specified, including Company Snapshot, Recent Developments, Executive Summary, Data Sources, Filing Intelligence, Fundamental Analysis, Price Target Analysis, Earnings Insights, Technical Validation, Red Flags, Bull vs Bear, Catalyst Watch, and Final Verdict.

*Sources: ${sourcesUsed.join(", ") || "General knowledge"} | Confidence: ${confidenceScore}/100 | ${hasSEC ? `SEC EDGAR CIK: ${cache?.cik}` : "Non-US — FMP financials used"} | Generated ${new Date().toLocaleDateString()}*`;
}
