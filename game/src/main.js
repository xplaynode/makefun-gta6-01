// main.js — Costa Serena game loop and orchestration: player, driving,
// traffic, pedestrians, police and the wanted system, combat, missions,
// camera, HUD wiring, menus, save/load and the screenshot scenes.
import { createRng } from './rng.js';
import { WORLD_WIDTH, WORLD_HEIGHT, buildCity, collidesWithBuilding, keepOutOfBuildings, districtAt } from './city.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { createEffects } from './effects.js';
import { loadSave, storeSave } from './save.js';
import { MISSIONS, currentMission, missionCompleteText, allMissionsDoneText } from './missions.js';
import { spawnParkedCars, spawnTrafficCars, spawnPoliceCar, updateTrafficCar, updatePoliceCar, driveCar, carsCollide, separateCars } from './vehicles.js';
import { spawnPedestrians, updatePedestrian, scarePedestriansNear, makeHostile } from './people.js';
import { createCombat, tryPlayerShot, hostileShot, updateBullets, drawBullets } from './combat.js';
import { drawWorld, drawCar, drawPerson } from './render.js';
import { drawHud, drawMinimap } from './hud.js';
import { parseShotQuery, setupShotScene } from './shots.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const VIEW_W = 1280; const VIEW_H = 720;
canvas.width = VIEW_W; canvas.height = VIEW_H;

const shot = parseShotQuery();
const seed = shot ? shot.seed : 7;
const rng = createRng(seed * 1000 + 17);
const city = buildCity(createRng(4242));
const input = createInput(canvas);
const audio = createAudio();
const effects = createEffects();
const combat = createCombat();
const saved = shot ? null : loadSave();

const state = {
  time: 0, started: false, paused: false, over: false, shotMode: false,
  city, cars: [], people: [], marker: null,
  cash: saved ? saved.cash : 0,
  missionIndex: saved ? saved.missionIndex : 0,
  bustedCount: saved ? saved.bustedCount : 0,
  heat: 0, wanted: 0, hidden: false, hideTimer: 0, bustTimer: 0,
  missionTitle: '', objective: '', toast: null, nearCarHint: null,
  missionFoes: null, foesDefeated: 0, viewW: VIEW_W, viewH: VIEW_H,
  player: {
    x: 1040, y: 1060, angle: 0, aimAngle: 0, speed: 0, health: 100,
    inCar: null, color: '#ff4757', dead: false,
  },
};
state.cars = [...spawnParkedCars(rng, 16), ...spawnTrafficCars(rng, 13)];
state.people = spawnPedestrians(rng, 26);

const cam = { x: 0, y: 0 };
function buildingAt(x, y) { return collidesWithBuilding(city.buildings, x, y, 2); }
function refreshMission() {
  const m = currentMission(state.missionIndex);
  state.missionFoes = null; state.foesDefeated = 0;
  if (!m) {
    state.marker = null; state.missionTitle = 'FREE ROAM — STORY COMPLETE';
    state.objective = allMissionsDoneText();
    return;
  }
  state.marker = m.target; state.missionTitle = m.title;
  state.objective = m.objective;
  if (m.heatOnStart) addHeat(m.heatOnStart * 0.34);
  if (m.kind === 'combat') {
    state.missionFoes = [];
    for (let i = 0; i < m.foes; i++) {
      const foe = makeHostile(m.target.x + (i - 1) * 55, m.target.y + (i % 2 ? 46 : -40), rng);
      state.missionFoes.push(foe); state.people.push(foe);
    }
  }
}
function addHeat(amount) {
  state.heat = Math.min(4.9, state.heat + amount);
}
function crime(amount, x, y, witnesses) {
  if (witnesses) addHeat(amount);
  scarePedestriansNear(state.people, x, y, 190);
}
function showToast(text) { state.toast = { text, age: 0 }; }
function completeMission() {
  const m = currentMission(state.missionIndex);
  if (!m) return;
  state.cash += m.reward;
  effects.cashText(state.player.x, state.player.y - 30, '+$' + m.reward);
  audio.cash();
  showToast(missionCompleteText(m));
  state.missionIndex++;
  storeSave(state);
  refreshMission();
}
function checkMissionProgress() {
  const m = currentMission(state.missionIndex);
  if (!m) return;
  if (m.kind === 'reach') {
    const px = state.player.inCar ? state.player.inCar.x : state.player.x;
    const py = state.player.inCar ? state.player.inCar.y : state.player.y;
    if (Math.hypot(px - m.target.x, py - m.target.y) < 58) completeMission();
  } else if (m.kind === 'combat') {
    state.objective = `Defeat the Los Cayos crew at Sol Marina (${state.foesDefeated}/${m.foes})`;
    if (state.foesDefeated >= m.foes) completeMission();
  }
}
function endRun(kind) {
  if (state.over) return;
  state.over = true;
  if (kind === 'busted') state.bustedCount++;
  state.heat = 0;
  storeSave(state);
  audio.setEngine(false, 0);
  document.getElementById('endTitle').textContent = kind === 'busted' ? 'BUSTED' : 'WASTED';
  document.getElementById('endText').textContent = kind === 'busted'
    ? 'The Policia de Serena boxed you in. You pay a $100 fine and walk out of the station on Sol Marina.'
    : 'You woke up outside Clinica Serena. The medics took $100 and your pride.';
  state.cash = Math.max(0, state.cash - 100);
  document.getElementById('endScreen').classList.remove('hidden');
}
function respawn() {
  const p = state.player;
  p.health = 100; p.dead = false; p.inCar = null; p.x = 640; p.y = 1660;
  state.cars = state.cars.filter((c) => c.kind !== 'police');
  state.over = false; state.bustTimer = 0;
  document.getElementById('endScreen').classList.add('hidden');
  storeSave(state);
}

