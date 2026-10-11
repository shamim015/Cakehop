"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Download, MessageCircle, Printer } from "lucide-react";
import Logo from "./Logo";
import { SHOP } from "@/lib/shop";
import { loadOrder, paymentName, tk, whatsappUrl, type Order } from "@/lib/order";
import { downloadInvoicePdf } from "@/lib/invoicePdf";

const DOWNLOADED_KEY = "cakeshop-invoice-downloaded"; // id of the order whose invoice was already auto-downloaded

export default function InvoiceView() {
  const [order, setOrder] = useState<Order | null | undefined>(undefined); // undefined = still loading

  const [busy, setBusy] = useState(false);
  const autoStarted = useRef(false);

  useEffect(() => {
    setOrder(loadOrder());
  }, []);

  // Right after an order is placed, download the invoice PDF automatically (only once per order).
  useEffect(() => {
    if (!order || autoStarted.current) return;
    autoStarted.current = true;
    try {
      if (localStorage.getItem(DOWNLOADED_KEY) === order.id) return;
    } catch {}
    downloadInvoicePdf(order)
      .then(() => {
        try {
          localStorage.setItem(DOWNLOADED_KEY, order.id);
        } catch {}
      })
      .catch(() => {}); // if the browser blocks it, the Download button below still works
  }, [order]);

  const download = async () => {
    if (!order || busy) return;
    setBusy(true);
    try {
      await downloadInvoicePdf(order);
    } catch {
      window.print(); // fallback: browser print dialog -> Save as PDF
    } finally {
      setBusy(false);
    }
  };

  if (order === undefined) return <div className="h-40" />;

  if (order === null) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl bg-brand-soft px-6 py-14 text-center">
        <h1 className="font-serif text-2xl font-bold">No recent order found</h1>
        <p className="max-w-sm text-sm text-gray-600">Place an order and your invoice will show up here.</p>
        <Link href="/shop" className="btn-primary !px-8">Browse Cakes</Link>
      </div>
    );
  }

  const date = new Date(order.createdAt).toLocaleString("en-GB", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5 text-center print:hidden">
        <h1 className="section-title">Thank you, {order.customer.name.split(" ")[0]}!</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-gray-600">
          Your order has been placed. Please send the pre-filled message in WhatsApp so we can confirm it.
          Your invoice PDF is downloading automatically. You can download it again below.
        </p>
      </div>

      <div className="mb-5 flex flex-wrap justify-center gap-3 print:hidden">
        <button type="button" onClick={download} disabled={busy} className="btn-primary disabled:cursor-wait disabled:opacity-70">
          <Download className="h-3.5 w-3.5" /> {busy ? "Preparing PDF…" : "Download Invoice (PDF)"}
        </button>
        <button type="button" onClick={() => window.print()} className="btn-outline">
          <Printer className="h-3.5 w-3.5" /> Print
        </button>
        <a href={whatsappUrl(order)} target="_blank" rel="noopener noreferrer" className="btn-outline">
          <MessageCircle className="h-3.5 w-3.5" /> Send order on WhatsApp
        </a>
        <Link href="/shop" className="btn-outline">Continue Shopping</Link>
      </div>

      {/* The invoice */}
      <article className="rounded-xl border border-gray-100 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)] sm:p-8 print:rounded-none print:border-0 print:p-0 print:shadow-none">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 pb-5">
          <div>
            <Logo />
            <p className="mt-2 text-xs text-gray-500">{SHOP.email} · WhatsApp {SHOP.whatsappDisplay}</p>
          </div>
          <div className="text-right">
            <p className="font-serif text-2xl font-bold text-brand">INVOICE</p>
            <p className="mt-1 text-sm font-semibold">{order.id}</p>
            <p className="text-xs text-gray-500">{date}</p>
          </div>
        </header>

        <div className="grid gap-5 py-5 text-sm sm:grid-cols-2">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wide text-gray-500">Billed to</h2>
            <p className="mt-1.5 font-semibold">{order.customer.name}</p>
            <p className="text-gray-600">{order.customer.phone}</p>
            {order.customer.email && <p className="text-gray-600">{order.customer.email}</p>}
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wide text-gray-500">Deliver to</h2>
            <p className="mt-1.5 break-words text-gray-600">{order.customer.address}</p>
            <p className="text-gray-600">{order.customer.city}</p>
            <p className="mt-2 text-xs"><span className="text-gray-500">Payment:</span> <span className="font-semibold">{paymentName(order.payment)}</span></p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-y border-gray-100 bg-brand-soft text-xs uppercase tracking-wide text-gray-600 print:bg-transparent">
                <th className="px-3 py-2 font-bold">Item</th>
                <th className="px-3 py-2 text-center font-bold">Qty</th>
                <th className="hidden px-3 py-2 text-right font-bold sm:table-cell">Price</th>
                <th className="px-3 py-2 text-right font-bold">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {order.items.map((it, idx) => (
                <tr key={idx} className="align-top">
                  <td className="px-3 py-3">
                    <p className="font-semibold">{it.name}</p>
                    {it.details && (
                      <ul className="mt-1 space-y-0.5 text-xs text-gray-500">
                        {it.details.map((d) => <li key={d} className="break-words">{d}</li>)}
                      </ul>
                    )}
                  </td>
                  <td className="px-3 py-3 text-center">{it.qty}</td>
                  <td className="hidden px-3 py-3 text-right sm:table-cell">{tk(it.price)}</td>
                  <td className="px-3 py-3 text-right font-semibold">{tk(it.price * it.qty)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <dl className="ml-auto mt-5 w-full max-w-xs space-y-2 text-sm">
          <div className="flex justify-between"><dt className="text-gray-600">Subtotal</dt><dd className="font-semibold">{tk(order.subtotal)}</dd></div>
          <div className="flex justify-between"><dt className="text-gray-600">Delivery</dt><dd className="font-semibold">{order.delivery === 0 ? "Free" : tk(order.delivery)}</dd></div>
          <div className="flex justify-between border-t border-gray-200 pt-3 text-base font-bold"><dt>Total</dt><dd className="text-brand">{tk(order.total)}</dd></div>
        </dl>

        {order.customer.note && (
          <p className="mt-5 text-xs text-gray-600"><span className="font-bold">Note:</span> {order.customer.note}</p>
        )}

        <footer className="mt-8 border-t border-gray-100 pt-4 text-center text-xs leading-relaxed text-gray-500">
          Status: <span className="font-semibold text-gray-700">Pending confirmation</span>. We will confirm your order on WhatsApp shortly.
          <br />
          Thank you for choosing {SHOP.name}!
        </footer>
      </article>
    </div>
  );
}
