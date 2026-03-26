import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
        <Link href="/" className="text-sm font-semibold tracking-widest text-neutral-900 uppercase">
          stAIyst
        </Link>
        <span className="text-xs text-neutral-400 tracking-wide">AI-assisted styling</span>
      </div>
    </header>
  );
}
