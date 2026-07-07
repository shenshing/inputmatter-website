import { useState } from "react";
import { Link } from "react-router";
import { Coffee, Store, Scissors, Dumbbell, Briefcase, Code2, ShoppingBag, Sparkles } from "lucide-react";
import SiteNav from "../components/SiteNav";
import SiteFooter from "../components/SiteFooter";
import ContactModal from "../components/ContactModal";
import CTAButtons from "../components/CTAButtons";
import FeatureCarousel from "../components/FeatureCarousel";
import freeToStartSlide from "../../assets/free-to-start-slider.png";
import dashboardSlide from "../../assets/dashboard-slide.png";
import qrGeneratorSlide from "../../assets/qr-generator-slider.png";
import telegramMiniAppSlide from "../../assets/telegram-mini-app-slider.png";
import webFeedbackSlide from "../../assets/web-feedback-slider.png";

const WHO_ITS_FOR = [
  { icon: Coffee, label: "Cafés & restaurants" },
  { icon: ShoppingBag, label: "Online stores" },
  { icon: Code2, label: "SaaS & software" },
  { icon: Store, label: "Retail & boutiques" },
  { icon: Scissors, label: "Salons & spas" },
  { icon: Dumbbell, label: "Gyms & studios" },
  { icon: Briefcase, label: "Agencies & consultants" },
  { icon: Sparkles, label: "Any business with customers" },
] as const;

const REAL_TODAY = [
  {
    title: "Free to start",
    body: "Register your business and start collecting feedback today. No sales call, no credit card.",
    image: freeToStartSlide,
  },
  {
    title: "Full dashboard",
    body: "Category breakdowns, monthly trends, and every piece of feedback in one place.",
    image: dashboardSlide,
  },
  {
    title: "QR code generator",
    body: "Generate a QR code for your counter, table, or receipt — pointing straight to your feedback page or Telegram bot.",
    image: qrGeneratorSlide,
  },
  {
    title: "Feedback from website",
    body: "Customers scan or click through to a simple web form — no app required, works on any phone.",
    image: webFeedbackSlide,
  },
  {
    title: "Feedback from Telegram Mini App",
    body: "Or let customers leave feedback right inside Telegram, using our Mini App — familiar, fast, no download needed.",
    image: telegramMiniAppSlide,
  },
] as const;

export default function Business() {
  const [contactCategory, setContactCategory] = useState<string | null>(null);

  return (
    <div
      className="scroll-smooth min-h-screen bg-[#fdf8f2] flex flex-col"
      style={{ fontFamily: "'Hanken Grotesk', system-ui, sans-serif" }}
    >

      <SiteNav howItWorksHref="/welcome#how-it-works" />

      <div className="max-w-[680px] mx-auto w-full px-4 sm:px-5 md:px-10 pt-16 sm:pt-20 pb-16 sm:pb-20 text-center flex-1">
        <h1 className="font-['Plus_Jakarta_Sans'] text-[30px] sm:text-[44px] font-extrabold text-[#2c2622] tracking-tight leading-[1.1]">
          If InputMatter says you're exceptional, you are.
        </h1>
        <p className="text-[15px] sm:text-[17px] text-[#6f6256] leading-relaxed mt-5 max-w-lg mx-auto">
          Good feedback shows you what's working. Bad feedback shows you what to fix.
          Anonymous, honest, and yours to act on.
        </p>

        <div className="mt-8">
          <CTAButtons onBookDemo={() => setContactCategory("book-demo")} />
        </div>

        <div className="mt-14">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#9a8c7c]">
            Built for any business that has customers
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
            {WHO_ITS_FOR.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex flex-col items-center justify-center gap-2 bg-white border border-[#f1e7d9] rounded-xl px-3 h-28 text-center"
              >
                <div className="w-8 h-8 rounded-full bg-[#f6e7dc] text-[#d9764a] flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[13px] font-semibold text-[#2c2622] leading-tight">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-[14.5px] sm:text-[15px] text-[#6f6256] leading-relaxed mt-14 max-w-md mx-auto">
          We believe feedback cuts both ways. The good tells you what to keep doing — the bad
          tells you what to fix before it costs you more customers. Both only work if they're
          honest, and honesty needs anonymity. That's the whole idea. The dashboard, the QR
          code, the free plan — they all exist to make that as frictionless as possible.
        </p>

        <div className="mt-10">
          <FeatureCarousel features={REAL_TODAY} />
        </div>

        <div className="mt-10">
          <Link to="/commitment" className="text-sm font-semibold text-[#b1603a] hover:text-[#2c2622] transition-colors">
            Read our commitment →
          </Link>
        </div>
      </div>

      <SiteFooter />

      {contactCategory && (
        <ContactModal initialCategory={contactCategory} onClose={() => setContactCategory(null)} />
      )}
    </div>
  );
}
