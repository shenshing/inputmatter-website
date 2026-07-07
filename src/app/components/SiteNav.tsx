import { useState } from "react";
import { Link } from "react-router";
import { Menu, X } from "lucide-react";
import Logo from "./Logo";

export default function SiteNav({ howItWorksHref = "#how-it-works" }: { howItWorksHref?: string }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="border-b border-[#f1e8db]">
      <div className="max-w-[1120px] mx-auto flex items-center justify-between px-4 sm:px-5 md:px-10 py-4 sm:py-5 gap-3">
        <Link to="/welcome" className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <Logo />
          <span className="hidden min-[400px]:inline font-['Plus_Jakarta_Sans'] font-extrabold text-[15px] sm:text-[17px] tracking-tight text-[#2C2623] truncate">
            InputMatter
          </span>
        </Link>
        <div className="flex items-center gap-3 md:gap-6 text-[13.5px] font-medium text-[#6f6256] shrink-0">
          <a href={howItWorksHref} className="hidden md:inline hover:text-[#2c2622] transition-colors">
            How it works
          </a>
          <Link to="/business" className="hidden md:inline hover:text-[#2c2622] transition-colors">
            For businesses
          </Link>
          <Link to="/commitment" className="hidden md:inline hover:text-[#2c2622] transition-colors">
            Commitment
          </Link>
          <Link
            to="/"
            className="text-white bg-[#2c2622] hover:bg-[#2c2622]/90 rounded-full px-3.5 sm:px-4 py-2 sm:py-2.5 font-semibold transition-colors whitespace-nowrap"
          >
            Leave feedback
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-full text-[#2c2622] hover:bg-[#f1e8db] transition-colors shrink-0"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden max-w-[1120px] mx-auto flex flex-col px-4 sm:px-5 pb-4 border-t border-[#f1e8db] pt-2">
          <a
            href={howItWorksHref}
            onClick={() => setMenuOpen(false)}
            className="py-2.5 text-[14.5px] font-semibold text-[#2c2622]"
          >
            How it works
          </a>
          <Link
            to="/business"
            onClick={() => setMenuOpen(false)}
            className="py-2.5 text-[14.5px] font-semibold text-[#2c2622]"
          >
            For businesses
          </Link>
          <Link
            to="/commitment"
            onClick={() => setMenuOpen(false)}
            className="py-2.5 text-[14.5px] font-semibold text-[#2c2622]"
          >
            Commitment
          </Link>
        </div>
      )}
    </div>
  );
}
