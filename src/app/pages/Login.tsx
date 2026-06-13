import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../lib/api";
import { PLANS, PLAN_ORDER, type PlanId } from "../lib/plans";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  const [shopName, setShopName] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<PlanId>("free");
  const [shopLoading, setShopLoading] = useState(false);
  const [shopError, setShopError] = useState<string | null>(null);
  const [shopSuccess, setShopSuccess] = useState(false);
  const [showDuplicatePopup, setShowDuplicatePopup] = useState(false);
  const [checkingShop, setCheckingShop] = useState(false);

  useEffect(() => {
    if (!user) return;

    if (user.role === "super-admin") {
      navigate("/dashboard", { replace: true });
      return;
    }

    if (user.role === "shop-admin") {
      setCheckingShop(true);
      apiFetch<{ id: number; name: string } | null>("/shops/mine")
        .then((shop) => {
          if (shop) navigate("/shop", { replace: true });
          // No shop → stay, show registration form
        })
        .catch(() => {/* stay, show registration form */})
        .finally(() => setCheckingShop(false));
    }
  }, [user, navigate]);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setLoginError(err.message ?? "Login failed");
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleRegisterShop(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!shopName.trim()) return;
    setShopError(null);
    setShopLoading(true);
    try {
      await apiFetch("/shops", {
        method: "POST",
        body: JSON.stringify({ name: shopName.trim(), plan: selectedPlan }),
      });
      setShopSuccess(true);
      setShopName("");
    } catch (err: any) {
      const msg: string = err.message ?? "";
      if (msg.toLowerCase().includes("already exists")) {
        setShowDuplicatePopup(true);
      } else {
        setShopError(msg || "Failed to register shop.");
      }
    } finally {
      setShopLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#faf9f6] px-4 py-12">
      <div className="w-full max-w-sm space-y-6">

        {/* ── Login section (hidden once logged in) ── */}
        {!user && (
          <>
            <div className="text-center space-y-1">
              <h1 className="text-2xl font-semibold text-[#212120]">Welcome back</h1>
              <p className="text-sm text-[#212120]/60">Sign in to your account</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {loginError && (
                <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">
                  {loginError}
                </p>
              )}

              <Button
                type="submit"
                disabled={loginLoading}
                className="w-full bg-[#212120] hover:bg-[#212120]/90 text-white"
              >
                {loginLoading ? "Signing in…" : "Sign in"}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-[#212120]/10" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-[#faf9f6] px-2 text-[#212120]/40">or</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full gap-2"
              onClick={() => { window.location.href = `${API_URL}/auth/google`; }}
            >
              <GoogleIcon />
              Continue with Google
            </Button>

            <p className="text-center text-sm text-[#212120]/60">
              Don't have an account?{" "}
              <Link to="/register" className="font-medium text-[#ac7f5e] hover:underline">
                Register
              </Link>
            </p>
          </>
        )}

        {/* ── Register shop section ── */}
        <div className={`space-y-4 ${!user ? "border-t border-[#212120]/10 pt-6" : ""}`}>
          <div className="text-center space-y-1">
            <h2 className="text-xl font-semibold text-[#212120]">Register Your Shop</h2>
            <p className="text-sm text-[#212120]/60">
              Claim your shop to manage and view your feedback.
            </p>
          </div>

          {checkingShop ? (
            <p className="text-center text-sm text-[#212120]/50 animate-pulse py-4">
              Checking your account…
            </p>
          ) : !user ? (
            <p className="text-center text-sm text-[#212120]/50 bg-[#f0eeea] rounded-md px-3 py-3">
              Sign in above to register your shop.
            </p>
          ) : shopSuccess ? (
            <div className="bg-[#e8f5e9] border border-[#a5d6a7] rounded-md px-4 py-3 text-[#2e7d32] text-sm text-center">
              Your shop has been registered!{" "}
              <button onClick={() => navigate("/shop")} className="font-medium underline">
                Go to My Shop
              </button>
            </div>
          ) : (
            <form onSubmit={handleRegisterShop} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="shopName">Shop name</Label>
                <Input
                  id="shopName"
                  type="text"
                  placeholder="e.g. Tube Coffee (BKK)"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  required
                  minLength={2}
                  maxLength={100}
                />
              </div>

              {/* Plan selector */}
              <div className="space-y-2">
                <Label>Choose a plan</Label>
                <div className="grid grid-cols-2 gap-2">
                  {PLAN_ORDER.map((planId) => {
                    const p = PLANS[planId];
                    const active = selectedPlan === planId;
                    return (
                      <button
                        key={planId}
                        type="button"
                        onClick={() => setSelectedPlan(planId)}
                        className={`text-left rounded-xl px-3 py-3 border-2 transition-all ${
                          active
                            ? "border-[#ac7f5e] bg-[#fef7f2]"
                            : "border-[#e8e8e4] bg-white hover:border-[#d0ccc8]"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-0.5">
                          <span className={`text-sm font-semibold ${active ? "text-[#ac7f5e]" : "text-[#212120]"}`}>
                            {p.label}
                          </span>
                          {active && (
                            <span className="w-4 h-4 rounded-full bg-[#ac7f5e] flex items-center justify-center">
                              <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 8">
                                <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#696b63]">{p.limitLabel} feedbacks</p>
                        <p className={`text-xs font-medium mt-0.5 ${active ? "text-[#ac7f5e]" : "text-[#212120]/60"}`}>
                          {p.price === 0 ? "Free" : `$${p.price}/mo`}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {shopError && (
                <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">
                  {shopError}
                </p>
              )}

              <Button
                type="submit"
                disabled={shopLoading}
                className="w-full bg-[#ac7f5e] hover:bg-[#9a6f4e] text-white"
              >
                {shopLoading ? "Registering…" : "Register Shop"}
              </Button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-[#212120]/60">
          <Link to="/" className="hover:underline">← Back to feedback</Link>
        </p>
      </div>

      {/* ── Duplicate-name popup ── */}
      {showDuplicatePopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl px-8 py-7 max-w-xs w-full mx-4 text-center space-y-4">
            <div className="text-3xl">⚠️</div>
            <p className="text-[#212120] font-semibold text-lg leading-snug">
              A shop with a similar name already exists.
            </p>
            <p className="text-sm text-[#212120]/60">Please try a different shop name.</p>
            <Button
              onClick={() => setShowDuplicatePopup(false)}
              className="w-full bg-[#212120] hover:bg-[#212120]/90 text-white"
            >
              OK
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}
