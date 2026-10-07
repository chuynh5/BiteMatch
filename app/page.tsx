"use client";

import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Landing, type JoinNotice } from "@/components/Landing";
import { Room, type RoomMode } from "@/components/Room";
import { Setup, type LocationStatus } from "@/components/Setup";
import { restaurants } from "@/data/restaurants";
import { createFriendVotes } from "@/lib/demoVotes";
import { DEFAULT_DEADLINE_MINUTES } from "@/lib/deadline";
import { MAX_ROOM_RESTAURANTS } from "@/lib/limits";
import { pickForRoom } from "@/lib/pickRestaurants";
import { getRoomStore, myIdentity } from "@/lib/rooms";
import { filterRestaurants, getMatch, getTopPick } from "@/lib/matching";
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
  { id: "you", name: "You", color: "#211c18" },
  { id: "maya", name: "Maya", color: "#d97863" },
  { id: "jules", name: "Jules", color: "#6e9b8e" },
  { id: "sam", name: "Sam", color: "#8b6fc9" }
];

const demoRoomCode = "4827";
const metersPerMile = 1609.34;

export default function Home() {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  /** Setup is used both to create a real room and to tweak the demo room's filters. */
  const [setupFor, setSetupFor] = useState<"new-room" | "demo">("new-room");
  const [step, setStep] = useState<"landing" | "setup" | "room">("landing");
  const [name, setName] = useState("Cara");
  const [joinCode, setJoinCode] = useState("");
  const [joinNotice, setJoinNotice] = useState<JoinNotice | null>(null);
  const [currentRoomCode, setCurrentRoomCode] = useState(demoRoomCode);
  const [roomMode, setRoomMode] = useState<RoomMode>("demo");
  const [preferences, setPreferences] = useState<Preferences>({
    cuisines: ["Italian", "Japanese", "Mexican", "Thai"],
    prices: ["$", "$$"],
    maxDistance: 3,
    deadlineMinutes: DEFAULT_DEADLINE_MINUTES
  });
  const [activeIndex, setActiveIndex] = useState(0);
  const [votes, setVotes] = useState<VoteMap>({});
  const [restaurantOptions, setRestaurantOptions] = useState<Restaurant[]>(
    restaurants.map((restaurant) => ({ ...restaurant, source: "curated" }))
  );
  const [restaurantSource, setRestaurantSource] = useState<RestaurantSource>("curated");
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("idle");
  const [isPlacesConfigured, setIsPlacesConfigured] = useState(false);
  const [locationMessage, setLocationMessage] = useState(
    "Use your location for live nearby listings. Add Google Places later for official photos and ratings."
  );

  const participants = useMemo(
    () => [{ ...demoParticipants[0], name: name.trim() || "You" }, ...demoParticipants.slice(1)],
    [name]
  );

  const participantIds = useMemo(() => participants.map((participant) => participant.id), [participants]);

  const filteredRestaurants = useMemo(
    () => filterRestaurants(restaurantOptions, preferences),
    [preferences, restaurantOptions]
  );

  const roomVotes = useMemo(
    () => ({
      ...createFriendVotes(
        filteredRestaurants,
        participantIds.filter((participantId) => participantId !== "you")
      ),
      ...votes
    }),
    [filteredRestaurants, participantIds, votes]
  );

  const match = useMemo(
    () => getMatch(filteredRestaurants, roomVotes, participantIds),
    [filteredRestaurants, participantIds, roomVotes]
  );

  const topPick = useMemo(
    () => getTopPick(filteredRestaurants, roomVotes, participantIds),
    [filteredRestaurants, participantIds, roomVotes]
  );

  // Ask the server whether Google Places is configured.
  useEffect(() => {
    let shouldUpdate = true;

    fetch("/api/config")
      .then((response) => response.json() as Promise<{ googlePlacesConfigured?: boolean }>)
      .then((data) => {
        if (!shouldUpdate) return;
        setIsPlacesConfigured(Boolean(data.googlePlacesConfigured));
        setLocationMessage(
          data.googlePlacesConfigured
            ? "Live restaurant search is ready. Use your location to find nearby options."
            : "Live nearby listings are available through OpenStreetMap. Google Places can be added later for richer photos and ratings."
        );
      })
      .catch(() => {
        if (!shouldUpdate) return;
        setIsPlacesConfigured(false);
        setLocationMessage("Use your location for live nearby listings. Demo restaurants show until then.");
      });

    return () => {
      shouldUpdate = false;
    };
  }, []);

  // Each screen should open at the top, not wherever the last one was scrolled.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [step]);

  // Old-style invite links look like /?room=1234. Real rooms live at /room?code=1234.
  useEffect(() => {
    const room = (new URLSearchParams(window.location.search).get("room") ?? "").replace(/\D/g, "").slice(0, 4);
    if (room.length === 4 && room !== demoRoomCode) {
      router.replace(`/room?code=${room}`);
    } else if (room) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of the URL on load
      setJoinCode(room);
    }
  }, [router]);

  async function createRealRoom() {
    const hostName = name.trim();
    if (!hostName) {
      setCreateError("Add your display name first so friends know whose room it is.");
      return;
    }
    if (filteredRestaurants.length === 0) {
      setCreateError("No restaurants match these filters yet. Loosen them a little before creating the room.");
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      const { code, me } = await getRoomStore().createRoom({
        hostName,
        preferences,
        restaurants: pickForRoom(filteredRestaurants, preferences.cuisines, MAX_ROOM_RESTAURANTS)
      });
      myIdentity.set(code, me.id);
      router.push(`/room?code=${code}`);
    } catch {
      setCreateError("Couldn't create the room. Check your connection and try again.");
      setCreating(false);
    }
  }

  function resetVotes() {
    setVotes({});
    setActiveIndex(0);
  }

  function toggleCuisine(cuisine: Cuisine) {
    setPreferences((current) => ({
      ...current,
      cuisines: current.cuisines.includes(cuisine)
        ? current.cuisines.filter((item) => item !== cuisine)
        : [...current.cuisines, cuisine]
    }));
    resetVotes();
  }

  function togglePrice(price: PriceLevel) {
    setPreferences((current) => ({
      ...current,
      prices: current.prices.includes(price)
        ? current.prices.filter((item) => item !== price)
        : [...current.prices, price]
    }));
    resetVotes();
  }

  function handleVote(restaurantId: string, vote: Vote) {
    setVotes((current) => ({
      ...current,
      you: { ...current.you, [restaurantId]: vote }
    }));
    // Past the last card means "finished", which shows the closest-call result.
    setActiveIndex((current) => Math.min(current + 1, filteredRestaurants.length));
  }

  function enterRoom(code: string, mode: RoomMode) {
    setCurrentRoomCode(code);
    setRoomMode(mode);
    resetVotes();
    setStep("room");
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

    setJoinNotice(null);
    if (normalizedCode === demoRoomCode) {
      enterRoom(demoRoomCode, "joined");
      return;
    }

    // Real room: the room page checks the code and asks for your name.
    router.push(`/room?code=${normalizedCode}`);
  }

  async function loadNearbyRestaurants() {
    if (!("geolocation" in navigator)) {
      setLocationStatus("error");
      setLocationMessage("Location is not available in this browser, so the demo restaurants are showing.");
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
          resetVotes();
          setLocationStatus(data.source === "curated" ? "fallback" : "live");
          setLocationMessage(
            data.source === "google"
              ? "Showing live nearby restaurants from Google Places."
              : data.source === "osm"
                ? data.message ?? "Showing live nearby restaurant listings from OpenStreetMap."
                : data.message ?? "Using demo restaurants."
          );
        } catch {
          setLocationStatus("error");
          setLocationMessage("Live lookup failed, so the demo restaurants are still showing.");
        }
      },
      () => {
        setLocationStatus("fallback");
        setLocationMessage("Location permission was skipped, so the demo restaurants are showing.");
      },
      { enableHighAccuracy: false, maximumAge: 1000 * 60 * 10, timeout: 10000 }
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
          {step === "landing" ? (
            <div className="nav-actions">
              <button
                className="primary-button"
                onClick={() => {
                  setSetupFor("new-room");
                  setStep("setup");
                }}
              >
                Start Matching
                <ArrowRight size={18} />
              </button>
            </div>
          ) : null}
        </nav>

        {step === "landing" && (
          <Landing
            onCreate={() => {
              setSetupFor("new-room");
              setStep("setup");
            }}
            onDemo={() => enterRoom(demoRoomCode, "demo")}
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
            setPreferences={(next) => {
              setPreferences(next);
              resetVotes();
            }}
            onCuisineToggle={toggleCuisine}
            onPriceToggle={togglePrice}
            onUseLocation={loadNearbyRestaurants}
            locationStatus={locationStatus}
            locationMessage={locationMessage}
            isPlacesConfigured={isPlacesConfigured}
            restaurantOptions={restaurantOptions}
            submitLabel={setupFor === "demo" ? "Back to the demo room" : creating ? "Creating room…" : "Create room"}
            submitting={creating}
            submitError={setupFor === "new-room" ? createError : null}
            showDeadline={setupFor === "new-room"}
            onSubmit={setupFor === "demo" ? () => enterRoom(currentRoomCode, roomMode) : createRealRoom}
          />
        )}

        {step === "room" && (
          <Room
            meId="you"
            participants={participants}
            preferences={preferences}
            restaurants={filteredRestaurants}
            activeIndex={activeIndex}
            roomVotes={roomVotes}
            match={match}
            topPick={topPick}
            roomCode={currentRoomCode}
            roomLabel={roomMode === "joined" ? "Joined demo room" : "Demo room"}
            restaurantSource={restaurantSource}
            onVote={handleVote}
            onReset={resetVotes}
            onEditPreferences={() => {
              setSetupFor("demo");
              setStep("setup");
            }}
          />
        )}
      </section>
    </main>
  );
}
