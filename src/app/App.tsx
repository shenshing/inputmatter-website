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
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

function PublicHome() {
  const { user, logout } = useAuth();

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
      </div>
    </div>
  );
}
