"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, Search, X } from "lucide-react";
import Logo from "./Logo";

export interface MobileNavItem {
  label: string;
  href: string;
  menu?: { label: string; href: string }[];
}

// Slide-in sidebar for phones/tablets (opened by the 3-line button in the navbar).
export default function MobileMenu({
  open,
  onClose,
  items,
  isActive,
}: {
  open: boolean;
  onClose: () => void;
  items: MobileNavItem[];
  isActive: (href: string) => boolean;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [term, setTerm] = useState("");
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const desktop = window.matchMedia("(min-width: 768px)");
    const onResize = () => desktop.matches && onClose();
    document.addEventListener("keydown", onKey);
    desktop.addEventListener("change", onResize);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden"; // page behind does not scroll
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      desktop.removeEventListener("change", onResize);
      document.body.style.overflow = prev;
      opener?.focus?.(); // give focus back to the 3-line button
    };
  }, [open, onClose]);

  const search = (e: React.FormEvent) => {
    e.preventDefault();
    const t = term.trim();
    if (!t) return;
    router.push(`/shop?q=${encodeURIComponent(t)}`);
    setTerm("");
    onClose();
  };

  return (
    <div className={`fixed inset-0 z-[80] transition-all duration-300 md:hidden ${open ? "visible" : "invisible"}`}>
      {/* dark overlay */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`absolute inset-0 bg-brand-ink/50 backdrop-blur-[2px] transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
      />

      {/* sidebar */}
      <aside
        id="mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("a")) onClose(); // any link closes the sidebar
        }}
        className={`absolute left-0 top-0 flex h-full w-[85%] max-w-[320px] flex-col bg-white shadow-2xl transition-transform duration-300 ease-out ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
          <Logo small />
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close menu" className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-800">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form role="search" onSubmit={search} className="flex gap-2 border-b border-gray-100 px-5 py-3">
          <input
            type="search"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search cakes…"
            aria-label="Search cakes"
            className="min-w-0 flex-1 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-[13px] outline-none transition placeholder:text-gray-400 focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20"
          />
          <button type="submit" aria-label="Search" className="flex h-9 w-10 shrink-0 items-center justify-center rounded-md bg-brand text-white transition hover:bg-brand-dark">
            <Search className="h-4 w-4" />
          </button>
        </form>

        <nav aria-label="Mobile" className="flex-1 overflow-y-auto py-2">
          <ul>
            {items.map((n, i) => {
              const isOpen = expanded === n.label;
              const active = isActive(n.href);
              return (
                <li key={n.label} className="menu-item border-b border-gray-100" style={{ animationDelay: open ? `${80 + i * 45}ms` : "0ms" }}>
                  <div className="flex items-stretch">
                    <Link
                      href={n.href}
                      className={`relative flex flex-1 items-center px-5 py-3.5 text-[15px] font-semibold transition hover:text-brand ${active ? "bg-brand-soft text-brand" : ""}`}
                    >
                      {active && <span className="absolute inset-y-0 left-0 w-1 bg-brand" aria-hidden="true" />}
                      {n.label}
                    </Link>
                    {n.menu && (
                      <button
                        type="button"
                        onClick={() => setExpanded(isOpen ? null : n.label)}
                        aria-expanded={isOpen}
                        aria-label={`${isOpen ? "Hide" : "Show"} ${n.label} menu`}
                        className={`flex w-14 items-center justify-center text-gray-500 transition hover:text-brand ${active ? "bg-brand-soft" : ""}`}
                      >
                        <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${isOpen ? "rotate-180 text-brand" : ""}`} />
                      </button>
                    )}
                  </div>
                  {n.menu && (
                    <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                      <ul className={`overflow-hidden bg-brand-soft/60 ${isOpen ? "" : "invisible"}`}>
                        {n.menu.map((m) => (
                          <li key={m.label}>
                            <Link href={m.href} className="block py-2.5 pl-9 pr-5 text-[14px] text-gray-700 transition hover:text-brand">
                              {m.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </div>
  );
}
