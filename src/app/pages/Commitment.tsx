import { useState } from "react";
import { Fingerprint, Layers, Zap, Info, Star } from "lucide-react";
import SiteNav from "../components/SiteNav";
import SiteFooter from "../components/SiteFooter";
import ContactModal from "../components/ContactModal";
import CTAButtons from "../components/CTAButtons";
import { Tooltip, TooltipTrigger, TooltipContent } from "../components/ui/tooltip";

const PILLARS = [
  {
    icon: Fingerprint,
    lead: "Anonymous, always",
    body: "No names, no accounts, nothing to trace back. Feedback tied to an identity gets softened. Feedback tied to nothing gets honest.",
    flagship: true,
  },
  {
    icon: Layers,
    lead: "One source of truth",
    body: "Every rating and note about your business, wherever it was left, pulled into a single place instead of scattered across a dozen apps and tabs. Not just for your own records — the goal is a place people can trust: if InputMatter says you're good, you are.",
  },
  {
    icon: Zap,
    lead: "Remove the friction",
    body: "The fewer steps between someone having a thought and you hearing it, the more people will actually tell you. We measure our own progress by how much friction we've removed.",
  },
];

type Status = "live" | "next";

interface Feature {
  label: string;
  status: Status;
  tooltip?: string;
  flagship?: boolean;
}

const CUSTOMER_FEATURES: Feature[] = [
  { label: "Anonymous, always", status: "live", flagship: true },
  { label: "Feedback from the web", status: "live" },
  {
    label: "Feedback via Telegram Mini App",
    status: "live",
    tooltip: "Leave feedback directly inside Telegram.",
  },
  { label: "Voice as input", status: "next" },
];

const BUSINESS_FEATURES: Feature[] = [
  {
    label: "Full dashboard",
    status: "live",
    tooltip: "Ongoing improvement — new views and metrics added regularly.",
  },
  {
    label: "QR code generator",
    status: "live",
    tooltip: "Generated from your shop dashboard — auto-fills your shop when scanned.",
  },
  {
    label: "One inbox for every source — Google Maps, Trustpilot, and more",
    status: "next",
    tooltip: "Import your feedback from other providers like Google Maps, Trustpilot, and more.",
  },
  {
    label: "Branded Tracking Page",
    status: "next",
    tooltip: "Customize the feedback form and dashboard to match your branding.",
  },
];

