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

Google Places API is optional if you want richer official data later:

1. Copy `.env.example` to `.env.local`.
2. Add a Google Places API key.

```bash
GOOGLE_PLACES_API_KEY=your_key_here
```

3. Restart the dev server.
4. In the app, choose **Use my location** in room setup.

When browser location or live lookup is unavailable, the app falls back to the curated demo restaurant dataset so the portfolio demo still works.

## Product Scope

V1 intentionally avoids required accounts. Room, participant, and vote state are simulated in the browser for a smooth portfolio demo, while the data and matching code are separated so Supabase/realtime rooms can be added later.
