import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, Zap, Infinity as InfinityIcon, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID;

const packs = [
  {
    id: "starter",
    name: "Starter Pack",
    price: "$9.90",
    credits: 25,
    perCredit: "$0.40 / credit",
    desc: "Great for occasional research.",
    highlighted: false,
    badge: null,
    features: ["25 credits", "Never expire", "All AI features"],
  },
  {
    id: "pro",
    name: "Pro Pack",
    price: "$14.90",
    credits: 50,
    perCredit: "$0.30 / credit",
    desc: "Best balance of value and volume.",
    highlighted: true,
    badge: "Most Popular",
    features: ["50 credits", "Never expire", "All AI features", "~25% better value"],
  },
  {
    id: "power",
    name: "Power Pack",
    price: "$24.90",
    credits: 100,
    perCredit: "$0.25 / credit",
    desc: "For active research investors.",
    highlighted: false,
    badge: "Best Value",
    features: ["100 credits", "Never expire", "All AI features", "~38% better value"],
  },
];

export default function Pricing() {
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loadingPack, setLoadingPack] = useState(null);
  const [paypalReady, setPaypalReady] = useState(false);
  const [activePack, setActivePack] = useState(null);
  const buttonsContainerRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then(async (u) => {
      setUser(u);
      if (u) {
        const subs = await base44.entities.UserSubscription.filter({ userId: u.email });
        if (subs.length > 0) setSubscription(subs[0]);
      }
    });
  }, []);

  // Load PayPal SDK once
  useEffect(() => {
    if (window.paypal) { setPaypalReady(true); return; }
    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD&intent=capture`;
    script.onload = () => setPaypalReady(true);
    script.onerror = () => toast.error("Failed to load PayPal. Please refresh.");
    document.body.appendChild(script);
  }, []);

  // Render PayPal buttons when a pack is selected
  useEffect(() => {
    if (!paypalReady || !activePack || !buttonsContainerRef.current) return;
    buttonsContainerRef.current.innerHTML = "";

    window.paypal.Buttons({
      style: { layout: "vertical", color: "blue", shape: "rect", label: "paypal", height: 42 },
      createOrder: async () => {
        setLoadingPack(activePack.id);
        const res = await base44.functions.invoke("createPaypalOrder", { packId: activePack.id });
        setLoadingPack(null);
        if (res.data?.orderId) return res.data.orderId;
        toast.error(res.data?.error || "Failed to create order");
        throw new Error("create order failed");
      },
      onApprove: async (data) => {
        setLoadingPack(activePack.id);
        const res = await base44.functions.invoke("capturePaypalOrder", {
          orderId: data.orderID,
          packId: activePack.id,
        });
        setLoadingPack(null);
        if (res.data?.success) {
          toast.success(`✅ ${res.data.credits} credits added! New balance: ${res.data.newBalance}`);
          setSubscription((prev) => prev
            ? { ...prev, creditsBalance: res.data.newBalance }
            : { creditsBalance: res.data.newBalance });
          setActivePack(null);
        } else {
          toast.error(res.data?.error || "Payment capture failed");
        }
      },
      onCancel: () => { setLoadingPack(null); },
      onError: (err) => {
        setLoadingPack(null);
        toast.error("PayPal error — please try again.");
        console.error(err);
      },
    }).render(buttonsContainerRef.current);
  }, [paypalReady, activePack]);

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="h-14 border-b border-border bg-card/80 backdrop-blur-md flex items-center px-4 gap-3">
        <Link to="/dashboard">
          <Button variant="ghost" size="sm" className="gap-1.5 h-8">
            <ArrowLeft className="h-3.5 w-3.5" />
            Dashboard
          </Button>
        </Link>
        <div className="flex-1" />
        {subscription && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-primary/25 bg-primary/10 text-primary text-xs font-semibold">
            <Zap className="h-3 w-3" />
            <span className="font-mono tabular-nums">{subscription.creditsBalance ?? 0}</span>
            <span>credits</span>
          </div>
        )}
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <div className="text-center mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">Buy Credits</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
            Pay only for what you use.
          </h1>
          <p className="mt-3 text-muted-foreground">
            One-time purchase. <span className="text-foreground font-medium">Credits never expire.</span>
          </p>
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-semibold">
            <InfinityIcon className="h-3.5 w-3.5" />
            1 credit = 1 standard analysis · 2 credits = scenario / portfolio analysis
          </div>
        </div>

        {/* Free tier banner */}
        <div className="max-w-3xl mx-auto mb-8 rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 to-primary/5 p-5 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
              <Zap className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Free Plan — 10 credits on signup</p>
              <p className="text-xs text-muted-foreground">No card required. Try every AI feature on us.</p>
            </div>
          </div>
          <span className="text-xs font-bold uppercase tracking-wide px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            Auto-granted
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
          {packs.map((pack) => (
            <div
              key={pack.id}
              className={`relative rounded-2xl border p-6 flex flex-col ${
                pack.highlighted
                  ? "border-primary/50 bg-primary/5 shadow-xl shadow-primary/10"
                  : "border-border bg-card"
              }`}
            >
              {pack.badge && (
                <div
                  className={`absolute -top-3.5 left-1/2 -translate-x-1/2 text-xs font-bold px-4 py-1 rounded-full tracking-wide uppercase whitespace-nowrap ${
                    pack.highlighted ? "bg-primary text-primary-foreground" : "bg-amber-400 text-black"
                  }`}
                >
                  {pack.badge}
                </div>
              )}
              <div className="mb-5">
                <p className="text-sm font-semibold text-muted-foreground mb-1">{pack.name}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-foreground">{pack.price}</span>
                  <span className="text-sm text-muted-foreground">one-time</span>
                </div>
                <div className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-primary">
                  <Zap className="h-3 w-3" />
                  {pack.credits} credits — {pack.perCredit}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{pack.desc}</p>
              </div>
              <ul className="space-y-2.5 mb-6 flex-1">
                {pack.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-foreground/80">
                    <Check className="h-3.5 w-3.5 text-emerald-400 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => setActivePack(pack)}
                variant={pack.highlighted ? "default" : "outline"}
                className={`w-full h-10 font-semibold text-sm ${pack.highlighted ? "shadow-lg shadow-primary/20" : ""}`}
                disabled={loadingPack === pack.id}
              >
                {loadingPack === pack.id ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> Processing…</>
                ) : (
                  `Buy ${pack.credits} Credits`
                )}
              </Button>
            </div>
          ))}
        </div>

        {activePack && (
          <div className="max-w-md mx-auto bg-card border border-border rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-muted-foreground">Selected pack</p>
                <p className="text-base font-bold text-foreground">{activePack.name} — {activePack.price}</p>
                <p className="text-xs text-primary font-semibold">+{activePack.credits} credits</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setActivePack(null)}>Change</Button>
            </div>
            {!paypalReady ? (
              <div className="flex items-center justify-center py-6 gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading PayPal…
              </div>
            ) : (
              <div ref={buttonsContainerRef} />
            )}
            <p className="mt-3 text-[11px] text-muted-foreground flex items-center gap-1.5 justify-center">
              <ShieldCheck className="h-3 w-3" />
              Secure payment via PayPal · Credits added instantly
            </p>
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground mt-10">
          Questions? Credits never expire. No subscriptions, no auto-renewals.
        </p>
      </div>
    </div>
  );
}