import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Loader2, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl px-3 py-2.5 shadow-lg text-xs">
      <p className="text-muted-foreground mb-1">{label}</p>
      <p className="font-semibold text-foreground">${payload[0].value.toFixed(2)}</p>
    </div>
  );
}

export default function StockPriceChart({ ticker }) {
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!ticker) return;
    setLoading(true);
    setError(null);
    setPoints([]);

    base44.functions.invoke("fetchStockHistory", { ticker })
      .then((res) => {
        const pts = res.data?.points || [];
        if (pts.length === 0) setError("No price history available.");
        else setPoints(pts);
      })
      .catch(() => {
        // Silently hide chart on rate limit or API errors
        setError(null);
        setPoints([]);
      })
      .finally(() => setLoading(false));
  }, [ticker]);

  if (!ticker || (!loading && points.length === 0 && !error)) return null;

  const first = points[0]?.close;
  const last = points[points.length - 1]?.close;
  const isPositive = last >= first;
  const pctChange = first ? (((last - first) / first) * 100).toFixed(2) : null;

  const color = isPositive ? "hsl(var(--primary))" : "hsl(var(--destructive))";

  return (
    <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">Price History</p>
          <p className="text-xs text-muted-foreground">Last 90 days — {ticker.toUpperCase()}</p>
        </div>
        {pctChange !== null && !loading && (
          <div className={cn(
            "flex items-center gap-1 text-sm font-semibold px-2.5 py-1 rounded-lg",
            isPositive ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
          )}>
            {isPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            {isPositive ? "+" : ""}{pctChange}%
          </div>
        )}
      </div>

      <div className="px-4 py-6">
        {loading && (
          <div className="flex items-center justify-center h-48 gap-2 text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading chart…
          </div>
        )}
        {error && !loading && (
          <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">{error}</div>
        )}
        {!loading && !error && points.length > 0 && (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={points} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={(d) => format(parseISO(d), "MMM d")}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
                interval={14}
              />
              <YAxis
                domain={["auto", "auto"]}
                tickFormatter={(v) => `$${v.toFixed(0)}`}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
                width={50}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="close"
                stroke={color}
                strokeWidth={2}
                fill="url(#chartGradient)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}