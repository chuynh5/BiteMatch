import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    googlePlacesConfigured: Boolean(process.env.GOOGLE_PLACES_API_KEY)
  });
}
