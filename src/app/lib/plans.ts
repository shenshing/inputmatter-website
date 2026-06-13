export type PlanId = 'free' | 'basic' | 'standard' | 'plus';

export interface PlanMeta {
  label: string;
  limit: number;
  limitLabel: string;
  price: number;
}

export const PLANS: Record<PlanId, PlanMeta> = {
  free:     { label: 'Free',     limit: 1_000,  limitLabel: '1k',  price: 0 },
  basic:    { label: 'Basic',    limit: 5_000,  limitLabel: '5k',  price: 5 },
  standard: { label: 'Standard', limit: 10_000, limitLabel: '10k', price: 7 },
  plus:     { label: 'Plus',     limit: 50_000, limitLabel: '50k', price: 9 },
};

export const PLAN_ORDER: PlanId[] = ['free', 'basic', 'standard', 'plus'];

export function comparePlans(a: PlanId, b: PlanId): number {
  return PLAN_ORDER.indexOf(a) - PLAN_ORDER.indexOf(b);
}
