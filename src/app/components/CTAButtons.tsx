import { Link } from "react-router";

export default function CTAButtons({ dark = false, onBookDemo }: { dark?: boolean; onBookDemo: () => void }) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
      <Link
        to="/register"
        className="w-full sm:w-auto text-center bg-[#d9764a] text-white rounded-xl px-6 py-4 text-[15.5px] font-bold shadow-[0_12px_24px_-10px_rgba(217,118,74,0.65)] hover:bg-[#d9764a]/90 transition-colors"
      >
        Get started free
      </Link>
      <button
        type="button"
        onClick={onBookDemo}
        className={
          dark
            ? "w-full sm:w-auto text-center border border-white/20 text-[#fdf8f2] rounded-xl px-6 py-4 text-[15.5px] font-semibold hover:bg-white/10 transition-colors"
            : "w-full sm:w-auto text-center bg-white text-[#2c2622] border border-[#e7dccd] rounded-xl px-6 py-4 text-[15.5px] font-semibold hover:bg-[#faf3ea] transition-colors"
        }
      >
        Book a Demo
      </button>
    </div>
  );
}
