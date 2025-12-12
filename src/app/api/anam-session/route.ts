import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.ANAM_API_KEY;
  const avatarId = process.env.ANAM_AVATAR_ID;
  const elevenLabsAgentId = process.env.ELEVENLABS_AGENT_ID;

  if (!apiKey || !avatarId || !elevenLabsAgentId) {
    return NextResponse.json(
      { error: "Missing Anam or ElevenLabs configuration" },
      { status: 500 },
    );
  }

  try {
    const response = await fetch("https://api.anam.ai/v1/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        avatarId,
        enableAudioPassthrough: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Failed to create Anam session");
    }

    const json = await response.json();
    const anamSessionToken = json?.sessionToken ?? json?.token;

    return NextResponse.json({
      anamSessionToken,
      elevenLabsAgentId,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create Anam session" },
      { status: 500 },
    );
  }
}

