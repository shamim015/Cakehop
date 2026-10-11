"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Search, SearchX, Star, X } from "lucide-react";
import { highlightParts, searchProducts } from "@/lib/search";
import { tk } from "@/lib/order";

const resultsHref = (q: string) => `/shop?q=${encodeURIComponent(q.trim())}`;

// Search panel opened by the magnifier icon in the navbar: shows matching cakes while you type.
export default function SearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(-1); // arrow-key selection
  const inputRef = useRef<HTMLInputElement>(null);

  const q = query.trim();
  const items = useMemo(() => (q ? searchProducts(q) : searchProducts("")).slice(0, 5), [q]);

  useEffect(() => setActive(-1), [q]);

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => inputRef.current?.focus(), 50); // after the slide-in starts
    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      opener?.focus?.();
      setQuery(""); // fresh box next time
    };
  }, [open, onClose]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (active >= 0 && items[active]) router.push(resultsHref(items[active].name));
    else if (q) router.push(resultsHref(q));
    else router.push("/shop");
    onClose();
  };

  const onInputKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, -1));
    }
  };

  return (
    <div className={`fixed inset-0 z-[85] transition-all duration-300 ${open ? "visible" : "invisible"}`}>
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`absolute inset-0 bg-brand-ink/50 backdrop-blur-[2px] transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search cakes"
        className={`absolute inset-x-0 top-0 mx-auto flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden bg-white shadow-2xl transition-all duration-300 ease-out sm:top-[9vh] sm:rounded-2xl ${open ? "translate-y-0 opacity-100" : "-translate-y-6 opacity-0"}`}
      >
        <form role="search" onSubmit={submit} className="flex items-center gap-3 border-b border-gray-100 px-4 py-3 sm:px-5">
          <Search className="h-5 w-5 shrink-0 text-brand" aria-hidden="true" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKey}
            placeholder="Search cakes… e.g. chocolate, red velvet"
            aria-label="Search cakes"
            role="combobox"
            aria-expanded="true"
            aria-controls="search-results"
            aria-activedescendant={active >= 0 ? `search-opt-${active}` : undefined}
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent py-1.5 text-[15px] outline-none placeholder:text-gray-400 [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button type="button" onClick={() => { setQuery(""); inputRef.current?.focus(); }} aria-label="Clear search" className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700">
              <X className="h-4 w-4" />
            </button>
          )}
          <button type="button" onClick={onClose} aria-label="Close search" className="hidden rounded border border-gray-200 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500 hover:border-brand hover:text-brand sm:block">Esc</button>
          <button type="button" onClick={onClose} aria-label="Close search" className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 sm:hidden">
            <X className="h-5 w-5" />
          </button>
        </form>

        <div className="overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-10 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-soft text-brand"><SearchX className="h-6 w-6" /></span>
              <p className="mt-4 text-[15px] font-bold">No cakes found for “{q}”</p>
              <p className="mt-1 text-[13px] text-gray-500">Check the spelling or try a different word.</p>
              <Link href="/shop" onClick={onClose} className="btn-primary btn-shine mt-5">Browse All Cakes</Link>
            </div>
          ) : (
            <>
              <p className="px-5 pb-1 pt-4 text-[11px] font-bold uppercase tracking-wide text-gray-500">
                {q ? `${items.length} ${items.length === 1 ? "match" : "matches"}` : "Popular cakes"}
              </p>
              <ul id="search-results" role="listbox" aria-label="Search results" className="px-2 pb-2">
                {items.map((p, i) => (
                  <li key={p.id} id={`search-opt-${i}`} role="option" aria-selected={i === active}>
                    <Link
                      href={resultsHref(p.name)}
                      onClick={onClose}
                      onMouseEnter={() => setActive(i)}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition ${i === active ? "bg-brand-soft" : "hover:bg-brand-soft/60"}`}
                    >
                      <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-brand-soft">
                        <Image src={p.image} alt="" fill sizes="56px" className="object-contain p-0.5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14px] font-semibold">
                          {highlightParts(p.name, q).map((part, k) =>
                            part.match ? <mark key={k} className="rounded-sm bg-brand/20 px-0.5 text-brand-ink">{part.text}</mark> : <span key={k}>{part.text}</span>
                          )}
                        </span>
                        <span className="mt-0.5 flex items-center gap-1 text-[11px] text-gray-500">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          {p.rating} ({p.reviews})
                        </span>
                      </span>
                      <span className="text-[14px] font-bold">{tk(p.price)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              {q && (
                <Link href={resultsHref(q)} onClick={onClose} className="flex items-center justify-between border-t border-gray-100 px-5 py-3.5 text-[13px] font-semibold text-brand transition hover:bg-brand-soft/60">
                  <span>See all results for “{q}”</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
