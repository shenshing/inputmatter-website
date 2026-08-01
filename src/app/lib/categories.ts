export type ShopCategory = 'cafe' | 'restaurant';

export const SHOP_CATEGORIES: ShopCategory[] = ['cafe', 'restaurant'];

export const CATEGORY_LABELS: Record<ShopCategory, string> = {
  cafe: 'Cafe',
  restaurant: 'Restaurant',
};

export const CATEGORY_COLORS: Record<ShopCategory, string> = {
  cafe: '#ac7f5e',
  restaurant: '#6b8fb0',
};
