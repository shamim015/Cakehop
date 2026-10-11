import type { Product } from "@/types";
// "categories" decides which category page a cake shows up in (/shop?c=birthday).
// Allowed ids: birthday, wedding, anniversary, photo, cupcakes. >>> Change these to match your real cakes <<<
export const products: Product[] = [
  {
    id: "chocolate-delight",
    name: "Chocolate Delight",
    price: 2499,
    rating: 4.5,
    reviews: 120,
    image: "/images/chocolate-delight.webp",
    categories: ["birthday", "anniversary", "photo"],
  },
  {
    id: "red-velvet",
    name: "Red Velvet Cake",
    price: 2699,
    rating: 4.5,
    reviews: 98,
    image: "/images/red-velvet.webp",
    categories: ["birthday", "wedding", "anniversary"],
  },
  {
    id: "black-forest",
    name: "Black Forest Cake",
    price: 2399,
    rating: 4.5,
    reviews: 110,
    image: "/images/black-forest.webp",
    categories: ["birthday", "anniversary"],
  },
  {
    id: "mango-cake",
    name: "Mango Cake",
    price: 2299,
    rating: 4.5,
    reviews: 85,
    image: "/images/mango-cake.webp",
    categories: ["birthday", "photo"],
  },
];
