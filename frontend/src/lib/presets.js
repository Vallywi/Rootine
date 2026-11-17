// Focus rhythms the user can pick on the Focus screen. Each one sets the focus length and the short break.
// The long break and "long break after N sessions" stay as the user set them in Settings.
export const PRESETS = [
  { id: 'sprint', name: 'Sprint', emoji: '🐣', focus: 15, rest: 3, best: 'low energy, burnout, or dreaded admin tasks' },
  { id: 'classic', name: 'Classic', emoji: '🍅', focus: 25, rest: 5, tag: 'Great for beginners', best: 'general studying, task switching, and beginners. After four cycles you get a longer break' },
  { id: 'focus-block', name: 'Focus Block', emoji: '🧩', focus: 40, rest: 10, best: 'research papers or coding, where a slightly longer ramp-up is needed' },
  { id: 'deep-work', name: 'Deep Work', emoji: '🌊', focus: 50, rest: 10, best: 'writing, complex problem-solving, and tasks that need sustained concentration' },
  { id: 'extended-sprint', name: 'Extended Sprint', emoji: '🚀', focus: 75, rest: 15, best: 'graduate-level work or deep hyperfocus' },
  { id: 'ultradian', name: 'Ultradian Rhythm', emoji: '🌙', focus: 90, rest: 20, best: 'creative flow. It matches the body’s natural 90-minute rest-activity cycle' },
];

// Only shown when the server runs in demo mode (development only).
export const DEMO_PRESET = { id: 'demo', name: 'Demo', emoji: '⚡', focus: 1, rest: 1, tag: 'Testing only', best: 'testing only. It is a 1 minute session, so you can see growing, collecting, and the yard right away' };
export const presetList = (demo) => (demo ? [DEMO_PRESET, ...PRESETS] : PRESETS);

// The preset that matches the saved settings, or "custom".
export function presetFor(settings, demo = false) {
  const hit = presetList(demo).find((p) => p.focus === settings.focusMinutes && p.rest === settings.shortBreakMinutes);
  return hit ? hit.id : 'custom';
}
