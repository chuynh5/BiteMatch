"use client";

import Image from "next/image";
import {
  ArrowRight,
  Check,
  Clock3,
  Copy,
  ExternalLink,
  Heart,
  MapPin,
  PartyPopper,
  Plus,
  Search,
  Share2,
  SlidersHorizontal,
  Sparkles,
  Users,
  X
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { cuisineOptions, priceOptions, restaurants } from "@/data/restaurants";
import { filterRestaurants, getMatch, getVoteStats } from "@/lib/matching";
import type {
  Cuisine,
  Participant,
  Preferences,
  PriceLevel,
  Restaurant,
  RestaurantSource,
  Vote,
  VoteMap
} from "@/types/bitematch";

const demoParticipants: Participant[] = [
  { id: "you", name: "You", color: "#121212" },
  { id: "maya", name: "Maya", color: "#ef4444" },
  { id: "jules", name: "Jules", color: "#0f766e" },
  { id: "sam", name: "Sam", color: "#7c3aed" }
];

const createdParticipants: Participant[] = [
  { id: "you", name: "You", color: "#121212" },
  { id: "nina", name: "Nina", color: "#d97863" },
  { id: "leo", name: "Leo", color: "#6e9b8e" },
  { id: "ari", name: "Ari", color: "#e7b967" },
  { id: "tess", name: "Tess", color: "#7c3aed" }
];

const demoRoomCode = "4827";
const createdRoomCode = "7392";
const metersPerMile = 1609.34;

type JoinNotice = {
  title: string;
  message: string;
};

type RoomMode = "demo" | "joined" | "created";

function createFriendVotes(restaurantsToVoteOn: Restaurant[], participantIds: string[]): VoteMap {
  return participantIds.reduce<VoteMap>((allVotes, participantId) => {
    allVotes[participantId] = restaurantsToVoteOn.reduce<Record<string, Vote>>(
      (restaurantVotes, restaurant, index) => {
        restaurantVotes[restaurant.id] =
          index === 0 || (restaurant.id.charCodeAt(0) + participantId.length + index) % 3 !== 0
            ? "like"
            : "pass";
        return restaurantVotes;
      },
      {}
    );
    return allVotes;
  }, {});
}

export default function Home() {
  const [step, setStep] = useState<"landing" | "setup" | "room">("landing");
  const [name, setName] = useState("Cara");
  const [joinCode, setJoinCode] = useState("");
  const [joinNotice, setJoinNotice] = useState<JoinNotice | null>(null);
  const [currentRoomCode, setCurrentRoomCode] = useState(demoRoomCode);
  const [roomMode, setRoomMode] = useState<RoomMode>("demo");
  const [preferences, setPreferences] = useState<Preferences>({
    cuisines: ["Italian", "Japanese", "Mexican", "Thai"],
    prices: ["$", "$$"],
    maxDistance: 3
  });
  const [activeIndex, setActiveIndex] = useState(0);
  const [votes, setVotes] = useState<VoteMap>({});
  const [restaurantOptions, setRestaurantOptions] = useState<Restaurant[]>(
    restaurants.map((restaurant) => ({ ...restaurant, source: "curated" }))
  );
  const [restaurantSource, setRestaurantSource] =
    useState<RestaurantSource>("curated");
  const [locationStatus, setLocationStatus] = useState<
    "idle" | "locating" | "live" | "fallback" | "error"
  >("idle");
  const [isPlacesConfigured, setIsPlacesConfigured] = useState(false);
  const [locationMessage, setLocationMessage] = useState(
    "Use your location for live nearby listings. Add Google Places later for official photos and ratings."
  );

  const participants = useMemo(
    () => {
      const roomParticipants =
        roomMode === "created" ? createdParticipants : demoParticipants;

      return [
        { ...roomParticipants[0], name: name.trim() || "You" },
        ...roomParticipants.slice(1)
      ];
    },
    [name, roomMode]
  );

  const filteredRestaurants = useMemo(
    () => filterRestaurants(restaurantOptions, preferences),
    [preferences, restaurantOptions]
  );

  const roomVotes = useMemo(
    () => ({
      ...createFriendVotes(
        filteredRestaurants,
        participants
          .map((participant) => participant.id)
          .filter((participantId) => participantId !== "you")
      ),
      ...votes
    }),
    [filteredRestaurants, participants, votes]
  );

  const match = useMemo(
    () =>
      getMatch(
        filteredRestaurants,
        roomVotes,
        participants.map((participant) => participant.id)
      ),
    [filteredRestaurants, participants, roomVotes]
  );

  const activeRestaurant =
    filteredRestaurants[activeIndex % Math.max(filteredRestaurants.length, 1)];
  const userVotes = votes.you ?? {};
  const completedVotes = filteredRestaurants.filter(
    (restaurant) => userVotes[restaurant.id]
  ).length;

  useEffect(() => {
    let shouldUpdate = true;

    async function checkLiveConfig() {
      try {
        const response = await fetch("/api/config");
        const data = (await response.json()) as {
          googlePlacesConfigured?: boolean;
        };

        if (!shouldUpdate) {
          return;
        }

        setIsPlacesConfigured(Boolean(data.googlePlacesConfigured));
        setLocationMessage(
          data.googlePlacesConfigured
            ? "Live restaurant search is ready. Use your location to find nearby options."
            : "Live nearby listings are available through OpenStreetMap. Google Places can be added later for richer photos and ratings."
        );
      } catch {
        if (shouldUpdate) {
          setIsPlacesConfigured(false);
          setLocationMessage("Use your location for live nearby listings. Curated demo restaurants show until then.");
        }
      }
    }

    checkLiveConfig();

    return () => {
      shouldUpdate = false;
    };
  }, []);

  function toggleCuisine(cuisine: Cuisine) {
    setPreferences((current) => ({
      ...current,
      cuisines: current.cuisines.includes(cuisine)
        ? current.cuisines.filter((item) => item !== cuisine)
        : [...current.cuisines, cuisine]
    }));
    resetDemo();
  }

  function togglePrice(price: PriceLevel) {
    setPreferences((current) => ({
      ...current,
      prices: current.prices.includes(price)
        ? current.prices.filter((item) => item !== price)
        : [...current.prices, price]
    }));
    resetDemo();
  }

  function updatePreferences(nextPreferences: Preferences) {
    setPreferences(nextPreferences);
    resetDemo();
  }

  function handleVote(restaurantId: string, vote: Vote) {
    setVotes((current) => ({
      ...current,
      you: {
        ...current.you,
        [restaurantId]: vote
      }
    }));
    setActiveIndex((current) =>
      Math.min(current + 1, Math.max(filteredRestaurants.length - 1, 0))
    );
  }

  function resetDemo() {
    setVotes({});
    setActiveIndex(0);
  }

  function handleJoinRoom(code: string) {
    const normalizedCode = code.replace(/\D/g, "").slice(0, 4);

    setJoinCode(normalizedCode);

    if (normalizedCode.length < 4) {
      setJoinNotice({
        title: "Enter a 4-digit code",
        message: `Room codes are four numbers. Try the demo room code ${demoRoomCode}.`
      });
      return;
    }

    if (normalizedCode === demoRoomCode) {
      setJoinNotice(null);
      setCurrentRoomCode(demoRoomCode);
      setRoomMode("joined");
      resetDemo();
      setStep("room");
      return;
    }

    setJoinNotice({
      title: "Room not found",
      message: `Room ${normalizedCode} does not exist in this demo. Try ${demoRoomCode} to join the sample dinner room.`
    });
  }

  async function loadNearbyRestaurants() {
    if (!("geolocation" in navigator)) {
      setLocationStatus("error");
      setLocationMessage("Location is not available in this browser, so the demo dataset is showing.");
      return;
    }

    setLocationStatus("locating");
    setLocationMessage("Checking nearby restaurants...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const params = new URLSearchParams({
            lat: String(position.coords.latitude),
            lng: String(position.coords.longitude),
            radius: String(Math.round(preferences.maxDistance * metersPerMile)),
            cuisines: preferences.cuisines.join(","),
            prices: preferences.prices.join(",")
          });
          const response = await fetch(`/api/restaurants?${params.toString()}`);
          const data = (await response.json()) as {
            restaurants: Restaurant[];
            source: RestaurantSource;
            message?: string;
          };

          setRestaurantOptions(data.restaurants);
          setRestaurantSource(data.source);
          setVotes({});
          setActiveIndex(0);
          setLocationStatus(data.source === "curated" ? "fallback" : "live");
          setLocationMessage(
            data.source === "google"
              ? "Showing live nearby restaurants from Google Places."
              : data.source === "osm"
                ? data.message ?? "Showing live nearby restaurant listings from OpenStreetMap."
              : data.message ?? "Using curated demo restaurants."
          );
        } catch {
          setLocationStatus("error");
          setLocationMessage("Live lookup failed, so the curated demo restaurants are still showing.");
        }
      },
      () => {
        setLocationStatus("fallback");
        setLocationMessage("Location permission was skipped, so the curated demo restaurants are showing.");
      },
      {
        enableHighAccuracy: false,
        maximumAge: 1000 * 60 * 10,
        timeout: 10000
      }
    );
  }

  return (
    <main>
      <section className="app-shell">
        <nav className="topbar" aria-label="Primary">
          <button className="brand" onClick={() => setStep("landing")}>
            <span>B</span>
            BiteMatch
          </button>
          <div className="nav-actions">
            <button className="primary-button" onClick={() => setStep("setup")}>
              Start Matching
              <ArrowRight size={18} />
            </button>
          </div>
        </nav>

        {step === "landing" && (
          <Landing
            onCreate={() => setStep("setup")}
            onDemo={() => {
              setCurrentRoomCode(demoRoomCode);
              setRoomMode("demo");
              resetDemo();
              setStep("room");
            }}
            joinCode={joinCode}
            setJoinCode={(code) => {
              setJoinCode(code);
              setJoinNotice(null);
            }}
            onJoinRoom={handleJoinRoom}
            joinNotice={joinNotice}
            onDismissJoinNotice={() => setJoinNotice(null)}
          />
        )}

        {step === "setup" && (
          <Setup
            name={name}
            setName={setName}
            preferences={preferences}
            setPreferences={updatePreferences}
            onCuisineToggle={toggleCuisine}
            onPriceToggle={togglePrice}
            onUseLocation={loadNearbyRestaurants}
            locationStatus={locationStatus}
            locationMessage={locationMessage}
            isPlacesConfigured={isPlacesConfigured}
            roomCode={createdRoomCode}
            onEnterRoom={() => {
              setCurrentRoomCode(createdRoomCode);
              setRoomMode("created");
              setActiveIndex(0);
              setStep("room");
            }}
          />
        )}

        {step === "room" && (
          <Room
            participants={participants}
            preferences={preferences}
            restaurants={filteredRestaurants}
            activeRestaurant={activeRestaurant}
            activeIndex={activeIndex}
            votes={votes}
            roomVotes={roomVotes}
            match={match}
            completedVotes={completedVotes}
            roomCode={currentRoomCode}
            roomMode={roomMode}
            restaurantSource={restaurantSource}
            locationMessage={locationMessage}
            onVote={handleVote}
            onReset={resetDemo}
            onEditPreferences={() => setStep("setup")}
          />
        )}
      </section>
    </main>
  );
}

