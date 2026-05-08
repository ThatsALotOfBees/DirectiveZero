// 60 craftable permanent upgrades organized into 12 tracks × 5 tiers.
// Each upgrade is a single-purchase node (cumulative effects).
// Higher tiers require rarer ingots in addition to Research Data.

import { findIngot } from './materials.js';

const T = (research, ingots = {}) => ({ research, ingots });

// Cost ramp per tier across most tracks.
const COST = [
  T(40),
  T(120, { ironIngot: 1 }),
  T(280, { ironIngot: 2, steelIngot: 1 }),
  T(560, { steelIngot: 3, cobaltIngot: 1 }),
  T(1100, { cobaltIngot: 2, voidAlloy: 1, plasmaCell: 1 })
];

const ROMAN = ['I', 'II', 'III', 'IV', 'V'];

function track(opts) {
  const { trackId, name, descPer, effectKey, effectVals, costs = COST, descPrefix = '+' } = opts;
  return effectVals.map((val, i) => ({
    id: `${trackId}_t${i + 1}`,
    track: trackId,
    tier: i + 1,
    name: `${name} ${ROMAN[i]}`,
    desc: `${descPrefix}${descPer(val)}`,
    effect: { [effectKey]: val },
    cost: costs[i]
  }));
}

const UPGRADES = [];

UPGRADES.push(...track({
  trackId: 'hp', name: 'CHASSIS PLATING', effectKey: 'startHp',
  effectVals: [15, 30, 50, 80, 120],
  descPer: (v) => `${v} starting HP`
}));

UPGRADES.push(...track({
  trackId: 'damage', name: 'POWER MATRIX', effectKey: 'damageBonus',
  effectVals: [0.05, 0.10, 0.18, 0.28, 0.42],
  descPer: (v) => `${(v * 100).toFixed(0)}% base damage`
}));

UPGRADES.push(...track({
  trackId: 'xp', name: 'NEURAL UPLINK', effectKey: 'xpBonus',
  effectVals: [0.05, 0.10, 0.18, 0.28, 0.42],
  descPer: (v) => `${(v * 100).toFixed(0)}% XP gain`
}));

UPGRADES.push(...track({
  trackId: 'pickup', name: 'COLLECTION ARRAY', effectKey: 'pickupBonus',
  effectVals: [0.10, 0.20, 0.32, 0.50, 0.75],
  descPer: (v) => `${(v * 100).toFixed(0)}% pickup radius`
}));

UPGRADES.push(...track({
  trackId: 'reaction', name: 'REACTION CORE', effectKey: 'reaction',
  effectVals: [0.04, 0.08, 0.13, 0.20, 0.30],
  descPer: (v) => `${(v).toFixed(2)} AI reaction`
}));

UPGRADES.push(...track({
  trackId: 'precision', name: 'GYRO PRECISION', effectKey: 'precision',
  effectVals: [0.04, 0.08, 0.13, 0.20, 0.30],
  descPer: (v) => `${(v).toFixed(2)} movement smoothness`
}));

UPGRADES.push(...track({
  trackId: 'fireRate', name: 'TRIGGER LOOM', effectKey: 'fireRateBonus',
  effectVals: [0.05, 0.10, 0.16, 0.24, 0.36],
  descPer: (v) => `${(v * 100).toFixed(0)}% base fire rate`
}));

UPGRADES.push(...track({
  trackId: 'speed', name: 'SERVO LATTICE', effectKey: 'speedBonus',
  effectVals: [0.05, 0.10, 0.16, 0.24, 0.36],
  descPer: (v) => `${(v * 100).toFixed(0)}% base move speed`
}));

UPGRADES.push(...track({
  trackId: 'crit', name: 'TARGETING SUITE', effectKey: 'startCrit',
  effectVals: [0.04, 0.06, 0.08, 0.10, 0.13],
  descPer: (v) => `${(v * 100).toFixed(0)}% start crit chance`
}));

UPGRADES.push(...track({
  trackId: 'pierce', name: 'PHASE PRIMER', effectKey: 'startPierce',
  effectVals: [1, 1, 1, 1, 1],
  descPer: () => `1 start pierce`
}));

UPGRADES.push(...track({
  trackId: 'projectile', name: 'BARREL ARRAY', effectKey: 'startProjectiles',
  effectVals: [1, 1, 1, 1, 1],
  descPer: () => `1 start projectile`
}));

UPGRADES.push(...track({
  trackId: 'drone', name: 'DRONE BAY', effectKey: 'startDrones',
  effectVals: [1, 0, 1, 0, 1],
  descPer: (v) => v > 0 ? `1 start drone` : `+30% drone damage`,
  // For tiers without +1 drone, give drone damage instead
}));
// Patch tier 2/4 to give drone damage instead
{
  const ups = UPGRADES.filter(u => u.track === 'drone');
  ups[1].effect = { droneDmgMult: 0.20 }; ups[1].desc = '+20% drone damage';
  ups[3].effect = { droneDmgMult: 0.30 }; ups[3].desc = '+30% drone damage';
}

export { UPGRADES };

export function upgradeFor(id) { return UPGRADES.find(u => u.id === id); }

export function canAfford(upgrade, save) {
  if (save.research < upgrade.cost.research) return false;
  for (const [k, v] of Object.entries(upgrade.cost.ingots || {})) {
    if ((save.materials?.[k] || 0) < v) return false;
  }
  return true;
}

export function payFor(upgrade, save) {
  save.research -= upgrade.cost.research;
  for (const [k, v] of Object.entries(upgrade.cost.ingots || {})) {
    save.materials[k] = (save.materials[k] || 0) - v;
  }
  save.upgrades[upgrade.id] = 1;
}

export function isOwned(upgrade, save) {
  return !!save.upgrades?.[upgrade.id];
}

export function tierUnlocked(upgrade, save) {
  // Tiers must be bought in order
  if (upgrade.tier === 1) return true;
  const prevId = `${upgrade.track}_t${upgrade.tier - 1}`;
  return !!save.upgrades?.[prevId];
}

export function describeCost(upgrade) {
  const parts = [`${upgrade.cost.research} RD`];
  for (const [k, v] of Object.entries(upgrade.cost.ingots || {})) {
    const ing = findIngot(k);
    parts.push(`${v}× ${ing ? ing.name : k}`);
  }
  return parts.join(' · ');
}

export const TRACKS = [
  { id: 'hp',         name: 'Chassis Plating',  desc: 'Starting hull strength' },
  { id: 'damage',     name: 'Power Matrix',     desc: 'Baseline weapon damage' },
  { id: 'xp',         name: 'Neural Uplink',    desc: 'XP gain multiplier' },
  { id: 'pickup',     name: 'Collection Array', desc: 'Pickup radius' },
  { id: 'reaction',   name: 'Reaction Core',    desc: 'AI response speed' },
  { id: 'precision',  name: 'Gyro Precision',   desc: 'Movement smoothness' },
  { id: 'fireRate',   name: 'Trigger Loom',     desc: 'Base fire rate' },
  { id: 'speed',      name: 'Servo Lattice',    desc: 'Base move speed' },
  { id: 'crit',       name: 'Targeting Suite',  desc: 'Starting crit chance' },
  { id: 'pierce',     name: 'Phase Primer',     desc: 'Starting pierce stack' },
  { id: 'projectile', name: 'Barrel Array',     desc: 'Starting projectile count' },
  { id: 'drone',      name: 'Drone Bay',        desc: 'Drones from run start' }
];
