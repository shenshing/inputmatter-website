import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import SiteNav from "../components/SiteNav";
import SiteFooter from "../components/SiteFooter";

export default function Register() {
  const { register, user } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (user) {
    navigate("/", { replace: true });
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      await register(email, password);
      navigate("/", { replace: true });
    } catch (err: any) {
      setError(err.message ?? "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col bg-[#fdf8f2]"
      style={{ fontFamily: "'Hanken Grotesk', system-ui, sans-serif" }}
    >
      <SiteNav howItWorksHref="/welcome#how-it-works" />

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm space-y-6">
          {/* Header */}
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-semibold text-[#212120]">Create account</h1>
            <p className="text-sm text-[#696b63]">
              Register as a shop owner to manage your feedback
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
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
                className="bg-white border-[#f1e7d9]"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-white border-[#f1e7d9]"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirm">Confirm password</Label>
              <Input
                id="confirm"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                className="bg-white border-[#f1e7d9]"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#ac7f5e] hover:bg-[#9a6f4e] text-white"
            >
              {loading ? "Creating account…" : "Create account"}
            </Button>
          </form>

          {/* Footer links */}
          <p className="text-center text-sm text-[#696b63]">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium text-[#ac7f5e] hover:underline"
            >
              Sign in
            </Link>
          </p>
          <p className="text-center text-sm text-[#696b63]">
            <Link to="/" className="hover:underline">
              ← Back to feedback
            </Link>
          </p>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
