import { restaurants as curatedRestaurants } from "@/data/restaurants";
import type { Cuisine, PriceLevel, Restaurant } from "@/types/bitematch";

type GooglePlace = {
  id?: string;
  displayName?: {
    text?: string;
  };
  formattedAddress?: string;
  location?: {
    latitude?: number;
    longitude?: number;
  };
  photos?: {
    name?: string;
  }[];
  priceLevel?: string;
  rating?: number;
  types?: string[];
  primaryType?: string;
  primaryTypeDisplayName?: {
    text?: string;
  };
};

type OsmElement = {
  id: number;
  lat?: number;
  lon?: number;
  center?: {
    lat?: number;
    lon?: number;
  };
  tags?: Record<string, string>;
  type: "node" | "way" | "relation";
};

const cuisineTypeMap: Record<Cuisine, string[]> = {
  Italian: ["italian_restaurant"],
  Japanese: ["japanese_restaurant", "sushi_restaurant"],
  Mexican: ["mexican_restaurant"],
  Thai: ["thai_restaurant"],
  American: ["american_restaurant"],
  Mediterranean: ["mediterranean_restaurant"],
  Korean: ["korean_restaurant"],
  Indian: ["indian_restaurant"]
};

const typeCuisineMap: Record<string, Cuisine> = {
  italian_restaurant: "Italian",
  japanese_restaurant: "Japanese",
  sushi_restaurant: "Japanese",
  mexican_restaurant: "Mexican",
  thai_restaurant: "Thai",
  american_restaurant: "American",
  mediterranean_restaurant: "Mediterranean",
  greek_restaurant: "Mediterranean",
  korean_restaurant: "Korean",
  indian_restaurant: "Indian"
};

export type NearbyRestaurantResult = {
  restaurants: Restaurant[];
  source: "google" | "osm" | "curated";
  message?: string;
};

export async function fetchNearbyRestaurants({
  lat,
  lng,
  radius,
  cuisines,
  prices,
  origin
}: {
  lat?: number;
  lng?: number;
  radius: number;
  cuisines: Cuisine[];
  prices: PriceLevel[];
  origin: string;
}): Promise<NearbyRestaurantResult> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (lat == null || lng == null) {
    return curatedFallback("Allow location to find live nearby restaurants.");
  }

  if (!apiKey) {
    return fetchOpenStreetMapRestaurants({
      lat,
      lng,
      radius,
      cuisines,
      prices
    });
  }

  const includedPrimaryTypes =
    cuisines.length > 0
      ? Array.from(new Set(cuisines.flatMap((cuisine) => cuisineTypeMap[cuisine])))
      : ["restaurant"];

  try {
    const response = await fetch(
      "https://places.googleapis.com/v1/places:searchNearby",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask":
            "places.id,places.displayName,places.formattedAddress,places.location,places.photos,places.priceLevel,places.rating,places.types,places.primaryType,places.primaryTypeDisplayName"
        },
        body: JSON.stringify({
          includedPrimaryTypes,
          maxResultCount: 20,
          rankPreference: "POPULARITY",
          locationRestriction: {
            circle: {
              center: {
                latitude: lat,
                longitude: lng
              },
              radius: Math.min(Math.max(radius, 500), 50000)
            }
          }
        })
      }
    );

    if (!response.ok) {
      return curatedFallback("Live restaurant lookup failed, so this room is using curated demo data.");
    }

    const data = (await response.json()) as { places?: GooglePlace[] };
    const mappedRestaurants: Restaurant[] = [];

    for (const place of data.places ?? []) {
      const restaurant = mapGooglePlace(place, { lat, lng, origin });

      if (restaurant && prices.includes(restaurant.price)) {
        mappedRestaurants.push(restaurant);
      }
    }

    if (mappedRestaurants.length === 0) {
      return curatedFallback("No live restaurants matched those filters, so this room is using curated demo data.");
    }

    return {
      restaurants: mappedRestaurants,
      source: "google"
    };
  } catch {
    return curatedFallback("Live restaurant lookup is unavailable, so this room is using curated demo data.");
  }
}

