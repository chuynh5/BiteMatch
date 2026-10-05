import { ImageResponse } from "next/og";
import { loadBrandFonts } from "@/lib/brandAssets";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Home-screen icon on iPhone (iOS rounds the corners itself). */
export default async function AppleIcon() {
  const fonts = await loadBrandFonts();
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#e0675a",
          borderRadius: 0,
          color: "white",
          fontFamily: "Fraunces",
          fontSize: 120,
          paddingBottom: 4
        }}
      >
        B
      </div>
    ),
    { ...size, fonts }
  );
}
