import React from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import TickerAutocomplete from "./TickerAutocomplete";
import CreditCostBadge from "./CreditCostBadge";


export default function AnalysisForm({
  ticker,
  setTicker,
  timeframe,
  setTimeframe,
  onSubmit,
  isLoading,
  formId,
  creditCost = 1,
  creditsBalance = null,
}) {
  const isLow = creditsBalance !== null && creditsBalance < 5;
  const cannotAfford = creditsBalance !== null && creditsBalance < creditCost;
  return (
    <div className="bg-card border border-primary/20 rounded-xl p-5 shadow-sm shadow-primary/5">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">New Analysis</h2>
        <span className="text-xs text-muted-foreground">— AI-powered deep research</span>
        <div className="ml-auto flex items-center gap-2">
          <CreditCostBadge cost={creditCost} />
          {isLow && creditsBalance !== null && (
            <span className="text-[10px] text-amber-400 font-semibold">{creditsBalance} left</span>
          )}
        </div>
      </div>

      <form id={formId} onSubmit={onSubmit}>
        <div className="flex flex-col sm:flex-row gap-2.5">
          <TickerAutocomplete
            value={ticker}
            onChange={setTicker}
            onSelect={(symbol) => setTicker(symbol)}
            placeholder="Ticker or company name (e.g. AAPL, TSLA)"
          />
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="h-10 w-full sm:w-28 bg-background border-border text-sm">
              <SelectValue placeholder="Timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="next_month">1 Month</SelectItem>
              <SelectItem value="next_quarter">1 Quarter</SelectItem>
              <SelectItem value="next_year">1 Year</SelectItem>
            </SelectContent>
          </Select>
          <Button
            type="submit"
            disabled={isLoading || !ticker.trim() || cannotAfford}
            className="h-10 px-5 text-sm font-semibold shrink-0 shadow-md shadow-primary/20"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="hidden sm:inline ml-1.5">Analyzing…</span>
              </>
            ) : (
              "Analyze"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}