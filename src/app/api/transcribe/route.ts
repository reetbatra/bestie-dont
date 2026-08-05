import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/supabase/server";

export const maxDuration = 60;

// Well above any voice note this app's fields need - caps upstream cost per request.
const MAX_AUDIO_BYTES = 10 * 1024 * 1024;

function extensionFor(mimeType: string) {
  if (mimeType.includes("mp4")) return "mp4";
  if (mimeType.includes("ogg")) return "ogg";
  if (mimeType.includes("mpeg")) return "mp3";
  return "webm";
}

export async function POST(request: NextRequest) {
  try {
    await requireUserId();
  } catch {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const apiKey = process.env.ELEVEN_LABS_API_KEY;
  if (!apiKey) {
    console.error("ELEVEN_LABS_API_KEY is not set.");
    return NextResponse.json({ error: "Voice input isn't configured." }, { status: 500 });
  }

  const formData = await request.formData();
  const audio = formData.get("audio");
  if (!(audio instanceof Blob) || audio.size === 0) {
    return NextResponse.json({ error: "No audio received." }, { status: 400 });
  }
  if (audio.size > MAX_AUDIO_BYTES) {
    return NextResponse.json({ error: "That recording's too long." }, { status: 413 });
  }

  const upstreamForm = new FormData();
  upstreamForm.set("model_id", "scribe_v2");
  upstreamForm.set("file", audio, `voice-note.${extensionFor(audio.type)}`);

  const upstream = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
    method: "POST",
    headers: { "xi-api-key": apiKey },
    body: upstreamForm,
  });

  if (!upstream.ok) {
    const detail = await upstream.text().catch(() => "");
    console.error("ElevenLabs transcription failed", upstream.status, detail);
    return NextResponse.json({ error: "Transcription failed." }, { status: 502 });
  }

  const data = (await upstream.json()) as { text?: string };
  return NextResponse.json({ text: data.text ?? "" });
}
