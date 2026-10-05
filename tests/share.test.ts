import { describe, expect, it } from "vitest";
import { getInviteUrl } from "@/lib/share";

describe("getInviteUrl", () => {
  it("sends real rooms straight to the room page", () => {
    expect(getInviteUrl("5123")).toBe("/room?code=5123");
  });

  it("sends the built-in demo code through the home page", () => {
    expect(getInviteUrl("4827")).toBe("/?room=4827");
  });
});
