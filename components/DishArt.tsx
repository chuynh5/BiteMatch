"use client";

import Image from "next/image";
import { FoodImage } from "@/components/FoodImage";
import type { Cuisine, Restaurant } from "@/types/bitematch";

/**
 * Hand-drawn dish illustrations, one per cuisine. Add a new cuisine by
 * dropping a transparent PNG in public/illustrations and listing it here.
 */
const illustrations: Partial<Record<Cuisine, string>> = {
  Japanese: "/illustrations/japanese.png",
  Chinese: "/illustrations/chinese.png",
  Korean: "/illustrations/korean.png",
  Mediterranean: "/illustrations/mediterranean.png",
  Italian: "/illustrations/italian.png",
  Greek: "/illustrations/greek.png"
};

/** Soft pastel backdrops that sit behind each illustration. */
export const cuisineBackdrops: Record<Cuisine, string> = {
  Italian: "#fde4dc",
  Japanese: "#fde6ec",
  Mexican: "#fdf0d2",
  Thai: "#e9f3d8",
  American: "#fbe8d6",
  Mediterranean: "#e3f0e2",
  Korean: "#f6e3dc",
  Chinese: "#fdebd8",
  Greek: "#e2edf7",
  Indian: "#fdecd2"
};

export function DishArt({
  restaurant,
  sizes,
  priority,
  bob = true
}: {
  restaurant: Pick<Restaurant, "cuisine" | "name" | "image" | "source">;
  sizes: string;
  priority?: boolean;
  bob?: boolean;
}) {
  const backdrop = cuisineBackdrops[restaurant.cuisine] ?? "#fbe8d6";

  // Real Google Places photos win when we have them.
  if (restaurant.source === "google" && restaurant.image) {
    return (
      <FoodImage
        src={restaurant.image}
        alt={`${restaurant.name} food`}
        cuisine={restaurant.cuisine}
        label={restaurant.cuisine}
        unoptimized
        sizes={sizes}
      />
    );
  }

  const illustration = illustrations[restaurant.cuisine];

  return (
    <div className="dish-art" style={{ background: backdrop }}>
      <span className="dish-sparkle sparkle-a" aria-hidden="true">✦</span>
      <span className="dish-sparkle sparkle-b" aria-hidden="true">✦</span>
      {illustration ? (
        <div className={bob ? "dish-art-image bob" : "dish-art-image"}>
          <Image
            src={illustration}
            alt={`Illustration of ${restaurant.cuisine.toLowerCase()} food`}
            fill
            priority={priority}
            sizes={sizes}
          />
        </div>
      ) : (
        <div className="dish-art-placeholder" aria-label={`${restaurant.cuisine} food`} role="img">
          <span aria-hidden="true">🍽️</span>
          <em>{restaurant.cuisine.toLowerCase()}</em>
        </div>
      )}
    </div>
  );
}
