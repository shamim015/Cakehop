import type { Product } from "@/types";
import { products } from "@/data/products";

/** lower-case, no accents, single spaces */
const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();

export const searchWords = (query: string) => norm(query).split(" ").filter(Boolean);

/**
 * Finds products for a search text. Every word you type must match the product name
 * (or its price, when you type 3+ digits like "2499"). Every product here is a cake,
 * so "cake" / "cakes" matches all.
 * An empty search returns every product.
 */
export function searchProducts(query: string, list: Product[] = products): Product[] {
  const words = searchWords(query);
  if (words.length === 0) return list;
  return list.filter((p) => {
    const hay = norm(`${p.name} ${p.id.replace(/-/g, " ")} cake`);
    return words.every(
      (w) =>
        hay.includes(w) ||
        (w.length > 3 && w.endsWith("s") && hay.includes(w.slice(0, -1))) || // "cakes" -> "cake"
        (/^\d{3,}$/.test(w) && String(p.price).includes(w))
    );
  });
}

/** Splits text into pieces so the parts matching the search can be highlighted. */
export function highlightParts(text: string, query: string): { text: string; match: boolean }[] {
  const words = searchWords(query).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  if (words.length === 0) return [{ text, match: false }];
  const re = new RegExp(`(${words.join("|")})`, "gi");
  // split() with a capture group puts the matches at the odd positions
  return text
    .split(re)
    .map((t, i) => ({ text: t, match: i % 2 === 1 }))
    .filter((part) => part.text !== "");
}

/** Search text (q) and/or category id (c) together, e.g. {q: "choco", c: "birthday"}. */
export function filterProducts({ q = "", c = "" }: { q?: string; c?: string }): Product[] {
  const inCategory = c ? products.filter((p) => p.categories?.includes(c)) : products;
  return searchProducts(q, inCategory);
}
