import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { BarChart2 } from "lucide-react";

function AdvancedChartWidget({ ticker }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = "";
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: ticker,
      interval: "D",
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1",
      locale: "en",
      allow_symbol_change: false,
      calendar: false,
      support_host: "https://www.tradingview.com",
      backgroundColor: "rgba(0, 0, 0, 0)",
      gridColor: "rgba(255, 255, 255, 0.05)",
      withdateranges: true,
      range: "3M",
      hide_side_toolbar: false,
      studies: ["STD;Volume"],
      show_popup_button: false,
    });
    containerRef.current.appendChild(script);
    return () => { if (containerRef.current) containerRef.current.innerHTML = ""; };
  }, [ticker]);

  return <div ref={containerRef} style={{ height: 550 }} />;
}

export default function TradingViewWidgets({ ticker }) {
  if (!ticker) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-card border border-border rounded-xl shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <BarChart2 className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">Market Chart</p>
            <p className="text-[11px] text-muted-foreground">{ticker} · 90 Days · Volume</p>
          </div>
        </div>
        <span className="text-[10px] text-muted-foreground/60 bg-muted px-2 py-1 rounded-full border border-border">
          Powered by TradingView
        </span>
      </div>

      <div className="overflow-hidden">
        <AdvancedChartWidget key={`chart-${ticker}`} ticker={ticker} />
      </div>
    </motion.div>
  );
}