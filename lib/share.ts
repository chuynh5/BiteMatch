export type ShareResult = "shared" | "copied" | "failed";

export function getInviteText(roomCode: string) {
  return `Help me pick dinner on BiteMatch! Join room ${roomCode}.`;
}

const demoCodes = new Set(["4827", "7392"]);

/** Real rooms open straight into /room; the built-in demo codes go through the home page. */
export function getInviteUrl(roomCode: string) {
  const path = demoCodes.has(roomCode) ? `/?room=${roomCode}` : `/room?code=${roomCode}`;
  if (typeof window === "undefined") {
    return path;
  }
  return `${window.location.origin}${path}`;
}

/** Copies the invite link to the clipboard. */
export async function copyInvite(roomCode: string): Promise<ShareResult> {
  try {
    await navigator.clipboard.writeText(`${getInviteText(roomCode)} ${getInviteUrl(roomCode)}`);
    return "copied";
  } catch {
    return "failed";
  }
}

/** Opens the phone's share sheet when available, otherwise copies the link. */
export async function shareInvite(roomCode: string): Promise<ShareResult> {
  if (typeof navigator !== "undefined" && "share" in navigator) {
    try {
      await navigator.share({
        title: "BiteMatch",
        text: getInviteText(roomCode),
        url: getInviteUrl(roomCode)
      });
      return "shared";
    } catch (error) {
      // The user closing the share sheet is not a failure worth reporting.
      if (error instanceof DOMException && error.name === "AbortError") {
        return "failed";
      }
    }
  }
  return copyInvite(roomCode);
}
