import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServiceSupabaseClient } from "@/lib/supabase";
import { RegisterForm } from "./register-form";

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

export default function RegisterPage() {
  return <RegisterForm createElder={createElder} />;
}

