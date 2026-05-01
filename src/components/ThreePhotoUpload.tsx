"use client";

import { Camera, CheckCircle2, Loader2, Upload, X } from "lucide-react";
import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { ImageRole, PhotoSlot } from "@/types/aster";

type ThreePhotoUploadProps = {
  slots: PhotoSlot[];
  isAnalyzing: boolean;
  canAnalyze: boolean;
  onPhotoChange: (role: ImageRole, file: File) => void;
  onAnalyze: () => void;
};

type CameraQuality = {
  ready: boolean;
  message: string;
};

const ROLE_ORDER: ImageRole[] = ["front", "closeup", "side"];
const AUTO_CAPTURE_MS = 1400;

export function ThreePhotoUpload({
  slots,
  isAnalyzing,
  canAnalyze,
  onPhotoChange,
  onAnalyze,
}: ThreePhotoUploadProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const readySinceRef = useRef<number | null>(null);
  const capturedRoleRef = useRef<ImageRole | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [quality, setQuality] = useState<CameraQuality>({
    ready: false,
    message: "Open the camera to start the guided scan.",
  });

  const firstMissingSlot = useMemo(() => slots.find((slot) => !slot.file) ?? null, [slots]);
  const activeRole = firstMissingSlot?.role ?? "side";
  const activeSlot = useMemo(
    () => slots.find((slot) => slot.role === activeRole) ?? slots[0],
    [activeRole, slots],
  );
  const completedCount = slots.filter((slot) => slot.file).length;

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const captureCurrentFrame = useCallback((role: ImageRole) => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth || !video.videoHeight) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) return;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `aster-${role}-${Date.now()}.jpg`, { type: "image/jpeg" });
      onPhotoChange(role, file);
    }, "image/jpeg", 0.92);
  }, [onPhotoChange]);

  useEffect(() => {
    if (!cameraOpen) {
      stopCamera();
      return;
    }

    let cancelled = false;

    async function startCamera() {
      try {
        setCameraError(null);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch {
        setCameraOpen(false);
        setCameraError("Camera access is blocked. Please allow camera access or upload photos manually.");
      }
    }

    startCamera();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [cameraOpen, stopCamera]);

  useEffect(() => {
    if (!cameraOpen) return;

    const interval = window.setInterval(() => {
      const currentQuality = checkCameraQuality(videoRef.current, canvasRef.current, activeRole);
      setQuality(currentQuality);

      if (!currentQuality.ready) {
        readySinceRef.current = null;
        capturedRoleRef.current = null;
        return;
      }

      readySinceRef.current ??= Date.now();
      const stableFor = Date.now() - readySinceRef.current;
      if (stableFor < AUTO_CAPTURE_MS || capturedRoleRef.current === activeRole) return;

      capturedRoleRef.current = activeRole;
      captureCurrentFrame(activeRole);
    }, 220);

    return () => window.clearInterval(interval);
  }, [activeRole, cameraOpen, captureCurrentFrame]);

  useEffect(() => {
    readySinceRef.current = null;
    capturedRoleRef.current = null;
  }, [activeRole]);

  return (
    <section id="scan" className="rounded-[1.75rem] border border-[#f2c8d7] bg-white/80 p-4 shadow-[0_24px_70px_rgba(114,42,69,0.12)] sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-[#8f5f70]">Guided scan</p>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight text-[#28171d]">Camera-guided 3 photo scan</h2>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#b83263] bg-white px-5 text-sm font-semibold text-[#b83263] transition hover:bg-[#fde8ef]"
            onClick={() => setCameraOpen((current) => !current)}
            type="button"
          >
            {cameraOpen ? <X size={17} /> : <Camera size={17} />}
            {cameraOpen ? "Close camera" : "Open camera"}
          </button>
          <button
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#b83263] px-5 text-sm font-semibold text-white transition hover:bg-[#98294f] disabled:cursor-not-allowed disabled:opacity-45"
            disabled={!canAnalyze || isAnalyzing}
            onClick={onAnalyze}
            type="button"
          >
            {isAnalyzing ? <Loader2 className="animate-spin" size={17} /> : <Camera size={17} />}
            {isAnalyzing ? "Scanning" : "Analyze photos"}
          </button>
        </div>
      </div>

      {cameraOpen ? (
        <div className="mt-5 rounded-[1.35rem] border border-[#f2c8d7] bg-[#160d11] p-3 text-white">
          <div className="relative overflow-hidden rounded-[1.1rem] bg-black">
            <video ref={videoRef} className="aspect-[4/5] w-full object-cover md:aspect-video" muted playsInline />
            <GuideOverlay role={activeRole} />
            <div className="absolute left-3 right-3 top-3 flex items-start justify-between gap-3">
              <div className="rounded-2xl bg-black/55 px-3 py-2 backdrop-blur">
                <p className="text-xs text-white/70">Step {ROLE_ORDER.indexOf(activeRole) + 1} of 3</p>
                <p className="text-sm font-semibold">{activeSlot.title}</p>
              </div>
              <span className={`rounded-full px-3 py-2 text-xs font-semibold ${quality.ready ? "bg-[#d9f99d] text-[#1f3d0b]" : "bg-white/85 text-[#7f1d1d]"}`}>
                {quality.ready ? "Hold still" : "Adjust"}
              </span>
            </div>
            <div className="absolute bottom-3 left-3 right-3 rounded-2xl bg-black/55 px-4 py-3 text-center text-sm backdrop-blur">
              {quality.message}
            </div>
          </div>
          <canvas ref={canvasRef} className="hidden" />
          <div className="mt-3 flex items-center justify-between gap-3 text-sm text-white/75">
            <span>{completedCount}/3 photos captured</span>
            <span>Capture starts automatically when light and framing look good.</span>
          </div>
        </div>
      ) : null}

      {cameraError ? (
        <p className="mt-4 rounded-xl bg-[#fff1f2] px-3 py-2 text-sm leading-5 text-[#9f1239]">{cameraError}</p>
      ) : null}

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        {slots.map((slot) => (
          <PhotoCard key={slot.role} onPhotoChange={onPhotoChange} slot={slot} />
        ))}
      </div>
    </section>
  );
}

function GuideOverlay({ role }: { role: ImageRole }) {
  const shape =
    role === "closeup"
      ? "h-[46%] w-[58%] rounded-[2rem]"
      : role === "side"
        ? "h-[68%] w-[38%] translate-x-[18%] rounded-[50%]"
        : "h-[68%] w-[46%] rounded-[50%]";

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/15">
      <div className={`${shape} border-2 border-white/90 shadow-[0_0_0_999px_rgba(0,0,0,0.22)]`} />
    </div>
  );
}

function PhotoCard({
  slot,
  onPhotoChange,
}: {
  slot: PhotoSlot;
  onPhotoChange: (role: ImageRole, file: File) => void;
}) {
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) onPhotoChange(slot.role, file);
  }

  return (
    <article className="rounded-[1.25rem] border border-[#f2c8d7] bg-[#fff8fa] p-3">
      <div className="relative flex aspect-[4/5] items-center justify-center overflow-hidden rounded-[1rem] bg-[#f9dbe5]">
        {slot.previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt={`${slot.title} preview`} className="h-full w-full object-cover" src={slot.previewUrl} />
        ) : (
          <div className="flex flex-col items-center px-6 text-center text-sm leading-6 text-[#8f5f70]">
            <Camera className="mb-3 text-[#b83263]" size={28} />
            {slot.guidance}
          </div>
        )}
        {slot.file ? (
          <span className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#16803b] shadow-sm">
            <CheckCircle2 size={18} />
          </span>
        ) : null}
      </div>

      <div className="mt-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-[#28171d]">{slot.title}</h3>
          <p className="mt-1 text-sm leading-5 text-[#8f5f70]">{slot.guidance}</p>
        </div>
        <label className="inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-[#e6aabd] bg-white text-[#b83263] transition hover:bg-[#fde8ef]">
          <Upload size={17} />
          <input accept="image/*" capture="user" className="sr-only" type="file" onChange={handleChange} />
        </label>
      </div>

      {slot.messages.length ? (
        <div className="mt-3 space-y-2">
          {slot.messages.map((message) => (
            <p key={message} className="rounded-xl bg-[#fff1f2] px-3 py-2 text-sm leading-5 text-[#9f1239]">
              {message}
            </p>
          ))}
        </div>
      ) : null}
    </article>
  );
}

