import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export default function AddStockModal({ open, onClose, onAdd }) {
  const [ticker, setTicker] = useState("");
  const [positionSize, setPositionSize] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!ticker.trim()) return;
    setLoading(true);
    await onAdd(ticker.trim().toUpperCase(), positionSize ? parseFloat(positionSize) : null);
    setTicker("");
    setPositionSize("");
    setLoading(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Stock to Portfolio</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label>Ticker Symbol</Label>
            <Input
              placeholder="e.g. AAPL, MSFT"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              className="h-10"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Position Size (optional)</Label>
            <Input
              type="number"
              placeholder="Number of shares"
              value={positionSize}
              onChange={(e) => setPositionSize(e.target.value)}
              className="h-10"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={!ticker.trim() || loading} className="flex-1">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}