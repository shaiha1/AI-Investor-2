/**
 * analysisService.js
 * Pure utility functions for AI Investor analysis pipeline.
 * Extracted from Dashboard.jsx to keep the component clean.
 */

// ─── Price helpers ───────────────────────────────────────────────────────────

export const roundPriceTarget = (price) => {
  if (!price) return price;
  if (price >= 100) return Math.round(price);
  if (price >= 10) return Math.round(price * 2) / 2;
  return Math.round(price * 10) / 10;
};

// ─── Cache key ────────────────────────────────────────────────────────────────

export const buildCacheKey = (tickerUpper, tf, scenarios, thesis, researchVersion) => {
  const scenariosKey = JSON.stringify([...(scenarios || [])].sort());
  return [tickerUpper, tf, scenariosKey, (thesis || "").trim(), researchVersion || "none"].join("|");
};

// ─── Research block builders ──────────────────────────────────────────────────

export const buildResearchBlock = (cache, liveStock) => {
  const parts = [];

  if (liveStock?.currentPrice) {
    parts.push(`═══ LIVE MARKET DATA (Source: Finnhub → Yahoo Finance fallback) ═══
Company: ${liveStock.companyName}
Current Price: ${liveStock.currency || "USD"} ${liveStock.currentPrice.toFixed(2)}
Daily Change: ${(liveStock.priceChange ?? 0) >= 0 ? "+" : ""}${(liveStock.priceChange ?? 0).toFixed(2)} (${(liveStock.percentChange ?? 0).toFixed(2)}%)
Market Cap: ${liveStock.marketCap ? `$${(liveStock.marketCap / 1e9).toFixed(2)}B` : "N/A"}
52W High: ${liveStock.fiftyTwoWeekHigh ? `$${liveStock.fiftyTwoWeekHigh.toFixed(2)}` : "N/A"}
52W Low: ${liveStock.fiftyTwoWeekLow ? `$${liveStock.fiftyTwoWeekLow.toFixed(2)}` : "N/A"}
Volume: ${liveStock.volume ? liveStock.volume.toLocaleString() : "N/A"}
P/E Ratio: ${liveStock.peRatio ? liveStock.peRatio.toFixed(1) : "N/A"}`);
  }

  if (!cache) return parts.length ? parts.join("\n\n") : "";

  const add = (label, value) => {
    if (value && value !== "Not available from connected sources")
      parts.push(`═══ ${label} ═══\n${value}`);
  };

  parts.push(`═══ RESEARCH CONFIDENCE SCORE ═══
Score: ${cache.sourceConfidenceScore ?? 0}/100
Missing sources: ${(cache.missingSources || []).join(", ") || "None"}`);

  if (cache.financialStatementContextJson) {
    try {
      const fsCtx = JSON.parse(cache.financialStatementContextJson);
      if (fsCtx?.sourceUsed && fsCtx.sourceUsed !== "None") {
        add(
          `NORMALIZED FINANCIAL STATEMENT CONTEXT (Source: ${fsCtx.sourceUsed}, confidence: ${fsCtx.sourceConfidence})`,
          JSON.stringify(fsCtx, null, 2)
        );
      }
    } catch {}
  }

  if (cache.earningsContextJson) {
    try {
      const ec = JSON.parse(cache.earningsContextJson);
      add(`NORMALIZED EARNINGS CONTEXT (Source: ${ec.sourceUsed || "None"})`, JSON.stringify(ec, null, 2));
    } catch {}
  }

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
      if (lines.length) add("VALUATION METRICS (Source: FMP)", lines.join(" | "));
    } catch {}
  }

  if (cache.financialStatementsJson) {
    try {
      const fs = JSON.parse(cache.financialStatementsJson);
      if (fs.income?.length) {
        const rows = fs.income
          .slice(0, 4)
          .map(
            (s) =>
              `${s.date}: Rev $${(s.revenue / 1e9)?.toFixed(2)}B | Op Inc $${(s.operatingIncome / 1e9)?.toFixed(2)}B | Net Inc $${(s.netIncome / 1e9)?.toFixed(2)}B | EPS $${s.eps} | GM ${(s.grossMargin * 100)?.toFixed(1)}% | OM ${(s.operatingMargin * 100)?.toFixed(1)}%`
          )
          .join("\n");
        add("INCOME STATEMENTS (Source: FMP, last 4 periods)", rows);
      }
      if (fs.cashFlow?.length) {
        const rows = fs.cashFlow
          .slice(0, 4)
          .map(
            (s) =>
              `${s.date}: OCF $${(s.operatingCashFlow / 1e9)?.toFixed(2)}B | FCF $${(s.freeCashFlow / 1e9)?.toFixed(2)}B | CapEx $${(s.capex / 1e9)?.toFixed(2)}B`
          )
          .join("\n");
        add("CASH FLOW STATEMENTS (Source: FMP, last 4 periods)", rows);
      }
      if (fs.balance?.length) {
        const rows = fs.balance
          .slice(0, 4)
          .map(
            (s) =>
              `${s.date}: Assets $${(s.totalAssets / 1e9)?.toFixed(2)}B | Equity $${(s.totalEquity / 1e9)?.toFixed(2)}B | Debt $${(s.totalDebt / 1e9)?.toFixed(2)}B | Cash $${(s.cash / 1e9)?.toFixed(2)}B`
          )
          .join("\n");
        add("BALANCE SHEET (Source: FMP, last 4 periods)", rows);
      }
    } catch {}
  }

  add("REVENUE GROWTH ANALYSIS (Source: FMP)", cache.revenueGrowthSummary);
  add("MARGIN TRENDS (Source: FMP)", cache.marginTrendsSummary);
  add("FREE CASH FLOW (Source: FMP)", cache.freeCashFlowSummary);
  add("BALANCE SHEET SUMMARY (Source: FMP)", cache.balanceSheetSummary);
  add("DEBT & LIQUIDITY (Source: FMP)", cache.debtLiquiditySummary);

  if (cache.cik) add("SEC EDGAR (Source: Official SEC API)", `CIK: ${cache.cik}`);
  add("SEC 10-K ANNUAL FILING (Source: SEC EDGAR)", cache.tenKSummary);
  add("SEC 10-Q QUARTERLY FILING (Source: SEC EDGAR)", cache.tenQSummary);
  add("SEC 8-K MATERIAL EVENTS (Source: SEC EDGAR)", cache.eightKSummary);
  add("EARNINGS CALL TRANSCRIPT (Source: FMP)", cache.earningsTranscriptSummary);
  add(`MANAGEMENT TONE`, `Tone: ${cache.managementTone || "unknown"} (Source: Earnings transcript analysis)`);
  add("FORWARD GUIDANCE", cache.guidanceSummary);
  add("COMPANY NEWS (Source: Finnhub, last 30 days)", cache.companyNewsSummary);
  add(`NEWS SENTIMENT`, `Sentiment: ${cache.newsSentiment || "unknown"}`);
  add("PRESS RELEASES (Source: Finnhub)", cache.pressReleaseSummary);
  add("INSIDER ACTIVITY (Source: Finnhub)", cache.insiderActivitySummary);
  add("ANALYST RECOMMENDATIONS (Source: Finnhub)", cache.analystRecommendationsSummary);
  if (cache.nextEarningsDate) add("NEXT EARNINGS DATE (Source: Finnhub)", cache.nextEarningsDate);
  add("KEY POSITIVE SIGNALS", cache.keyPositiveSignals);
  add("KEY NEGATIVE SIGNALS", cache.keyNegativeSignals);
  add("RED FLAGS", cache.redFlags);
  add("UPCOMING CATALYSTS", cache.catalysts);

  if (!cache.cik) {
    parts.push(
      `═══ DATA COVERAGE NOTE ═══\nSEC EDGAR filings unavailable — likely non-US company. Multi-source analysis still uses FMP financials, Finnhub news/insider data, and market data.`
    );
  }

  return parts.join("\n\n");
};

