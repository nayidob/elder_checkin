"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient as createAnamClient } from "@anam-ai/js-sdk";
import { CallControls } from "./CallControls";
import { LiveTranscript } from "./LiveTranscript";
import {
  connectElevenLabs,
  type ElevenLabsCallbacks,
  type MicrophoneCapture,
} from "@/lib/elevenlabs";

export type CallState =
  | "idle"
  | "connecting"
  | "ready"
  | "listening"
  | "speaking"
  | "ended";

type AnamAudioInputStream = {
  sendAudioChunk: (chunk: string) => void;
  endSequence: () => void;
  close?: () => void;
};

type AnamClient = any;

export type TranscriptMessage = { role: "user" | "agent"; content: string };

export type CallResult = {
  transcript: TranscriptMessage[];
  wellnessScore?: number;
  alerts?: Array<{ type: string; severity: string; message: string }>;
  summary?: string;
  durationSeconds?: number;
  checkinId?: string;
};

type Props = {
  elder: {
    id?: string;
    name: string;
    nickname?: string | null;
    avatar_emoji?: string | null;
  };
  onCallEnd: (result: CallResult) => void;
};

export function VideoCall({ elder, onCallEnd }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const connections = useRef<{
    anamClient?: AnamClient;
    audioInputStream?: AnamAudioInputStream;
    mic?: MicrophoneCapture;
    ws?: WebSocket;
  }>({});
  const [callState, setCallState] = useState<CallState>("idle");
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [status, setStatus] = useState("Connecting…");
  const [error, setError] = useState<string | null>(null);
  const [isEnding, setIsEnding] = useState(false);
  const startedAt = useRef<number | null>(null);

  const statusLabel = useMemo(() => {
    if (error) return "Error";
    return status;
  }, [error, status]);

  useEffect(() => {
    startCall();
    return () => {
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addMessage = (message: TranscriptMessage) => {
    setTranscript((prev) => [...prev, message]);
  };

  const cleanup = () => {
    try {
      connections.current.mic?.stop();
    } catch {
      // ignore
    }
    try {
      connections.current.ws?.close();
    } catch {
      // ignore
    }
    try {
      connections.current.audioInputStream?.endSequence?.();
      connections.current.audioInputStream?.close?.();
    } catch {
      // ignore
    }
    try {
      connections.current.anamClient?.close?.();
    } catch {
      // ignore
    }
  };

  const handleEndCall = async () => {
    if (isEnding) return;
    setIsEnding(true);
    setStatus("Ending call…");
    cleanup();

    const durationSeconds = startedAt.current
      ? Math.round((Date.now() - startedAt.current) / 1000)
      : undefined;

    const analysis = await analyzeConversation(durationSeconds);
    const finalResult: CallResult = {
      transcript,
      durationSeconds,
      ...analysis,
    };

    setCallState("ended");
    onCallEnd(finalResult);
  };

  const analyzeConversation = async (durationSeconds?: number) => {
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript,
          elderId: elder.id,
          durationSeconds,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze conversation");
      }

      return (await response.json()) as Partial<CallResult>;
    } catch (err) {
      console.error("Could not analyze conversation", err);
      setError("Could not analyze conversation");
      return {};
    }
  };

  const startCall = async () => {
    setCallState("connecting");
    setStatus("Connecting to Sunny…");
    setError(null);

    try {
      const sessionRes = await fetch("/api/anam-session", {
        method: "POST",
      });

      if (!sessionRes.ok) {
        throw new Error("Failed to start Anam session");
      }

      const { anamSessionToken, elevenLabsAgentId } = await sessionRes.json();
      if (!videoRef.current) throw new Error("Video element missing");

      const anamClient = createAnamClient(anamSessionToken, {
        disableInputAudio: true,
      });

      if (videoRef.current) {
        await anamClient.streamToVideoElement("anam-video");
      }

      const audioInputStream = anamClient.createAgentAudioInputStream({
        encoding: "pcm_s16le",
        sampleRate: 16000,
        channels: 1,
      });

      const callbacks: ElevenLabsCallbacks = {
        onReady: () => {
          setCallState("ready");
          setStatus("Connected");
          startedAt.current = Date.now();
        },
        onAudio: (base64Audio) => {
          try {
            audioInputStream.sendAudioChunk(base64Audio);
            playBase64Audio(base64Audio);
            setCallState("speaking");
            setStatus("Sunny is speaking");
          } catch (err) {
            setError("Audio stream error");
            callbacks.onError?.(err);
          }
        },
        onUserTranscript: (text) => {
          addMessage({ role: "user", content: text });
          setCallState("listening");
          setStatus("Listening");
        },
        onAgentResponse: (text) => {
          if (text) {
            addMessage({ role: "agent", content: text });
          }
          audioInputStream.endSequence();
          setCallState("ready");
          setStatus("Connected");
        },
        onInterrupt: () => {
          audioInputStream.endSequence();
          setCallState("listening");
          setStatus("Listening");
        },
        onError: (err) => {
          console.error(err);
          setError("Conversation error");
        },
        onDisconnect: () => {
          if (!isEnding) {
            void handleEndCall();
          }
        },
      };

      const { ws, mic } = await connectElevenLabs(
        elevenLabsAgentId,
        callbacks,
      );

      connections.current = {
        anamClient,
        audioInputStream,
        ws,
        mic,
      };
    } catch (err) {
      console.error(err);
      setError("Could not start call");
      setStatus("Could not connect");
      setCallState("ended");
    }
  };

  return (
    <div className="video-container h-screen-mobile overflow-hidden bg-black">
      <video
        id="anam-video"
        ref={videoRef}
        className="h-full w-full object-cover"
        autoPlay
        muted
        playsInline
      />

      <div className="safe-area-top absolute left-4 top-4 z-10 rounded-full bg-white/80 px-4 py-2 text-xs font-semibold text-slate-800 shadow">
        {statusLabel}
      </div>

      <div className="absolute right-4 top-4 z-10 rounded-2xl bg-white/70 px-3 py-2 text-xs text-slate-800 shadow">
        <div className="flex items-center gap-2">
          <span>{elder.avatar_emoji ?? "👵"}</span>
          <div>
            <p className="font-semibold leading-tight">{elder.name}</p>
            {elder.nickname ? (
              <p className="text-[11px] text-slate-600">“{elder.nickname}”</p>
            ) : null}
          </div>
        </div>
      </div>

      <LiveTranscript messages={transcript} />

      <CallControls
        onEndCall={handleEndCall}
        disabled={callState === "ended"}
        label={isEnding ? "Ending…" : "🔴 End Call"}
      />

      {error ? (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-black/60 p-6 text-center text-white">
          <div className="rounded-3xl bg-black/50 px-6 py-4 shadow">
            <p className="text-lg font-semibold">Something went wrong</p>
            <p className="text-sm text-white/80">{error}</p>
          </div>
        </div>
      ) : null}

      {callState === "connecting" ? (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="flex items-center gap-3 rounded-2xl bg-white/80 px-5 py-3 text-sm font-semibold text-slate-800 shadow">
            <span className="h-3 w-3 animate-pulse rounded-full bg-emerald-500" />
            Connecting to Sunny…
          </div>
        </div>
      ) : null}
    </div>
  );
}

function playBase64Audio(base64Audio: string) {
  try {
    const audio = new Audio(`data:audio/wav;base64,${base64Audio}`);
    void audio.play();
  } catch (err) {
    console.error("Audio playback error", err);
  }
}

