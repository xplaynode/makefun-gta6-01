// render.js — the 2D canvas renderer for Costa Serena: sun-soaked streets,
// pastel buildings with soft shadows, palms, beach and water, cars, people.
import { BEACH_Y, WATER_Y, WORLD_HEIGHT, WORLD_WIDTH, districtAt, roadXs, roadYs } from './city.js';

export function drawWorld(ctx, state, cam, viewW, viewH) {
  const { city } = state;
  ctx.fillStyle = '#8ecf7a';
  ctx.fillRect(0, 0, viewW, viewH);
  // Beach sand and sea along the south edge.
  ctx.fillStyle = '#f7e3a1';
  ctx.fillRect(0, BEACH_Y - cam.y, viewW, WORLD_HEIGHT - BEACH_Y);
  ctx.fillStyle = '#2fb3c9';
  ctx.fillRect(0, WATER_Y - cam.y, viewW, WORLD_HEIGHT - WATER_Y);
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  for (let i = 0; i < 9; i++) {
    const wy = WATER_Y + 26 + i * 28 - cam.y;
    ctx.fillRect(((i * 173) % 900) - cam.x % 300, wy, 130, 4);
  }
  // Sidewalk blocks under the road grid.
  ctx.fillStyle = '#d9d2c4';
  for (const rx of roadXs()) ctx.fillRect(rx - 58 - cam.x, -cam.y, 116, BEACH_Y);
  for (const ry of roadYs()) ctx.fillRect(-cam.x, ry - 58 - cam.y, WORLD_WIDTH, 116);
  // Asphalt roads with centre dashes.
  ctx.fillStyle = '#4a4f57';
  for (const rx of roadXs()) ctx.fillRect(rx - 48 - cam.x, -cam.y, 96, BEACH_Y);
  for (const ry of roadYs()) ctx.fillRect(-cam.x, ry - 48 - cam.y, WORLD_WIDTH, 96);
  ctx.fillStyle = '#ffd94d';
  for (const rx of roadXs()) for (let y = 10; y < BEACH_Y; y += 64) ctx.fillRect(rx - 2 - cam.x, y - cam.y, 4, 30);
  for (const ry of roadYs()) for (let x = 10; x < WORLD_WIDTH; x += 64) ctx.fillRect(x - cam.x, ry - 2 - cam.y, 30, 4);
  // Buildings: soft shadow, pastel walls, window grid, coloured roof.
  for (const b of city.buildings) {
    if (b.x + b.w < cam.x - 60 || b.y + b.h < cam.y - 60 || b.x > cam.x + viewW + 60 || b.y > cam.y + viewH + 60) continue;
    ctx.fillStyle = 'rgba(60,50,20,0.22)';
    ctx.fillRect(b.x - cam.x + 9, b.y - cam.y + 11, b.w, b.h);
    ctx.fillStyle = b.color; ctx.fillRect(b.x - cam.x, b.y - cam.y, b.w, b.h);
    ctx.fillStyle = b.roof; ctx.fillRect(b.x - cam.x, b.y - cam.y, b.w, 12);
    ctx.fillStyle = 'rgba(40,80,110,0.55)';
    const cols = Math.max(2, Math.floor(b.w / 30)); const rows = Math.max(2, Math.floor(b.h / 30));
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) ctx.fillRect(b.x - cam.x + 8 + i * 28, b.y - cam.y + 20 + j * 27, 13, 15);
  }
  // District labels painted on the ground plan.
  ctx.font = 'bold 26px system-ui, sans-serif'; ctx.fillStyle = 'rgba(90,60,20,0.4)'; ctx.textAlign = 'left';
  for (const label of [['CENTRO SERENA', 1250, 900], ['COSTA HEIGHTS', 2250, 420], ['PUERTO VIEJO', 330, 1050], ['SOL MARINA', 380, 1620], ['HARBOUR POINT', 2520, 1560]]) {
    ctx.fillText(label[0], label[1] - cam.x, label[2] - cam.y);
  }
  ctx.font = 'bold 30px system-ui, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.fillText('PLAYA SERENA', 1350 - cam.x, 2060 - cam.y);
  // Palms and props.
  for (const p of city.palms) drawPalm(ctx, p, cam);
  for (const pr of city.props) drawProp(ctx, pr, cam);
  // Mission marker: a tall gold beam anyone can see across the city.
  if (state.marker) {
    const mx = state.marker.x - cam.x; const my = state.marker.y - cam.y;
    const grad = ctx.createLinearGradient(0, my - 260, 0, my);
    grad.addColorStop(0, 'rgba(255,210,63,0)'); grad.addColorStop(1, 'rgba(255,210,63,0.75)');
    ctx.fillStyle = grad; ctx.fillRect(mx - 16, my - 260, 32, 260);
    ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.arc(mx, my, 20 + Math.sin(state.time * 4) * 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#7a5200'; ctx.font = 'bold 20px system-ui'; ctx.textAlign = 'center'; ctx.fillText('★', mx, my + 7);
  }
  ctx.fillStyle = 'rgba(70,50,20,0.55)'; ctx.font = '15px system-ui'; ctx.textAlign = 'left';
  ctx.fillText(districtAt(state.player.x, state.player.y), 0, 0); // district shown in HUD instead
}

