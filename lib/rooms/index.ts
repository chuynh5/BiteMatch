import { deviceStore } from "@/lib/rooms/deviceStore";
import { createSupabaseStore } from "@/lib/rooms/supabaseStore";
import type { RoomStore } from "@/lib/rooms/types";

export * from "@/lib/rooms/types";

let store: RoomStore | null = null;

/**
 * Uses Supabase when NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
 * are set; otherwise falls back to rooms saved on this device only.
 */
export function getRoomStore(): RoomStore {
  if (store) return store;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  store = url && key ? createSupabaseStore(url, key) : deviceStore;
  return store;
}

/** Remembers which participant you are in each room, so a refresh doesn't make you rejoin. */
export const myIdentity = {
  get(code: string): string | null {
    try {
      return window.localStorage.getItem(`bitematch:me:${code}`);
    } catch {
      return null;
    }
  },
  set(code: string, participantId: string) {
    try {
      window.localStorage.setItem(`bitematch:me:${code}`, participantId);
    } catch {
      // Private mode: you'll just be asked to join again after a refresh.
    }
  }
};
