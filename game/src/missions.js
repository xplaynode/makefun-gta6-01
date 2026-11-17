// missions.js — Lucia Ferrer's story chain in Costa Serena: four sequential
// missions for fixer Marco Delgado, each with a world marker, on-screen
// objective text, a cash reward and a saved completion state.
export const MISSIONS = [
  {
    id: 'first-wheels', title: 'Mission 1 — First Wheels',
    giver: 'Marco Delgado', reward: 250,
    brief: 'Meet Marco at the Sol Marina boardwalk.',
    objective: 'Go to the gold marker at Sol Marina',
    target: { x: 620, y: 1780 }, kind: 'reach',
  },
  {
    id: 'harbour-run', title: 'Mission 2 — Harbour Run',
    giver: 'Marco Delgado', reward: 400,
    brief: 'A crate waits at Harbour Point. Drive it back by reaching the dock marker — any car will do, press E to take one.',
    objective: 'Drive to the Harbour Point dock marker',
    target: { x: 2820, y: 1620 }, kind: 'reach',
  },
  {
    id: 'sol-marina-shots', title: 'Mission 3 — Trouble at the Marina',
    giver: 'Lucia Ferrer', reward: 650,
    brief: 'Rival crew Los Cayos are shaking down the marina kiosks. Drive them off: defeat 3 of them at the marker (mouse aim, click to fire).',
    objective: 'Defeat the Los Cayos crew at Sol Marina (0/3)',
    target: { x: 760, y: 1700 }, kind: 'combat', foes: 3,
  },
  {
    id: 'costa-heights-getaway', title: 'Mission 4 — The Heights Getaway',
    giver: 'Marco Delgado', reward: 1000,
    brief: 'Last job: reach the villa lookout in Costa Heights. The police will be watching — expect stars.',
    objective: 'Reach the Costa Heights lookout marker',
    target: { x: 2720, y: 420 }, kind: 'reach', heatOnStart: 3,
  },
];

export function currentMission(index) {
  return index >= 0 && index < MISSIONS.length ? MISSIONS[index] : null;
}
export function missionCompleteText(mission) {
  return `${mission.title} complete — $${mission.reward} earned`;
}
export function allMissionsDoneText() {
  return 'Story complete — Costa Serena is yours. Free-roam: steal, race the strip, outrun the police.';
}
