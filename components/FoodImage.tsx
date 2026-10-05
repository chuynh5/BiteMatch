"use client";

import Image from "next/image";
import { UtensilsCrossed } from "lucide-react";
import { useState } from "react";

const cuisineTints: Record<string, [string, string]> = {
  Italian: ["#e9a48f", "#b85c46"],
  Japanese: ["#a9c7bd", "#4f7f72"],
  Mexican: ["#f0c77d", "#c9783f"],
  Thai: ["#c9d98f", "#6f8f3f"],
  American: ["#e8b8a0", "#8f4f3a"],
  Mediterranean: ["#9fc3d6", "#3f6f8f"],
  Korean: ["#e8a0a8", "#a8434f"],
  Greek: ["#b9d3e6", "#4f7fa8"],
  Chinese: ["#f0b1a0", "#b5483a"],
  Indian: ["#f2b66d", "#b5622a"]
};

/**
 * next/image with a branded fallback. Live OpenStreetMap listings have no
 * photos, and remote images can fail to load; instead of a broken-image icon
 * or a grey box, show a warm cuisine-tinted card.
 */
export function FoodImage({
  src,
  alt,
  cuisine,
  label,
  sizes,
  priority,
  unoptimized
}: {
  src?: string;
  alt: string;
  cuisine?: string;
  label?: string;
  sizes: string;
  priority?: boolean;
  unoptimized?: boolean;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (!src || failedSrc === src) {
    const [from, to] = cuisineTints[cuisine ?? ""] ?? ["#efd3bf", "#b8735d"];

    return (
      <div
        className="food-fallback"
        role="img"
        aria-label={alt}
        style={{ background: `linear-gradient(145deg, ${from}, ${to})` }}
      >
        <UtensilsCrossed size={28} aria-hidden="true" />
        {label ? <span>{label}</span> : null}
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      priority={priority}
      sizes={sizes}
      unoptimized={unoptimized}
      onError={() => setFailedSrc(src)}
    />
  );
}
