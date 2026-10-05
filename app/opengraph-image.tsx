import { ImageResponse } from "next/og";
import { illustrationDataUri, loadBrandFonts } from "@/lib/brandAssets";

export const alt = "BiteMatch: swipe on restaurants with friends and find the place everyone agrees on.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** The card shown when a BiteMatch link is pasted into iMessage, Slack, LinkedIn, etc. */
export default async function OpenGraphImage() {
  const [fonts, italian, japanese, korean] = await Promise.all([
    loadBrandFonts(),
    illustrationDataUri("italian"),
    illustrationDataUri("japanese"),
    illustrationDataUri("korean")
  ]);

  const card = (src: string, rotate: number, top: number, left: number, z: number) => (
    <div
      style={{
        position: "absolute",
        top,
        left,
        width: 280,
        height: 280,
        borderRadius: 40,
        background: "#fde6ec",
        border: "6px solid #ffffff",
        boxShadow: "0 24px 50px rgba(184, 72, 61, 0.18)",
        transform: `rotate(${rotate}deg)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: z
      }}
    >
      <img src={src} width={224} height={224} style={{ objectFit: "contain" }} alt="" />
    </div>
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#fff6ef",
          backgroundImage: "radial-gradient(rgba(224, 103, 90, 0.16) 2px, transparent 2px)",
          backgroundSize: "36px 36px",
          fontFamily: "Nunito",
          color: "#3b2a2b",
          padding: "72px 80px"
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", width: 580 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "18px 18px 18px 6px",
                background: "#e0675a",
                boxShadow: "0 5px 0 #b8483d",
                color: "white",
                fontFamily: "Fraunces",
                fontSize: 40,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transform: "rotate(-6deg)"
              }}
            >
              B
            </div>
            <div style={{ fontFamily: "Fraunces", fontSize: 44 }}>BiteMatch</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", fontFamily: "Fraunces", fontSize: 80, lineHeight: 1.02, marginTop: 44 }}>
            <span>Dinner plans,</span>
            <span style={{ color: "#e0675a" }}>made easy.</span>
          </div>
          <div style={{ fontSize: 30, color: "#8a7270", marginTop: 28, lineHeight: 1.35 }}>
            Swipe on restaurants with friends. The match shows up when everyone agrees.
          </div>
        </div>
        <div style={{ display: "flex", position: "relative", flex: 1 }}>
          {card(korean, 8, 240, 200, 1)}
          {card(japanese, -7, 0, 190, 2)}
          {card(italian, 4, 150, 30, 3)}
        </div>
      </div>
    ),
    { ...size, fonts }
  );
}
