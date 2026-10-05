import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Participant, Preferences, Restaurant, Vote, VoteMap } from "@/types/bitematch";
import {
  MAX_PARTICIPANTS,
  RoomFullError,
  RoomNotFoundError,
  colorFor,
  randomRoomCode,
  reservedCodes,
  type RoomSnapshot,
  type RoomStore
} from "@/lib/rooms/types";

/**
 * Rooms in a shared Supabase (Postgres) database, so friends on different
 * phones see the same room. Tables are created by supabase/schema.sql.
 */

type RoomRow = { code: string; preferences: Preferences; restaurants: Restaurant[] };
type ParticipantRow = { id: string; room_code: string; name: string; color: string; joined_at: string };
type VoteRow = { participant_id: string; restaurant_id: string; vote: Vote };

// Safety net in case Realtime isn't enabled on the tables: refresh this often anyway.
const POLL_MS = 8000;

export function createSupabaseStore(url: string, anonKey: string): RoomStore {
  const db: SupabaseClient = createClient(url, anonKey, {
    auth: { persistSession: false }
  });

  async function fetchSnapshot(code: string): Promise<RoomSnapshot | null> {
    const [roomResult, peopleResult, votesResult] = await Promise.all([
      db.from("rooms").select("code, preferences, restaurants").eq("code", code).maybeSingle<RoomRow>(),
      db
        .from("participants")
        .select("id, room_code, name, color, joined_at")
        .eq("room_code", code)
        .order("joined_at", { ascending: true })
        .returns<ParticipantRow[]>(),
      db.from("votes").select("participant_id, restaurant_id, vote").eq("room_code", code).returns<VoteRow[]>()
    ]);

    if (roomResult.error) throw roomResult.error;
    if (!roomResult.data) return null;
    if (peopleResult.error) throw peopleResult.error;
    if (votesResult.error) throw votesResult.error;

    const votes: VoteMap = {};
    for (const row of votesResult.data ?? []) {
      votes[row.participant_id] = { ...votes[row.participant_id], [row.restaurant_id]: row.vote };
    }

    return {
      code: roomResult.data.code,
      preferences: roomResult.data.preferences,
      restaurants: roomResult.data.restaurants,
      participants: (peopleResult.data ?? []).map((row) => ({ id: row.id, name: row.name, color: row.color })),
      votes
    };
  }

  async function addParticipant(code: string, name: string, index: number): Promise<Participant> {
    const { data, error } = await db
      .from("participants")
      .insert({ room_code: code, name, color: colorFor(index) })
      .select("id, name, color")
      .single<Participant>();
    if (error) throw error;
    return data;
  }

  return {
    kind: "supabase",

    async createRoom({ hostName, preferences, restaurants }) {
      // Try a few random codes in case one is taken (primary-key conflict).
      for (let attempt = 0; attempt < 8; attempt++) {
        const code = randomRoomCode();
        if (reservedCodes.has(code)) continue;
        const { error } = await db.from("rooms").insert({ code, preferences, restaurants });
        if (!error) {
          const me = await addParticipant(code, hostName, 0);
          return { code, me };
        }
        if (error.code !== "23505") throw error; // 23505 = duplicate key, try another code
      }
      throw new Error("Couldn't find a free room code. Try again.");
    },

    async joinRoom(code, name) {
      const snapshot = await fetchSnapshot(code);
      if (!snapshot) throw new RoomNotFoundError(code);
      if (snapshot.participants.length >= MAX_PARTICIPANTS) throw new RoomFullError();
      return addParticipant(code, name, snapshot.participants.length);
    },

    async castVote(code, participantId, restaurantId, vote) {
      const { error } = await db
        .from("votes")
        .upsert(
          { room_code: code, participant_id: participantId, restaurant_id: restaurantId, vote },
          { onConflict: "participant_id,restaurant_id" }
        );
      if (error) throw error;
    },

    subscribe(code, onChange) {
      let stopped = false;
      let inFlight = false;
      let again = false;

      // Coalesce bursts of events into one refetch at a time.
      const refresh = async () => {
        if (inFlight) {
          again = true;
          return;
        }
        inFlight = true;
        try {
          const snapshot = await fetchSnapshot(code);
          if (!stopped) onChange(snapshot);
        } catch (error) {
          console.error("BiteMatch: couldn't load room", error);
        } finally {
          inFlight = false;
          if (again && !stopped) {
            again = false;
            void refresh();
          }
        }
      };

      void refresh();

      const channel = db
        .channel(`room-${code}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "participants", filter: `room_code=eq.${code}` }, refresh)
        .on("postgres_changes", { event: "*", schema: "public", table: "votes", filter: `room_code=eq.${code}` }, refresh)
        .subscribe();

      const timer = window.setInterval(refresh, POLL_MS);

      return () => {
        stopped = true;
        window.clearInterval(timer);
        void db.removeChannel(channel);
      };
    }
  };
}
