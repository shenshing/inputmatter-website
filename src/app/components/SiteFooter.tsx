import { useState } from "react";
import { Link } from "react-router";
import Logo from "./Logo";
import AboutModal from "./AboutModal";
import ContactModal from "./ContactModal";

export default function SiteFooter() {
  const [showAbout, setShowAbout] = useState(false);
  const [showContact, setShowContact] = useState(false);

  return (
    <>
      <div className="mt-auto border-t border-[#f1e8db] bg-[#faf3ea]">
        <div className="max-w-[1120px] mx-auto px-4 sm:px-5 md:px-10 py-6 sm:py-5">
          <div className="flex flex-col sm:flex-row items-center sm:items-start sm:justify-between gap-4 sm:gap-2 text-center sm:text-left">
            <Link to="/welcome" className="flex items-center gap-2">
              <Logo size={22} />
              <span className="font-['Plus_Jakarta_Sans'] font-extrabold text-[13.5px] text-[#2C2623]">
                InputMatter
              </span>
            </Link>
            <div className="flex flex-col items-center sm:items-end gap-2">
              <div className="flex items-center gap-5">
                <button
                  type="button"
                  onClick={() => setShowContact(true)}
                  className="text-xs font-medium text-[#6f6256] hover:text-[#2c2622] transition-colors"
                >
                  Contact Us
                </button>
                <button
                  type="button"
                  onClick={() => setShowAbout(true)}
                  className="text-xs font-medium text-[#6f6256] hover:text-[#2c2622] transition-colors"
                >
                  About Us
                </button>
              </div>
              <div className="text-xs text-[#9a8c7c]">
                Anonymous feedback platform · © {new Date().getFullYear()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showAbout && (
        <AboutModal
          onClose={() => setShowAbout(false)}
          onContactClick={() => { setShowAbout(false); setShowContact(true); }}
        />
      )}
      {showContact && <ContactModal onClose={() => setShowContact(false)} />}
    </>
  );
}
