import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Link } from "react-router";
import { QRCodeCanvas } from "qrcode.react";
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Store, MessageSquare, TrendingUp, TrendingDown, Minus,
  ArrowLeft, RefreshCw, Utensils, Users, Leaf, HelpCircle, ChevronDown,
  QrCode, Copy, Share2, X, Check, Info,
} from "lucide-react";
import { Tooltip as UITooltip, TooltipTrigger as UITooltipTrigger, TooltipContent as UITooltipContent } from "../components/ui/tooltip";
import {
  format, parseISO, formatDistanceToNow,
  subDays, isAfter, startOfMonth, endOfMonth, subMonths, isWithinInterval,
} from "date-fns";
import { apiFetch } from "../lib/api";
import { PLANS, PLAN_ORDER, comparePlans, type PlanId } from "../lib/plans";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

interface Shop {
  id: number;
  name: string;
  ownerId: string | null;
  plan: PlanId;
}

interface Feedback {
  id: string;
  description: string;
  categories: string[];
  shop_name: string;
  shop: Shop | null;
  created_at: string;
}

type Period = "7d" | "30d" | "90d" | "1y" | "2y" | "3y" | "4y" | "5y" | "all";

const CATEGORIES = ["taste", "service", "environment", "other"] as const;

const CATEGORY_META = {
  taste:       { label: "#Taste",       icon: Utensils,   color: "#ac7f5e", bg: "#fef7f2", light: "#fdf1e7" },
  service:     { label: "#Service",     icon: Users,      color: "#d4896e", bg: "#fef3ec", light: "#fdeee6" },
  environment: { label: "#Environment", icon: Leaf,       color: "#6a9470", bg: "#f2f6f2", light: "#eaf3ea" },
  other:       { label: "#Other",       icon: HelpCircle, color: "#8a8078", bg: "#f5f4f3", light: "#eeeceb" },
} as const;

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: "7d",  label: "7 days"   },
  { value: "30d", label: "30 days"  },
  { value: "90d", label: "3 months" },
  { value: "1y",  label: "1 year"   },
  { value: "2y",  label: "2 years"  },
  { value: "3y",  label: "3 years"  },
  { value: "4y",  label: "4 years"  },
  { value: "5y",  label: "5 years"  },
  { value: "all", label: "All time" },
];

function cutoffDate(period: Period): Date | null {
  if (period === "all") return null;
  if (period === "7d")  return subDays(new Date(), 7);
  if (period === "30d") return subDays(new Date(), 30);
  if (period === "90d") return subDays(new Date(), 90);
  const years = parseInt(period, 10);
  return subDays(new Date(), years * 365);
}

function applyPeriod(feedback: Feedback[], period: Period): Feedback[] {
  const cutoff = cutoffDate(period);
  if (!cutoff) return feedback;
  return feedback.filter((f) => {
    try { return isAfter(parseISO(f.created_at), cutoff!); }
    catch { return false; }
  });
}

// ── Plan change dropdown ──────────────────────────────────────────────────────

