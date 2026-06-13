import { Link } from "react-router";

export default function Unauthorized() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#faf9f6] px-4">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-semibold text-[#212120]">Access denied</h1>
        <p className="text-sm text-[#212120]/60">
          You don't have permission to view this page.
        </p>
        <Link
          to="/"
          className="inline-block text-sm font-medium text-[#ac7f5e] hover:underline"
        >
          ← Back to home
        </Link>
      </div>
    </div>
  );
}
