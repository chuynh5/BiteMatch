"use client";

import { Check, ExternalLink, PartyPopper, Scale, Share2, Trophy } from "lucide-react";
import { useState } from "react";
import { RestaurantPhotos } from "@/components/RestaurantPhotos";
import type { TieBreakReason } from "@/lib/matching";
import { shareMessage, type ShareResult } from "@/lib/share";
import type { Participant, Restaurant, VoteMap } from "@/types/bitematch";

const confettiColors = ["#d97863", "#e7b967", "#6e9b8e", "#7c3aed", "#f2a7b8"];

function Confetti() {
  return (
    <div className="confetti" aria-hidden="true">
      {Array.from({ length: 28 }, (_, index) => (
        <i
          key={index}
          style={{
            left: `${(index * 37) % 100}%`,
            background: confettiColors[index % confettiColors.length],
            animationDelay: `${(index % 7) * 90}ms`,
            animationDuration: `${1400 + ((index * 53) % 900)}ms`,
            transform: `rotate(${(index * 47) % 360}deg)`
          }}
        />
      ))}
    </div>
  );
}

function directionsUrl(restaurant: Restaurant) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(restaurant.mapQuery)}`;
}

/** One sentence on why the winner won a tie, in plain words. */
function tieSentence(winner: Restaurant, runnerUp: Restaurant, reason: TieBreakReason) {
  switch (reason) {
    case "rating":
      return `${winner.name} wins the tie with a higher rating (${winner.rating.toFixed(1)} vs ${runnerUp.rating.toFixed(1)}).`;
    case "reviews":
      return `${winner.name} wins the tie with more reviews (${(winner.reviewCount ?? 0).toLocaleString()} vs ${(runnerUp.reviewCount ?? 0).toLocaleString()}).`;
    case "distance":
      return `${winner.name} wins the tie because it's closer (${winner.distance.toFixed(1)} vs ${runnerUp.distance.toFixed(1)} mi).`;
    default:
      return `${winner.name} wins the tie (alphabetical order, since everything else was equal).`;
  }
}

export function MatchResult({
  restaurant,
  votes,
  participants,
  onReset,
  unanimous,
  tiedWith = [],
  tieReason
}: {
  restaurant: Restaurant;
  votes: VoteMap;
  participants: Participant[];
  /** Omit to hide the "Vote again" button (live rooms keep their votes). */
  onReset?: () => void;
  /** false when nobody agreed on everything and this is just the top pick */
  unanimous: boolean;
  /** Other places with the same number of likes, when the top pick was a tie. */
  tiedWith?: Restaurant[];
  tieReason?: TieBreakReason;
}) {
  const likers = participants.filter(
    (participant) => votes[participant.id]?.[restaurant.id] === "like"
  );
  const isTie = !unanimous && tiedWith.length > 0 && tieReason;
  const [shared, setShared] = useState<ShareResult | null>(null);

  async function shareResult() {
    const text = unanimous
      ? `Dinner is decided: ${restaurant.name} (${restaurant.address}). Everyone said yes on BiteMatch.`
      : `Dinner pick: ${restaurant.name} (${restaurant.address}), with ${likers.length} of ${participants.length} votes on BiteMatch.`;
    const result = await shareMessage("BiteMatch", text, directionsUrl(restaurant));
    setShared(result);
    if (result !== "failed") window.setTimeout(() => setShared(null), 2500);
  }

  return (
    <div className={unanimous ? "match-result is-match" : "match-result"}>
      {unanimous ? <Confetti /> : null}
      <div className="match-photo">
        <RestaurantPhotos restaurant={restaurant} sizes="(max-width: 900px) 92vw, 480px" tapToFlip />
      </div>
      <div className="match-copy">
        <div className="celebration-icon">
          {unanimous ? <PartyPopper size={26} /> : <Trophy size={26} />}
        </div>
        <span className="section-kicker">{unanimous ? "It's a match" : isTie ? "It's a tie" : "Closest call"}</span>
        <h2>{unanimous ? "Dinner is decided." : isTie ? "Tie, broken fairly." : "Almost unanimous."}</h2>
        <p>
          {unanimous ? (
            <>
              Everyone privately liked <strong>{restaurant.name}</strong>. Send the
              directions and skip the group chat spiral.
            </>
          ) : isTie ? (
            <>
              <strong>{[restaurant, ...tiedWith].map((place) => place.name).join(" and ")}</strong> each got{" "}
              {likers.length} of {participants.length} votes.
            </>
          ) : (
            <>
              No place got a yes from everyone, but <strong>{restaurant.name}</strong>{" "}
              came closest with {likers.length} of {participants.length} votes.
            </>
          )}
        </p>
        {isTie ? (
          <p className="tie-note">
            <Scale size={16} aria-hidden="true" />
            <span>{tieSentence(restaurant, tiedWith[0], tieReason)}</span>
          </p>
        ) : null}
        <div className="matched-restaurant">
          <strong>{restaurant.name}</strong>
          <span>
            {restaurant.cuisine} · {restaurant.price} · {restaurant.distance.toFixed(1)} mi
          </span>
          <span>{restaurant.address}</span>
          <div className="match-avatars" aria-label={`${likers.length} of ${participants.length} said yes`}>
            {participants.map((participant) => (
              <span
                key={participant.id}
                title={participant.name}
                className={likers.includes(participant) ? undefined : "declined"}
                style={{ background: participant.color }}
              >
                {participant.name.charAt(0)}
              </span>
            ))}
            <small>
              {likers.length}/{participants.length} yes
            </small>
          </div>
        </div>
        <div className="match-actions">
          <a className="primary-button" href={directionsUrl(restaurant)} target="_blank" rel="noreferrer">
            Get directions
            <ExternalLink size={18} />
          </a>
          <button className="secondary-button" onClick={shareResult}>
            {shared === "copied" || shared === "shared" ? <Check size={18} /> : <Share2 size={18} />}
            {shared === "copied" ? "Copied to share" : shared === "shared" ? "Shared" : "Share with the group"}
          </button>
          {onReset ? (
            <button className="secondary-button" onClick={onReset}>
              Vote again
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
