import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Lock, ShoppingCart, Zap } from "lucide-react";

export default function UpgradeModal({ creditsBalance = 0, creditsNeeded = 1, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-card border border-border rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center">
        <div className="h-14 w-14 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center mx-auto mb-5">
          <Lock className="h-6 w-6 text-amber-400" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-1">Not Enough Credits</h2>
        <p className="text-sm text-muted-foreground mb-1">
          You need <strong className="text-foreground">{creditsNeeded} credit{creditsNeeded > 1 ? "s" : ""}</strong> for this action.
        </p>
        <p className="text-sm text-muted-foreground mb-6">
          Your balance:{" "}
          <strong className={creditsBalance === 0 ? "text-rose-400" : "text-amber-400"}>
            {creditsBalance} credit{creditsBalance !== 1 ? "s" : ""}
          </strong>
        </p>

        <div className="flex flex-col gap-2.5">
          <Link to="/pricing">
            <Button className="w-full gap-2 font-semibold">
              <ShoppingCart className="h-4 w-4" />
              Buy Credits
            </Button>
          </Link>
          <p className="text-[11px] text-muted-foreground flex items-center justify-center gap-1">
            <Zap className="h-3 w-3 text-primary" />
            From $9.90 — credits never expire
          </p>
          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={onClose}>
            Maybe later
          </Button>
        </div>
      </div>
    </div>
  );
}