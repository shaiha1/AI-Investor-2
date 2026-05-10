import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Activity, Briefcase, Plus, User, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import AnalysisForm from "../components/dashboard/AnalysisForm";
import AnalysisResult from "../components/dashboard/AnalysisResult";
import ReportHistory from "../components/dashboard/ReportHistory";
import ReportActions from "../components/dashboard/ReportActions";
import StockSummaryBar from "../components/dashboard/StockSummaryBar";
import ScenarioInputs from "../components/dashboard/ScenarioInputs";
import UsageBadge from "../components/dashboard/UsageBadge";
import UpgradeModal from "../components/dashboard/UpgradeModal";
import LoadingSteps from "../components/dashboard/LoadingSteps";
import ResearchCoverageDashboard from "../components/dashboard/ResearchCoverageDashboard";
import AITechnicalChart from "../components/dashboard/AITechnicalChart";
import TechnicalSupportPanel from "../components/dashboard/TechnicalSupportPanel";
import CreditCostBadge from "../components/dashboard/CreditCostBadge";
import PriceTargetCard from "../components/dashboard/PriceTargetCard";
import ConfidenceScoreBadge from "../components/dashboard/ConfidenceScoreBadge";

const TIMEFRAME_LABELS = {
  next_month: "Next Month",
  next_quarter: "Next Quarter",
  next_year: "Next Year",
};

// Credits per action
const CREDIT_COSTS = {
  standard_analysis: 1,
  refresh_analysis: 1,
  scenario_analysis: 2,
  portfolio_analysis: 2,
};

// New users get 10 free credits on first signup
const SIGNUP_BONUS_CREDITS = 10;

