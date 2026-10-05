"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { DishArt } from "@/components/DishArt";
import type { Restaurant } from "@/types/bitematch";

/** SwipeDeck fires this on the carousel when a press on the card didn't turn into a drag. */
export const PHOTO_TAP_EVENT = "bitematch:photo-tap";
export type PhotoTapDetail = { side: "prev" | "next" };

/**
 * A restaurant's real photos. Tap the right side for the next photo and the
 * left side for the previous one, like stories. Only the photo on screen is
 * loaded, since each one counts against Google's free allowance. If photos
 * fail (for example, the daily cap was reached), it falls back to the
 * cuisine illustration.
 */
export function PhotoCarousel({ restaurant, sizes }: { restaurant: Restaurant; sizes: string }) {
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState<string[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);

  const photos = restaurant.menuImages.filter((photo) => !failed.includes(photo.src));
  const current = Math.min(index, Math.max(photos.length - 1, 0));
  const photo = photos[current];

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const onTap = (event: Event) => {
      const { side } = (event as CustomEvent<PhotoTapDetail>).detail;
      setIndex((value) => (side === "next" ? Math.min(value + 1, photos.length - 1) : Math.max(value - 1, 0)));
    };
    root.addEventListener(PHOTO_TAP_EVENT, onTap);
    return () => root.removeEventListener(PHOTO_TAP_EVENT, onTap);
  }, [photos.length]);

  if (!photo) {
    return <DishArt restaurant={{ ...restaurant, source: "curated" }} sizes={sizes} />;
  }

  return (
    <div className="photo-carousel" data-photo-carousel ref={rootRef}>
      {/* The same photo, blurred, fills any space around the uncropped one. */}
      <Image
        key={`${photo.src}-backdrop`}
        className="photo-backdrop"
        src={photo.src}
        alt=""
        aria-hidden="true"
        fill
        unoptimized
        sizes={sizes}
        draggable={false}
      />
      <Image
        key={photo.src}
        className="photo-main"
        src={photo.src}
        alt={photo.alt}
        fill
        unoptimized
        sizes={sizes}
        draggable={false}
        onError={() => setFailed((list) => [...list, photo.src])}
      />

      {photos.length > 1 ? (
        <>
          <div className="photo-bars" aria-hidden="true">
            {photos.map((item, itemIndex) => (
              <span key={item.src} className={itemIndex <= current ? "filled" : undefined} />
            ))}
          </div>
          <button
            type="button"
            className="photo-nav photo-nav-prev"
            aria-label="Previous photo"
            disabled={current === 0}
            onClick={() => setIndex(Math.max(current - 1, 0))}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            className="photo-nav photo-nav-next"
            aria-label="Next photo"
            disabled={current === photos.length - 1}
            onClick={() => setIndex(Math.min(current + 1, photos.length - 1))}
          >
            <ChevronRight size={18} />
          </button>
          <span className="sr-only" aria-live="polite">
            Photo {current + 1} of {photos.length}
          </span>
        </>
      ) : null}

      {photo.credit ? (
        photo.creditUrl ? (
          <a className="photo-credit" href={photo.creditUrl} target="_blank" rel="noreferrer">
            Photo: {photo.credit}
          </a>
        ) : (
          <span className="photo-credit">Photo: {photo.credit}</span>
        )
      ) : null}
    </div>
  );
}
