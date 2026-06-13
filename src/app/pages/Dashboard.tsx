import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router";
import { apiFetch } from "../lib/api";
import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area,
} from "recharts";
import {
  MessageSquare, Store, Tag, Clock, RefreshCw,
  TrendingUp, ArrowLeft, Inbox,
} from "lucide-react";
import {
  format, subWeeks, startOfWeek, endOfWeek,
  isWithinInterval, parseISO, formatDistanceToNow,
} from "date-fns";

// ── Shared types ──────────────────────────────────────────────────────────────

interface Shop {
  id: number;
  name: string;
}

interface Feedback {
  id: string;
  description: string;
  categories: string[];
  shop_name: string;
  shop: Shop | null;
  created_at: string;
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

type Tab = "feedback" | "contacts";

// ── Main component ────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("feedback");

  // Feedback state
  const [allFeedback, setAllFeedback] = useState<Feedback[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShopId, setSelectedShopId] = useState<string>("all");
  const [feedbackLoading, setFeedbackLoading] = useState(true);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [preciseDates, setPreciseDates] = useState<Set<string>>(new Set());

  // Contacts state — fetched lazily when the tab is first opened
  const [contacts, setContacts] = useState<ContactSubmission[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactsError, setContactsError] = useState<string | null>(null);
  const [contactsFetched, setContactsFetched] = useState(false);

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
        apiFetch<Shop[]>("/shops"),
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

  function handleTabChange(tab: Tab) {
    setActiveTab(tab);
    if (tab === "contacts" && !contactsFetched) fetchContacts();
  }

  // ── Feedback derived data ───────────────────────────────────────────────────

  const filtered = useMemo(() => {
    if (selectedShopId === "all") return allFeedback;
    return allFeedback.filter((f) => String(f.shop?.id) === selectedShopId);
  }, [allFeedback, selectedShopId]);

  const totalCount = filtered.length;

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
              <button
                onClick={fetchFeedback}
                className="bg-[#efefef] rounded-[18px] p-2.5 text-[#696b63] hover:text-[#212120] hover:bg-[#e4e4e0] transition-colors"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
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
        </div>

        {/* Tab bar */}
        <div className="px-6 md:px-10 flex gap-0">
          {(["feedback", "contacts"] as Tab[]).map((tab) => (
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
              ) : (
                <><Inbox className="w-3.5 h-3.5" /> Contacts {contacts.length > 0 && <span className="bg-[#ac7f5e] text-white text-[10px] font-semibold rounded-full px-1.5 py-0.5 leading-none">{contacts.length}</span>}</>
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
          activeShopsCount={activeShopsCount}
          topCategory={topCategory}
          latestFeedback={latestFeedback}
          categoryData={categoryData}
          weeklyData={weeklyData}
          recentFeedback={recentFeedback}
          preciseDates={preciseDates}
          togglePreciseDate={togglePreciseDate}
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
    </div>
  );
}

// ── Feedback tab ──────────────────────────────────────────────────────────────

function FeedbackTab({
  loading, error, onRetry, totalCount, activeShopsCount, topCategory,
  latestFeedback, categoryData, weeklyData, recentFeedback, preciseDates, togglePreciseDate,
}: {
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  totalCount: number;
  activeShopsCount: number;
  topCategory: { name: string; count: number } | null;
  latestFeedback: Feedback | null;
  categoryData: { name: string; count: number; fill: string }[];
  weeklyData: { label: string; count: number }[];
  recentFeedback: Feedback[];
  preciseDates: Set<string>;
  togglePreciseDate: (id: string) => void;
}) {
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
        <KpiCard icon={<MessageSquare className="w-5 h-5 text-[#ac7f5e]" />} iconBg="bg-[#fef7f2]" label="Total Feedback" value={totalCount} />
        <KpiCard icon={<Store className="w-5 h-5 text-[#696b63]" />} iconBg="bg-[#f2f4f2]" label="Active Shops" value={activeShopsCount} />
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
                {["Shop", "Description", "Categories", "Date"].map((h) => (
                  <th key={h} className="text-left px-6 py-3 text-[#adadad] text-[11px] font-medium uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentFeedback.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-16 text-[#adadad] text-sm">No feedback found</td></tr>
              ) : (
                recentFeedback.map((fb, i) => (
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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
