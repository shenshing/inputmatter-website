const STAR_ON = "#d9764a";
const STAR_OFF = "#e2d9cb";
const DEFAULT_SIZE_CLASS = "text-base";

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  /** Tailwind text-size utility classes (supports responsive prefixes), e.g. "text-[17px] md:text-[28px]" */
  className?: string;
}

export default function StarRating({ value, onChange, className }: StarRatingProps) {
  const interactive = !!onChange;
  const sizeClass = className ?? DEFAULT_SIZE_CLASS;

  return (
    <div className="flex gap-1" role={interactive ? "radiogroup" : undefined} aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          onClick={interactive ? () => onChange(n) : undefined}
          role={interactive ? "radio" : undefined}
          aria-checked={interactive ? n === value : undefined}
          aria-label={interactive ? `${n} star${n > 1 ? "s" : ""}` : undefined}
          className={`leading-none ${sizeClass} ${interactive ? "cursor-pointer" : ""}`}
          style={{ color: n <= value ? STAR_ON : STAR_OFF }}
        >
          ★
        </span>
      ))}
    </div>
  );
}
