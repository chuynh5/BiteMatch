import type { Cuisine, Restaurant } from "@/types/bitematch";

/** Ratings at or above this count as "good"; those are picked first. */
const GOOD_RATING = 4.0;
/**
 * How many reviews it takes before a rating is trusted at face value. Below
 * this, the rating is pulled toward an average 4.0, so a 5.0 from 3 reviews
 * doesn't beat a 4.7 from 1,200.
 */
const TRUST_REVIEWS = 50;

/** Higher is better. Unrated places score 0 and keep their original order. */
export function qualityScore(restaurant: Pick<Restaurant, "rating" | "reviewCount">) {
  if (!restaurant.rating) return 0;
  const reviews = restaurant.reviewCount ?? 0;
  return (reviews / (reviews + TRUST_REVIEWS)) * restaurant.rating + (TRUST_REVIEWS / (reviews + TRUST_REVIEWS)) * GOOD_RATING;
}

/**
 * Chooses up to `max` restaurants for a room:
 * 1. Places rated 4.0+ come first. Cuisines take turns so none crowds out the
 *    others, and within a cuisine the best-reviewed go first.
 * 2. If there aren't enough of those, the remaining spots go to the best of
 *    the rest (and unrated places, e.g. from OpenStreetMap), again taking turns.
 *
 * The input order is the tiebreaker (Google's popularity ranking, or distance
 * for OpenStreetMap).
 */
export function pickForRoom(restaurants: Restaurant[], cuisines: Cuisine[], max: number): Restaurant[] {
  const order = cuisines.length > 0 ? cuisines : Array.from(new Set(restaurants.map((r) => r.cuisine)));
  const ranked = restaurants
    .map((restaurant, index) => ({ restaurant, index }))
    .sort((a, b) => qualityScore(b.restaurant) - qualityScore(a.restaurant) || a.index - b.index)
    .map(({ restaurant }) => restaurant);

  const good = ranked.filter((restaurant) => restaurant.rating >= GOOD_RATING);
  const rest = ranked.filter((restaurant) => restaurant.rating < GOOD_RATING);

  const picked = takeTurns(good, order, max);
  return picked.concat(takeTurns(rest, order, max - picked.length));
}

/** Round-robin across cuisines, keeping each cuisine's existing order. */
function takeTurns(restaurants: Restaurant[], order: Cuisine[], max: number): Restaurant[] {
  const groups = order
    .map((cuisine) => restaurants.filter((restaurant) => restaurant.cuisine === cuisine))
    .filter((group) => group.length > 0);

  const picked: Restaurant[] = [];
  for (let round = 0; picked.length < max; round++) {
    let addedThisRound = false;
    for (const group of groups) {
      if (picked.length >= max) break;
      if (round < group.length) {
        picked.push(group[round]);
        addedThisRound = true;
      }
    }
    if (!addedThisRound) break;
  }
  return picked;
}
