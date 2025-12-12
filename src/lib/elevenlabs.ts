export type ElevenLabsCallbacks = {
  onReady?: () => void;
  onAudio?: (base64Audio: string) => void;
  onUserTranscript?: (text: string) => void;
  onAgentResponse?: (text?: string) => void;
  onInterrupt?: () => void;
  onError?: (error: unknown) => void;
  onDisconnect?: () => void;
};

type MicCallback = (pcmBuffer: ArrayBuffer) => void;

export class MicrophoneCapture {
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private onData?: MicCallback;

  async start(onData: MicCallback) {
    this.onData = onData;
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        sampleRate: 16000,
        sampleSize: 16,
        echoCancellation: true,
        noiseSuppression: true,
      },
    });

    this.audioContext = new AudioContext({ sampleRate: 16000 });
    await this.audioContext.resume();

    this.source = this.audioContext.createMediaStreamSource(this.stream);
    this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
    this.processor.onaudioprocess = (event) => {
      const input = event.inputBuffer.getChannelData(0);
      const buffer = new ArrayBuffer(input.length * 2);
      const view = new DataView(buffer);

      for (let i = 0; i < input.length; i += 1) {
        const s = Math.max(-1, Math.min(1, input[i]));
        view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      }

      this.onData?.(buffer);
    };

    this.source.connect(this.processor);
    this.processor.connect(this.audioContext.destination);
  }

  stop() {
    if (this.processor) {
      this.processor.disconnect();
      this.processor.onaudioprocess = null;
    }
    if (this.source) {
      this.source.disconnect();
    }
    if (this.audioContext) {
      this.audioContext.close().catch(() => null);
    }
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
    }

    this.processor = null;
    this.source = null;
    this.audioContext = null;
    this.stream = null;
  }
}

export function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
}

export async function connectElevenLabs(
  agentId: string,
  callbacks: ElevenLabsCallbacks = {},
) {
  const ws = new WebSocket(
    `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${agentId}`,
  );

  const mic = new MicrophoneCapture();

  ws.onerror = (event) => callbacks.onError?.(event);
  ws.onclose = () => {
    mic.stop();
    callbacks.onDisconnect?.();
  };

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data as string);
      if (msg.type === "audio" && msg.audio) {
        callbacks.onAudio?.(msg.audio);
      }

      if (msg.type === "user_transcript" && msg.user_transcript?.transcript) {
        callbacks.onUserTranscript?.(msg.user_transcript.transcript);
      }

      if (msg.type === "agent_response") {
        callbacks.onAgentResponse?.(msg.agent_response?.transcript);
      }

      if (msg.type === "interruption") {
        callbacks.onInterrupt?.();
      }

      if (msg.type === "ping") {
        ws.send(
          JSON.stringify({
            type: "pong",
            event_id: msg.ping_event?.event_id,
          }),
        );
      }
    } catch (error) {
      callbacks.onError?.(error);
    }
  };

  ws.onopen = async () => {
    callbacks.onReady?.();
    try {
      await mic.start((buffer) => {
        if (ws.readyState !== WebSocket.OPEN) return;
        ws.send(
          JSON.stringify({
            type: "user_audio_chunk",
            audio: arrayBufferToBase64(buffer),
          }),
        );
      });
    } catch (error) {
      callbacks.onError?.(error);
      ws.close();
    }
  };

  return { ws, mic };
}

