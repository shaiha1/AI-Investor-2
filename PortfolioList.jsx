import React, { useState } from "react";
import { TrendingUp, TrendingDown, Trash2, Loader2, Plus, CheckSquare, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function PortfolioList({ holdings, liveData, loadingTickers, onRemove, onBulkRemove, onAddManual }) {
  const [selectedIds, setSelectedIds] = useState(new Set());

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelectedIds((prev) =>
      prev.size === holdings.length ? new Set() : new Set(holdings.map((h) => h.id))
    );
  };

  const handleBulkDelete = () => {
    onBulkRemove([...selectedIds]);
    setSelectedIds(new Set());
  };

  if (holdings.length === 0) {
    return (
      <div className="bg-card border border-border rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-3 h-64">
        <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
          <TrendingUp className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-foreground">No holdings yet</p>
        <p className="text-xs text-muted-foreground">Add stocks from a report or manually below.</p>
        <Button size="sm" variant="outline" onClick={onAddManual} className="mt-1 gap-2">
          <Plus className="h-3.5 w-3.5" />
          Add Stock
        </Button>
      </div>
    );
  }

  const allSelected = selectedIds.size === holdings.length;

  return (
    <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={toggleAll}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title={allSelected ? "Deselect all" : "Select all"}
          >
            {allSelected ? (
              <CheckSquare className="h-4 w-4 text-primary" />
            ) : (
              <Square className="h-4 w-4" />
            )}
          </button>
          <h2 className="text-sm font-semibold text-foreground">Holdings</h2>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <Button
              size="sm"
              variant="destructive"
              onClick={handleBulkDelete}
              className="gap-1.5 h-8 text-xs"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete {selectedIds.size}
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={onAddManual} className="gap-1.5 h-8 text-xs">
            <Plus className="h-3.5 w-3.5" />
            Add
          </Button>
        </div>
      </div>
      <ul className="divide-y divide-border">
        {holdings.map((h) => {
          const live = liveData[h.ticker];
          const isLoadingTicker = loadingTickers.has(h.ticker);
          const isPositive = live && live.changePercent >= 0;
          const isSelected = selectedIds.has(h.id);

          return (
            <li
              key={h.id}
              className={cn(
                "flex items-center gap-3 px-5 py-3.5 hover:bg-muted/40 transition-colors",
                isSelected && "bg-primary/5"
              )}
            >
              <button onClick={() => toggleSelect(h.id)} className="shrink-0 text-muted-foreground hover:text-primary">
                {isSelected ? (
                  <CheckSquare className="h-4 w-4 text-primary" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
              </button>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground">{h.ticker}</p>
                <p className="text-xs text-muted-foreground truncate">{h.companyName || h.ticker}</p>
                {h.positionSize && (
                  <p className="text-xs text-muted-foreground">{h.positionSize} shares</p>
                )}
              </div>

              <div className="text-right shrink-0">
                {isLoadingTicker ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : live ? (
                  <>
                    <p className="text-sm font-semibold text-foreground font-mono">${live.price.toFixed(2)}</p>
                    <div className={cn(
                      "flex items-center justify-end gap-0.5 text-xs font-medium",
                      isPositive ? "text-primary" : "text-destructive"
                    )}>
                      {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {isPositive ? "+" : ""}{live.changePercent.toFixed(2)}%
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">—</p>
                )}
              </div>

              <button
                onClick={() => onRemove(h.id)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
