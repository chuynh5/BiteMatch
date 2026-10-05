import { ImageResponse } from "next/og";
import { loadBrandFonts } from "@/lib/brandAssets";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

/** Browser-tab icon: the coral "B" tile from the logo. */
export default async function Icon() {
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
          borderRadius: "16px 16px 16px 6px",
          color: "white",
          fontFamily: "Fraunces",
          fontSize: 44,
          paddingBottom: 4
        }}
      >
        B
      </div>
    ),
    { ...size, fonts }
  );
}