export default function Dashboard() {
  const [ticker, setTicker] = useState("");
  const [timeframe, setTimeframe] = useState("next_quarter");
  const [selectedScenarios, setSelectedScenarios] = useState([]);
  const [customThesis, setCustomThesis] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(null); // 'market' | 'cache' | 'refreshing' | 'applying' | 'generating'
  const [isRefreshingCache, setIsRefreshingCache] = useState(false);
  const [result, setResult] = useState(null);
  const [reports, setReports] = useState([]);
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [stockData, setStockData] = useState(null);
  const [stockLoading, setStockLoading] = useState(false);
  const [stockError, setStockError] = useState(null);
  const [addedToPortfolio, setAddedToPortfolio] = useState(false);
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [researchCache, setResearchCache] = useState(null);
  const [isPanelRefreshing, setIsPanelRefreshing] = useState(false);
  const [cacheHit, setCacheHit] = useState(null); // { fromCache: bool, cachedAt: string } | null
  const [forceRefresh, setForceRefresh] = useState(false);
  const [newsData, setNewsData] = useState(null);
  const [technicalData, setTechnicalData] = useState(null);

  useEffect(() => {
    base44.auth.me().then((u) => {
      setUser(u);
      if (u) {
        base44.entities.UserSubscription.filter({ userId: u.email }).then((subs) => {
          if (subs.length > 0) {
            setSubscription(subs[0]);
          } else {
            // First signup — grant 10 free credits (one-time, never reset)
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
      }
    });
  }, []);

  useEffect(() => {
    base44.entities.Report.list("-created_date", 50).then(setReports);
  }, []);

  const creditsBalance = subscription?.creditsBalance ?? 0;
  const isLowCredits = creditsBalance > 0 && creditsBalance <= 5;
  const isOutOfCredits = creditsBalance <= 0;

  const buildResearchBlock = (cache, liveStock) => {
    const parts = [];

    if (liveStock?.currentPrice) {
      parts.push(`═══ LIVE MARKET DATA (Source: Finnhub → Yahoo Finance fallback) ═══
Company: ${liveStock.companyName}
Current Price: ${liveStock.currency || 'USD'} ${liveStock.currentPrice.toFixed(2)}
Daily Change: ${(liveStock.priceChange ?? 0) >= 0 ? "+" : ""}${(liveStock.priceChange ?? 0).toFixed(2)} (${(liveStock.percentChange ?? 0).toFixed(2)}%)
Market Cap: ${liveStock.marketCap ? `$${(liveStock.marketCap / 1e9).toFixed(2)}B` : "N/A"}
52W High: ${liveStock.fiftyTwoWeekHigh ? `$${liveStock.fiftyTwoWeekHigh.toFixed(2)}` : "N/A"}
52W Low: ${liveStock.fiftyTwoWeekLow ? `$${liveStock.fiftyTwoWeekLow.toFixed(2)}` : "N/A"}
Volume: ${liveStock.volume ? liveStock.volume.toLocaleString() : "N/A"}
P/E Ratio: ${liveStock.peRatio ? liveStock.peRatio.toFixed(1) : "N/A"}`);
    }

    if (!cache) return parts.length ? parts.join('\n\n') : "";

    const add = (label, value) => {
      if (value && value !== "Not available from connected sources") parts.push(`═══ ${label} ═══\n${value}`);
    };

    // Confidence
    parts.push(`═══ RESEARCH CONFIDENCE SCORE ═══
Score: ${cache.sourceConfidenceScore ?? 0}/100
Missing sources: ${(cache.missingSources || []).join(', ') || 'None'}`);

    // Normalized FinancialStatementContext (multi-source: FMP/Intrinio/EODHD/SEC XBRL/Yahoo)
    if (cache.financialStatementContextJson) {
      try {
        const fsCtx = JSON.parse(cache.financialStatementContextJson);
        if (fsCtx?.sourceUsed && fsCtx.sourceUsed !== 'None') {
          add(`NORMALIZED FINANCIAL STATEMENT CONTEXT (Source: ${fsCtx.sourceUsed}, confidence: ${fsCtx.sourceConfidence})`,
            JSON.stringify(fsCtx, null, 2));
        }
      } catch {}
    }

    // Normalized EarningsContext (multi-source with fallback)
    if (cache.earningsContextJson) {
      try {
        const ec = JSON.parse(cache.earningsContextJson);
        add(`NORMALIZED EARNINGS CONTEXT (Source: ${ec.sourceUsed || 'None'})`,
          JSON.stringify(ec, null, 2));
      } catch {}
    }

    // Valuation metrics from FMP
    if (cache.valuationMetricsJson) {
      try {
        const vm = JSON.parse(cache.valuationMetricsJson);
        const lines = [];
        if (vm.peRatio != null) lines.push(`P/E TTM: ${vm.peRatio?.toFixed?.(2) ?? vm.peRatio}`);
        if (vm.evToEbitda != null) lines.push(`EV/EBITDA: ${vm.evToEbitda?.toFixed?.(2) ?? vm.evToEbitda}`);
        if (vm.evToSales != null) lines.push(`EV/Sales: ${vm.evToSales?.toFixed?.(2) ?? vm.evToSales}`);
        if (vm.priceToSales != null) lines.push(`P/S: ${vm.priceToSales?.toFixed?.(2) ?? vm.priceToSales}`);
        if (vm.priceToBook != null) lines.push(`P/B: ${vm.priceToBook?.toFixed?.(2) ?? vm.priceToBook}`);
        if (vm.pegRatio != null) lines.push(`PEG: ${vm.pegRatio?.toFixed?.(2) ?? vm.pegRatio}`);
        if (vm.roe != null) lines.push(`ROE: ${(vm.roe * 100)?.toFixed?.(1) ?? vm.roe}%`);
        if (vm.roic != null) lines.push(`ROIC: ${(vm.roic * 100)?.toFixed?.(1) ?? vm.roic}%`);
        if (vm.debtToEquity != null) lines.push(`Debt/Equity: ${vm.debtToEquity?.toFixed?.(2) ?? vm.debtToEquity}`);
        if (vm.dividendYield != null) lines.push(`Div Yield: ${(vm.dividendYield * 100)?.toFixed?.(2) ?? vm.dividendYield}%`);
        if (lines.length) add("VALUATION METRICS (Source: FMP)", lines.join(' | '));
      } catch {}
    }

    // Financial statements raw data
    if (cache.financialStatementsJson) {
      try {
        const fs = JSON.parse(cache.financialStatementsJson);
        if (fs.income?.length) {
          const rows = fs.income.slice(0, 4).map(s =>
            `${s.date}: Rev $${(s.revenue/1e9)?.toFixed(2)}B | Op Inc $${(s.operatingIncome/1e9)?.toFixed(2)}B | Net Inc $${(s.netIncome/1e9)?.toFixed(2)}B | EPS $${s.eps} | GM ${(s.grossMargin*100)?.toFixed(1)}% | OM ${(s.operatingMargin*100)?.toFixed(1)}%`
          ).join('\n');
          add("INCOME STATEMENTS (Source: FMP, last 4 periods)", rows);
        }
        if (fs.cashFlow?.length) {
          const rows = fs.cashFlow.slice(0, 4).map(s =>
            `${s.date}: OCF $${(s.operatingCashFlow/1e9)?.toFixed(2)}B | FCF $${(s.freeCashFlow/1e9)?.toFixed(2)}B | CapEx $${(s.capex/1e9)?.toFixed(2)}B`
          ).join('\n');
          add("CASH FLOW STATEMENTS (Source: FMP, last 4 periods)", rows);
        }
        if (fs.balance?.length) {
          const rows = fs.balance.slice(0, 4).map(s =>
            `${s.date}: Assets $${(s.totalAssets/1e9)?.toFixed(2)}B | Equity $${(s.totalEquity/1e9)?.toFixed(2)}B | Debt $${(s.totalDebt/1e9)?.toFixed(2)}B | Cash $${(s.cash/1e9)?.toFixed(2)}B`
          ).join('\n');
          add("BALANCE SHEET (Source: FMP, last 4 periods)", rows);
        }
      } catch {}
    }

    add("REVENUE GROWTH ANALYSIS (Source: FMP)", cache.revenueGrowthSummary);
    add("MARGIN TRENDS (Source: FMP)", cache.marginTrendsSummary);
    add("FREE CASH FLOW (Source: FMP)", cache.freeCashFlowSummary);
    add("BALANCE SHEET SUMMARY (Source: FMP)", cache.balanceSheetSummary);
    add("DEBT & LIQUIDITY (Source: FMP)", cache.debtLiquiditySummary);

    // SEC filings
    if (cache.cik) add("SEC EDGAR (Source: Official SEC API)", `CIK: ${cache.cik}`);
    add("SEC 10-K ANNUAL FILING (Source: SEC EDGAR)", cache.tenKSummary);
    add("SEC 10-Q QUARTERLY FILING (Source: SEC EDGAR)", cache.tenQSummary);
    add("SEC 8-K MATERIAL EVENTS (Source: SEC EDGAR)", cache.eightKSummary);

    // Earnings call
    add("EARNINGS CALL TRANSCRIPT (Source: FMP)", cache.earningsTranscriptSummary);
    add(`MANAGEMENT TONE`, `Tone: ${cache.managementTone || "unknown"} (Source: Earnings transcript analysis)`);
    add("FORWARD GUIDANCE", cache.guidanceSummary);

    // News & sentiment
    add("COMPANY NEWS (Source: Finnhub, last 30 days)", cache.companyNewsSummary);
    add(`NEWS SENTIMENT`, `Sentiment: ${cache.newsSentiment || "unknown"}`);
    add("PRESS RELEASES (Source: Finnhub)", cache.pressReleaseSummary);

    // Insider & analyst
    add("INSIDER ACTIVITY (Source: Finnhub)", cache.insiderActivitySummary);
    add("ANALYST RECOMMENDATIONS (Source: Finnhub)", cache.analystRecommendationsSummary);
    if (cache.nextEarningsDate) add("NEXT EARNINGS DATE (Source: Finnhub)", cache.nextEarningsDate);

    // Synthesized signals
    add("KEY POSITIVE SIGNALS", cache.keyPositiveSignals);
    add("KEY NEGATIVE SIGNALS", cache.keyNegativeSignals);
    add("RED FLAGS", cache.redFlags);
    add("UPCOMING CATALYSTS", cache.catalysts);

    if (!cache.cik) {
      parts.push(`═══ DATA COVERAGE NOTE ═══\nSEC EDGAR filings unavailable — likely non-US company. Multi-source analysis still uses FMP financials, Finnhub news/insider data, and market data.`);
    }

    return parts.join('\n\n');
  };

  // Build a deterministic cache key from inputs + research version
  const buildCacheKey = (tickerUpper, tf, scenarios, thesis, researchVersion) => {
    const scenariosKey = JSON.stringify([...(scenarios || [])].sort());
    return [tickerUpper, tf, scenariosKey, (thesis || "").trim(), researchVersion || "none"].join("|");
  };

  // Round price target consistently
  const roundPriceTarget = (price) => {
    if (!price) return price;
    if (price >= 100) return Math.round(price);
    if (price >= 10) return Math.round(price * 2) / 2;
    return Math.round(price * 10) / 10;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!ticker.trim()) return;

    // Determine credit cost — credits gate everything (no plan tiers)
    const hasScenarios = selectedScenarios.length > 0 || customThesis.trim().length > 0;
    const isRefresh = !!forceRefresh;
    const actionLabel = hasScenarios
      ? "scenario_analysis"
      : isRefresh
      ? "refresh_analysis"
      : "standard_analysis";
    const actionCost = CREDIT_COSTS[actionLabel];

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

    const timeframeLabel = TIMEFRAME_LABELS[timeframe];
    const tickerUpper = ticker.trim().toUpperCase();

    // Step 1: Load market data + news + technicals in parallel
    setLoadingStep("market");
    let liveStock = null;
    let liveNews = null;
    let liveTechnical = null;
    try {
      const [stockRes, newsRes, techRes] = await Promise.all([
        base44.functions.invoke("fetchStockData", { ticker: tickerUpper }),
        base44.functions.invoke("fetchCompanyNews", { ticker: tickerUpper }).catch(() => ({ data: null })),
        base44.functions.invoke("fetchTechnicalAnalysis", { ticker: tickerUpper }).catch(() => ({ data: { available: false, message: "Technical chart data is limited for this ticker" } })),
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

    // Step 2: Check research cache (now available to all users)
    let cache = null;
    setLoadingStep("cache");

    try {
      const cacheRes = await base44.functions.invoke("fetchInstitutionalResearch", { ticker: tickerUpper, forceRefresh: forceRefresh });
      cache = cacheRes.data?.cache || null;
      setResearchCache(cache);

      if (cacheRes.data?.refreshed) {
        setIsRefreshingCache(true);
        setLoadingStep("refreshing");
        await new Promise(r => setTimeout(r, 800));
        setIsRefreshingCache(false);
      }
    } catch {
      // continue without cache
    }

    // Step 3: Check AnalysisCache — skip AI if same inputs + same research version
    const researchVersion = cache?.lastUpdated || "none";
    const cacheKey = buildCacheKey(tickerUpper, timeframe, selectedScenarios, customThesis, researchVersion);

    if (!forceRefresh) {
      setLoadingStep("applying");
      try {
        const existing = await base44.entities.AnalysisCache.filter({ cacheKey });
        const now = new Date();
        const valid = existing.find(e => e.expiresAt && new Date(e.expiresAt) > now);
        if (valid) {
          // Restore market snapshot if available
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

    // Step 4: Generate report
    setLoadingStep("generating");

    const researchBlock = buildResearchBlock(cache, liveStock);

    // Build company-specific context block
    const buildCompanyContext = (stock, news) => {
      if (!stock) return "";
      const lines = [
        `═══ COMPANY CONTEXT (REQUIRED — USE THIS IN ALL ANALYSIS) ═══`,
        `Company: ${stock.companyName} (${stock.ticker})`,
        stock.sector ? `Sector: ${stock.sector}` : null,
        stock.industry ? `Industry: ${stock.industry}` : null,
        `Market Cap Category: ${stock.marketCapLabel || 'Unknown'}`,
        stock.growthProfile !== 'unknown' ? `Growth Profile: ${stock.growthProfile.replace(/_/g,' ')} (Rev Growth YoY: ${stock.revenueGrowth != null ? ((stock.revenueGrowth*100).toFixed(1)+'%') : 'N/A'})` : null,
        stock.profitabilityProfile !== 'unknown' ? `Profitability: ${stock.profitabilityProfile.replace(/_/g,' ')} (Op Margin: ${stock.operatingMargins != null ? (stock.operatingMargins*100).toFixed(1)+'%' : 'N/A'}, Net Margin: ${stock.profitMargins != null ? (stock.profitMargins*100).toFixed(1)+'%' : 'N/A'})` : null,
        stock.valuationLevel !== 'unknown' ? `Valuation Level: ${stock.valuationLevel.replace(/_/g,' ')} (P/E: ${stock.trailingPE != null ? stock.trailingPE.toFixed(1)+'x' : 'N/A'}, P/S: ${stock.priceToSales != null ? stock.priceToSales.toFixed(2)+'x' : 'N/A'}, P/B: ${stock.priceToBook != null ? stock.priceToBook.toFixed(2)+'x' : 'N/A'})` : null,
        stock.momentum !== 'unknown' ? `Price Momentum: ${stock.momentum} (vs 52W High: ${stock.fiftyTwoWeekHigh ? ((stock.currentPrice/stock.fiftyTwoWeekHigh*100).toFixed(0)+'% of high') : 'N/A'})` : null,
        stock.eps != null ? `EPS: $${stock.eps.toFixed(2)}` : null,
        stock.beta != null ? `Beta (Volatility): ${stock.beta.toFixed(2)}` : null,
        stock.grossMargins != null ? `Gross Margin: ${(stock.grossMargins*100).toFixed(1)}%` : null,
        stock.totalRevenue ? `Total Revenue (TTM): $${(stock.totalRevenue/1e9).toFixed(2)}B` : null,
        stock.debtToEquity != null ? `Debt/Equity: ${stock.debtToEquity.toFixed(2)}` : null,
        stock.fiftyTwoWeekHigh && stock.fiftyTwoWeekLow ? `52W Range: $${stock.fiftyTwoWeekLow.toFixed(2)} – $${stock.fiftyTwoWeekHigh.toFixed(2)}` : null,
        stock.businessSummary ? `Business Summary: ${stock.businessSummary.slice(0,400)}...` : null,
      ].filter(Boolean);

      if (news) {
        if (news.sentiment) lines.push(`News Sentiment: ${news.sentiment}`);
        if (news.majorEvent) lines.push(`Major Recent Event: ${news.majorEvent}`);
        if (news.themes?.length) lines.push(`Key News Themes: ${news.themes.join(', ')}`);
        if (news.keyOpportunities?.length) lines.push(`Key Opportunities (from news): ${news.keyOpportunities.join(' | ')}`);
        if (news.keyRisks?.length) lines.push(`Key Risks (from news): ${news.keyRisks.join(' | ')}`);
        if (news.articles?.length) {
          lines.push(`Recent Headlines:`);
          news.articles.slice(0,5).forEach(a => lines.push(`  • ${a.title} [${a.publisher}]`));
        }
      }
      return lines.join('\n');
    };

    const companyContextBlock = buildCompanyContext(liveStock, liveNews);

    // Build technical analysis context for AI prompt
    const buildTechnicalBlock = (tech) => {
      if (!tech?.available) return "TECHNICAL ANALYSIS: Not available for this ticker.";
      const { trend, indicators, levels, currentPrice: cp, sourceUsed: src } = tech;
      const fib = levels?.fibonacci || {};
      const support = levels?.support || [];
      const resistance = levels?.resistance || [];
      return `═══ TECHNICAL ANALYSIS (Source: ${src}, last 180 trading days) ═══
Current Price: $${cp?.toFixed(2)}
Trend Direction: ${trend?.direction}
Momentum: ${trend?.momentum}
SMA 20: ${indicators?.sma20?.toFixed(2) ?? 'N/A'}
SMA 50: ${indicators?.sma50?.toFixed(2) ?? 'N/A'}
SMA 200: ${indicators?.sma200?.toFixed(2) ?? 'N/A'}
RSI (14): ${indicators?.rsi?.toFixed(1) ?? 'N/A'}
MACD: ${indicators?.macd ? `${indicators.macd.trend} (hist ${indicators.macd.histogram.toFixed(2)})` : 'N/A'}
Volume Trend: ${indicators?.volumeTrend}
Recent Swing High: $${indicators?.recentSwingHigh?.toFixed(2)}
Recent Swing Low: $${indicators?.recentSwingLow?.toFixed(2)}
Support Levels: ${support.length ? support.map(s => `$${s.toFixed(2)}`).join(', ') : 'N/A'}
Resistance Levels: ${resistance.length ? resistance.map(r => `$${r.toFixed(2)}`).join(', ') : 'N/A'}
Fibonacci Retracement (from swing low to swing high):
  23.6%: $${fib.level_236?.toFixed(2)}
  38.2%: $${fib.level_382?.toFixed(2)}
  50.0%: $${fib.level_500?.toFixed(2)}
  61.8%: $${fib.level_618?.toFixed(2)}
  78.6%: $${fib.level_786?.toFixed(2)}`;
    };

    const technicalBlock = buildTechnicalBlock(liveTechnical);

    const scenarioBlock = selectedScenarios.length > 0 || customThesis
      ? `\nINVESTOR MACRO SCENARIOS:\n${selectedScenarios.map((s) => `- ${s}`).join("\n")}${customThesis ? `\nCustom Thesis: "${customThesis}"` : ""}\n`
      : "";

    let sourceCoverage = {};
    try { sourceCoverage = cache?.sourceCoverageJson ? JSON.parse(cache.sourceCoverageJson) : {}; } catch {}

    // Normalize: entries can be string (legacy) or object { status, sourceUsed, reason }
    const covStatus = (k) => {
      const e = sourceCoverage[k];
      if (!e) return 'missing';
      return typeof e === 'string' ? e : (e.status || 'missing');
    };
    const covSource = (k) => {
      const e = sourceCoverage[k];
      if (!e || typeof e === 'string') return null;
      return e.sourceUsed || null;
    };

    // Parse normalized contexts
    let fsContext = null, earningsContext = null;
    try { fsContext = cache?.financialStatementContextJson ? JSON.parse(cache.financialStatementContextJson) : null; } catch {}
    try { earningsContext = cache?.earningsContextJson ? JSON.parse(cache.earningsContextJson) : null; } catch {}

    const fsSourceUsed = fsContext?.sourceUsed && fsContext.sourceUsed !== 'None' ? fsContext.sourceUsed : null;
    const earningsSourceUsed = earningsContext?.sourceUsed && earningsContext.sourceUsed !== 'None' ? earningsContext.sourceUsed : null;

    const sourcesUsed = [
      covStatus('marketData') === 'available' ? `Market Data (${covSource('marketData') || 'Finnhub'})` : (liveStock ? "Yahoo Finance" : null),
      fsSourceUsed ? `Financial Statements (${fsSourceUsed})` : null,
      covStatus('valuationMetrics') === 'available' ? `Valuation (${covSource('valuationMetrics') || 'FMP'})` : null,
      cache?.cik ? "SEC EDGAR" : null,
      cache?.tenKSummary ? "SEC 10-K" : null,
      cache?.tenQSummary ? "SEC 10-Q" : null,
      cache?.eightKSummary ? "SEC 8-K" : null,
      earningsSourceUsed ? `Earnings (${earningsSourceUsed})` : null,
      covStatus('news') === 'available' ? `News (${covSource('news') || 'Finnhub'})` : null,
      covStatus('insiderActivity') === 'available' ? "Finnhub Insider Data" : null,
      covStatus('analystRecommendations') === 'available' ? "Finnhub Analyst Trends" : null,
    ].filter(Boolean);

    const hasSEC = !!(cache?.cik);
    const hasFinnhub = covStatus('marketData') === 'available' || covStatus('news') === 'available';
    const hasFMP = fsSourceUsed === 'FMP';
    const hasTranscript = covStatus('earningsTranscript') === 'available';
    const confidenceScore = cache?.sourceConfidenceScore ?? 0;

    // Extract filing dates from secFilingsJson
    let latestTenKDate = '', latestTenQDate = '', latestEightKDate = '';
    if (cache?.secFilingsJson) {
      try {
        const filings = JSON.parse(cache.secFilingsJson);
        latestTenKDate = filings.find(f => f.type === '10-K')?.date || '';
        latestTenQDate = filings.find(f => f.type === '10-Q')?.date || '';
        latestEightKDate = filings.find(f => f.type === '8-K')?.date || '';
      } catch {}
    }

    const prompt = `You are the world's best equity research analyst — a disciplined institutional analyst with deep expertise in fundamental analysis, SEC filing interpretation, and valuation. You work with the rigor of Goldman Sachs / Morgan Stanley equity research.

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
2. ANTI-HALLUCINATION RULE: Every major conclusion must cite the SOURCE CATEGORY in brackets. Available source tags: [FMP], [Intrinio], [EODHD], [SEC EDGAR XBRL], [Yahoo Finance], [Finnhub], [SEC 10-K], [SEC 10-Q], [SEC 8-K], [Earnings Transcript], [Earnings Calendar], [Insider Data], [Analyst Estimates], [Scenario Assumption]. ALWAYS use the actual sourceUsed from the normalized FinancialStatementContext and EarningsContext above (e.g., if sourceUsed="EODHD", cite [EODHD]).
3. NEVER say data is "missing" if the normalized FinancialStatementContext or EarningsContext above contains data — those use a fallback chain (FMP → Intrinio → EODHD → SEC EDGAR → Yahoo). Only say "Not available from connected sources" when ALL fallback sources failed.
3a. EARNINGS INSIGHTS RULE (CRITICAL): NEVER say earnings are "missing". Earnings insights are ALWAYS available from at least one source: full transcript, earnings press release, SEC 8-K filings, Finnhub/EODHD earnings data, or news summaries. If full transcript is unavailable, write exactly: "Full transcript not available; analysis based on earnings release and available disclosures." Then USE the structured EarningsContext (transcriptAvailable, earningsPressReleaseSummary, revenueBeatMiss, epsBeatMiss, managementGuidance, keyThemes, sentiment, sourceUsed) to provide commentary. The Earnings Insights section MUST always be generated.
4. Connect filings to valuation — explain HOW specific data points affect the price target.
5. Connect risks to the price target — explain WHY specific risks reduce/increase the target ($ or % impact).
6. Clearly separate FACTS (from sources) from ASSUMPTIONS (analyst reasoning marked as [Scenario Assumption]).
7. Price target MUST use a specific methodology (DCF with stated WACC/terminal growth, EV/EBITDA with stated peer multiples, P/E, P/S) — cite the source of the multiple/metric used.
8. For non-US companies without SEC filings: use FMP financial statements as primary source, state limitations clearly.
9. Red flags must be fact-based — cite the specific source.
10. Never produce vague language like "strong fundamentals" without citing specific numbers and source.
11. Multi-source preference: when sources disagree, prefer this priority: Market price (Finnhub > Yahoo > FMP) | Financial statements (FMP > SEC XBRL > Yahoo) | Filings (SEC > Finnhub > FMP) | Transcripts (FMP only) | News (Finnhub > Yahoo).
12. Research Confidence Score: ${cache?.sourceConfidenceScore ?? 'N/A'}/100. If below 50, explicitly note "Limited source coverage" in the executive summary.
13. Sources used: ${sourcesUsed.join(", ") || "General knowledge + internet research"}
14. TECHNICAL VALIDATION RULE: Use the TECHNICAL ANALYSIS data block above to populate Section 7 (Technical Validation of Price Target). You MUST reference the EXACT support and resistance prices from the data block. Specifically:
    - Identify the nearest resistance ABOVE current price that the stock must break to reach the base price target. State it as: "Stock needs to break above $X resistance to reach the $Y target."
    - Identify the nearest support BELOW current price that limits downside risk. State it as: "Support at $Z limits downside risk."
    - Cross-reference the price target against Fibonacci levels (does the target align with a Fib retracement level?).
    - Cross-reference the price target against the SMA 20/50/200 (is the target above or below key MAs? does it require a golden/death cross?).
    - State explicitly whether the technical setup supports, partially supports, or does not support the price target.
    - All cited price levels MUST come from the TECHNICAL ANALYSIS data block — do not invent levels.

COMPANY-SPECIFICITY RULES — MANDATORY:
11. You MUST base your analysis on the CompanyContext above. Do NOT generate generic analysis.
12. Reference the SECTOR (${liveStock?.sector || 'Unknown'}) and INDUSTRY (${liveStock?.industry || 'Unknown'}) explicitly throughout — sector-specific dynamics MUST shape the thesis.
13. Adjust valuation multiples based on the company's growth profile (${liveStock?.growthProfile || 'unknown'}), size (${liveStock?.marketCapLabel || 'unknown'}), and profitability (${liveStock?.profitabilityProfile || 'unknown'}). A high-growth SaaS company gets higher multiples than a mature industrial. A loss-making startup uses scenario-based valuation, not P/E.
14. Incorporate recent news themes (${liveNews?.themes?.join(', ') || 'N/A'}) and sentiment (${liveNews?.sentiment || 'N/A'}) into the thesis and catalyst sections.
15. The business model of THIS company must drive the risk factors — do not use generic risks that apply to any company.
16. Do NOT reuse generic phrases ("strong fundamentals", "proven track record") — every statement must be company-specific with numbers.
17. If two companies in different sectors were given the same data, your output MUST look completely different. This report should only make sense for ${liveStock?.companyName || tickerUpper} in the ${liveStock?.sector || 'its'} sector.

DETERMINISTIC PRICE TARGET RULES — FOLLOW EXACTLY:
- You MUST derive THREE distinct price targets: bearCaseTarget, baseCaseTarget, bullCaseTarget
- Use FIXED probability weights: Bear 25%, Base 50%, Bull 25%
- Final weighted price target formula: (bearCaseTarget × 0.25) + (baseCaseTarget × 0.50) + (bullCaseTarget × 0.25)
- Round the final target: stocks ≥$100 → nearest $1; stocks $10–$99.99 → nearest $0.50; stocks <$10 → nearest $0.10
- If you receive the same input data again, you MUST produce the same price targets. Do NOT invent new assumptions.
- Use the current price from the market data snapshot above as your baseline. Do not estimate it.
- State your WACC, terminal growth rate, and/or peer multiples explicitly — do not change them between runs with the same data.

Return a JSON with:
- recommendation: "Buy", "Hold", or "Sell"
- confidence: "High", "Medium", or "Low"
- timeframe: "${timeframeLabel}"
- thesis: single compelling one-line investment thesis (specific, cite 1-2 key data points)
- bearCaseTarget: number (bear case price — 25% weight)
- baseCaseTarget: number (base case price — 50% weight)
- bullCaseTarget: number (bull case price — 25% weight)
- priceTarget: number — computed as (bearCaseTarget×0.25 + baseCaseTarget×0.50 + bullCaseTarget×0.25), rounded per rules above
- currentPrice: number (use the exact current price from market data above)
- updownPct: ((priceTarget - currentPrice) / currentPrice) * 100
- priceTargetRationale: array of exactly 3 strings, each explaining one pillar of the price target with specific methodology and numbers
- report: full markdown report using EXACTLY the structure below

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REPORT STRUCTURE (follow exactly):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Equity Research Report: {Full Company Name} ({TICKER})
**Rating:** [Buy/Hold/Sell] | **Price Target:** $X | **Current Price:** $X | **Upside/Downside:** X% | **Timeframe:** ${timeframeLabel} | **Confidence:** [High/Medium/Low]

---

## Company Snapshot
| Field | Detail |
|-------|--------|
| Sector | ${liveStock?.sector || 'N/A'} |
| Industry | ${liveStock?.industry || 'N/A'} |
| Market Cap | ${liveStock?.marketCapLabel || 'N/A'} |
| Growth Profile | [state growth profile with specific revenue growth %] |
| Profitability | [state margin profile with operating/net margin %] |
| Valuation | [state valuation level with P/E, P/S, or other relevant multiples] |
| Business Model | [1-2 sentences: how this company makes money, specific to its sector] |

**What Makes This Company Unique:**
- [Competitive positioning specific to this company — NOT generic]
- [Primary growth driver unique to this business]
- [Business model moat or differentiator]
- [Key metric that defines success in this specific sector]

---

## Recent Developments
${liveNews?.majorEvent ? `**Major Event:** ${liveNews.majorEvent}` : ''}
${liveNews?.themes?.length ? `**Key Themes:** ${liveNews.themes.join(' · ')}` : ''}

**News Analysis:**
- [Most impactful recent development for this company with investment implication]
- [Second key recent event with market impact]
${liveNews?.keyOpportunities?.length ? `\n**Positive Signals:** ${liveNews.keyOpportunities.join(' | ')}` : ''}
${liveNews?.keyRisks?.length ? `\n**Negative Signals:** ${liveNews.keyRisks.join(' | ')}` : ''}

---

## Executive Summary
> [One compelling paragraph — the core investment thesis in 3-4 sentences. Be specific, cite key numbers.]

**Key Bull Points:**
- [specific, data-backed reason 1]
- [specific, data-backed reason 2]
- [specific, data-backed reason 3]

**Key Bear Points / Risks:**
- [specific, data-backed risk 1]
- [specific, data-backed risk 2]

---

## Data Sources & Confidence
**Research Confidence Score: ${confidenceScore}/100** ${confidenceScore >= 90 ? '— Excellent coverage' : confidenceScore >= 70 ? '— Strong coverage' : confidenceScore >= 50 ? '— Moderate coverage' : '— Limited coverage'}

| Source | Status | Source Used | Used For |
|--------|--------|-------------|----------|
| Market Data | ${hasFinnhub ? "✅ Available" : "⚠️ Limited"} | ${covSource('marketData') || 'Finnhub/Yahoo'} | Quote, market cap, range |
| Financial Statements | ${fsSourceUsed ? "✅ Available" : "❌ Missing"} | ${fsSourceUsed || 'None'} | Income, balance, cash flow (multi-source fallback chain) |
| Valuation Metrics | ${covStatus('valuationMetrics') === 'available' ? "✅ Available" : "⚠️ Partial"} | ${covSource('valuationMetrics') || 'FMP'} | P/E, EV/EBITDA, P/S, ROE, ROIC |
| SEC EDGAR Filings | ${hasSEC ? "✅ Available" : "ℹ️ Non-US / Not found"} | ${hasSEC ? 'SEC EDGAR' : 'N/A'} | ${hasSEC ? `10-K: ${latestTenKDate || 'N/A'} \\| 10-Q: ${latestTenQDate || 'N/A'} \\| 8-K: ${latestEightKDate || 'N/A'}` : "Using normalized financial context as primary"} |
| Earnings Transcript | ${hasTranscript ? "✅ Available" : (earningsSourceUsed ? "⚠️ Partial (fallback)" : "❌ Missing")} | ${earningsSourceUsed || 'None'} | ${hasTranscript ? 'Management tone, guidance' : 'Earnings record, beat/miss, press releases'} |
| Company News | ${covStatus('news') === 'available' ? "✅ Available" : "⚠️ Limited"} | ${covSource('news') || 'Finnhub/EODHD'} | Last 30 days |
| Insider Activity | ${covStatus('insiderActivity') === 'available' ? "✅ Available" : "⚠️ Not available"} | Finnhub | Buy/sell patterns |
| Analyst Trends | ${covStatus('analystRecommendations') === 'available' ? "✅ Available" : "⚠️ Not available"} | Finnhub | Consensus distribution |

---

## 1. Filing Intelligence Summary
### Annual Report (10-K / Equivalent) — Filed: ${latestTenKDate || 'N/A'} [Source: SEC EDGAR]
[3-4 specific insights with numbers from 10-K or equivalent annual report. If non-US, note the equivalent filing used.]

### Quarterly Report (10-Q / Equivalent) — Filed: ${latestTenQDate || 'N/A'} [Source: SEC EDGAR]
[3-4 specific quarterly insights — revenue, margins, cash flow vs prior period]

### Material Events (8-K / Recent Announcements)
[2-3 most significant recent material events — acquisitions, guidance, leadership changes, legal events]

### What Changed vs Prior Period
- [Key change 1 with specific before/after data]
- [Key change 2]

---

## 2. Fundamental Analysis
### Revenue & Growth
[Revenue trend with specific figures from XBRL/filings. CAGR. Acceleration/deceleration. Growth drivers.]

### Margin Analysis
| Metric | Latest | Prior Year | Trend |
|--------|--------|------------|-------|
| Gross Margin | X% | X% | ↑/↓ |
| Operating Margin | X% | X% | ↑/↓ |
| Net Margin | X% | X% | ↑/↓ |

[2-3 sentences explaining margin drivers and trajectory]

### Free Cash Flow
[FCF analysis — operating cash flow, capex, FCF conversion, quality of earnings]

### Balance Sheet & Debt
[Total assets, equity, net cash/debt position, debt/EBITDA, liquidity. Flag any concerns.]

---

## 3. Price Target Analysis
| Scenario | Price Target | Upside/Downside | Probability Weight |
|----------|-------------|-----------------|-------------------|
| 🟢 Bull Case | $X | +X% | X% |
| ⚪ Base Case | $X | +X% | X% |
| 🔴 Bear Case | $X | -X% | X% |
| **Weighted Average** | **$X** | **X%** | — |

**Primary Valuation Method:** [DCF with X% WACC and X% terminal growth / X.Xx EV/EBITDA vs peers / Xx P/E / Xx P/S — be specific]
**Supporting Method:** [second valuation cross-check]
**Key Assumptions:** [state the 2-3 most important assumptions driving the base case]

---

## 4. Earnings Insights [Source: ${earningsSourceUsed || 'None'}]
${hasTranscript ? '' : '> **Full transcript not available; analysis based on earnings release and available disclosures.**\n'}
**Overall Tone: [${cache?.managementTone || 'improving / stable / worsening'}]** | **Sentiment: [${earningsContext?.sentiment || 'neutral'}]**

**Beat / Miss:**
- Revenue: ${earningsContext?.revenueBeatMiss || 'Not available from connected sources'}
- EPS: ${earningsContext?.epsBeatMiss || 'Not available from connected sources'}

**Key Themes:**
${earningsContext?.keyThemes || '[Surface 2-4 themes from whichever source is available — transcript, press release, 8-K, or news]'}

**Forward Guidance:** ${earningsContext?.managementGuidance || '[Surface guidance from whichever source is available]'}

[3-4 sentences synthesizing management messaging using whatever source is available (transcript, press release, 8-K filing, or news summaries). Cite the source explicitly. Do NOT say "missing" — always provide insights based on available disclosures.]

**Credibility Check:** [Are management claims supported by actual financial results? Note any contradictions.]

---

## 4b. News & Catalyst Analysis [Source: Finnhub Company News]
**News Sentiment:** ${cache?.newsSentiment || 'unknown'}

[2-3 sentences synthesizing the major news themes from the past 30 days. Cite specific headlines.]

**Upcoming Catalysts:**
- ${cache?.nextEarningsDate ? `Next Earnings: ${cache.nextEarningsDate} [Source: Finnhub]` : 'Next Earnings: Not available from connected sources'}
- [Specific upcoming catalyst with date if known]
- [Macro/regulatory catalyst]

---

## 4c. Insider & Analyst Sentiment
**Insider Activity [Source: Finnhub]:** [Cite specific insider trades from data, or state "No recent insider activity"]

**Analyst Recommendation Trend [Source: Finnhub]:** [Cite specific consensus from recent periods, or state "Not available from connected sources"]

---

## 5. Red Flags & Risk Deep Dive
${cache?.redFlags ? `**Filing-Based Red Flags:**\n${cache.redFlags}\n` : ''}
### Key Risk Factors
| Risk | Severity | Impact on Price Target |
|------|----------|----------------------|
| [Risk 1 from filings] | High/Med/Low | -$X or -X% |
| [Risk 2] | High/Med/Low | -$X or -X% |
| [Risk 3 macro] | High/Med/Low | -$X or -X% |

---

## 6. Bull vs Bear Case
### 🟢 Bull Case — $X Target
- [Specific catalyst 1 with data]
- [Specific catalyst 2 with data]
- [What needs to go right]

### 🔴 Bear Case — $X Target
- [Specific risk 1 with data]
- [Specific risk 2 with data]
- [What could go wrong]

---

## 7. Technical Validation of Price Target [Source: ${liveTechnical?.sourceUsed || 'None'}]
${liveTechnical?.available ? `
**Trend Direction:** ${liveTechnical.trend?.direction} | **Momentum:** ${liveTechnical.trend?.momentum} | **Volume Trend:** ${liveTechnical.indicators?.volumeTrend}

| Indicator | Reading |
|-----------|---------|
| Current Price | $${liveTechnical.currentPrice?.toFixed(2)} |
| Key Support | [nearest support below current price] |
| Key Resistance | [nearest resistance above current price] |
| Breakout Level Required | [resistance level price target must clear] |
| Downside Risk Level | [support level that would invalidate thesis] |
| RSI (14) | ${liveTechnical.indicators?.rsi?.toFixed(1) ?? 'N/A'} — [overbought / neutral / oversold interpretation] |
| MACD | ${liveTechnical.indicators?.macd?.trend ?? 'N/A'} — [crossover interpretation] |
| 50-day MA | $${liveTechnical.indicators?.sma50?.toFixed(2) ?? 'N/A'} |
| 200-day MA | $${liveTechnical.indicators?.sma200?.toFixed(2) ?? 'N/A'} |

**Verdict:** [Choose ONE — exact wording required]:
- "Technical setup supports the price target"
- "Technical setup partially supports the price target"
- "Technical setup does not currently support the price target"

[2-3 sentences explaining: does the chart structure support the price target? What breakout level needs to be cleared? What is the downside technical risk? How do RSI/MACD/MAs back this view? Cite specific price levels.]

**Technical Risk Level:** [Low / Medium / High]
` : `\n> **Technical chart data is limited for this ticker** — fundamental analysis only.\n`}

---

${selectedScenarios.length > 0 || customThesis ? `## 8. Scenario & Thesis Analysis
**User Scenarios:** ${selectedScenarios.join(", ") || "Custom"}
${customThesis ? `**Custom Thesis:** "${customThesis}"` : ""}

**Thesis Validation:** [Supported / Partially Supported / Not Supported — explain why based on actual filing data]

**Scenario Impact on Price Target:**
[How each scenario shifts revenue, margins, valuation multiple, and price target. Be specific with $ or % impact.]

---

## 9. Catalyst Watch
` : `## 8. Catalyst Watch
`}
**Upcoming ${timeframeLabel} Catalysts:**
- [Next earnings date if known / estimated]
- [Product launch, regulatory decision, or guidance update expected]
- [8-K type event to watch]
- [Macro catalyst relevant to this name]

---

## Final Verdict
> **[Buy / Hold / Sell] | Price Target: $X | Upside: X% | Confidence: [High/Medium/Low] | Timeframe: ${timeframeLabel}**

[2-3 sentence final verdict that connects the filing evidence, valuation, risks, and catalysts into a clear investment conclusion. Be decisive. Do not hedge.]

*Sources: ${sourcesUsed.join(", ") || "General knowledge + internet research"} | Confidence: ${confidenceScore}/100 | ${hasSEC ? `SEC EDGAR CIK: ${cache?.cik}` : "Non-US — FMP financials used"} | Generated ${new Date().toLocaleDateString()}*`;

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
        required: ["recommendation", "confidence", "timeframe", "thesis", "bearCaseTarget", "baseCaseTarget", "bullCaseTarget", "priceTarget", "currentPrice", "updownPct", "priceTargetRationale", "report"],
      },
    });

    // Coerce priceTargetRationale items to strings (LLM sometimes returns objects)
    if (Array.isArray(res.priceTargetRationale)) {
      res.priceTargetRationale = res.priceTargetRationale
        .map(item => {
          if (item == null) return null;
          if (typeof item === 'string') return item;
          if (typeof item === 'object') {
            // Common shapes: {pillar, rationale} or {title, description}
            const parts = Object.values(item).filter(v => typeof v === 'string');
            return parts.length ? parts.join(' — ') : JSON.stringify(item);
          }
          return String(item);
        })
        .filter(Boolean);
    }

    // Always anchor to live price and recompute weighted target
    if (liveStock?.currentPrice) {
      res.currentPrice = liveStock.currentPrice;
      // Recompute weighted target from scenarios
      if (res.bearCaseTarget && res.baseCaseTarget && res.bullCaseTarget) {
        const weighted = (res.bearCaseTarget * 0.25) + (res.baseCaseTarget * 0.50) + (res.bullCaseTarget * 0.25);
        res.priceTarget = roundPriceTarget(weighted);
      }
      res.updownPct = ((res.priceTarget - res.currentPrice) / res.currentPrice) * 100;
    }

    setResult(res);
    setCacheHit({ fromCache: false, cachedAt: new Date().toISOString() });

    if (subscription) {
      const newBalance = Math.max(0, (subscription.creditsBalance ?? 0) - actionCost);
      const newTotalUsed = (subscription.totalCreditsUsed ?? 0) + actionCost;
      base44.entities.UserSubscription.update(subscription.id, {
        creditsBalance: newBalance,
        totalCreditsUsed: newTotalUsed,
      });
      setSubscription((prev) => ({ ...prev, creditsBalance: newBalance, totalCreditsUsed: newTotalUsed }));

      // Log spend transaction
      base44.entities.CreditTransaction.create({
        userId: subscription.userId,
        type: "spend",
        action: actionLabel,
        credits: -actionCost,
        balanceAfter: newBalance,
        metadata: JSON.stringify({ ticker: tickerUpper, timeframe }),
      }).catch(() => {});
    }

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

    // Save to AnalysisCache for deterministic reuse
    const scenariosKey = JSON.stringify([...selectedScenarios].sort());
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days
    const marketDataSnapshot = liveStock ? JSON.stringify(liveStock) : null;
    base44.entities.AnalysisCache.create({
      ticker: tickerUpper,
      timeframe,
      scenariosKey,
      customThesis: customThesis || "",
      cacheKey,
      researchCacheVersion: researchVersion,
      marketDataSnapshot,
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
    }).catch(() => {}); // non-blocking

    setSelectedReportId(saved.id);
    setReports((prev) => [saved, ...prev]);
    setLoadingStep(null);
    setIsLoading(false);
    setForceRefresh(false);
  };

  const handleRefreshAnalysis = () => {
    setForceRefresh(true);
    // Trigger submit programmatically after state update
    setTimeout(() => {
      document.getElementById("analysis-form")?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    }, 50);
  };

  const handleRefreshResearch = async () => {
    if (!ticker.trim() || !result) return;
    setIsPanelRefreshing(true);
    try {
      const cacheRes = await base44.functions.invoke("fetchInstitutionalResearch", {
        ticker: ticker.trim().toUpperCase(),
        forceRefresh: true,
      });
      setResearchCache(cacheRes.data?.cache || null);
    } catch (_) {}
    setIsPanelRefreshing(false);
  };

  const handleAddToPortfolio = async () => {
    if (!user || !result) return;
    const tickerSymbol = ticker.trim().toUpperCase();
    await base44.entities.PortfolioHolding.create({
      userId: user.email,
      ticker: tickerSymbol,
      companyName: stockData?.companyName || tickerSymbol,
      addedAt: new Date().toISOString(),
    });
    setAddedToPortfolio(true);
  };

  const handleSelectReport = (report) => {
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
      report: report.reportContent,
    });
  };

  const handleNewAnalysis = () => {
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
  };

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Top Bar */}
      <header className="h-14 shrink-0 border-b border-border bg-card/80 backdrop-blur-md flex items-center px-4 gap-3 z-20">
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <Activity className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-base font-bold tracking-tight text-foreground hidden sm:block">AI-Investor</span>
        </div>
        <div className="h-5 w-px bg-border hidden sm:block mx-1" />
        <Button
          size="sm"
          variant="ghost"
          className="hidden sm:flex gap-1.5 text-muted-foreground hover:text-foreground h-8"
          onClick={handleNewAnalysis}
        >
          <Plus className="h-3.5 w-3.5" />
          New Analysis
        </Button>
        <div className="flex-1" />
        <Link to="/portfolio">
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground h-8">
            <Briefcase className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Portfolio</span>
          </Button>
        </Link>
        {subscription && (
          <UsageBadge creditsBalance={subscription.creditsBalance ?? 0} />
        )}
        <div className="h-7 w-7 rounded-full bg-secondary flex items-center justify-center">
          <User className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
      </header>

      {showUpgradeModal && (
        <UpgradeModal
          creditsBalance={subscription?.creditsBalance ?? 0}
          creditsNeeded={selectedScenarios.length > 0 || customThesis.trim().length > 0 ? 2 : 1}
          onClose={() => setShowUpgradeModal(false)}
        />
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col w-60 xl:w-64 shrink-0 bg-sidebar border-r border-sidebar-border overflow-hidden">
          <div className="p-3 border-b border-sidebar-border">
            <Button className="w-full gap-2 h-9 text-sm font-medium" onClick={handleNewAnalysis}>
              <Plus className="h-4 w-4" />
              New Analysis
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <ReportHistory reports={reports} selectedId={selectedReportId} onSelect={handleSelectReport} />
          </div>
          <div className="p-3 border-t border-sidebar-border">
            <Link to="/portfolio" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors text-sm">
              <Briefcase className="h-4 w-4" />
              My Portfolio
            </Link>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-5">

            {/* Smart credit prompts */}
            {subscription && !isLoading && (isOutOfCredits || isLowCredits) && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg border text-xs ${
                  isOutOfCredits
                    ? "bg-rose-500/8 border-rose-500/20 text-rose-400"
                    : "bg-amber-400/8 border-amber-400/20 text-amber-400"
                }`}
              >
                <span>
                  {isOutOfCredits
                    ? `⚡ You're out of credits. Purchase more credits to continue.`
                    : `⚡ You're running low — only ${creditsBalance} credit${creditsBalance !== 1 ? "s" : ""} left. Top up to continue.`}
                </span>
                <Link to="/pricing">
                  <Button variant="ghost" size="sm" className={`h-7 text-xs shrink-0 font-semibold ${isOutOfCredits ? "text-rose-400 hover:text-rose-300" : "text-amber-400 hover:text-amber-300"}`}>
                    Buy Credits →
                  </Button>
                </Link>
              </motion.div>
            )}

            <AnalysisForm
              ticker={ticker}
              setTicker={setTicker}
              timeframe={timeframe}
              setTimeframe={setTimeframe}
              onSubmit={handleSubmit}
              isLoading={isLoading}
              formId="analysis-form"
              creditCost={selectedScenarios.length > 0 || customThesis.trim().length > 0 ? 2 : 1}
              creditsBalance={subscription?.creditsBalance ?? null}
            />

            <ScenarioInputs
              selectedScenarios={selectedScenarios}
              setSelectedScenarios={setSelectedScenarios}
              customThesis={customThesis}
              setCustomThesis={setCustomThesis}
            />

            {/* Mobile report history */}
            {reports.length > 0 && !isLoading && !result && (
              <div className="lg:hidden">
                <ReportHistory reports={reports} selectedId={selectedReportId} onSelect={handleSelectReport} />
              </div>
            )}

            {/* Loading Steps */}
            {isLoading && loadingStep && (
              <LoadingSteps currentStep={loadingStep} isRefreshingCache={isRefreshingCache} />
            )}

            {/* Price Target — shown above company bar */}
            {result && !isLoading && (
              <PriceTargetCard
                priceTarget={result.priceTarget}
                currentPrice={result.currentPrice}
                updownPct={result.updownPct}
                timeframe={result.timeframe}
                rationale={result.priceTargetRationale}
              />
            )}

            {/* Stock Summary Bar — shown during and after loading */}
            {(stockLoading || stockData || stockError) && (
              <StockSummaryBar stockData={stockData} isLoading={stockLoading} error={stockError} />
            )}

            {/* Result */}
            {result && !isLoading && (
              <div className="space-y-4">
                {/* Cache hit / fresh banner */}
                {cacheHit && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg border text-xs ${
                      cacheHit.fromCache
                        ? "bg-primary/8 border-primary/20 text-primary"
                        : "bg-emerald-500/8 border-emerald-500/20 text-emerald-400"
                    }`}
                  >
                    <span>
                      {cacheHit.fromCache
                        ? `Using saved analysis from ${new Date(cacheHit.cachedAt).toLocaleString()}. Inputs and research sources unchanged.`
                        : `New analysis generated using latest available data.`}
                    </span>
                    {cacheHit.fromCache && ticker && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRefreshAnalysis}
                        className="gap-1.5 h-7 text-xs shrink-0 text-primary hover:text-primary"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Refresh Analysis
                      </Button>
                    )}
                  </motion.div>
                )}

                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center justify-between flex-wrap gap-2"
                >
                  <Button
                    variant={addedToPortfolio ? "secondary" : "outline"}
                    size="sm"
                    onClick={handleAddToPortfolio}
                    disabled={addedToPortfolio}
                    className="gap-2 h-8 text-xs"
                  >
                    <Briefcase className="h-3.5 w-3.5" />
                    {addedToPortfolio ? "Added ✓" : "Add to Portfolio"}
                  </Button>
                  <ReportActions
                    reportContent={result.report}
                    ticker={ticker}
                    recommendation={result.recommendation}
                    priceTarget={result.priceTarget}
                    updownPct={result.updownPct}
                  />
                </motion.div>
                <AnalysisResult result={result} />
              </div>
            )}

            {/* AI Technical Chart + Support Panel — shown after result */}
            {result && !isLoading && technicalData && (
              <>
                <AITechnicalChart
                  technical={technicalData}
                  priceTarget={result.priceTarget}
                  bullCaseTarget={result.bullCaseTarget}
                  bearCaseTarget={result.bearCaseTarget}
                />
                <TechnicalSupportPanel
                  technical={technicalData}
                  priceTarget={result.priceTarget}
                  currentPrice={result.currentPrice}
                />
              </>
            )}

            {/* Research Coverage Dashboard — shown as soon as cache loads (multi-source confidence) */}
            {researchCache && (
              <ResearchCoverageDashboard
                cache={researchCache}
                isRefreshing={isPanelRefreshing}
                onRefresh={handleRefreshResearch}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}