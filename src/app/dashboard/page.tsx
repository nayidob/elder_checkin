import { ElderCard } from "@/components/ElderCard";
import { MobileNav } from "@/components/MobileNav";
import { WellnessScore } from "@/components/WellnessScore";
import { getServiceSupabaseClient, type CheckIn, type Elder } from "@/lib/supabase";
import { SignInButton, SignOutButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { redirect } from "next/navigation";

async function fetchElder() {
  const supabase = getServiceSupabaseClient();
  const { data, error } = await supabase.from("elders").select("*").limit(1);
  if (error) throw error;
  return data?.[0] as Elder | undefined;
}

async function fetchCheckIns(elderId: string) {
  const supabase = getServiceSupabaseClient();
  const { data } = await supabase
    .from("checkins")
    .select("*")
    .eq("elder_id", elderId)
    .order("created_at", { ascending: false })
    .limit(5);
  return (data as CheckIn[]) ?? [];
}

async function fetchAlertCount(elderId: string) {
  const supabase = getServiceSupabaseClient();
  const { count } = await supabase
    .from("alerts")
    .select("*", { count: "exact", head: true })
    .eq("elder_id", elderId)
    .eq("acknowledged", false);
  return count ?? 0;
}

export default async function DashboardPage() {
  const elder = await fetchElder();

  if (!elder) {
    redirect("/register");
  }

  const [checkins, openAlerts] = await Promise.all([
    fetchCheckIns(elder!.id),
    fetchAlertCount(elder!.id),
  ]);

  const lastCheckIn = checkins.at(0);
  const averageScore =
    checkins.length > 0
      ? Math.round(
          (checkins.reduce(
            (acc, item) => acc + (item.wellness_score ?? 0),
            0,
          ) /
            checkins.length) *
            10,
        ) / 10
      : null;

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col bg-gradient-to-b from-orange-50 to-white px-5 pb-24 pt-8 text-slate-900">
      <header className="safe-area-top mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-amber-700">☀️ Sunny</p>
          <h1 className="text-2xl font-semibold">Family Dashboard</h1>
        </div>
        <div className="flex items-center gap-3">
          <SignedIn>
            <SignOutButton redirectUrl="/sign-in">
              <button className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-800 shadow ring-1 ring-amber-100 hover:bg-amber-50">
                Log out
              </button>
            </SignOutButton>
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-800 shadow ring-1 ring-amber-100 hover:bg-amber-50">
                Log in
              </button>
            </SignInButton>
          </SignedOut>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-xl shadow ring-1 ring-amber-100">
            {elder!.avatar_emoji ?? "👵"}
          </div>
        </div>
      </header>

      {openAlerts > 0 ? (
        <div className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-100">
          ⚠️ {openAlerts} alert{openAlerts > 1 ? "s" : ""} need attention
        </div>
      ) : null}

      <ElderCard elder={elder!} lastCheckIn={lastCheckIn} />

      <div className="mt-5 grid grid-cols-3 gap-3 text-center text-sm font-semibold text-slate-700">
        <div className="rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-amber-100">
          <p className="text-xs text-amber-700">Total check-ins</p>
          <p className="text-2xl">{checkins.length}</p>
        </div>
        <div className="rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-amber-100">
          <p className="text-xs text-amber-700">Average score</p>
          <p className="text-2xl">{averageScore ?? "—"}</p>
        </div>
        <div className="rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-amber-100">
          <p className="text-xs text-amber-700">Open alerts</p>
          <p className="text-2xl">{openAlerts}</p>
        </div>
      </div>

      <section className="mt-6 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Recent check-ins
          </h2>
        </div>
        {checkins.length === 0 ? (
          <p className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-600 ring-1 ring-amber-100">
            No check-ins yet. Start your first call!
          </p>
        ) : (
          <div className="space-y-2">
            {checkins.map((check) => (
              <div
                key={check.id}
                className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-sm shadow-sm ring-1 ring-amber-100"
              >
                <div>
                  <p className="font-semibold">
                    {new Date(check.created_at ?? "").toLocaleString()}
                  </p>
                  <p className="text-slate-600">{check.summary}</p>
                </div>
                {typeof check.wellness_score === "number" ? (
                  <WellnessScore score={check.wellness_score} />
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="mt-8">
        <a
          href="/call"
          className="flex h-14 items-center justify-center rounded-2xl bg-amber-500 text-base font-semibold text-white shadow-lg shadow-amber-200 transition hover:bg-amber-600"
        >
          📞 Start check-in
        </a>
      </div>

      <MobileNav />
    </main>
  );
}

