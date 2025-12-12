type TranscriptMessage = {
  role: "user" | "agent";
  content: string;
};

type Props = {
  messages: TranscriptMessage[];
};

export function LiveTranscript({ messages }: Props) {
  const lastMessages = messages.slice(-3);

  return (
    <div className="pointer-events-none absolute inset-x-4 bottom-28 z-10 space-y-2 rounded-3xl bg-black/30 p-4 text-sm text-white backdrop-blur">
      {lastMessages.map((msg, idx) => (
        <div
          key={`${msg.role}-${idx}-${msg.content}`}
          className="rounded-2xl bg-white/10 px-3 py-2"
        >
          <p className="text-[11px] uppercase tracking-wide text-white/70">
            {msg.role === "agent" ? "Sunny" : "You"}
          </p>
          <p className="font-medium leading-snug">{msg.content}</p>
        </div>
      ))}
      {lastMessages.length === 0 ? (
        <p className="text-center text-xs text-white/60">Listening…</p>
      ) : null}
    </div>
  );
}