async function fetchOpenStreetMapRestaurants({
  lat,
  lng,
  radius,
  cuisines,
  prices
}: {
  lat: number;
  lng: number;
  radius: number;
  cuisines: Cuisine[];
  prices: PriceLevel[];
}): Promise<NearbyRestaurantResult> {
  const boundedRadius = Math.min(Math.max(radius, 500), 10000);
  const query = `
    [out:json][timeout:14];
    (
      node["name"]["amenity"~"restaurant|cafe|fast_food"](around:${boundedRadius},${lat},${lng});
      way["name"]["amenity"~"restaurant|cafe|fast_food"](around:${boundedRadius},${lat},${lng});
      relation["name"]["amenity"~"restaurant|cafe|fast_food"](around:${boundedRadius},${lat},${lng});
    );
    out center tags 35;
  `;

  try {
    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        "User-Agent": "BiteMatchPortfolio/1.0"
      },
      body: new URLSearchParams({ data: query })
    });

    if (!response.ok) {
      return curatedFallback("Live OpenStreetMap lookup failed, so this room is using curated demo data.");
    }

    const data = (await response.json()) as { elements?: OsmElement[] };
    const seenNames = new Set<string>();
    const mappedRestaurants: Restaurant[] = [];

    for (const element of data.elements ?? []) {
      const restaurant = mapOsmElement(element, { lat, lng });

      if (!restaurant) {
        continue;
      }

      const restaurantKey = restaurant.name.toLowerCase();

      if (
        seenNames.has(restaurantKey) ||
        !prices.includes(restaurant.price) ||
        (cuisines.length > 0 && !cuisines.includes(restaurant.cuisine))
      ) {
        continue;
      }

      seenNames.add(restaurantKey);
      mappedRestaurants.push(restaurant);
    }

    const sortedRestaurants = mappedRestaurants
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 20);

    if (sortedRestaurants.length === 0) {
      return curatedFallback("No nearby OpenStreetMap restaurants matched those filters, so this room is using curated demo data.");
    }

    return {
      restaurants: sortedRestaurants,
      source: "osm",
      message: "Showing live nearby restaurant listings from OpenStreetMap. Add Google Places later for official photos and ratings."
    };
  } catch {
    return curatedFallback("Live OpenStreetMap lookup is unavailable, so this room is using curated demo data.");
  }
}

function mapGooglePlace(
  place: GooglePlace,
  {
    lat,
    lng,
    origin
  }: {
    lat: number;
    lng: number;
    origin: string;
  }
): Restaurant | null {
  const placeLat = place.location?.latitude;
  const placeLng = place.location?.longitude;
  const name = place.displayName?.text;

  if (!place.id || !name || placeLat == null || placeLng == null) {
    return null;
  }

  const cuisine = inferCuisine(place);
  const price = mapPriceLevel(place.priceLevel);
  const photo = place.photos?.[0]?.name;
  const photoUrl = photo
    ? `${origin}/api/place-photo?name=${encodeURIComponent(photo)}`
    : curatedRestaurants[0].image;
  const distance = milesBetween(lat, lng, placeLat, placeLng);
  const address = place.formattedAddress ?? "Address available in Google Maps";

  return {
    id: place.id,
    name,
    cuisine,
    price,
    neighborhood: inferNeighborhood(address),
    address,
    rating: place.rating ?? 4.4,
    distance,
    image: photoUrl,
    menuImages: [
      {
        src: photoUrl,
        alt: `${name} restaurant photo`
      }
    ],
    mapQuery: `${name} ${address}`,
    tags: [
      place.primaryTypeDisplayName?.text ?? cuisine,
      `${distance.toFixed(1)} mi away`,
      place.rating ? `${place.rating.toFixed(1)} rating` : "Nearby"
    ],
    vibe: `${name} is a nearby ${cuisine.toLowerCase()} option matched to this room's filters.`,
    source: "google" as const
  };
}

function inferCuisine(place: GooglePlace): Cuisine {
  const allTypes = [place.primaryType, ...(place.types ?? [])].filter(Boolean) as string[];
  const matchedType = allTypes.find((type) => typeCuisineMap[type]);

  return matchedType ? typeCuisineMap[matchedType] : "American";
}

