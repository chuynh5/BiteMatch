import type { Participant, Preferences, Restaurant, Vote, VoteMap } from "@/types/bitematch";

/** Everything a room page needs to render, as one snapshot. */
export type RoomSnapshot = {
  code: string;
  preferences: Preferences;
  /** The restaurant list is saved with the room so everyone votes on the same cards. */
  restaurants: Restaurant[];
  participants: Participant[];
  votes: VoteMap;
  /** When the room was created (ISO). Voting deadlines count from here. */
  createdAt?: string;
};

export type CreateRoomInput = {
  hostName: string;
  preferences: Preferences;
  restaurants: Restaurant[];
};

/**
 * Where rooms live. "supabase" is the real shared database; "device" keeps rooms
 * in this browser only (used until Supabase is configured, and handy for testing
 * with two tabs).
 */
export interface RoomStore {
  kind: "supabase" | "device";
  createRoom(input: CreateRoomInput): Promise<{ code: string; me: Participant }>;
  joinRoom(code: string, name: string): Promise<Participant>;
  castVote(code: string, participantId: string, restaurantId: string, vote: Vote): Promise<void>;
  /** Calls onChange with the latest snapshot now and whenever anyone joins or votes. null = room not found. */
  subscribe(code: string, onChange: (snapshot: RoomSnapshot | null) => void): () => void;
}

export class RoomNotFoundError extends Error {
  constructor(code: string) {
    super(`Room ${code} doesn't exist.`);
    this.name = "RoomNotFoundError";
  }
}

export class VotingClosedError extends Error {
  constructor() {
    super("Voting has closed for this room.");
    this.name = "VotingClosedError";
  }
}

export class RoomFullError extends Error {
  constructor() {
    super("This room already has the maximum number of people.");
    this.name = "RoomFullError";
  }
}

export const MAX_PARTICIPANTS = 8;

const participantColors = ["#e0675a", "#6e9b8e", "#d9a441", "#8b6fc9", "#4f7fa8", "#c76b98", "#7a8f3f", "#211c18"];

export function colorFor(index: number) {
  return participantColors[index % participantColors.length];
}

export function randomRoomCode() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

/** Codes that belong to the built-in demo, never handed out to real rooms. */
export const reservedCodes = new Set(["4827", "7392"]);
