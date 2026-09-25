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
import { useMemo, useState } from "react";
import { cuisineOptions, priceOptions, restaurants } from "@/data/restaurants";
import { filterRestaurants, getMatch, getVoteStats } from "@/lib/matching";
import type {
  Cuisine,
  Participant,
  Preferences,
  PriceLevel,
  Restaurant,
  Vote,
  VoteMap
} from "@/types/bitematch";

const demoParticipants: Participant[] = [
  { id: "you", name: "You", color: "#121212" },
  { id: "maya", name: "Maya", color: "#ef4444" },
  { id: "jules", name: "Jules", color: "#0f766e" },
  { id: "sam", name: "Sam", color: "#7c3aed" }
];

const starterVotes: VoteMap = {
  maya: {
    mida: "like",
    tora: "like",
    lolita: "pass",
    "thai-dish": "like",
    buttermilk: "like",
    greco: "pass",
    kaju: "like",
    mela: "like"
  },
  jules: {
    mida: "like",
    tora: "pass",
    lolita: "like",
    "thai-dish": "like",
    buttermilk: "pass",
    greco: "like",
    kaju: "like",
    mela: "pass"
  },
  sam: {
    mida: "like",
    tora: "like",
    lolita: "like",
    "thai-dish": "pass",
    buttermilk: "like",
    greco: "like",
    kaju: "pass",
    mela: "like"
  }
};

const roomCode = "4827";

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
  const [votes, setVotes] = useState<VoteMap>(starterVotes);

  const participants = useMemo(
    () => [
      { ...demoParticipants[0], name: name.trim() || "You" },
      ...demoParticipants.slice(1)
    ],
    [name]
  );

  const filteredRestaurants = useMemo(
    () => filterRestaurants(restaurants, preferences),
    [preferences]
  );

  const match = useMemo(
    () =>
      getMatch(
        filteredRestaurants,
        votes,
        participants.map((participant) => participant.id)
      ),
    [filteredRestaurants, participants, votes]
  );

  const activeRestaurant =
    filteredRestaurants[activeIndex % Math.max(filteredRestaurants.length, 1)];
  const userVotes = votes.you ?? {};
  const completedVotes = filteredRestaurants.filter(
    (restaurant) => userVotes[restaurant.id]
  ).length;

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
    setVotes(starterVotes);
    setActiveIndex(0);
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
            match={match}
            completedVotes={completedVotes}
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
        <div className="phone-mockup">
          <div className="phone-status">
            <span>Room 4827</span>
            <strong>4 voting</strong>
          </div>
          <div className="phone-card">
            <Image
              src="https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=700&q=80"
              alt=""
              fill
              priority
              sizes="280px"
            />
            <div className="phone-card-copy">
              <span>Italian · $$</span>
              <strong>Mida</strong>
              <small>South End · 1.2 mi</small>
            </div>
          </div>
          <div className="phone-vote-row">
            <span aria-label="Pass">
              <X size={18} />
            </span>
            <span aria-label="Like">
              <Heart size={18} />
            </span>
          </div>
          <div className="phone-match-banner">
            <PartyPopper size={18} />
            <div>
              <strong>3 friends liked this</strong>
              <span>Vote to see if it matches</span>
            </div>
          </div>
        </div>
        <div className="floating-card match-card">
          <PartyPopper size={20} />
          <div>
            <strong>It&apos;s a BiteMatch</strong>
            <span>Mida is the one</span>
          </div>
        </div>
        <div className="side-flow-card">
          <span>How it works</span>
          <ol>
            <li>Share a room code</li>
            <li>Everyone votes privately</li>
            <li>Reveal the group match</li>
          </ol>
        </div>
        <div className="floating-card code-card">
          <div>
            <strong>No account to join</strong>
            <span>Sign in only to save friends</span>
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
        <p>
          Set the guardrails first, invite the group, then let private voting do
          the awkward work.
        </p>

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
  match,
  completedVotes,
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
  match?: Restaurant;
  completedVotes: number;
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
          <button className="secondary-button" onClick={onEditPreferences}>
            Edit preferences
          </button>
        </div>
      </aside>

      <section className="voting-stage">
        {match ? (
          <MatchResult
            restaurant={match}
            votes={votes}
            participants={participants}
            onReset={onReset}
          />
        ) : activeRestaurant ? (
          <>
            <div className="stage-heading">
              <div>
                <div className="section-kicker">Private voting</div>
                <h2>Vote quietly. Match when it clicks.</h2>
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
              votes,
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
          <span>{restaurant.rating} rating</span>
        </div>
        <div className="tag-row">
          {restaurant.tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
        <div className="menu-preview" aria-label={`${restaurant.name} menu photos`}>
          {restaurant.menuImages.map((photo) => (
            <div className="menu-photo" key={photo.src}>
              <Image src={photo.src} alt={photo.alt} fill sizes="130px" />
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