function mapOsmElement(
  element: OsmElement,
  {
    lat,
    lng
  }: {
    lat: number;
    lng: number;
  }
): Restaurant | null {
  const tags = element.tags ?? {};
  const name = tags.name;
  const placeLat = element.lat ?? element.center?.lat;
  const placeLng = element.lon ?? element.center?.lon;

  if (!name || placeLat == null || placeLng == null) {
    return null;
  }

  const cuisine = inferOsmCuisine(tags.cuisine, tags.amenity);
  const fallback = curatedRestaurants.find((restaurant) => restaurant.cuisine === cuisine) ?? curatedRestaurants[0];
  const distance = milesBetween(lat, lng, placeLat, placeLng);
  const address = formatOsmAddress(tags);
  const neighborhood = tags["addr:city"] ?? tags["addr:suburb"] ?? "Nearby";
  const price = inferOsmPrice(tags);

  return {
    id: `osm-${element.type}-${element.id}`,
    name,
    cuisine,
    price,
    neighborhood,
    address,
    rating: 0,
    distance,
    image: fallback.image,
    menuImages: fallback.menuImages,
    mapQuery: `${name} ${address}`,
    tags: [
      tags.amenity === "cafe" ? "Cafe" : "Restaurant",
      `${distance.toFixed(1)} mi away`,
      tags.cuisine ? titleCase(tags.cuisine.replace(/_/g, " ")) : "Live listing"
    ],
    vibe: `${name} is a real nearby listing from OpenStreetMap matched to this room's filters.`,
    source: "osm"
  };
}

function inferOsmCuisine(cuisineTag?: string, amenity?: string): Cuisine {
  const cuisine = cuisineTag?.toLowerCase() ?? "";

  if (cuisine.includes("italian") || cuisine.includes("pizza")) return "Italian";
  if (cuisine.includes("japanese") || cuisine.includes("sushi") || cuisine.includes("ramen")) return "Japanese";
  if (cuisine.includes("mexican") || cuisine.includes("taco")) return "Mexican";
  if (cuisine.includes("thai")) return "Thai";
  if (cuisine.includes("mediterranean") || cuisine.includes("greek") || cuisine.includes("middle_eastern")) return "Mediterranean";
  if (cuisine.includes("korean")) return "Korean";
  if (cuisine.includes("indian")) return "Indian";
  if (amenity === "cafe") return "American";

  return "American";
}

function inferOsmPrice(tags: Record<string, string>): PriceLevel {
  const cuisine = tags.cuisine?.toLowerCase() ?? "";
  const amenity = tags.amenity;

  if (amenity === "fast_food" || amenity === "cafe") {
    return "$";
  }

  if (cuisine.includes("fine_dining") || cuisine.includes("steak_house")) {
    return "$$$";
  }

  return "$$";
}

function formatOsmAddress(tags: Record<string, string>) {
  const street = [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(" ");
  const city = tags["addr:city"] ?? tags["addr:suburb"];
  const state = tags["addr:state"];
  const address = [street, city, state].filter(Boolean).join(", ");

  return address || "Address available in map data";
}

function titleCase(value: string) {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function inferNeighborhood(address: string) {
  const parts = address.split(",").map((part) => part.trim());
  return parts.length >= 2 ? parts[parts.length - 3] ?? parts[0] : parts[0] ?? "Nearby";
}

function mapPriceLevel(priceLevel?: string): PriceLevel {
  if (priceLevel === "PRICE_LEVEL_EXPENSIVE" || priceLevel === "PRICE_LEVEL_VERY_EXPENSIVE") {
    return "$$$";
  }

  if (priceLevel === "PRICE_LEVEL_INEXPENSIVE") {
    return "$";
  }

  return "$$";
}

function milesBetween(lat1: number, lng1: number, lat2: number, lng2: number) {
  const earthRadiusMiles = 3958.8;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  return Math.round(earthRadiusMiles * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
}

function toRadians(degrees: number) {
  return degrees * (Math.PI / 180);
}

function curatedFallback(message: string): NearbyRestaurantResult {
  return {
    restaurants: curatedRestaurants.map((restaurant) => ({
      ...restaurant,
      source: "curated" as const
    })),
    source: "curated",
    message
  };
}
