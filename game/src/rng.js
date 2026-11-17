// rng.js — deterministic seeded random numbers for Costa Serena.
// The same seed always produces the same city dressing, traffic and
// screenshot scenes, which is what makes ?shot= scenes reproducible.

export function createRng(seed) {
  let state = (Number(seed) >>> 0) || 1;
  const next = () => {
    // mulberry32: small, fast and stable across browsers.
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    range: (min, max) => min + next() * (max - min),
    int: (min, max) => Math.floor(min + next() * (max - min + 1)),
    pick: (list) => list[Math.floor(next() * list.length) % list.length],
    chance: (p) => next() < p,
  };
}

export function hashSeedFromText(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
