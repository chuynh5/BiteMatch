// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { deviceStore } from "@/lib/rooms/deviceStore";
import { RoomNotFoundError, VotingClosedError, type RoomSnapshot } from "@/lib/rooms/types";
import { restaurant } from "./helpers";

/** The room as it is right now (subscribe reports the current state immediately). */
function latest(code: string): RoomSnapshot | null {
  let current: RoomSnapshot | null = null;
  const stop = deviceStore.subscribe(code, (snapshot) => {
    current = snapshot;
  });
  stop();
  return current;
}

describe("deviceStore (testing-mode rooms)", () => {
  beforeEach(() => localStorage.clear());

  it("creates a room, lets a friend join, and records votes", async () => {
    const { code, me } = await deviceStore.createRoom({
      hostName: "Cara",
      preferences: { cuisines: ["Thai"], prices: ["$$"], maxDistance: 3 },
      restaurants: [restaurant("a"), restaurant("b")]
    });
    expect(code).toMatch(/^\d{4}$/);
    expect(["4827", "7392"]).not.toContain(code);

    const maya = await deviceStore.joinRoom(code, "Maya");
    await deviceStore.castVote(code, me.id, "a", "like");
    await deviceStore.castVote(code, maya.id, "a", "pass");
    await deviceStore.castVote(code, maya.id, "a", "like"); // people can change their vote

    const room = latest(code);
    expect(room?.participants.map((p) => p.name)).toEqual(["Cara", "Maya"]);
    expect(room?.votes[maya.id]).toEqual({ a: "like" });
  });

  it("says when a room doesn't exist", async () => {
    await expect(deviceStore.joinRoom("1111", "Maya")).rejects.toBeInstanceOf(RoomNotFoundError);
    expect(latest("1111")).toBeNull();
  });

  it("refuses votes after the room's deadline", async () => {
    const { code, me } = await deviceStore.createRoom({
      hostName: "Cara",
      preferences: { cuisines: ["Thai"], prices: ["$$"], maxDistance: 3, deadlineMinutes: 5 },
      restaurants: [restaurant("a"), restaurant("b")]
    });
    await deviceStore.castVote(code, me.id, "a", "like");

    // Pretend the room was created 6 minutes ago.
    const key = `bitematch:room:${code}`;
    const saved = JSON.parse(localStorage.getItem(key)!) as RoomSnapshot;
    localStorage.setItem(key, JSON.stringify({ ...saved, createdAt: new Date(Date.now() - 6 * 60_000).toISOString() }));

    await expect(deviceStore.castVote(code, me.id, "b", "like")).rejects.toBeInstanceOf(VotingClosedError);
    expect(latest(code)?.votes[me.id]).toEqual({ a: "like" });
  });
});
