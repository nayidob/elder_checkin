import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServiceSupabaseClient } from "@/lib/supabase";

const avatarOptions = ["👵", "👴", "🧓", "👨‍🦳", "👩‍🦳"];

async function createElder(formData: FormData) {
  "use server";

  const { userId } = auth();
  if (!userId) throw new Error("Not signed in");

  const supabase = getServiceSupabaseClient();
  const { error } = await supabase.from("elders").insert({
    name: formData.get("name"),
    nickname: formData.get("nickname"),
    interests: formData.get("interests"),
    medical_notes: formData.get("medical_notes"),
    family_name: formData.get("family_name"),
    family_email: formData.get("family_email"),
    avatar_emoji: formData.get("avatar_emoji") ?? "👵",
    user_id: userId,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export default function RegisterPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col bg-gradient-to-b from-orange-50 to-white px-5 pb-24 pt-8 text-slate-900">
      <header className="safe-area-top mb-6">
        <h1 className="text-2xl font-semibold">Register your elder</h1>
        <p className="text-sm text-slate-600">
          A quick mobile-friendly form to set up Sunny.
        </p>
      </header>

      <form action={createElder} className="space-y-5">
        <div>
          <p className="text-sm font-semibold text-slate-700">Avatar</p>
          <div className="mt-2 grid grid-cols-5 gap-2">
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
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">
            Name
            <input
              required
              name="name"
              className="mt-1 w-full rounded-2xl border border-amber-100 bg-white px-4 py-3 text-base shadow-sm focus:border-amber-300 focus:outline-none"
              placeholder="Grandma Maggie"
            />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Nickname
            <input
              name="nickname"
              className="mt-1 w-full rounded-2xl border border-amber-100 bg-white px-4 py-3 text-base shadow-sm focus:border-amber-300 focus:outline-none"
              placeholder="Nana"
            />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Interests
            <textarea
              name="interests"
              rows={3}
              className="mt-1 w-full rounded-2xl border border-amber-100 bg-white px-4 py-3 text-base shadow-sm focus:border-amber-300 focus:outline-none"
              placeholder="Knitting, gardening, classical music"
            />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Medical notes
            <textarea
              name="medical_notes"
              rows={3}
              className="mt-1 w-full rounded-2xl border border-amber-100 bg-white px-4 py-3 text-base shadow-sm focus:border-amber-300 focus:outline-none"
              placeholder="Blood pressure meds in the morning"
            />
          </label>
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

