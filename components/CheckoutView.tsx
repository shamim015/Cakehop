"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { SHOP } from "@/lib/shop";
import { PAYMENTS, calcDelivery, newOrderId, saveOrder, tk, whatsappUrl, type Order, type PaymentId } from "@/lib/order";

type Field = "name" | "phone" | "address" | "city";
type Errors = Partial<Record<Field, string>>;

const card = "rounded-xl border border-gray-100 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)]";
const input =
  "mt-1.5 w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/20";
const label = "block text-sm font-semibold";

function Err({ id, msg }: { id: string; msg?: string }) {
  return msg ? <p id={id} role="alert" className="mt-1 text-xs text-red-500">{msg}</p> : null;
}

export default function CheckoutView() {
  const { items, total: subtotal, loaded, clearCart } = useCart();
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [note, setNote] = useState("");
  const [payment, setPayment] = useState<PaymentId>("cod");
  const [errors, setErrors] = useState<Errors>({});
  const [placed, setPlaced] = useState(false);

  if (!loaded) return <div className="h-40" />;

  if (placed) {
    return <p className="py-16 text-center text-sm text-gray-600">Preparing your invoice…</p>;
  }

  if (items.length === 0) {
    return (
      <div className="mt-2 flex flex-col items-center gap-4 rounded-xl bg-brand-soft px-6 py-14 text-center">
        <h2 className="font-serif text-2xl font-bold">Your cart is empty</h2>
        <p className="max-w-sm text-sm text-gray-600">Add some cakes to your cart before checking out.</p>
        <Link href="/shop" className="btn-primary !px-8">Browse Cakes</Link>
      </div>
    );
  }

  const delivery = calcDelivery(subtotal);
  const total = subtotal + delivery;

  const placeOrder = () => {
    const e: Errors = {};
    if (!name.trim()) e.name = "Please enter your name.";
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 15) e.phone = "Please enter a valid phone number.";
    if (!address.trim()) e.address = "Please enter your delivery address.";
    if (!city.trim()) e.city = "Please enter your city / area.";
    setErrors(e);
    const first = Object.keys(e)[0];
    if (first) {
      document.getElementById(`co-${first}`)?.focus();
      return;
    }

    const order: Order = {
      id: newOrderId(),
      createdAt: new Date().toISOString(),
      customer: {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        address: address.trim(),
        city: city.trim(),
        note: note.trim() || undefined,
      },
      payment,
      items: items.map((i) => ({ name: i.name, price: i.price, qty: i.qty, details: i.details })),
      subtotal,
      delivery,
      total,
    };

    saveOrder(order);
    // open WhatsApp with the order message (must happen inside the click handler)
    window.open(whatsappUrl(order), "_blank", "noopener,noreferrer");
    setPlaced(true);
    clearCart();
    router.push("/invoice");
  };

  const bad = (f: Field) => !!errors[f];

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1fr_340px]">
      <div className="space-y-5">
        {/* Contact + address */}
        <section className={card}>
          <h2 className="mb-4 text-[15px] font-bold">Delivery details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={label} htmlFor="co-name">Full name</label>
              <input id="co-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name"
                aria-invalid={bad("name")} aria-describedby={bad("name") ? "co-name-err" : undefined}
                className={`${input} ${bad("name") ? "!border-red-400" : ""}`} placeholder="Your name" />
              <Err id="co-name-err" msg={errors.name} />
            </div>
            <div>
              <label className={label} htmlFor="co-phone">Phone / WhatsApp</label>
              <input id="co-phone" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel"
                aria-invalid={bad("phone")} aria-describedby={bad("phone") ? "co-phone-err" : undefined}
                className={`${input} ${bad("phone") ? "!border-red-400" : ""}`} placeholder="01XXXXXXXXX" />
              <Err id="co-phone-err" msg={errors.phone} />
            </div>
            <div className="sm:col-span-2">
              <label className={label} htmlFor="co-email">Email <span className="font-normal text-gray-500">(optional)</span></label>
              <input id="co-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email"
                className={input} placeholder="you@example.com" />
            </div>
            <div className="sm:col-span-2">
              <label className={label} htmlFor="co-address">Delivery address</label>
              <textarea id="co-address" rows={3} value={address} onChange={(e) => setAddress(e.target.value)} autoComplete="street-address"
                aria-invalid={bad("address")} aria-describedby={bad("address") ? "co-address-err" : undefined}
                className={`${input} resize-none ${bad("address") ? "!border-red-400" : ""}`} placeholder="House, road, area, landmark" />
              <Err id="co-address-err" msg={errors.address} />
            </div>
            <div>
              <label className={label} htmlFor="co-city">City / Area</label>
              <input id="co-city" value={city} onChange={(e) => setCity(e.target.value)} autoComplete="address-level2"
                aria-invalid={bad("city")} aria-describedby={bad("city") ? "co-city-err" : undefined}
                className={`${input} ${bad("city") ? "!border-red-400" : ""}`} placeholder="e.g. Comilla" />
              <Err id="co-city-err" msg={errors.city} />
            </div>
            <div>
              <label className={label} htmlFor="co-note">Note <span className="font-normal text-gray-500">(optional)</span></label>
              <input id="co-note" value={note} onChange={(e) => setNote(e.target.value)} className={input} placeholder="Delivery time, message..." />
            </div>
          </div>
        </section>

        {/* Payment */}
        <fieldset className={card}>
          <legend className="mb-3 text-[15px] font-bold">Payment method</legend>
          <div className="grid gap-3 sm:grid-cols-3">
            {PAYMENTS.map((p) => (
              <label key={p.id} className="cursor-pointer">
                <input type="radio" name="payment" className="peer sr-only" checked={payment === p.id} onChange={() => setPayment(p.id)} />
                <span className="block h-full rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm transition hover:border-brand/60 peer-checked:border-brand peer-checked:bg-brand-soft peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand">
                  <span className="block font-semibold">{p.name}</span>
                  <span className="mt-0.5 block text-[11px] text-gray-500">{p.hint}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      {/* Summary */}
      <aside className="rounded-xl bg-brand-soft p-5 lg:sticky lg:top-32">
        <h2 className="font-serif text-xl font-bold">Order Summary</h2>
        <ul className="mt-4 space-y-3">
          {items.map((i) => (
            <li key={i.id} className="flex items-start gap-3">
              <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-white">
                <Image src={i.image} alt="" fill sizes="48px" className="object-contain" />
              </span>
              <span className="min-w-0 flex-1 text-sm">
                <span className="block truncate font-semibold">{i.name}</span>
                <span className="text-xs text-gray-500">Qty {i.qty}</span>
              </span>
              <span className="text-sm font-semibold">{tk(i.price * i.qty)}</span>
            </li>
          ))}
        </ul>

        <dl className="mt-4 space-y-2 border-t border-pink-200 pt-4 text-sm">
          <div className="flex justify-between"><dt className="text-gray-600">Subtotal</dt><dd className="font-semibold">{tk(subtotal)}</dd></div>
          <div className="flex justify-between">
            <dt className="text-gray-600">Delivery</dt>
            <dd className="font-semibold">{delivery === 0 ? "Free" : tk(delivery)}</dd>
          </div>
          {delivery > 0 && (
            <p className="text-[11px] text-gray-500">Free delivery on orders above {tk(SHOP.freeDeliveryAbove)}.</p>
          )}
        </dl>
        <div className="mt-3 flex justify-between border-t border-pink-200 pt-4 text-base font-bold">
          <span>Total</span>
          <span>{tk(total)}</span>
        </div>

        <button type="button" onClick={placeOrder} className="btn-primary btn-shine mt-5 w-full">
          <MessageCircle className="h-4 w-4" />
          Place Order on WhatsApp
        </button>
        <p className="mt-3 text-center text-[11px] leading-relaxed text-gray-500">
          WhatsApp will open with your order ready to send. Your invoice PDF downloads automatically right after.
        </p>
        <Link href="/cart" className="mt-3 block text-center text-xs font-semibold text-brand hover:underline">← Back to cart</Link>
      </aside>
    </div>
  );
}
