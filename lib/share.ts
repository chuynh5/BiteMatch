export type ShareResult = "shared" | "copied" | "failed";

export function getInviteText(roomCode: string) {
  return `Help me pick dinner on BiteMatch! Join room ${roomCode}.`;
}

export function getInviteUrl(roomCode: string) {
  if (typeof window === "undefined") {
    return `/?room=${roomCode}`;
  }
  return `${window.location.origin}/?room=${roomCode}`;
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
