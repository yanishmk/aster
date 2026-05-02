"use client";

import { Camera, CheckCircle2, Loader2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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
  const validationMessages = slots.flatMap((slot) =>
    slot.messages.map((message) => ({
      role: slot.title,
      message,
    })),
  );

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
    <section id="scan" className="rounded-[1.25rem] bg-white p-4 shadow-[0_18px_55px_rgba(114,42,69,0.1)] ring-1 ring-[#f0ceda] sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold tracking-tight text-[#28171d]">Scan</h2>
        <span className="rounded-full bg-[#fff1f5] px-3 py-2 text-xs font-semibold text-[#b83263]">
          {completedCount}/3
        </span>
      </div>

      {!cameraOpen ? (
        <button
          className="mt-4 flex min-h-[460px] w-full flex-col items-center justify-center rounded-[1rem] border border-dashed border-[#e7b6c7] bg-[#fffafb] px-6 text-center transition hover:bg-[#fff3f7]"
          onClick={() => setCameraOpen(true)}
          type="button"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#b83263] text-white">
            <Camera size={28} />
          </span>
          <span className="mt-5 text-xl font-semibold tracking-tight text-[#28171d]">Ouvrir votre camera</span>
        </button>
      ) : null}

      {cameraOpen ? (
        <div className="mt-5 rounded-[1rem] border border-[#f2c8d7] bg-[#160d11] p-2 text-white">
          <div className="relative overflow-hidden rounded-[0.8rem] bg-black">
            <video ref={videoRef} className="aspect-[4/5] w-full scale-x-[-1] object-cover md:aspect-video" muted playsInline />
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
          <div className="mt-3 flex flex-col gap-3 text-sm text-white/75 sm:flex-row sm:items-center sm:justify-between">
            <ScanSteps slots={slots} activeRole={activeRole} />
            <span>{completedCount}/3 photos capturees</span>
          </div>
        </div>
      ) : null}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        {cameraOpen ? (
          <button
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#b83263] bg-white px-5 text-sm font-semibold text-[#b83263] transition hover:bg-[#fde8ef]"
            onClick={() => setCameraOpen(false)}
            type="button"
          >
            <X size={17} />
            Fermer
          </button>
        ) : null}
        <button
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#b83263] px-5 text-sm font-semibold text-white transition hover:bg-[#98294f] disabled:cursor-not-allowed disabled:opacity-45"
          disabled={!canAnalyze || isAnalyzing}
          onClick={onAnalyze}
          type="button"
        >
          {isAnalyzing ? <Loader2 className="animate-spin" size={17} /> : <Camera size={17} />}
          {isAnalyzing ? "Analyse" : "Analyser"}
        </button>
      </div>

      {cameraError ? (
        <p className="mt-4 rounded-xl bg-[#fff1f2] px-3 py-2 text-sm leading-5 text-[#9f1239]">{cameraError}</p>
      ) : null}

      {validationMessages.length ? (
        <div className="mt-4 space-y-2">
          {validationMessages.map((item) => (
            <p key={`${item.role}-${item.message}`} className="rounded-xl bg-[#fff1f2] px-3 py-2 text-sm leading-5 text-[#9f1239]">
              <span className="font-semibold">{item.role}:</span> {item.message}
            </p>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function GuideOverlay({ role }: { role: ImageRole }) {
  return (
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),rgba(0,0,0,0.28))]">
      {role === "closeup" ? <CloseupGuide /> : role === "side" ? <SideFaceGuide /> : <FrontFaceGuide />}
    </div>
  );
}

function FrontFaceGuide() {
  return (
    <svg
      className="absolute left-1/2 top-1/2 h-[78%] max-h-[520px] w-[48%] min-w-[210px] max-w-[360px] -translate-x-1/2 -translate-y-1/2"
      fill="none"
      preserveAspectRatio="xMidYMid meet"
      viewBox="0 0 100 140"
    >
      <path
        d="M50 12C31 12 19 29 19 57C19 93 34 126 50 131C66 126 81 93 81 57C81 29 69 12 50 12Z"
        className="drop-shadow-[0_0_18px_rgba(244,114,182,0.55)]"
        stroke="rgba(244,114,182,0.95)"
        strokeDasharray="5 4"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <path d="M30 62C38 58 44 58 49 62" stroke="rgba(251,207,232,0.82)" strokeDasharray="4 4" strokeLinecap="round" strokeWidth="1.2" />
      <path d="M51 62C57 58 64 58 72 62" stroke="rgba(251,207,232,0.82)" strokeDasharray="4 4" strokeLinecap="round" strokeWidth="1.2" />
      <path d="M50 67C47 78 47 86 50 94" stroke="rgba(251,207,232,0.68)" strokeDasharray="4 4" strokeLinecap="round" strokeWidth="1.2" />
      <path d="M39 109C46 113 55 113 62 109" stroke="rgba(251,207,232,0.72)" strokeDasharray="4 4" strokeLinecap="round" strokeWidth="1.2" />
    </svg>
  );
}

function SideFaceGuide() {
  return (
    <svg
      className="absolute left-1/2 top-1/2 h-[78%] max-h-[520px] w-[44%] min-w-[200px] max-w-[340px] -translate-x-1/2 -translate-y-1/2"
      fill="none"
      preserveAspectRatio="xMidYMid meet"
      viewBox="0 0 100 140"
    >
      <path
        d="M52 12C33 15 22 31 24 57C27 86 38 113 55 130C70 120 80 100 82 75C84 56 77 43 66 35C62 25 58 17 52 12Z"
        className="drop-shadow-[0_0_18px_rgba(244,114,182,0.55)]"
        stroke="rgba(244,114,182,0.95)"
        strokeDasharray="5 4"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path d="M59 56C65 55 70 58 73 63" stroke="rgba(251,207,232,0.82)" strokeDasharray="4 4" strokeLinecap="round" strokeWidth="1.2" />
      <path d="M71 66C82 74 82 84 70 90" stroke="rgba(251,207,232,0.72)" strokeDasharray="4 4" strokeLinecap="round" strokeWidth="1.2" />
      <path d="M56 111C64 115 71 113 76 108" stroke="rgba(251,207,232,0.7)" strokeDasharray="4 4" strokeLinecap="round" strokeWidth="1.2" />
    </svg>
  );
}

function CloseupGuide() {
  return (
    <svg
      className="absolute left-1/2 top-1/2 h-[54%] max-h-[360px] w-[58%] min-w-[250px] max-w-[520px] -translate-x-1/2 -translate-y-1/2"
      fill="none"
      preserveAspectRatio="xMidYMid meet"
      viewBox="0 0 140 100"
    >
      <rect
        className="drop-shadow-[0_0_18px_rgba(244,114,182,0.55)]"
        height="62"
        rx="20"
        stroke="rgba(244,114,182,0.95)"
        strokeDasharray="5 4"
        strokeWidth="2"
        width="98"
        x="21"
        y="19"
      />
      <path d="M42 42C58 34 82 34 98 42" stroke="rgba(251,207,232,0.72)" strokeDasharray="4 4" strokeLinecap="round" strokeWidth="1.2" />
      <path d="M42 60C59 68 82 68 99 60" stroke="rgba(251,207,232,0.72)" strokeDasharray="4 4" strokeLinecap="round" strokeWidth="1.2" />
      <path d="M70 26V74" stroke="rgba(251,207,232,0.48)" strokeDasharray="3 4" strokeLinecap="round" strokeWidth="1" />
    </svg>
  );
}

function ScanSteps({ slots, activeRole }: { slots: PhotoSlot[]; activeRole: ImageRole }) {
  return (
    <div className="flex flex-wrap gap-2">
      {slots.map((slot) => {
        const isActive = slot.role === activeRole && !slot.file;
        return (
          <span
            className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold ${
              slot.file
                ? "bg-[#d9f99d] text-[#1f3d0b]"
                : isActive
                  ? "bg-white text-[#28171d]"
                  : "bg-white/15 text-white/75"
            }`}
            key={slot.role}
          >
            {slot.file ? <CheckCircle2 size={14} /> : null}
            {slot.title}
          </span>
        );
      })}
    </div>
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
