// people.js — pedestrians on Costa Serena sidewalks and the rival crew
// members used by the marina combat mission. Pedestrians stroll, and flee
// from gunfire, speeding cars and crashes near them.
import { ROAD_WIDTH, nearestRoadPoint } from './city.js';

let nextPersonId = 1;
const SHIRT_COLORS = ['#ff6b6b', '#feca57', '#48dbfb', '#1dd1a1', '#f368e0', '#ff9f43', '#54a0ff', '#5f27cd', '#ffffff', '#ff8fa3'];

export function makePedestrian(x, y, rng) {
  return {
    id: nextPersonId++, kind: 'ped', x, y, angle: rng.range(0, Math.PI * 2),
    speed: rng.range(26, 48), baseSpeed: 38, color: rng.pick(SHIRT_COLORS),
    state: 'walk', fleeTime: 0, health: 30, waypoint: null, dead: false, hostile: false,
  };
}
export function spawnPedestrians(rng, count) {
  const peds = [];
  for (let i = 0; i < count; i++) {
    const road = nearestRoadPoint(rng.range(80, 3120), rng.range(80, 1980));
    const x = road.x + rng.pick([-1, 1]) * (ROAD_WIDTH / 2 + rng.range(8, 26));
    const y = road.y + rng.range(-160, 160);
    peds.push(makePedestrian(x, Math.max(50, Math.min(2020, y)), rng));
  }
  // A beach crowd so Playa Serena always feels alive.
  for (let i = 0; i < 10; i++) peds.push(makePedestrian(rng.range(300, 2900), rng.range(1990, 2110), rng));
  return peds;
}
export function makeHostile(x, y, rng) {
  const p = makePedestrian(x, y, rng);
  p.kind = 'hostile'; p.hostile = true; p.health = 40; p.color = '#222f3e'; p.speed = 55; p.baseSpeed = 55;
  return p;
}
export function scarePedestriansNear(peds, x, y, radius) {
  for (const p of peds) {
    if (p.dead || p.hostile) continue;
    if (Math.hypot(p.x - x, p.y - y) < radius) { p.state = 'flee'; p.fleeTime = 2.2; p.angle = Math.atan2(p.y - y, p.x - x); }
  }
}
export function updatePedestrian(p, dt, rng) {
  if (p.dead) return;
  if (p.state === 'flee') {
    p.fleeTime -= dt;
    p.x += Math.cos(p.angle) * 118 * dt; p.y += Math.sin(p.angle) * 118 * dt;
    if (p.fleeTime <= 0) p.state = 'walk';
    return;
  }
  if (p.hostile) return; // hostiles hold position and shoot; combat.js moves them slightly
  if (!p.waypoint || Math.hypot(p.waypoint.x - p.x, p.waypoint.y - p.y) < 12) {
    p.waypoint = { x: p.x + rng.range(-190, 190), y: p.y + rng.range(-190, 190) };
  }
  const a = Math.atan2(p.waypoint.y - p.y, p.waypoint.x - p.x);
  p.angle = a;
  p.x += Math.cos(a) * p.speed * dt; p.y += Math.sin(a) * p.speed * dt;
  p.x = Math.max(24, Math.min(3176, p.x)); p.y = Math.max(24, Math.min(2220, p.y));
}
