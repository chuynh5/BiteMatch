"use client";

import { ArrowRight, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Room } from "@/components/Room";
import {
  RoomFullError,
  RoomNotFoundError,
  getRoomStore,
  myIdentity,
  type RoomSnapshot
} from "@/lib/rooms";
import { getMatch, getTopPick } from "@/lib/matching";
import type { Vote, VoteMap } from "@/types/bitematch";

/** A real room: everyone who opens /room?code=XXXX sees the same participants and votes. */
export function LiveRoom({ code }: { code: string }) {
  const store = getRoomStore();
  // undefined = still loading, null = no such room
  const [snapshot, setSnapshot] = useState<RoomSnapshot | null | undefined>(undefined);
  const [meId, setMeId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Votes you've cast that the database hasn't echoed back yet, so the card moves on instantly.
  const [pending, setPending] = useState<Record<string, Vote>>({});

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read who you are in this room once, on load
    setMeId(myIdentity.get(code));
    return store.subscribe(code, setSnapshot);
  }, [code, store]);

  const participants = useMemo(() => snapshot?.participants ?? [], [snapshot]);
  const restaurants = useMemo(() => snapshot?.restaurants ?? [], [snapshot]);
  const participantIds = useMemo(() => participants.map((person) => person.id), [participants]);
  const joined = Boolean(meId && participantIds.includes(meId));

  const roomVotes: VoteMap = useMemo(() => {
    const votes = { ...(snapshot?.votes ?? {}) };
    if (meId) votes[meId] = { ...votes[meId], ...pending };
    return votes;
  }, [snapshot, meId, pending]);

  if (snapshot === undefined) {
    return <RoomMessage title="Opening the room…" body={`Finding room ${code}.`} />;
  }

  if (snapshot === null) {
    return (
      <RoomMessage
        title="Room not found"
        body={`There's no room with code ${code}. Check the code with whoever invited you, or start your own.`}
        action
      />
    );
  }

  if (!joined || !meId) {
    return (
      <div className="join-card">
        <span className="section-kicker">
          <Users size={15} />
          Room {code}
        </span>
        <h2>You&apos;re invited to pick dinner.</h2>
        <p>
          {participants.length > 0
            ? `${participants.map((person) => person.name).join(", ")} ${participants.length === 1 ? "is" : "are"} already here.`
            : "Be the first one in."}{" "}
          Vote privately on {restaurants.length} places. The match shows up when everyone agrees.
        </p>
        {participants.length > 0 ? (
          <div className="match-avatars" aria-hidden="true">
            {participants.map((person) => (
              <span key={person.id} style={{ background: person.color }}>
                {person.name.charAt(0)}
              </span>
            ))}
          </div>
        ) : null}
        <form
          className="join-card-form"
          onSubmit={async (event) => {
            event.preventDefault();
            const trimmed = name.trim();
            if (!trimmed) {
              setError("Add your name so your friends know who's voting.");
              return;
            }
            setJoining(true);
            setError(null);
            try {
              const me = await store.joinRoom(code, trimmed);
              myIdentity.set(code, me.id);
              setMeId(me.id);
            } catch (joinError) {
              setError(
                joinError instanceof RoomFullError || joinError instanceof RoomNotFoundError
                  ? joinError.message
                  : "Couldn't join the room. Check your connection and try again."
              );
            } finally {
              setJoining(false);
            }
          }}
        >
          <label className="input-label" htmlFor="join-name">
            Your name
          </label>
          <div className="home-join-row">
            <input
              id="join-name"
              className="text-input"
              value={name}
              maxLength={40}
              autoComplete="given-name"
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Cara"
            />
            <button className="primary-button" type="submit" disabled={joining}>
              {joining ? "Joining…" : "Join"}
              <ArrowRight size={17} />
            </button>
          </div>
          {error ? (
            <p className="form-error" role="alert">
              {error}
            </p>
          ) : null}
        </form>
      </div>
    );
  }

  const reviewedBy = (id: string) => restaurants.filter((restaurant) => roomVotes[id]?.[restaurant.id]).length;
  const firstUnvoted = restaurants.findIndex((restaurant) => !roomVotes[meId]?.[restaurant.id]);
  const activeIndex = firstUnvoted === -1 ? restaurants.length : firstUnvoted;
  const everyoneDone = participants.every((person) => reviewedBy(person.id) >= restaurants.length);
  const match = participants.length >= 2 ? getMatch(restaurants, roomVotes, participantIds) : undefined;
  const topPick =
    participants.length >= 2 && everyoneDone ? getTopPick(restaurants, roomVotes, participantIds)?.restaurant : undefined;
  const waitingFor = participants.filter((person) => person.id !== meId && reviewedBy(person.id) < restaurants.length);

  return (
    <Room
      meId={meId}
      participants={participants}
      preferences={snapshot.preferences}
      restaurants={restaurants}
      activeIndex={activeIndex}
      roomVotes={roomVotes}
      match={match}
      topPick={topPick}
      waitingFor={waitingFor}
      roomCode={code}
      roomLabel={`${participants.length} ${participants.length === 1 ? "person" : "people"} here`}
      restaurantSource={restaurants[0]?.source ?? "curated"}
      notice={
        error ??
        (store.kind === "device"
          ? "Testing mode: this room only works on this device. Connect the database to play with friends on their phones."
          : undefined)
      }
      onVote={async (restaurantId, vote) => {
        setPending((current) => ({ ...current, [restaurantId]: vote }));
        try {
          await store.castVote(code, meId, restaurantId, vote);
          setError(null);
        } catch {
          setPending((current) => {
            const next = { ...current };
            delete next[restaurantId];
            return next;
          });
          setError("That vote didn't save. Check your connection and try again.");
        }
      }}
    />
  );
}

function RoomMessage({ title, body, action }: { title: string; body: string; action?: boolean }) {
  return (
    <div className="join-card">
      <h2>{title}</h2>
      <p>{body}</p>
      {action ? (
        <Link className="primary-button" href="/">
          Go to BiteMatch
          <ArrowRight size={17} />
        </Link>
      ) : null}
    </div>
  );
}
