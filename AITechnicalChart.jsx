import React, { useMemo } from "react";
import { motion } from "framer-motion";
import {
  ComposedChart, Line, Area, ReferenceLine, ReferenceDot, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Bar, Customized
} from "recharts";
import { LineChart, AlertCircle } from "lucide-react";

const fmt = (v) => v == null ? "—" : `$${Number(v).toFixed(2)}`;

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-popover border border-border rounded-lg p-2.5 text-xs shadow-xl">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      <div className="space-y-0.5 font-mono tabular-nums">
        <p className="text-muted-foreground">O: <span className="text-foreground">{fmt(d.open)}</span></p>
        <p className="text-muted-foreground">H: <span className="text-emerald-400">{fmt(d.high)}</span></p>
        <p className="text-muted-foreground">L: <span className="text-rose-400">{fmt(d.low)}</span></p>
        <p className="text-muted-foreground">C: <span className="text-foreground font-semibold">{fmt(d.close)}</span></p>
        {d.sma20 != null && <p className="text-amber-400">SMA20: {fmt(d.sma20)}</p>}
        {d.sma50 != null && <p className="text-blue-400">SMA50: {fmt(d.sma50)}</p>}
        {d.sma200 != null && <p className="text-purple-400">SMA200: {fmt(d.sma200)}</p>}
      </div>
    </div>
  );
}

// Diagonal trendline drawn through Recharts' Customized component using the chart's scales
function DiagonalTrendline({ xScale, yScale, points, color, label, dashed = false }) {
  if (!xScale || !yScale || !points) return null;
  const x1 = xScale(points.x1Date);
  const x2 = xScale(points.x2Date);
  const y1 = yScale(points.y1);
  const y2 = yScale(points.y2);
  if ([x1, x2, y1, y2].some(v => v == null || isNaN(v))) return null;

  // Extend the line forward to the right edge of the chart
  const slope = (y2 - y1) / (x2 - x1 || 1);
  const xRange = xScale.range ? xScale.range() : [x1, x2];
  const xEnd = xRange[1];
  const yEnd = y2 + slope * (xEnd - x2);

  return (
    <g>
      <line
        x1={x1} y1={y1} x2={xEnd} y2={yEnd}
        stroke={color} strokeWidth={1.4}
        strokeDasharray={dashed ? "4 4" : "0"}
        opacity={0.85}
      />
      <text
        x={xEnd - 4} y={yEnd - 4}
        textAnchor="end" fontSize={9} fontWeight={600}
        fill={color}
      >
        {label}
      </text>
    </g>
  );
}

// Wrapper that captures Recharts internal scales and renders custom diagonal overlays
function TrendlinesOverlay({ trendlines }) {
  return (
    <Customized
      component={(props) => {
        const { xAxisMap, yAxisMap } = props;
        const xAxis = xAxisMap && Object.values(xAxisMap)[0];
        const yAxis = yAxisMap && Object.values(yAxisMap)[0];
        if (!xAxis || !yAxis) return null;
        const xScale = xAxis.scale;
        const yScale = yAxis.scale;
        return (
          <g>
            {trendlines?.supportTrend && (
              <DiagonalTrendline
                xScale={xScale} yScale={yScale}
                points={trendlines.supportTrend}
                color="#10b981" label="Support Trendline"
              />
            )}
            {trendlines?.resistanceTrend && (
              <DiagonalTrendline
                xScale={xScale} yScale={yScale}
                points={trendlines.resistanceTrend}
                color="#ef4444" label="Resistance Trendline"
              />
            )}
          </g>
        );
      }}
    />
  );
}

// Deduplicate price levels that are within `pct` of each other
function dedupeLevels(levels, pct = 0.015) {
  const sorted = [...levels].filter(v => v != null && !isNaN(v)).sort((a, b) => a - b);
  const out = [];
  for (const v of sorted) {
    if (!out.length || Math.abs(v - out[out.length - 1]) / v > pct) out.push(v);
  }
  return out;
}

