import { NextRequest, NextResponse } from "next/server";
import { fetchNearbyRestaurants } from "@/lib/googlePlaces";
import type { Cuisine, PriceLevel } from "@/types/bitematch";

const cuisines = [
  "Italian",
  "Japanese",
  "Mexican",
  "Thai",
  "American",
  "Mediterranean",
  "Korean",
  "Indian"
] satisfies Cuisine[];

const prices = ["$", "$$", "$$$"] satisfies PriceLevel[];

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const lat = Number(params.get("lat"));
  const lng = Number(params.get("lng"));
  const radius = Number(params.get("radius") ?? 4828);
  const selectedCuisines = params
    .get("cuisines")
    ?.split(",")
    .filter((cuisine): cuisine is Cuisine => cuisines.includes(cuisine as Cuisine));
  const selectedPrices = params
    .get("prices")
    ?.split(",")
    .filter((price): price is PriceLevel => prices.includes(price as PriceLevel));

  const result = await fetchNearbyRestaurants({
    lat: Number.isFinite(lat) ? lat : undefined,
    lng: Number.isFinite(lng) ? lng : undefined,
    radius: Number.isFinite(radius) ? radius : 4828,
    cuisines: selectedCuisines?.length ? selectedCuisines : cuisines,
    prices: selectedPrices?.length ? selectedPrices : prices,
    origin: request.nextUrl.origin
  });

  return NextResponse.json(result);
}
