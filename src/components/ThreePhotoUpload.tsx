"use client";

import { Camera, CheckCircle2, Sparkles, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { ImageRole, PhotoSlot } from "@/types/aster";

type ThreePhotoUploadProps = {
  slots: PhotoSlot[];
  isAnalyzing: boolean;
  canAnalyze: boolean;
  onPhotoChange: (role: ImageRole, file: File) => void;
  onAnalyze: () => void;
  onCaptureComplete: () => void;
  variant?: "default" | "hero";
};

type CameraQuality = {
  ready: boolean;
  message: string;
  detail?: string;
  progress?: number;
};

const ROLE_ORDER: ImageRole[] = ["front", "closeup", "side"];
const AUTO_CAPTURE_MS = 2100;
const CLOSEUP_ZOOM = 1.55;
const MIN_LIGHT = 58;
const MAX_LIGHT = 226;
const MIN_CONTRAST = 16;
const MIN_BLUR_SCORE = 18;
const MAX_HIGHLIGHT_RATIO = 0.07;
const MAX_SHADOW_RATIO = 0.18;

export function ThreePhotoUpload({
  slots,
  isAnalyzing,
  canAnalyze,
  onPhotoChange,
  onAnalyze,
  onCaptureComplete,
  variant = "default",
}: ThreePhotoUploadProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const readySinceRef = useRef<number | null>(null);
  const capturedRoleRef = useRef<ImageRole | null>(null);
  const completionNotifiedRef = useRef(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [quality, setQuality] = useState<CameraQuality>({
    ready: false,
    message: "Open the camera to start the guided scan.",
    progress: 0,
  });
  const [holdProgress, setHoldProgress] = useState(0);
  const [cameraZoomApplied, setCameraZoomApplied] = useState(false);

  const firstMissingSlot = useMemo(() => slots.find((slot) => !slot.file) ?? null, [slots]);
  const activeRole = firstMissingSlot?.role ?? "side";
  const activeSlot = useMemo(
    () => slots.find((slot) => slot.role === activeRole) ?? slots[0],
    [activeRole, slots],
  );
  const completedCount = slots.filter((slot) => slot.file).length;
  const scanComplete = completedCount === ROLE_ORDER.length;
  const isHero = variant === "hero";
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

    const zoom = role === "closeup" && !cameraZoomApplied ? CLOSEUP_ZOOM : 1;
    canvas.width = Math.round(video.videoWidth / zoom);
    canvas.height = Math.round(video.videoHeight / zoom);
    const context = canvas.getContext("2d");
    if (!context) return;

    drawVideoFrame(context, video, canvas.width, canvas.height, zoom);
    const finalQuality = validateCapturedFrame(canvas, role);
    if (!finalQuality.ready) {
      readySinceRef.current = null;
      capturedRoleRef.current = null;
      setQuality(finalQuality);
      return;
    }

    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `aster-${role}-${Date.now()}.jpg`, { type: "image/jpeg" });
      onPhotoChange(role, file);
    }, "image/jpeg", 0.92);
  }, [cameraZoomApplied, onPhotoChange]);

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
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            frameRate: { ideal: 30 },
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
        const zoomApplied = await applyCameraZoom(stream, activeRole);
        setCameraZoomApplied(zoomApplied);
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
  }, [activeRole, cameraOpen, stopCamera]);

  useEffect(() => {
    if (!cameraOpen || !streamRef.current) return;

    let cancelled = false;
    applyCameraZoom(streamRef.current, activeRole).then((zoomApplied) => {
      if (!cancelled) setCameraZoomApplied(zoomApplied);
    });

    return () => {
      cancelled = true;
    };
  }, [activeRole, cameraOpen]);

  useEffect(() => {
    if (!cameraOpen) return;

    const interval = window.setInterval(() => {
      const currentQuality = checkCameraQuality(videoRef.current, canvasRef.current, activeRole);
      setQuality(currentQuality);

      if (!currentQuality.ready) {
        readySinceRef.current = null;
        capturedRoleRef.current = null;
        setHoldProgress(0);
        return;
      }

      readySinceRef.current ??= Date.now();
      const stableFor = Date.now() - readySinceRef.current;
      setHoldProgress(Math.min(stableFor / AUTO_CAPTURE_MS, 1));
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

  useEffect(() => {
    if (!isAnalyzing) return;
    stopCamera();
    window.setTimeout(() => setCameraOpen(false), 0);
  }, [isAnalyzing, stopCamera]);

  useEffect(() => {
    if (!scanComplete) {
      completionNotifiedRef.current = false;
      return;
    }

    if (completionNotifiedRef.current) return;
    completionNotifiedRef.current = true;
    stopCamera();
    window.setTimeout(() => setCameraOpen(false), 0);
    onCaptureComplete();
  }, [onCaptureComplete, scanComplete, stopCamera]);

  if (isAnalyzing) {
    return (
      <div className={isHero ? "hero-scan-panel" : "bg-white p-4 sm:p-5"}>
        <AnalyzingLogo />
      </div>
    );
  }

  return (
    <div className={isHero ? "hero-scan-panel" : "bg-white p-4 sm:p-5"}>
      {!isHero ? (
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>Skin scan</h2>
          <span
            className="rounded-full px-3 py-1 text-xs font-bold"
            style={{ background: "var(--accent-light)", color: "var(--accent)" }}
          >
            {completedCount ? `${completedCount} ready` : "Ready"}
          </span>
        </div>
      ) : null}

      {!cameraOpen ? (
        isHero ? (
          <HeroScanLogoButton onClick={() => setCameraOpen(true)} />
        ) : (
          <button
            className="flex min-h-[260px] w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 text-center transition-all sm:min-h-[320px]"
            style={{ borderColor: "var(--border)", background: "var(--bg-alt)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--accent)";
              e.currentTarget.style.background = "var(--accent-light)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.background = "var(--bg-alt)";
            }}
            onClick={() => setCameraOpen(true)}
            type="button"
          >
            <span
              className="flex h-14 w-14 items-center justify-center rounded-xl text-white"
              style={{ background: "var(--grad)" }}
            >
              <Camera size={26} />
            </span>
            <span className="mt-4 text-lg font-bold" style={{ color: "var(--text)" }}>
              Ouvrir votre camera
            </span>
          </button>
        )
      ) : null}

      {cameraOpen ? (
        <div className="mt-4 overflow-hidden rounded-xl bg-black">
          <div className="relative">
            <video
              ref={videoRef}
              className="aspect-[4/5] w-full object-cover transition-transform duration-500 md:aspect-video"
              muted
              playsInline
              style={{
                transform:
                  activeRole === "closeup" && !cameraZoomApplied
                    ? `scaleX(-1) scale(${CLOSEUP_ZOOM})`
                    : "scaleX(-1)",
              }}
            />
            <GuideOverlay role={activeRole} />
            <CaptureProgress progress={holdProgress} ready={quality.ready} />
            <div className="absolute left-3 right-3 top-3 flex items-start justify-between gap-3">
              <div className="rounded-xl bg-black/60 px-3 py-2 backdrop-blur-sm">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-white/60">
                  Step {ROLE_ORDER.indexOf(activeRole) + 1}
                </p>
                <p className="text-sm font-bold text-white">{activeSlot.title}</p>
              </div>
              <span
                className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                  quality.ready ? "bg-lime-200 text-lime-900" : "bg-white/90 text-red-800"
                }`}
              >
                {quality.ready ? "Hold still" : "Adjust"}
              </span>
            </div>
            <div className="absolute bottom-3 left-3 right-3 rounded-xl bg-black/60 px-4 py-2.5 text-center text-sm text-white backdrop-blur-sm">
              <p className="font-semibold">{quality.message}</p>
              {quality.detail ? <p className="mt-1 text-xs text-white/65">{quality.detail}</p> : null}
            </div>
          </div>
          <canvas ref={canvasRef} className="hidden" />
          <div className="flex flex-col gap-3 bg-neutral-900 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
            <ScanSteps slots={slots} activeRole={activeRole} />
            <span className="text-white/50 text-xs">{completedCount ? `${completedCount} captured` : "Start"}</span>
          </div>
        </div>
      ) : null}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        {cameraOpen ? (
          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border px-5 text-sm font-semibold transition-colors"
            style={{ borderColor: "var(--accent-border)", color: "var(--accent)", background: "white" }}
            onClick={() => setCameraOpen(false)}
            type="button"
          >
            <X size={16} />
            Fermer
          </button>
        ) : null}
        <button
          className="btn-grad inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
          disabled={!canAnalyze || isAnalyzing}
          onClick={onAnalyze}
          type="button"
        >
          {isAnalyzing ? <Sparkles size={16} /> : <Camera size={16} />}
          {isAnalyzing ? "Analyse en cours..." : "Analyser ma peau"}
        </button>
      </div>

      {cameraError ? (
        <p
          className="mt-4 rounded-lg px-3 py-2.5 text-sm"
          style={{ background: "#fff1f2", border: "1px solid #fecdd3", color: "#9f1239" }}
        >
          {cameraError}
        </p>
      ) : null}

      {validationMessages.length ? (
        <div className="mt-4 space-y-2">
          {validationMessages.map((item) => (
            <p
              key={`${item.role}-${item.message}`}
              className="rounded-lg px-3 py-2.5 text-sm"
              style={{ background: "#fff1f2", border: "1px solid #fecdd3", color: "#9f1239" }}
            >
              <span className="font-bold">{item.role}:</span> {item.message}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function HeroScanLogoButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      aria-label="Open Aster camera scan"
      className="aster-scan-logo group"
      onClick={onClick}
      type="button"
    >
      <span className="aster-scan-pulse" />
      <svg aria-hidden="true" className="aster-scan-flower h-full w-full" fill="none" viewBox="0 0 420 420">
        <defs>
          <linearGradient id="asterPetalMain" x1="72" x2="348" y1="64" y2="356">
            <stop offset="0%" stopColor="#f59abc" />
            <stop offset="48%" stopColor="#dc3c7d" />
            <stop offset="100%" stopColor="#8f244d" />
          </linearGradient>
          <linearGradient id="asterPetalSoft" x1="90" x2="330" y1="84" y2="340">
            <stop offset="0%" stopColor="#ffd5e3" />
            <stop offset="100%" stopColor="#d84b86" />
          </linearGradient>
        </defs>
        <path d="M210 196C176 142 176 81 210 54C244 81 244 142 210 196Z" fill="url(#asterPetalMain)" />
        <path d="M224 204C278 170 339 170 366 210C339 244 278 244 224 216Z" fill="url(#asterPetalMain)" />
        <path d="M210 224C244 278 244 339 210 366C176 339 176 278 210 224Z" fill="url(#asterPetalMain)" />
        <path d="M196 216C142 250 81 250 54 210C81 176 142 176 196 204Z" fill="url(#asterPetalSoft)" />
        <path d="M224 190C244 129 285 95 332 102C332 156 285 190 224 204Z" fill="#df6b9a" />
        <path d="M230 230C291 244 325 285 318 332C264 332 230 291 216 230Z" fill="#b83263" />
        <path d="M190 230C176 291 135 325 88 318C88 264 135 230 204 216Z" fill="#f1a9c4" />
        <path d="M190 190C129 176 95 135 102 88C156 88 190 135 204 196Z" fill="#f7cade" />
        <circle cx="210" cy="210" fill="#fff8fa" r="54" />
      </svg>
      <span className="aster-camera-center">
        <Camera size={34} />
      </span>
    </button>
  );
}

function AnalyzingLogo() {
  return (
    <div className="aster-analyzing-panel">
      <div className="aster-analyzing-logo" aria-hidden="true">
        <span className="aster-analyzing-pulse" />
        <svg className="aster-analyzing-flower" fill="none" viewBox="0 0 420 420">
          <defs>
            <linearGradient id="asterAnalyzeMain" x1="72" x2="348" y1="64" y2="356">
              <stop offset="0%" stopColor="#f59abc" />
              <stop offset="48%" stopColor="#dc3c7d" />
              <stop offset="100%" stopColor="#8f244d" />
            </linearGradient>
            <linearGradient id="asterAnalyzeSoft" x1="90" x2="330" y1="84" y2="340">
              <stop offset="0%" stopColor="#ffd5e3" />
              <stop offset="100%" stopColor="#d84b86" />
            </linearGradient>
          </defs>
          <path d="M210 196C176 142 176 81 210 54C244 81 244 142 210 196Z" fill="url(#asterAnalyzeMain)" />
          <path d="M224 204C278 170 339 170 366 210C339 244 278 244 224 216Z" fill="url(#asterAnalyzeMain)" />
          <path d="M210 224C244 278 244 339 210 366C176 339 176 278 210 224Z" fill="url(#asterAnalyzeMain)" />
          <path d="M196 216C142 250 81 250 54 210C81 176 142 176 196 204Z" fill="url(#asterAnalyzeSoft)" />
          <path d="M224 190C244 129 285 95 332 102C332 156 285 190 224 204Z" fill="#df6b9a" />
          <path d="M230 230C291 244 325 285 318 332C264 332 230 291 216 230Z" fill="#b83263" />
          <path d="M190 230C176 291 135 325 88 318C88 264 135 230 204 216Z" fill="#f1a9c4" />
          <path d="M190 190C129 176 95 135 102 88C156 88 190 135 204 196Z" fill="#f7cade" />
          <circle cx="210" cy="210" fill="#fff8fa" r="54" />
        </svg>
        <span className="aster-analyzing-center">
          Analyzing
        </span>
      </div>
    </div>
  );
}

function GuideOverlay({ role }: { role: ImageRole }) {
  return (
    <div className="pointer-events-none absolute inset-0 bg-black/[0.01]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_38%,rgba(0,0,0,0.14)_100%)]" />
      {role === "closeup" ? <CloseupGuide /> : role === "side" ? <SideFaceGuide /> : <FrontFaceGuide />}
    </div>
  );
}

function CaptureProgress({ progress, ready }: { progress: number; ready: boolean }) {
  const clamped = Math.min(Math.max(progress, 0), 1);

  return (
    <div className="pointer-events-none absolute right-4 top-1/2 h-28 w-1.5 -translate-y-1/2 overflow-hidden rounded-full bg-white/20">
      <div
        className="absolute bottom-0 left-0 w-full rounded-full transition-all duration-200"
        style={{
          height: `${clamped * 100}%`,
          background: ready ? "linear-gradient(180deg, #bbf7d0 0%, #16a34a 100%)" : "rgba(255,255,255,0.35)",
        }}
      />
    </div>
  );
}

function FrontFaceGuide() {
  return (
    <svg
      className="absolute left-1/2 top-1/2 h-[78%] max-h-[520px] w-[50%] min-w-[220px] max-w-[360px] -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_0_18px_rgba(34,211,238,0.22)]"
      fill="none"
      preserveAspectRatio="xMidYMid meet"
      viewBox="0 0 100 140"
    >
      <defs>
        <clipPath id="frontFaceMeshClip">
          <path d="M50 12C30 12 18 30 18 58C18 93 34 126 50 132C66 126 82 93 82 58C82 30 70 12 50 12Z" />
        </clipPath>
      </defs>
      <g clipPath="url(#frontFaceMeshClip)" opacity="0.74">
        <path d="M50 12V132M18 58H82M27 32H73M27 100H73" stroke="rgba(255,255,255,0.38)" strokeWidth="0.65" />
        <path d="M18 58L50 12L82 58L50 132L18 58ZM27 32L50 70L73 32M27 100L50 70L73 100M27 32L27 100M73 32L73 100" stroke="rgba(34,211,238,0.42)" strokeWidth="0.75" />
        <path d="M18 58L37 58L50 70L63 58L82 58M37 58L27 100M63 58L73 100M37 58L50 12M63 58L50 12" stroke="rgba(255,255,255,0.42)" strokeWidth="0.65" />
      </g>
      <path d="M50 12C30 12 18 30 18 58C18 93 34 126 50 132C66 126 82 93 82 58C82 30 70 12 50 12Z" stroke="rgba(34,211,238,0.9)" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}

function SideFaceGuide() {
  return (
    <svg
      className="absolute left-1/2 top-1/2 h-[78%] max-h-[520px] w-[50%] min-w-[220px] max-w-[360px] -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_0_18px_rgba(34,211,238,0.22)]"
      fill="none"
      preserveAspectRatio="xMidYMid meet"
      viewBox="0 0 100 140"
    >
      <defs>
        <clipPath id="sideFaceMeshClip">
          <path d="M45 13C29 18 20 36 22 61C25 92 40 121 56 132C72 118 80 96 81 72C82 49 70 27 45 13Z" />
        </clipPath>
      </defs>
      <g clipPath="url(#sideFaceMeshClip)" opacity="0.74">
        <path d="M45 13L56 132M22 61H81M29 35H72M36 100H72" stroke="rgba(255,255,255,0.38)" strokeWidth="0.65" />
        <path d="M45 13L22 61L56 132L81 72L45 13ZM29 35L53 70L72 40M36 100L53 70L72 100M29 35L36 100M72 40L72 100" stroke="rgba(34,211,238,0.42)" strokeWidth="0.75" />
        <path d="M22 61L43 61L53 70L66 62L81 72M43 61L36 100M66 62L72 100M43 61L45 13M66 62L45 13" stroke="rgba(255,255,255,0.42)" strokeWidth="0.65" />
      </g>
      <path d="M45 13C29 18 20 36 22 61C25 92 40 121 56 132C72 118 80 96 81 72C82 49 70 27 45 13Z" stroke="rgba(34,211,238,0.9)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

function CloseupGuide() {
  return (
    <svg
      className="absolute left-1/2 top-1/2 h-[58%] max-h-[380px] w-[60%] min-w-[250px] max-w-[520px] -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_0_18px_rgba(34,211,238,0.2)]"
      fill="none"
      preserveAspectRatio="xMidYMid meet"
      viewBox="0 0 140 100"
    >
      <defs>
        <clipPath id="skinPatchMeshClip">
          <path d="M30 24C48 12 92 12 110 24C126 36 127 65 110 78C92 92 49 92 30 78C13 65 14 36 30 24Z" />
        </clipPath>
      </defs>
      <g clipPath="url(#skinPatchMeshClip)" opacity="0.82">
        <path d="M18 50H122M30 24L70 52L110 24M30 78L70 52L110 78M30 24L30 78M110 24L110 78M50 18L70 52L90 18M50 86L70 52L90 86" stroke="rgba(34,211,238,0.42)" strokeWidth="0.75" />
        <path d="M70 13V92M44 20L52 82M96 20L88 82" stroke="rgba(255,255,255,0.38)" strokeWidth="0.65" />
      </g>
      <path d="M30 24C48 12 92 12 110 24C126 36 127 65 110 78C92 92 49 92 30 78C13 65 14 36 30 24Z" stroke="rgba(34,211,238,0.9)" strokeLinecap="round" strokeWidth="2.1" />
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
  const zoom = role === "closeup" ? CLOSEUP_ZOOM : 1;
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return { ready: false, message: "Camera is starting..." };

  drawVideoFrame(context, video, width, height, zoom);
  const data = context.getImageData(0, 0, width, height).data;
  const metrics = getFrameMetrics(data, width, height);

  if (metrics.brightness < MIN_LIGHT) {
    return {
      ready: false,
      message: "Lighting is too low.",
      detail: "Face a window or use a bright neutral lamp.",
      progress: 0,
    };
  }
  if (metrics.brightness > MAX_LIGHT || metrics.highlightRatio > MAX_HIGHLIGHT_RATIO) {
    return {
      ready: false,
      message: "Lighting is overexposed.",
      detail: "Avoid direct sun or bright reflections on skin.",
      progress: 0,
    };
  }
  if (metrics.shadowRatio > MAX_SHADOW_RATIO) {
    return {
      ready: false,
      message: "There are heavy shadows.",
      detail: "Turn toward even light and avoid side shadows.",
      progress: 0,
    };
  }
  if (metrics.contrast < MIN_CONTRAST) {
    return {
      ready: false,
      message: "Lighting looks flat.",
      detail: "Use more even light without filters.",
      progress: 0,
    };
  }
  if (metrics.skinRatio < (role === "closeup" ? 0.055 : 0.012)) {
    return {
      ready: false,
      message: role === "closeup" ? "Move closer to your skin." : "Place your face inside the guide.",
      detail: role === "closeup" ? "Fill the pink frame with one cheek or forehead area." : "Keep your face centered.",
      progress: 0,
    };
  }
  if (role === "front" && metrics.centerSkinRatio < 0.01) {
    return {
      ready: false,
      message: "Center your face.",
      detail: "Keep your face in the middle of the outline.",
      progress: 0,
    };
  }
  if (role === "side" && metrics.centerSkinRatio < 0.008) {
    return {
      ready: false,
      message: "Keep your cheek in frame.",
      detail: "Turn slightly, but keep skin centered.",
      progress: 0,
    };
  }
  if (role === "closeup" && metrics.skinRatio > 0.62) {
    return {
      ready: false,
      message: "Move back slightly.",
      detail: "Aster needs texture and a little surrounding skin.",
      progress: 0,
    };
  }
  if (metrics.blurScore < MIN_BLUR_SCORE) {
    return {
      ready: false,
      message: "Image is blurry.",
      detail: "Hold the camera steady until the green bar fills.",
      progress: 0,
    };
  }

  const roleMessage = {
    front: "Quality looks good. Hold still for capture.",
    closeup: "Texture looks readable. Hold still for capture.",
    side: "Side angle looks good. Hold still for capture.",
  };
  const roleDetail = {
    front: "No filter, neutral light, face centered.",
    closeup: "Keep one cheek or forehead area inside the frame.",
    side: "Keep the cheek and jaw area visible.",
  };

  return { ready: true, message: roleMessage[role], detail: roleDetail[role], progress: 1 };
}

function validateCapturedFrame(canvas: HTMLCanvasElement, role: ImageRole): CameraQuality {
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context || !canvas.width || !canvas.height) {
    return { ready: false, message: "Camera is starting..." };
  }

  const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
  const metrics = getFrameMetrics(data, canvas.width, canvas.height);

  if (metrics.brightness < MIN_LIGHT) {
    return { ready: false, message: "Lighting is too low. Please retake this photo." };
  }
  if (metrics.brightness > MAX_LIGHT || metrics.highlightRatio > MAX_HIGHLIGHT_RATIO) {
    return { ready: false, message: "Lighting is overexposed. Please retake this photo." };
  }
  if (metrics.shadowRatio > MAX_SHADOW_RATIO) {
    return { ready: false, message: "There are heavy shadows. Please retake this photo." };
  }
  if (metrics.contrast < MIN_CONTRAST) {
    return { ready: false, message: "Lighting is too flat. Please retake this photo." };
  }
  if (metrics.skinRatio < (role === "closeup" ? 0.055 : 0.012)) {
    return { ready: false, message: "Face or skin is not visible. Please try again." };
  }
  if ((role === "front" && metrics.centerSkinRatio < 0.01) || (role === "side" && metrics.centerSkinRatio < 0.008)) {
    return { ready: false, message: "Face is not centered. Please try again." };
  }
  if (role === "closeup" && metrics.skinRatio > 0.62) {
    return { ready: false, message: "Image is too close. Please move back slightly." };
  }
  if (metrics.blurScore < MIN_BLUR_SCORE) {
    return { ready: false, message: "Image is blurry. Please hold the camera steady." };
  }

  return { ready: true, message: "Photo captured." };
}

function drawVideoFrame(
  context: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  targetWidth: number,
  targetHeight: number,
  zoom = 1,
) {
  const sourceWidth = video.videoWidth / zoom;
  const sourceHeight = video.videoHeight / zoom;
  const sourceX = (video.videoWidth - sourceWidth) / 2;
  const sourceY = (video.videoHeight - sourceHeight) / 2;

  context.drawImage(
    video,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    targetWidth,
    targetHeight,
  );
}

async function applyCameraZoom(stream: MediaStream, role: ImageRole) {
  const videoTrack = stream.getVideoTracks()[0];
  if (!videoTrack) return false;

  const capabilities = videoTrack.getCapabilities() as MediaTrackCapabilities & {
    exposureMode?: string[];
    focusMode?: string[];
    whiteBalanceMode?: string[];
    zoom?: { min?: number; max?: number; step?: number };
  };

  const advanced: MediaTrackConstraintSet[] = [];

  if (capabilities.focusMode?.includes("continuous")) {
    advanced.push({ focusMode: "continuous" } as MediaTrackConstraintSet);
  }
  if (capabilities.exposureMode?.includes("continuous")) {
    advanced.push({ exposureMode: "continuous" } as MediaTrackConstraintSet);
  }
  if (capabilities.whiteBalanceMode?.includes("continuous")) {
    advanced.push({ whiteBalanceMode: "continuous" } as MediaTrackConstraintSet);
  }

  let zoomApplied = false;
  if (capabilities.zoom) {
    const minZoom = capabilities.zoom.min ?? 1;
    const maxZoom = capabilities.zoom.max ?? 1;
    const requestedZoom = role === "closeup" ? CLOSEUP_ZOOM : minZoom;
    const zoom = Math.min(Math.max(requestedZoom, minZoom), maxZoom);
    advanced.push({ zoom } as MediaTrackConstraintSet);
    zoomApplied = role === "closeup" && zoom > minZoom;
  }

  if (!advanced.length) return false;

  try {
    await videoTrack.applyConstraints({ advanced });
    return zoomApplied;
  } catch {
    return false;
  }
}

function getFrameMetrics(data: Uint8ClampedArray, width: number, height: number) {
  const gray = new Float32Array(width * height);
  let brightness = 0;
  let contrastSeed = 0;
  let skinPixels = 0;
  let centerSkinPixels = 0;
  let centerPixels = 0;
  let highlightPixels = 0;
  let shadowPixels = 0;
  const pixels = width * height;
  const centerLeft = Math.round(width * 0.22);
  const centerRight = Math.round(width * 0.78);
  const centerTop = Math.round(height * 0.18);
  const centerBottom = Math.round(height * 0.82);

  for (let pixel = 0, dataIndex = 0; pixel < pixels; pixel += 1, dataIndex += 4) {
    const x = pixel % width;
    const y = Math.floor(pixel / width);
    const red = data[dataIndex];
    const green = data[dataIndex + 1];
    const blue = data[dataIndex + 2];
    const light = red * 0.299 + green * 0.587 + blue * 0.114;
    gray[pixel] = light;
    brightness += light;
    contrastSeed += light * light;

    if (light > 245) highlightPixels += 1;
    if (light < 35) shadowPixels += 1;

    const isSkin = red > 55 && green > 35 && blue > 25 && red > green && green > blue && red - blue > 15;
    if (isSkin) {
      skinPixels += 1;
    }
    if (x >= centerLeft && x <= centerRight && y >= centerTop && y <= centerBottom) {
      centerPixels += 1;
      if (isSkin) centerSkinPixels += 1;
    }
  }

  brightness /= pixels;
  const contrast = Math.sqrt(Math.max(contrastSeed / pixels - brightness * brightness, 0));

  return {
    brightness,
    contrast,
    skinRatio: skinPixels / pixels,
    centerSkinRatio: centerPixels ? centerSkinPixels / centerPixels : 0,
    highlightRatio: highlightPixels / pixels,
    shadowRatio: shadowPixels / pixels,
    blurScore: getBlurScore(gray, width, height),
  };
}

function getBlurScore(gray: Float32Array, width: number, height: number) {
  let sum = 0;
  let sumSquares = 0;
  let count = 0;

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const index = y * width + x;
      const laplacian =
        gray[index - width] +
        gray[index - 1] -
        gray[index] * 4 +
        gray[index + 1] +
        gray[index + width];
      sum += laplacian;
      sumSquares += laplacian * laplacian;
      count += 1;
    }
  }

  if (!count) return 0;
  const mean = sum / count;
  return sumSquares / count - mean * mean;
}
