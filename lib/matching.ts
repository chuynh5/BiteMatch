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

export function getMatch(
  restaurants: Restaurant[],
  votes: VoteMap,
  participantIds: string[]
) {
  return restaurants.find((restaurant) =>
    participantIds.every(
      (participantId) => votes[participantId]?.[restaurant.id] === "like"
    )
  );
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
