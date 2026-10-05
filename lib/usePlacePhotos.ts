"use client";

import { useEffect, useState } from "react";
import type { Restaurant } from "@/types/bitematch";

type Photos = Restaurant["menuImages"];
type State = { status: "loading" | "ready" | "none"; photos: Photos };

// One lookup per restaurant per page load, shared by every card that shows it.
const cache = new Map<string, Promise<Photos>>();

function lookup(restaurant: Restaurant): Promise<Photos> {
  const key = restaurant.mapQuery;
  let pending = cache.get(key);
  if (!pending) {
    const params = new URLSearchParams({ q: restaurant.mapQuery, name: restaurant.name });
    pending = fetch(`/api/place-lookup?${params.toString()}`)
      .then((response) => (response.ok ? (response.json() as Promise<{ photos?: Photos }>) : { photos: [] }))
      .then((data) => data.photos ?? [])
      .catch(() => []);
    cache.set(key, pending);
  }
  return pending;
}

/**
 * Real photos for any restaurant. Live Google listings already carry them;
 * demo and OpenStreetMap restaurants are looked up by name and address.
 */
export function usePlacePhotos(restaurant: Restaurant): State {
  const hasOwn = restaurant.source === "google" && restaurant.menuImages.length > 0;
  const [state, setState] = useState<State>(
    hasOwn ? { status: "ready", photos: restaurant.menuImages } : { status: "loading", photos: [] }
  );

  useEffect(() => {
    if (hasOwn) return;
    // A Google listing with no photos has nothing more to find.
    if (restaurant.source === "google" || !restaurant.mapQuery) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- nothing to fetch
      setState({ status: "none", photos: [] });
      return;
    }
    let active = true;
    void lookup(restaurant).then((photos) => {
      if (active) setState({ status: photos.length > 0 ? "ready" : "none", photos });
    });
    return () => {
      active = false;
    };
  }, [hasOwn, restaurant]);

  return hasOwn ? { status: "ready", photos: restaurant.menuImages } : state;
}
