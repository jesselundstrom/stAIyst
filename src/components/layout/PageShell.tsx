import { cn } from "@/lib/utils/cn";

interface PageShellProps {
  children: React.ReactNode;
  className?: string;
  narrow?: boolean;
}

export function PageShell({ children, className, narrow = false }: PageShellProps) {
  return (
    <main
      className={cn(
        "mx-auto w-full px-6 py-12",
        narrow ? "max-w-2xl" : "max-w-5xl",
        className
      )}
      style={{ animation: "fadeUp 0.35s ease-out both" }}
    >
      {children}
    </main>
  );
}
