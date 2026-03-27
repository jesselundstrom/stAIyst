import type { CSSProperties } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function HomePage() {
  return (
    <div className="flex flex-col">
      <section className="mx-auto w-full max-w-5xl px-6 py-24 md:py-36">
        <div className="max-w-xl">
          <p className="animate-fade-up mb-4 text-xs font-medium uppercase tracking-widest text-neutral-400">
            Personal styling, powered by AI
          </p>
          <h1 className="animate-fade-up [--animation-delay:100ms] font-display mb-6 text-5xl font-medium leading-[1.1] tracking-tight text-neutral-900 md:text-6xl">
            A cleaner direction
            <br />
            <em>for your wardrobe.</em>
          </h1>
          <p className="animate-fade-up [--animation-delay:200ms] mb-10 text-base leading-relaxed text-neutral-500">
            Upload a photo, tell us your style preferences, and receive targeted
            clothing recommendations with real products you can try on and buy.
          </p>
          <div className="animate-fade-up [--animation-delay:320ms]">
            <Link href="/upload">
              <Button size="lg">Begin</Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-neutral-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <p className="mb-10 text-xs font-medium uppercase tracking-widest text-neutral-400">
            How it works
          </p>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <div
                key={step.number}
                className="animate-fade-up flex flex-col gap-3"
                style={{ "--animation-delay": `${i * 60}ms` } as CSSProperties}
              >
                <span className="text-2xl font-light text-neutral-300">{step.number}</span>
                <h3 className="text-sm font-semibold text-neutral-900">{step.title}</h3>
                <p className="text-sm leading-relaxed text-neutral-500">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-neutral-200">
        <div className="mx-auto max-w-5xl px-6 py-8">
          <p className="text-xs text-neutral-400">
            Your photos are used only to generate recommendations and try-on previews.
            Nothing is stored permanently on our servers.
          </p>
        </div>
      </section>
    </div>
  );
}

const STEPS = [
  {
    number: "01",
    title: "Upload a photo",
    description: "A clear front photo is all you need to get started.",
  },
  {
    number: "02",
    title: "Set preferences",
    description: "Choose your style direction, budget, and colour preference.",
  },
  {
    number: "03",
    title: "Get recommendations",
    description: "We surface 3 targeted improvements with real products attached.",
  },
  {
    number: "04",
    title: "Try before you buy",
    description: "Preview any item on your photo, then open the product page.",
  },
];