export const buildCompanyContext = (stock, news) => {
  if (!stock) return "";
  const lines = [
    `═══ COMPANY CONTEXT (REQUIRED — USE THIS IN ALL ANALYSIS) ═══`,
    `Company: ${stock.companyName} (${stock.ticker})`,
    stock.sector ? `Sector: ${stock.sector}` : null,
    stock.industry ? `Industry: ${stock.industry}` : null,
    `Market Cap Category: ${stock.marketCapLabel || "Unknown"}`,
    stock.growthProfile !== "unknown"
      ? `Growth Profile: ${stock.growthProfile.replace(/_/g, " ")} (Rev Growth YoY: ${stock.revenueGrowth != null ? (stock.revenueGrowth * 100).toFixed(1) + "%" : "N/A"})`
      : null,
    stock.profitabilityProfile !== "unknown"
      ? `Profitability: ${stock.profitabilityProfile.replace(/_/g, " ")} (Op Margin: ${stock.operatingMargins != null ? (stock.operatingMargins * 100).toFixed(1) + "%" : "N/A"}, Net Margin: ${stock.profitMargins != null ? (stock.profitMargins * 100).toFixed(1) + "%" : "N/A"})`
      : null,
    stock.valuationLevel !== "unknown"
      ? `Valuation Level: ${stock.valuationLevel.replace(/_/g, " ")} (P/E: ${stock.trailingPE != null ? stock.trailingPE.toFixed(1) + "x" : "N/A"}, P/S: ${stock.priceToSales != null ? stock.priceToSales.toFixed(2) + "x" : "N/A"}, P/B: ${stock.priceToBook != null ? stock.priceToBook.toFixed(2) + "x" : "N/A"})`
      : null,
    stock.momentum !== "unknown"
      ? `Price Momentum: ${stock.momentum} (vs 52W High: ${stock.fiftyTwoWeekHigh ? ((stock.currentPrice / stock.fiftyTwoWeekHigh) * 100).toFixed(0) + "% of high" : "N/A"})`
      : null,
    stock.eps != null ? `EPS: $${stock.eps.toFixed(2)}` : null,
    stock.beta != null ? `Beta (Volatility): ${stock.beta.toFixed(2)}` : null,
    stock.grossMargins != null ? `Gross Margin: ${(stock.grossMargins * 100).toFixed(1)}%` : null,
    stock.totalRevenue ? `Total Revenue (TTM): $${(stock.totalRevenue / 1e9).toFixed(2)}B` : null,
    stock.debtToEquity != null ? `Debt/Equity: ${stock.debtToEquity.toFixed(2)}` : null,
    stock.fiftyTwoWeekHigh && stock.fiftyTwoWeekLow
      ? `52W Range: $${stock.fiftyTwoWeekLow.toFixed(2)} – $${stock.fiftyTwoWeekHigh.toFixed(2)}`
      : null,
    stock.businessSummary ? `Business Summary: ${stock.businessSummary.slice(0, 400)}...` : null,
  ].filter(Boolean);

  if (news) {
    if (news.sentiment) lines.push(`News Sentiment: ${news.sentiment}`);
    if (news.majorEvent) lines.push(`Major Recent Event: ${news.majorEvent}`);
    if (news.themes?.length) lines.push(`Key News Themes: ${news.themes.join(", ")}`);
    if (news.keyOpportunities?.length)
      lines.push(`Key Opportunities (from news): ${news.keyOpportunities.join(" | ")}`);
    if (news.keyRisks?.length) lines.push(`Key Risks (from news): ${news.keyRisks.join(" | ")}`);
    if (news.articles?.length) {
      lines.push(`Recent Headlines:`);
      news.articles.slice(0, 5).forEach((a) => lines.push(` • ${a.title} [${a.publisher}]`));
    }
  }

  return lines.join("\n");
};

