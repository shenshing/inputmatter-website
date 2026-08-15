import { Star, MapPin, Phone, Clock } from "lucide-react";

// Ratings aren't collected yet — shown as a fixed placeholder until that exists.
const PLACEHOLDER_RATING = 4.8;

export interface ShopInfoPanelShop {
  google_map_long_url: string | null;
  phone: string | null;
  categories?: string[];
  opening_hours?: {
    status: string | null;
    schedule: { day: string; hours: string }[] | null;
  } | null;
}

interface ShopInfoPanelProps {
  shop: ShopInfoPanelShop;
}

export default function ShopInfoPanel({ shop }: ShopInfoPanelProps) {
  // The scraper only records a status snapshot from whenever the shop was
  // last scraped ("Open ⋅ Closes 10 PM"), which goes stale — showing it as
  // live "open now" would be misleading. The weekly schedule doesn't have
  // that problem, so only today's row from it is shown.
  const todayName = new Date().toLocaleDateString("en-US", { weekday: "long" });
  const todayHours = shop.opening_hours?.schedule?.find((d) => d.day === todayName)?.hours ?? null;

  const hasDirections = !!shop.google_map_long_url;
  const hasPhone = !!shop.phone;
  const hasHours = !!todayHours;
  const hasDetails = hasDirections || hasPhone || hasHours;

  return (
    <div className="bg-white border border-[#f1e7d9] rounded-[18px] md:rounded-[22px] p-4 md:p-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          <Star className="w-3.5 h-3.5 fill-[#d9764a] text-[#d9764a]" />
          <span className="font-bold text-[#2c2622] text-sm">{PLACEHOLDER_RATING.toFixed(1)}</span>
          <span className="text-[#9a8c7c] text-xs">overall rating</span>
        </div>
        {shop.categories && shop.categories.length > 0 && (
          <span className="text-xs text-[#9a8c7c]">
            {shop.categories.map((c) => c.charAt(0).toUpperCase() + c.slice(1)).join(" · ")}
          </span>
        )}
      </div>

      {hasDetails ? (
        <div className="grid sm:grid-cols-3 gap-2 mt-3">
          {hasDirections && (
            <a
              href={shop.google_map_long_url!}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 bg-[#fef7f2] border border-[#f1e7d9] rounded-xl px-3.5 py-2.5 hover:border-[#d9764a] transition-colors"
            >
              <MapPin className="w-4 h-4 text-[#b1603a] shrink-0" />
              <span className="text-xs md:text-sm font-semibold text-[#2c2622]">Get directions</span>
            </a>
          )}
          {hasPhone && (
            <a
              href={`tel:${shop.phone!.replace(/[^\d+]/g, "")}`}
              className="flex items-center gap-2.5 bg-[#fef7f2] border border-[#f1e7d9] rounded-xl px-3.5 py-2.5 hover:border-[#d9764a] transition-colors"
            >
              <Phone className="w-4 h-4 text-[#b1603a] shrink-0" />
              <span className="text-xs md:text-sm font-semibold text-[#2c2622] truncate">{shop.phone}</span>
            </a>
          )}
          {hasHours && (
            <div className="flex items-center gap-2.5 bg-[#fef7f2] border border-[#f1e7d9] rounded-xl px-3.5 py-2.5">
              <Clock className="w-4 h-4 text-[#b1603a] shrink-0" />
              <span className="text-xs md:text-sm text-[#2c2622]">
                <span className="font-semibold">Today</span> · {todayHours}
              </span>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-[#9a8c7c] text-center py-2 mt-1">More details coming soon.</p>
      )}
    </div>
  );
}