function StatusPill({ status }: { status: Status }) {
  if (status === "live") {
    return (
      <span className="shrink-0 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide rounded-full px-2 py-0.5 bg-[#d9764a]/15 text-[#d9764a]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#d9764a] animate-pulse" />
        Live
      </span>
    );
  }
  return (
    <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide rounded-full px-2 py-0.5 bg-white/10 text-[#c9beb2]">
      Next
    </span>
  );
}

function FeatureColumn({ title, features }: { title: string; features: Feature[] }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-left">
      <div className="font-['Plus_Jakarta_Sans'] font-bold text-[#fdf8f2] text-[15px] mb-1">
        {title}
      </div>
      <div className="divide-y divide-white/10">
        {features.map((f) => (
          <div key={f.label} className="flex items-center justify-between gap-3 py-3">
            <span className="flex items-center gap-1.5 text-[13.5px] text-[#e5ddd2] leading-snug">
              {f.label}
              {f.flagship && (
                <Star className="w-3 h-3 text-[#e8a882] fill-[#e8a882] shrink-0" />
              )}
              {f.tooltip && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-3.5 h-3.5 text-[#9a8c7c] shrink-0 cursor-default" />
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="max-w-[200px] text-center text-[11px] leading-snug bg-[#fdf8f2] text-[#2c2622]"
                    arrowClassName="bg-[#fdf8f2] fill-[#fdf8f2]"
                  >
                    {f.tooltip}
                  </TooltipContent>
                </Tooltip>
              )}
            </span>
            <StatusPill status={f.status} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Commitment() {
  const [contactCategory, setContactCategory] = useState<string | null>(null);

  return (
    <div
      className="scroll-smooth min-h-screen bg-[#fdf8f2] flex flex-col"
      style={{ fontFamily: "'Hanken Grotesk', system-ui, sans-serif" }}
    >

      <SiteNav howItWorksHref="/welcome#how-it-works" />

      <div className="bg-[#2c2622] flex-1 flex flex-col">

        {/* Hero + belief */}
        <div className="max-w-[680px] mx-auto w-full px-4 sm:px-5 md:px-10 pt-16 sm:pt-20 pb-12 sm:pb-14 text-center">
          <span className="text-xs font-semibold tracking-wide uppercase text-[#e8a882]">
            Our commitment
          </span>
          <h1 className="font-['Plus_Jakarta_Sans'] text-[26px] sm:text-[34px] font-extrabold text-[#fdf8f2] tracking-tight leading-[1.2] mt-4">
            We're not building a feedback form. We're building the place people trust.
          </h1>
          <p className="text-[14.5px] sm:text-[15px] text-[#c9beb2] leading-relaxed mt-5 max-w-md mx-auto">
            Getting honest input from the people you serve is one of the hardest things in
            business — not because people don't have opinions, but because most ways of asking
            get in the way. We think every one of those barriers can be removed, and we're
            building InputMatter to do it.
          </p>
        </div>

        <div className="border-t border-white/10" />

        {/* Where this is going */}
        <div className="max-w-[680px] mx-auto w-full px-4 sm:px-5 md:px-10 py-12 sm:py-14">
          <span className="text-xs font-semibold tracking-wide uppercase text-[#e8a882]">
            Where this is going
          </span>
          <div className="mt-8 space-y-8 text-left">
            {PILLARS.map((point) => (
              <div key={point.lead} className="flex gap-4">
                <div className="w-9 h-9 rounded-full bg-white/10 text-[#e8a882] flex items-center justify-center shrink-0">
                  <point.icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 font-['Plus_Jakarta_Sans'] font-bold text-[#fdf8f2] text-[16px]">
                    {point.lead}
                    {point.flagship && (
                      <Star className="w-3.5 h-3.5 text-[#e8a882] fill-[#e8a882]" />
                    )}
                  </div>
                  <div className="text-[14px] text-[#c9beb2] leading-relaxed mt-1.5">
                    {point.body}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-white/10" />

        {/* Why this matters now */}
        <div className="max-w-[600px] mx-auto w-full px-4 sm:px-5 md:px-10 py-12 sm:py-14 text-center">
          <span className="text-xs font-semibold tracking-wide uppercase text-[#e8a882]">
            Why this matters now
          </span>
          <p className="font-['Plus_Jakarta_Sans'] text-[18px] sm:text-[21px] font-semibold text-[#fdf8f2] leading-[1.45] mt-6">
            Two cafés can pour the same coffee. Two shops can stock the same products. Two SaaS
            tools can ship the same features. Once anyone can match the product, the product
            stops being the edge — what's left is how it felt to be the customer.
          </p>
          <p className="text-[14.5px] text-[#c9beb2] leading-relaxed mt-5 max-w-md mx-auto">
            How fast someone answered. How a complaint got handled. Whether anyone was listening
            at all. That's the next thing businesses will compete on — and almost none of them
            are measuring it yet.
          </p>
        </div>

        <div className="border-t border-white/10" />

        {/* Built for both sides */}
        <div className="max-w-[880px] mx-auto w-full px-4 sm:px-5 md:px-10 py-12 sm:py-14 text-center">
          <span className="text-xs font-semibold tracking-wide uppercase text-[#e8a882]">
            Built for both sides
          </span>
          <p className="text-[14.5px] sm:text-[15px] text-[#c9beb2] leading-relaxed mt-5 max-w-lg mx-auto">
            A feedback form nobody sees doesn't help the business behind it. A dashboard with
            nothing in it doesn't help anyone. Neither side works alone, so we build for both.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-9">
            <FeatureColumn title="For the people giving feedback" features={CUSTOMER_FEATURES} />
            <FeatureColumn title="For the business behind it" features={BUSINESS_FEATURES} />
          </div>
        </div>

        <div className="border-t border-white/10" />

        {/* Closing */}
        <div className="max-w-[680px] mx-auto w-full px-4 sm:px-5 md:px-10 pt-12 sm:pt-14 pb-16 sm:pb-20 text-center flex-1">
          <p className="text-[14.5px] text-[#c9beb2] leading-relaxed max-w-md mx-auto">
            InputMatter is still early — and we'd rather build what's next with the businesses
            using it than guess alone.{" "}
            <button
              type="button"
              onClick={() => setContactCategory("feature-request")}
              className="text-[#e8a882] font-semibold hover:text-[#fdf8f2] transition-colors"
            >
              Tell us what you need →
            </button>
          </p>

          <div className="mt-10">
            <CTAButtons dark onBookDemo={() => setContactCategory("book-demo")} />
          </div>
        </div>
      </div>

      <SiteFooter />

      {contactCategory && (
        <ContactModal initialCategory={contactCategory} onClose={() => setContactCategory(null)} />
      )}
    </div>
  );
}
