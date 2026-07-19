import { useRef, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL as string;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_IMAGES = 3;

interface PhotoUploadProps {
  imageUrls: string[];
  onChange: (urls: string[]) => void;
}

export default function PhotoUpload({ imageUrls, onChange }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadOne = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_URL}/uploads/feedback-image`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error();
    const data = (await res.json()) as { url: string };
    return data.url;
  };

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    const messages: string[] = [];
    const valid: File[] = [];

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        messages.push(`"${file.name}" isn't an image.`);
      } else if (file.size > MAX_FILE_SIZE_BYTES) {
        messages.push(`"${file.name}" is over 5MB.`);
      } else {
        valid.push(file);
      }
    }

    const remainingSlots = MAX_IMAGES - imageUrls.length;
    const toUpload = valid.slice(0, remainingSlots);
    if (valid.length > toUpload.length) {
      messages.push(`Only ${MAX_IMAGES} photos allowed — ${valid.length - toUpload.length} skipped.`);
    }

    if (toUpload.length === 0) {
      setError(messages.join(" ") || null);
      return;
    }

    setUploading(true);
    const results = await Promise.allSettled(toUpload.map(uploadOne));
    setUploading(false);

    const newUrls: string[] = [];
    let failCount = 0;
    for (const result of results) {
      if (result.status === "fulfilled") newUrls.push(result.value);
      else failCount++;
    }

    if (newUrls.length > 0) onChange([...imageUrls, ...newUrls]);
    if (failCount > 0) {
      messages.push(`${failCount} photo${failCount > 1 ? "s" : ""} failed to upload. Please try again.`);
    }
    setError(messages.length > 0 ? messages.join(" ") : null);
  };

  const removeAt = (index: number) => {
    onChange(imageUrls.filter((_, i) => i !== index));
  };

  const canAddMore = imageUrls.length < MAX_IMAGES;

  return (
    <div className="w-full">
      <div className="flex gap-1.5 md:gap-2 h-16 md:h-[92px]">
        {imageUrls.map((url, i) => (
          <div
            key={url}
            className="relative flex-1 min-w-0 rounded-xl md:rounded-2xl overflow-hidden border border-[#f1e7d9]"
          >
            <img src={url} alt={`Attached photo ${i + 1}`} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => removeAt(i)}
              aria-label={`Remove photo ${i + 1}`}
              className="absolute top-1 right-1 w-5 h-5 md:w-6 md:h-6 rounded-full bg-[#212120]/70 text-white text-[10px] md:text-xs flex items-center justify-center hover:bg-[#212120] transition-colors"
            >
              ✕
            </button>
          </div>
        ))}
        {canAddMore && (
          <>
            <input
              key={imageUrls.length}
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => void handleFiles(e.target.files)}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                void handleFiles(e.dataTransfer.files);
              }}
              disabled={uploading}
              className="flex-1 min-w-0 rounded-xl md:rounded-2xl border-2 border-dashed border-[#ece0d1] bg-[#fefaf5] flex items-center justify-center text-[#c9b9a6] text-[10px] md:text-xs font-medium hover:border-[#e0b79c] hover:text-[#b1603a] transition-colors disabled:opacity-60 px-1 text-center"
            >
              {uploading ? (
                "Uploading…"
              ) : imageUrls.length === 0 ? (
                <>
                  <span className="md:hidden">Add</span>
                  <span className="hidden md:inline">Drag photos here, or click to select</span>
                </>
              ) : (
                "+"
              )}
            </button>
          </>
        )}
      </div>
      {imageUrls.length > 0 && (
        <p className="text-[10px] md:text-[11px] text-[#9a8c7c] mt-1">
          {imageUrls.length}/{MAX_IMAGES} photos
        </p>
      )}
      {error && <p className="text-red-500 text-xs mt-1.5">{error}</p>}
    </div>
  );
}