function nearestCar(maxDist) {
  let best = null; let bd = maxDist;
  const list = state.player.inCar ? [] : state.cars;
  for (const car of list) {
    if (car.kind === 'police') continue;
    const d = Math.hypot(car.x - state.player.x, car.y - state.player.y);
    if (d < bd) { bd = d; best = car; }
  }
  return best;
}

function updatePlayer(dt) {
  const p = state.player;
  if (p.inCar) {
    const car = p.inCar;
    const speedBefore = Math.abs(car.speed);
    driveCar(car, dt, {
      forward: input.down('KeyW') || input.down('ArrowUp'),
      back: input.down('KeyS') || input.down('ArrowDown'),
      left: input.down('KeyA') || input.down('ArrowLeft'),
      right: input.down('KeyD') || input.down('ArrowRight'),
    }, car.model);
    if (keepOutOfBuildings(city.buildings, car, 22)) { car.health -= Math.abs(car.speed) * 0.04; car.speed *= -0.25; effects.burst(car.x, car.y, '#dfe6e9', 5, 70); }
    car.x = Math.max(30, Math.min(WORLD_WIDTH - 30, car.x));
    car.y = Math.max(30, Math.min(WORLD_HEIGHT - 30, car.y));
    p.x = car.x; p.y = car.y; p.angle = car.angle;
    audio.setEngine(true, car.speed / car.model.speed);
    if (Math.abs(car.speed) > 130) scarePedestriansNear(state.people, car.x, car.y, 90);
    if (speedBefore > 60 && Math.abs(car.speed) < 12) { /* sudden stop handled by collisions */ }
    if (input.justPressed('KeyE')) {
      audio.setEngine(false, 0);
      p.inCar = null; p.x = car.x + 30; p.y = car.y + 10;
      if (car.kind === 'player') car.kind = 'parked';
    }
    return;
  }
  audio.setEngine(false, 0);
  const axis = input.moveAxis();
  const running = input.down('ShiftLeft') || input.down('ShiftRight');
  const spd = running ? 218 : 138;
  if (axis.active) {
    p.x += axis.x * spd * dt; p.y += axis.y * spd * dt;
    p.angle = Math.atan2(axis.y, axis.x);
  }
  p.x = Math.max(16, Math.min(WORLD_WIDTH - 16, p.x));
  p.y = Math.max(16, Math.min(WORLD_HEIGHT - 16, p.y));
  keepOutOfBuildings(city.buildings, p, 10);
  // Aim with the mouse in world space.
  p.aimAngle = Math.atan2((input.mouse.y + cam.y) - p.y, (input.mouse.x + cam.x) - p.x);
  const near = nearestCar(52);
  state.nearCarHint = near ? near.model.name : null;
  if (near && input.justPressed('KeyE')) {
    const witnessed = state.people.some((q) => !q.dead && Math.hypot(q.x - near.x, q.y - near.y) < 210)
      || state.cars.some((c) => c.kind === 'police' && Math.hypot(c.x - near.x, c.y - near.y) < 320);
    if (near.kind !== 'parked' || near.driver) crime(0.55, near.x, near.y, witnessed);
    else if (witnessed) crime(0.4, near.x, near.y, true);
    near.kind = 'player'; near.driver = true;
    p.inCar = near; audio.click();
  }
  if ((input.mouse.down || input.down('KeyF')) && state.started) {
    if (tryPlayerShot(combat, p, p.aimAngle, effects, audio)) {
      crime(0.5, p.x, p.y, state.people.some((q) => Math.hypot(q.x - p.x, q.y - p.y) < 260) || state.wanted > 0);
    }
  }
}

