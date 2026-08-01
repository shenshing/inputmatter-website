export type ShopCategory = 'cafe' | 'restaurant';

export const SHOP_CATEGORIES: ShopCategory[] = ['cafe', 'restaurant'];

export const CATEGORY_LABELS: Record<ShopCategory, string> = {
  cafe: 'Cafe',
  restaurant: 'Restaurant',
};
