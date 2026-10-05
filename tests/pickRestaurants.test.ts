import { describe, expect, it } from "vitest";
import { pickForRoom, qualityScore } from "@/lib/pickRestaurants";
import type { Cuisine } from "@/types/bitematch";
import { restaurant } from "./helpers";

const count = (list: { cuisine: string }[]) =>
  list.reduce<Record<string, number>>((all, r) => ({ ...all, [r.cuisine]: (all[r.cuisine] ?? 0) + 1 }), {});

describe("pickForRoom", () => {
  it("never returns more than the room size", () => {
    const many = Array.from({ length: 30 }, (_, i) => restaurant(`r${i}`, { rating: 4.5 }));
    expect(pickForRoom(many, ["Thai"], 10)).toHaveLength(10);
  });

  it("lets cuisines take turns when there are plenty of each", () => {
    const places = (["Thai", "Italian", "Korean"] as Cuisine[]).flatMap((cuisine) =>
      Array.from({ length: 8 }, (_, i) => restaurant(`${cuisine}-${i}`, { cuisine, rating: 4.5, reviewCount: 100 }))
    );
    expect(count(pickForRoom(places, ["Thai", "Italian", "Korean"], 10))).toEqual({ Thai: 4, Italian: 3, Korean: 3 });
  });

  it("fills in from other cuisines when one runs short", () => {
    const places = [
      restaurant("j1", { cuisine: "Japanese", rating: 4.4 }),
      ...Array.from({ length: 12 }, (_, i) => restaurant(`t${i}`, { cuisine: "Thai", rating: 4.4 }))
    ];
    expect(count(pickForRoom(places, ["Japanese", "Thai"], 10))).toEqual({ Japanese: 1, Thai: 9 });
  });

  it("puts every 4.0+ place ahead of lower-rated ones", () => {
    const places = [
      restaurant("i-low", { cuisine: "Italian", rating: 3.2 }),
      restaurant("i-good", { cuisine: "Italian", rating: 4.5 }),
      ...Array.from({ length: 9 }, (_, i) => restaurant(`t${i}`, { cuisine: "Thai", rating: 4.2 }))
    ];
    const ids = pickForRoom(places, ["Italian", "Thai"], 10).map((r) => r.id);
    expect(ids).not.toContain("i-low");
    expect(ids).toContain("i-good");
  });

  it("only uses lower-rated places to fill leftover spots", () => {
    const places = [restaurant("good", { rating: 4.6 }), restaurant("meh", { rating: 3.5 })];
    expect(pickForRoom(places, ["Thai"], 10).map((r) => r.id)).toEqual(["good", "meh"]);
  });

  it("keeps the original order (e.g. nearest first) for unrated places", () => {
    const places = ["o1", "o2", "o3"].map((id) => restaurant(id));
    expect(pickForRoom(places, ["Thai"], 10).map((r) => r.id)).toEqual(["o1", "o2", "o3"]);
  });
});

describe("qualityScore", () => {
  it("trusts lots of reviews over a perfect score from a few", () => {
    expect(qualityScore({ rating: 4.7, reviewCount: 1200 })).toBeGreaterThan(qualityScore({ rating: 5, reviewCount: 3 }));
  });

  it("scores unrated places as 0", () => {
    expect(qualityScore({ rating: 0 })).toBe(0);
  });
});