function updateWorld(dt) {
  const p = state.player;
  const focus = p.inCar || p;
  for (const car of state.cars) {
    if (car === p.inCar || car.kind === 'parked' || car.kind === 'player') continue;
    if (car.kind === 'traffic') updateTrafficCar(car, dt, state.cars, rng);
    if (keepOutOfBuildings(city.buildings, car, 20) && car.kind === 'traffic') { car.angle += Math.PI; car.speed = 40; }
  }
  // Car-to-car collisions.
  for (let i = 0; i < state.cars.length; i++) for (let j = i + 1; j < state.cars.length; j++) {
    const a = state.cars[i]; const b = state.cars[j];
    if (carsCollide(a, b)) {
      const impact = Math.abs(a.speed) + Math.abs(b.speed);
      separateCars(a, b);
      a.health -= impact * 0.05; b.health -= impact * 0.05;
      if (impact > 90) {
        effects.burst((a.x + b.x) / 2, (a.y + b.y) / 2, '#fab1a0', 8, 90);
        if (a === p.inCar || b === p.inCar) crime(0.45, p.x, p.y, true);
        scarePedestriansNear(state.people, a.x, a.y, 170);
      }
    }
  }
  // Running over a pedestrian is a serious crime.
  for (const person of state.people) {
    if (person.dead) continue;
    for (const car of state.cars) {
      if (Math.abs(car.speed) > 55 && Math.hypot(car.x - person.x, car.y - person.y) < 24) {
        person.dead = true; person.health = 0;
        effects.burst(person.x, person.y, '#ff7675', 10, 80);
        if (car === p.inCar || car.kind === 'player') { crime(1.1, person.x, person.y, true); onPersonDown(person); }
      }
    }
    updatePedestrian(person, dt, rng);
    if (person.hostile && !person.dead) updateHostile(person, dt);
  }
  updateBullets(combat, dt, { buildingAt, people: state.people, cars: state.cars, player: p }, bulletCallbacks);
  updateWantedAndPolice(dt);
  effects.update(dt);
  if (state.toast) { state.toast.age += dt; if (state.toast.age > 2.6) state.toast = null; }
  checkMissionProgress();
  void focus; void districtAt;
}

let hostileTimer = 0;
function updateHostile(person, dt) {
  const p = state.player;
  const target = p.inCar || p;
  const d = Math.hypot(target.x - person.x, target.y - person.y);
  if (d > 190) { // close in
    const a = Math.atan2(target.y - person.y, target.x - person.x);
    person.x += Math.cos(a) * 52 * dt; person.y += Math.sin(a) * 52 * dt;
  }
  hostileTimer -= dt;
  if (d < 330 && hostileTimer <= 0) { hostileTimer = 0.85; hostileShot(combat, person, target); }
}
function onPersonDown(person) {
  if (person.hostile && state.missionFoes && state.missionFoes.includes(person)) {
    state.foesDefeated++;
    effects.cashText(person.x, person.y - 20, 'Crew down ' + state.foesDefeated + '/3');
  }
}
const bulletCallbacks = {
  onHitWall(b) { effects.burst(b.x, b.y, '#dfe6e9', 3, 50); },
  onHitCar(b, car) { car.health -= 12; effects.burst(b.x, b.y, '#fdcb6e', 4, 70); if (car.kind === 'police') addHeat(0.3); },
  onHitPerson(b, person) {
    person.health -= 22;
    effects.burst(person.x, person.y, '#ff7675', 6, 70);
    if (person.health <= 0 && !person.dead) { person.dead = true; onPersonDown(person); crime(0.8, person.x, person.y, true); }
  },
  onHitPlayer() {
    const p = state.player;
    p.health -= p.inCar ? 3 : 8;
    audio.hurt();
    effects.burst(p.x, p.y, '#ff7675', 5, 60);
    if (p.health <= 0) endRun('wasted');
  },
};

