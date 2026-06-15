import { useState, useEffect } from "react";
import { Analytics } from "@vercel/analytics/react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { BrowserRouter, Routes, Route, Link } from "react-router";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import FeedbackForm from "./components/FeedbackForm";
import Dashboard from "./pages/Dashboard";
import ShopDashboard from "./pages/ShopDashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AuthCallback from "./pages/AuthCallback";
import Unauthorized from "./pages/Unauthorized";
import ContactForm from "./pages/ContactForm";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";

function AboutModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-[#fbfcf7] rounded-[28px] shadow-2xl w-full max-w-md mx-4 overflow-hidden">

        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-[#f0ede8]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-[#212120] text-2xl font-normal leading-snug">
                About InputMatter
              </h2>
              <p className="text-[#adadad] text-sm mt-1">Open feedback for local shops</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#efefef] flex items-center justify-center text-[#696b63] hover:bg-[#e4e4e0] transition-colors shrink-0 mt-0.5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-8 py-6 space-y-5">
          <p className="text-[#212120] text-base leading-relaxed">
            InputMatter is a simple, open platform that lets anyone leave honest feedback directly for local restaurants and shops — no account needed, no friction.
          </p>
          <p className="text-[#696b63] text-sm leading-relaxed">
            Shop owners sign up, register their business, and get a private dashboard where every piece of feedback lands — tagged by category, trended over time, and always in their inbox.
          </p>
          <p className="text-[#696b63] text-sm leading-relaxed">
            We believe good feedback helps good places get better. So we keep it open, honest, and direct.
          </p>

          {/* Highlights */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            {[
              { emoji: "💬", label: "Anonymous feedback", sub: "No login required for customers" },
              { emoji: "🏪", label: "Any local shop", sub: "Restaurant, café, bar, and more" },
              { emoji: "📊", label: "Owner dashboard", sub: "Trends, categories & history" },
              { emoji: "⚡", label: "Instant delivery", sub: "Feedback lands in real time" },
            ].map((item) => (
              <div key={item.label} className="bg-[#efefef] rounded-[18px] px-4 py-3.5">
                <p className="text-lg mb-1">{item.emoji}</p>
                <p className="text-[#212120] text-xs font-medium leading-tight">{item.label}</p>
                <p className="text-[#adadad] text-[11px] mt-0.5 leading-snug">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 pb-8">
          <Link
            to="/contact"
            onClick={onClose}
            className="flex items-center justify-center w-full bg-[#212120] hover:bg-[#212120]/90 text-white rounded-[22px] py-3.5 text-sm font-medium transition-colors"
          >
            Get in touch
          </Link>
        </div>
      </div>
    </div>
  );
}

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
            <Route path="/contact" element={<ContactForm />} />
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

  return (
    <div className="relative size-full">
      <FeedbackForm />

      {/* Floating nav — bottom-right */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        {/* Contact Us — always visible */}
        <Link
          to="/contact"
          className="flex items-center gap-2 bg-white/80 backdrop-blur-sm text-[#212120] text-sm font-medium rounded-full px-4 py-2.5 shadow-lg hover:bg-white transition-colors border border-[#212120]/10"
        >
          <span>✉️</span>
          <span>Contact Us</span>
        </Link>

        {user ? (
          <>
            {user.role === "shop-admin" && (
              <Link
                to="/shop"
                className="flex items-center gap-2 bg-[#ac7f5e] text-white text-sm font-medium rounded-full px-4 py-2.5 shadow-lg hover:bg-[#9a6f4e] transition-colors"
              >
                <span>🏪</span>
                <span>My Shop</span>
              </Link>
            )}
            {user.role === "super-admin" && (
              <Link
                to="/dashboard"
                className="flex items-center gap-2 bg-[#212120]/75 backdrop-blur-sm text-white text-sm font-medium rounded-full px-4 py-2.5 shadow-lg hover:bg-[#212120] transition-colors"
              >
                <span>📊</span>
                <span>Admin</span>
              </Link>
            )}
            <button
              onClick={logout}
              className="flex items-center gap-2 bg-white/80 backdrop-blur-sm text-[#212120] text-sm font-medium rounded-full px-4 py-2.5 shadow-lg hover:bg-white transition-colors border border-[#212120]/10"
            >
              <span>👋</span>
              <span>Logout</span>
            </button>
          </>
        ) : (
          <Link
            to="/login"
            className="flex items-center gap-2 bg-[#212120]/75 backdrop-blur-sm text-white text-sm font-medium rounded-full px-4 py-2.5 shadow-lg hover:bg-[#212120] transition-colors"
          >
            <span>🏪</span>
            <span>My Shop</span>
          </Link>
        )}

        {/* About Us — always visible, below My Shop */}
        <button
          onClick={() => setShowAbout(true)}
          className="flex items-center gap-2 bg-white/80 backdrop-blur-sm text-[#212120] text-sm font-medium rounded-full px-4 py-2.5 shadow-lg hover:bg-white transition-colors border border-[#212120]/10"
        >
          <span>💡</span>
          <span>About Us</span>
        </button>
      </div>

      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
    </div>
  );
}
