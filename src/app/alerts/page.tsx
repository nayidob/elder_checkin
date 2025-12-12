import { MobileNav } from "@/components/MobileNav";
import { getServiceSupabaseClient, type Alert } from "@/lib/supabase";

async function fetchAlerts(): Promise<Alert[]> {
  const supabase = getServiceSupabaseClient();
  const { data } = await supabase
    .from("alerts")
    .select("*")
    .order("created_at", { ascending: false });
  return (data as Alert[]) ?? [];
}

async function acknowledgeAlert(alertId: string) {
  "use server";
  const supabase = getServiceSupabaseClient();
  await supabase
    .from("alerts")
    .update({ acknowledged: true, acknowledged_at: new Date().toISOString() })
    .eq("id", alertId);
}

const severityColors: Record<Alert["severity"], string> = {
  low: "bg-emerald-50 text-emerald-800 ring-emerald-100",
  medium: "bg-amber-50 text-amber-800 ring-amber-100",
  high: "bg-orange-50 text-orange-800 ring-orange-100",
  critical: "bg-rose-50 text-rose-800 ring-rose-100",
};

export default async function AlertsPage() {
  const alerts = await fetchAlerts();

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col bg-gradient-to-b from-orange-50 to-white px-5 pb-24 pt-8 text-slate-900">
      <header className="safe-area-top mb-6">
        <h1 className="text-2xl font-semibold">Alerts</h1>
        <p className="text-sm text-slate-600">
          Color-coded indicators of how your elder is doing.
        </p>
      </header>

      {alerts.length === 0 ? (
        <div className="rounded-3xl bg-white px-4 py-6 text-center text-slate-600 shadow ring-1 ring-amber-100">
          <p className="text-lg font-semibold">All clear</p>
          <p className="text-sm">No alerts at the moment.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`rounded-3xl px-4 py-4 shadow ring-1 ${
                severityColors[alert.severity]
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase text-slate-500">
                    {alert.type} · {alert.severity}
                  </p>
                  <p className="text-base font-semibold">
                    {alert.message ?? "Alert detected"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {alert.created_at
                      ? new Date(alert.created_at).toLocaleString()
                      : ""}
                  </p>
                </div>
                {!alert.acknowledged ? (
                  <form action={acknowledgeAlert.bind(null, alert.id)}>
                    <button
                      type="submit"
                      className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-800 shadow ring-1 ring-amber-100"
                    >
                      Acknowledge
                    </button>
                  </form>
                ) : (
                  <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-slate-500 ring-1 ring-amber-100">
                    Acknowledged
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <MobileNav />
    </main>
  );
}

