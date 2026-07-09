"use client";

import { Mic, Square } from "lucide-react";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { cn } from "@/lib/utils";

export function VoiceInputButton({
  onTranscript,
  className,
}: {
  onTranscript: (text: string) => void;
  className?: string;
}) {
  const { isSupported, isListening, start, stop } = useSpeechRecognition((finalChunk) => {
    onTranscript(finalChunk);
  });

  if (!isSupported) return null;

  return (
    <button
      type="button"
      onClick={isListening ? stop : start}
      aria-label={isListening ? "Stop voice input" : "Start voice input"}
      className={cn(
        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors",
        isListening
          ? "bg-terracotta text-primary-foreground animate-pulse"
          : "bg-muted text-muted-foreground hover:text-foreground",
        className,
      )}
    >
      {isListening ? <Square className="h-3.5 w-3.5" /> : <Mic className="h-4 w-4" />}
    </button>
  );
}
