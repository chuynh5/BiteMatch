import { NextRequest, NextResponse } from "next/server";
import { photosFromPlace, type GooglePlace } from "@/lib/googlePlaces";
import { tryUseQuota } from "@/lib/usageCap";

/**
 * Finds a restaurant on Google by name and address and returns its photos.
 *
 * Used for restaurants that didn't come from a Google search (the demo list
 * and OpenStreetMap listings), so every room card can show real photos.
 * Results are cached for a day, so each restaurant costs one lookup a day no
 * matter how many people see it, and lookups are capped monthly.
 */
const ONE_DAY = 60 * 60 * 24;

export async function GET(request: NextRequest) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const query = (request.nextUrl.searchParams.get("q") ?? "").trim();

  if (!apiKey || query.length < 3 || query.length > 200) {
    return NextResponse.json({ photos: [] }, { status: 404, headers: { "Cache-Control": "no-store" } });
  }

  if (!(await tryUseQuota("google_text"))) {
    return NextResponse.json({ photos: [] }, { status: 429, headers: { "Cache-Control": "no-store" } });
  }

  try {
    const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        // Pro tier only: id + photos.
        "X-Goog-FieldMask": "places.id,places.photos"
      },
      body: JSON.stringify({ textQuery: query, pageSize: 1 })
    });

    if (!response.ok) {
      return NextResponse.json({ photos: [] }, { status: 502, headers: { "Cache-Control": "no-store" } });
    }

    const data = (await response.json()) as { places?: GooglePlace[] };
    const place = data.places?.[0];
    const name = (request.nextUrl.searchParams.get("name") ?? "").slice(0, 80) || "Restaurant";
    const photos = place ? photosFromPlace(place, name) : [];

    return NextResponse.json(
      { photos },
      { headers: { "Cache-Control": `public, max-age=${ONE_DAY}, s-maxage=${ONE_DAY}` } }
    );
  } catch {
    return NextResponse.json({ photos: [] }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}
