import { useEffect, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL as string;

// Cost/latency-sensitive starting point — bump this to 10000/15000 later,
// no backend change needed (the upload size limit already has headroom).
const MAX_RECORDING_MS = 15 * 1000;

interface VoiceInputProps {
  onTranscript: (text: string) => void;
}

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type));
}

function extensionFor(mimeType: string): string {
  if (mimeType.includes("mp4")) return "mp4";
  if (mimeType.includes("ogg")) return "ogg";
  return "webm";
}

// Fire-and-forget usage tracking, same pattern as the 'telegram' visit log
// in FeedbackForm.tsx — reuses the existing app_visitors table/dashboard,
// just with different `type` values.
function logVoiceEvent(type: string) {
  fetch(`${API_URL}/app-visitors`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type }),
  }).catch(() => {});
}

export default function VoiceInput({ onTranscript }: VoiceInputProps) {
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Stop any in-flight recording if the component unmounts (e.g. form reset).
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      mediaRecorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const handleRecordingComplete = async (blob: Blob) => {
    if (blob.size === 0) {
      setError("No audio captured — please try again.");
      return;
    }
    setTranscribing(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", blob, `voice.${extensionFor(blob.type)}`);
      const res = await fetch(`${API_URL}/transcription/voice`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { transcript: string };
      if (!data.transcript) {
        setError("Didn't catch that — please try again or type instead.");
        return;
      }
      onTranscript(data.transcript);
    } catch {
      setError("Transcription failed — please try again or type instead.");
    } finally {
      setTranscribing(false);
    }
  };

  const stopRecording = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const startRecording = async () => {
    setError(null);
    logVoiceEvent("voice-click");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      logVoiceEvent("voice-recording-started");
      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || mimeType || "audio/webm",
        });
        void handleRecordingComplete(blob);
      };

      recorder.start();
      setRecording(true);
      timeoutRef.current = setTimeout(stopRecording, MAX_RECORDING_MS);
    } catch {
      setError("Microphone access denied — please allow it or type instead.");
    }
  };

  return (
    <div className="flex items-center gap-2 min-w-0">
      <button
        type="button"
        onClick={recording ? stopRecording : () => void startRecording()}
        disabled={transcribing}
        aria-label={recording ? "Stop recording" : "Record voice feedback"}
        className={`flex-none flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] md:text-xs font-medium border transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
          recording
            ? "bg-red-50 border-red-300 text-red-600"
            : "bg-[#fef7f2] border-[#f5d8c8] text-[#b1603a] hover:border-[#e0b79c]"
        }`}
      >
        {recording ? (
          <Square className="w-3 h-3" />
        ) : (
          <Mic className="w-3.5 h-3.5" />
        )}
        {transcribing ? (
          "Transcribing…"
        ) : recording ? (
          "Recording…"
        ) : (
          <>
            Voice
            <span className="text-[8px] md:text-[9px] font-bold uppercase tracking-wide text-[#b1603a] bg-[#f6e7dc] rounded-full px-1 py-0.5">
              Beta
            </span>
          </>
        )}
      </button>
      {error && (
        <span className="text-red-500 text-[11px] md:text-xs truncate">
          {error}
        </span>
      )}
    </div>
  );
}