export const buildTechnicalBlock = (tech) => {
  if (!tech?.available) return "TECHNICAL ANALYSIS: Not available for this ticker.";
  const { trend, indicators, levels, currentPrice: cp, sourceUsed: src } = tech;
  const fib = levels?.fibonacci || {};
  const support = levels?.support || [];
  const resistance = levels?.resistance || [];
  return `═══ TECHNICAL ANALYSIS (Source: ${src}, last 180 trading days) ═══
Current Price: $${cp?.toFixed(2)}
Trend Direction: ${trend?.direction}
Momentum: ${trend?.momentum}
SMA 20: ${indicators?.sma20?.toFixed(2) ?? "N/A"}
SMA 50: ${indicators?.sma50?.toFixed(2) ?? "N/A"}
SMA 200: ${indicators?.sma200?.toFixed(2) ?? "N/A"}
RSI (14): ${indicators?.rsi?.toFixed(1) ?? "N/A"}
MACD: ${indicators?.macd ? `${indicators.macd.trend} (hist ${indicators.macd.histogram.toFixed(2)})` : "N/A"}
Volume Trend: ${indicators?.volumeTrend}
Recent Swing High: $${indicators?.recentSwingHigh?.toFixed(2)}
Recent Swing Low: $${indicators?.recentSwingLow?.toFixed(2)}
Support Levels: ${support.length ? support.map((s) => `$${s.toFixed(2)}`).join(", ") : "N/A"}
Resistance Levels: ${resistance.length ? resistance.map((r) => `$${r.toFixed(2)}`).join(", ") : "N/A"}
Fibonacci Retracement (from swing low to swing high):
23.6%: $${fib.level_236?.toFixed(2)}
38.2%: $${fib.level_382?.toFixed(2)}
50.0%: $${fib.level_500?.toFixed(2)}
61.8%: $${fib.level_618?.toFixed(2)}
78.6%: $${fib.level_786?.toFixed(2)}`;
};

