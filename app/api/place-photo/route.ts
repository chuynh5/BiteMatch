import { NextRequest, NextResponse } from "next/server";
import { tryUseQuota } from "@/lib/usageCap";

/**
 * Serves one Google Places photo.
 *
 * Every call to Google's photo endpoint counts against the free monthly
 * allowance, so the image is returned with cache headers: after the first
 * load, browsers and Vercel's CDN reuse it for a day instead of asking
 * Google again. That keeps a whole room of friends on one request per photo.
 */
const ONE_DAY = 60 * 60 * 24;

export async function GET(request: NextRequest) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const name = request.nextUrl.searchParams.get("name");

  if (!apiKey || !name || !/^places\/[^/]+\/photos\/[^/]+$/.test(name)) {
    return new NextResponse("Photo unavailable", { status: 404 });
  }

  // Daily cap, so we never go past Google's free allowance. Only cache misses
  // reach this point; repeat views are served from the CDN for free.
  if (!(await tryUseQuota("google_photo"))) {
    return new NextResponse("Daily photo limit reached", {
      status: 429,
      headers: { "Cache-Control": "no-store" }
    });
  }

  try {
    const lookup = await fetch(
      `https://places.googleapis.com/v1/${name}/media?maxWidthPx=900&skipHttpRedirect=true`,
      { headers: { "X-Goog-Api-Key": apiKey } }
    );

    // 429 = the daily cap set in Google Cloud was reached. The app falls back to illustrations.
    if (!lookup.ok) {
      return new NextResponse("Photo unavailable", {
        status: lookup.status === 429 ? 429 : 404,
        headers: { "Cache-Control": "no-store" }
      });
    }

    const { photoUri } = (await lookup.json()) as { photoUri?: string };
    if (!photoUri) {
      return new NextResponse("Photo unavailable", { status: 404 });
    }

    const image = await fetch(photoUri);
    if (!image.ok || !image.body) {
      return new NextResponse("Photo unavailable", { status: 404 });
    }

    return new NextResponse(image.body, {
      headers: {
        "Content-Type": image.headers.get("Content-Type") ?? "image/jpeg",
        "Cache-Control": `public, max-age=${ONE_DAY}, s-maxage=${ONE_DAY}`
      }
    });
  } catch {
    return new NextResponse("Photo unavailable", { status: 404 });
  }
}
