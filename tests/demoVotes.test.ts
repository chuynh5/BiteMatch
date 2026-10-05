import { describe, expect, it } from "vitest";
import { createFriendVotes } from "@/lib/demoVotes";
import { getMatch } from "@/lib/matching";
import { restaurant } from "./helpers";

describe("createFriendVotes (demo room)", () => {
  const places = ["a", "b", "c", "d", "e"].map((id) => restaurant(id));
  const friends = ["maya", "jules", "sam"];
  const votes = createFriendVotes(places, friends);

  it("has exactly one place every friend likes, a few cards in", () => {
    const unanimous = places.filter((place) => friends.every((friend) => votes[friend][place.id] === "like"));
    expect(unanimous.map((p) => p.id)).toEqual(["c"]);
  });

  it("doesn't match on the very first tap", () => {
    expect(getMatch(places, { ...votes, you: { a: "like" } }, ["you", ...friends])).toBeUndefined();
  });

  it("matches once you like the friends' favorite", () => {
    expect(getMatch(places, { ...votes, you: { c: "like" } }, ["you", ...friends])?.id).toBe("c");
  });
});
