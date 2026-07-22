import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router";
import { apiFetch, getAppVisitorStats, AppVisitorStats } from "../lib/api";
import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area,
} from "recharts";
import {
  MessageSquare, Store, Tag, Clock, RefreshCw,
  TrendingUp, ArrowLeft, Inbox, Activity, Eye, EyeOff,
} from "lucide-react";
import {
  format, subWeeks, startOfWeek, endOfWeek,
  isWithinInterval, parseISO, formatDistanceToNow,
  isAfter, subDays,
} from "date-fns";
import StarRating from "../components/StarRating";
import FeedbackPhotosCell from "../components/FeedbackPhotosCell";

// ── Shared types ──────────────────────────────────────────────────────────────

interface Shop {
  id: number;
  name: string;
}

// Richer shape returned by the super-admin-only /shops/admin endpoint —
// every shop regardless of visibility, plus a feedback count each.
interface AdminShop extends Shop {
  plan: string;
  is_public: boolean;
  created_at: string;
  feedbackCount: number;
}

interface Feedback {
  id: string;
  description: string;
  categories: string[];
  shop_name: string;
  shop: Shop | null;
  created_at: string;
  source: string | null;
  rating: number | null;
  image_urls: string[] | null;
  is_public: boolean;
}

interface ContactSubmission {
  id: string;
  category: string;
  description: string;
  shopName: string | null;
  name: string;
  contactInfo: string;
  status: ContactStatus;
  createdAt: string;
}

type ContactStatus =
  | 'pending'
  | 'following'
  | 'success'
  | 'fail'
  | 'no-reply'
  | 'feature-dev';

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  taste: "#Taste", service: "#Service",
  environment: "#Environment", other: "#Other",
};
const CATEGORY_COLORS: Record<string, string> = {
  taste: "#ac7f5e", service: "#e8a882",
  environment: "#7e9a7e", other: "#b5aaa3",
};
const CATEGORY_CHIP_BG: Record<string, string> = {
  taste: "#fef7f2", service: "#fef3ec",
  environment: "#f2f5f2", other: "#f5f4f3",
};
const CONTACT_CATEGORY_LABELS: Record<string, string> = {
  "feedback":        "Feedback",
  "feature-request": "Feature Request",
  "free-trial":      "Free Trial Request",
  "book-demo":       "Book a Demo",
  "other":           "Other",
};
const CONTACT_CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  "feedback":        { bg: "#fef7f2", text: "#ac7f5e" },
  "feature-request": { bg: "#f0f4ff", text: "#4f6fbd" },
  "free-trial":      { bg: "#f0faf4", text: "#3d8a5c" },
  "book-demo":       { bg: "#fdf4ff", text: "#9b5db5" },
  "other":           { bg: "#f5f4f3", text: "#8a8078" },
};

const STATUS_META: Record<ContactStatus, { label: string; bg: string; text: string }> = {
  "pending":     { label: "Pending",     bg: "#f5f4f3", text: "#8a8078" },
  "following":   { label: "Following",   bg: "#f0f4ff", text: "#4f6fbd" },
  "success":     { label: "Success",     bg: "#f0faf4", text: "#3d8a5c" },
  "fail":        { label: "Fail",        bg: "#fff0f0", text: "#c0392b" },
  "no-reply":    { label: "No Reply",    bg: "#fef9ec", text: "#b07d12" },
  "feature-dev": { label: "Feature Dev", bg: "#fdf4ff", text: "#9b5db5" },
};

const STATUS_OPTIONS: ContactStatus[] = [
  "pending", "following", "success", "fail", "no-reply", "feature-dev",
];

type Tab = "feedback" | "shops" | "contacts" | "visitors";

type Period = "7d" | "30d" | "90d" | "1y" | "2y" | "3y" | "4y" | "5y" | "all";

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

