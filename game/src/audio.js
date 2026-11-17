// audio.js — tiny WebAudio sound effects generated in code: engine hum,
// gunshot crack, cash chime, siren hint and UI clicks. No audio files.
export function createAudio() {
  let ctx = null; let engineOsc = null; let engineGain = null;
  function ensure() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return ctx; }
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { ctx = null; }
    return ctx;
  }
  function blip(freq, dur, type, vol, slideTo) {
    const c = ensure(); if (!c) return;
    const o = c.createOscillator(); const g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, c.currentTime);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, c.currentTime + dur);
    g.gain.setValueAtTime(vol, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    o.connect(g).connect(c.destination); o.start(); o.stop(c.currentTime + dur);
  }
  return {
    unlock() { ensure(); },
    click() { blip(660, 0.07, 'square', 0.05); },
    shot() { blip(180, 0.12, 'sawtooth', 0.16, 60); },
    cash() { blip(880, 0.1, 'sine', 0.12); setTimeout(() => blip(1320, 0.14, 'sine', 0.12), 70); },
    hurt() { blip(140, 0.18, 'triangle', 0.14, 70); },
    siren() { blip(720, 0.22, 'sine', 0.05, 980); },
    setEngine(on, speedRatio) {
      const c = ensure(); if (!c) return;
      if (on && !engineOsc) {
        engineOsc = c.createOscillator(); engineGain = c.createGain();
        engineOsc.type = 'sawtooth'; engineGain.gain.value = 0.02;
        engineOsc.connect(engineGain).connect(c.destination); engineOsc.start();
      }
      if (engineOsc) {
        engineOsc.frequency.value = 55 + Math.abs(speedRatio) * 130;
        engineGain.gain.value = on ? 0.025 : 0;
        if (!on) { try { engineOsc.stop(); } catch { /* already stopped */ } engineOsc = null; engineGain = null; }
      }
    },
  };
}
