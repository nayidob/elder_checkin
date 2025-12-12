import Link from "next/link";
import type { CheckIn, Elder } from "@/lib/supabase";

type Props = {
  elder: Elder;
  lastCheckIn?: CheckIn | null;
  onCallNow?: () => void;
};

export function ElderCard({ elder, lastCheckIn, onCallNow }: Props) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-lg ring-1 ring-amber-100">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-2xl">
            <span>{elder.avatar_emoji ?? "👵"}</span>
            <p className="font-semibold leading-tight text-slate-900">
              {elder.name}
            </p>
          </div>
          {elder.nickname ? (
            <p className="text-sm text-slate-500">“{elder.nickname}”</p>
          ) : null}
        </div>
        <Link
          href="/call"
          className="rounded-2xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-amber-600"
          onClick={onCallNow}
        >
          Call now
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 text-center text-sm text-slate-700">
        <div className="rounded-2xl bg-amber-50 px-3 py-2">
          <p className="text-xs text-amber-700">Last check-in</p>
          <p className="font-semibold">
            {lastCheckIn?.created_at
              ? new Date(lastCheckIn.created_at).toLocaleDateString()
              : "—"}
          </p>
        </div>
        <div className="rounded-2xl bg-amber-50 px-3 py-2">
          <p className="text-xs text-amber-700">Score</p>
          <p className="font-semibold">
            {lastCheckIn?.wellness_score ?? "Pending"}
          </p>
        </div>
        <div className="rounded-2xl bg-amber-50 px-3 py-2">
          <p className="text-xs text-amber-700">Alerts</p>
          <p className="font-semibold">
            {lastCheckIn?.alerts?.length ?? 0}
          </p>
        </div>
      </div>
    </div>
  );
}

