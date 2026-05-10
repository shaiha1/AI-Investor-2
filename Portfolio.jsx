import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Activity, ArrowLeft } from "lucide-react";
import PortfolioList from "../components/portfolio/PortfolioList";
import PortfolioAnalysis from "../components/portfolio/PortfolioAnalysis";
import AddStockModal from "../components/portfolio/AddStockModal";

export default function Portfolio() {
  const [holdings, setHoldings] = useState([]);
  const [liveData, setLiveData] = useState({});
  const [loadingTickers, setLoadingTickers] = useState(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [user, setUser] = useState(null);

  // Load user + holdings
  useEffect(() => {
    base44.auth.me().then((u) => {
      setUser(u);
      if (u) {
        base44.entities.PortfolioHolding.filter({ userId: u.email }, "-addedAt", 100).then((data) => {
          setHoldings(data);
        });
      }
    });
  }, []);

  // Fetch live prices for all holdings
  const fetchLivePrices = useCallback(async (holdingsList) => {
    const tickers = [...new Set(holdingsList.map((h) => h.ticker))];
    setLoadingTickers(new Set(tickers));

    await Promise.all(
      tickers.map(async (ticker) => {
        try {
          const res = await base44.functions.invoke("fetchStockData", { ticker });
          setLiveData((prev) => ({ ...prev, [ticker]: res.data }));
        } catch {
          // silently skip failed tickers
        } finally {
          setLoadingTickers((prev) => {
            const next = new Set(prev);
            next.delete(ticker);
            return next;
          });
        }
      })
    );
  }, []);

  useEffect(() => {
    if (holdings.length > 0) {
      fetchLivePrices(holdings);
    }
  }, [holdings, fetchLivePrices]);

  const handleAdd = async (ticker, positionSize) => {
    if (!user) return;
    const live = await base44.functions.invoke("fetchStockData", { ticker }).catch(() => null);
    const companyName = live?.data?.companyName || ticker;

    const newHolding = await base44.entities.PortfolioHolding.create({
      userId: user.email,
      ticker,
      companyName,
      positionSize: positionSize || undefined,
      addedAt: new Date().toISOString(),
    });

    setHoldings((prev) => [newHolding, ...prev]);
    if (live?.data) {
      setLiveData((prev) => ({ ...prev, [ticker]: live.data }));
    }
  };

  const handleRemove = async (id) => {
    await base44.entities.PortfolioHolding.delete(id);
    setHoldings((prev) => prev.filter((h) => h.id !== id));
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/60 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-6 py-4 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
            <Activity className="h-5 w-5 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">AI-Investor</h1>
          <Link
            to="/"
            className="ml-auto flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Research
          </Link>
        </div>
      </header>

      {/* Page title */}
      <div className="px-6 py-6 border-b border-border bg-card/30">
        <h2 className="text-2xl font-bold text-foreground">Portfolio Tracker</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Track your holdings and get AI-powered portfolio analysis.
        </p>
      </div>

      {/* Two-column layout */}
      <div className="flex flex-1 gap-6 p-6 overflow-hidden">
        {/* LEFT: Portfolio list */}
        <div className="w-full lg:w-80 xl:w-96 shrink-0 flex flex-col gap-4">
          <PortfolioList
            holdings={holdings}
            liveData={liveData}
            loadingTickers={loadingTickers}
            onRemove={handleRemove}
            onAddManual={() => setShowAddModal(true)}
          />
        </div>

        {/* RIGHT: Analysis */}
        <div className="flex-1 min-w-0">
          <PortfolioAnalysis holdings={holdings} liveData={liveData} />
        </div>
      </div>

      <AddStockModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAdd}
      />
    </div>
  );
}