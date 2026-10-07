import { deadlineAt, isVotingClosed } from "@/lib/deadline";
import type { Participant } from "@/types/bitematch";
import {
  MAX_PARTICIPANTS,
  RoomFullError,
  RoomNotFoundError,
  VotingClosedError,
  colorFor,
  randomRoomCode,
  reservedCodes,
  type RoomSnapshot,
  type RoomStore
} from "@/lib/rooms/types";

/**
 * Rooms saved in this browser's localStorage. Tabs stay in sync through
 * BroadcastChannel and the storage event, so two tabs can act as two people.
 * It does NOT sync between different phones; that needs Supabase.
 */
const keyFor = (code: string) => `bitematch:room:${code}`;
const channelName = "bitematch-rooms";

function read(code: string): RoomSnapshot | null {
  try {
    const raw = window.localStorage.getItem(keyFor(code));
    return raw ? (JSON.parse(raw) as RoomSnapshot) : null;
  } catch {
    return null;
  }
}

function write(snapshot: RoomSnapshot) {
  window.localStorage.setItem(keyFor(snapshot.code), JSON.stringify(snapshot));
  try {
    const channel = new BroadcastChannel(channelName);
    channel.postMessage(snapshot.code);
    channel.close();
  } catch {
    // BroadcastChannel unavailable: the storage event still covers other tabs.
  }
}

function newId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `p-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export const deviceStore: RoomStore = {
  kind: "device",

  async createRoom({ hostName, preferences, restaurants }) {
    let code = randomRoomCode();
    for (let tries = 0; (read(code) || reservedCodes.has(code)) && tries < 20; tries++) {
      code = randomRoomCode();
    }
    const me: Participant = { id: newId(), name: hostName, color: colorFor(0) };
    write({ code, preferences, restaurants, participants: [me], votes: {}, createdAt: new Date().toISOString() });
    return { code, me };
  },

  async joinRoom(code, name) {
    const room = read(code);
    if (!room) throw new RoomNotFoundError(code);
    if (room.participants.length >= MAX_PARTICIPANTS) throw new RoomFullError();
    const me: Participant = { id: newId(), name, color: colorFor(room.participants.length) };
    write({ ...room, participants: [...room.participants, me] });
    return me;
  },

  async castVote(code, participantId, restaurantId, vote) {
    const room = read(code);
    if (!room) throw new RoomNotFoundError(code);
    if (isVotingClosed(deadlineAt(room.createdAt, room.preferences.deadlineMinutes), Date.now())) {
      throw new VotingClosedError();
    }
    write({
      ...room,
      votes: {
        ...room.votes,
        [participantId]: { ...room.votes[participantId], [restaurantId]: vote }
      }
    });
  },

  subscribe(code, onChange) {
    const emit = () => onChange(read(code));
    emit();

    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel(channelName);
      channel.onmessage = (event) => {
        if (event.data === code) emit();
      };
    } catch {
      channel = null;
    }

    const onStorage = (event: StorageEvent) => {
      if (event.key === keyFor(code)) emit();
    };
    window.addEventListener("storage", onStorage);

    return () => {
      channel?.close();
      window.removeEventListener("storage", onStorage);
    };
  }
};
