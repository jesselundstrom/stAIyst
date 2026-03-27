import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-1.5">
          <span className="font-display text-base font-medium tracking-widest text-neutral-900 uppercase">
            stAIyst
          </span>
          <span
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{ background: "var(--gold)" }}
            aria-hidden="true"
          />
        </Link>
        <span className="text-xs text-neutral-400 tracking-wide">AI-assisted styling</span>
      </div>
    </header>
  );
}
