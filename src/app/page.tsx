import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-b from-orange-100 via-amber-50 to-white text-slate-900">
      <div className="safe-area-top px-6 py-10">
        <div className="mb-10 space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-amber-700 shadow-sm ring-1 ring-amber-200">
            <span>☀️</span>
            <span>Sunny Check-In</span>
          </div>
          <h1 className="text-4xl font-semibold leading-tight">
            A friendly daily video call for the people you love.
          </h1>
          <p className="text-lg text-slate-600">
            Sunny pairs a lifelike avatar with voice AI to chat, observe, and
            share how your elder is feeling—all in a mobile-first experience.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href="/call"
            className="flex h-14 items-center justify-center rounded-2xl bg-amber-500 text-base font-semibold text-white shadow-lg shadow-amber-200 transition hover:bg-amber-600"
          >
            📞 Start a check-in call
          </Link>
          <div className="grid grid-cols-2 gap-3 text-sm font-medium text-slate-700">
            <Link
              href="/register"
              className="flex h-12 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-amber-100 transition hover:ring-amber-200"
            >
              Register an elder
            </Link>
            <Link
              href="/dashboard"
              className="flex h-12 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-amber-100 transition hover:ring-amber-200"
            >
              View dashboard
            </Link>
          </div>
        </div>
      </div>

      <section className="mt-auto bg-white px-6 py-8 shadow-inner">
        <h2 className="text-lg font-semibold text-slate-900">
          What you get
        </h2>
        <ul className="mt-3 space-y-3 text-slate-700">
          <li className="flex items-center gap-3">
            <span className="text-xl">🎥</span>
            <div>
              <p className="font-semibold">FaceTime-style video call</p>
              <p className="text-sm text-slate-600">
                Full-screen avatar with real-time lip-sync.
              </p>
            </div>
          </li>
          <li className="flex items-center gap-3">
            <span className="text-xl">💬</span>
            <div>
              <p className="font-semibold">Live transcript</p>
              <p className="text-sm text-slate-600">
                Subtle overlay so you never miss a moment.
              </p>
            </div>
          </li>
          <li className="flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="font-semibold">Smart alerts</p>
              <p className="text-sm text-slate-600">
                Health, mood, and confusion signals sent to family.
              </p>
            </div>
          </li>
        </ul>
      </section>
    </main>
  );
}
