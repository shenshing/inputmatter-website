import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL as string;

export interface PublicFeedbackItem {
  id: string;
  description: string;
  categories: string[];
  rating: number | null;
  imageUrls: string[];
  createdAt: string;
}

interface PublicFeedbackResponse {
  items: PublicFeedbackItem[];
  total: number;
  page: number;
  totalPages: number;
}

// Per-shop public feedback feed, shown alongside the form so visitors can see
// what others said. `refreshKey` lets the caller force a refetch (e.g. right
// after a successful submission) by bumping it. Paginated server-side — only
// the current page is ever fetched, so a shop with lots of feedback doesn't
// load it all up front.
export function usePublicFeedback(shopId: number | null, refreshKey: number) {
  const [items, setItems] = useState<PublicFeedbackItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  // Reset to page 1 whenever the shop or refreshKey changes, before the
  // fetch effect below runs — done during render (React's documented
  // pattern for "adjust state when a prop changes") so it never fetches a
  // stale page for the new shop first.
  const resetKey = `${shopId}:${refreshKey}`;
  const [prevResetKey, setPrevResetKey] = useState(resetKey);
  if (prevResetKey !== resetKey) {
    setPrevResetKey(resetKey);
    setPage(1);
  }

  useEffect(() => {
    if (shopId == null) {
      setItems([]);
      setTotal(0);
      setTotalPages(1);
      return;
    }

    let cancelled = false;
    setLoading(true);
    fetch(`${API_URL}/feedback/public?shopId=${shopId}&page=${page}`)
      .then((res) => res.json())
      .then((data: PublicFeedbackResponse) => {
        if (cancelled) return;
        setItems(data.items);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [shopId, refreshKey, page]);

  return { items, total, page, totalPages, loading, setPage };
}
