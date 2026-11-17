// save.js — Costa Serena progress saved in localStorage: cash, the next
// mission index and the hero name, loaded again on the next visit.
const SAVE_KEY = 'costa-serena-save-v1';

export function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (typeof data !== 'object' || data === null) return null;
    return {
      cash: Math.max(0, Number(data.cash) || 0),
      missionIndex: Math.max(0, Math.min(4, Number(data.missionIndex) || 0)),
      bustedCount: Math.max(0, Number(data.bustedCount) || 0),
    };
  } catch { return null; }
}

export function storeSave(state) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      cash: Math.floor(state.cash), missionIndex: state.missionIndex, bustedCount: state.bustedCount,
    }));
  } catch { /* private mode: progress simply does not persist */ }
}

export function clearSave() {
  try { localStorage.removeItem(SAVE_KEY); } catch { /* ignore */ }
}
