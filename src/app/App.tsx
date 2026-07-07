import { useState } from "react";
import { Analytics } from "@vercel/analytics/react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { BrowserRouter, Routes, Route, Link } from "react-router";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { useTelegram } from "./hooks/useTelegram";
import FeedbackForm from "./components/FeedbackForm";
import SiteNav from "./components/SiteNav";
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
    <div className="relative size-full">
      {/* Hidden inside Telegram Mini App — limited real estate, no need to duplicate site chrome */}
      {!isTelegram && <SiteNav howItWorksHref="/welcome#how-it-works" />}
      <FeedbackForm />

      {/* Floating nav — hidden inside Telegram Mini App */}
      {!isTelegram && <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        {/* Welcome — always visible */}
        <Link
          to="/welcome"
          className="flex items-center gap-2 bg-white/80 backdrop-blur-sm text-[#212120] text-sm font-medium rounded-full px-4 py-2.5 shadow-lg hover:bg-white transition-colors border border-[#212120]/10"
        >
          <span>✨</span>
          <span>Welcome</span>
        </Link>

        {/* Contact Us — always visible */}
        <button
          onClick={() => setShowContact(true)}
          className="flex items-center gap-2 bg-white/80 backdrop-blur-sm text-[#212120] text-sm font-medium rounded-full px-4 py-2.5 shadow-lg hover:bg-white transition-colors border border-[#212120]/10"
        >
          <span>✉️</span>
          <span>Contact Us</span>
        </button>

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
