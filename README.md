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

## Product Scope

V1 intentionally avoids accounts and backend complexity. Room, participant, and vote state are simulated in the browser for a smooth portfolio demo, while the data and matching code are separated so Supabase/realtime rooms can be added later.
