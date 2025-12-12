import { MobileNav } from "@/components/MobileNav";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

async function startCheckout() {
  "use server";
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const response = await fetch(`${baseUrl}/api/stripe`, {
    method: "POST",
    headers: {
      cookie: cookies().toString(),
    },
  });
  if (!response.ok) {
    throw new Error("Unable to start checkout");
  }
  const { url } = await response.json();
  redirect(url);
}

export default function PricingPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col bg-gradient-to-b from-orange-50 to-white px-5 pb-24 pt-8 text-slate-900">
      <header className="safe-area-top mb-6">
        <h1 className="text-2xl font-semibold">Plans</h1>
        <p className="text-sm text-slate-600">
          Simple pricing for peace of mind.
        </p>
      </header>

      <div className="space-y-4">
        <div className="rounded-3xl bg-white px-5 py-6 shadow ring-1 ring-amber-100">
          <p className="text-sm font-semibold text-amber-700">Free</p>
          <p className="mt-1 text-3xl font-bold">$0</p>
          <p className="text-sm text-slate-600">Try Sunny with limited calls.</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            <li>• 2 calls per week</li>
            <li>• Transcript view</li>
            <li>• Basic alerts</li>
          </ul>
        </div>

        <div className="rounded-3xl bg-amber-500 px-5 py-6 text-white shadow-lg shadow-amber-200">
          <p className="text-sm font-semibold">Premium</p>
          <p className="mt-1 text-3xl font-bold">$29/mo</p>
          <p className="text-sm text-amber-50">
            Unlimited calls, full alerts, and family dashboard.
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>• Unlimited check-ins</li>
            <li>• Priority alerts & SMS</li>
            <li>• Family dashboard</li>
          </ul>
          <form action={startCheckout} className="mt-4">
            <button
              type="submit"
              className="flex h-12 w-full items-center justify-center rounded-2xl bg-white text-base font-semibold text-amber-600 shadow"
            >
              Upgrade
            </button>
          </form>
        </div>
      </div>

      <MobileNav />
    </main>
  );
}

