import type { Restaurant, Vote, VoteMap } from "@/types/bitematch";

/**
 * Simulated votes for the demo friends.
 *
 * Exactly one restaurant (the "crowd favorite") is liked by every friend, so a
 * match only happens if you like that one too. It sits a few cards in, so the
 * demo no longer ends on the very first tap. Every other restaurant gets at
 * least one pass, so it can never become a unanimous match by accident.
 */
export function createFriendVotes(
  restaurantsToVoteOn: Restaurant[],
  friendIds: string[]
): VoteMap {
  const favoriteIndex = Math.min(2, restaurantsToVoteOn.length - 1);

  return friendIds.reduce<VoteMap>((allVotes, friendId, friendIndex) => {
    allVotes[friendId] = restaurantsToVoteOn.reduce<Record<string, Vote>>(
      (restaurantVotes, restaurant, index) => {
        if (index === favoriteIndex) {
          restaurantVotes[restaurant.id] = "like";
        } else {
          const designatedPasser = index % Math.max(friendIds.length, 1) === friendIndex;
          const mixedFeelings = (restaurant.id.charCodeAt(0) + friendId.length + index) % 3 === 0;
          restaurantVotes[restaurant.id] = designatedPasser || mixedFeelings ? "pass" : "like";
        }
        return restaurantVotes;
      },
      {}
    );
    return allVotes;
  }, {});
}
