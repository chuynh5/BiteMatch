import { createClient } from "@supabase/supabase-js";

/**
 * Monthly caps on Google requests, so BiteMatch stays inside Google's free
 * monthly allowance. Counts live in Supabase (see supabase/usage-cap.sql) so
 * every server instance shares them.
 *
 * Fails closed: if the counter can't be checked, the request is refused and
 * the app shows illustrations instead. Spending nothing beats guessing.
 */
export const MONTHLY_LIMITS = {
  // Google: 1,000 free photo loads a month (Enterprise tier). Stop a little short.
  google_photo: 950,
  // Google: 1,000 free nearby searches a month at the Enterprise tier (we ask for
  // ratings and price levels). Google also caps this at 100 a day.
  google_nearby: 950,
  // Google: 5,000 free Text Searches a month (Pro tier). Used to find photos for
  // restaurants that didn't come from a Google search (demo and OpenStreetMap).
  google_text: 4500
} as const;

export type QuotaKind = keyof typeof MONTHLY_LIMITS;

export async function tryUseQuota(kind: QuotaKind): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return false;

  try {
    const db = createClient(url, key, { auth: { persistSession: false } });
    const { data, error } = await db.rpc("try_use_monthly_quota", {
      quota_kind: kind,
      monthly_limit: MONTHLY_LIMITS[kind]
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
