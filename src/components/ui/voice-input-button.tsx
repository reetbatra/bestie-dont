"use client";

import { useRef, useState } from "react";
import { LoaderCircle, Mic, Square } from "lucide-react";
import { cn } from "@/lib/utils";

type VoiceInputButtonProps = {
  className?: string;
  disabled?: boolean;
  onTranscript: (text: string) => void;
};

function preferredMimeType() {
  if (typeof MediaRecorder === "undefined") return undefined;
  return ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"].find(
    (type) => MediaRecorder.isTypeSupported(type),
  );
}

export function VoiceInputButton({ className, disabled, onTranscript }: VoiceInputButtonProps) {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [status, setStatus] = useState<"idle" | "recording" | "transcribing">("idle");
  const [error, setError] = useState<string | null>(null);

  function cleanUp() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    recorderRef.current = null;
  }

  async function transcribe(blob: Blob) {
    try {
      const formData = new FormData();
      formData.set("audio", blob, "voice-note.webm");
      const response = await fetch("/api/transcribe", { method: "POST", body: formData });
      const data = (await response.json().catch(() => ({}))) as { text?: string; error?: string };
      if (!response.ok) throw new Error(data.error ?? "Transcription failed.");
      if (data.text?.trim()) onTranscript(data.text.trim());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Transcription failed.");
    } finally {
      setStatus("idle");
      cleanUp();
    }
  }

  async function startRecording() {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("Voice input isn't supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const mimeType = preferredMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        if (!blob.size) {
          setError("No audio was recorded.");
          setStatus("idle");
          cleanUp();
          return;
        }
        setStatus("transcribing");
        void transcribe(blob);
      };
      recorder.start();
      setStatus("recording");
    } catch {
      cleanUp();
      setError("Microphone access was not allowed.");
    }
  }

  function stopRecording() {
    recorderRef.current?.stop();
  }

  const label = status === "recording" ? "Stop recording" : "Speak instead of typing";

  return (
    <>
      <button
        type="button"
        aria-label={label}
        title={label}
        disabled={disabled || status === "transcribing"}
        onClick={status === "recording" ? stopRecording : startRecording}
        className={cn(
          "absolute right-1.5 top-1/2 z-10 grid size-7 -translate-y-1/2 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
          status === "recording" && "bg-destructive/10 text-destructive hover:bg-destructive/15 hover:text-destructive",
          className,
        )}
      >
        {status === "recording" ? (
          <Square className="size-3.5 fill-current" aria-hidden="true" />
        ) : status === "transcribing" ? (
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <Mic className="size-4" aria-hidden="true" />
        )}
      </button>
      <span className="sr-only" aria-live="polite">
        {status === "recording" ? "Recording. Press the microphone again when you are done." : status === "transcribing" ? "Transcribing your recording." : error}
      </span>
      {error && (
        <span role="alert" className="absolute right-0 top-full z-20 mt-1 whitespace-nowrap rounded bg-foreground px-2 py-1 text-xs text-background">
          {error}
        </span>
      )}
    </>
  );
}
