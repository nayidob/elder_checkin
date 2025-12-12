import { redirect } from "next/navigation";
import { getServiceSupabaseClient, type Elder } from "@/lib/supabase";
import { CallExperienceClient } from "./CallExperienceClient";

async function fetchElder() {
  const supabase = getServiceSupabaseClient();
  const { data, error } = await supabase.from("elders").select("*").limit(1);
  if (error) throw error;
  return data?.[0] as Elder | undefined;
}

export default async function CallPage() {
  const elder = await fetchElder();
  if (!elder) {
    redirect("/register");
  }

  return <CallExperienceClient elder={elder} />;
}

