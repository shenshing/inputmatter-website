import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { apiFetch } from "../lib/api";
import SiteNav from "../components/SiteNav";
import SiteFooter from "../components/SiteFooter";
import ShopCard, { type Shop } from "../components/ShopCard";

const PAGE_SIZE = 16;

// Collapses a long page range to first/last + a window around the current
// page, e.g. [1, 2, "…", 4, 5, 6, "…", 9, 10] instead of every page.
function getPageNumbers(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const keep = new Set([1, 2, total - 1, total, current - 1, current, current + 1]);
  const sorted = [...keep].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const result: (number | "…")[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) result.push("…");
    result.push(p);
    prev = p;
  }
  return result;
}

export default function Places() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    apiFetch<Shop[]>("/shops")
      .then(setShops)
      .catch(() => {});
  }, []);

  const filteredShops = useMemo(
    () => shops.filter((shop) => shop.name.toLowerCase().includes(query.trim().toLowerCase())),
    [shops, query],
  );

  // Jump back to page 1 whenever the search narrows/changes the result set.
  useEffect(() => {
    setPage(1);
  }, [query]);

  const totalPages = Math.max(1, Math.ceil(filteredShops.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedShops = filteredShops.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div
      className="scroll-smooth min-h-screen bg-[#fdf8f2] flex flex-col"
      style={{ fontFamily: "'Hanken Grotesk', system-ui, sans-serif" }}
    >

      <SiteNav howItWorksHref="/welcome#how-it-works" />

      {/* Header */}
      <div className="max-w-[1120px] mx-auto w-full px-4 sm:px-5 md:px-10 pt-8 sm:pt-9 pb-2">
        <Link to="/welcome" className="text-[13px] text-[#6f6256] hover:text-[#2c2622] transition-colors">
          ← Back to InputMatter
        </Link>
        <h1 className="font-['Plus_Jakarta_Sans'] text-[28px] sm:text-[32px] font-extrabold text-[#2c2622] tracking-tight mt-3.5 mb-2">
          All places
        </h1>
        <p className="text-[15px] text-[#6f6256] leading-relaxed max-w-md mb-4">
          Browse every shop and café collecting feedback on InputMatter.
        </p>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#b1603a] bg-[#f6e7dc] rounded-full px-3.5 py-1.5">
          {shops.length} {shops.length === 1 ? "place" : "places"}
        </span>
      </div>

      {/* Search */}
      <div className="max-w-[1120px] mx-auto w-full px-4 sm:px-5 md:px-10 pt-6 pb-2">
        <div className="flex items-center gap-2.5 bg-white border border-[#f1e7d9] rounded-2xl px-4 py-3 max-w-[440px] focus-within:border-[#d9764a] transition-colors">
          <Search className="w-4 h-4 text-[#9a8c7c] shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search places…"
            className="w-full bg-transparent border-none outline-none text-[14.5px] text-[#2c2622] placeholder:text-[#9a8c7c] min-w-0"
          />
        </div>
      </div>

      {/* Shop grid */}
      <div className="max-w-[1120px] mx-auto w-full px-4 sm:px-5 md:px-10 pt-4 pb-16 flex-1">
        {filteredShops.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
              {paginatedShops.map((shop) => (
                <ShopCard key={shop.id} shop={shop} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1.5 mt-10">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  aria-label="Previous page"
                  className="w-9 h-9 flex items-center justify-center rounded-full text-[#6f6256] hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {getPageNumbers(currentPage, totalPages).map((p, i) =>
                  p === "…" ? (
                    <span key={`ellipsis-${i}`} className="w-9 h-9 flex items-center justify-center text-sm text-[#9a8c7c]">
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPage(p)}
                      aria-current={p === currentPage ? "page" : undefined}
                      className={
                        p === currentPage
                          ? "w-9 h-9 flex items-center justify-center rounded-full bg-[#2c2622] text-white text-sm font-semibold"
                          : "w-9 h-9 flex items-center justify-center rounded-full text-[#6f6256] hover:bg-white text-sm font-medium transition-colors"
                      }
                    >
                      {p}
                    </button>
                  ),
                )}
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  aria-label="Next page"
                  className="w-9 h-9 flex items-center justify-center rounded-full text-[#6f6256] hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        ) : shops.length > 0 ? (
          <div className="border border-dashed border-[#e7dccd] rounded-2xl px-6 py-14 text-center">
            <p className="text-sm text-[#9a8c7c] mb-2">No places match "{query.trim()}".</p>
            {query.trim().length >= 5 ? (
              <>
                <p className="text-sm text-[#6f6256] max-w-sm mx-auto mt-1 mb-5 leading-relaxed">
                  Can't find it? Leave feedback for "{query.trim()}" and we'll add it as a new place.
                </p>
                <Link
                  to={`/?shop=${encodeURIComponent(query.trim())}`}
                  className="inline-flex items-center justify-center bg-[#d9764a] text-white rounded-xl px-5 py-2.5 text-sm font-bold hover:bg-[#d9764a]/90 transition-colors"
                >
                  Continue with "{query.trim()}" →
                </Link>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="text-sm font-medium text-[#9a8c7c] hover:text-[#2c2622] transition-colors"
                  >
                    Clear search
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-[#6f6256] max-w-sm mx-auto mt-1 mb-4 leading-relaxed">
                  Keep typing — {5 - query.trim().length} more character{5 - query.trim().length === 1 ? "" : "s"} and you can add "{query.trim()}" as a new place.
                </p>
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="text-sm font-semibold text-[#b1603a] hover:text-[#2c2622] transition-colors"
                >
                  Clear search
                </button>
              </>
            )}
          </div>
        ) : null}
      </div>

      <SiteFooter />
    </div>
  );
}
