"use client";
import { useCallback, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, User, Heart, ShoppingCart, Menu, ChevronDown, Truck, Phone, Mail, Facebook, Instagram, MessageCircle } from "lucide-react";
import Logo from "./Logo";
import MobileMenu from "./MobileMenu";
import SearchModal from "./SearchModal";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";

const cakeMenu = [
  { label: "Birthday Cakes", href: "/shop?c=birthday" },
  { label: "Wedding Cakes", href: "/shop?c=wedding" },
  { label: "Anniversary Cakes", href: "/shop?c=anniversary" },
  { label: "Photo Cakes", href: "/shop?c=photo" },
  { label: "Cupcakes", href: "/shop?c=cupcakes" },
];
const occasionMenu = [
  { label: "Birthday", href: "/occasions#birthday" },
  { label: "Wedding", href: "/occasions#wedding" },
  { label: "Anniversary", href: "/occasions#anniversary" },
];

const nav: { label: string; href: string; dropdown: boolean; menu?: { label: string; href: string }[] }[] = [
  { label: "Home", href: "/", dropdown: false },
  { label: "Shop", href: "/shop", dropdown: false },
  { label: "Cakes", href: "/cakes", dropdown: true, menu: cakeMenu },
  { label: "Occasions", href: "/occasions", dropdown: true, menu: occasionMenu },
  { label: "About Us", href: "/about", dropdown: false },
  { label: "Contact", href: "/contact", dropdown: false },
];

// Edit the offer text here. `short` is shown on phones, `full` from tablet size up.
const offer = {
  short: "Free delivery above Tk 3,000",
  full: "Free delivery on orders above Tk 3,000 · Use code CAKE10 for 10% OFF",
};

export default function Header() {
  const [open, setOpen] = useState(false);
  const closeMenu = useCallback(() => setOpen(false), []);
  const [searchOpen, setSearchOpen] = useState(false);
  const closeSearch = useCallback(() => setSearchOpen(false), []);
  const { count } = useCart();
  const { count: favCount, openDrawer } = useWishlist();
  const pathname = usePathname() || "/";
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  // The pink offer bar is a normal block (scrolls away). Only the navbar below it is sticky.
  return (
    <>
      {/* Offer bar: scrolls away with the page */}
      <div className="bg-[#FDB5CE] text-[11px] text-white">
        <div className="container-wide flex h-9 items-center justify-center sm:justify-between">
          <p className="flex min-w-0 items-center gap-1.5 font-medium">
            <Truck className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate sm:hidden">{offer.short}</span>
            <span className="hidden truncate sm:inline">{offer.full}</span>
          </p>
          <div className="hidden items-center gap-4 lg:flex">
            <a href="tel:+923001234567" className="flex items-center gap-1"><Phone className="h-3 w-3" />+92 300 1234567</a>
            <a href="mailto:info@cakeshop.com" className="flex items-center gap-1"><Mail className="h-3 w-3" />info@cakeshop.com</a>
            <Facebook className="h-3 w-3" aria-label="Facebook" /><Instagram className="h-3 w-3" aria-label="Instagram" /><MessageCircle className="h-3 w-3" aria-label="WhatsApp" />
          </div>
        </div>
      </div>
      {/* Main navbar: stays pinned to the top while scrolling */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white shadow-sm">
        <div className="container-wide flex h-16 items-center md:h-[72px] justify-between">
          <Logo />
          <nav aria-label="Main" className="hidden items-center gap-9 text-[14px] md:flex">
            {nav.map((n) => (
              <div key={n.label} className="group relative">
                <Link href={n.href} className={`flex items-center gap-1 py-2 transition hover:text-brand ${isActive(n.href) ? "text-brand" : ""}`}>
                  {n.label}{n.dropdown && <ChevronDown className="h-3 w-3 transition group-hover:rotate-180" />}
                </Link>
                {n.menu && (
                  <div className="invisible absolute left-0 top-full z-50 pt-2 opacity-0 transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                    <ul className="min-w-[190px] rounded-lg border border-gray-100 bg-white py-2 shadow-lg">
                      {n.menu.map((m) => (
                        <li key={m.label}>
                          <Link href={m.href} className="block px-4 py-2 text-[13px] hover:bg-brand-soft hover:text-brand">{m.label}</Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </nav>
          <div className="flex items-center gap-3 sm:gap-4 md:gap-7">
            <button type="button" aria-label="Search" aria-haspopup="dialog" onClick={() => setSearchOpen(true)} className="hover:text-brand"><Search className="h-5 w-5" /></button>
            <button aria-label="Account" className="hidden hover:text-brand sm:block"><User className="h-5 w-5" /></button>
            <button type="button" onClick={openDrawer} aria-label={`Favorites (${favCount})`} aria-haspopup="dialog" className="relative hover:text-brand">
              <Heart className={`h-5 w-5 ${favCount > 0 ? "fill-brand text-brand" : ""}`} />
              {favCount > 0 && (
                <span key={favCount} className="badge-bump absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-brand text-[9px] font-bold text-white">{favCount}</span>
              )}
            </button>
            <Link href="/cart" aria-label="Cart" className="relative hover:text-brand">
              <ShoppingCart className="h-5 w-5" />
              <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-brand text-[9px] font-bold text-white">{count}</span>
            </Link>
            <button type="button" aria-label="Open menu" aria-haspopup="dialog" aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen(true)} className="md:hidden">
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>
      {/* Slide-in sidebar for phones (3-line button) */}
      <MobileMenu open={open} onClose={closeMenu} items={nav} isActive={isActive} />
      <SearchModal open={searchOpen} onClose={closeSearch} />
    </>
  );
}
