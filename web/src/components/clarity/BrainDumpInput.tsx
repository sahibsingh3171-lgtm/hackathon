"use client";

import { useCallback, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";

import type { BrainDump } from "@/types/clarity";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function BrainDumpInput({
  value,
  onChange,
  disabled,
}: {
  value: BrainDump;
  onChange: (next: BrainDump) => void;
  disabled?: boolean;
}) {
  const [recording, setRecording] = useState(false);
  const [unsupported, setUnsupported] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const stopRecording = useCallback(() => {
    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== "inactive") mr.stop();
    setRecording(false);
    mediaRecorderRef.current = null;
  }, []);

  const startRecording = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setUnsupported(true);
      onChange({
        ...value,
        voice: { status: "unsupported" },
      });
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
        onChange({
          ...value,
          voice: {
            status: "recorded",
            durationSec: undefined,
            blobMeta: { mimeType: blob.type, size: blob.size },
          },
        });
      };
      mediaRecorderRef.current = mr;
      mr.start();
      setRecording(true);
      setUnsupported(false);
    } catch {
      setUnsupported(true);
      onChange({
        ...value,
        voice: { status: "unsupported" },
      });
    }
  }, [onChange, value]);

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Label htmlFor="brain-dump" className="text-base text-foreground">
          What’s on your mind?
        </Label>
        <Textarea
          id="brain-dump"
          disabled={disabled}
          rows={8}
          value={value.text}
          onChange={(e) => onChange({ ...value, text: e.target.value })}
          placeholder="No filters — stream of thought is welcome. You can edit before continuing."
          className="min-h-[180px] resize-y rounded-3xl border-border bg-muted/25 text-base leading-relaxed text-foreground placeholder:text-muted-foreground/60"
        />
        <p className="text-xs leading-relaxed text-muted-foreground">
          A simple local check on your words may show 988 resources in the header. It does not
          call a server for crisis detection.
        </p>
      </div>

      <div className="rounded-3xl border border-border bg-card p-6 shadow-clarity-soft">
        <p className="text-sm font-medium text-foreground">Optional voice note</p>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          For the hackathon demo, recording stores size only (no upload). Add Whisper later if
          you want transcription.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {!recording ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={startRecording}
              className="rounded-xl border-border"
            >
              <Mic className="size-4" />
              Record
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={stopRecording}
              className="rounded-xl border-destructive/30 text-destructive"
            >
              <Square className="size-3 fill-current" />
              Stop
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            onClick={() =>
              onChange({
                ...value,
                voice: { status: "skipped" },
              })
            }
          >
            Skip voice
          </Button>
        </div>
        {value.voice?.status === "recorded" ? (
          <p className={cn("mt-3 text-xs text-primary")}>
            Voice clip captured locally ({Math.round((value.voice.blobMeta?.size ?? 0) / 1024)}{" "}
            KB).
          </p>
        ) : null}
        {unsupported ? (
          <p className="mt-3 text-xs text-muted-foreground">
            Microphone unavailable in this browser — continue with text.
          </p>
        ) : null}
      </div>
    </div>
  );
}
