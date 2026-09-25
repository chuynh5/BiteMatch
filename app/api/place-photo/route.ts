import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const name = request.nextUrl.searchParams.get("name");

  if (!apiKey || !name || !name.startsWith("places/")) {
    return new NextResponse("Photo unavailable", { status: 404 });
  }

  const photoUrl = `https://places.googleapis.com/v1/${name}/media?key=${apiKey}&maxWidthPx=900&skipHttpRedirect=true`;
  const response = await fetch(photoUrl);

  if (!response.ok) {
    return new NextResponse("Photo unavailable", { status: 404 });
  }

  const data = (await response.json()) as { photoUri?: string };

  if (!data.photoUri) {
    return new NextResponse("Photo unavailable", { status: 404 });
  }

  return NextResponse.redirect(data.photoUri);
}