function PlanChanger({
  currentPlan,
  onPlanChanged,
}: {
  currentPlan: PlanId;
  onPlanChanged: (plan: PlanId) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<PlanId | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setPending(null);
        setError(null);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  function getIntent(planId: PlanId): { label: string; color: string } | null {
    if (planId === currentPlan) return null;
    const diff = comparePlans(planId, currentPlan);
    if (planId === "free") {
      return { label: "Cancel subscription — will revert to Free plan", color: "#c0614c" };
    }
    if (diff > 0) {
      return { label: `Upgrade to ${PLANS[planId].label} — $${PLANS[planId].price}/mo`, color: "#5e9e6a" };
    }
    return { label: `Downgrade to ${PLANS[planId].label} — $${PLANS[planId].price}/mo`, color: "#d4896e" };
  }

  async function confirmChange() {
    if (!pending || pending === currentPlan) return;
    setSaving(true);
    setError(null);
    try {
      await apiFetch("/shops/mine/plan", {
        method: "PATCH",
        body: JSON.stringify({ plan: pending }),
      });
      onPlanChanged(pending);
      setOpen(false);
      setPending(null);
    } catch (err: any) {
      setError(err.message ?? "Failed to update plan.");
    } finally {
      setSaving(false);
    }
  }

  const intent = pending ? getIntent(pending) : null;
  const currentMeta = PLANS[currentPlan];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { setOpen((o) => !o); setPending(null); setError(null); }}
        className="flex items-center gap-1.5 bg-[#fef7f2] border border-[#f5d8c8] rounded-full px-3 py-1 text-xs font-medium text-[#ac7f5e] hover:bg-[#fdeee6] transition-colors"
      >
        {currentMeta.label}
        {currentMeta.price > 0 && <span className="text-[#ac7f5e]/70">${currentMeta.price}/mo</span>}
        <ChevronDown className="w-3 h-3" />
      </button>

      {open && (
        <div className="absolute top-full mt-2 right-0 w-64 bg-white border border-[#e8e8e4] rounded-2xl shadow-xl z-50 overflow-hidden">
          <div className="p-2 space-y-0.5">
            {PLAN_ORDER.map((planId) => {
              const p = PLANS[planId];
              const isCurrent = planId === currentPlan;
              const isPending = planId === pending;
              const intentForThis = getIntent(planId);

              return (
                <button
                  key={planId}
                  onClick={() => setPending(isCurrent ? null : planId)}
                  disabled={isCurrent}
                  className={`w-full text-left rounded-xl px-3 py-2.5 transition-all ${
                    isCurrent
                      ? "bg-[#fef7f2] cursor-default"
                      : isPending
                      ? "bg-[#f5f4f3] ring-1 ring-[#212120]/10"
                      : "hover:bg-[#f9f8f7]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className={`text-sm font-medium ${isCurrent ? "text-[#ac7f5e]" : "text-[#212120]"}`}>
                        {p.label}
                      </span>
                      <span className="text-xs text-[#adadad] ml-2">{p.limitLabel} feedbacks</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-[#696b63]">
                        {p.price === 0 ? "Free" : `$${p.price}/mo`}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] bg-[#ac7f5e] text-white rounded-full px-1.5 py-0.5 font-medium">
                          Current
                        </span>
                      )}
                      {isPending && !isCurrent && (
                        <span className="w-4 h-4 rounded-full bg-[#212120] flex items-center justify-center">
                          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 8">
                            <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                      )}
                    </div>
                  </div>
                  {isPending && intentForThis && (
                    <p className="text-[11px] mt-1 font-medium" style={{ color: intentForThis.color }}>
                      {intentForThis.label}
                    </p>
                  )}
                </button>
              );
            })}
          </div>

          {pending && pending !== currentPlan && (
            <div className="px-3 pb-3 space-y-2 border-t border-[#f0ede8] pt-2 mt-1">
              {error && (
                <p className="text-xs text-red-600 bg-red-50 rounded-md px-2 py-1.5">{error}</p>
              )}
              <Button
                onClick={confirmChange}
                disabled={saving}
                size="sm"
                className="w-full bg-[#212120] hover:bg-[#212120]/90 text-white text-xs"
              >
                {saving ? "Saving…" : `Confirm — switch to ${PLANS[pending].label}`}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── QR Code Modal ─────────────────────────────────────────────────────────────

function QRCodeModal({ shop, onClose }: { shop: Shop; onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);

  const shopUrl = `${window.location.origin}/?shop=${encodeURIComponent(shop.name)}`;

  async function copyUrl() {
    await navigator.clipboard.writeText(shopUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function shareQR() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], `${shop.name}-qr.png`, { type: "image/png" });
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], title: `${shop.name} — Feedback QR`, url: shopUrl });
        } else {
          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = `${shop.name}-qr.png`;
          a.click();
          URL.revokeObjectURL(a.href);
        }
      }, "image/png");
    } catch {
      // user cancelled share
    }
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const categories = [
    { id: "taste", label: "#Taste" },
    { id: "service", label: "#Service" },
    { id: "environment", label: "#Environment" },
    { id: "other", label: "#Other" },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-[#fbfcf7] rounded-[28px] shadow-2xl w-full max-w-sm mx-4 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-[#fef7f2] rounded-[12px] flex items-center justify-center">
              <QrCode className="w-4.5 h-4.5 text-[#ac7f5e]" style={{ width: 18, height: 18 }} />
            </div>
            <div>
              <h2 className="text-[#212120] font-semibold text-base leading-tight">QR Code</h2>
              <p className="text-[#adadad] text-xs">{shop.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#efefef] flex items-center justify-center text-[#696b63] hover:bg-[#e4e4e0] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 pb-6 space-y-4">

          {/* Shop name card — same style as FeedbackForm shop input */}
          <div className="bg-[#efefef] rounded-[26px] px-6 py-4">
            <p className="text-[#adadad] text-xs mb-1">Shop</p>
            <p className="text-[#212120] text-lg font-normal leading-snug">{shop.name}</p>
          </div>

          {/* Category tags preview — same style as FeedbackForm */}
          <div className="bg-[#efefef] rounded-[26px] px-6 py-4">
            <p className="font-bold text-[#adadad] text-xs mb-3">Select a category tag</p>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <span
                  key={cat.id}
                  className="bg-[#fef7f2] border-2 border-dashed border-[#f5d8c8] rounded-[30px] px-4 py-1.5 text-[#3a1834] text-sm"
                >
                  {cat.label}
                </span>
              ))}
            </div>
          </div>

          {/* QR Code */}
          <div className="bg-white rounded-[24px] p-6 flex flex-col items-center gap-4 border border-[#e8e8e4]">
            <QRCodeCanvas
              ref={canvasRef}
              value={shopUrl}
              size={180}
              bgColor="#ffffff"
              fgColor="#212120"
              level="M"
              style={{ borderRadius: 8 }}
            />
            <div className="flex items-center justify-center gap-1.5">
              <p className="text-[#adadad] text-[11px] text-center">
                Scan to leave feedback for <span className="text-[#212120] font-medium">{shop.name}</span>
              </p>
              <UITooltip>
                <UITooltipTrigger asChild>
                  <Info className="w-3 h-3 text-[#adadad] shrink-0 cursor-default" />
                </UITooltipTrigger>
                <UITooltipContent side="top" className="max-w-[180px] text-center text-[11px] leading-snug">
                  Shop name is pre-filled — customers just pick a tag and submit
                </UITooltipContent>
              </UITooltip>
            </div>
          </div>

          {/* URL row */}
          <div className="flex items-center gap-2 bg-[#efefef] rounded-[18px] px-4 py-3">
            <p className="flex-1 text-[#696b63] text-xs truncate">{shopUrl}</p>
            <button
              onClick={copyUrl}
              className="shrink-0 flex items-center gap-1 bg-white rounded-[12px] px-3 py-1.5 text-xs font-medium text-[#212120] hover:bg-[#f5f4f3] transition-colors shadow-sm"
            >
              {copied ? <Check className="w-3 h-3 text-[#5e9e6a]" /> : <Copy className="w-3 h-3" />}
              {copied ? "Copied!" : "Copy URL"}
            </button>
          </div>

          {/* Share button */}
          <button
            onClick={shareQR}
            className="w-full flex items-center justify-center gap-2 bg-[#ac7f5e] hover:bg-[#9a6f4e] text-white rounded-[22px] py-4 font-bold text-base transition-all hover:scale-[1.02] hover:shadow-lg active:scale-100"
          >
            <Share2 className="w-4 h-4" />
            Share QR
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Register shop form ────────────────────────────────────────────────────────

function RegisterShopForm({ onRegistered }: { onRegistered: (shop: Shop) => void }) {
  const [name, setName] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<PlanId>("free");
  const [error, setError] = useState<string | null>(null);
  const [showDuplicatePopup, setShowDuplicatePopup] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const shop = await apiFetch<Shop>("/shops", {
        method: "POST",
        body: JSON.stringify({ name, plan: selectedPlan }),
      });
      onRegistered(shop);
    } catch (err: any) {
      const msg: string = err.message ?? "";
      if (msg.toLowerCase().includes("already exists")) {
        setShowDuplicatePopup(true);
      } else {
        setError(msg || "Failed to register shop");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#fbfcf7] flex flex-col">
      <div className="px-6 md:px-10 py-6 flex items-center gap-3 border-b border-[#e8e8e4]">
        <Link
          to="/"
          className="flex items-center gap-1.5 text-[#696b63] hover:text-[#212120] transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-[#fef7f2] rounded-[18px] flex items-center justify-center mx-auto mb-4">
              <Store className="w-7 h-7 text-[#ac7f5e]" />
            </div>
            <h1 className="text-2xl font-semibold text-[#212120]">Register your shop</h1>
            <p className="text-sm text-[#696b63]">
              Add your shop to start receiving customer feedback.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="shop-name">Shop name</Label>
              <Input
                id="shop-name"
                type="text"
                placeholder="e.g. The Coffee House"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
                maxLength={100}
              />
            </div>

            {/* Plan selector */}
            <div className="space-y-2">
              <Label>Choose a plan</Label>
              <div className="grid grid-cols-2 gap-2">
                {PLAN_ORDER.map((planId) => {
                  const p = PLANS[planId];
                  const active = selectedPlan === planId;
                  return (
                    <button
                      key={planId}
                      type="button"
                      onClick={() => setSelectedPlan(planId)}
                      className={`text-left rounded-xl px-3 py-3 border-2 transition-all ${
                        active
                          ? "border-[#ac7f5e] bg-[#fef7f2]"
                          : "border-[#e8e8e4] bg-white hover:border-[#d0ccc8]"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className={`text-sm font-semibold ${active ? "text-[#ac7f5e]" : "text-[#212120]"}`}>
                          {p.label}
                        </span>
                        {active && (
                          <span className="w-4 h-4 rounded-full bg-[#ac7f5e] flex items-center justify-center">
                            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 8">
                              <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#696b63]">{p.limitLabel} feedbacks</p>
                      <p className={`text-xs font-medium mt-0.5 ${active ? "text-[#ac7f5e]" : "text-[#212120]/60"}`}>
                        {p.price === 0 ? "Free" : `$${p.price}/mo`}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#ac7f5e] hover:bg-[#9a6f4e] text-white"
            >
              {loading ? "Registering…" : "Register shop"}
            </Button>
          </form>
        </div>
      </div>

      {/* Duplicate-name popup */}
      {showDuplicatePopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl px-8 py-7 max-w-xs w-full mx-4 text-center space-y-4">
            <div className="text-3xl">⚠️</div>
            <p className="text-[#212120] font-semibold text-lg leading-snug">
              A shop with a similar name already exists.
            </p>
            <p className="text-sm text-[#212120]/60">Please try a different shop name.</p>
            <Button
              onClick={() => setShowDuplicatePopup(false)}
              className="w-full bg-[#212120] hover:bg-[#212120]/90 text-white"
            >
              OK
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

interface QuotaStatus {
  plan: string;
  limit: number;
  used: number;
  hiddenCount: number;
  periodStart: string;
  periodEnd: string;
}

// ── Dashboard content ─────────────────────────────────────────────────────────

function ShopDashboardContent({
  shop,
  onShopUpdate,
}: {
  shop: Shop;
  onShopUpdate: (updated: Partial<Shop>) => void;
}) {
  const [allFeedback, setAllFeedback]       = useState<Feedback[]>([]);
  const [quota, setQuota]                   = useState<QuotaStatus | null>(null);
  const [period, setPeriod]                 = useState<Period>("30d");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [feedLimit, setFeedLimit]           = useState(10);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState<string | null>(null);
  const [preciseDates, setPreciseDates]     = useState<Set<string>>(new Set());
  const [showQR, setShowQR]                 = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [feedbackData, quotaData] = await Promise.all([
        apiFetch<Feedback[]>("/feedback"),
        apiFetch<QuotaStatus>("/subscriptions/mine").catch(() => null),
      ]);
      setAllFeedback(feedbackData);
      setQuota(quotaData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  function handlePlanChanged(newPlan: PlanId) {
    onShopUpdate({ plan: newPlan });
    // Immediately reflect the new limit without a round-trip
    if (quota) {
      const newLimit = PLANS[newPlan].limit;
      setQuota({ ...quota, plan: newPlan, limit: newLimit, hiddenCount: Math.max(0, quota.used - newLimit) });
    }
  }

  const togglePreciseDate = (id: string) =>
    setPreciseDates((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  // All feedbacks for this shop, split into current-period and prior-period.
  // Within the current billing period, only the first `limit` feedbacks
  // (chronologically) are visible — those added after the limit was hit are hidden.
  const shopFeedback = useMemo(() =>
    allFeedback.filter((f) => f.shop?.id === shop.id),
  [allFeedback, shop.id]);

  const visibleShopFeedback = useMemo(() => {
    if (!quota) return shopFeedback;

    const periodStart = new Date(quota.periodStart);
    const periodEnd   = new Date(quota.periodEnd);

    const inPeriod  = shopFeedback.filter((f) => {
      const d = new Date(f.created_at);
      return d >= periodStart && d < periodEnd;
    });
    const outOfPeriod = shopFeedback.filter((f) => {
      const d = new Date(f.created_at);
      return d < periodStart || d >= periodEnd;
    });

    // Sort ascending so oldest are always within quota
    const sortedInPeriod = [...inPeriod].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );

    return [...outOfPeriod, ...sortedInPeriod.slice(0, quota.limit)];
  }, [shopFeedback, quota]);

  const periodFeedback = useMemo(() =>
    applyPeriod(visibleShopFeedback, period),
  [visibleShopFeedback, period]);

  const prevPeriodFeedback = useMemo(() => {
    if (period === "all") return [];
    const days  = period === "7d" ? 7 : period === "30d" ? 30 : 90;
    const end   = subDays(new Date(), days);
    const start = subDays(new Date(), days * 2);
    return visibleShopFeedback.filter((f) => {
      try { return isWithinInterval(parseISO(f.created_at), { start, end }); }
      catch { return false; }
    });
  }, [visibleShopFeedback, period]);

  const categoryCounts = useMemo(() =>
    CATEGORIES.map((cat) => ({
      cat,
      count: periodFeedback.filter((f) => f.categories.includes(cat)).length,
    })),
  [periodFeedback]);

  const donutData = useMemo(() =>
    categoryCounts
      .filter((d) => d.count > 0)
      .map((d) => ({ name: CATEGORY_META[d.cat].label, value: d.count, fill: CATEGORY_META[d.cat].color })),
  [categoryCounts]);

  const monthlyData = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const anchor = subMonths(now, 5 - i);
      const start  = startOfMonth(anchor);
      const end    = endOfMonth(anchor);
      const month  = visibleShopFeedback.filter((f) => {
        try { return isWithinInterval(parseISO(f.created_at), { start, end }); }
        catch { return false; }
      });
      return {
        label:       format(start, "MMM"),
        taste:       month.filter((f) => f.categories.includes("taste")).length,
        service:     month.filter((f) => f.categories.includes("service")).length,
        environment: month.filter((f) => f.categories.includes("environment")).length,
        other:       month.filter((f) => f.categories.includes("other")).length,
      };
    });
  }, [visibleShopFeedback]);

  const trend = useMemo(() => {
    const curr = periodFeedback.length;
    const prev = prevPeriodFeedback.length;
    if (period === "all" || prev === 0) return null;
    const pct = Math.round(((curr - prev) / prev) * 100);
    return { pct, up: pct > 0, flat: pct === 0 };
  }, [periodFeedback, prevPeriodFeedback, period]);

  const topCat = useMemo(() => {
    const max = categoryCounts.reduce((a, b) => (b.count > a.count ? b : a), categoryCounts[0]);
    return max?.count > 0 ? max : null;
  }, [categoryCounts]);

  const feedFiltered = useMemo(() => {
    const base = [...periodFeedback].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
    return categoryFilter === "all" ? base : base.filter((f) => f.categories.includes(categoryFilter));
  }, [periodFeedback, categoryFilter]);

  const visibleFeed = feedFiltered.slice(0, feedLimit);
  const totalInPeriod = periodFeedback.length;
  const totalAllTime  = visibleShopFeedback.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fbfcf7] flex items-center justify-center">
        <p className="text-[#696b63] text-base animate-pulse">Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#fbfcf7] flex items-center justify-center px-6">
        <div className="bg-[#efefef] rounded-[26px] p-8 text-center max-w-sm">
          <p className="text-[#212120] font-medium mb-2">Could not load data</p>
          <p className="text-[#696b63] text-sm mb-6">{error}</p>
          <button onClick={fetchData} className="bg-[#ac7f5e] text-white rounded-[20px] px-6 py-3 text-sm font-bold hover:opacity-90 transition-opacity">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fbfcf7]">

      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#fbfcf7]/90 backdrop-blur-sm border-b border-[#e8e8e4] px-6 md:px-10 py-4">
        <div className="max-w-screen-xl mx-auto flex items-center gap-4">
          <Link
            to="/"
            className="flex items-center gap-1.5 text-[#696b63] hover:text-[#212120] transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm hidden sm:inline">Home</span>
          </Link>

          <div className="flex-1 min-w-0 flex items-center gap-3">
            <div className="w-8 h-8 bg-[#fef7f2] rounded-[10px] flex items-center justify-center shrink-0">
              <Store className="w-4 h-4 text-[#ac7f5e]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-[#212120] font-medium text-base md:text-lg truncate leading-tight">
                  {shop.name}
                </h1>
                <PlanChanger
                  currentPlan={shop.plan}
                  onPlanChanged={handlePlanChanged}
                />
              </div>
              <p className="text-[#adadad] text-xs">{totalAllTime} total feedback</p>
            </div>
          </div>

          <div className="flex items-center bg-[#efefef] rounded-[20px] p-1 gap-0.5 shrink-0">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { setPeriod(opt.value); setFeedLimit(10); }}
                className={`px-3 py-1.5 rounded-[16px] text-xs font-medium transition-all ${
                  period === opt.value
                    ? "bg-white text-[#212120] shadow-sm"
                    : "text-[#696b63] hover:text-[#212120]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            onClick={fetchData}
            className="bg-[#efefef] rounded-[18px] p-2.5 text-[#696b63] hover:text-[#212120] hover:bg-[#e4e4e0] transition-colors shrink-0"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Floating QR button — bottom-right, same position as "My Shop" on public page */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setShowQR(true)}
          className="flex items-center gap-2 bg-[#ac7f5e] text-white text-sm font-medium rounded-full px-4 py-2.5 shadow-lg hover:bg-[#9a6f4e] transition-colors"
        >
          <QrCode className="w-4 h-4" />
          <span>QR Code</span>
        </button>
      </div>

      {showQR && <QRCodeModal shop={shop} onClose={() => setShowQR(false)} />}

      <div className="px-6 md:px-10 py-8 max-w-screen-xl mx-auto space-y-6">

        {/* Quota-exceeded banner */}
        {quota && quota.hiddenCount > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-amber-50 border-2 border-amber-300 rounded-2xl px-5 py-4 shadow-sm">
            <div className="flex items-start gap-3 flex-1">
              <div className="text-2xl shrink-0 mt-0.5">⚠️</div>
              <div>
                <p className="font-semibold text-amber-900 text-base leading-snug">
                  {quota.hiddenCount.toLocaleString()} feedback{quota.hiddenCount === 1 ? "" : "s"} hidden
                </p>
                <p className="text-sm text-amber-800 mt-0.5">
                  You've reached your{" "}
                  <span className="font-medium">{PLANS[quota.plan as PlanId]?.label ?? quota.plan}</span>{" "}
                  plan limit of{" "}
                  <span className="font-medium">{PLANS[quota.plan as PlanId]?.limitLabel ?? quota.limit.toLocaleString()}</span>{" "}
                  feedbacks for this billing period. Upgrade your plan to view all feedback.
                </p>
              </div>
            </div>
            <div className="shrink-0 sm:self-center">
              <PlanChanger
                currentPlan={shop.plan}
                onPlanChanged={handlePlanChanged}
              />
            </div>
          </div>
        )}

        {/* Hero strip */}
        <div className="bg-white border border-[#e8e8e4] rounded-[24px] px-6 md:px-8 py-6 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <p className="text-[#adadad] text-xs uppercase tracking-wide mb-1">
              {PERIOD_OPTIONS.find((p) => p.value === period)?.label}
            </p>
            <div className="flex items-baseline gap-3">
              <span className="text-[#212120] text-4xl md:text-5xl font-light">{totalInPeriod}</span>
              <span className="text-[#696b63] text-sm">feedback received</span>
              {trend && (
                <span className={`flex items-center gap-1 text-sm font-medium ${
                  trend.flat ? "text-[#adadad]" : trend.up ? "text-[#5e9e6a]" : "text-[#c0614c]"
                }`}>
                  {trend.flat ? <Minus className="w-4 h-4" /> : trend.up ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {Math.abs(trend.pct)}% vs prev.
                </span>
              )}
            </div>
          </div>

          {topCat && (
            <div className="flex items-center gap-3 bg-[#fef7f2] rounded-[18px] px-5 py-3 self-start sm:self-auto">
              <div className="w-8 h-8 rounded-[10px] flex items-center justify-center" style={{ backgroundColor: CATEGORY_META[topCat.cat].bg }}>
                {(() => { const Icon = CATEGORY_META[topCat.cat].icon; return <Icon className="w-4 h-4" style={{ color: CATEGORY_META[topCat.cat].color }} />; })()}
              </div>
              <div>
                <p className="text-[#adadad] text-[10px] uppercase tracking-wide">Top topic</p>
                <p className="text-[#212120] text-sm font-medium capitalize">{topCat.cat}</p>
              </div>
            </div>
          )}
        </div>

        {/* Category cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {CATEGORIES.map((cat) => {
            const meta  = CATEGORY_META[cat];
            const count = periodFeedback.filter((f) => f.categories.includes(cat)).length;
            const pct   = totalInPeriod > 0 ? Math.round((count / totalInPeriod) * 100) : 0;
            const Icon  = meta.icon;
            return (
              <button
                key={cat}
                onClick={() => setCategoryFilter(categoryFilter === cat ? "all" : cat)}
                className={`text-left rounded-[20px] px-5 py-5 border transition-all ${
                  categoryFilter === cat ? "border-2 shadow-sm" : "bg-white border border-[#e8e8e4] hover:border-[#d0ccc8]"
                }`}
                style={categoryFilter === cat ? { borderColor: meta.color, backgroundColor: meta.light } : {}}
              >
                <div className="w-8 h-8 rounded-[10px] flex items-center justify-center mb-3" style={{ backgroundColor: meta.bg }}>
                  <Icon className="w-4 h-4" style={{ color: meta.color }} />
                </div>
                <p className="text-[#696b63] text-xs mb-0.5">{meta.label}</p>
                <p className="text-[#212120] text-2xl font-light">{count}</p>
                <div className="mt-2 h-1 bg-[#f0ede8] rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: meta.color }} />
                </div>
                <p className="text-[#adadad] text-[10px] mt-1">{pct}% of total</p>
              </button>
            );
          })}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2 bg-white border border-[#e8e8e4] rounded-[24px] p-6">
            <h2 className="text-[#212120] text-sm font-medium mb-1">Category Mix</h2>
            <p className="text-[#adadad] text-xs mb-4">Share of feedback by topic</p>
            {donutData.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-[#adadad] text-sm">No data for this period</div>
            ) : (
              <>
                <div className="relative">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={donutData} cx="50%" cy="50%" innerRadius={62} outerRadius={88} paddingAngle={3} dataKey="value" startAngle={90} endAngle={-270}>
                        {donutData.map((entry, i) => <Cell key={i} fill={entry.fill} strokeWidth={0} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e8e8e4", borderRadius: 12, fontSize: 12 }} formatter={(v) => [v, "feedback"]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl font-light text-[#212120]">{totalInPeriod}</span>
                    <span className="text-[10px] text-[#adadad] uppercase tracking-wide">total</span>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  {donutData.map((d) => (
                    <div key={d.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.fill }} />
                        <span className="text-[#696b63] text-xs">{d.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[#212120] text-xs font-medium">{d.value}</span>
                        <span className="text-[#adadad] text-[10px]">{totalInPeriod > 0 ? Math.round((d.value / totalInPeriod) * 100) : 0}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="lg:col-span-3 bg-white border border-[#e8e8e4] rounded-[24px] p-6">
            <h2 className="text-[#212120] text-sm font-medium mb-1">Monthly Breakdown</h2>
            <p className="text-[#adadad] text-xs mb-5">Feedback volume by category, last 6 months</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: "#696b63", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#adadad", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} width={24} />
                <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e8e8e4", borderRadius: 14, fontSize: 12, boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }} cursor={{ fill: "#faf7f4" }} />
                {CATEGORIES.map((cat, i) => (
                  <Bar key={cat} dataKey={cat} name={CATEGORY_META[cat].label} stackId="a" fill={CATEGORY_META[cat].color} radius={i === CATEGORIES.length - 1 ? [6, 6, 0, 0] : [0, 0, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-4">
              {CATEGORIES.map((cat) => (
                <div key={cat} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CATEGORY_META[cat].color }} />
                  <span className="text-[#696b63] text-[11px]">{CATEGORY_META[cat].label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Feedback Feed */}
        <div className="bg-white border border-[#e8e8e4] rounded-[24px] overflow-hidden">
          <div className="px-6 py-5 border-b border-[#f0ede8]">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="bg-[#fef7f2] rounded-[10px] p-2">
                <MessageSquare className="w-4 h-4 text-[#ac7f5e]" />
              </div>
              <h2 className="text-[#212120] text-sm font-medium">Customer Feedback</h2>
              <span className="ml-auto text-[#adadad] text-xs">{feedFiltered.length} entr{feedFiltered.length === 1 ? "y" : "ies"}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {(["all", ...CATEGORIES] as const).map((cat) => {
                const isAll = cat === "all";
                const meta  = isAll ? null : CATEGORY_META[cat];
                return (
                  <button
                    key={cat}
                    onClick={() => { setCategoryFilter(cat); setFeedLimit(10); }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                      categoryFilter === cat ? "text-white border-transparent" : "bg-transparent border-[#e8e8e4] text-[#696b63] hover:border-[#d0ccc8]"
                    }`}
                    style={
                      categoryFilter === cat && meta
                        ? { backgroundColor: meta.color, borderColor: meta.color }
                        : categoryFilter === cat
                        ? { backgroundColor: "#212120", borderColor: "#212120" }
                        : {}
                    }
                  >
                    {isAll ? "All" : meta!.label}
                  </button>
                );
              })}
            </div>
          </div>

          {visibleFeed.length === 0 ? (
            <div className="px-6 py-12 text-center text-[#adadad] text-sm">No feedback for this period yet.</div>
          ) : (
            <div className="divide-y divide-[#f5f4f2]">
              {visibleFeed.map((fb) => (
                <div key={fb.id} className="px-6 py-4">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex flex-wrap gap-1.5">
                      {fb.categories.map((cat) => {
                        const meta = CATEGORY_META[cat as keyof typeof CATEGORY_META];
                        return meta ? (
                          <span key={cat} className="px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ backgroundColor: meta.bg, color: meta.color }}>
                            {meta.label}
                          </span>
                        ) : null;
                      })}
                    </div>
                    <button
                      onClick={() => togglePreciseDate(fb.id)}
                      className="text-[#adadad] text-[10px] shrink-0 hover:text-[#696b63] transition-colors"
                    >
                      {preciseDates.has(fb.id)
                        ? format(parseISO(fb.created_at), "d MMM yyyy, HH:mm")
                        : formatDistanceToNow(parseISO(fb.created_at), { addSuffix: true })}
                    </button>
                  </div>
                  <p className="text-[#212120] text-sm leading-relaxed">{fb.description}</p>
                </div>
              ))}
            </div>
          )}

          {feedFiltered.length > feedLimit && (
            <div className="px-6 py-4 border-t border-[#f5f4f2] text-center">
              <button onClick={() => setFeedLimit((n) => n + 10)} className="text-[#ac7f5e] text-sm font-medium hover:underline">
                Load more ({feedFiltered.length - feedLimit} remaining)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Entry point ───────────────────────────────────────────────────────────────

export default function ShopDashboard() {
  const [myShop, setMyShop] = useState<Shop | null | undefined>(undefined);

  useEffect(() => {
    apiFetch<Shop | null>("/shops/mine")
      .then((shop) => setMyShop(shop ?? null))
      .catch(() => setMyShop(null));
  }, []);

  if (myShop === undefined) {
    return (
      <div className="min-h-screen bg-[#fbfcf7] flex items-center justify-center">
        <p className="text-[#696b63] text-base animate-pulse">Loading…</p>
      </div>
    );
  }

  if (myShop === null) {
    return <RegisterShopForm onRegistered={(shop) => setMyShop(shop)} />;
  }

  return (
    <ShopDashboardContent
      shop={myShop}
      onShopUpdate={(updated) => setMyShop((s) => s ? { ...s, ...updated } : s)}
    />
  );
}
