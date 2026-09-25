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
  source: "google" | "curated";
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

  if (!apiKey || lat == null || lng == null) {
    return curatedFallback(
      "Using curated demo restaurants. Add GOOGLE_PLACES_API_KEY and allow location for live nearby results."
    );
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
