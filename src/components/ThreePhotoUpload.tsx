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
};

type CameraQuality = {
  ready: boolean;
  message: string;
  detail?: string;
  progress?: number;
};

const ROLE_ORDER: ImageRole[] = ["front", "closeup", "side"];
const AUTO_CAPTURE_MS = 1400;
const CLOSEUP_ZOOM = 1.55;

export function ThreePhotoUpload({
  slots,
  isAnalyzing,
  canAnalyze,
  onPhotoChange,
  onAnalyze,
  onCaptureComplete,
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
      <div className="bg-white p-4 sm:p-5">
        <AnalyzingLogo />
      </div>
    );
  }

  return (
    <div className="bg-white p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>Skin scan</h2>
        <span
          className="rounded-full px-3 py-1 text-xs font-bold"
          style={{ background: "var(--accent-light)", color: "var(--accent)" }}
        >
          {completedCount ? `${completedCount} ready` : "Ready"}
        </span>
      </div>

      {!cameraOpen ? (
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
          <Sparkles size={28} />
        </span>
      </div>
      <p className="mt-5 text-sm font-black uppercase tracking-[0.22em]" style={{ color: "var(--accent)" }}>
        Analyzing
      </p>
    </div>
  );
}

function GuideOverlay({ role }: { role: ImageRole }) {
  return (
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),rgba(0,0,0,0.28))]">
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
          background: ready ? "linear-gradient(180deg, #f9a8d4 0%, #f0277b 100%)" : "rgba(255,255,255,0.35)",
        }}
      />
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
  const zoom = role === "closeup" ? CLOSEUP_ZOOM : 1;
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return { ready: false, message: "Camera is starting..." };

  drawVideoFrame(context, video, width, height, zoom);
  const data = context.getImageData(0, 0, width, height).data;
  const metrics = getFrameMetrics(data, width, height);

  if (metrics.brightness < 52) {
    return {
      ready: false,
      message: "Lighting is too low.",
      detail: "Move closer to a window or soft light.",
      progress: 0,
    };
  }
  if (metrics.brightness > 235) {
    return {
      ready: false,
      message: "Lighting is too bright.",
      detail: "Turn slightly away from direct light.",
      progress: 0,
    };
  }
  if (metrics.contrast < 13) {
    return {
      ready: false,
      message: "Lighting looks flat.",
      detail: "Face a window or use softer light.",
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
  if (role === "closeup" && metrics.skinRatio > 0.72) {
    return {
      ready: false,
      message: "Move back slightly.",
      detail: "Aster needs texture and a little surrounding skin.",
      progress: 0,
    };
  }
  if (metrics.blurScore < 10) {
    return {
      ready: false,
      message: "Image is blurry.",
      detail: "Hold the camera steady for one second.",
      progress: 0,
    };
  }

  const roleMessage = {
    front: "Great. Keep your face centered, photo will capture automatically.",
    closeup: "Great. Hold the camera close to one cheek, photo will capture automatically.",
    side: "Great. Hold this side angle, photo will capture automatically.",
  };
  const roleDetail = {
    front: "Look straight ahead and keep still.",
    closeup: "Keep the skin area inside the pink frame.",
    side: "Turn slightly and keep your cheek visible.",
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

  if (metrics.brightness < 52) {
    return { ready: false, message: "Lighting is too low. Please retake this photo." };
  }
  if (metrics.brightness > 235) {
    return { ready: false, message: "Lighting is too bright. Please retake this photo." };
  }
  if (metrics.contrast < 13) {
    return { ready: false, message: "Lighting is too flat. Please retake this photo." };
  }
  if (metrics.skinRatio < (role === "closeup" ? 0.055 : 0.012)) {
    return { ready: false, message: "Face or skin is not visible. Please try again." };
  }
  if (role === "closeup" && metrics.skinRatio > 0.72) {
    return { ready: false, message: "Image is too close. Please move back slightly." };
  }
  if (metrics.blurScore < 12) {
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
    zoom?: { min?: number; max?: number; step?: number };
  };

  if (!capabilities.zoom) return false;

  const minZoom = capabilities.zoom.min ?? 1;
  const maxZoom = capabilities.zoom.max ?? 1;
  const requestedZoom = role === "closeup" ? CLOSEUP_ZOOM : minZoom;
  const zoom = Math.min(Math.max(requestedZoom, minZoom), maxZoom);

  try {
    await videoTrack.applyConstraints({
      advanced: [{ zoom } as MediaTrackConstraintSet],
    });
    return role === "closeup" && zoom > minZoom;
  } catch {
    return false;
  }
}

function getFrameMetrics(data: Uint8ClampedArray, width: number, height: number) {
  const gray = new Float32Array(width * height);
  let brightness = 0;
  let contrastSeed = 0;
  let skinPixels = 0;
  const pixels = width * height;

  for (let pixel = 0, dataIndex = 0; pixel < pixels; pixel += 1, dataIndex += 4) {
    const red = data[dataIndex];
    const green = data[dataIndex + 1];
    const blue = data[dataIndex + 2];
    const light = red * 0.299 + green * 0.587 + blue * 0.114;
    gray[pixel] = light;
    brightness += light;
    contrastSeed += light * light;

    if (red > 55 && green > 35 && blue > 25 && red > green && green > blue && red - blue > 15) {
      skinPixels += 1;
    }
  }

  brightness /= pixels;
  const contrast = Math.sqrt(Math.max(contrastSeed / pixels - brightness * brightness, 0));

  return {
    brightness,
    contrast,
    skinRatio: skinPixels / pixels,
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
