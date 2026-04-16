#!/usr/bin/env node
/**
 * Wandelt Bilder nach AVIF (scharf, klein für Web).
 * Nutzung:
 *   npm run avif -- bild1.jpg bild2.heic
 *   npm run avif -- --dir .
 * HEIC: Auf manchen Systemen braucht libvips HEIF-Unterstützung; macOS meist ok.
 */

import sharp from "sharp";
import { readdir, stat } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const EXT_IN = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".tif",
  ".tiff",
  ".heic",
  ".HEIC",
]);

function parseArgs(argv) {
  const args = argv.slice(2);
  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
AVIF-Konvertierung (sharp)

  npm run avif -- <datei> [<datei> ...]
  npm run avif -- --dir <ordner>

Optionen:
  --dir <pfad>   Alle unterstützten Bilder in diesem Ordner (nicht rekursiv)
  --quality <n>  AVIF-Qualität 1–100 (Standard: 62)
  --effort <n>   Encoder-Aufwand 0–9 (Standard: 4, höher = kleiner aber langsamer)

Beispiele:
  npm run avif -- hero-parkett.jpg
  npm run avif -- --dir . --quality 55
`);
    process.exit(0);
  }

  let quality = 62;
  let effort = 4;
  let dir = null;
  const files = [];

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--dir") {
      dir = args[++i];
      continue;
    }
    if (a === "--quality") {
      quality = Math.min(100, Math.max(1, parseInt(args[++i], 10) || 62));
      continue;
    }
    if (a === "--effort") {
      effort = Math.min(9, Math.max(0, parseInt(args[++i], 10) || 4));
      continue;
    }
    if (a.startsWith("-")) continue;
    files.push(a);
  }

  return { files, dir, quality, effort };
}

async function listDirImages(dirAbs) {
  const names = await readdir(dirAbs);
  const out = [];
  for (const name of names) {
    const ext = path.extname(name);
    if (!EXT_IN.has(ext)) continue;
    if (ext.toLowerCase() === ".avif") continue;
    const full = path.join(dirAbs, name);
    const st = await stat(full);
    if (st.isFile()) out.push(full);
  }
  return out;
}

async function toAvif(inputPath, { quality, effort }) {
  const ext = path.extname(inputPath).toLowerCase();
  if (ext === ".avif") {
    console.log(`Überspringe (bereits AVIF): ${path.relative(ROOT, inputPath)}`);
    return;
  }

  const dir = path.dirname(inputPath);
  const base = path.basename(inputPath, path.extname(inputPath));
  const outPath = path.join(dir, `${base}.avif`);

  await sharp(inputPath)
    .rotate()
    .avif({ quality, effort, chromaSubsampling: "4:2:0" })
    .toFile(outPath);

  const inStat = await stat(inputPath);
  const outStat = await stat(outPath);
  const ratio = ((1 - outStat.size / inStat.size) * 100).toFixed(1);
  console.log(
    `OK  ${path.relative(ROOT, inputPath)} → ${path.relative(ROOT, outPath)} (${(outStat.size / 1024).toFixed(0)} KB, ~${ratio}% kleiner als Quelle)`
  );
}

async function main() {
  const { files, dir, quality, effort } = parseArgs(process.argv);
  let inputs = [...files];

  if (dir) {
    const dirAbs = path.isAbsolute(dir) ? dir : path.join(ROOT, dir);
    inputs.push(...(await listDirImages(dirAbs)));
  }

  if (inputs.length === 0) {
    console.error(
      "Keine Dateien. Beispiel: npm run avif -- hero-parkett.jpg\nOder: npm run avif -- --dir ."
    );
    process.exit(1);
  }

  const opts = { quality, effort };
  for (const f of inputs) {
    const abs = path.isAbsolute(f) ? f : path.join(ROOT, f);
    try {
      await toAvif(abs, opts);
    } catch (e) {
      console.error(`Fehler ${f}:`, e.message || e);
      process.exitCode = 1;
    }
  }
}

main();
