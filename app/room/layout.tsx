import type { Metadata } from "next";

/** What an invite link shows when pasted into a group chat. */
export const metadata: Metadata = {
  title: "You're invited to pick dinner · BiteMatch",
  description: "Join the room, vote privately on a few nearby places, and see where everyone agrees.",
  openGraph: {
    title: "You're invited to pick dinner",
    description: "Join the room, vote privately on a few nearby places, and see where everyone agrees."
  }
};

export default function RoomLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
