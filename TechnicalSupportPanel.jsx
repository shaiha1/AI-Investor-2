import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, CheckCircle2, AlertTriangle, XCircle, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

const fmt = (v) => v == null ? "—" : `$${Number(v).toFixed(2)}`;

function evaluateSupport(technical, priceTarget, currentPrice) {
  if (!technical?.available || !priceTarget || !currentPrice) {
    return { verdict: "unknown", label: "Insufficient technical data", color: "text-muted-foreground", icon: Minus };
  }
  const { trend, indicators, levels } = technical;
  const upside = (priceTarget - currentPrice) / currentPrice;
  const isBullishTarget = upside > 0.02;
  const isBearishTarget = upside < -0.02;

  let score = 0;
  if (trend?.direction === 'uptrend' && isBullishTarget) score += 2;
  else if (trend?.direction === 'downtrend' && isBearishTarget) score += 2;
  else if (trend?.direction === 'sideways') score += 0;
  else score -= 1;

  if (trend?.momentum === 'bullish' && isBullishTarget) score += 2;
  else if (trend?.momentum === 'bearish' && isBearishTarget) score += 2;
  else if (trend?.momentum === 'overbought' && isBullishTarget) score -= 1;
  else if (trend?.momentum === 'oversold' && isBearishTarget) score -= 1;

  // Distance to nearest resistance vs target
  const nearestResistance = (levels?.resistance || []).filter(r => r > currentPrice).sort((a, b) => a - b)[0];
  if (nearestResistance && isBullishTarget) {
    if (priceTarget < nearestResistance * 1.05) score += 1; // achievable
    else score -= 1;
  }

  if (score >= 3) return { verdict: "supports", label: "Technical setup supports the price target", color: "text-emerald-400", icon: CheckCircle2, bg: "bg-emerald-500/10", border: "border-emerald-500/25" };
  if (score >= 1) return { verdict: "partial", label: "Technical setup partially supports the price target", color: "text-amber-400", icon: AlertTriangle, bg: "bg-amber-400/10", border: "border-amber-400/25" };
  return { verdict: "does_not_support", label: "Technical setup does not currently support the price target", color: "text-rose-400", icon: XCircle, bg: "bg-rose-500/10", border: "border-rose-500/25" };
}

export default function TechnicalSupportPanel({ technical, priceTarget, currentPrice }) {
  if (!technical?.available) return null;

  const { trend, indicators, levels } = technical;
  const evaluation = evaluateSupport(technical, priceTarget, currentPrice);
  const Icon = evaluation.icon;

  const nearestSupport = (levels?.support || []).filter(s => s < currentPrice).sort((a, b) => b - a)[0];
  const nearestResistance = (levels?.resistance || []).filter(r => r > currentPrice).sort((a, b) => a - b)[0];
  const breakoutLevel = nearestResistance;
  const downsideRisk = nearestSupport;

  const trendIcon = trend?.direction === 'uptrend' ? TrendingUp : trend?.direction === 'downtrend' ? TrendingDown : Minus;
  const TrendIcon = trendIcon;
  const trendColor = trend?.direction === 'uptrend' ? 'text-emerald-400' : trend?.direction === 'downtrend' ? 'text-rose-400' : 'text-amber-400';

  // RSI / MACD interpretation
  const rsiInterp = indicators?.rsi == null ? '—' :
    indicators.rsi > 70 ? `Overbought (${indicators.rsi.toFixed(1)})` :
    indicators.rsi < 30 ? `Oversold (${indicators.rsi.toFixed(1)})` :
    indicators.rsi > 55 ? `Bullish (${indicators.rsi.toFixed(1)})` :
    indicators.rsi < 45 ? `Bearish (${indicators.rsi.toFixed(1)})` :
    `Neutral (${indicators.rsi.toFixed(1)})`;

  const macdInterp = !indicators?.macd ? '—' :
    indicators.macd.trend === 'bullish' ? `Bullish crossover (hist ${indicators.macd.histogram.toFixed(2)})` :
    `Bearish crossover (hist ${indicators.macd.histogram.toFixed(2)})`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="bg-card border border-border rounded-xl shadow-sm overflow-hidden"
    >
      <div className="px-5 py-3.5 border-b border-border flex items-center gap-2.5">
        <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Activity className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">Technical Support for Price Target</p>
          <p className="text-[11px] text-muted-foreground">Auto-derived from chart structure</p>
        </div>
      </div>

      {/* Verdict banner */}
      <div className={cn("px-5 py-3 flex items-center gap-3 border-b border-border", evaluation.bg, evaluation.border)}>
        <Icon className={cn("h-5 w-5 shrink-0", evaluation.color)} />
        <p className={cn("text-sm font-semibold", evaluation.color)}>{evaluation.label}</p>
      </div>

      {/* Metrics grid */}
      <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Metric label="Trend" value={trend?.direction || 'sideways'} valueClass={trendColor} icon={<TrendIcon className={cn("h-3.5 w-3.5", trendColor)} />} capitalize />
        <Metric label="Momentum" value={trend?.momentum || 'neutral'} valueClass={trendColor} capitalize />
        <Metric label="Volume" value={indicators?.volumeTrend || 'stable'} capitalize />
        <Metric label="Key Support" value={fmt(nearestSupport)} valueClass="text-emerald-400 font-mono" />
        <Metric label="Key Resistance" value={fmt(nearestResistance)} valueClass="text-rose-400 font-mono" />
        <Metric label="Breakout Level" value={fmt(breakoutLevel)} valueClass="text-primary font-mono" />
        <Metric label="Downside Risk" value={fmt(downsideRisk)} valueClass="text-rose-400 font-mono" />
        <Metric label="RSI (14)" value={rsiInterp} valueClass="font-mono text-xs" />
        <Metric label="MACD" value={macdInterp} valueClass="font-mono text-xs" />
      </div>

      {/* Narrative */}
      <div className="px-5 pb-4">
        <p className="text-xs text-muted-foreground leading-relaxed">
          {trend?.direction === 'uptrend' && `The chart is in an uptrend with price holding above its 20- and 50-day moving averages. `}
          {trend?.direction === 'downtrend' && `The chart is in a downtrend with price below its 20- and 50-day moving averages. `}
          {trend?.direction === 'sideways' && `The chart is consolidating sideways with no clear directional bias. `}
          {nearestResistance && `Key resistance sits at ${fmt(nearestResistance)}; a sustained close above this level is required to validate further upside toward the price target. `}
          {nearestSupport && `Primary support is ${fmt(nearestSupport)} — a break below this level would invalidate the bullish setup. `}
          {indicators?.rsi != null && `RSI at ${indicators.rsi.toFixed(1)} indicates ${indicators.rsi > 70 ? 'overbought conditions (caution on chasing).' : indicators.rsi < 30 ? 'oversold conditions (potential reversal).' : 'balanced momentum.'} `}
          {indicators?.macd && `MACD is ${indicators.macd.trend} which ${indicators.macd.trend === 'bullish' ? 'confirms upside momentum.' : 'suggests downside pressure.'}`}
        </p>
      </div>
    </motion.div>
  );
}

function Metric({ label, value, valueClass, icon, capitalize }) {
  return (
    <div className="bg-muted/20 border border-border rounded-lg px-3 py-2">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold">{label}</p>
      <div className="flex items-center gap-1.5 mt-0.5">
        {icon}
        <p className={cn("text-sm font-semibold text-foreground", valueClass, capitalize && "capitalize")}>{value}</p>
      </div>
    </div>
  );
}