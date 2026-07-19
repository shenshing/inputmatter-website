import { useState } from "react";
import ImageLightbox from "./ImageLightbox";

interface FeedbackPhotosCellProps {
  imageUrls: string[] | null;
}

// Compact thumbnail row for admin tables — up to 3 photos (the submission
// cap), so there's never a "+N more" overflow case to design for. Click a
// thumbnail to view it full-size in the same lightbox used on the public feed.
export default function FeedbackPhotosCell({ imageUrls }: FeedbackPhotosCellProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const urls = imageUrls ?? [];

  if (urls.length === 0) {
    return <span className="text-[#c9b9a6] text-sm">—</span>;
  }

  return (
    <>
      <div className="flex gap-1">
        {urls.map((url, i) => (
          <button
            key={url}
            type="button"
            onClick={() => setOpenIndex(i)}
            aria-label={`View photo ${i + 1}`}
            className="w-8 h-8 rounded-md overflow-hidden border border-[#e8e8e4] shrink-0 hover:ring-2 hover:ring-[#ac7f5e] transition-all"
          >
            <img src={url} alt={`Attached photo ${i + 1}`} className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
      {openIndex != null && <ImageLightbox src={urls[openIndex]} onClose={() => setOpenIndex(null)} />}
    </>
  );
}
