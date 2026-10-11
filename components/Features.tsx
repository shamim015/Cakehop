import { Bike, Award, Cake, Lock } from "lucide-react";
const features = [
  { icon: Bike, title: "Fast Delivery", text: "On time, every time" },
  { icon: Award, title: "Best Quality", text: "We use premium ingredients" },
  { icon: Cake, title: "100% Fresh", text: "Baked fresh for you" },
  { icon: Lock, title: "Secure Payments", text: "100% secure checkout" },
];
export default function Features() {
  return (
    <section aria-label="Our promises" className="relative z-20 -mt-12">
      <div className="container-wide">
        <div className="rounded-xl bg-white p-2 shadow-[0_4px_20px_rgba(255,92,147,0.12)]">
          <ul className="grid grid-cols-2 gap-y-4 rounded-lg bg-[#FFF7FA] px-2 py-4 md:grid-cols-4 md:gap-y-6 md:px-6 md:py-5">
            {features.map(({ icon: Icon, title, text }, i) => (
              <li key={title} className={`flex items-center gap-2 px-1 md:gap-3 md:px-6 ${i > 0 ? "md:border-l md:border-gray-200" : ""}`}>
                <Icon className="h-8 w-8 shrink-0 text-brand md:h-12 md:w-12" strokeWidth={1.2} />
                <div className="min-w-0 leading-tight"><p className="text-[13px] font-semibold md:text-sm">{title}</p><p className="mt-0.5 text-[11px] text-gray-500 md:text-xs">{text}</p></div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
