import * as React from "react";
import { cn } from "@/lib/utils/cn";

type Variant = "default" | "muted" | "outline";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
}

const variantStyles: Record<Variant, string> = {
  default: "bg-neutral-900 text-white",
  muted: "bg-neutral-100 text-neutral-600",
  outline: "border border-neutral-300 text-neutral-700",
};

export function Badge({ variant = "muted", className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