function drawPalm(ctx, p, cam) {
  const x = p.x - cam.x; const y = p.y - cam.y;
  ctx.strokeStyle = '#8a6d3b'; ctx.lineWidth = 5 * p.s;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 8 * p.lean * 10, y - 18 * p.s, x + 16 * p.lean * 10, y - 30 * p.s); ctx.stroke();
  ctx.strokeStyle = '#2e9e4f'; ctx.lineWidth = 4 * p.s;
  const tx = x + 16 * p.lean * 10; const ty = y - 30 * p.s;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + p.lean;
    ctx.beginPath(); ctx.moveTo(tx, ty); ctx.quadraticCurveTo(tx + Math.cos(a) * 16, ty + Math.sin(a) * 10 - 4, tx + Math.cos(a) * 26, ty + Math.sin(a) * 16 + 6); ctx.stroke();
  }
}
function drawProp(ctx, pr, cam) {
  const x = pr.x - cam.x; const y = pr.y - cam.y;
  if (pr.kind === 'lamp') { ctx.fillStyle = '#37474f'; ctx.fillRect(x - 2, y - 22, 4, 22); ctx.fillStyle = '#fff59d'; ctx.beginPath(); ctx.arc(x, y - 24, 5, 0, Math.PI * 2); ctx.fill(); }
  else if (pr.kind === 'kiosk') { ctx.fillStyle = '#ff7675'; ctx.fillRect(x - 11, y - 10, 22, 16); ctx.fillStyle = '#d63031'; ctx.fillRect(x - 13, y - 14, 26, 6); }
  else if (pr.kind === 'bench') { ctx.fillStyle = '#a1887f'; ctx.fillRect(x - 10, y - 3, 20, 5); }
  else { ctx.fillStyle = '#e74c3c'; ctx.fillRect(x - 3, y - 9, 6, 11); }
}

export function drawCar(ctx, car, cam) {
  const x = car.x - cam.x; const y = car.y - cam.y;
  ctx.save(); ctx.translate(x, y); ctx.rotate(car.angle);
  ctx.fillStyle = 'rgba(40,35,20,0.28)'; ctx.fillRect(-car.w / 2 + 4, -car.h / 2 + 5, car.w, car.h);
  ctx.fillStyle = car.model.color; roundRect(ctx, -car.w / 2, -car.h / 2, car.w, car.h, 7); ctx.fill();
  ctx.fillStyle = 'rgba(20,30,45,0.85)'; roundRect(ctx, -8, -car.h / 2 + 3, 19, car.h - 6, 4); ctx.fill();
  ctx.fillStyle = '#ffeaa7'; ctx.fillRect(car.w / 2 - 4, -car.h / 2 + 3, 3, 5); ctx.fillRect(car.w / 2 - 4, car.h / 2 - 8, 3, 5);
  ctx.fillStyle = '#ff4d4d'; ctx.fillRect(-car.w / 2 + 1, -car.h / 2 + 3, 3, 5); ctx.fillRect(-car.w / 2 + 1, car.h / 2 - 8, 3, 5);
  if (car.kind === 'police') {
    ctx.fillStyle = '#ffffff'; ctx.fillRect(-14, -car.h / 2, 26, car.h);
    ctx.fillStyle = (Math.floor(performance.now() / 280) % 2 === 0) ? '#ff3838' : '#3867ff';
    ctx.fillRect(-4, -6, 9, 12);
    ctx.fillStyle = '#12233f'; ctx.font = 'bold 8px system-ui'; ctx.textAlign = 'center'; ctx.fillText('POLICIA', 0, -car.h / 2 - 4);
  }
  if (car.health < 55) { ctx.fillStyle = 'rgba(60,60,60,0.5)'; ctx.beginPath(); ctx.arc(-car.w / 2 + 6, 0, 7, 0, Math.PI * 2); ctx.fill(); }
  ctx.restore();
}
export function drawPerson(ctx, p, cam, isPlayer, aimAngle) {
  const x = p.x - cam.x; const y = p.y - cam.y;
  ctx.fillStyle = 'rgba(50,40,20,0.25)'; ctx.beginPath(); ctx.ellipse(x + 3, y + 5, 9, 5, 0, 0, Math.PI * 2); ctx.fill();
  if (p.dead) {
    ctx.fillStyle = p.color; ctx.save(); ctx.translate(x, y); ctx.rotate(1.2); ctx.fillRect(-11, -4, 22, 8); ctx.restore(); return;
  }
  ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#f2c79b'; ctx.beginPath(); ctx.arc(x, y, 5.2, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#263238'; ctx.fillRect(x - 6, y - 10, 12, 4); // cap / hair
  if (p.hostile) { ctx.fillStyle = '#ff3838'; ctx.font = 'bold 13px system-ui'; ctx.textAlign = 'center'; ctx.fillText('!', x, y - 15); }
  if (isPlayer) {
    ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 13, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = '#37474f'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(aimAngle) * 19, y + Math.sin(aimAngle) * 19); ctx.stroke();
  }
}
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
