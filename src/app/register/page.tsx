import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { useMemo, useState } from "react";
import { getServiceSupabaseClient } from "@/lib/supabase";

const avatarOptions = ["👵", "👴", "🧓", "👨‍🦳", "👩‍🦳"];

type Medicine = {
  name: string;
  hour: string;
  minute: string;
  taken: boolean;
};

async function createElder(formData: FormData) {
  "use server";

  const { userId } = await auth();
  if (!userId) throw new Error("Not signed in");

  const medicinesJson = formData.get("medicines_json") as string | null;
  const summary = (formData.get("summary") as string | null) ?? "";
  const age = formData.get("age") as string | null;
  const lastReport = formData.get("last_report") as string | null;

  const medicalNotes = {
    patient_info: {
      name: formData.get("name") ?? "",
      age: age ? Number(age) : undefined,
      last_report: lastReport || undefined,
    },
    medicines: medicinesJson ? JSON.parse(medicinesJson) : [],
    summary,
  };

  const supabase = getServiceSupabaseClient();
  const { error } = await supabase.from("elders").insert({
    name: formData.get("name"),
    nickname: formData.get("nickname"),
    family_name: formData.get("family_name"),
    family_email: formData.get("family_email"),
    avatar_emoji: formData.get("avatar_emoji") ?? "👵",
    medical_notes: JSON.stringify(medicalNotes),
    interests: null,
    user_id: userId,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

function MedicinesRepeater() {
  "use client";

  const [medicines, setMedicines] = useState<Medicine[]>([
    { name: "", hour: "", minute: "", taken: false },
  ]);

  const normalized = useMemo(
    () =>
      medicines
        .filter((m) => m.name.trim() !== "")
        .map((m) => ({
          name: m.name,
          report: {
            hour: Number(m.hour) || 0,
            minute: Number(m.minute) || 0,
            taken: Boolean(m.taken),
          },
        })),
    [medicines],
  );

  return (
    <div className="space-y-3">
      <input
        type="hidden"
        name="medicines_json"
        value={JSON.stringify(normalized)}
        readOnly
      />
      {medicines.map((med, idx) => (
        <div
          key={idx}
          className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-amber-100"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-2">
              <input
                name={`medicine_name_${idx}`}
                value={med.name}
                onChange={(e) =>
                  setMedicines((prev) =>
                    prev.map((m, i) =>
                      i === idx ? { ...m, name: e.target.value } : m,
                    ),
                  )
                }
                placeholder="Medicine name"
                className="w-full rounded-xl border border-amber-100 px-3 py-2 text-sm focus:border-amber-300 focus:outline-none"
              />
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <label className="text-xs text-slate-600">Hour</label>
                  <input
                    type="number"
                    min={0}
                    max={23}
                    value={med.hour}
                    onChange={(e) =>
                      setMedicines((prev) =>
                        prev.map((m, i) =>
                          i === idx ? { ...m, hour: e.target.value } : m,
                        ),
                      )
                    }
                    className="mt-1 w-full rounded-xl border border-amber-100 px-3 py-2 focus:border-amber-300 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-600">Minute</label>
                  <input
                    type="number"
                    min={0}
                    max={59}
                    value={med.minute}
                    onChange={(e) =>
                      setMedicines((prev) =>
                        prev.map((m, i) =>
                          i === idx ? { ...m, minute: e.target.value } : m,
                        ),
                      )
                    }
                    className="mt-1 w-full rounded-xl border border-amber-100 px-3 py-2 focus:border-amber-300 focus:outline-none"
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex w-full items-center gap-2 rounded-xl border border-amber-100 px-3 py-2 text-sm font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={med.taken}
                      onChange={(e) =>
                        setMedicines((prev) =>
                          prev.map((m, i) =>
                            i === idx ? { ...m, taken: e.target.checked } : m,
                          ),
                        )
                      }
                    />
                    Taken?
                  </label>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                setMedicines((prev) =>
                  prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev,
                )
              }
              disabled={medicines.length <= 1}
              className="text-sm text-slate-500 hover:text-rose-600 disabled:cursor-not-allowed disabled:text-slate-300"
            >
              Remove
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          setMedicines((prev) => [
            ...prev,
            { name: "", hour: "", minute: "", taken: false },
          ])
        }
        className="flex h-11 w-full items-center justify-center rounded-2xl border border-dashed border-amber-200 bg-amber-50 text-sm font-semibold text-amber-700"
      >
        + Add a medicine
      </button>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col bg-gradient-to-b from-orange-50 to-white px-5 pb-24 pt-8 text-slate-900">
      <header className="safe-area-top mb-6 space-y-1">
        <h1 className="text-2xl font-semibold">Patient intake</h1>
        <p className="text-sm text-slate-600">
          Capture patient info, medicine schedule, and a quick summary.
        </p>
      </header>

      <form action={createElder} className="space-y-6">
        <section className="space-y-3">
          <p className="text-sm font-semibold text-slate-700">Avatar</p>
          <div className="grid grid-cols-5 gap-2">
            {avatarOptions.map((emoji) => (
              <label
                key={emoji}
                className="flex h-12 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm ring-1 ring-amber-100"
              >
                <input
                  type="radio"
                  name="avatar_emoji"
                  value={emoji}
                  defaultChecked={emoji === "👵"}
                  className="peer sr-only"
                />
                <span className="peer-checked:scale-110 peer-checked:drop-shadow">
                  {emoji}
                </span>
              </label>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">
            1) Patient Information
          </h2>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">
              Patient name
              <input
                required
                name="name"
                className="mt-1 w-full rounded-2xl border border-amber-100 bg-white px-4 py-3 text-base shadow-sm focus:border-amber-300 focus:outline-none"
                placeholder="Maria Rodriguez"
              />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Age
              <input
                required
                type="number"
                min={0}
                name="age"
                className="mt-1 w-full rounded-2xl border border-amber-100 bg-white px-4 py-3 text-base shadow-sm focus:border-amber-300 focus:outline-none"
                placeholder="82"
              />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Date/Time of report
              <input
                required
                type="datetime-local"
                name="last_report"
                className="mt-1 w-full rounded-2xl border border-amber-100 bg-white px-4 py-3 text-base shadow-sm focus:border-amber-300 focus:outline-none"
              />
            </label>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              2) Medicines
            </h2>
            <p className="text-xs text-slate-500">
              Add one row per scheduled dose.
            </p>
          </div>
          <MedicinesRepeater />
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">
            3) Summary
          </h2>
          <p className="text-sm text-slate-600">
            Provide a quick summary (auto or manual).
          </p>
          <textarea
            name="summary"
            rows={3}
            className="w-full rounded-2xl border border-amber-100 bg-white px-4 py-3 text-base shadow-sm focus:border-amber-300 focus:outline-none"
            placeholder="Overall doing well. Mentioned mild back pain in the morning."
          />
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">
            Family contact (for alerts)
          </h2>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">
              Family contact name
              <input
                required
                name="family_name"
                className="mt-1 w-full rounded-2xl border border-amber-100 bg-white px-4 py-3 text-base shadow-sm focus:border-amber-300 focus:outline-none"
                placeholder="Your name"
              />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Family email
              <input
                required
                type="email"
                name="family_email"
                className="mt-1 w-full rounded-2xl border border-amber-100 bg-white px-4 py-3 text-base shadow-sm focus:border-amber-300 focus:outline-none"
                placeholder="you@email.com"
              />
            </label>
          </div>
        </section>

        <div className="sticky bottom-6 safe-area-bottom">
          <button
            type="submit"
            className="flex h-14 w-full items-center justify-center rounded-2xl bg-amber-500 text-base font-semibold text-white shadow-lg shadow-amber-200 transition hover:bg-amber-600"
          >
            Save and continue
          </button>
        </div>
      </form>
    </main>
  );
}

