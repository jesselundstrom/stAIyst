"use client";

import { useRouter } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell";
import { ImageDropzone } from "@/components/upload/ImageDropzone";
import { Button } from "@/components/ui/Button";
import { useSessionStore } from "@/lib/session/store";

export default function UploadPage() {
  const router = useRouter();
  const { images, setFrontImage, setBackImage } = useSessionStore();

  const canContinue = Boolean(images.front);

  return (
    <PageShell narrow>
      <div className="mb-10">
        <p className="mb-1 text-xs font-medium uppercase tracking-widest text-neutral-400">Step 1</p>
        <h1 className="mb-3 text-2xl font-semibold tracking-tight text-neutral-900">
          Upload your photo
        </h1>
        <p className="text-sm leading-relaxed text-neutral-500">
          Upload a clear front photo to begin. A back photo is optional but helps improve results.
        </p>
      </div>

      {/* Guidance tips */}
      <div className="mb-8 rounded-xl border border-neutral-200 bg-white p-5">
        <p className="mb-3 text-xs font-medium uppercase tracking-widest text-neutral-400">
          For best results
        </p>
        <ul className="flex flex-col gap-1.5 text-sm text-neutral-600">
          {TIPS.map((tip) => (
            <li key={tip} className="flex items-start gap-2">
              <span className="mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-neutral-400" />
              {tip}
            </li>
          ))}
        </ul>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <ImageDropzone
          label="Front photo"
          hint="Full body or near full body preferred"
          required
          value={images.front}
          onChange={(val) => setFrontImage(val ?? "")}
        />
        <ImageDropzone
          label="Back photo"
          hint="Helps assess the full silhouette"
          value={images.back}
          onChange={setBackImage}
        />
      </div>

      <div className="mt-8 flex justify-end">
        <Button
          size="lg"
          disabled={!canContinue}
          onClick={() => router.push("/preferences")}
        >
          Continue
        </Button>
      </div>
    </PageShell>
  );
}

const TIPS = [
  "Stand in a neutral, upright stance",
  "Use decent lighting — no harsh shadows",
  "A plain or simple background works best",
  "Full body or near full body preferred",
  "Wear what you'd normally wear day-to-day",
];
