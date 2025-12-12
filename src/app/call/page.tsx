import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getServiceSupabaseClient, type Elder } from "@/lib/supabase";
import { CallExperienceClient } from "./CallExperienceClient";

async function fetchElder(userId: string) {
  const supabase = getServiceSupabaseClient();
  const { data, error } = await supabase
    .from("elders")
    .select("*")
    .eq("user_id", userId)
    .limit(1);
  if (error) throw error;
  return data?.[0] as Elder | undefined;
}

export default async function CallPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const elder = await fetchElder(userId);
  if (!elder) {
    redirect("/register");
  }

  return <CallExperienceClient elder={elder} />;
}