function updateWantedAndPolice(dt) {
  const p = state.player;
  state.wanted = Math.max(0, Math.min(5, Math.floor(state.heat + 0.999)));
  const police = state.cars.filter((c) => c.kind === 'police');
  const seenByPolice = police.some((c) => Math.hypot(c.x - p.x, c.y - p.y) < 430);
  state.hidden = state.wanted > 0 && !seenByPolice;
  if (state.wanted > 0 && !seenByPolice) {
    state.hideTimer += dt;
    if (state.hideTimer > 4) { state.heat = Math.max(0, state.heat - dt * 0.22); if (state.heat < 0.05) state.heat = 0; }
  } else state.hideTimer = 0;
  const wantedCount = state.wanted === 0 ? 0 : state.wanted + 1;
  if (police.length < wantedCount && state.wanted > 0) {
    if (rng.chance(dt * 0.9)) state.cars.push(spawnPoliceCar(p, rng));
  }
  if (state.wanted === 0 && police.length) {
    state.cars = state.cars.filter((c) => c.kind !== 'police');
  }
  for (const cop of state.cars) {
    if (cop.kind !== 'police') continue;
    const hit = keepOutOfBuildings(city.buildings, cop, 20);
    updatePoliceCar(cop, dt, p.inCar || p, hit);
    const d = Math.hypot(cop.x - p.x, cop.y - p.y);
    if (d < 40 && Math.abs((p.inCar ? p.inCar.speed : 0)) < 26) {
      state.bustTimer += dt;
      if (state.bustTimer > 2.4) endRun('busted');
    } else if (d >= 40) state.bustTimer = Math.max(0, state.bustTimer - dt);
    if (d < 34 && p.inCar && Math.abs(p.inCar.speed) > 120) { cop.health -= 20 * dt; }
  }
  if (p.health <= 0 && !state.over) endRun('wasted');
  // Slow health regen when calm and unhurt recently.
  if (state.wanted === 0 && p.health > 0 && p.health < 100) p.health = Math.min(100, p.health + dt * 1.6);
}

function render() {
  const p = state.player;
  const focus = p.inCar || p;
  cam.x = Math.max(0, Math.min(WORLD_WIDTH - VIEW_W, focus.x - VIEW_W / 2));
  cam.y = Math.max(0, Math.min(WORLD_HEIGHT - VIEW_H, focus.y - VIEW_H / 2));
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  drawWorld(ctx, state, cam, VIEW_W, VIEW_H);
  for (const car of state.cars) drawCar(ctx, car, cam);
  for (const person of state.people) drawPerson(ctx, person, cam, false, 0);
  if (!p.inCar) drawPerson(ctx, p, cam, true, p.aimAngle);
  else { // driver visible through the windscreen position
    ctx.fillStyle = '#f2c79b'; ctx.beginPath(); ctx.arc(p.x - cam.x, p.y - cam.y, 5, 0, Math.PI * 2); ctx.fill();
  }
  drawBullets(ctx, combat, cam);
  effects.draw(ctx, cam);
  if (state.bustTimer > 0.2 && !state.over) {
    ctx.fillStyle = 'rgba(200,30,30,0.2)'; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 26px system-ui'; ctx.textAlign = 'center';
    ctx.fillText('THE POLICE ARE ON YOU — MOVE!', VIEW_W / 2, VIEW_H / 2 - 120);
  }
  drawHud(ctx, state, VIEW_W);
  drawMinimap(ctx, state, VIEW_W);
}

let lastTime = performance.now();
let shotFrames = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000 || 0.016);
  lastTime = now;
  if (state.started && !state.paused && !state.over) {
    if (!state.shotMode) { state.time += dt; updatePlayer(dt); updateWorld(dt); }
    else state.time += dt * 0.12; // screenshot scenes drift very slowly
  }
  render();
  if (input.justPressed('KeyP') || input.justPressed('Escape')) {
    if (state.started && !state.over) {
      state.paused = !state.paused;
      document.getElementById('pauseScreen').classList.toggle('hidden', !state.paused);
    }
  }
  input.endFrame();
  if (state.shotMode) {
    shotFrames++;
    if (shotFrames > 8) window.__shotReady = true;
  }
  requestAnimationFrame(frame);
}

// Menus.
const saveNote = document.getElementById('saveNote');
if (saved && (saved.cash > 0 || saved.missionIndex > 0)) {
  saveNote.textContent = `Welcome back, Lucia — saved progress loaded: $${saved.cash} and ${saved.missionIndex} of 4 missions done.`;
}
function startGame() {
  audio.unlock(); audio.click();
  document.getElementById('startScreen').classList.add('hidden');
  state.started = true;
  refreshMission();
  if (state.missionIndex > 0) showToast('Progress loaded — mission ' + (state.missionIndex + 1) + ' of 4');
}
document.getElementById('startButton').addEventListener('click', startGame);
document.getElementById('resumeButton').addEventListener('click', () => {
  state.paused = false; document.getElementById('pauseScreen').classList.add('hidden');
});
document.getElementById('restartButton').addEventListener('click', respawn);

if (shot) {
  document.getElementById('startScreen').classList.add('hidden');
  refreshMission();
  setupShotScene(state, shot, createRng(shot.seed * 31 + 5));
  // Shot scenes define their own mission/cash state after refresh.
  const m = currentMission(state.missionIndex);
  if (m) { state.marker = m.target; state.missionTitle = m.title; state.objective = m.objective; }
  if (shot.name === 'combat') state.objective = 'Defeat the Los Cayos crew at Sol Marina (1/3)';
  state.wanted = Math.max(0, Math.min(5, Math.floor(state.heat + 0.999)));
}
requestAnimationFrame(frame);
