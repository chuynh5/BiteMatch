"use client";

import { DishArt } from "@/components/DishArt";
import { PhotoCarousel } from "@/components/PhotoCarousel";
import { usePlacePhotos } from "@/lib/usePlacePhotos";
import type { Restaurant } from "@/types/bitematch";

/**
 * The photo area of a restaurant card: real photos you can flip through.
 * While photos are being found it shows a soft placeholder; the cuisine
 * illustration only appears if no photos can be found at all.
 */
export function RestaurantPhotos({
  restaurant,
  sizes,
  tapToFlip = false
}: {
  restaurant: Restaurant;
  sizes: string;
  /** Flip on click by itself (outside the swipe deck, which handles taps for us). */
  tapToFlip?: boolean;
}) {
  const { status, photos } = usePlacePhotos(restaurant);

  if (status === "loading") {
    return <div className="photo-loading" role="img" aria-label={`Loading photos of ${restaurant.name}`} />;
  }

  if (status === "none") {
    return <DishArt restaurant={{ ...restaurant, source: "curated" }} sizes={sizes} />;
  }

  return <PhotoCarousel restaurant={{ ...restaurant, menuImages: photos }} sizes={sizes} tapToFlip={tapToFlip} />;
}