// ─── Source coverage helpers ──────────────────────────────────────────────────

export const parseCoverage = (cache) => {
  let sourceCoverage = {};
  try {
    sourceCoverage = cache?.sourceCoverageJson ? JSON.parse(cache.sourceCoverageJson) : {};
  } catch {}

  const covStatus = (k) => {
    const e = sourceCoverage[k];
    if (!e) return "missing";
    return typeof e === "string" ? e : e.status || "missing";
  };

  const covSource = (k) => {
    const e = sourceCoverage[k];
    if (!e || typeof e === "string") return null;
    return e.sourceUsed || null;
  };

  let fsContext = null,
    earningsContext = null;
  try {
    fsContext = cache?.financialStatementContextJson
      ? JSON.parse(cache.financialStatementContextJson)
      : null;
  } catch {}
  try {
    earningsContext = cache?.earningsContextJson ? JSON.parse(cache.earningsContextJson) : null;
  } catch {}

  const fsSourceUsed =
    fsContext?.sourceUsed && fsContext.sourceUsed !== "None" ? fsContext.sourceUsed : null;
  const earningsSourceUsed =
    earningsContext?.sourceUsed && earningsContext.sourceUsed !== "None"
      ? earningsContext.sourceUsed
      : null;

  const hasSEC = !!cache?.cik;
  const hasFinnhub =
    covStatus("marketData") === "available" || covStatus("news") === "available";
  const hasTranscript = covStatus("earningsTranscript") === "available";
  const confidenceScore = cache?.sourceConfidenceScore ?? 0;

  const sourcesUsed = [
    covStatus("marketData") === "available"
      ? `Market Data (${covSource("marketData") || "Finnhub"})`
      : null,
    fsSourceUsed ? `Financial Statements (${fsSourceUsed})` : null,
    covStatus("valuationMetrics") === "available"
      ? `Valuation (${covSource("valuationMetrics") || "FMP"})`
      : null,
    cache?.cik ? "SEC EDGAR" : null,
    cache?.tenKSummary ? "SEC 10-K" : null,
    cache?.tenQSummary ? "SEC 10-Q" : null,
    cache?.eightKSummary ? "SEC 8-K" : null,
    earningsSourceUsed ? `Earnings (${earningsSourceUsed})` : null,
    covStatus("news") === "available" ? `News (${covSource("news") || "Finnhub"})` : null,
    covStatus("insiderActivity") === "available" ? "Finnhub Insider Data" : null,
    covStatus("analystRecommendations") === "available" ? "Finnhub Analyst Trends" : null,
  ].filter(Boolean);

  let latestTenKDate = "",
    latestTenQDate = "",
    latestEightKDate = "";
  if (cache?.secFilingsJson) {
    try {
      const filings = JSON.parse(cache.secFilingsJson);
      latestTenKDate = filings.find((f) => f.type === "10-K")?.date || "";
      latestTenQDate = filings.find((f) => f.type === "10-Q")?.date || "";
      latestEightKDate = filings.find((f) => f.type === "8-K")?.date || "";
    } catch {}
  }

  return {
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
  };
};
