import { readFile } from "node:fs/promises";
import path from "node:path";

/** Fonts and art for generated images (link preview, icons). Runs at build time. */
const root = process.cwd();

export async function loadBrandFonts() {
  const read = (file: string) => readFile(path.join(root, "node_modules/@fontsource", file));
  const [display, body, bodyBold] = await Promise.all([
    read("fraunces/files/fraunces-latin-700-normal.woff"),
    read("nunito/files/nunito-latin-700-normal.woff"),
    read("nunito/files/nunito-latin-800-normal.woff")
  ]);
  return [
    { name: "Fraunces", data: display, weight: 700 as const, style: "normal" as const },
    { name: "Nunito", data: body, weight: 700 as const, style: "normal" as const },
    { name: "Nunito", data: bodyBold, weight: 800 as const, style: "normal" as const }
  ];
}

export async function illustrationDataUri(cuisine: string) {
  const file = await readFile(path.join(root, "public/illustrations", `${cuisine}.png`));
  return `data:image/png;base64,${file.toString("base64")}`;
}
