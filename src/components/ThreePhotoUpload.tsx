"use client";

import { Camera, CheckCircle2, Loader2, Upload } from "lucide-react";
import { ChangeEvent } from "react";

import type { ImageRole, PhotoSlot } from "@/types/aster";

type ThreePhotoUploadProps = {
  slots: PhotoSlot[];
  isAnalyzing: boolean;
  canAnalyze: boolean;
  onPhotoChange: (role: ImageRole, file: File) => void;
  onAnalyze: () => void;
};

export function ThreePhotoUpload({
  slots,
  isAnalyzing,
  canAnalyze,
  onPhotoChange,
  onAnalyze,
}: ThreePhotoUploadProps) {
  return (
    <section id="scan" className="rounded-[1.75rem] border border-[#f2c8d7] bg-white/80 p-4 shadow-[0_24px_70px_rgba(114,42,69,0.12)] sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-[#8f5f70]">Guided scan</p>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight text-[#28171d]">Add 3 clear photos</h2>
        </div>
        <button
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#b83263] px-5 text-sm font-semibold text-white transition hover:bg-[#98294f] disabled:cursor-not-allowed disabled:opacity-45"
          disabled={!canAnalyze || isAnalyzing}
          onClick={onAnalyze}
        >
          {isAnalyzing ? <Loader2 className="animate-spin" size={17} /> : <Camera size={17} />}
          {isAnalyzing ? "Scanning" : "Start Aster scan"}
        </button>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        {slots.map((slot) => (
          <PhotoCard key={slot.role} onPhotoChange={onPhotoChange} slot={slot} />
        ))}
      </div>
    </section>
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