export default function AITechnicalChart({ technical, priceTarget, bullCaseTarget, bearCaseTarget }) {
  const levels = technical?.levels;
  const currentPrice = technical?.currentPrice;

  // Hooks must run unconditionally — compute filtered levels before any early return
  const support = useMemo(
    () => dedupeLevels(levels?.support || []).filter(v => currentPrice == null || v < currentPrice).slice(-3),
    [levels?.support, currentPrice]
  );
  const resistance = useMemo(
    () => dedupeLevels(levels?.resistance || []).filter(v => currentPrice == null || v > currentPrice).slice(0, 3),
    [levels?.resistance, currentPrice]
  );

  if (!technical) return null;

  if (!technical.available) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 text-center">
        <AlertCircle className="h-6 w-6 text-amber-400 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">{technical.message || "Technical chart data is limited for this ticker"}</p>
      </div>
    );
  }

  const { chartData, indicators, trend, sourceUsed } = technical;
  const fib = levels?.fibonacci || {};
  const trendlines = levels?.trendlines || {};

  // Compute Y-axis domain to include all reference lines
  const allPrices = [
    ...chartData.map(d => d.high),
    ...chartData.map(d => d.low),
    priceTarget, bullCaseTarget, bearCaseTarget,
    ...support, ...resistance,
    ...Object.values(fib),
  ].filter(v => v != null && !isNaN(v));
  const minP = Math.min(...allPrices) * 0.96;
  const maxP = Math.max(...allPrices) * 1.04;

  const trendColor = trend?.direction === 'uptrend' ? 'text-emerald-400' :
                     trend?.direction === 'downtrend' ? 'text-rose-400' : 'text-amber-400';

  const fibEntries = [
    { key: 'level_236', pct: '23.6%', value: fib.level_236 },
    { key: 'level_382', pct: '38.2%', value: fib.level_382 },
    { key: 'level_500', pct: '50.0%', value: fib.level_500 },
    { key: 'level_618', pct: '61.8%', value: fib.level_618 },
    { key: 'level_786', pct: '78.6%', value: fib.level_786 },
  ].filter(f => f.value != null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-card border border-border rounded-xl shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-border flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <LineChart className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">AI Technical Chart</p>
            <p className="text-[11px] text-muted-foreground">
              Auto-generated overlays · 180 trading days · Source: {sourceUsed}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-[10px] flex-wrap">
          <span className={`font-bold uppercase tracking-wide ${trendColor}`}>
            {trend?.direction || 'sideways'}
          </span>
          {indicators?.rsi != null && (
            <span className="text-muted-foreground">RSI: <span className="text-foreground font-mono">{indicators.rsi.toFixed(1)}</span></span>
          )}
          {indicators?.macd && (
            <span className={indicators.macd.trend === 'bullish' ? 'text-emerald-400' : 'text-rose-400'}>
              MACD: {indicators.macd.trend}
            </span>
          )}
          <span className="text-muted-foreground">Vol: <span className="text-foreground capitalize">{indicators?.volumeTrend}</span></span>
        </div>
      </div>

      {/* Chart */}
      <div className="p-3 bg-background/40">
        <ResponsiveContainer width="100%" height={460}>
          <ComposedChart data={chartData} margin={{ top: 10, right: 110, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="2 4" stroke="hsl(var(--border))" opacity={0.4} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={(d) => d.slice(5)}
              minTickGap={40}
            />
            <YAxis
              domain={[minP, maxP]}
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={(v) => `$${v.toFixed(0)}`}
              orientation="right"
              width={55}
            />
            <Tooltip content={<ChartTooltip />} />

            {/* Price area + line */}
            <Area type="monotone" dataKey="high" stroke="none" fill="hsl(var(--primary))" fillOpacity={0.04} />
            <Line type="monotone" dataKey="close" stroke="hsl(var(--primary))" strokeWidth={1.8} dot={false} name="Price" />

            {/* Moving averages */}
            <Line type="monotone" dataKey="sma20" stroke="#fbbf24" strokeWidth={1} dot={false} name="SMA 20" />
            <Line type="monotone" dataKey="sma50" stroke="#60a5fa" strokeWidth={1} dot={false} name="SMA 50" />
            <Line type="monotone" dataKey="sma200" stroke="#a78bfa" strokeWidth={1} dot={false} name="SMA 200" />

            {/* Support levels (horizontal) */}
            {support.map((s, i) => (
              <ReferenceLine
                key={`s-${i}`} y={s}
                stroke="#10b981" strokeWidth={1.1} strokeDasharray="3 3" strokeOpacity={0.75}
                label={{
                  value: `Support  $${s.toFixed(2)}`,
                  position: 'insideLeft',
                  fill: '#10b981', fontSize: 9, fontWeight: 600,
                }}
              />
            ))}

            {/* Resistance levels (horizontal) */}
            {resistance.map((r, i) => (
              <ReferenceLine
                key={`r-${i}`} y={r}
                stroke="#ef4444" strokeWidth={1.1} strokeDasharray="3 3" strokeOpacity={0.75}
                label={{
                  value: `Resistance  $${r.toFixed(2)}`,
                  position: 'insideLeft',
                  fill: '#ef4444', fontSize: 9, fontWeight: 600,
                }}
              />
            ))}

            {/* Fibonacci levels */}
            {fibEntries.map(f => (
              <ReferenceLine
                key={f.key} y={f.value}
                stroke="#94a3b8" strokeWidth={0.7} strokeOpacity={0.55} strokeDasharray="1 4"
                label={{
                  value: `Fib ${f.pct}  $${f.value.toFixed(2)}`,
                  position: 'insideRight',
                  fill: '#94a3b8', fontSize: 8.5,
                }}
              />
            ))}

            {/* Current price */}
            {currentPrice != null && (
              <ReferenceLine
                y={currentPrice}
                stroke="hsl(var(--foreground))" strokeWidth={1.2} strokeDasharray="2 2"
                label={{
                  value: `Current  $${currentPrice.toFixed(2)}`,
                  position: 'right',
                  fill: 'hsl(var(--foreground))', fontSize: 10, fontWeight: 700,
                }}
              />
            )}

            {/* Bear case target */}
            {bearCaseTarget != null && (
              <ReferenceLine
                y={bearCaseTarget}
                stroke="#ef4444" strokeWidth={1.6} strokeDasharray="6 3"
                label={{
                  value: `Bear Target  $${bearCaseTarget}`,
                  position: 'right',
                  fill: '#ef4444', fontSize: 10, fontWeight: 700,
                }}
              />
            )}

            {/* Base case price target */}
            {priceTarget != null && (
              <ReferenceLine
                y={priceTarget}
                stroke="#3b82f6" strokeWidth={2.2} strokeDasharray="6 3"
                label={{
                  value: `🎯 Base Target  $${priceTarget}`,
                  position: 'right',
                  fill: '#3b82f6', fontSize: 11, fontWeight: 800,
                }}
              />
            )}

            {/* Bull case target */}
            {bullCaseTarget != null && (
              <ReferenceLine
                y={bullCaseTarget}
                stroke="#10b981" strokeWidth={1.6} strokeDasharray="6 3"
                label={{
                  value: `Bull Target  $${bullCaseTarget}`,
                  position: 'right',
                  fill: '#10b981', fontSize: 10, fontWeight: 700,
                }}
              />
            )}

            {/* Diagonal trendlines drawn from swing points */}
            <TrendlinesOverlay trendlines={trendlines} />

            {/* Swing point markers */}
            {indicators?.recentSwingHigh != null && (
              <ReferenceDot
                x={chartData[chartData.length - 1]?.date}
                y={indicators.recentSwingHigh}
                r={3} fill="#ef4444" stroke="none" isFront
              />
            )}
            {indicators?.recentSwingLow != null && (
              <ReferenceDot
                x={chartData[chartData.length - 1]?.date}
                y={indicators.recentSwingLow}
                r={3} fill="#10b981" stroke="none" isFront
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Volume bar chart */}
      <div className="px-3 pb-2 bg-background/40 border-t border-border/50">
        <ResponsiveContainer width="100%" height={70}>
          <ComposedChart data={chartData} margin={{ top: 5, right: 110, left: 10, bottom: 0 }}>
            <XAxis dataKey="date" hide />
            <YAxis hide />
            <Bar dataKey="volume" fill="hsl(var(--muted-foreground))" fillOpacity={0.4} />
          </ComposedChart>
        </ResponsiveContainer>
        <p className="text-[9px] text-muted-foreground text-center -mt-1">Volume</p>
      </div>

      {/* Legend strip */}
      <div className="px-5 py-2.5 border-t border-border bg-muted/10 flex items-center gap-3 flex-wrap text-[10px]">
        <span className="flex items-center gap-1"><span className="h-0.5 w-3 bg-amber-400" /> SMA 20</span>
        <span className="flex items-center gap-1"><span className="h-0.5 w-3 bg-blue-400" /> SMA 50</span>
        <span className="flex items-center gap-1"><span className="h-0.5 w-3 bg-purple-400" /> SMA 200</span>
        <span className="flex items-center gap-1"><span className="h-0.5 w-3 bg-emerald-500" /> Support</span>
        <span className="flex items-center gap-1"><span className="h-0.5 w-3 bg-rose-500" /> Resistance</span>
        <span className="flex items-center gap-1 text-blue-400 font-semibold"><span className="h-0.5 w-3 bg-blue-500" /> Base Target</span>
        <span className="flex items-center gap-1 text-emerald-400"><span className="h-0.5 w-3 bg-emerald-500" /> Bull</span>
        <span className="flex items-center gap-1 text-rose-400"><span className="h-0.5 w-3 bg-rose-500" /> Bear</span>
        <span className="flex items-center gap-1 text-muted-foreground"><span className="h-0.5 w-3 bg-slate-400" /> Fibonacci</span>
        <span className="flex items-center gap-1 text-foreground"><span className="h-0.5 w-3 bg-foreground" /> Current</span>
      </div>
    </motion.div>
  );
}