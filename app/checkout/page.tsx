import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import CheckoutView from "@/components/CheckoutView";

export const metadata: Metadata = { title: "Checkout – CakeShop" };

export default function CheckoutPage() {
  return (
    <PageShell
      title="Checkout"
      subtitle="Tell us where to deliver. Your order will be sent to us on WhatsApp."
    >
      <CheckoutView />
    </PageShell>
  );
}
