"use client";

import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/Button";
import type { NormalizedProduct } from "@/types";

interface ProductCardProps {
  product: NormalizedProduct;
  selected?: boolean;
  onTryOn: (product: NormalizedProduct) => void;
}

export function ProductCard({ product, selected = false, onTryOn }: ProductCardProps) {
  return (
    <div
      className={cn(
        "group flex flex-col rounded-xl border bg-white overflow-hidden transition",
        selected ? "border-neutral-900 ring-1 ring-neutral-900" : "border-neutral-200"
      )}
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-neutral-100">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.title}
            fill
            className="object-cover transition group-hover:scale-[1.02]"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-neutral-300 text-xs">
            No image
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 p-4">
        <div>
          {product.brand && (
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
              {product.brand}
            </p>
          )}
          <p className="text-sm font-medium text-neutral-900 leading-snug line-clamp-2">
            {product.title}
          </p>
        </div>

        <p className="text-sm font-semibold text-neutral-900">
          {product.currencyCode === "GBP" ? "£" : product.currencyCode === "USD" ? "$" : product.currencyCode + " "}
          {product.price}
        </p>

        <div className="flex flex-col gap-2">
          <Button
            variant="primary"
            size="sm"
            className="w-full"
            onClick={() => onTryOn(product)}
          >
            Try on
          </Button>
          <a
            href={product.productUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "inline-flex h-8 w-full items-center justify-center rounded-md border border-neutral-300",
              "bg-transparent px-3 text-xs font-medium text-neutral-700",
              "transition hover:bg-neutral-50"
            )}
          >
            View product ↗
          </a>
        </div>
      </div>
    </div>
  );
}
