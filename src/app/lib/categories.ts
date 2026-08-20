export type ShopCategory =
  | 'cafe'
  | 'restaurant'
  | 'hotpot'
  | 'korean'
  | 'chinese'
  | 'japanese'
  | 'khmer'
  | 'seafood'
  | 'bbq'
  | 'steakhouse'
  | 'fine_dining'
  | 'fast_food';

export const SHOP_CATEGORIES: ShopCategory[] = [
  'cafe',
  'restaurant',
  'hotpot',
  'korean',
  'chinese',
  'japanese',
  'khmer',
  'seafood',
  'bbq',
  'steakhouse',
  'fine_dining',
  'fast_food',
];

export const CATEGORY_LABELS: Record<ShopCategory, string> = {
  cafe: 'Cafe',
  restaurant: 'Restaurant',
  hotpot: 'Hotpot',
  korean: 'Korean',
  chinese: 'Chinese',
  japanese: 'Japanese',
  khmer: 'Khmer',
  seafood: 'Seafood',
  bbq: 'BBQ',
  steakhouse: 'Steakhouse',
  fine_dining: 'Fine Dining',
  fast_food: 'Fast Food',
};

export const CATEGORY_COLORS: Record<ShopCategory, string> = {
  cafe: '#ac7f5e',
  restaurant: '#6b8fb0',
  hotpot: '#d16a3f',
  korean: '#c76b8a',
  chinese: '#c94f4f',
  japanese: '#8a92c9',
  khmer: '#d4a13a',
  seafood: '#4f9aa8',
  bbq: '#96552f',
  steakhouse: '#6b3a3a',
  fine_dining: '#6b5b95',
  fast_food: '#e08a3d',
};
