// shots.js — deterministic screenshot scenes for Costa Serena.
// ?shot=cover|foot|chase|combat&seed=7 places the player, cars, police and
// people in a fixed rich arrangement, freezes the action, and the main
// loop sets window.__shotReady once the scene has been rendered.
import { VEHICLE_MODELS } from './city.js';
import { makeCar, POLICE_MODEL } from './vehicles.js';
import { makeHostile, makePedestrian } from './people.js';

export function parseShotQuery() {
  const q = new URLSearchParams(location.search);
  const shot = q.get('shot');
  if (!shot) return null;
  return { name: shot, seed: Number(q.get('seed') || 7) || 7 };
}

export function setupShotScene(state, shot, rng) {
  const p = state.player;
  state.shotMode = true;
  if (shot.name === 'cover') {
    // Driving in Centro Serena with traffic all around.
    const car = makeCar(1400, 1020, 0.12, VEHICLE_MODELS[0], 'player');
    car.speed = 120; state.cars.push(car); p.inCar = car; p.x = car.x; p.y = car.y;
    state.cars.push(makeCar(1560, 980, 0, VEHICLE_MODELS[1], 'traffic'));
    state.cars.push(makeCar(1230, 1065, Math.PI, VEHICLE_MODELS[3], 'traffic'));
    state.cars.push(makeCar(1470, 860, Math.PI / 2, VEHICLE_MODELS[4], 'traffic'));
    state.missionIndex = 1; state.cash = 250;
  } else if (shot.name === 'foot') {
    // On foot among pedestrians near Playa Serena.
    p.x = 980; p.y = 1905; p.inCar = null;
    for (let i = 0; i < 8; i++) state.people.push(makePedestrian(900 + i * 36, 1870 + (i % 3) * 34, rng));
    state.cars.push(makeCar(1060, 1880, 0, VEHICLE_MODELS[4], 'parked'));
    state.cars.push(makeCar(820, 1925, 0, VEHICLE_MODELS[2], 'traffic'));
    state.missionIndex = 0; state.cash = 120;
  } else if (shot.name === 'chase') {
    // Police pursuit down the Palmera Strip with three stars.
    const car = makeCar(1500, 1420, 0, VEHICLE_MODELS[0], 'player');
    car.speed = 170; state.cars.push(car); p.inCar = car; p.x = car.x; p.y = car.y;
    const cop1 = makeCar(1330, 1385, 0.15, POLICE_MODEL, 'police');
    const cop2 = makeCar(1300, 1470, -0.1, POLICE_MODEL, 'police');
    const cop3 = makeCar(1690, 1495, Math.PI, POLICE_MODEL, 'police');
    state.cars.push(cop1, cop2, cop3);
    state.cars.push(makeCar(1620, 1330, 0, VEHICLE_MODELS[5], 'traffic'));
    state.heat = 2.6; state.missionIndex = 3; state.cash = 1300;
  } else if (shot.name === 'combat') {
    // Marina firefight: Lucia faces the Los Cayos crew at the marker.
    p.x = 700; p.y = 1745; p.inCar = null; p.aimAngle = -0.5;
    const foes = [makeHostile(790, 1690, rng), makeHostile(830, 1745, rng), makeHostile(775, 1795, rng)];
    for (const f of foes) state.people.push(f);
    state.missionFoes = foes; state.missionIndex = 2; state.cash = 650;
    state.cars.push(makeCar(640, 1825, 0.3, VEHICLE_MODELS[2], 'parked'));
    state.heat = 1.2;
  } else {
    p.x = 1000; p.y = 1000;
  }
  state.started = true;
}
