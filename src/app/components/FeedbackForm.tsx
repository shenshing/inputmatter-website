import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router";
import { Store, MapPin } from "lucide-react";
import { useTelegram } from "../hooks/useTelegram";
import { usePublicFeedback } from "../hooks/usePublicFeedback";
import StarRating from "./StarRating";
import PhotoUpload from "./PhotoUpload";
import PublicFeedbackList from "./PublicFeedbackList";
import shopAltImage from "../../assets/shop-alt.png";

const API_URL = import.meta.env.VITE_API_URL as string;

const categories = [
  { id: "taste", label: "#Taste" },
  { id: "service", label: "#Service" },
  { id: "environment", label: "#Environment" },
  { id: "other", label: "#Other" },
];

interface Shop {
  id: number;
  name: string;
  logo_url: string | null;
  google_map_url: string | null;
}

// Auto flip a flipped shop card back to its logo after this long.
const FLIP_BACK_DELAY_MS = 5000;

export default function FeedbackForm() {
  const [searchParams] = useSearchParams();
  const { isTelegram, webApp } = useTelegram();
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [shopInput, setShopInput] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [rating, setRating] = useState(0);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  // Bumped whenever the form fully resets (cancel or successful submit) to
  // force PhotoUpload to remount — clearing its own internal error/uploading
  // state, which otherwise isn't reachable from here.
  const [photoResetKey, setPhotoResetKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [mobileTab, setMobileTab] = useState<"feedback" | "feed">("feedback");
  const [feedRefreshKey, setFeedRefreshKey] = useState(0);
  const [isShopCardFlipped, setIsShopCardFlipped] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const handleSubmitRef = useRef<() => void>(() => {});

  const {
    items: feedItems,
    total: feedTotal,
    page: feedPage,
    totalPages: feedTotalPages,
    loading: feedLoading,
    setPage: setFeedPage,
  } = usePublicFeedback(selectedShop?.id ?? null, feedRefreshKey);
  const feedScrollRef = useRef<HTMLDivElement>(null);

  // Jump back to the top of the scrollable feed column whenever the page changes.
  useEffect(() => {
    feedScrollRef.current?.scrollTo({ top: 0 });
  }, [feedPage]);

  // Reset to the logo face whenever the selected shop changes.
  useEffect(() => {
    setIsShopCardFlipped(false);
  }, [selectedShop?.id]);

  // Clicking the logo flips to the links face; it only ever flips back on
  // its own after a few seconds — there's no click-to-flip-back.
  useEffect(() => {
    if (!isShopCardFlipped) return;
    const timer = setTimeout(() => setIsShopCardFlipped(false), FLIP_BACK_DELAY_MS);
    return () => clearTimeout(timer);
  }, [isShopCardFlipped]);

  useEffect(() => {
    fetch(`${API_URL}/app-visitors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'telegram' }),
    }).catch(() => {});
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/shops`)
      .then((res) => res.json())
      .then((data: Shop[]) => setShops(data))
      .catch(() => {});
  }, []);

  // Pre-selection runs after shops load. Telegram's native bridge sends
  // start_param asynchronously, so retry a few times to wait for it.
  useEffect(() => {
    if (shops.length === 0) return;

    const urlShop = searchParams.get("shop");
    if (urlShop) {
      const match = shops.find(
        (s) => s.name.toLowerCase() === urlShop.toLowerCase(),
      );
      if (match) { setSelectedShop(match); return; }
      // No existing shop matches — prefill the free-text field so the
      // visitor can submit it as a new shop name (see handleSubmit).
      setShopInput(urlShop);
      return;
    }

    let attempts = 0;
    function tryTelegramParam() {
      const raw = window.Telegram?.WebApp?.initDataUnsafe?.start_param;
      if (raw) {
        // startapp only allows A-Za-z0-9_- so spaces were encoded as _
        // match by applying the same sanitization to each shop name
        const match = shops.find(
          (s) => s.name.replace(/[^A-Za-z0-9_-]/g, '_').toLowerCase() === raw.toLowerCase(),
        );
        if (match) { setSelectedShop(match); return; }
        return; // param received but no match — stop retrying
      }
      if (++attempts < 10) setTimeout(tryTelegramParam, 150);
    }
    tryTelegramParam();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shops]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    handleSubmitRef.current = handleSubmit;
  });

  useEffect(() => {
    if (!isTelegram || !webApp) return;

    webApp.ready();
    webApp.expand();

    const btn = webApp.MainButton;
    btn.text = "Share";
    btn.color = "#ac7f5e";
    btn.textColor = "#33152e";

    const handler = () => handleSubmitRef.current();
    btn.show();
    btn.onClick(handler);

    return () => {
      btn.offClick(handler);
      btn.hide();
    };
  }, [isTelegram, webApp]);

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId],
    );
  };

  const filteredShops = shops.filter((shop) =>
    shop.name.toLowerCase().includes(shopInput.toLowerCase()),
  );

  const handleShopSelect = (shop: Shop) => {
    setSelectedShop(shop);
    setShopInput("");
    setIsDropdownOpen(false);
  };

  const handleCancel = () => {
    setDescription("");
    setSelectedCategories([]);
    setSelectedShop(null);
    setShopInput("");
    setRating(0);
    setImageUrls([]);
    setPhotoResetKey((k) => k + 1);
    setSubmitError(null);
    setSubmitSuccess(false);
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      setSubmitError("Please describe your feeling.");
      return;
    }
    if (selectedCategories.length === 0) {
      setSubmitError("Please select at least one category.");
      return;
    }
    if (!selectedShop && shopInput.trim().length < 5) {
      setSubmitError("Please choose a shop or type a shop name (at least 5 characters).");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    if (isTelegram && webApp) {
      webApp.MainButton.showProgress(false);
      webApp.MainButton.disable();
    }

    try {
      const res = await fetch(`${API_URL}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: description.trim(),
          categories: selectedCategories,
          ...(rating > 0 ? { rating } : {}),
          ...(imageUrls.length > 0 ? { imageUrls } : {}),
          ...(selectedShop
            ? { shopId: selectedShop.id }
            : { shopName: shopInput.trim() }),
          source: isTelegram ? "telegram" : "web",
        }),
      });

      if (!res.ok) {
        throw new Error("Something went wrong. Please try again.");
      }

      const saved = await res.json();

      setSubmitSuccess(true);
      setDescription("");
      setSelectedCategories([]);
      setRating(0);
      setImageUrls([]);
      setPhotoResetKey((k) => k + 1);
      // Keep the shop selected (and resolve a just-typed shop name to the
      // real shop record) so the feed on the right stays put and picks up
      // what was just submitted, instead of resetting to "no shop".
      if (saved.shop) {
        setSelectedShop(saved.shop);
        setShopInput("");
      }
      setFeedRefreshKey((k) => k + 1);

      if (isTelegram && webApp) {
        webApp.MainButton.hideProgress();
        webApp.MainButton.hide();
        setTimeout(() => webApp.close(), 1500);
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Unexpected error.");
      if (isTelegram && webApp) {
        webApp.MainButton.hideProgress();
        webApp.MainButton.enable();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const ratingLabel = rating ? `${rating}/5` : "tap to rate";
  const headerShopName = selectedShop ? selectedShop.name : "any shop or restaurant";

  const tabButtonClass = (active: boolean) =>
    `flex-1 text-center text-[12px] font-bold py-2 px-2 rounded-full transition-colors ${
      active ? "bg-white text-[#2c2622] shadow-sm" : "bg-transparent text-[#6f6256]"
    }`;

  return (
    <div
      className={`relative w-full bg-[#fdf8f2] ${isTelegram ? "min-h-screen" : ""}`}
      style={{ fontFamily: "'Hanken Grotesk', system-ui, sans-serif" }}
    >
      <div className={`relative z-10 max-w-[1200px] mx-auto px-4 md:px-10 py-8 md:py-12 ${isTelegram ? "pb-8" : ""}`}>

        {/* Header */}
        <div>
          <h1 className="font-normal text-[#212120] text-[19px] md:text-[32px] leading-[1.3] md:leading-[1.25]">
            Share a thought and give us a chance.
          </h1>
          <p className="font-normal text-[#696b63] text-xs md:text-[15.5px] leading-normal mt-1.5 md:mt-2.5">
            Leave feedback for {headerShopName} — owners read every message.
          </p>
        </div>

        {/* Success banner */}
        {submitSuccess && (
          <div className="mt-6 bg-[#e8f5e9] border border-[#a5d6a7] rounded-2xl px-6 py-4 text-[#2e7d32] text-sm md:text-base">
            Thank you! Your feedback has been shared.
          </div>
        )}

        {/* Mobile segmented tabs — desktop shows the form and feed side by side instead */}
        <div className="md:hidden flex bg-[#f1e7d9] rounded-full p-[3px] mt-4">
          <button type="button" onClick={() => setMobileTab("feedback")} className={tabButtonClass(mobileTab === "feedback")}>
            Leave feedback
          </button>
          <button type="button" onClick={() => setMobileTab("feed")} className={tabButtonClass(mobileTab === "feed")}>
            What others say
            <span className="ml-1.5 text-[9px] bg-[#ac7f5e] text-white rounded-full px-1.5 py-0.5">{feedTotal}</span>
          </button>
        </div>

        <div className="mt-4 md:mt-5 md:flex md:gap-8 md:items-start">

          {/* ===== Form column ===== */}
          <div className={`${mobileTab === "feed" ? "hidden" : "block"} md:block md:flex-[1.5] md:min-w-0`}>

            {/* Description + shop logo */}
            <div className="flex gap-2.5 md:gap-4 items-stretch">
              <div className="flex-1 min-w-0 bg-white border border-[#f1e7d9] rounded-[18px] md:rounded-[22px] p-4 md:px-5 md:py-[18px] relative">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your feeling..."
                  className="w-full bg-transparent border-none outline-none resize-none font-normal text-[#212120] placeholder:text-[#adadad] text-sm md:text-base min-h-[60px] md:min-h-[84px]"
                  maxLength={500}
                />
                <div className="text-right text-[11px] md:text-xs text-[#7e7f78] mt-1">
                  {description.length}/500
                </div>
              </div>
              <div className="flex-none w-[92px] md:w-[140px] bg-white border border-[#f1e7d9] rounded-[18px] md:rounded-[22px] p-2.5 md:p-3.5 flex flex-col items-center justify-center gap-1.5 md:gap-2">
                {selectedShop ? (
                  <div className="relative w-full aspect-square [perspective:900px]">
                    <div
                      className="relative w-full h-full [transform-style:preserve-3d] transition-transform duration-500 ease-in-out"
                      style={{ transform: isShopCardFlipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
                    >
                      {/* Front — logo, click to reveal links */}
                      <button
                        type="button"
                        onClick={() => setIsShopCardFlipped(true)}
                        aria-label={`Show links for ${selectedShop.name}`}
                        style={{ pointerEvents: isShopCardFlipped ? "none" : "auto" }}
                        className="absolute inset-0 w-full h-full [backface-visibility:hidden] rounded-xl md:rounded-2xl overflow-hidden cursor-pointer"
                      >
                        <img
                          src={selectedShop.logo_url ?? shopAltImage}
                          alt={selectedShop.name}
                          className="w-full h-full object-cover"
                        />
                      </button>

                      {/* Back — Google Maps */}
                      <div
                        style={{
                          transform: "rotateY(180deg)",
                          pointerEvents: isShopCardFlipped ? "auto" : "none",
                        }}
                        className="absolute inset-0 w-full h-full [backface-visibility:hidden] rounded-xl md:rounded-2xl bg-[#fef7f2] border border-[#f1e7d9] flex items-stretch p-1 md:p-1.5"
                      >
                        {selectedShop.google_map_url ? (
                          <a
                            href={selectedShop.google_map_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="View on Google Maps"
                            className="flex-1 flex items-center justify-center rounded-lg md:rounded-xl bg-white hover:bg-[#f6e7dc] active:scale-95 transition-all text-[#b1603a]"
                          >
                            <MapPin className="w-4 h-4 md:w-5 md:h-5" />
                          </a>
                        ) : (
                          <div className="flex-1 flex items-center justify-center text-center text-[8.5px] md:text-[9.5px] text-[#c9b9a6] px-1 leading-tight">
                            No links yet
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full aspect-square rounded-xl md:rounded-2xl border-2 border-dashed border-[#ece0d1] flex items-center justify-center text-[#c9b9a6]">
                    <Store className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                )}
                <div className="hidden md:block text-[10.5px] text-[#9a8c7c] text-center leading-tight line-clamp-2">
                  {selectedShop ? selectedShop.name : "No shop selected"}
                </div>
              </div>
            </div>

            {/* Category Tags */}
            <div className="mt-3.5 md:mt-4">
              <div className="bg-white border border-[#f1e7d9] rounded-[18px] md:rounded-[22px] p-4 md:p-5">
                <p className="font-bold text-[#adadad] text-xs md:text-sm mb-2.5 md:mb-3">
                  Select a category tag
                </p>
                <div className="flex flex-wrap gap-1.5 md:gap-2">
                  {categories.map((category) => {
                    const isSelected = selectedCategories.includes(category.id);
                    return (
                      <button
                        key={category.id}
                        onClick={() => toggleCategory(category.id)}
                        className={`
                          ${isSelected ? "bg-[#e8a882] border-[#c8845a]" : "bg-[#fef7f2] border-[#f5d8c8]"}
                          border-2 border-dashed rounded-[30px]
                          px-3 md:px-4 py-1.5 md:py-2
                          font-normal text-[#3a1834] text-xs md:text-sm
                          hover:scale-105 hover:shadow-lg transition-all duration-200
                          whitespace-nowrap
                        `}
                      >
                        {category.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Rating + Photo */}
            <div className="flex gap-2.5 md:gap-4 mt-3.5 md:mt-4 items-stretch">
              <div className="flex-1 bg-white border border-[#f1e7d9] rounded-[18px] md:rounded-[22px] p-3.5 md:p-5">
                <div className="font-bold text-[#adadad] text-xs md:text-sm mb-2.5 md:mb-3">
                  How was it? <span className="font-medium text-[#b1603a]">{ratingLabel}</span>
                </div>
                <StarRating value={rating} onChange={setRating} className="text-[17px] md:text-[28px]" />
              </div>
              <div className="flex-1 bg-white border border-[#f1e7d9] rounded-[18px] md:rounded-[22px] p-3.5 md:p-5">
                <div className="font-bold text-[#adadad] text-xs md:text-sm mb-2.5 md:mb-3">
                  <span className="md:hidden">Photos</span>
                  <span className="hidden md:inline">Add photos</span>{" "}
                  <span className="font-medium">(optional, up to 3)</span>
                </div>
                <PhotoUpload key={photoResetKey} imageUrls={imageUrls} onChange={setImageUrls} />
              </div>
            </div>

            {/* Shop Name Input */}
            <div className="mt-3.5 md:mt-4 relative" ref={dropdownRef}>
              <div className="bg-white border border-[#f1e7d9] rounded-[18px] md:rounded-[22px] px-4 md:px-6 py-4 md:py-5 relative hover:scale-[1.02] hover:shadow-lg transition-all duration-200">
                <input
                  type="text"
                  value={selectedShop ? selectedShop.name : shopInput}
                  onChange={(e) => {
                    setShopInput(e.target.value);
                    setSelectedShop(null);
                    setIsDropdownOpen(true);
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  onKeyDown={(e) => e.key === 'Escape' && setIsDropdownOpen(false)}
                  placeholder="Choose the shop"
                  className="w-full bg-transparent border-none outline-none font-normal text-[#333] placeholder:text-[#aaa] text-base md:text-lg pr-8"
                />
                <svg
                  className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 pointer-events-none"
                  width="18"
                  height="18"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M5 7.5L10 12.5L15 7.5"
                    stroke="#aaa"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {isDropdownOpen && filteredShops.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-lg max-h-[240px] overflow-y-auto z-50">
                    {filteredShops.map((shop) => (
                      <button
                        key={shop.id}
                        onClick={() => handleShopSelect(shop)}
                        className="w-full text-left px-4 md:px-6 py-3 hover:bg-[#fef7f2] transition-colors font-normal text-[#333] text-sm md:text-base first:rounded-t-2xl last:rounded-b-2xl"
                      >
                        {shop.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <p className="font-bold text-[#b7b7b6] text-xs md:text-base mt-2.5 md:mt-3 leading-normal">
                Examples: Tube Coffee (BKK), Brown Roastery TK
              </p>
              {!selectedShop && shopInput.trim().length >= 5 && (
                <p className="text-[#ac7f5e] text-xs md:text-sm mt-2 leading-normal">
                  Can&apos;t find your shop? &quot;{shopInput.trim()}&quot; will be saved as a new shop name.
                </p>
              )}
            </div>

            {/* Error message */}
            {submitError && (
              <p className="mt-3 text-red-500 text-sm px-2">
                {submitError}
              </p>
            )}

            {/* Action Buttons — hidden in Telegram (MainButton takes over) */}
            {!isTelegram && (
              <div className="space-y-2.5 md:space-y-3 mt-4">
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full bg-[#ac7f5e] rounded-[18px] md:rounded-[22px] py-[13px] md:py-4 font-bold text-[#33152e] text-sm md:text-[15.5px] hover:scale-[1.02] hover:shadow-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isSubmitting ? "Sharing..." : "Share"}
                </button>
                <button
                  onClick={handleCancel}
                  className="w-full bg-[#fdf8f2] border border-[#cfcbc4] rounded-[18px] md:rounded-[22px] py-[13px] md:py-4 font-bold text-[#a2a2a1] text-sm md:text-[15.5px] hover:scale-[1.02] hover:shadow-lg transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* ===== Public feed column ===== */}
          <div className={`${mobileTab === "feedback" ? "hidden" : "block"} md:block md:flex-1 md:min-w-[340px] mt-5 md:mt-0`}>
            <div className="hidden md:flex items-baseline justify-between mb-3.5">
              <div className="font-['Plus_Jakarta_Sans'] font-extrabold text-base text-[#2c2622]">
                What others are saying
              </div>
              <div className="text-xs text-[#b1603a] bg-[#f6e7dc] rounded-full px-2.5 py-1 font-semibold">
                {feedTotal} notes
              </div>
            </div>
            <div ref={feedScrollRef} className="md:max-h-[640px] md:overflow-y-auto md:pr-0.5">
              <PublicFeedbackList
                items={feedItems}
                loading={feedLoading}
                emptyMessage={
                  selectedShop
                    ? "No public feedback yet — be the first to share!"
                    : "Pick a shop above to see what others said."
                }
              />
            </div>
            {feedTotalPages > 1 && (
              <div className="flex items-center justify-between mt-3">
                <button
                  type="button"
                  onClick={() => setFeedPage((p) => Math.max(1, p - 1))}
                  disabled={feedPage <= 1}
                  className="text-xs font-semibold text-[#b1603a] px-3 py-1.5 rounded-full hover:bg-[#f6e7dc] transition-colors disabled:text-[#c9b9a6] disabled:cursor-not-allowed disabled:hover:bg-transparent"
                >
                  ‹ Prev
                </button>
                <span className="text-xs text-[#9a8c7c]">
                  Page {feedPage} of {feedTotalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setFeedPage((p) => Math.min(feedTotalPages, p + 1))}
                  disabled={feedPage >= feedTotalPages}
                  // mr-16 keeps this clear of the fixed floating nav buttons
                  // pinned to the bottom-right corner on mobile — see App.tsx.
                  // Those buttons are hidden entirely in Telegram (!isTelegram
                  // in App.tsx), so there's nothing to dodge there — skip the
                  // margin so Prev/Page/Next stay evenly spaced.
                  className={`text-xs font-semibold text-[#b1603a] px-3 py-1.5 rounded-full hover:bg-[#f6e7dc] transition-colors disabled:text-[#c9b9a6] disabled:cursor-not-allowed disabled:hover:bg-transparent ${!isTelegram ? "mr-16 md:mr-0" : ""}`}
                >
                  Next ›
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
