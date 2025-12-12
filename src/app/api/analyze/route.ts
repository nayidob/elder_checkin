import { NextResponse } from "next/server";
import { getServiceSupabaseClient } from "@/lib/supabase";

const patterns = {
  health: /fell|fall|hurt|pain|ache|dizzy|medication|medicine|doctor/i,
  confusion: /confused|forget|forgot|lost|don't remember|what day/i,
  mood: /lonely|alone|sad|miss|nobody|depressed/i,
  emergency: /help|emergency|can't breathe|chest pain|911/i,
};

type TranscriptMessage = { role: "user" | "agent"; content: string };

export async function POST(req: Request) {
  const body = await req.json();
  const transcript = body?.transcript as TranscriptMessage[];
  const elderId = body?.elderId as string | undefined;
  const durationSeconds = body?.durationSeconds as number | undefined;

  if (!Array.isArray(transcript)) {
    return NextResponse.json({ error: "Invalid transcript" }, { status: 400 });
  }

  const alerts: Array<{ type: string; severity: string; message: string }> =
    [];

  const concatenated = transcript.map((m) => m.content).join(" ");
  Object.entries(patterns).forEach(([type, regex]) => {
    if (regex.test(concatenated)) {
      alerts.push({
        type,
        severity: type === "emergency" ? "critical" : "medium",
        message: `Detected ${type} signal`,
      });
    }
  });

  const baseScore = 10;
  const penalty = Math.min(5, alerts.length) * 2;
  const wellnessScore = Math.max(1, baseScore - penalty);
  const summary =
    alerts.length === 0
      ? "Conversation looked healthy and upbeat."
      : `Detected ${alerts.length} alert(s) during the call.`;

  let checkinId: string | undefined;

  if (elderId) {
    try {
      const supabase = getServiceSupabaseClient();
      const { data, error } = await supabase
        .from("checkins")
        .insert({
          elder_id: elderId,
          wellness_score: wellnessScore,
          summary,
          transcript,
          alerts,
          duration_seconds: durationSeconds,
        })
        .select("id")
        .single();

      if (error) throw error;
      checkinId = data?.id;

      if (alerts.length > 0 && checkinId) {
        const alertRows = alerts.map((alert) => ({
          elder_id: elderId,
          checkin_id: checkinId,
          type: alert.type,
          severity: alert.severity,
          message: alert.message,
        }));
        const { error: alertError } = await supabase
          .from("alerts")
          .insert(alertRows);
        if (alertError) throw alertError;
      }
    } catch (err) {
      console.error("Analyze route supabase error", err);
    }
  }

  return NextResponse.json({
    wellnessScore,
    alerts,
    summary,
    checkinId,
  });
}

