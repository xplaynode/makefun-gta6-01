// city.js — the Costa Serena city plan: road grid, districts, buildings,
// palms, beach and water. Everything is generated from a seed so the city
// is identical on every visit and in every screenshot scene.

export const WORLD_WIDTH = 3200;
export const WORLD_HEIGHT = 2400;
export const ROAD_SPACING = 400;
export const ROAD_WIDTH = 96;
export const BEACH_Y = 1960;
export const WATER_Y = 2140;

export const DISTRICTS = [
  { name: 'Sol Marina', x: 200, y: 1500, w: 1100, h: 430 },
  { name: 'Centro Serena', x: 1100, y: 700, w: 1000, h: 800 },
  { name: 'Costa Heights', x: 2100, y: 150, w: 1000, h: 650 },
  { name: 'Puerto Viejo', x: 150, y: 800, w: 850, h: 650 },
  { name: 'Palmera Strip', x: 1050, y: 1500, w: 1300, h: 430 },
  { name: 'Harbour Point', x: 2400, y: 1400, w: 700, h: 520 },
];

export const VEHICLE_MODELS = [
  { name: 'Solana Coupe', color: '#e74c3c', speed: 265, accel: 190 },
  { name: 'Brisa Hatch', color: '#3498db', speed: 225, accel: 160 },
  { name: 'Duna Pickup', color: '#f39c12', speed: 210, accel: 145 },
  { name: 'Marlin Sedan', color: '#ecf0f1', speed: 240, accel: 170 },
  { name: 'Coral Cabrio', color: '#e84393', speed: 255, accel: 180 },
  { name: 'Tortuga Van', color: '#2ecc71', speed: 185, accel: 120 },
];

const BUILDING_PALETTE = ['#f6d8a8', '#f2b8c6', '#a8d8ea', '#ffe9a8', '#c9e7c0', '#f4a261', '#e9c46a', '#b8b5ff', '#ffd6a5', '#caffbf'];

export function roadXs() {
  const xs = [];
  for (let x = 200; x < WORLD_WIDTH; x += ROAD_SPACING) xs.push(x);
  return xs;
}
export function roadYs() {
  const ys = [];
  for (let y = 200; y < BEACH_Y; y += ROAD_SPACING) ys.push(y);
  ys.push(1880);
  return ys;
}
export function isOnRoad(x, y) {
  if (y > BEACH_Y) return false;
  for (const rx of roadXs()) if (Math.abs(x - rx) < ROAD_WIDTH / 2) return true;
  for (const ry of roadYs()) if (Math.abs(y - ry) < ROAD_WIDTH / 2) return true;
  return false;
}
export function nearestRoadPoint(x, y) {
  let best = { x, y, d: Infinity };
  for (const rx of roadXs()) { const d = Math.abs(x - rx); if (d < best.d) best = { x: rx, y, d }; }
  for (const ry of roadYs()) { const d = Math.abs(y - ry); if (d < best.d) best = { x, y: ry, d }; }
  return best;
}
export function districtAt(x, y) {
  for (const d of DISTRICTS) if (x >= d.x && x < d.x + d.w && y >= d.y && y < d.y + d.h) return d.name;
  if (y >= WATER_Y) return 'Mar Serena';
  if (y >= BEACH_Y) return 'Playa Serena';
  return 'Costa Serena';
}

export function buildCity(rng) {
  const buildings = [];
  const palms = [];
  const props = [];
  const xs = roadXs(); const ys = roadYs();
  for (let bx = 0; bx < xs.length - 1; bx++) {
    for (let by = 0; by < ys.length - 1; by++) {
      const x0 = xs[bx] + ROAD_WIDTH / 2 + 22; const x1 = xs[bx + 1] - ROAD_WIDTH / 2 - 22;
      const y0 = ys[by] + ROAD_WIDTH / 2 + 22; const y1 = ys[by + 1] - ROAD_WIDTH / 2 - 22;
      if (x1 - x0 < 120 || y1 - y0 < 120) continue;
      const cols = rng.int(1, 2); const rows = rng.int(1, 2);
      for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
        const w = (x1 - x0) / cols - 26; const h = (y1 - y0) / rows - 26;
        buildings.push({
          x: x0 + i * ((x1 - x0) / cols) + 13, y: y0 + j * ((y1 - y0) / rows) + 13,
          w, h, color: rng.pick(BUILDING_PALETTE), floors: rng.int(2, 9),
          roof: rng.pick(['#c96f4a', '#8d6e63', '#607d8b', '#a1887f']),
        });
      }
    }
  }
  for (let i = 0; i < 130; i++) {
    const x = rng.range(40, WORLD_WIDTH - 40); const y = rng.range(60, BEACH_Y + 120);
    if (!isOnRoad(x, y)) palms.push({ x, y, s: rng.range(0.8, 1.35), lean: rng.range(-0.16, 0.16) });
  }
  for (let i = 0; i < 60; i++) {
    const p = nearestRoadPoint(rng.range(60, WORLD_WIDTH - 60), rng.range(60, BEACH_Y - 40));
    props.push({ x: p.x + rng.pick([-1, 1]) * (ROAD_WIDTH / 2 + 12), y: p.y + rng.range(-30, 30), kind: rng.pick(['lamp', 'bench', 'kiosk', 'hydrant']) });
  }
  return { buildings, palms, props };
}

export function collidesWithBuilding(buildings, x, y, r) {
  for (const b of buildings) {
    if (x + r > b.x && x - r < b.x + b.w && y + r > b.y && y - r < b.y + b.h) return b;
  }
  return null;
}
export function keepOutOfBuildings(buildings, ent, r) {
  const b = collidesWithBuilding(buildings, ent.x, ent.y, r);
  if (!b) return false;
  const left = Math.abs((ent.x + r) - b.x); const right = Math.abs((b.x + b.w) - (ent.x - r));
  const top = Math.abs((ent.y + r) - b.y); const bot = Math.abs((b.y + b.h) - (ent.y - r));
  const m = Math.min(left, right, top, bot);
  if (m === left) ent.x = b.x - r; else if (m === right) ent.x = b.x + b.w + r;
  else if (m === top) ent.y = b.y - r; else ent.y = b.y + b.h + r;
  return true;
}
