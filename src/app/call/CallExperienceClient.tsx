"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CallResult, VideoCall } from "@/components/VideoCall";
import type { Elder } from "@/lib/supabase";

function formatDuration(seconds?: number) {
  if (!seconds) return "—";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

type Props = {
  elder: Elder;
};

export function CallExperienceClient({ elder }: Props) {
  const [mode, setMode] = useState<"ready" | "active" | "ended">("ready");
  const [result, setResult] = useState<CallResult | null>(null);

  useEffect(() => {
    if (!result?.alerts || result.alerts.length === 0) return;
    const webhook = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL;
    if (!webhook) return;

    fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result),
    }).catch(() => null);
  }, [result]);

  if (mode === "active") {
    return (
      <VideoCall
        elder={elder}
        onCallEnd={(payload) => {
          setResult(payload);
          setMode("ended");
        }}
      />
    );
  }

  if (mode === "ended" && result) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-orange-50 to-white px-6 text-slate-900">
        <div className="safe-area-top w-full max-w-md space-y-6 rounded-3xl bg-white p-6 text-center shadow-lg ring-1 ring-amber-100">
          <p className="text-4xl">✅</p>
          <h1 className="text-2xl font-semibold">Check-in complete</h1>
          {typeof result.wellnessScore === "number" ? (
            <p className="text-4xl font-bold text-emerald-600">
              {result.wellnessScore}/10
            </p>
          ) : null}
          <p className="text-slate-600">{result.summary}</p>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800 ring-1 ring-amber-100">
              Duration: {formatDuration(result.durationSeconds)}
            </div>
            <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800 ring-1 ring-amber-100">
              Alerts: {result.alerts?.length ?? 0}
            </div>
          </div>

          {result.alerts && result.alerts.length > 0 ? (
            <div className="space-y-2 rounded-2xl bg-rose-50 px-4 py-3 text-left text-rose-800 ring-1 ring-rose-100">
              {result.alerts.map((alert, idx) => (
                <div key={`${alert.type}-${idx}`}>
                  ⚠️ {alert.type} · {alert.message}
                </div>
              ))}
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/dashboard"
              className="flex h-12 items-center justify-center rounded-2xl bg-white text-base font-semibold text-slate-800 shadow ring-1 ring-amber-100"
            >
              Dashboard
            </Link>
            <button
              type="button"
              onClick={() => {
                setResult(null);
                setMode("ready");
              }}
              className="flex h-12 items-center justify-center rounded-2xl bg-amber-500 text-base font-semibold text-white shadow"
            >
              Call again
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-orange-50 to-white px-6 text-center text-slate-900">
      <div className="safe-area-top w-full max-w-md space-y-4 rounded-3xl bg-white p-8 shadow-lg ring-1 ring-amber-100">
        <p className="text-5xl">{elder.avatar_emoji ?? "👵"}</p>
        <h1 className="text-3xl font-semibold">Ready to check in on</h1>
        <p className="text-xl font-semibold text-amber-700">{elder.name}</p>
        <p className="text-slate-600">
          Sunny will have a friendly video chat and let you know how{" "}
          {elder.nickname ?? elder.name} is doing.
        </p>
        <button
          type="button"
          onClick={() => setMode("active")}
          className="mt-2 flex h-14 w-full items-center justify-center rounded-2xl bg-emerald-500 text-base font-semibold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-600"
        >
          📞 Start call
        </button>
      </div>
    </main>
  );
}

