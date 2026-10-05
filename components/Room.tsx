"use client";

import { Lock } from "lucide-react";
import { MatchResult } from "@/components/MatchResult";
import { ShareButton } from "@/components/ShareButton";
import { SwipeDeck } from "@/components/SwipeDeck";
import { getVoteStats } from "@/lib/matching";
import type {
  Participant,
  Preferences,
  Restaurant,
  RestaurantSource,
  Vote,
  VoteMap
} from "@/types/bitematch";

export type RoomMode = "demo" | "joined" | "created";

export function Room({
  participants,
  preferences,
  restaurants,
  activeIndex,
  votes,
  roomVotes,
  match,
  topPick,
  roomCode,
  roomMode,
  restaurantSource,
  onVote,
  onReset,
  onEditPreferences
}: {
  participants: Participant[];
  preferences: Preferences;
  restaurants: Restaurant[];
  activeIndex: number;
  votes: VoteMap;
  roomVotes: VoteMap;
  match?: Restaurant;
  topPick?: Restaurant;
  roomCode: string;
  roomMode: RoomMode;
  restaurantSource: RestaurantSource;
  onVote: (restaurantId: string, vote: Vote) => void;
  onReset: () => void;
  onEditPreferences: () => void;
}) {
  const participantIds = participants.map((participant) => participant.id);
  const userVotes = votes.you ?? {};
  const reviewed = restaurants.filter((restaurant) => userVotes[restaurant.id]).length;
  const activeRestaurant = restaurants[activeIndex];
  const finished = restaurants.length > 0 && activeIndex >= restaurants.length;
  const roomModeLabel =
    roomMode === "created" ? "Your room" : roomMode === "joined" ? "Joined demo room" : "Demo room";

  let stage;
  if (match) {
    stage = (
      <MatchResult restaurant={match} votes={roomVotes} participants={participants} onReset={onReset} unanimous />
    );
  } else if (finished && topPick) {
    stage = (
      <MatchResult
        restaurant={topPick}
        votes={roomVotes}
        participants={participants}
        onReset={onReset}
        unanimous={false}
      />
    );
  } else if (activeRestaurant) {
    stage = (
      <>
        <div className="stage-heading">
          <div>
            <span className="section-kicker">
              <Lock size={14} />
              Private vote
            </span>
            <h2>Would you eat here tonight?</h2>
          </div>
          <span className="stage-count">
            {Math.min(activeIndex + 1, restaurants.length)} / {restaurants.length}
          </span>
        </div>
        <div className="progress-bar" aria-hidden="true">
          <span style={{ width: `${(reviewed / restaurants.length) * 100}%` }} />
        </div>
        <SwipeDeck
          key={activeRestaurant.id}
          restaurant={activeRestaurant}
          nextRestaurant={restaurants[activeIndex + 1]}
          onVote={onVote}
        />
      </>
    );
  } else {
    stage = (
      <div className="empty-state">
        <h2>Too specific for dinner.</h2>
        <p>
          No restaurants found for{" "}
          {preferences.cuisines.length > 0 ? preferences.cuisines.join(", ") : "any cuisine"} at{" "}
          {preferences.prices.length > 0 ? preferences.prices.join("/") : "any price"} within{" "}
          {preferences.maxDistance} mi.
        </p>
        <div className="empty-suggestions">
          <span>Add another cuisine</span>
          <span>Open up price</span>
          <span>Widen distance</span>
        </div>
        <button className="primary-button" onClick={onEditPreferences}>
          Adjust filters
        </button>
      </div>
    );
  }

  return (
    <div className="room-layout">
      <section className="voting-stage">{stage}</section>

      <aside className="room-sidebar">
        <div className="room-code">
          <div>
            <span>Room code</span>
            <strong>{roomCode}</strong>
            <em>{roomModeLabel}</em>
          </div>
          <ShareButton roomCode={roomCode} mode="share" />
        </div>

        <div className="participant-list">
          <h2>Dinner crew</h2>
          {participants.map((participant) => (
            <div className="participant" key={participant.id}>
              <span style={{ background: participant.color }}>{participant.name.charAt(0)}</span>
              <div>
                <strong>{participant.name}</strong>
                <small>
                  {participant.id === "you"
                    ? `${reviewed}/${restaurants.length} reviewed`
                    : "Votes in"}
                </small>
              </div>
            </div>
          ))}
        </div>

        <div className="preference-summary">
          <span>Tonight&apos;s filters</span>
          <p>
            {preferences.cuisines.join(", ") || "Any cuisine"} · {preferences.prices.join("/")} ·{" "}
            {preferences.maxDistance} mi
          </p>
          <div className={restaurantSource !== "curated" ? "source-pill live" : "source-pill"}>
            {restaurantSource === "google"
              ? "Live Google Places"
              : restaurantSource === "osm"
                ? "Live OpenStreetMap"
                : "Demo restaurants"}
          </div>
          <button className="secondary-button" onClick={onEditPreferences}>
            Edit preferences
          </button>
        </div>
      </aside>

      <aside className="results-panel">
        <h2>Group pulse</h2>
        <p className="results-hint">Results unlock as you vote.</p>
        <div className="results-list">
          {restaurants.map((restaurant) => {
            const revealed = Boolean(userVotes[restaurant.id]);
            const stats = getVoteStats(restaurant, roomVotes, participantIds);

            return (
              <div className={revealed ? "result-row" : "result-row locked"} key={restaurant.id}>
                <div>
                  <strong>{restaurant.name}</strong>
                  <span>{restaurant.neighborhood}</span>
                </div>
                <div className="vote-meter">
                  <span
                    style={{
                      width: revealed ? `${(stats.likes / participants.length) * 100}%` : "0%"
                    }}
                  />
                </div>
                <small>
                  {revealed ? `${stats.likes}/${participants.length} yes` : "Vote to reveal"}
                </small>
              </div>
            );
          })}
        </div>
      </aside>
    </div>
  );
}