function Landing({
  onCreate,
  onDemo,
  joinCode,
  setJoinCode,
  onJoinRoom,
  joinNotice,
  onDismissJoinNotice
}: {
  onCreate: () => void;
  onDemo: () => void;
  joinCode: string;
  setJoinCode: (code: string) => void;
  onJoinRoom: (code: string) => void;
  joinNotice: JoinNotice | null;
  onDismissJoinNotice: () => void;
}) {
  const prototypeRestaurants = [
    restaurants[0],
    restaurants[2],
    restaurants[3],
    restaurants[4],
    restaurants[1]
  ];

  return (
    <div className="landing">
      <div className="hero-copy">
        <div className="eyebrow">
          <Sparkles size={16} />
          A calmer way to pick a table
        </div>
        <h1>Dinner plans, made easy.</h1>
        <p>
          BiteMatch lets everyone quietly vote on restaurants, then shows the
          place your group can actually agree on.
        </p>
        <div className="hero-actions">
          <button className="primary-button large" onClick={onCreate}>
            Create a Group
            <Plus size={19} />
          </button>
          <button className="secondary-button large" onClick={onDemo}>
            Try the Demo Room
          </button>
        </div>
        <form
          className="home-join"
          onSubmit={(event) => {
            event.preventDefault();
            onJoinRoom(joinCode);
          }}
        >
          <label htmlFor="home-room-code">Join a Room</label>
          <div className="home-join-row">
            <input
              id="home-room-code"
              className="text-input"
              value={joinCode}
              onChange={(event) =>
                setJoinCode(event.target.value.replace(/\D/g, "").slice(0, 4))
              }
              placeholder="Room code"
              inputMode="numeric"
            />
            <button className="secondary-button" type="submit">
              Join
              <Search size={16} />
            </button>
          </div>
          {joinNotice ? (
            <div className="join-notice" role="status">
              <div>
                <strong>{joinNotice.title}</strong>
                <span>{joinNotice.message}</span>
              </div>
              <button type="button" onClick={onDismissJoinNotice} aria-label="Dismiss room message">
                <X size={14} />
              </button>
            </div>
          ) : null}
        </form>
        <div className="metric-strip" aria-label="Product highlights">
          <span>
            <Clock3 size={17} />
            Under 5 Minutes
          </span>
          <span>
            <Users size={17} />
            2-5 Friends
          </span>
          <span>
            <Heart size={17} />
            Private Voting
          </span>
        </div>
      </div>

      <div className="hero-visual" aria-label="BiteMatch preview">
        <div className="custom-phone-mockup">
          <div className="custom-phone-side side-left" aria-hidden="true" />
          <div className="custom-phone-side side-right" aria-hidden="true" />
          <div className="custom-phone-screen">
            <div className="phone-system-status" aria-hidden="true">
              <span>9:41</span>
              <div>
                <i className="signal-bars" />
                <i className="lte-mark">LTE</i>
                <i className="battery-mark" />
              </div>
            </div>
            <div className="custom-phone-notch" aria-hidden="true" />
            <div className="phone-status">
              <span>Tonight&apos;s Picks</span>
              <strong>4 Friends</strong>
            </div>
            <div className="prototype-stage compact-prototype-stage" aria-label="Animated restaurant voting demo">
              {prototypeRestaurants.map((restaurant, index) => (
                <article
                  className={`phone-card prototype-card prototype-card-${index + 1}`}
                  key={restaurant.id}
                >
                  <Image
                    src={restaurant.menuImages[0].src}
                    alt={restaurant.menuImages[0].alt}
                    fill
                    priority={index === 0}
                    sizes="220px"
                  />
                  <div className="swipe-stamp swipe-stamp-like">Like</div>
                  <div className="swipe-stamp swipe-stamp-pass">Pass</div>
                  <div className="phone-card-copy">
                    <span>
                      {restaurant.cuisine} · {restaurant.price}
                    </span>
                    <strong>{restaurant.name}</strong>
                    <small>
                      {restaurant.neighborhood} · {restaurant.distance} mi
                    </small>
                    <div className="profile-tags">
                      {restaurant.tags.slice(0, 2).map((tag) => (
                        <em key={tag}>{tag}</em>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <div className="prototype-match-pop" aria-hidden="true">
              <span>
                <PartyPopper size={13} />
                It&apos;s a match
              </span>
              <strong>Tora Japanese</strong>
              <small>Everyone liked this one.</small>
            </div>
            <div className="phone-vote-row">
              <span aria-label="Pass">
                <X size={18} />
              </span>
              <span aria-label="Like">
                <Heart size={18} fill="currentColor" />
              </span>
            </div>
            <div className="prototype-progress" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
            <p className="swipe-hint">Swipe, Skip &amp; Match on Dinner.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Setup({
  name,
  setName,
  preferences,
  setPreferences,
  onCuisineToggle,
  onPriceToggle,
  onUseLocation,
  locationStatus,
  locationMessage,
  isPlacesConfigured,
  roomCode,
  onEnterRoom
}: {
  name: string;
  setName: (name: string) => void;
  preferences: Preferences;
  setPreferences: (preferences: Preferences) => void;
  onCuisineToggle: (cuisine: Cuisine) => void;
  onPriceToggle: (price: PriceLevel) => void;
  onUseLocation: () => void;
  locationStatus: "idle" | "locating" | "live" | "fallback" | "error";
  locationMessage: string;
  isPlacesConfigured: boolean;
  roomCode: string;
  onEnterRoom: () => void;
}) {
  const unavailableCuisines = preferences.cuisines.filter(
    (cuisine) =>
      !restaurants.some(
        (restaurant) =>
          restaurant.cuisine === cuisine &&
          preferences.prices.includes(restaurant.price) &&
          restaurant.distance <= preferences.maxDistance
      )
  );

  return (
    <div className="setup-grid">
      <section className="setup-panel intro-panel">
        <div className="section-kicker">
          <SlidersHorizontal size={17} />
          Room setup
        </div>
        <h2>Build a dinner room your friends can answer fast.</h2>
        <p>Pick your vibe. Share the code. Find the match.</p>

        <label className="input-label" htmlFor="name">
          Your display name
        </label>
        <input
          id="name"
          className="text-input"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Your name"
        />

      </section>

      <section className="setup-panel">
        <div className="section-kicker">Preferences</div>
        <div className="control-block">
          <h3>Cuisine</h3>
          <div className="chip-grid">
            {cuisineOptions.map((cuisine) => (
              <button
                key={cuisine}
                className={
                  preferences.cuisines.includes(cuisine)
                    ? "chip selected"
                    : "chip"
                }
                onClick={() => onCuisineToggle(cuisine)}
              >
                {cuisine}
              </button>
            ))}
          </div>
          {unavailableCuisines.length > 0 ? (
            <div className="availability-note">
              <strong>Heads up</strong>
              <span>
                No {unavailableCuisines.join(", ")} restaurants match the current
                price range within {preferences.maxDistance.toFixed(1)} mi.
              </span>
            </div>
          ) : null}
        </div>

        <div className="control-block">
          <h3>Price</h3>
          <div className="segmented-control">
            {priceOptions.map((price) => (
              <button
                key={price}
                className={
                  preferences.prices.includes(price) ? "selected" : undefined
                }
                onClick={() => onPriceToggle(price)}
              >
                {price}
              </button>
            ))}
          </div>
        </div>

        <div className="control-block">
          <div className="range-heading">
            <h3>Distance</h3>
            <span>{preferences.maxDistance.toFixed(1)} mi</span>
          </div>
          <input
            className="range"
            type="range"
            min="1"
            max="5"
            step="0.5"
            value={preferences.maxDistance}
            onChange={(event) =>
              setPreferences({
                ...preferences,
                maxDistance: Number(event.target.value)
              })
            }
          />
        </div>

        <div className="location-box">
          <div>
            <span>Restaurant source</span>
            <p>{locationMessage}</p>
          </div>
          <button
            className="secondary-button"
            onClick={onUseLocation}
            disabled={locationStatus === "locating"}
          >
            <MapPin size={17} />
            {locationStatus === "locating"
              ? "Finding..."
              : isPlacesConfigured
                ? "Use my location"
                : "Use location via OSM"}
          </button>
        </div>

        <div className="room-link">
          <div>
            <span>Invite link</span>
            <strong>bitematch.app/r/{roomCode}</strong>
          </div>
          <button className="icon-button" title="Copy invite link">
            <Copy size={18} />
          </button>
        </div>

        <button className="primary-button full" onClick={onEnterRoom}>
          Create room {roomCode}
          <ArrowRight size={18} />
        </button>
      </section>
    </div>
  );
}

function Room({
  participants,
  preferences,
  restaurants,
  activeRestaurant,
  activeIndex,
  votes,
  roomVotes,
  match,
  completedVotes,
  roomCode,
  roomMode,
  restaurantSource,
  locationMessage,
  onVote,
  onReset,
  onEditPreferences
}: {
  participants: Participant[];
  preferences: Preferences;
  restaurants: Restaurant[];
  activeRestaurant?: Restaurant;
  activeIndex: number;
  votes: VoteMap;
  roomVotes: VoteMap;
  match?: Restaurant;
  completedVotes: number;
  roomCode: string;
  roomMode: RoomMode;
  restaurantSource: RestaurantSource;
  locationMessage: string;
  onVote: (restaurantId: string, vote: Vote) => void;
  onReset: () => void;
  onEditPreferences: () => void;
}) {
  const likedCount = activeRestaurant
    ? participants.filter(
        (participant) => roomVotes[participant.id]?.[activeRestaurant.id] === "like"
      ).length
    : 0;
  const hasUserVotedOnActive =
    activeRestaurant ? Boolean(votes.you?.[activeRestaurant.id]) : false;
  const activeStatus = activeRestaurant
    ? hasUserVotedOnActive
      ? `${likedCount}/${participants.length} friends like this option`
      : "Vote to reveal where the group overlaps"
    : "Waiting for a restaurant match";
  const pendingCount = Math.max(restaurants.length - completedVotes, 0);
  const pendingLabel = `${pendingCount} option${pendingCount === 1 ? "" : "s"} left`;
  const noResultCuisineLabel =
    preferences.cuisines.length > 0 ? preferences.cuisines.join(", ") : "any cuisine";
  const noResultPriceLabel =
    preferences.prices.length > 0 ? preferences.prices.join("/") : "any price";
  const roomModeLabel =
    roomMode === "created"
      ? "Created Room"
      : roomMode === "joined"
        ? "Joined Demo Room"
        : "Demo Room";

  return (
    <div className="room-layout">
      <aside className="room-sidebar">
        <div className="room-code">
          <span>Room code</span>
          <strong>{roomCode}</strong>
          <em>{roomModeLabel}</em>
          <button className="icon-button" title="Share room">
            <Share2 size={18} />
          </button>
        </div>

        <div className="participant-list">
          <h2>Dinner crew</h2>
          {participants.map((participant) => (
            <div className="participant" key={participant.id}>
              <span style={{ background: participant.color }}>
                {participant.name.charAt(0)}
              </span>
              <div>
                <strong>{participant.name}</strong>
                <small>
                  {votes[participant.id] ? "Voting" : "Ready to start"}
                </small>
              </div>
            </div>
          ))}
        </div>

        <div className="preference-summary">
          <span>Tonight&apos;s filters</span>
          <p>
            {preferences.cuisines.join(", ") || "Any cuisine"} ·{" "}
            {preferences.prices.join("/")} · {preferences.maxDistance} mi
          </p>
          <div className={restaurantSource !== "curated" ? "source-pill live" : "source-pill"}>
            {restaurantSource === "google"
              ? "Live Google Places"
              : restaurantSource === "osm"
                ? "Live OpenStreetMap"
                : "Curated demo data"}
          </div>
          <button className="secondary-button" onClick={onEditPreferences}>
            Edit preferences
          </button>
        </div>
      </aside>

      <section className="voting-stage">
        {match ? (
          <MatchResult
            restaurant={match}
            votes={roomVotes}
            participants={participants}
            onReset={onReset}
          />
        ) : activeRestaurant ? (
          <>
            <div className="stage-heading">
              <div>
                <h2>Vote quietly. Match when it clicks.</h2>
                <p className="quiet-note">
                  Private voting keeps everyone honest. {locationMessage}
                </p>
              </div>
              <span>
                {completedVotes}/{restaurants.length} options reviewed
              </span>
            </div>
            <div className="room-activity">
              <span>{activeStatus}</span>
              <strong>{pendingLabel}</strong>
            </div>

            <RestaurantCard restaurant={activeRestaurant} />

            <div className="vote-actions">
              <button
                className="pass-button"
                onClick={() => onVote(activeRestaurant.id, "pass")}
              >
                <X size={24} />
                Pass
              </button>
              <button
                className="like-button"
                onClick={() => onVote(activeRestaurant.id, "like")}
              >
                <Heart size={24} />
                Like
              </button>
            </div>

            <div className="progress-dots" aria-label="Restaurants reviewed">
              {restaurants.map((restaurant, index) => (
                <span
                  key={restaurant.id}
                  className={index <= activeIndex ? "active" : undefined}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="empty-state">
            <h2>Too specific for dinner.</h2>
            <p>
              No restaurants found for {noResultCuisineLabel} at {noResultPriceLabel}
              {" "}within {preferences.maxDistance} mi.
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
        )}
      </section>

      <aside className="results-panel">
        <h2>Live group pulse</h2>
        <div className="results-list">
          {restaurants.map((restaurant) => {
            const stats = getVoteStats(
              restaurant,
              roomVotes,
              participants.map((participant) => participant.id)
            );

            return (
              <div className="result-row" key={restaurant.id}>
                <div>
                  <strong>{restaurant.name}</strong>
                  <span>{restaurant.neighborhood}</span>
                </div>
                <div className="vote-meter">
                  <span style={{ width: `${(stats.likes / 4) * 100}%` }} />
                </div>
                <small>{stats.likes} yes</small>
              </div>
            );
          })}
        </div>
      </aside>
    </div>
  );
}

function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  return (
    <article className="restaurant-card">
      <div className="restaurant-image">
        <Image
          src={restaurant.image}
          alt={`${restaurant.name} food preview`}
          fill
          unoptimized={restaurant.source === "google"}
          sizes="(max-width: 900px) 92vw, 42vw"
        />
      </div>
      <div className="restaurant-content">
        <div>
          <span className="restaurant-meta">
            {restaurant.cuisine} · {restaurant.price}
          </span>
          <h3>{restaurant.name}</h3>
          <p>{restaurant.vibe}</p>
        </div>
        <div className="detail-grid">
          <span>
            <MapPin size={16} />
            {restaurant.neighborhood}
          </span>
          <span>{restaurant.distance} mi</span>
          <span>{restaurant.rating > 0 ? `${restaurant.rating} rating` : "Live listing"}</span>
        </div>
        <div className="tag-row">
          {restaurant.tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
        <div className="menu-preview" aria-label={`${restaurant.name} menu photos`}>
          {restaurant.menuImages.map((photo) => (
            <div className="menu-photo" key={photo.src}>
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                unoptimized={restaurant.source === "google"}
                sizes="130px"
              />
            </div>
          ))}
        </div>
        <a
          className="map-preview"
          href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
            restaurant.mapQuery
          )}`}
          target="_blank"
          rel="noreferrer"
          aria-label={`Open Google Maps directions to ${restaurant.name}`}
        >
          <div className="mini-map" aria-hidden="true">
            <span className="map-road diagonal" />
            <span className="map-road horizontal" />
            <span className="map-pin">
              <MapPin size={18} />
            </span>
          </div>
          <div className="map-copy">
            <span>Open in Google Maps</span>
            <strong>{restaurant.address}</strong>
          </div>
          <ExternalLink size={18} />
        </a>
      </div>
    </article>
  );
}

function MatchResult({
  restaurant,
  votes,
  participants,
  onReset
}: {
  restaurant: Restaurant;
  votes: VoteMap;
  participants: Participant[];
  onReset: () => void;
}) {
  return (
    <div className="match-result">
      <div className="match-photo">
        <Image
          src={restaurant.image}
          alt={`${restaurant.name} matched restaurant`}
          fill
          unoptimized={restaurant.source === "google"}
          sizes="(max-width: 900px) 92vw, 48vw"
        />
      </div>
      <div className="match-copy">
        <div className="celebration-icon">
          <PartyPopper size={28} />
        </div>
        <span className="section-kicker">Group match</span>
        <h2>Dinner is decided.</h2>
        <p>
          Everyone privately liked <strong>{restaurant.name}</strong>. Send the
          directions and skip the group chat spiral.
        </p>
        <div className="match-pill-row">
          <span>{restaurant.cuisine}</span>
          <span>{restaurant.price}</span>
          <span>{restaurant.distance} mi</span>
        </div>
        <div className="match-avatars">
          {participants.map((participant) => (
            <span key={participant.id} style={{ background: participant.color }}>
              {participant.name.charAt(0)}
            </span>
          ))}
        </div>
        <div className="matched-restaurant">
          <strong>{restaurant.name}</strong>
          <span>
            {restaurant.cuisine} · {restaurant.price} · {restaurant.distance} mi
          </span>
          <span>{restaurant.address}</span>
          <small>
            {participants.filter((participant) => votes[participant.id]?.[restaurant.id] === "like").length}
            /{participants.length} yes votes
          </small>
        </div>
        <a
          className="primary-button match-action"
          href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
            restaurant.mapQuery
          )}`}
          target="_blank"
          rel="noreferrer"
        >
          Get directions
          <ExternalLink size={18} />
        </a>
        <button className="secondary-button match-action" onClick={onReset}>
          Restart demo
        </button>
      </div>
    </div>
  );
}
