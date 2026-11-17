// The "study plan": keep the Pomodoro rhythm going by itself for a number of rounds (or until the user stops).
// One round = one focus session (a plant) plus the rest after it. The last round has no rest after it.
import { PLANT_CATALOG } from './plants.js';

// Choices shown to the user. hours = null means "keep going until I stop", 0 means no plan (a single session).
export const PLAN_CHOICES = [
  { id: 'open', label: 'Keep going until I stop', hours: null },
  { id: 'one', label: 'Just one session', hours: 0 },
  { id: 'h1', label: '1 hour', hours: 1 },
  { id: 'h2', label: '2 hours', hours: 2 },
  { id: 'h3', label: '3 hours', hours: 3 },
  { id: 'h4', label: '4 hours', hours: 4 },
  { id: 'custom', label: 'Choose my own hours', hours: -1 },
];
export const CUSTOM_HOURS = { min: 0.5, max: 12 };

// How many rounds fit in `totalMinutes`, so that focus times plus the rests between them do not go over.
export const roundsFor = (totalMinutes, focusMinutes, breakMinutes) =>
  Math.max(1, Math.floor((totalMinutes + breakMinutes) / (focusMinutes + breakMinutes)));

// Minutes the plan will really take: all the focus time plus the rests between rounds.
export const planMinutes = (rounds, focusMinutes, breakMinutes) => rounds * focusMinutes + (rounds - 1) * breakMinutes;

// Turn a choice into a plan size: null (no plan), { rounds: null } (open ended), or { rounds: n }.
export function planFor(choiceId, customHours, focusMinutes, breakMinutes) {
  const choice = PLAN_CHOICES.find((c) => c.id === choiceId) ?? PLAN_CHOICES[0];
  if (choice.hours === 0) return null;
  if (choice.hours === null) return { rounds: null };
  const hours = choice.hours === -1 ? Number(customHours) : choice.hours;
  if (!Number.isFinite(hours) || hours < CUSTOM_HOURS.min || hours > CUSTOM_HOURS.max) return undefined; // not valid yet
  return { rounds: roundsFor(hours * 60, focusMinutes, breakMinutes) };
}

// The next plant for the next round: a plant that fits the focus length and has not been grown in this plan yet.
// Once every plant has had a turn, any plant except the one just grown.
export function nextPlant(previous, focusMinutes, { unlockAll = false, random = Math.random, used = [] } = {}) {
  const fits = PLANT_CATALOG.filter((p) => unlockAll || p.minMinutes <= focusMinutes);
  const fresh = fits.filter((p) => !used.includes(p.id) && p.id !== previous);
  const others = fits.filter((p) => p.id !== previous);
  const pool = fresh.length ? fresh : others.length ? others : fits;
  return pool[Math.floor(random() * pool.length)].id;
}

export const hoursText = (minutes) => {
  const h = Math.floor(minutes / 60), m = Math.round(minutes % 60);
  if (h === 0) return `${m} min`;
  return m ? `${h} h ${m} min` : `${h} h`;
};
