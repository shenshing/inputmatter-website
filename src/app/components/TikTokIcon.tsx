// lucide-react ships no TikTok mark — this fills that gap so the icon can
// be reused anywhere the app needs to represent a shop's TikTok link.
export default function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M16.6 5.82a4.28 4.28 0 0 1-3.14-1.39 4.24 4.24 0 0 1-1.11-2.72h-3.14v13.63a2.6 2.6 0 0 1-4.68 1.57 2.59 2.59 0 0 1 2.62-4.19v-3.19a5.79 5.79 0 0 0-4.9 6.16 5.8 5.8 0 0 0 10.87 2.68 5.7 5.7 0 0 0 .78-2.86v-6.9a7.32 7.32 0 0 0 4.28 1.36v-3.14a4.24 4.24 0 0 1-1.58-.99z" />
    </svg>
  );
}
