/**
 * Dashboard.jsx — REFACTORED
 *
 * Changes from original:
 * - All state + business logic moved to useStockAnalysis() custom hook
 * - handleRefreshAnalysis no longer uses setTimeout + dispatchEvent hack
 * - Error state is now rendered to the user
 * - Bull/Base/Bear targets passed to PriceTargetCard
 * - StockTickerHeader added (sticky live price bar)
 */

import React from "react";
import { motion } from "framer-motion";
import { Activity, Briefcase, Plus, User, RefreshCw, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

import { useStockAnalysis } from "@/hooks/useStockAnalysis";

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
import StockTickerHeader from "../components/dashboard/StockTickerHeader";

export default function Dashboard() {
  const analysis = useStockAnalysis();

  const {
    ticker, setTicker,
    timeframe, setTimeframe,
    selectedScenarios, setSelectedScenarios,
    customThesis, setCustomThesis,
    isLoading, loadingStep, stockLoading, isPanelRefreshing,
    result, error,
    reports, selectedReportId,
    stockData, stockError, researchCache, newsData, technicalData,
    cacheHit,
    user, subscription, showUpgradeModal, setShowUpgradeModal,
    addedToPortfolio, creditsBalance, isLowCredits, isOutOfCredits,
    handleSubmit, handleRefreshAnalysis, handleRefreshResearch,
    handleAddToPortfolio, handleSelectReport, handleNewAnalysis,
  } = analysis;

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* ── Top Bar ──────────────────────────────────────────────────────── */}
      <header className="h-14 shrink-0 border-b border-border bg-card/80 backdrop-blur-md flex items-center px-4 gap-3 z-20">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <span className="font-semibold text-sm text-foreground">AI Investor</span>
        </div>

        <div className="flex-1" />

        <nav className="flex items-center gap-1">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/portfolio" className="flex items-center gap-1.5">
              <Briefcase className="h-3.5 w-3.5" />
              <span className="text-xs">Portfolio</span>
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/pricing" className="flex items-center gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              <span className="text-xs">Get Credits</span>
            </Link>
          </Button>
        </nav>

        {subscription && (
          <UsageBadge
            creditsBalance={creditsBalance}
            isLowCredits={isLowCredits}
            isOutOfCredits={isOutOfCredits}
          />
        )}

        {user && (
          <div className="h-7 w-7 rounded-full bg-primary/15 flex items-center justify-center">
            <User className="h-3.5 w-3.5 text-primary" />
          </div>
        )}
      </header>

      {/* ── Sticky Ticker Header (shows after analysis) ───────────────────── */}
      {stockData && result && (
        <StockTickerHeader
          stockData={stockData}
          result={result}
          onNewAnalysis={handleNewAnalysis}
          onRefresh={handleRefreshAnalysis}
          isRefreshing={isLoading}
        />
      )}

      {/* ── Main Layout ──────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar: history */}
        <aside className="w-60 shrink-0 border-r border-border bg-card/40 overflow-y-auto hidden lg:flex flex-col">
          <div className="px-3 py-3 border-b border-border">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Recent Reports
            </p>
          </div>
          <ReportHistory
            reports={reports}
            selectedReportId={selectedReportId}
            onSelect={handleSelectReport}
          />
        </aside>

        {/* Center: form + results */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">

            {/* ── Analysis Form ─────────────────────────────────────── */}
            {!result && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
              >
                <AnalysisForm
                  id="analysis-form"
                  ticker={ticker}
                  setTicker={setTicker}
                  timeframe={timeframe}
                  setTimeframe={setTimeframe}
                  onSubmit={handleSubmit}
                  isLoading={isLoading}
                  isOutOfCredits={isOutOfCredits}
                  creditCost={selectedScenarios.length > 0 || customThesis ? 2 : 1}
                  creditsBalance={creditsBalance}
                />
                <ScenarioInputs
                  selectedScenarios={selectedScenarios}
                  setSelectedScenarios={setSelectedScenarios}
                  customThesis={customThesis}
                  setCustomThesis={setCustomThesis}
                />
                <CreditCostBadge
                  hasScenarios={selectedScenarios.length > 0 || !!customThesis}
                />
              </motion.div>
            )}

            {/* ── Error state ────────────────────────────────────────── */}
            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-400"
              >
                {error}
              </motion.div>
            )}

            {/* ── Stock error ─────────────────────────────────────────── */}
            {stockError && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
                {stockError}
              </div>
            )}

            {/* ── Loading ──────────────────────────────────────────────── */}
            {isLoading && <LoadingSteps step={loadingStep} />}

            {/* ── Stock summary bar ─────────────────────────────────── */}
            {stockData && !isLoading && (
              <StockSummaryBar
                stockData={stockData}
                isLoading={stockLoading}
                cacheHit={cacheHit}
              />
            )}

            {/* ── Results ──────────────────────────────────────────────── */}
            {result && !isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                {/* Data age banner — warn when result is from cache */}
                {cacheHit?.fromCache && cacheHit?.cachedAt && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-amber-500/25 bg-amber-500/8 text-amber-400 text-xs">
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                    <span>
                      Cached analysis from{" "}
                      {formatDistanceToNow(new Date(cacheHit.cachedAt), { addSuffix: true })} · Market data is live ·{" "}
                    </span>
                    <button
                      onClick={handleRefreshAnalysis}
                      className="underline font-semibold hover:text-amber-300 transition-colors"
                    >
                      Refresh analysis
                    </button>
                  </div>
                )}

                {/* Price Target Card — now includes bull/base/bear */}
                <PriceTargetCard
                  priceTarget={result.priceTarget}
                  currentPrice={result.currentPrice}
                  updownPct={result.updownPct}
                  timeframe={result.timeframe}
                  rationale={result.priceTargetRationale}
                  bearCaseTarget={result.bearCaseTarget}
                  baseCaseTarget={result.baseCaseTarget}
                  bullCaseTarget={result.bullCaseTarget}
                />

                {/* Technical chart */}
                {technicalData?.available && (
                  <AITechnicalChart
                    ticker={ticker.trim().toUpperCase()}
                    technicalData={technicalData}
                    priceTarget={result.priceTarget}
                  />
                )}

                {/* Technical support panel */}
                {technicalData && (
                  <TechnicalSupportPanel
                    technicalData={technicalData}
                    priceTarget={result.priceTarget}
                    currentPrice={result.currentPrice}
                  />
                )}

                {/* Full report with section tabs */}
                <AnalysisResult
                  result={result}
                  stockData={stockData}
                  newsData={newsData}
                />

                {/* Report actions */}
                <ReportActions
                  result={result}
                  ticker={ticker}
                  stockData={stockData}
                  addedToPortfolio={addedToPortfolio}
                  onAddToPortfolio={handleAddToPortfolio}
                  onRefresh={handleRefreshAnalysis}
                  onNew={handleNewAnalysis}
                  isRefreshing={isLoading}
                  selectedReportId={selectedReportId}
                />

                {/* Research coverage */}
                {researchCache && (
                  <ResearchCoverageDashboard
                    researchCache={researchCache}
                    isPanelRefreshing={isPanelRefreshing}
                    onRefreshResearch={handleRefreshResearch}
                  />
                )}
              </motion.div>
            )}
          </div>
        </main>

        {/* Right sidebar: research status */}
        {researchCache && result && (
          <aside className="w-72 shrink-0 border-l border-border bg-card/30 overflow-y-auto hidden xl:block">
            <ConfidenceScoreBadge
              score={researchCache.sourceConfidenceScore ?? 0}
              missingSources={researchCache.missingSources || []}
            />
          </aside>
        )}
      </div>

      {/* ── Upgrade Modal ────────────────────────────────────────────── */}
      <UpgradeModal
        open={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        creditsBalance={creditsBalance}
      />
    </div>
  );
}
