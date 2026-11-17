// combat.js — on-foot shooting for Costa Serena: mouse-aimed pistol,
// bullets, hostile crew fire, hits, health and the crime reports that
// raise the wanted level.
export function createCombat() {
  return { bullets: [], cooldown: 0, shotsFired: 0 };
}
export function tryPlayerShot(combat, player, aimAngle, effects, audio) {
  if (combat.cooldown > 0) return false;
  combat.cooldown = 0.22; combat.shotsFired++;
  const mx = player.x + Math.cos(aimAngle) * 18; const my = player.y + Math.sin(aimAngle) * 18;
  combat.bullets.push({ x: mx, y: my, vx: Math.cos(aimAngle) * 760, vy: Math.sin(aimAngle) * 760, life: 0.55, from: 'player' });
  effects.muzzle(mx, my, aimAngle);
  audio.shot();
  return true;
}
export function hostileShot(combat, hostile, target) {
  const a = Math.atan2(target.y - hostile.y, target.x - hostile.x);
  combat.bullets.push({ x: hostile.x, y: hostile.y, vx: Math.cos(a) * 520, vy: Math.sin(a) * 520, life: 0.7, from: 'hostile' });
}
export function updateBullets(combat, dt, world, callbacks) {
  combat.cooldown = Math.max(0, combat.cooldown - dt);
  for (let i = combat.bullets.length - 1; i >= 0; i--) {
    const b = combat.bullets[i];
    b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    let remove = b.life <= 0;
    if (!remove && world.buildingAt(b.x, b.y)) { callbacks.onHitWall(b); remove = true; }
    if (!remove && b.from === 'player') {
      for (const p of world.people) {
        if (!p.dead && Math.hypot(p.x - b.x, p.y - b.y) < 13) { callbacks.onHitPerson(b, p); remove = true; break; }
      }
      if (!remove) for (const car of world.cars) {
        if (Math.hypot(car.x - b.x, car.y - b.y) < 26) { callbacks.onHitCar(b, car); remove = true; break; }
      }
    }
    if (!remove && b.from === 'hostile') {
      const pl = world.player;
      const px = pl.inCar ? pl.inCar.x : pl.x; const py = pl.inCar ? pl.inCar.y : pl.y;
      if (Math.hypot(px - b.x, py - b.y) < (pl.inCar ? 28 : 13)) { callbacks.onHitPlayer(b); remove = true; }
    }
    if (remove) combat.bullets.splice(i, 1);
  }
}
export function drawBullets(ctx, combat, cam) {
  ctx.fillStyle = '#ffe66d';
  for (const b of combat.bullets) { ctx.beginPath(); ctx.arc(b.x - cam.x, b.y - cam.y, 3, 0, Math.PI * 2); ctx.fill(); }
}
