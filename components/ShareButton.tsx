"use client";

import { Check, Copy, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import { copyInvite, shareInvite, type ShareResult } from "@/lib/share";

export function ShareButton({
  roomCode,
  mode
}: {
  roomCode: string;
  mode: "copy" | "share";
}) {
  const [result, setResult] = useState<ShareResult | null>(null);

  useEffect(() => {
    if (!result) return;
    const timer = window.setTimeout(() => setResult(null), 2000);
    return () => window.clearTimeout(timer);
  }, [result]);

  const Icon = result === "copied" || result === "shared" ? Check : mode === "copy" ? Copy : Share2;
  const label = mode === "copy" ? "Copy invite link" : "Share room";

  return (
    <span className="share-button-wrap">
      <button
        type="button"
        className={result === "copied" || result === "shared" ? "icon-button done" : "icon-button"}
        title={label}
        aria-label={label}
        onClick={async () => setResult(await (mode === "copy" ? copyInvite(roomCode) : shareInvite(roomCode)))}
      >
        <Icon size={18} />
      </button>
      <span className="share-toast" role="status" aria-live="polite">
        {result === "copied" ? "Link copied" : result === "shared" ? "Shared" : ""}
      </span>
    </span>
  );
}
