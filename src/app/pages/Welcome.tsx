import { useEffect, useState } from "react";
import { Link } from "react-router";
import { apiFetch } from "../lib/api";
import Logo from "../components/Logo";
import SiteNav from "../components/SiteNav";
import SiteFooter from "../components/SiteFooter";
import ShopCard, { type Shop } from "../components/ShopCard";

const STEPS = [
  {
    title: "Scan or pick a shop",
    body: "Use the QR at the counter, or search any place you visited.",
  },
  {
    title: "Share your thoughts",
    body: "Rate it and add a note — anonymous, no sign-up.",
  },
  {
    title: "They get better",
    body: "Owners see honest trends and improve what matters.",
  },
] as const;

export default function Welcome() {
  const [popularShops, setPopularShops] = useState<Shop[]>([]);
  const [feedbackCount, setFeedbackCount] = useState<number | null>(null);
  const [shopCount, setShopCount] = useState<number | null>(null);

  useEffect(() => {
    apiFetch<Shop[]>("/shops/popular")
      .then(setPopularShops)
      .catch(() => {});
  }, []);

  useEffect(() => {
    apiFetch<{ count: number }>("/feedback/count")
      .then((data) => setFeedbackCount(data.count))
      .catch(() => {});
    apiFetch<Shop[]>("/shops")
      .then((shops) => setShopCount(shops.length))
      .catch(() => {});
  }, []);

  return (
    <div
      className="scroll-smooth min-h-screen bg-[#fdf8f2] flex flex-col"
      style={{ fontFamily: "'Hanken Grotesk', system-ui, sans-serif" }}
    >

      <SiteNav />

      {/* Hero */}
      <div className="max-w-[1120px] mx-auto flex flex-col lg:flex-row gap-8 lg:gap-9 px-4 sm:px-5 md:px-10 py-8 sm:py-9 md:py-11 items-center">
        <div className="flex-1 w-full">
          <span className="inline-flex items-center gap-1.5 text-xs text-[#b1603a] bg-[#f6e7dc] rounded-full px-3.5 py-1.5 font-semibold mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#d9764a] animate-pulse" />
            100% anonymous, always
          </span>
          <h1 className="font-['Plus_Jakarta_Sans'] text-[28px] min-[400px]:text-[32px] md:text-[46px] font-extrabold text-[#2c2622] tracking-tight leading-[1.08] md:leading-[1.05]">
            Tell them what you <span className="text-[#d9764a]">really</span> think.
          </h1>
          <p className="text-[15px] sm:text-[16px] md:text-[16.5px] text-[#6f6256] leading-relaxed mt-4 max-w-md">
            Honest, anonymous feedback for the cafés and shops you love. No account. No names. Just the truth they need to get better.
          </p>
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 mt-7">
            <Link
              to="/"
              className="text-center bg-[#d9764a] text-white rounded-xl px-6 py-4 text-[15.5px] font-bold shadow-[0_12px_24px_-10px_rgba(217,118,74,0.65)] hover:bg-[#d9764a]/90 transition-colors"
            >
              Leave feedback →
            </Link>
            <a
              href="#how-it-works"
              className="text-center bg-white text-[#2c2622] border border-[#e7dccd] rounded-xl px-6 py-4 text-[15.5px] font-semibold hover:bg-[#faf3ea] transition-colors"
            >
              See how it works
            </a>
          </div>
          <div className="flex gap-4 min-[400px]:gap-6 mt-8">
            {[
              { value: feedbackCount !== null ? feedbackCount.toLocaleString() : "…", label: "notes shared" },
              { value: shopCount !== null ? shopCount.toLocaleString() : "…", label: "local shops" },
              { value: "30 sec", label: "to share" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="font-['Plus_Jakarta_Sans'] text-[19px] min-[400px]:text-[22px] font-extrabold text-[#2c2622]">
                  {stat.value}
                </div>
                <div className="text-[11px] min-[400px]:text-xs text-[#9a8c7c]">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="hidden lg:flex w-[340px] h-[350px] rounded-[18px] bg-[#f8efe2] border border-[#f0e4d4] items-center justify-center shrink-0">
          <Logo size={160} />
        </div>
      </div>

      {/* How it works */}
      <div id="how-it-works" className="max-w-[1120px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 px-4 sm:px-5 md:px-10 pb-9 scroll-mt-6">
        {STEPS.map((step, i) => (
          <div key={step.title} className="bg-white border border-[#f1e7d9] rounded-2xl p-5">
            <div className="w-8 h-8 rounded-full bg-[#f6e7dc] text-[#d9764a] font-bold font-['Plus_Jakarta_Sans'] flex items-center justify-center mb-3.5">
              {i + 1}
            </div>
            <div className="font-['Plus_Jakarta_Sans'] font-bold text-[#2c2622] text-[15.5px]">
              {step.title}
            </div>
            <div className="text-[13.5px] text-[#7d7064] leading-relaxed mt-1.5">
              {step.body}
            </div>
          </div>
        ))}
      </div>

      {/* Popular near you */}
      {popularShops.length > 0 && (
        <div className="border-t border-[#f1e8db]">
          <div className="max-w-[1120px] mx-auto px-4 sm:px-5 md:px-10 pb-10 pt-2">
            <div className="flex items-baseline justify-between my-7">
              <div className="font-['Plus_Jakarta_Sans'] text-xl sm:text-2xl font-extrabold text-[#2c2622] tracking-tight">
                Popular near you
              </div>
              <Link to="/places" className="text-sm font-semibold text-[#b1603a] shrink-0 hover:text-[#2c2622] transition-colors">
                See all places
              </Link>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-1 -mx-1 px-1 md:grid md:grid-cols-2 lg:grid-cols-4 md:overflow-visible md:mx-0 md:px-0">
              {popularShops.map((shop) => (
                <ShopCard key={shop.id} shop={shop} className="flex-none w-40 md:w-auto" />
              ))}
            </div>
          </div>
        </div>
      )}

      <SiteFooter />
    </div>
  );
}
