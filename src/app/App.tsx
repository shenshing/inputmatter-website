import { useState } from "react";
import { Analytics } from "@vercel/analytics/react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { BrowserRouter, Routes, Route, Link } from "react-router";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { useTelegram } from "./hooks/useTelegram";
import FeedbackForm from "./components/FeedbackForm";
import SiteNav from "./components/SiteNav";
import SiteFooter from "./components/SiteFooter";
import AboutModal from "./components/AboutModal";
import ContactModal from "./components/ContactModal";
import Dashboard from "./pages/Dashboard";
import ShopDashboard from "./pages/ShopDashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AuthCallback from "./pages/AuthCallback";
import Unauthorized from "./pages/Unauthorized";
import Welcome from "./pages/Welcome";
import Places from "./pages/Places";
import Business from "./pages/Business";
import Commitment from "./pages/Commitment";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/" element={<PublicHome />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/welcome" element={<Welcome />} />
            <Route path="/places" element={<Places />} />
            <Route path="/business" element={<Business />} />
            <Route path="/commitment" element={<Commitment />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Protected — super-admin only */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute role="super-admin">
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/* Protected — shop-admin only */}
            <Route
              path="/shop"
              element={
                <ProtectedRoute role="shop-admin">
                  <ShopDashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
        <Analytics />
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

function PublicHome() {
  const { user, logout } = useAuth();
  const [showAbout, setShowAbout] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const { isTelegram } = useTelegram();


  return (
    <div className="relative w-full">
      {/* Hidden inside Telegram Mini App — limited real estate, no need to duplicate site chrome */}
      {!isTelegram && <SiteNav howItWorksHref="/welcome#how-it-works" />}
      <FeedbackForm />
      {!isTelegram && <SiteFooter />}

      {/* Floating nav — hidden inside Telegram Mini App. Icon-only FABs at
          all sizes by default (covers less content, e.g. the feed's Prev/
          Next controls) — on md+ they expand to icon+label on hover via
          max-width transition (width:auto isn't animatable) and collapse
          back on mouse-out. No hover variant below md: touch has no
          persistent hover state, so mobile stays tap-only icon buttons.
          justify-content and display are never toggled — neither is
          animatable, so switching them mid-transition fights the smooth
          max-width/opacity animation instead of easing with it. The icon
          span's own fixed width keeps it visually centered while
          collapsed, and the label stays in the DOM at opacity-0, clipped
          by overflow-hidden, so it fades in rather than popping in. */}
      {!isTelegram && <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 flex flex-col items-end gap-2">
        {/* Welcome — always visible */}
        <Link
          to="/welcome"
          className="group flex items-center gap-0 md:hover:gap-2 h-11 max-w-[44px] md:hover:max-w-[220px] overflow-hidden px-0 md:hover:px-4 bg-white/80 backdrop-blur-sm text-[#212120] text-sm font-medium rounded-full shadow-lg hover:bg-white transition-all duration-300 ease-out border border-[#212120]/10"
        >
          <span className="w-11 shrink-0 flex items-center justify-center">✨</span>
          <span className="opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 delay-75 whitespace-nowrap">Welcome</span>
        </Link>

        {/* Contact Us — always visible */}
        <button
          onClick={() => setShowContact(true)}
          className="group flex items-center gap-0 md:hover:gap-2 h-11 max-w-[44px] md:hover:max-w-[220px] overflow-hidden px-0 md:hover:px-4 bg-white/80 backdrop-blur-sm text-[#212120] text-sm font-medium rounded-full shadow-lg hover:bg-white transition-all duration-300 ease-out border border-[#212120]/10"
        >
          <span className="w-11 shrink-0 flex items-center justify-center">✉️</span>
          <span className="opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 delay-75 whitespace-nowrap">Contact Us</span>
        </button>

        {user ? (
          <>
            {user.role === "shop-admin" && (
              <Link
                to="/shop"
                className="group flex items-center gap-0 md:hover:gap-2 h-11 max-w-[44px] md:hover:max-w-[220px] overflow-hidden px-0 md:hover:px-4 bg-[#ac7f5e] text-white text-sm font-medium rounded-full shadow-lg hover:bg-[#9a6f4e] transition-all duration-300 ease-out"
              >
                <span className="w-11 shrink-0 flex items-center justify-center">🏪</span>
                <span className="opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 delay-75 whitespace-nowrap">My Shop</span>
              </Link>
            )}
            {user.role === "super-admin" && (
              <Link
                to="/dashboard"
                className="group flex items-center gap-0 md:hover:gap-2 h-11 max-w-[44px] md:hover:max-w-[220px] overflow-hidden px-0 md:hover:px-4 bg-[#212120]/75 backdrop-blur-sm text-white text-sm font-medium rounded-full shadow-lg hover:bg-[#212120] transition-all duration-300 ease-out"
              >
                <span className="w-11 shrink-0 flex items-center justify-center">📊</span>
                <span className="opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 delay-75 whitespace-nowrap">Admin</span>
              </Link>
            )}
            <button
              onClick={logout}
              className="group flex items-center gap-0 md:hover:gap-2 h-11 max-w-[44px] md:hover:max-w-[220px] overflow-hidden px-0 md:hover:px-4 bg-white/80 backdrop-blur-sm text-[#212120] text-sm font-medium rounded-full shadow-lg hover:bg-white transition-all duration-300 ease-out border border-[#212120]/10"
            >
              <span className="w-11 shrink-0 flex items-center justify-center">👋</span>
              <span className="opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 delay-75 whitespace-nowrap">Logout</span>
            </button>
          </>
        ) : (
          <Link
            to="/login"
            className="group flex items-center gap-0 md:hover:gap-2 h-11 max-w-[44px] md:hover:max-w-[220px] overflow-hidden px-0 md:hover:px-4 bg-[#212120]/75 backdrop-blur-sm text-white text-sm font-medium rounded-full shadow-lg hover:bg-[#212120] transition-all duration-300 ease-out"
          >
            <span className="w-11 shrink-0 flex items-center justify-center">🏪</span>
            <span className="opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 delay-75 whitespace-nowrap">My Shop</span>
          </Link>
        )}

        {/* About Us — always visible, below My Shop */}
        <button
          onClick={() => setShowAbout(true)}
          className="group flex items-center gap-0 md:hover:gap-2 h-11 max-w-[44px] md:hover:max-w-[220px] overflow-hidden px-0 md:hover:px-4 bg-white/80 backdrop-blur-sm text-[#212120] text-sm font-medium rounded-full shadow-lg hover:bg-white transition-all duration-300 ease-out border border-[#212120]/10"
        >
          <span className="w-11 shrink-0 flex items-center justify-center">💡</span>
          <span className="opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 delay-75 whitespace-nowrap">About Us</span>
        </button>
      </div>}

      {showAbout && (
        <AboutModal
          onClose={() => setShowAbout(false)}
          onContactClick={() => { setShowAbout(false); setShowContact(true); }}
        />
      )}
      {showContact && <ContactModal onClose={() => setShowContact(false)} />}
    </div>
  );
}
