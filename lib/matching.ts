import type { Preferences, Restaurant, VoteMap } from "@/types/bitematch";

export function filterRestaurants(
  allRestaurants: Restaurant[],
  preferences: Preferences
) {
  return allRestaurants.filter((restaurant) => {
    const cuisineMatch =
      preferences.cuisines.length === 0 ||
      preferences.cuisines.includes(restaurant.cuisine);
    const priceMatch = preferences.prices.includes(restaurant.price);
    const distanceMatch = restaurant.distance <= preferences.maxDistance;

    return cuisineMatch && priceMatch && distanceMatch;
  });
}

export type TieBreakReason = "rating" | "reviews" | "distance" | "name";

/**
 * Orders tied restaurants the same way on every phone: higher rating, then
 * more reviews, then closer, then alphabetical as a last resort.
 */
export function compareForTieBreak(a: Restaurant, b: Restaurant): number {
  return (
    (b.rating ?? 0) - (a.rating ?? 0) ||
    (b.reviewCount ?? 0) - (a.reviewCount ?? 0) ||
    a.distance - b.distance ||
    a.name.localeCompare(b.name)
  );
}

/** Which rule separated the winner from the runner-up. */
export function tieBreakReason(winner: Restaurant, runnerUp: Restaurant): TieBreakReason {
  if ((winner.rating ?? 0) !== (runnerUp.rating ?? 0)) return "rating";
  if ((winner.reviewCount ?? 0) !== (runnerUp.reviewCount ?? 0)) return "reviews";
  if (winner.distance !== runnerUp.distance) return "distance";
  return "name";
}

/** A place everyone liked. If several qualify, the tie-break order picks one. */
export function getMatch(
  restaurants: Restaurant[],
  votes: VoteMap,
  participantIds: string[]
) {
  return restaurants
    .filter((restaurant) =>
      participantIds.every((participantId) => votes[participantId]?.[restaurant.id] === "like")
    )
    .sort(compareForTieBreak)[0];
}

export type TopPick = {
  restaurant: Restaurant;
  likes: number;
  /** Other places with the same number of likes, if it was a tie. */
  tiedWith: Restaurant[];
  /** How the tie was broken, when there was one. */
  reason?: TieBreakReason;
};

/** The restaurant with the most likes, used when nothing was unanimous. Ties are broken fairly. */
export function getTopPick(
  restaurants: Restaurant[],
  votes: VoteMap,
  participantIds: string[]
): TopPick | undefined {
  if (restaurants.length === 0) return undefined;

  const likesFor = (restaurant: Restaurant) => getVoteStats(restaurant, votes, participantIds).likes;
  const most = Math.max(...restaurants.map(likesFor));
  const tied = restaurants.filter((restaurant) => likesFor(restaurant) === most).sort(compareForTieBreak);
  const [winner, ...others] = tied;

  return {
    restaurant: winner,
    likes: most,
    tiedWith: others,
    reason: others.length > 0 ? tieBreakReason(winner, others[0]) : undefined
  };
}

export function getVoteStats(
  restaurant: Restaurant,
  votes: VoteMap,
  participantIds: string[]
) {
  const likes = participantIds.filter(
    (participantId) => votes[participantId]?.[restaurant.id] === "like"
  ).length;
  const passes = participantIds.filter(
    (participantId) => votes[participantId]?.[restaurant.id] === "pass"
  ).length;

  return {
    likes,
    passes,
    remaining: participantIds.length - likes - passes
  };
}
