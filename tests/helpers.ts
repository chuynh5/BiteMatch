import type { Cuisine, Restaurant } from "@/types/bitematch";

/** A restaurant with sensible defaults; override only what a test cares about. */
export function restaurant(id: string, overrides: Partial<Restaurant> = {}): Restaurant {
  return {
    id,
    name: overrides.name ?? id,
    cuisine: (overrides.cuisine ?? "Thai") as Cuisine,
    price: "$$",
    neighborhood: "Somewhere",
    address: `${id} Main St`,
    rating: 0,
    distance: 1,
    image: "",
    menuImages: [],
    mapQuery: id,
    tags: [],
    vibe: "",
    ...overrides
  };
}
