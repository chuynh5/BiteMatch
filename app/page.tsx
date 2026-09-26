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

const roomCode = "4827";
const metersPerMile = 1609.34;

function createFriendVotes(restaurantsToVoteOn: Restaurant[]): VoteMap {
  return ["maya", "jules", "sam"].reduce<VoteMap>((allVotes, participantId) => {
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
    () => [
      { ...demoParticipants[0], name: name.trim() || "You" },
      ...demoParticipants.slice(1)
    ],
    [name]
  );

  const filteredRestaurants = useMemo(
    () => filterRestaurants(restaurantOptions, preferences),
    [preferences, restaurantOptions]
  );

  const roomVotes = useMemo(
    () => ({
      ...createFriendVotes(filteredRestaurants),
      ...votes
    }),
    [filteredRestaurants, votes]
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
  }

  function togglePrice(price: PriceLevel) {
    setPreferences((current) => ({
      ...current,
      prices: current.prices.includes(price)
        ? current.prices.filter((item) => item !== price)
        : [...current.prices, price]
    }));
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
            <button className="ghost-button" onClick={() => setStep("setup")}>
              Join room
            </button>
            <button className="primary-button" onClick={() => setStep("setup")}>
              Start matching
              <ArrowRight size={18} />
            </button>
          </div>
        </nav>

        {step === "landing" && (
          <Landing
            onCreate={() => setStep("setup")}
            onDemo={() => setStep("room")}
          />
        )}

        {step === "setup" && (
          <Setup
            name={name}
            setName={setName}
            joinCode={joinCode}
            setJoinCode={setJoinCode}
            preferences={preferences}
            setPreferences={setPreferences}
            onCuisineToggle={toggleCuisine}
            onPriceToggle={togglePrice}
            onUseLocation={loadNearbyRestaurants}
            locationStatus={locationStatus}
            locationMessage={locationMessage}
            isPlacesConfigured={isPlacesConfigured}
            onEnterRoom={() => {
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
  onDemo
}: {
  onCreate: () => void;
  onDemo: () => void;
}) {
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
            Create a group
            <Plus size={19} />
          </button>
          <button className="secondary-button large" onClick={onDemo}>
            Try the demo room
          </button>
        </div>
        <div className="metric-strip" aria-label="Product highlights">
          <span>
            <Clock3 size={17} />
            Under 5 minutes
          </span>
          <span>
            <Users size={17} />
            2-6 friends
          </span>
          <span>
            <Heart size={17} />
            Private voting
          </span>
        </div>
      </div>

      <div className="hero-visual" aria-label="BiteMatch preview">
        <div className="swipe-card-stack" aria-hidden="true">
          <span className="stack-card stack-card-one" />
          <span className="stack-card stack-card-two" />
        </div>
        <div className="phone-mockup">
          <div className="phone-status">
            <span>Tonight&apos;s picks</span>
            <strong>4 friends</strong>
          </div>
          <div className="phone-card">
            <Image
              src={restaurants[0].menuImages[0].src}
              alt={restaurants[0].menuImages[0].alt}
              fill
              priority
              sizes="280px"
            />
            <div className="phone-card-copy">
              <span>Italian · $$</span>
              <strong>Mida</strong>
              <small>South End · 1.2 mi</small>
              <div className="profile-tags">
                <em>Fresh pasta</em>
                <em>Shareable</em>
              </div>
            </div>
          </div>
          <div className="phone-vote-row">
            <span aria-label="Pass">
              <X size={18} />
            </span>
            <span aria-label="Like">
              <Heart size={18} fill="currentColor" />
            </span>
          </div>
          <p className="swipe-hint">Swipe through restaurants. Match when everyone says yes.</p>
        </div>
        <div className="floating-card match-card">
          <PartyPopper size={20} />
          <div>
            <strong>It&apos;s a BiteMatch</strong>
            <span>Mida is the one</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Setup({
  name,
  setName,
  joinCode,
  setJoinCode,
  preferences,
  setPreferences,
  onCuisineToggle,
  onPriceToggle,
  onUseLocation,
  locationStatus,
  locationMessage,
  isPlacesConfigured,
  onEnterRoom
}: {
  name: string;
  setName: (name: string) => void;
  joinCode: string;
  setJoinCode: (code: string) => void;
  preferences: Preferences;
  setPreferences: (preferences: Preferences) => void;
  onCuisineToggle: (cuisine: Cuisine) => void;
  onPriceToggle: (price: PriceLevel) => void;
  onUseLocation: () => void;
  locationStatus: "idle" | "locating" | "live" | "fallback" | "error";
  locationMessage: string;
  isPlacesConfigured: boolean;
  onEnterRoom: () => void;
}) {
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

        <div className="join-box">
          <label className="input-label" htmlFor="code">
            Join an existing room
          </label>
          <div className="input-with-button">
            <input
              id="code"
              className="text-input"
              value={joinCode}
              onChange={(event) =>
                setJoinCode(event.target.value.replace(/\D/g, "").slice(0, 4))
              }
              placeholder="Room code"
              inputMode="numeric"
            />
            <button className="icon-button" title="Search for room">
              <Search size={18} />
            </button>
          </div>
        </div>
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
          Enter room {joinCode ? joinCode : roomCode}
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
  restaurantSource: RestaurantSource;
  locationMessage: string;
  onVote: (restaurantId: string, vote: Vote) => void;
  onReset: () => void;
  onEditPreferences: () => void;
}) {
  return (
    <div className="room-layout">
      <aside className="room-sidebar">
        <div className="room-code">
          <span>Room code</span>
          <strong>{roomCode}</strong>
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
            {preferences.cuisines.slice(0, 3).join(", ") || "Any cuisine"} ·{" "}
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
                <div className="section-kicker">Private voting</div>
                <h2>Vote quietly. Match when it clicks.</h2>
                <p>{locationMessage}</p>
              </div>
              <span>
                {completedVotes}/{restaurants.length} reviewed
              </span>
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
            <h2>No restaurants match those filters.</h2>
            <p>Try widening the cuisine, price, or distance preferences.</p>
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
        <h2>It&apos;s a BiteMatch.</h2>
        <p>
          Everyone privately liked <strong>{restaurant.name}</strong>. Time to
          send directions and start ordering.
        </p>
        <div className="match-avatars">
          {participants.map((participant) => (
            <span key={participant.id} style={{ background: participant.color }}>
              <Check size={15} />
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
          className="primary-button"
          href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
            restaurant.mapQuery
          )}`}
          target="_blank"
          rel="noreferrer"
        >
          Get directions
          <ExternalLink size={18} />
        </a>
        <button className="secondary-button" onClick={onReset}>
          Restart demo
        </button>
      </div>
    </div>
  );
}
