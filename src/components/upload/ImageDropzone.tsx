"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import {
  validateImageFile,
  validateImageDimensions,
  fileToDataUrl,
  loadImageDimensions,
  IMAGE_CONSTRAINTS,
} from "@/lib/images/validate";

interface ImageDropzoneProps {
  label: string;
  hint?: string;
  required?: boolean;
  value: string | null;
  onChange: (dataUrl: string | null) => void;
}

export function ImageDropzone({
  label,
  hint,
  required = false,
  value,
  onChange,
}: ImageDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function processFile(file: File) {
    setError(null);

    const typeCheck = validateImageFile(file);
    if (!typeCheck.valid) {
      setError(typeCheck.error ?? "Invalid file.");
      return;
    }

    const dataUrl = await fileToDataUrl(file);
    const dims = await loadImageDimensions(dataUrl);
    const dimCheck = validateImageDimensions(dims.width, dims.height);
    if (!dimCheck.valid) {
      setError(dimCheck.error ?? "Invalid dimensions.");
      return;
    }

    onChange(dataUrl);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    // Reset input so re-selecting same file fires onChange again
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-neutral-700">{label}</span>
        {required && <span className="text-xs text-neutral-400">Required</span>}
        {!required && <span className="text-xs text-neutral-400">Optional</span>}
      </div>

      {value ? (
        <div className="group relative overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50">
          <div className="relative aspect-[3/4] w-full">
            <Image
              src={value}
              alt={label}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 50vw"
            />
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-neutral-700 shadow-sm transition hover:bg-white"
          >
            Remove
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={cn(
            "flex aspect-[3/4] w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed transition",
            dragOver
              ? "border-neutral-400 bg-neutral-100"
              : "border-neutral-200 bg-neutral-50 hover:border-neutral-300 hover:bg-neutral-100"
          )}
        >
          <svg
            className="h-6 w-6 text-neutral-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 16v-8m0 0-3 3m3-3 3 3M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1"
            />
          </svg>
          <div className="text-center">
            <p className="text-sm font-medium text-neutral-700">
              {dragOver ? "Drop to upload" : "Click or drag to upload"}
            </p>
            {hint && (
              <p className="mt-1 text-xs text-neutral-400">{hint}</p>
            )}
            <p className="mt-1 text-xs text-neutral-400">
              {IMAGE_CONSTRAINTS.acceptedExtensions} · max {IMAGE_CONSTRAINTS.maxSizeMB} MB
            </p>
          </div>
        </button>
      )}

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_CONSTRAINTS.acceptedTypes.join(",")}
        className="hidden"
        onChange={handleFileInput}
      />
    </div>
  );
}
