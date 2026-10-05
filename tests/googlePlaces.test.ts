import { describe, expect, it } from "vitest";
import { mapGooglePlace, photosFromPlace } from "@/lib/googlePlaces";

const place = {
  id: "ChIJ123",
  displayName: { text: "Crying Thaiger" },
  formattedAddress: "114 Ferry St, Malden, MA 02148, USA",
  location: { latitude: 42.427, longitude: -71.066 },
  types: ["thai_restaurant", "restaurant"],
  primaryType: "thai_restaurant",
  primaryTypeDisplayName: { text: "Thai Restaurant" },
  rating: 4.6,
  userRatingCount: 1234,
  priceLevel: "PRICE_LEVEL_MODERATE",
  photos: Array.from({ length: 8 }, (_, i) => ({
    name: `places/ChIJ123/photos/p${i}`,
    authorAttributions: [{ displayName: `Diner ${i}`, uri: `https://maps.google.com/contrib/${i}` }]
  }))
};

describe("mapGooglePlace", () => {
  const mapped = mapGooglePlace(place, { lat: 42.43, lng: -71.07 });

  it("keeps the real rating, review count, cuisine and price", () => {
    expect(mapped).toMatchObject({ name: "Crying Thaiger", cuisine: "Thai", price: "$$", rating: 4.6, reviewCount: 1234, source: "google" });
  });

  it("keeps at most 5 photos, each with a photographer credit", () => {
    expect(mapped?.menuImages).toHaveLength(5);
    expect(mapped?.menuImages[0]).toMatchObject({ credit: "Diner 0", creditUrl: "https://maps.google.com/contrib/0" });
    expect(mapped?.menuImages[0].src).toBe("/api/place-photo?name=places%2FChIJ123%2Fphotos%2Fp0");
  });

  it("estimates price from the place type when Google has none", () => {
    const fastFood = mapGooglePlace({ ...place, priceLevel: undefined, types: ["fast_food_restaurant"], primaryType: "fast_food_restaurant" }, { lat: 42.43, lng: -71.07 });
    expect(fastFood?.price).toBe("$");
  });

  it("skips places missing a name or location", () => {
    expect(mapGooglePlace({ ...place, displayName: undefined }, { lat: 0, lng: 0 })).toBeNull();
  });
});

describe("photosFromPlace", () => {
  it("ignores anything that isn't a Google photo name", () => {
    expect(photosFromPlace({ photos: [{ name: "../../etc/passwd" }, { name: "places/x/photos/y" }] }, "X")).toHaveLength(1);
  });
});
