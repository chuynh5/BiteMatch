"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { LiveRoom } from "@/components/LiveRoom";

function RoomFromUrl() {
  const code = (useSearchParams().get("code") ?? "").replace(/\D/g, "").slice(0, 4);

  if (code.length !== 4) {
    return (
      <div className="join-card">
        <h2>That link is missing a room code.</h2>
        <p>Room links look like bitematch…/room?code=1234. Ask whoever invited you to share it again.</p>
        <Link className="primary-button" href="/">
          Go to BiteMatch
        </Link>
      </div>
    );
  }

  return <LiveRoom key={code} code={code} />;
}

export default function RoomPage() {
  return (
    <main>
      <section className="app-shell">
        <nav className="topbar" aria-label="Primary">
          <Link className="brand" href="/">
            <span>B</span>
            BiteMatch
          </Link>
        </nav>
        <Suspense fallback={null}>
          <RoomFromUrl />
        </Suspense>
      </section>
    </main>
  );
}
