// Costa Serena — handover program for the make.fun gta6-01 bounty.
// The playable game lives in game/ as plain static files with no build step.
// This program copies game/ and screenshots/ into the output directory and
// writes dossier.json there using the vendored make.fun dossier library.
// Run locally:  mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// In the grader the output directory defaults to /output.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Fail loudly instead of handing in an empty shell if the game is missing:
// the gate would refuse the entry anyway, and a clear error is kinder here.
if (!existsSync(join(repoRoot, 'game', 'index.html'))) {
  throw new Error('game/index.html is missing — there is no game to hand in');
}

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'game'), join(outputDir, 'game'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// Caps come from the scorer gate: dossier text, screenshot count and size,
// game file count, total game bytes and the longest allowed game path.
const dossierText = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outputDir, 'dossier.json'), dossierText);
