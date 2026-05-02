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
    <section id="scan" className="rounded-[1.75rem] border border-[#f2c8d7] bg-white/80 p-4 shadow-[0_24px_70px_rgba(114,42,69,0.12)] sm:p-5">
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-sm font-medium text-[#8f5f70]">Guided scan</p>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight text-[#28171d]">Ouvrir votre camera</h2>
          <p className="mt-2 text-sm leading-6 text-[#8f5f70]">
            Aster vous guide pour prendre automatiquement les 3 photos necessaires.
          </p>
        </div>

        {!cameraOpen ? (
          <button
            className="flex min-h-[360px] flex-col items-center justify-center rounded-[1.35rem] border border-dashed border-[#e6aabd] bg-[#fff8fa] px-6 text-center transition hover:bg-[#fde8ef]"
            onClick={() => setCameraOpen(true)}
            type="button"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#b83263] text-white">
              <Camera size={28} />
            </span>
            <span className="mt-5 text-2xl font-semibold tracking-tight text-[#28171d]">Ouvrir votre camera</span>
            <span className="mt-2 max-w-sm text-sm leading-6 text-[#8f5f70]">
              Placez votre visage dans le schema. La photo se prend automatiquement quand le cadrage et la lumiere sont bons.
            </span>
          </button>
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row">
          {cameraOpen ? (
            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#b83263] bg-white px-5 text-sm font-semibold text-[#b83263] transition hover:bg-[#fde8ef]"
              onClick={() => setCameraOpen(false)}
              type="button"
            >
              <X size={17} />
              Fermer la camera
            </button>
          ) : null}
          <button
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#b83263] px-5 text-sm font-semibold text-white transition hover:bg-[#98294f] disabled:cursor-not-allowed disabled:opacity-45"
            disabled={!canAnalyze || isAnalyzing}
            onClick={onAnalyze}
            type="button"
          >
            {isAnalyzing ? <Loader2 className="animate-spin" size={17} /> : <Camera size={17} />}
            {isAnalyzing ? "Analyse en cours" : "Analyser mes photos"}
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
          <div className="mt-3 flex flex-col gap-3 text-sm text-white/75 sm:flex-row sm:items-center sm:justify-between">
            <ScanSteps slots={slots} activeRole={activeRole} />
            <span>{completedCount}/3 photos capturees</span>
          </div>
        </div>
      ) : null}

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
    <svg className="absolute inset-0 h-full w-full" fill="none" preserveAspectRatio="none" viewBox="0 0 100 100">
      <path
        d="M50 16C36 16 27 27 27 44C27 65 37 84 50 87C63 84 73 65 73 44C73 27 64 16 50 16Z"
        className="drop-shadow-[0_0_18px_rgba(255,255,255,0.35)]"
        stroke="rgba(255,255,255,0.95)"
        strokeLinecap="round"
        strokeWidth="1.4"
      />
      <path d="M35 42C40 39 44 39 48 42" stroke="rgba(255,255,255,0.72)" strokeLinecap="round" strokeWidth="0.8" />
      <path d="M52 42C56 39 61 39 65 42" stroke="rgba(255,255,255,0.72)" strokeLinecap="round" strokeWidth="0.8" />
      <path d="M50 45C48 52 48 57 50 61" stroke="rgba(255,255,255,0.55)" strokeLinecap="round" strokeWidth="0.8" />
      <path d="M43 69C48 72 53 72 58 69" stroke="rgba(255,255,255,0.58)" strokeLinecap="round" strokeWidth="0.8" />
      <path d="M24 43C20 47 20 56 25 60" stroke="rgba(255,255,255,0.55)" strokeLinecap="round" strokeWidth="0.8" />
      <path d="M76 43C80 47 80 56 75 60" stroke="rgba(255,255,255,0.55)" strokeLinecap="round" strokeWidth="0.8" />
    </svg>
  );
}

function SideFaceGuide() {
  return (
    <svg className="absolute inset-0 h-full w-full" fill="none" preserveAspectRatio="none" viewBox="0 0 100 100">
      <path
        d="M55 16C42 17 34 28 36 43C38 58 44 73 55 84C65 78 72 67 73 53C74 43 70 35 64 30C61 25 59 20 55 16Z"
        className="drop-shadow-[0_0_18px_rgba(255,255,255,0.35)]"
        stroke="rgba(255,255,255,0.95)"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.4"
      />
      <path d="M59 38C63 37 66 39 68 42" stroke="rgba(255,255,255,0.7)" strokeLinecap="round" strokeWidth="0.8" />
      <path d="M67 43C73 48 73 54 66 57" stroke="rgba(255,255,255,0.6)" strokeLinecap="round" strokeWidth="0.8" />
      <path d="M57 69C62 71 66 70 70 67" stroke="rgba(255,255,255,0.58)" strokeLinecap="round" strokeWidth="0.8" />
      <path d="M35 44C31 49 32 57 38 61" stroke="rgba(255,255,255,0.55)" strokeLinecap="round" strokeWidth="0.8" />
    </svg>
  );
}

function CloseupGuide() {
  return (
    <svg className="absolute inset-0 h-full w-full" fill="none" preserveAspectRatio="none" viewBox="0 0 100 100">
      <rect
        className="drop-shadow-[0_0_18px_rgba(255,255,255,0.35)]"
        height="46"
        rx="14"
        stroke="rgba(255,255,255,0.95)"
        strokeWidth="1.4"
        width="58"
        x="21"
        y="27"
      />
      <path d="M33 43C43 38 57 38 67 43" stroke="rgba(255,255,255,0.6)" strokeLinecap="round" strokeWidth="0.8" />
      <path d="M34 58C45 63 56 63 67 58" stroke="rgba(255,255,255,0.6)" strokeLinecap="round" strokeWidth="0.8" />
      <path d="M50 31V69" stroke="rgba(255,255,255,0.32)" strokeDasharray="2 3" strokeLinecap="round" strokeWidth="0.6" />
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
