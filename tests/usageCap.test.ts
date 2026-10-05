import { describe, expect, it, vi } from "vitest";
import { tryUseQuota } from "@/lib/usageCap";

describe("tryUseQuota", () => {
  it("refuses Google requests when the counter isn't set up (fails closed)", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    await expect(tryUseQuota("google_photo")).resolves.toBe(false);
    vi.unstubAllEnvs();
  });
});