// ── Main component ────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("feedback");

  // Feedback state
  const [allFeedback, setAllFeedback] = useState<Feedback[]>([]);
  const [shops, setShops] = useState<AdminShop[]>([]);
  const [selectedShopId, setSelectedShopId] = useState<string>("all");
  const [selectedPeriod, setSelectedPeriod] = useState<Period>("30d");
  const [feedbackLoading, setFeedbackLoading] = useState(true);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [preciseDates, setPreciseDates] = useState<Set<string>>(new Set());

  // Contacts state — fetched lazily when the tab is first opened
  const [contacts, setContacts] = useState<ContactSubmission[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactsError, setContactsError] = useState<string | null>(null);
  const [contactsFetched, setContactsFetched] = useState(false);

  // Visitors state — fetched lazily when the tab is first opened
  const [visitorStats, setVisitorStats] = useState<AppVisitorStats | null>(null);
  const [visitorsLoading, setVisitorsLoading] = useState(false);
  const [visitorsError, setVisitorsError] = useState<string | null>(null);
  const [visitorsFetched, setVisitorsFetched] = useState(false);
  const [visitorPeriod, setVisitorPeriod] = useState('30d');

  const togglePreciseDate = (id: string) =>
    setPreciseDates((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  // ── Feedback data ───────────────────────────────────────────────────────────

  const fetchFeedback = async () => {
    setFeedbackLoading(true);
    setFeedbackError(null);
    try {
      const [feedbackData, shopsData] = await Promise.all([
        apiFetch<Feedback[]>("/feedback"),
        apiFetch<AdminShop[]>("/shops/admin"),
      ]);
      setAllFeedback(feedbackData);
      setShops(shopsData);
    } catch (err) {
      setFeedbackError(err instanceof Error ? err.message : "Failed to load data.");
    } finally {
      setFeedbackLoading(false);
    }
  };

  useEffect(() => { fetchFeedback(); }, []);

  // ── Contacts data (lazy) ────────────────────────────────────────────────────

  const fetchContacts = async () => {
    setContactsLoading(true);
    setContactsError(null);
    try {
      const data = await apiFetch<ContactSubmission[]>("/contact");
      setContacts(data);
      setContactsFetched(true);
    } catch (err) {
      setContactsError(err instanceof Error ? err.message : "Failed to load contacts.");
    } finally {
      setContactsLoading(false);
    }
  };

  const fetchVisitors = async (period = visitorPeriod) => {
    setVisitorsLoading(true);
    setVisitorsError(null);
    try {
      const data = await getAppVisitorStats('telegram', period);
      setVisitorStats(data);
      setVisitorsFetched(true);
    } catch (err) {
      setVisitorsError(err instanceof Error ? err.message : "Failed to load visitor stats.");
    } finally {
      setVisitorsLoading(false);
    }
  };

  const handleVisitorPeriodChange = (period: string) => {
    setVisitorPeriod(period);
    fetchVisitors(period);
  };

  function handleTabChange(tab: Tab) {
    setActiveTab(tab);
    if (tab === "contacts" && !contactsFetched) fetchContacts();
    if (tab === "visitors" && !visitorsFetched) fetchVisitors();
  }

  // ── Feedback derived data ───────────────────────────────────────────────────

  const filtered = useMemo(() => {
    const cutoff = cutoffDate(selectedPeriod);
    return allFeedback.filter((f) => {
      if (selectedShopId !== "all" && String(f.shop?.id) !== selectedShopId) return false;
      if (cutoff) {
        try { return isAfter(parseISO(f.created_at), cutoff); }
        catch { return false; }
      }
      return true;
    });
  }, [allFeedback, selectedShopId, selectedPeriod]);

  const totalCount = filtered.length;
  const telegramCount = filtered.filter((f) => f.source === "telegram").length;

  const activeShopsCount = useMemo(() => {
    return new Set(filtered.map((f) => f.shop?.name ?? f.shop_name)).size;
  }, [filtered]);

  const topCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach((f) => f.categories.forEach((c) => { counts[c] = (counts[c] ?? 0) + 1; }));
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    return top ? { name: top[0], count: top[1] } : null;
  }, [filtered]);

  const latestFeedback = useMemo(() => {
    if (!filtered.length) return null;
    return filtered.reduce((a, b) => new Date(a.created_at) > new Date(b.created_at) ? a : b);
  }, [filtered]);

  const categoryData = useMemo(() =>
    ["taste", "service", "environment", "other"].map((cat) => ({
      name: CATEGORY_LABELS[cat],
      count: filtered.filter((f) => f.categories.includes(cat)).length,
      fill: CATEGORY_COLORS[cat],
    })),
  [filtered]);

  const weeklyData = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 8 }, (_, i) => {
      const anchor = subWeeks(now, 7 - i);
      const start = startOfWeek(anchor);
      const end = endOfWeek(anchor);
      return {
        label: format(start, "MMM d"),
        count: filtered.filter((f) => {
          try { return isWithinInterval(parseISO(f.created_at), { start, end }); }
          catch { return false; }
        }).length,
      };
    });
  }, [filtered]);

  const recentFeedback = useMemo(() =>
    [...filtered]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 20),
  [filtered]);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#fbfcf7]">

      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#fbfcf7]/90 backdrop-blur-sm border-b border-[#e8e8e4]">
        <div className="px-6 md:px-10 py-4 flex items-center gap-4">
          <Link
            to="/"
            className="flex items-center gap-1.5 text-[#696b63] hover:text-[#212120] transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm hidden sm:inline">Back</span>
          </Link>

          <div className="flex-1 min-w-0">
            <h1 className="font-normal text-[#212120] text-xl md:text-2xl truncate">
              Admin Dashboard
            </h1>
          </div>

          {activeTab === "feedback" && (
            <div className="flex items-center gap-2 shrink-0">
              <div className="relative">
                <select
                  value={selectedShopId}
                  onChange={(e) => setSelectedShopId(e.target.value)}
                  className="bg-[#efefef] rounded-[18px] pl-4 pr-8 py-2 text-[#212120] text-sm border-none outline-none cursor-pointer appearance-none"
                >
                  <option value="all">All Shops</option>
                  {shops.map((s) => (
                    <option key={s.id} value={String(s.id)}>{s.name}</option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#adadad] text-xs">▾</span>
              </div>
              <div className="relative">
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value as Period)}
                  className="bg-[#efefef] rounded-[18px] pl-4 pr-8 py-2 text-[#212120] text-sm border-none outline-none cursor-pointer appearance-none"
                >
                  {PERIOD_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#adadad] text-xs">▾</span>
              </div>
              <button
                onClick={fetchFeedback}
                className="bg-[#efefef] rounded-[18px] p-2.5 text-[#696b63] hover:text-[#212120] hover:bg-[#e4e4e0] transition-colors"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          )}

          {activeTab === "shops" && (
            <button
              onClick={fetchFeedback}
              className="bg-[#efefef] rounded-[18px] p-2.5 text-[#696b63] hover:text-[#212120] hover:bg-[#e4e4e0] transition-colors shrink-0"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}

          {activeTab === "contacts" && (
            <button
              onClick={fetchContacts}
              className="bg-[#efefef] rounded-[18px] p-2.5 text-[#696b63] hover:text-[#212120] hover:bg-[#e4e4e0] transition-colors shrink-0"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
          {activeTab === "visitors" && (
            <button
              onClick={fetchVisitors}
              className="bg-[#efefef] rounded-[18px] p-2.5 text-[#696b63] hover:text-[#212120] hover:bg-[#e4e4e0] transition-colors shrink-0"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Tab bar */}
        <div className="px-6 md:px-10 flex gap-0">
          {(["feedback", "shops", "contacts", "visitors"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-[#ac7f5e] text-[#ac7f5e]"
                  : "border-transparent text-[#696b63] hover:text-[#212120]"
              }`}
            >
              {tab === "feedback" ? (
                <><MessageSquare className="w-3.5 h-3.5" /> Feedback</>
              ) : tab === "shops" ? (
                <><Store className="w-3.5 h-3.5" /> Shops</>
              ) : tab === "contacts" ? (
                <><Inbox className="w-3.5 h-3.5" /> Contacts {contacts.length > 0 && <span className="bg-[#ac7f5e] text-white text-[10px] font-semibold rounded-full px-1.5 py-0.5 leading-none">{contacts.length}</span>}</>
              ) : (
                <><Activity className="w-3.5 h-3.5" /> Mini App</>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Feedback tab ── */}
      {activeTab === "feedback" && (
        <FeedbackTab
          loading={feedbackLoading}
          error={feedbackError}
          onRetry={fetchFeedback}
          totalCount={totalCount}
          telegramCount={telegramCount}
          selectedPeriod={selectedPeriod}
          activeShopsCount={activeShopsCount}
          totalShopsCount={shops.length}
          topCategory={topCategory}
          latestFeedback={latestFeedback}
          categoryData={categoryData}
          weeklyData={weeklyData}
          recentFeedback={recentFeedback}
          preciseDates={preciseDates}
          togglePreciseDate={togglePreciseDate}
          onVisibilityChange={(id, isPublic) =>
            setAllFeedback((prev) =>
              prev.map((f) => (f.id === id ? { ...f, is_public: isPublic } : f))
            )
          }
        />
      )}

      {/* ── Shops tab ── */}
      {activeTab === "shops" && (
        <ShopsTab
          loading={feedbackLoading}
          error={feedbackError}
          onRetry={fetchFeedback}
          shops={shops}
          onVisibilityChange={(id, isPublic) =>
            setShops((prev) =>
              prev.map((s) => (s.id === id ? { ...s, is_public: isPublic } : s))
            )
          }
        />
      )}

      {/* ── Contacts tab ── */}
      {activeTab === "contacts" && (
        <ContactsTab
          loading={contactsLoading}
          error={contactsError}
          contacts={contacts}
          onRetry={fetchContacts}
          onStatusChange={(id, status) =>
            setContacts((prev) =>
              prev.map((c) => (c.id === id ? { ...c, status } : c))
            )
          }
        />
      )}

      {/* ── Mini App visitors tab ── */}
      {activeTab === "visitors" && (
        <VisitorsTab
          loading={visitorsLoading}
          error={visitorsError}
          stats={visitorStats}
          onRetry={() => fetchVisitors(visitorPeriod)}
          period={visitorPeriod}
          onPeriodChange={handleVisitorPeriodChange}
        />
      )}
    </div>
  );
}

// ── Feedback tab ──────────────────────────────────────────────────────────────

function FeedbackTab({
  loading, error, onRetry, totalCount, telegramCount, selectedPeriod, activeShopsCount, totalShopsCount, topCategory,
  latestFeedback, categoryData, weeklyData, recentFeedback, preciseDates, togglePreciseDate, onVisibilityChange,
}: {
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  totalCount: number;
  telegramCount: number;
  selectedPeriod: Period;
  activeShopsCount: number;
  totalShopsCount: number;
  topCategory: { name: string; count: number } | null;
  latestFeedback: Feedback | null;
  categoryData: { name: string; count: number; fill: string }[];
  weeklyData: { label: string; count: number }[];
  recentFeedback: Feedback[];
  preciseDates: Set<string>;
  togglePreciseDate: (id: string) => void;
  onVisibilityChange: (id: string, isPublic: boolean) => void;
}) {
  const [updatingVisibility, setUpdatingVisibility] = useState<Set<string>>(new Set());

  async function handleVisibilityToggle(id: string, nextIsPublic: boolean) {
    setUpdatingVisibility((prev) => new Set(prev).add(id));
    try {
      await apiFetch(`/feedback/${id}/visibility`, {
        method: "PATCH",
        body: JSON.stringify({ isPublic: nextIsPublic }),
      });
      onVisibilityChange(id, nextIsPublic);
    } catch {
      // leave as-is — parent state didn't change, so the UI reflects the unchanged value
    } finally {
      setUpdatingVisibility((prev) => { const next = new Set(prev); next.delete(id); return next; });
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <p className="text-[#696b63] text-lg animate-pulse">Loading…</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex items-center justify-center py-32 px-6">
        <div className="bg-[#efefef] rounded-[26px] p-8 text-center max-w-md">
          <p className="text-[#212120] text-lg mb-2 font-medium">Could not load data</p>
          <p className="text-[#696b63] text-sm mb-6">{error}</p>
          <button onClick={onRetry} className="bg-[#ac7f5e] text-white rounded-[20px] px-6 py-3 font-bold hover:opacity-90 transition-opacity">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 md:px-10 py-8 space-y-6 max-w-screen-xl mx-auto">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={<MessageSquare className="w-5 h-5 text-[#ac7f5e]" />} iconBg="bg-[#fef7f2]"
          label={`Total Feedback · ${PERIOD_OPTIONS.find((o) => o.value === selectedPeriod)?.label ?? selectedPeriod}`}
          value={totalCount}
          sub={telegramCount > 0 ? `${telegramCount} from Telegram` : undefined}
        />
        <KpiCard icon={<Store className="w-5 h-5 text-[#696b63]" />} iconBg="bg-[#f2f4f2]" label="Active Shops" value={`${activeShopsCount}/${totalShopsCount}`} />
        <KpiCard
          icon={<Tag className="w-5 h-5 text-[#ac7f5e]" />} iconBg="bg-[#fef7f2]"
          label="Top Category" value={<span className="capitalize">{topCategory?.name ?? "—"}</span>}
          sub={topCategory ? `${topCategory.count} mentions` : undefined}
        />
        <KpiCard
          icon={<Clock className="w-5 h-5 text-[#696b63]" />} iconBg="bg-[#f2f4f2]"
          label="Latest Feedback"
          value={latestFeedback ? formatDistanceToNow(parseISO(latestFeedback.created_at), { addSuffix: true }) : "—"}
          valueSm sub={latestFeedback?.shop?.name ?? latestFeedback?.shop_name}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-[#e8e8e4] rounded-[24px] p-6">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="bg-[#fef7f2] rounded-[10px] p-2"><Tag className="w-4 h-4 text-[#ac7f5e]" /></div>
            <h2 className="text-[#212120] text-sm font-medium">Feedback by Category</h2>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={categoryData} barCategoryGap="35%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "#696b63", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#adadad", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} width={28} />
              <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e8e8e4", borderRadius: 14, fontSize: 12, boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }} cursor={{ fill: "#faf7f4" }} formatter={(v) => [v, "Feedback"]} />
              <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                {categoryData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border border-[#e8e8e4] rounded-[24px] p-6">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="bg-[#f2f4f2] rounded-[10px] p-2"><TrendingUp className="w-4 h-4 text-[#696b63]" /></div>
            <h2 className="text-[#212120] text-sm font-medium">Weekly Trend (last 8 weeks)</h2>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={weeklyData}>
              <defs>
                <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ac7f5e" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#ac7f5e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: "#696b63", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#adadad", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} width={28} />
              <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e8e8e4", borderRadius: 14, fontSize: 12, boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }} cursor={{ stroke: "#e8e8e4" }} formatter={(v) => [v, "Feedback"]} />
              <Area type="monotone" dataKey="count" stroke="#ac7f5e" strokeWidth={2} fill="url(#trendGrad)" dot={{ fill: "#ac7f5e", strokeWidth: 0, r: 3.5 }} activeDot={{ fill: "#ac7f5e", r: 5, strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Feedback Table */}
      <div className="bg-white border border-[#e8e8e4] rounded-[24px] overflow-hidden">
        <div className="px-6 py-5 border-b border-[#f0ede8] flex items-center gap-2.5">
          <div className="bg-[#fef7f2] rounded-[10px] p-2"><MessageSquare className="w-4 h-4 text-[#ac7f5e]" /></div>
          <h2 className="text-[#212120] text-sm font-medium">Recent Feedback</h2>
          <span className="ml-auto text-[#adadad] text-xs">showing {recentFeedback.length} of {totalCount}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#f5f3f0]">
                {["Shop", "Description", "Categories", "Rating", "Photos", "Source", "Date", "Visibility"].map((h) => (
                  <th key={h} className="text-left px-6 py-3 text-[#adadad] text-[11px] font-medium uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentFeedback.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-16 text-[#adadad] text-sm">No feedback found</td></tr>
              ) : (
                recentFeedback.map((fb, i) => {
                const isSavingVisibility = updatingVisibility.has(fb.id);
                return (
                  <tr key={fb.id} className={`hover:bg-[#faf8f6] transition-colors ${i < recentFeedback.length - 1 ? "border-b border-[#f8f6f3]" : ""}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-[#212120] text-sm font-medium">{fb.shop?.name ?? fb.shop_name}</span>
                    </td>
                    <td className="px-6 py-4 max-w-[280px]">
                      <span className="text-[#696b63] text-sm line-clamp-2 block leading-relaxed">{fb.description}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {fb.categories.map((cat) => (
                          <span key={cat} className="inline-block px-2.5 py-1 rounded-full text-[11px] font-medium text-[#3a1834]" style={{ backgroundColor: CATEGORY_CHIP_BG[cat] ?? "#f5f4f3" }}>
                            {CATEGORY_LABELS[cat] ?? cat}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {fb.rating != null ? (
                        <StarRating value={fb.rating} className="text-[11px]" />
                      ) : (
                        <span className="text-[#c9b9a6] text-sm">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <FeedbackPhotosCell imageUrls={fb.image_urls} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className="inline-block px-2.5 py-1 rounded-full text-[11px] font-medium"
                        style={fb.source === "telegram"
                          ? { backgroundColor: "#e8f4fd", color: "#0088cc" }
                          : { backgroundColor: "#f5f4f3", color: "#8a8078" }}
                      >
                        {fb.source === "telegram" ? "Telegram" : "Web"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button onClick={() => togglePreciseDate(fb.id)} className="text-[#adadad] text-sm hover:text-[#696b63] transition-colors cursor-pointer underline decoration-dotted underline-offset-2">
                        {(() => {
                          try {
                            const d = parseISO(fb.created_at);
                            return preciseDates.has(fb.id)
                              ? format(d, "yyyy-MM-dd HH:mm:ss")
                              : formatDistanceToNow(d, { addSuffix: true });
                          } catch { return "—"; }
                        })()}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleVisibilityToggle(fb.id, !fb.is_public)}
                        disabled={isSavingVisibility}
                        className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-full transition-colors disabled:opacity-50 disabled:cursor-wait ${
                          fb.is_public
                            ? "bg-[#f0faf4] text-[#3d8a5c] hover:bg-[#e0f5e8]"
                            : "bg-[#fff0f0] text-[#c0392b] hover:bg-[#ffe0e0]"
                        }`}
                        title={fb.is_public ? "Visible in the public feed — click to ban" : "Banned from the public feed — click to restore"}
                      >
                        {fb.is_public ? <><Eye className="w-3 h-3" /> Public</> : <><EyeOff className="w-3 h-3" /> Banned</>}
                      </button>
                    </td>
                  </tr>
                );
              })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Shops tab ─────────────────────────────────────────────────────────────────

function ShopsTab({
  loading, error, onRetry, shops, onVisibilityChange,
}: {
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  shops: AdminShop[];
  onVisibilityChange: (id: number, isPublic: boolean) => void;
}) {
  const [updating, setUpdating] = useState<Set<number>>(new Set());

  async function handleToggle(id: number, nextIsPublic: boolean) {
    setUpdating((prev) => new Set(prev).add(id));
    try {
      await apiFetch(`/shops/${id}/visibility`, {
        method: "PATCH",
        body: JSON.stringify({ isPublic: nextIsPublic }),
      });
      onVisibilityChange(id, nextIsPublic);
    } catch {
      // leave as-is — parent state didn't change, so the UI reflects the unchanged value
    } finally {
      setUpdating((prev) => { const next = new Set(prev); next.delete(id); return next; });
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <p className="text-[#696b63] text-lg animate-pulse">Loading…</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex items-center justify-center py-32 px-6">
        <div className="bg-[#efefef] rounded-[26px] p-8 text-center max-w-md">
          <p className="text-[#212120] text-lg mb-2 font-medium">Could not load shops</p>
          <p className="text-[#696b63] text-sm mb-6">{error}</p>
          <button onClick={onRetry} className="bg-[#ac7f5e] text-white rounded-[20px] px-6 py-3 font-bold hover:opacity-90 transition-opacity">Retry</button>
        </div>
      </div>
    );
  }

  const publicCount = shops.filter((s) => s.is_public).length;
  const hiddenCount = shops.length - publicCount;

  return (
    <div className="px-6 md:px-10 py-8 space-y-6 max-w-screen-xl mx-auto">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard icon={<Store className="w-5 h-5 text-[#696b63]" />} iconBg="bg-[#f2f4f2]" label="Total Shops" value={shops.length} />
        <KpiCard icon={<Eye className="w-5 h-5 text-[#3d8a5c]" />} iconBg="bg-[#f0faf4]" label="Public" value={publicCount} sub="Visible to visitors" />
        <KpiCard icon={<EyeOff className="w-5 h-5 text-[#c0392b]" />} iconBg="bg-[#fff0f0]" label="Hidden" value={hiddenCount} sub="Hidden from listings" />
      </div>

      {/* Shops table */}
      <div className="bg-white border border-[#e8e8e4] rounded-[24px] overflow-hidden">
        <div className="px-6 py-5 border-b border-[#f0ede8] flex items-center gap-2.5">
          <div className="bg-[#fef7f2] rounded-[10px] p-2"><Store className="w-4 h-4 text-[#ac7f5e]" /></div>
          <h2 className="text-[#212120] text-sm font-medium">All Shops</h2>
          <span className="ml-auto text-[#adadad] text-xs">{shops.length} shop{shops.length === 1 ? "" : "s"}</span>
        </div>

        {shops.length === 0 ? (
          <div className="py-20 text-center text-[#adadad] text-sm">No shops yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#f5f3f0]">
                  {["Shop", "Plan", "Feedback", "Created", "Visibility"].map((h) => (
                    <th key={h} className="text-left px-6 py-3 text-[#adadad] text-[11px] font-medium uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shops.map((shop, i) => {
                  const isSaving = updating.has(shop.id);
                  return (
                    <tr key={shop.id} className={`hover:bg-[#faf8f6] transition-colors ${i < shops.length - 1 ? "border-b border-[#f8f6f3]" : ""}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-[#212120] text-sm font-medium">{shop.name}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-[#696b63] text-sm capitalize">{shop.plan}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-[#696b63] text-sm">{shop.feedbackCount}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-[#adadad] text-sm">
                          {(() => {
                            try { return formatDistanceToNow(parseISO(shop.created_at), { addSuffix: true }); }
                            catch { return "—"; }
                          })()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggle(shop.id, !shop.is_public)}
                          disabled={isSaving}
                          className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-full transition-colors disabled:opacity-50 disabled:cursor-wait ${
                            shop.is_public
                              ? "bg-[#f0faf4] text-[#3d8a5c] hover:bg-[#e0f5e8]"
                              : "bg-[#fff0f0] text-[#c0392b] hover:bg-[#ffe0e0]"
                          }`}
                          title={shop.is_public ? "Visible to visitors — click to hide" : "Hidden from visitors — click to make public"}
                        >
                          {shop.is_public ? <><Eye className="w-3 h-3" /> Public</> : <><EyeOff className="w-3 h-3" /> Hidden</>}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Contacts tab ──────────────────────────────────────────────────────────────

function ContactsTab({
  loading, error, contacts, onRetry, onStatusChange,
}: {
  loading: boolean;
  error: string | null;
  contacts: ContactSubmission[];
  onRetry: () => void;
  onStatusChange: (id: string, status: ContactStatus) => void;
}) {
  const [updating, setUpdating] = useState<Set<string>>(new Set());

  async function handleStatusChange(id: string, status: ContactStatus) {
    setUpdating((prev) => new Set(prev).add(id));
    try {
      await apiFetch(`/contact/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      onStatusChange(id, status);
    } catch {
      // leave the old value — the select will revert because contacts state didn't change
    } finally {
      setUpdating((prev) => { const next = new Set(prev); next.delete(id); return next; });
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <p className="text-[#696b63] text-lg animate-pulse">Loading…</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex items-center justify-center py-32 px-6">
        <div className="bg-[#efefef] rounded-[26px] p-8 text-center max-w-md">
          <p className="text-[#212120] text-lg mb-2 font-medium">Could not load contacts</p>
          <p className="text-[#696b63] text-sm mb-6">{error}</p>
          <button onClick={onRetry} className="bg-[#ac7f5e] text-white rounded-[20px] px-6 py-3 font-bold hover:opacity-90 transition-opacity">Retry</button>
        </div>
      </div>
    );
  }

  const pendingCount = contacts.filter((c) => c.status === "pending").length;

  return (
    <div className="px-6 md:px-10 py-8 max-w-screen-xl mx-auto space-y-6">
      {/* Summary strip */}
      <div className="bg-white border border-[#e8e8e4] rounded-[24px] px-6 py-5 flex flex-wrap items-center gap-4">
        <div className="bg-[#fef7f2] rounded-[14px] p-3">
          <Inbox className="w-5 h-5 text-[#ac7f5e]" />
        </div>
        <div>
          <p className="text-[#212120] text-2xl font-light">{contacts.length}</p>
          <p className="text-[#696b63] text-xs">total submissions{pendingCount > 0 ? ` · ${pendingCount} pending` : ""}</p>
        </div>
        <div className="ml-auto flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((s) => {
            const count = contacts.filter((c) => c.status === s).length;
            if (count === 0) return null;
            const meta = STATUS_META[s];
            return (
              <span key={s} className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ backgroundColor: meta.bg, color: meta.text }}>
                {meta.label} · {count}
              </span>
            );
          })}
        </div>
      </div>

      {/* Submissions table */}
      <div className="bg-white border border-[#e8e8e4] rounded-[24px] overflow-hidden">
        <div className="px-6 py-5 border-b border-[#f0ede8] flex items-center gap-2.5">
          <div className="bg-[#fef7f2] rounded-[10px] p-2"><Inbox className="w-4 h-4 text-[#ac7f5e]" /></div>
          <h2 className="text-[#212120] text-sm font-medium">All Submissions</h2>
          <span className="ml-auto text-[#adadad] text-xs">{contacts.length} entr{contacts.length === 1 ? "y" : "ies"}</span>
        </div>

        {contacts.length === 0 ? (
          <div className="py-20 text-center text-[#adadad] text-sm">No contact submissions yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#f5f3f0]">
                  {["Category", "Name", "Contact", "Shop", "Message", "Date", "Status"].map((h) => (
                    <th key={h} className="text-left px-6 py-3 text-[#adadad] text-[11px] font-medium uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {contacts.map((c, i) => {
                  const catStyle = CONTACT_CATEGORY_COLORS[c.category] ?? { bg: "#f5f4f3", text: "#8a8078" };
                  const statusMeta = STATUS_META[c.status] ?? STATUS_META["pending"];
                  const isSaving = updating.has(c.id);
                  return (
                    <tr key={c.id} className={`hover:bg-[#faf8f6] transition-colors ${i < contacts.length - 1 ? "border-b border-[#f8f6f3]" : ""}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ backgroundColor: catStyle.bg, color: catStyle.text }}>
                          {CONTACT_CATEGORY_LABELS[c.category] ?? c.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-[#212120] text-sm font-medium">{c.name}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-[#696b63] text-sm">{c.contactInfo}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-[#696b63] text-sm">{c.shopName ?? <span className="text-[#adadad]">—</span>}</span>
                      </td>
                      <td className="px-6 py-4 max-w-[280px]">
                        <span className="text-[#696b63] text-sm line-clamp-2 block leading-relaxed">{c.description}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-[#adadad] text-sm">
                          {(() => {
                            try { return formatDistanceToNow(new Date(c.createdAt), { addSuffix: true }); }
                            catch { return "—"; }
                          })()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="relative inline-flex items-center">
                          <span
                            className="absolute left-2.5 w-2 h-2 rounded-full pointer-events-none"
                            style={{ backgroundColor: statusMeta.text }}
                          />
                          <select
                            value={c.status}
                            disabled={isSaving}
                            onChange={(e) => handleStatusChange(c.id, e.target.value as ContactStatus)}
                            className="appearance-none text-xs font-medium pl-6 pr-6 py-1.5 rounded-full border-none outline-none cursor-pointer disabled:opacity-50 disabled:cursor-wait"
                            style={{ backgroundColor: statusMeta.bg, color: statusMeta.text }}
                          >
                            {STATUS_OPTIONS.map((s) => (
                              <option key={s} value={s}>{STATUS_META[s].label}</option>
                            ))}
                          </select>
                          <span className="absolute right-2 text-[9px] pointer-events-none" style={{ color: statusMeta.text }}>▾</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Visitors tab ─────────────────────────────────────────────────────────────

const VISITOR_PERIODS = [
  { value: '12h',  label: '12h' },
  { value: '1d',   label: '1d'  },
  { value: '2d',   label: '2d'  },
  { value: '5d',   label: '5d'  },
  { value: '7d',   label: '7d'  },
  { value: '30d',  label: '30d' },
  { value: 'all',  label: 'All' },
];

const CHART_TITLE: Record<string, string> = {
  '12h': 'Visitors — last 12 hours (hourly)',
  '1d':  'Visitors — last 24 hours (hourly)',
  '2d':  'Visitors — last 2 days (hourly)',
  '5d':  'Visitors — last 5 days (daily)',
  '7d':  'Visitors — last 7 days (daily)',
  '30d': 'Visitors — last 30 days (daily)',
  'all': 'Visitors — all time (daily)',
};

function formatBucket(bucket: string, granularity: 'hour' | 'day', period: string): string {
  try {
    const date = new Date(bucket);
    if (granularity === 'hour') {
      return (period === '12h' || period === '1d') ? format(date, 'HH:mm') : format(date, 'd/M HH:mm');
    }
    return format(date, 'MMM d');
  } catch {
    return String(bucket);
  }
}

function VisitorsTab({ loading, error, stats, onRetry, period, onPeriodChange }: {
  loading: boolean;
  error: string | null;
  stats: AppVisitorStats | null;
  onRetry: () => void;
  period: string;
  onPeriodChange: (p: string) => void;
}) {
  const chartData = (stats?.chartData ?? []).map((d) => ({
    label: formatBucket(String(d.bucket), stats?.granularity ?? 'day', period),
    count: d.count,
  }));

  const barSize = chartData.length > 24 ? 5 : chartData.length > 12 ? 8 : 16;
  const xAxisInterval = Math.max(0, Math.floor(chartData.length / 8));

  return (
    <div className="px-6 md:px-10 py-8 space-y-8">
      {/* KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard
          icon={<Activity className="w-4 h-4 text-[#ac7f5e]" />}
          iconBg="bg-[#fef3ec]"
          label="Total Telegram Visitors"
          value={stats?.total ?? '—'}
        />
      </div>

      {/* Chart with period filter */}
      <div className="bg-white border border-[#e8e8e4] rounded-[24px] p-6">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
          <p className="text-[#212120] text-sm font-medium">
            {CHART_TITLE[period] ?? 'Visitors'}
          </p>
          <div className="flex items-center gap-1 flex-wrap">
            {VISITOR_PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => onPeriodChange(p.value)}
                disabled={loading}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors disabled:opacity-50 ${
                  period === p.value
                    ? 'bg-[#ac7f5e] text-white'
                    : 'bg-[#efefef] text-[#696b63] hover:bg-[#e4e4e0]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-[220px] text-[#adadad] text-sm">Loading…</div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-[220px] gap-2">
            <p className="text-[#696b63] text-sm">{error}</p>
            <button onClick={onRetry} className="text-sm text-[#ac7f5e] hover:underline">Retry</button>
          </div>
        ) : chartData.length === 0 ? (
          <p className="text-[#adadad] text-sm text-center py-16">No data for this period</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} barSize={barSize}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" vertical={false} />
              <XAxis dataKey="label" interval={xAxisInterval} tick={{ fontSize: 11, fill: "#adadad" }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#adadad" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ border: "1px solid #e8e8e4", borderRadius: 12, fontSize: 12 }}
                cursor={{ fill: "#f5f4f3" }}
              />
              <Bar dataKey="count" fill="#ac7f5e" radius={[4, 4, 0, 0]} name="Visitors" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Recent visitors list */}
      <div className="bg-white border border-[#e8e8e4] rounded-[24px] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e8e8e4]">
          <p className="text-[#212120] text-sm font-medium">Recent visitors</p>
        </div>
        {(stats?.recentVisitors ?? []).length === 0 ? (
          <p className="text-[#adadad] text-sm text-center py-10">No visitors yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e8e8e4] text-left">
                  <th className="px-6 py-3 text-[#adadad] font-medium text-xs">#</th>
                  <th className="px-6 py-3 text-[#adadad] font-medium text-xs">Type</th>
                  <th className="px-6 py-3 text-[#adadad] font-medium text-xs">Date & Time</th>
                </tr>
              </thead>
              <tbody>
                {(stats?.recentVisitors ?? []).map((v, i) => (
                  <tr key={v.id} className="border-b border-[#f5f4f3] last:border-0 hover:bg-[#fafaf8]">
                    <td className="px-6 py-3 text-[#adadad]">{i + 1}</td>
                    <td className="px-6 py-3">
                      <span className="inline-flex items-center gap-1.5 bg-[#f0f4ff] text-[#4f6fbd] text-xs font-medium px-2.5 py-1 rounded-full">
                        <Activity className="w-3 h-3" />
                        {v.type}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-[#696b63] tabular-nums">
                      {(() => { try { return format(parseISO(v.createdAt), 'dd MMM yyyy, HH:mm:ss'); } catch { return v.createdAt; } })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({ icon, iconBg, label, value, sub, valueSm = false }: {
  icon: React.ReactNode; iconBg: string; label: string;
  value: React.ReactNode; sub?: string; valueSm?: boolean;
}) {
  return (
    <div className="bg-white border border-[#e8e8e4] rounded-[24px] p-5 md:p-6">
      <div className={`inline-flex rounded-[13px] p-2.5 mb-4 ${iconBg}`}>{icon}</div>
      <p className="text-[#696b63] text-xs mb-1.5">{label}</p>
      <p className={`text-[#212120] font-light leading-tight ${valueSm ? "text-base md:text-lg" : "text-3xl md:text-4xl"}`}>{value}</p>
      {sub && <p className="text-[#adadad] text-[11px] mt-1 truncate">{sub}</p>}
    </div>
  );
}
