"use client";

import { ExternalLink, PartyPopper, Trophy } from "lucide-react";
import { DishArt } from "@/components/DishArt";
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

export function MatchResult({
  restaurant,
  votes,
  participants,
  onReset,
  unanimous
}: {
  restaurant: Restaurant;
  votes: VoteMap;
  participants: Participant[];
  /** Omit to hide the "Vote again" button (live rooms keep their votes). */
  onReset?: () => void;
  /** false when nobody agreed on everything and this is just the top pick */
  unanimous: boolean;
}) {
  const likers = participants.filter(
    (participant) => votes[participant.id]?.[restaurant.id] === "like"
  );

  return (
    <div className={unanimous ? "match-result is-match" : "match-result"}>
      {unanimous ? <Confetti /> : null}
      <div className="match-photo">
        <DishArt restaurant={restaurant} sizes="(max-width: 900px) 92vw, 480px" />
      </div>
      <div className="match-copy">
        <div className="celebration-icon">
          {unanimous ? <PartyPopper size={26} /> : <Trophy size={26} />}
        </div>
        <span className="section-kicker">{unanimous ? "It's a match" : "Closest call"}</span>
        <h2>{unanimous ? "Dinner is decided." : "Almost unanimous."}</h2>
        <p>
          {unanimous ? (
            <>
              Everyone privately liked <strong>{restaurant.name}</strong>. Send the
              directions and skip the group chat spiral.
            </>
          ) : (
            <>
              No place got a yes from everyone, but <strong>{restaurant.name}</strong>{" "}
              came closest with {likers.length} of {participants.length} votes.
            </>
          )}
        </p>
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
