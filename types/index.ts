export interface Product { id: string; name: string; price: number; rating: number; reviews: number; image: string;
  /** category ids from data/categories.ts, e.g. ["birthday", "wedding"] (used by /shop?c=...) */
  categories?: string[];
}
export interface Category { id: string; name: string; image: string; href: string; }
