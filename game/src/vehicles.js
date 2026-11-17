// vehicles.js — cars for Costa Serena: parked cars to steal, AI traffic
// driving the road grid, and police interceptors that pursue the player.
import { ROAD_WIDTH, VEHICLE_MODELS, isOnRoad, roadXs, roadYs } from './city.js';

let nextCarId = 1;
export function makeCar(x, y, angle, model, kind) {
  return {
    id: nextCarId++, x, y, angle, speed: 0, model, kind,
    w: 46, h: 22, health: 100, driver: kind !== 'parked',
    laneOffset: 20, targetSpeed: 0, stuckTime: 0, honk: 0,
  };
}

export function spawnParkedCars(rng, count) {
  const cars = [];
  const xs = roadXs(); const ys = roadYs();
  for (let i = 0; i < count; i++) {
    const vertical = rng.chance(0.5);
    if (vertical) {
      const x = rng.pick(xs) + rng.pick([-1, 1]) * (ROAD_WIDTH / 2 - 14);
      cars.push(makeCar(x, rng.range(120, 1900), Math.PI / 2, rng.pick(VEHICLE_MODELS), 'parked'));
    } else {
      const y = rng.pick(ys) + rng.pick([-1, 1]) * (ROAD_WIDTH / 2 - 14);
      cars.push(makeCar(rng.range(120, 3080), y, 0, rng.pick(VEHICLE_MODELS), 'parked'));
    }
  }
  return cars;
}

export function spawnTrafficCars(rng, count) {
  const cars = [];
  const xs = roadXs(); const ys = roadYs();
  for (let i = 0; i < count; i++) {
    const vertical = rng.chance(0.5);
    const dir = rng.pick([-1, 1]);
    let car;
    if (vertical) {
      const laneX = rng.pick(xs) + dir * 20;
      car = makeCar(laneX, rng.range(100, 1950), dir > 0 ? Math.PI / 2 : -Math.PI / 2, rng.pick(VEHICLE_MODELS), 'traffic');
    } else {
      const laneY = rng.pick(ys) + dir * 20;
      car = makeCar(rng.range(100, 3100), laneY, dir > 0 ? 0 : Math.PI, rng.pick(VEHICLE_MODELS), 'traffic');
    }
    car.targetSpeed = rng.range(85, 135);
    car.speed = car.targetSpeed;
    cars.push(car);
  }
  return cars;
}

export const POLICE_MODEL = { name: 'Serena Interceptor', color: '#1b2a4a', speed: 285, accel: 205 };
export function spawnPoliceCar(player, rng) {
  const a = rng.range(0, Math.PI * 2);
  const x = Math.max(60, Math.min(3140, player.x + Math.cos(a) * 620));
  const y = Math.max(60, Math.min(1950, player.y + Math.sin(a) * 620));
  const car = makeCar(x, y, Math.atan2(player.y - y, player.x - x), POLICE_MODEL, 'police');
  car.targetSpeed = 240;
  return car;
}

// Traffic: follow the current road straight; at an intersection sometimes
// turn onto the crossing road; slow for a car ahead; never leave the roads.
export function updateTrafficCar(car, dt, allCars, rng) {
  let ahead = null;
  for (const other of allCars) {
    if (other === car) continue;
    const dx = other.x - car.x; const dy = other.y - car.y;
    const forward = dx * Math.cos(car.angle) + dy * Math.sin(car.angle);
    const side = Math.abs(-dx * Math.sin(car.angle) + dy * Math.cos(car.angle));
    if (forward > 0 && forward < 74 && side < 20) { ahead = other; break; }
  }
  const want = ahead ? Math.max(0, ahead.speed - 10) : car.targetSpeed;
  car.speed += Math.max(-160 * dt, Math.min(90 * dt, want - car.speed));
  car.x += Math.cos(car.angle) * car.speed * dt;
  car.y += Math.sin(car.angle) * car.speed * dt;
  // Intersection turn: near a crossing, occasionally pick the crossing road.
  for (const rx of roadXs()) for (const ry of roadYs()) {
    if (Math.abs(car.x - rx) < 8 && Math.abs(car.y - ry) < 8 && rng.chance(0.012)) {
      const vertical = Math.abs(Math.sin(car.angle)) > 0.5;
      const dir = rng.pick([-1, 1]);
      if (vertical) { car.angle = dir > 0 ? 0 : Math.PI; car.y = ry + dir * 0; car.x = rx + (dir > 0 ? 20 : -20) * 0 + car.x - rx; car.y = ry; }
      else { car.angle = dir > 0 ? Math.PI / 2 : -Math.PI / 2; car.x = rx; }
      // Snap into the correct lane for the new heading.
      if (car.angle === 0) car.y = ry - 20; if (car.angle === Math.PI) car.y = ry + 20;
      if (car.angle === Math.PI / 2) car.x = rx + 20; if (car.angle === -Math.PI / 2) car.x = rx - 20;
    }
  }
  if (!isOnRoad(car.x, car.y) || car.x < 40 || car.x > 3160 || car.y < 40 || car.y > 2000) {
    // Turn around rather than leave the city grid.
    car.angle += Math.PI; car.x += Math.cos(car.angle) * 30; car.y += Math.sin(car.angle) * 30;
    car.speed = Math.min(car.speed, 60);
  }
}

// Player / police driving: acceleration, braking, steering scaled by speed.
export function driveCar(car, dt, controls, model) {
  const accel = model.accel;
  if (controls.forward) car.speed += accel * dt;
  else if (controls.back) car.speed -= (car.speed > 5 ? 220 : accel * 0.55) * dt;
  else car.speed -= Math.sign(car.speed) * Math.min(Math.abs(car.speed), 55 * dt);
  car.speed = Math.max(-model.speed * 0.38, Math.min(model.speed, car.speed));
  const steer = (controls.left ? -1 : 0) + (controls.right ? 1 : 0);
  if (steer !== 0 && Math.abs(car.speed) > 4) {
    car.angle += steer * 1.9 * dt * Math.sign(car.speed) * Math.min(1, Math.abs(car.speed) / 90);
  }
  car.x += Math.cos(car.angle) * car.speed * dt;
  car.y += Math.sin(car.angle) * car.speed * dt;
  return Math.abs(car.speed);
}

export function updatePoliceCar(car, dt, target, buildingsHit) {
  const dx = target.x - car.x; const dy = target.y - car.y;
  const dist = Math.hypot(dx, dy) || 1;
  const desired = Math.atan2(dy, dx);
  let diff = desired - car.angle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  car.angle += Math.max(-2.4 * dt, Math.min(2.4 * dt, diff));
  const want = dist > 46 ? POLICE_MODEL.speed : 30;
  car.speed += Math.max(-240 * dt, Math.min(POLICE_MODEL.accel * dt, want - car.speed));
  if (buildingsHit) car.speed *= 0.4;
  car.x += Math.cos(car.angle) * car.speed * dt;
  car.y += Math.sin(car.angle) * car.speed * dt;
}

export function carsCollide(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y) < 40;
}
export function separateCars(a, b) {
  const dx = b.x - a.x; const dy = b.y - a.y; const d = Math.hypot(dx, dy) || 1;
  const push = (40 - d) / 2;
  a.x -= (dx / d) * push; a.y -= (dy / d) * push;
  b.x += (dx / d) * push; b.y += (dy / d) * push;
  const swap = (a.speed + b.speed) / 2;
  a.speed = swap * 0.5; b.speed = swap * 0.5;
}
