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

/** Every dish sits on the same soft pink, so the cards read as one set. */
const backdrop = "#fde6ec";

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
            quality={90}
            sizes={sizes}
          />
        </div>
      ) : (
        <div className="dish-art-placeholder" aria-label={`${restaurant.cuisine} food`} role="img">
          <span aria-hidden="true">🍽️</span>
          <em>{restaurant.cuisine}</em>
        </div>
      )}
    </div>
  );
}
