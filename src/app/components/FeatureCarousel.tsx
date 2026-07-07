import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Feature {
  title: string;
  body: string;
  image?: string;
}

const AUTO_ADVANCE_MS = 2000;

export default function FeatureCarousel({ features }: { features: readonly Feature[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  function goTo(i: number) {
    setIndex((i + features.length) % features.length);
  }

  // Auto-advances every 2s; any manual navigation changes `index`, which
  // restarts this effect and so resets the wait — manual and auto coexist
  // without fighting each other. Hovering pauses it entirely.
  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % features.length);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(id);
  }, [index, paused, features.length]);

  const active = features[index];

  return (
    <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="relative rounded-2xl overflow-hidden border border-[#f0e4d4]">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {features.map((f) => (
            <div key={f.title} className="flex-none w-full">
              {f.image ? (
                <div className="aspect-[16/9] overflow-hidden">
                  <img src={f.image} alt={f.title} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="aspect-[16/9] bg-[repeating-linear-gradient(45deg,#f1e3d3_0,#f1e3d3_10px,#f8efe2_10px,#f8efe2_20px)] flex items-center justify-center">
                  <span className="font-mono text-xs text-[#c2ab92]">{f.title} — placeholder image</span>
                </div>
              )}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => goTo(index - 1)}
          aria-label="Previous feature"
          className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/85 hover:bg-white flex items-center justify-center text-[#2c2622] shadow-sm transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => goTo(index + 1)}
          aria-label="Next feature"
          className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/85 hover:bg-white flex items-center justify-center text-[#2c2622] shadow-sm transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-4 min-h-[62px]">
        <div className="font-['Plus_Jakarta_Sans'] font-bold text-[#2c2622] text-[15.5px]">
          {active.title}
        </div>
        <div className="text-[13.5px] text-[#7d7064] leading-relaxed mt-1 max-w-md mx-auto">
          {active.body}
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 mt-4">
        {features.map((f, i) => (
          <button
            key={f.title}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Go to "${f.title}"`}
            aria-current={i === index}
            className={
              i === index
                ? "w-6 h-2 rounded-full bg-[#2c2622] transition-all"
                : "w-2 h-2 rounded-full bg-[#e7dccd] hover:bg-[#d9764a]/50 transition-all"
            }
          />
        ))}
      </div>
    </div>
  );
}
