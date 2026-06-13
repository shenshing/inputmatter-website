import { useState } from "react";
import { Link } from "react-router";
import { apiFetch } from "../lib/api";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

const CATEGORIES = [
  { value: "feedback",        label: "Feedback" },
  { value: "feature-request", label: "Feature Request" },
  { value: "free-trial",      label: "Free Trial Request" },
  { value: "book-demo",       label: "Book a Demo" },
  { value: "other",           label: "Other" },
] as const;

interface FormState {
  category: string;
  description: string;
  shopName: string;
  name: string;
  contactInfo: string;
}

const EMPTY: FormState = {
  category: "",
  description: "",
  shopName: "",
  name: "",
  contactInfo: "",
};

export default function ContactForm() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function set(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiFetch("/contact", {
        method: "POST",
        body: JSON.stringify({
          category: form.category,
          description: form.description.trim(),
          shopName: form.shopName.trim() || undefined,
          name: form.name.trim(),
          contactInfo: form.contactInfo.trim(),
        }),
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#fbfcf7] flex flex-col">

      {/* Top bar */}
      <div className="px-6 md:px-10 py-5 flex items-center border-b border-[#e8e8e4]">
        <Link
          to="/"
          className="flex items-center gap-1.5 text-[#696b63] hover:text-[#212120] transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
      </div>

      <div className="flex-1 flex items-start justify-center px-4 py-12 md:py-16">
        <div className="w-full max-w-lg">

          {success ? (
            /* ── Success state ── */
            <div className="text-center space-y-6 py-8">
              <div className="w-16 h-16 bg-[#e8f5e9] rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-[#2e7d32]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold text-[#212120]">Message sent!</h2>
                <p className="text-[#696b63] text-sm leading-relaxed max-w-sm mx-auto">
                  Thanks for reaching out. We've received your message and will get back to you as soon as possible.
                </p>
              </div>
              <Link to="/">
                <Button className="bg-[#212120] hover:bg-[#212120]/90 text-white px-8">
                  Back to home
                </Button>
              </Link>
            </div>
          ) : (
            /* ── Form ── */
            <>
              {/* Header */}
              <div className="flex items-center gap-3 mb-8">
                <div className="w-11 h-11 bg-[#fef7f2] rounded-[14px] flex items-center justify-center shrink-0">
                  <MessageSquare className="w-5 h-5 text-[#ac7f5e]" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-[#212120] leading-tight">Contact us</h1>
                  <p className="text-sm text-[#696b63] mt-0.5">
                    Feature requests, demo bookings, or just say hi — we'd love to hear from you.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">

                {/* Category */}
                <div className="space-y-1.5">
                  <Label htmlFor="category">Category</Label>
                  <div className="relative">
                    <select
                      id="category"
                      value={form.category}
                      onChange={(e) => set("category", e.target.value)}
                      required
                      className="w-full bg-[#efefef] border-none rounded-xl px-4 py-3 text-[#212120] text-sm appearance-none outline-none cursor-pointer pr-9"
                    >
                      <option value="" disabled>Select a category…</option>
                      {CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#adadad] text-xs">▾</span>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <Label htmlFor="description">Message</Label>
                  <textarea
                    id="description"
                    value={form.description}
                    onChange={(e) => set("description", e.target.value)}
                    placeholder="Tell us what's on your mind…"
                    required
                    maxLength={2000}
                    rows={5}
                    className="w-full bg-[#efefef] border-none rounded-xl px-4 py-3 text-[#212120] placeholder:text-[#adadad] text-sm resize-none outline-none"
                  />
                  <p className="text-right text-[#adadad] text-xs">{form.description.length}/2000</p>
                </div>

                {/* Name + Contact info — side by side on md+ */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Your name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Jane Smith"
                      value={form.name}
                      onChange={(e) => set("name", e.target.value)}
                      required
                      maxLength={100}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="contactInfo">Phone or email</Label>
                    <Input
                      id="contactInfo"
                      type="text"
                      placeholder="jane@example.com"
                      value={form.contactInfo}
                      onChange={(e) => set("contactInfo", e.target.value)}
                      required
                      maxLength={200}
                    />
                  </div>
                </div>

                {/* Shop name — optional */}
                <div className="space-y-1.5">
                  <Label htmlFor="shopName">
                    Shop name{" "}
                    <span className="text-[#adadad] font-normal">(optional)</span>
                  </Label>
                  <Input
                    id="shopName"
                    type="text"
                    placeholder="e.g. Tube Coffee (BKK)"
                    value={form.shopName}
                    onChange={(e) => set("shopName", e.target.value)}
                    maxLength={100}
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
                  className="w-full bg-[#ac7f5e] hover:bg-[#9a6f4e] text-white py-3 text-sm font-semibold"
                >
                  {loading ? "Sending…" : "Send message"}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
