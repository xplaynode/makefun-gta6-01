// hud.js — heads-up display and minimap for Costa Serena: health, cash,
// wanted stars, objective text, speed, district name and the radar map.
import { BEACH_Y, WATER_Y, WORLD_HEIGHT, WORLD_WIDTH, districtAt, roadXs, roadYs } from './city.js';

export function drawHud(ctx, state, viewW) {
  const p = state.player;
  // Top-left panel: health bar and cash.
  ctx.fillStyle = 'rgba(12,24,38,0.62)';
  ctx.fillRect(14, 14, 238, 86);
  ctx.fillStyle = '#ffffff'; ctx.font = 'bold 17px system-ui, sans-serif'; ctx.textAlign = 'left';
  ctx.fillText('COSTA SERENA', 26, 38);
  ctx.fillStyle = '#7dff8a'; ctx.font = 'bold 19px system-ui, sans-serif';
  ctx.fillText('$' + Math.floor(state.cash).toLocaleString('en-US'), 26, 64);
  ctx.fillStyle = '#3a3f47'; ctx.fillRect(26, 74, 160, 12);
  ctx.fillStyle = p.health > 32 ? '#2ecc71' : '#e74c3c';
  ctx.fillRect(26, 74, 160 * Math.max(0, p.health) / 100, 12);
  ctx.fillStyle = '#ffffff'; ctx.font = '12px system-ui';
  ctx.fillText(Math.ceil(Math.max(0, p.health)) + ' HP', 192, 85);
  // Wanted stars, top centre.
  ctx.font = '30px system-ui'; ctx.textAlign = 'center';
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = i < state.wanted ? '#ffd23f' : 'rgba(255,255,255,0.28)';
    ctx.fillText('★', viewW / 2 - 64 + i * 32, 44);
  }
  if (state.wanted > 0) {
    ctx.fillStyle = '#ffb3b3'; ctx.font = 'bold 13px system-ui';
    ctx.fillText(state.hidden ? 'LOSING THE POLICE…' : 'POLICIA DE SERENA — PURSUIT', viewW / 2, 66);
  }
  // Objective banner, top-right below the minimap space.
  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(12,24,38,0.62)'; ctx.fillRect(viewW - 404, 178, 390, 58);
  ctx.fillStyle = '#ffd23f'; ctx.font = 'bold 13px system-ui';
  ctx.fillText(state.missionTitle || 'FREE ROAM', viewW - 24, 198);
  ctx.fillStyle = '#ffffff'; ctx.font = '14px system-ui';
  wrapRight(ctx, state.objective || '', viewW - 24, 218, 370);
  // Bottom-left: district + speed / controls hint.
  ctx.textAlign = 'left'; ctx.fillStyle = 'rgba(12,24,38,0.55)'; ctx.fillRect(14, state.viewH - 58, 330, 44);
  ctx.fillStyle = '#ffeaa7'; ctx.font = 'bold 15px system-ui';
  ctx.fillText(districtAt(p.x, p.y), 26, state.viewH - 32);
  ctx.fillStyle = '#ffffff'; ctx.font = '14px system-ui';
  if (p.inCar) ctx.fillText(Math.round(Math.abs(p.inCar.speed) * 0.62) + ' km/h · ' + p.inCar.model.name, 176, state.viewH - 32);
  else ctx.fillText('E: enter car · Click: fire · P: pause', 176, state.viewH - 32);
  if (state.toast) {
    ctx.globalAlpha = Math.min(1, state.toast.age < 0.3 ? state.toast.age / 0.3 : Math.max(0, 1 - (state.toast.age - 1.6) / 0.8));
    ctx.textAlign = 'center'; ctx.fillStyle = '#ffd23f'; ctx.font = 'bold 24px system-ui';
    ctx.fillText(state.toast.text, viewW / 2, 118);
    ctx.globalAlpha = 1;
  }
  if (state.nearCarHint) {
    ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(12,24,38,0.7)'; ctx.fillRect(viewW / 2 - 110, state.viewH - 104, 220, 30);
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 15px system-ui';
    ctx.fillText('Press E — take the ' + state.nearCarHint, viewW / 2, state.viewH - 84);
  }
}
function wrapRight(ctx, text, x, y, maxW) {
  if (ctx.measureText(text).width <= maxW) { ctx.fillText(text, x, y); return; }
  const words = text.split(' '); let line = '';
  for (const w of words) { if (ctx.measureText(line + w).width > maxW) break; line += w + ' '; }
  ctx.fillText(line.trim() + '…', x, y);
}

export function drawMinimap(ctx, state, viewW) {
  const S = 158; const x0 = viewW - S - 14; const y0 = 14;
  const sx = S / WORLD_WIDTH; const sy = S / WORLD_HEIGHT;
  ctx.fillStyle = 'rgba(20,40,30,0.9)'; ctx.fillRect(x0, y0, S, S);
  ctx.fillStyle = '#2fb3c9'; ctx.fillRect(x0, y0 + WATER_Y * sy, S, (WORLD_HEIGHT - WATER_Y) * sy);
  ctx.fillStyle = '#f7e3a1'; ctx.fillRect(x0, y0 + BEACH_Y * sy, S, (WORLD_HEIGHT - BEACH_Y) * sy * 0.4);
  ctx.strokeStyle = 'rgba(255,255,255,0.65)'; ctx.lineWidth = 1;
  for (const rx of roadXs()) { ctx.beginPath(); ctx.moveTo(x0 + rx * sx, y0); ctx.lineTo(x0 + rx * sx, y0 + S); ctx.stroke(); }
  for (const ry of roadYs()) { ctx.beginPath(); ctx.moveTo(x0, y0 + ry * sy); ctx.lineTo(x0 + S, y0 + ry * sy); ctx.stroke(); }
  if (state.marker) {
    ctx.fillStyle = '#ffd23f'; ctx.beginPath();
    ctx.arc(x0 + state.marker.x * sx, y0 + state.marker.y * sy, 5 + Math.sin(state.time * 5) * 1.4, 0, Math.PI * 2); ctx.fill();
  }
  for (const car of state.cars) {
    if (car.kind !== 'police') continue;
    ctx.fillStyle = '#4da3ff'; ctx.fillRect(x0 + car.x * sx - 2, y0 + car.y * sy - 2, 4, 4);
  }
  for (const person of state.people) {
    if (!person.hostile || person.dead) continue;
    ctx.fillStyle = '#ff3838'; ctx.fillRect(x0 + person.x * sx - 2, y0 + person.y * sy - 2, 4, 4);
  }
  const p = state.player;
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x0 + p.x * sx, y0 + p.y * sy, 4, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#ffd23f'; ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.strokeRect(x0, y0, S, S);
}
