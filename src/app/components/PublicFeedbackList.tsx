import { useState } from "react";
import type { PublicFeedbackItem } from "../hooks/usePublicFeedback";
import ImageCarousel from "./ImageCarousel";
import ImageLightbox from "./ImageLightbox";
import StarRating from "./StarRating";

const CATEGORY_STYLES: Record<string, { label: string; bg: string; color: string }> = {
  taste: { label: "#Taste", bg: "#e8f5e9", color: "#2e7d32" },
  service: { label: "#Service", bg: "#e8f4fd", color: "#4f6fbd" },
  environment: { label: "#Environment", bg: "#fef3ec", color: "#b1603a" },
  other: { label: "#Other", bg: "#fdf4ff", color: "#9b5db5" },
};

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;
  const years = Math.floor(days / 365);
  return `${years} year${years === 1 ? "" : "s"} ago`;
}

function FeedCard({ item }: { item: PublicFeedbackItem }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  return (
    <div className="bg-white border border-[#f1e7d9] rounded-2xl px-4 py-3.5">
      <div className="flex items-start justify-between mb-2 gap-2">
        <div className="flex flex-wrap gap-1">
          {item.categories.map((cat) => {
            const style = CATEGORY_STYLES[cat];
            if (!style) return null;
            return (
              <span
                key={cat}
                className="inline-block text-[10px] md:text-[10.5px] font-semibold rounded-full px-2.5 py-0.5"
                style={{ background: style.bg, color: style.color }}
              >
                {style.label}
              </span>
            );
          })}
        </div>
        {item.rating != null && <StarRating value={item.rating} className="text-[12px] md:text-[14px]" />}
      </div>
      <p className="text-[12px] md:text-[13.5px] text-[#2c2622] leading-relaxed">{item.description}</p>
      <ImageCarousel images={item.imageUrls} onImageClick={setLightboxIndex} />
      <div className="text-[10px] md:text-[11px] text-[#9a8c7c] mt-2">{formatRelativeTime(item.createdAt)}</div>
      {lightboxIndex != null && (
        <ImageLightbox src={item.imageUrls[lightboxIndex]} onClose={() => setLightboxIndex(null)} />
      )}
    </div>
  );
}

interface PublicFeedbackListProps {
  items: PublicFeedbackItem[];
  loading: boolean;
  emptyMessage?: string;
}

export default function PublicFeedbackList({
  items,
  loading,
  emptyMessage = "No public feedback yet — be the first to share!",
}: PublicFeedbackListProps) {
  if (loading && items.length === 0) {
    return <p className="text-[13px] text-[#9a8c7c]">Loading…</p>;
  }

  if (items.length === 0) {
    return <p className="text-[13px] text-[#9a8c7c]">{emptyMessage}</p>;
  }

  return (
    <div className="flex flex-col gap-2.5">
      {items.map((item) => (
        <FeedCard key={item.id} item={item} />
      ))}
    </div>
  );
}
