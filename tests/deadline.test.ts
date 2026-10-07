import { describe, expect, it } from "vitest";
import { deadlineAt, formatTimeLeft, isVotingClosed } from "@/lib/deadline";

describe("voting deadline", () => {
  const created = "2026-10-07T18:00:00.000Z";

  it("counts the deadline from when the room was created", () => {
    expect(deadlineAt(created, 10)).toBe(Date.parse("2026-10-07T18:10:00.000Z"));
  });

  it("has no deadline when none was picked or the room is from before deadlines existed", () => {
    expect(deadlineAt(created, null)).toBeNull();
    expect(deadlineAt(created, undefined)).toBeNull();
    expect(deadlineAt(undefined, 10)).toBeNull();
  });

  it("closes voting exactly at the deadline", () => {
    const deadline = deadlineAt(created, 5);
    expect(isVotingClosed(deadline, Date.parse("2026-10-07T18:04:59.000Z"))).toBe(false);
    expect(isVotingClosed(deadline, Date.parse("2026-10-07T18:05:00.000Z"))).toBe(true);
    expect(isVotingClosed(null, Date.now())).toBe(false);
  });

  it("formats the time left as m:ss and never goes negative", () => {
    expect(formatTimeLeft(4 * 60_000 + 5_000)).toBe("4:05");
    expect(formatTimeLeft(400)).toBe("0:01");
    expect(formatTimeLeft(-3_000)).toBe("0:00");
  });
});
