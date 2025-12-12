import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type Elder = {
  id: string;
  user_id: string;
  name: string;
  nickname?: string | null;
  interests?: string | null;
  medical_notes?: string | null;
  family_name: string;
  family_email: string;
  emergency_phone?: string | null;
  avatar_emoji?: string | null;
  created_at?: string;
};

export type CheckIn = {
  id: string;
  elder_id: string;
  wellness_score?: number | null;
  summary?: string | null;
  transcript?: Array<{ role: "user" | "agent"; content: string }> | null;
  alerts?: Array<{ type: string; severity: string; message: string }> | null;
  duration_seconds?: number | null;
  created_at?: string;
};

export type Alert = {
  id: string;
  elder_id: string;
  checkin_id?: string | null;
  type: "health" | "confusion" | "mood" | "emergency";
  severity: "low" | "medium" | "high" | "critical";
  message?: string | null;
  acknowledged: boolean;
  acknowledged_at?: string | null;
  created_at?: string;
};

export type Subscription = {
  id: string;
  user_id: string;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  plan: "free" | "premium";
  status: string;
  current_period_end?: string | null;
  created_at?: string;
  updated_at?: string;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let cachedServiceClient: SupabaseClient | null = null;

const missingEnv =
  !supabaseUrl || !supabaseServiceKey
    ? "Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    : null;

export function getServiceSupabaseClient(): SupabaseClient {
  if (cachedServiceClient) return cachedServiceClient;

  if (missingEnv) {
    throw new Error(missingEnv);
  }

  cachedServiceClient = createClient(supabaseUrl!, supabaseServiceKey!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return cachedServiceClient;
}

