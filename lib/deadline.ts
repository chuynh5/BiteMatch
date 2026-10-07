/**
 * Optional voting deadline for live rooms. When time runs out, the room
 * decides with the votes it has, so one slow friend can't stall everyone.
 * The deadline is stored in the room's preferences as minutes after the
 * room was created, so every phone counts down to the same moment.
 */

/** Choices shown when creating a room. null = no deadline. */
export const DEADLINE_OPTIONS: (number | null)[] = [null, 5, 10, 15, 30];

export const DEFAULT_DEADLINE_MINUTES = 10;

/** When voting closes, in milliseconds since the epoch, or null if the room has no deadline. */
export function deadlineAt(createdAt: string | undefined, minutes: number | null | undefined): number | null {
  if (!createdAt || !minutes || minutes <= 0) return null;
  const start = Date.parse(createdAt);
  if (Number.isNaN(start)) return null;
  return start + minutes * 60_000;
}

export function isVotingClosed(deadline: number | null, now: number): boolean {
  return deadline !== null && now >= deadline;
}

/** "4:05" for the time left, never negative. */
export function formatTimeLeft(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function deadlineLabel(minutes: number | null): string {
  return minutes ? `${minutes} min` : "None";
}
