// effects.js — particles, muzzle flashes, skid puffs and floating text.
export function createEffects() {
  const particles = [];
  const texts = [];
  function spawn(x, y, opts) {
    particles.push({
      x, y, vx: opts.vx ?? 0, vy: opts.vy ?? 0, life: opts.life ?? 0.5, age: 0,
      size: opts.size ?? 4, color: opts.color ?? '#ffffff', gravity: opts.gravity ?? 0,
    });
  }
  return {
    particles, texts,
    burst(x, y, color, count, speed) {
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2; const s = speed * (0.3 + Math.random() * 0.7);
        spawn(x, y, { vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.35 + Math.random() * 0.3, size: 2 + Math.random() * 3, color });
      }
    },
    muzzle(x, y, angle) {
      spawn(x, y, { vx: Math.cos(angle) * 260, vy: Math.sin(angle) * 260, life: 0.08, size: 7, color: '#ffd94d' });
      spawn(x, y, { life: 0.12, size: 11, color: '#ff9f43' });
    },
    smoke(x, y) { spawn(x, y, { vx: (Math.random() - 0.5) * 20, vy: -26, life: 0.7, size: 6, color: 'rgba(120,120,120,0.55)' }); },
    cashText(x, y, label) { texts.push({ x, y, label, age: 0, life: 1.6 }); },
    update(dt) {
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]; p.age += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.gravity * dt;
        if (p.age >= p.life) particles.splice(i, 1);
      }
      for (let i = texts.length - 1; i >= 0; i--) {
        const t = texts[i]; t.age += dt; t.y -= 28 * dt;
        if (t.age >= t.life) texts.splice(i, 1);
      }
    },
    draw(ctx, cam) {
      for (const p of particles) {
        ctx.globalAlpha = Math.max(0, 1 - p.age / p.life);
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x - cam.x, p.y - cam.y, p.size, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.font = 'bold 17px system-ui, sans-serif'; ctx.textAlign = 'center';
      for (const t of texts) {
        ctx.globalAlpha = Math.max(0, 1 - t.age / t.life);
        ctx.fillStyle = '#7dff8a'; ctx.fillText(t.label, t.x - cam.x, t.y - cam.y);
      }
      ctx.globalAlpha = 1;
    },
  };
}
