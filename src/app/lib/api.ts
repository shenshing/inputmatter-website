const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export interface AppVisitorStats {
  total: number;
  chartData: { bucket: string; count: number }[];
  granularity: 'hour' | 'day';
  recentVisitors: { id: string; type: string; createdAt: string }[];
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function getAppVisitorStats(type?: string, period?: string): Promise<AppVisitorStats> {
  const params = new URLSearchParams();
  if (type) params.set('type', type);
  if (period) params.set('period', period);
  const q = params.toString() ? `?${params.toString()}` : '';
  return apiFetch<AppVisitorStats>(`/app-visitors/stats${q}`);
}
