"use client";

import { Lock, Timer, UserPlus } from "lucide-react";
import { MatchResult } from "@/components/MatchResult";
import { ShareButton } from "@/components/ShareButton";
import { SwipeDeck } from "@/components/SwipeDeck";
import { useEffect, useLayoutEffect, useRef } from "react";
import { getVoteStats, type TopPick } from "@/lib/matching";
import { prefetchFirstPhoto } from "@/lib/usePlacePhotos";
import type {
  Participant,
  Preferences,
  Restaurant,
  RestaurantSource,
  Vote,
  VoteMap
} from "@/types/bitematch";

export type RoomMode = "demo" | "joined";

export function Room({
  meId,
  participants,
  preferences,
  restaurants,
  activeIndex,
  roomVotes,
  match,
  topPick,
  waitingFor = [],
  roomCode,
  roomLabel,
  restaurantSource,
  notice,
  deadlineText,
  closedNote,
  onVote,
  onReset,
  onEditPreferences
}: {
  /** Which participant is using this screen. */
  meId: string;
  participants: Participant[];
  preferences: Preferences;
  restaurants: Restaurant[];
  activeIndex: number;
  /** Everyone's votes, including yours. */
  roomVotes: VoteMap;
  match?: Restaurant;
  topPick?: TopPick;
  /** People who still need to finish voting before the result can be shown. */
  waitingFor?: Participant[];
  roomCode: string;
  roomLabel: string;
  restaurantSource: RestaurantSource;
  /** Small banner above the card, e.g. when rooms only work on this device. */
  notice?: string;
  /** Countdown while voting is open, e.g. "Voting closes in 4:12". */
  deadlineText?: string;
  /** Set once the deadline has passed: why the room decided without everyone. */
  closedNote?: string;
  onVote: (restaurantId: string, vote: Vote) => void;
  onReset?: () => void;
  onEditPreferences?: () => void;
}) {
  // Warm up the next two cards' first photos while you decide on this one.
  // (The card right behind this one is already rendered, so this mostly helps
  // the one after it when someone swipes quickly.)
  useEffect(() => {
    for (const upcoming of restaurants.slice(activeIndex + 1, activeIndex + 3)) {
      prefetchFirstPhoto(upcoming);
    }
  }, [restaurants, activeIndex]);

  // Group pulse: show about 5 places, scroll for the rest, and keep the
  // place you're voting on in view.
  const pulseRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const list = pulseRef.current;
    if (!list) return;
    const fit = () => {
      const rows = list.children;
      if (rows.length <= 5) {
        list.style.maxHeight = "";
        return;
      }
      const first = rows[0] as HTMLElement;
      const fifth = rows[4] as HTMLElement;
      // Show half of the 6th row so it's clear the list scrolls.
      const sixth = rows[5] as HTMLElement;
      const height = fifth.offsetTop + fifth.offsetHeight - first.offsetTop + sixth.offsetHeight / 2;
      list.style.maxHeight = `${Math.round(height)}px`;
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [restaurants.length]);

  useEffect(() => {
    const list = pulseRef.current;
    const row = list?.children[Math.min(activeIndex, restaurants.length - 1)] as HTMLElement | undefined;
    if (!list || !row || list.scrollHeight <= list.clientHeight) return;
    const top = row.offsetTop - (list.children[0] as HTMLElement).offsetTop;
    if (top < list.scrollTop || top + row.offsetHeight > list.scrollTop + list.clientHeight) {
      list.scrollTo({ top: Math.max(0, top - row.offsetHeight), behavior: "smooth" });
    }
  }, [activeIndex, restaurants.length]);

  const participantIds = participants.map((participant) => participant.id);
  const userVotes = roomVotes[meId] ?? {};
  const reviewedBy = (id: string) => restaurants.filter((restaurant) => roomVotes[id]?.[restaurant.id]).length;
  const reviewed = reviewedBy(meId);
  const activeRestaurant = restaurants[activeIndex];
  const finished = restaurants.length > 0 && activeIndex >= restaurants.length;
  const alone = participants.length < 2;
  const closed = Boolean(closedNote);

  let stage;
  if (match) {
    stage = (
      <MatchResult restaurant={match} votes={roomVotes} participants={participants} onReset={onReset} unanimous />
    );
  } else if (finished && !closed && (alone || waitingFor.length > 0)) {
    stage = (
      <div className="waiting-state">
        <div className="waiting-dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <h2>{alone ? "Your votes are in." : "Waiting on the group."}</h2>
        <p>
          {alone
            ? "Invite friends with the room code. The match appears once everyone has voted."
            : `Still voting: ${waitingFor.map((person) => person.name).join(", ")}. This updates by itself.`}
        </p>
        {deadlineText ? (
          <p className="deadline-pill">
            <Timer size={15} aria-hidden="true" />
            {deadlineText}, then the group&apos;s top pick wins.
          </p>
        ) : null}
        {alone ? (
          <div className="waiting-invite">
            <UserPlus size={18} />
            <span>
              Room code <strong>{roomCode}</strong>
            </span>
            <ShareButton roomCode={roomCode} mode="share" />
          </div>
        ) : null}
      </div>
    );
  } else if (finished && topPick && topPick.likes === 0) {
    stage = (
      <div className="waiting-state">
        <h2>Nobody bit.</h2>
        {closedNote ? <p>{closedNote}</p> : null}
        <p>
          Not one place got a yes this round. Try different cuisines, a wider distance, or another price range.
        </p>
        {onReset ? (
          <button className="primary-button" onClick={onReset}>
            Vote again
          </button>
        ) : null}
        {onEditPreferences ? (
          <button className="secondary-button" onClick={onEditPreferences}>
            Change filters
          </button>
        ) : null}
      </div>
    );
  } else if (finished && topPick) {
    stage = (
      <MatchResult
        restaurant={topPick.restaurant}
        votes={roomVotes}
        participants={participants}
        onReset={onReset}
        unanimous={false}
        tiedWith={topPick.tiedWith}
        tieReason={topPick.reason}
        note={closedNote}
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
        {deadlineText ? (
          <p className="deadline-pill">
            <Timer size={15} aria-hidden="true" />
            {deadlineText}
          </p>
        ) : null}
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
        {onEditPreferences ? (
          <button className="primary-button" onClick={onEditPreferences}>
            Adjust filters
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="room-layout">
      <section className="voting-stage">
        {notice ? <p className="room-notice">{notice}</p> : null}
        {stage}
      </section>

      <aside className="room-sidebar">
        <div className="room-code">
          <div>
            <span>Room code</span>
            <strong>{roomCode}</strong>
            <em>{roomLabel}</em>
          </div>
          <ShareButton roomCode={roomCode} mode="share" />
        </div>

        <div className="participant-list">
          <h2>Dinner crew</h2>
          {participants.map((participant) => (
            <div className="participant" key={participant.id}>
              <span style={{ background: participant.color }}>{participant.name.charAt(0)}</span>
              <div>
                <strong>
                  {participant.name}
                  {participant.id === meId && participants.length > 1 ? " (you)" : ""}
                </strong>
                <small>
                  {reviewedBy(participant.id) >= restaurants.length && restaurants.length > 0
                    ? "Done voting"
                    : `${reviewedBy(participant.id)}/${restaurants.length} reviewed`}
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
          {onEditPreferences ? (
            <button className="secondary-button" onClick={onEditPreferences}>
              Edit preferences
            </button>
          ) : null}
        </div>
      </aside>

      <aside className="results-panel">
        <h2>Group pulse</h2>
        <p className="results-hint">Results unlock as you vote.</p>
        <div className="results-list" ref={pulseRef}>
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
                  {revealed ? `${stats.likes}/${participants.length} yes` : "Hidden"}
                </small>
              </div>
            );
          })}
        </div>
      </aside>
    </div>
  );
}