function checkCameraQuality(
  video: HTMLVideoElement | null,
  canvas: HTMLCanvasElement | null,
  role: ImageRole,
): CameraQuality {
  if (!video || !canvas || !video.videoWidth || !video.videoHeight) {
    return { ready: false, message: "Camera is starting..." };
  }

  const width = 120;
  const height = Math.max(90, Math.round((video.videoHeight / video.videoWidth) * width));
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return { ready: false, message: "Camera is starting..." };

  context.drawImage(video, 0, 0, width, height);
  const data = context.getImageData(0, 0, width, height).data;
  let brightness = 0;
  let contrastSeed = 0;
  let skinPixels = 0;
  const pixels = data.length / 4;

  for (let index = 0; index < data.length; index += 4) {
    const red = data[index];
    const green = data[index + 1];
    const blue = data[index + 2];
    const light = red * 0.299 + green * 0.587 + blue * 0.114;
    brightness += light;
    contrastSeed += light * light;

    if (red > 55 && green > 35 && blue > 25 && red > green && green > blue && red - blue > 15) {
      skinPixels += 1;
    }
  }

  brightness /= pixels;
  const contrast = Math.sqrt(Math.max(contrastSeed / pixels - brightness * brightness, 0));
  const skinRatio = skinPixels / pixels;

  if (brightness < 52) return { ready: false, message: "Lighting is too low. Move closer to soft light." };
  if (brightness > 235) return { ready: false, message: "Lighting is too bright. Reduce direct light." };
  if (contrast < 13) return { ready: false, message: "Image looks flat. Face a window or softer light." };
  if (skinRatio < (role === "closeup" ? 0.02 : 0.012)) {
    return { ready: false, message: "Place your face or skin inside the guide." };
  }

  const roleMessage = {
    front: "Great. Keep your face centered, photo will capture automatically.",
    closeup: "Great. Hold the close-up steady, photo will capture automatically.",
    side: "Great. Hold this side angle, photo will capture automatically.",
  };

  return { ready: true, message: roleMessage[role] };
}
