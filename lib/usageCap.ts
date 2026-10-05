import { createClient } from "@supabase/supabase-js";

/**
 * Daily caps on Google requests, so BiteMatch stays inside Google's free
 * monthly allowance. Counts live in Supabase (see supabase/usage-cap.sql) so
 * every server instance shares them.
 *
 * Fails closed: if the counter can't be checked, the request is refused and
 * the app shows illustrations instead. Spending nothing beats guessing.
 */
export const DAILY_LIMITS = {
  // 1,000 free photo loads a month (Enterprise tier) → 30 a day.
  google_photo: 30,
  // 5,000 free nearby searches a month (Pro tier); Google also caps this at 100 a day.
  google_nearby: 100
} as const;

export type QuotaKind = keyof typeof DAILY_LIMITS;

export async function tryUseQuota(kind: QuotaKind): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return false;

  try {
    const db = createClient(url, key, { auth: { persistSession: false } });
    const { data, error } = await db.rpc("try_use_quota", {
      quota_kind: kind,
      daily_limit: DAILY_LIMITS[kind]
    });
    if (error) {
      console.error(`BiteMatch: quota check for ${kind} failed`, error.message);
      return false;
    }
    return data === true;
  } catch (error) {
    console.error(`BiteMatch: quota check for ${kind} failed`, error);
    return false;
  }
}
