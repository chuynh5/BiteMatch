# BiteMatch

BiteMatch is a polished MVP for a group restaurant decision app. Friends create or join a room, set preferences, privately like or pass restaurant options, and reveal a group match when enough people agree.

## Tech Stack

- Next.js App Router
- React + TypeScript
- CSS modules via `app/globals.css`
- Curated local restaurant data designed to be replaced by a restaurant API later

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Live Restaurant Data

BiteMatch can use real nearby restaurant listings without a paid API key.

- By default, **Use my location** fetches live nearby restaurants from OpenStreetMap.
- OpenStreetMap provides real names, locations, cuisine tags when available, and address data when mapped.
- It does not provide official restaurant photos, ratings, or price levels, so the UI uses safe fallback imagery and inferred metadata.

Google Places API is optional. With a key, rooms created with **Use my location** show each restaurant's own photos (up to 5, tap to flip) with photographer credits:

1. Copy `.env.example` to `.env.local`.
2. Add a Google Places API key.

```bash
GOOGLE_PLACES_API_KEY=your_key_here
```

3. Restart the dev server.
4. In the app, choose **Use my location** in room setup.

When browser location or live lookup is unavailable, the app falls back to the curated demo restaurant dataset so the portfolio demo still works.

## Real Rooms With Friends

Rooms are stored in [Supabase](https://supabase.com) (free tier is plenty), so friends on different phones join the same room and see votes live.

1. Create a free Supabase project.
2. In the project, open **SQL Editor > New query**, paste all of `supabase/schema.sql`, and click **Run**.
3. Open **Project Settings > API** and copy the **Project URL** and the **anon public** key.
4. Put them in `.env.local` (and in your host's environment variables when you deploy):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

5. Restart the dev server. Create a group, share the link (`/room?code=1234`), and friends join with their name.

How it works:

- The host's filters and restaurant list are saved with the room, so everyone swipes the same cards.
- A match appears as soon as every person in the room has liked the same place. If nobody agrees on everything, the closest call shows once everyone is done.
- There are no accounts. The 4-digit room code is the key, which is fine among friends but not private.
- Without the two variables, the app falls back to **testing mode**: rooms are saved in your browser only, so you can try it with two tabs.

## Keeping Google at $0

Google Places is billed per request, with a free monthly allowance. BiteMatch caps its own usage per month so it never goes past that:

- **Photos:** 950 new photo loads a month (Google gives 1,000 free). Each photo is cached for a day, so friends in the same room share one load.
- **Nearby searches:** 4,500 a month (5,000 free). Google also limits this to 100 a day. After that, rooms use OpenStreetMap.

The counter lives in Supabase. Run `supabase/usage-cap.sql` in the SQL Editor to set it up (safe to re-run). Without it, the app makes no Google requests at all and shows illustrations instead.

To see usage, run `select * from api_usage order by day desc, kind;` in the SQL Editor. Monthly rows end in `_month`. The limits are in `lib/usageCap.ts`.

## Product Scope

V1 intentionally avoids required accounts. Room, participant, and vote state are simulated in the browser for a smooth portfolio demo, while the data and matching code are separated so Supabase/realtime rooms can be added later.

## Illustrations

Restaurant cards use hand-drawn dish illustrations from `public/illustrations/`, one transparent PNG per cuisine. To add art for a cuisine (Mexican, Thai, American and Indian are still missing), drop a square transparent PNG in that folder and list it in `components/DishArt.tsx`. Cuisines without art show a cute placeholder.

## Project Structure

- `app/page.tsx` holds the app state and switches between screens.
- `components/` has the screens (`Landing`, `Setup`, `Room`, `MatchResult`) and pieces (`SwipeDeck`, `DishArt`, `ShareButton`).
- `lib/matching.ts` has the match logic, and `lib/demoVotes.ts` simulates the demo friends' votes.
- `lib/rooms/` saves real rooms: `supabaseStore.ts` for the shared database, `deviceStore.ts` for testing mode.
- `app/room/page.tsx` and `components/LiveRoom.tsx` are the room friends join from an invite link.
- `supabase/schema.sql` creates the database tables.
