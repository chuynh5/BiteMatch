import { describe, expect, it } from "vitest";
import { filterRestaurants, getMatch, getTopPick, getVoteStats } from "@/lib/matching";
import { restaurant } from "./helpers";

const people = ["cara", "maya", "leo"];

describe("getMatch", () => {
  it("only matches a place everyone liked", () => {
    const places = [restaurant("a"), restaurant("b")];
    const votes = {
      cara: { a: "like", b: "like" },
      maya: { a: "like", b: "pass" },
      leo: { a: "like", b: "like" }
    } as const;
    expect(getMatch(places, votes, people)?.id).toBe("a");
  });

  it("waits until everyone has voted", () => {
    const places = [restaurant("a")];
    const votes = { cara: { a: "like" }, maya: { a: "like" } } as const;
    expect(getMatch(places, votes, people)).toBeUndefined();
  });

  it("uses the tie-break order when several places are unanimous", () => {
    const places = [restaurant("low", { rating: 4.1 }), restaurant("high", { rating: 4.7 })];
    const allLike = { low: "like", high: "like" } as const;
    expect(getMatch(places, { cara: allLike, maya: allLike, leo: allLike }, people)?.id).toBe("high");
  });
});

describe("getTopPick", () => {
  const votesFor = (likes: Record<string, string[]>) => {
    const votes: Record<string, Record<string, "like" | "pass">> = {};
    for (const person of people) votes[person] = {};
    for (const [place, likers] of Object.entries(likes)) {
      for (const person of people) votes[person][place] = likers.includes(person) ? "like" : "pass";
    }
    return votes;
  };

  it("picks the most-liked place with no tie", () => {
    const places = [restaurant("a"), restaurant("b")];
    const pick = getTopPick(places, votesFor({ a: ["cara"], b: ["cara", "maya"] }), people);
    expect(pick).toMatchObject({ likes: 2, tiedWith: [], reason: undefined });
    expect(pick?.restaurant.id).toBe("b");
  });

  it("breaks a tie by rating first", () => {
    const places = [restaurant("a", { rating: 4.3 }), restaurant("b", { rating: 4.6 })];
    const pick = getTopPick(places, votesFor({ a: ["cara"], b: ["maya"] }), people);
    expect(pick?.restaurant.id).toBe("b");
    expect(pick?.tiedWith.map((r) => r.id)).toEqual(["a"]);
    expect(pick?.reason).toBe("rating");
  });

  it("then by number of reviews", () => {
    const places = [restaurant("a", { rating: 4.5, reviewCount: 90 }), restaurant("b", { rating: 4.5, reviewCount: 900 })];
    const pick = getTopPick(places, votesFor({ a: ["cara"], b: ["maya"] }), people);
    expect([pick?.restaurant.id, pick?.reason]).toEqual(["b", "reviews"]);
  });

  it("then by distance", () => {
    const places = [restaurant("far", { distance: 2.4 }), restaurant("near", { distance: 0.6 })];
    const pick = getTopPick(places, votesFor({ far: ["cara"], near: ["maya"] }), people);
    expect([pick?.restaurant.id, pick?.reason]).toEqual(["near", "distance"]);
  });

  it("gives every phone the same answer whatever the list order", () => {
    const a = restaurant("a", { rating: 4.2 });
    const b = restaurant("b", { rating: 4.8 });
    const votes = votesFor({ a: ["cara"], b: ["leo"] });
    expect(getTopPick([a, b], votes, people)?.restaurant.id).toBe(getTopPick([b, a], votes, people)?.restaurant.id);
  });

  it("reports zero likes so the app can say nobody bit", () => {
    expect(getTopPick([restaurant("a")], votesFor({ a: [] }), people)?.likes).toBe(0);
  });
});

describe("getVoteStats and filterRestaurants", () => {
  it("counts likes, passes and people still to vote", () => {
    const stats = getVoteStats(restaurant("a"), { cara: { a: "like" }, maya: { a: "pass" } }, people);
    expect(stats).toEqual({ likes: 1, passes: 1, remaining: 1 });
  });

  it("filters by cuisine, price and distance", () => {
    const places = [
      restaurant("thai-near", { cuisine: "Thai", distance: 1 }),
      restaurant("thai-far", { cuisine: "Thai", distance: 9 }),
      restaurant("italian", { cuisine: "Italian" }),
      restaurant("pricey", { cuisine: "Thai", price: "$$$" })
    ];
    const kept = filterRestaurants(places, { cuisines: ["Thai"], prices: ["$", "$$"], maxDistance: 3 });
    expect(kept.map((r) => r.id)).toEqual(["thai-near"]);
  });
});
