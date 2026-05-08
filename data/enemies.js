// Enemy variants. Each entry describes a stat profile and behavior flags.
// SpawnSystem uses time-windowed weights to pick which type spawns.

export const ENEMY_TYPES = [
  {
    id: 'corrupted',
    name: 'Corrupted',
    texture: 'enemy',
    scale: 1,
    hpMult: 1, speedMult: 1, dmgMult: 1, xpMult: 1,
    dropMult: 1,
    color: 0x3a3a44,
    desc: 'Standard swarm unit.'
  },
  {
    id: 'runner',
    name: 'Runner',
    texture: 'enemy_runner',
    scale: 0.85,
    hpMult: 0.5, speedMult: 1.65, dmgMult: 0.8, xpMult: 0.85,
    dropMult: 0.7,
    color: 0x6a3a44,
    desc: 'Fast, fragile. Closes distance quickly.'
  },
  {
    id: 'brute',
    name: 'Brute',
    texture: 'enemy_brute',
    scale: 1.4,
    hpMult: 3.6, speedMult: 0.6, dmgMult: 1.6, xpMult: 2.4,
    dropMult: 2.2,
    color: 0x2a3a55,
    desc: 'Slow, heavily armored. Drops more ore.'
  },
  {
    id: 'spitter',
    name: 'Spitter',
    texture: 'enemy_spitter',
    scale: 1.0,
    hpMult: 0.9, speedMult: 0.75, dmgMult: 1.0, xpMult: 1.4,
    dropMult: 1.2,
    color: 0x3a5a3a,
    desc: 'Fires acid at range.',
    ranged: true,
    rangedDist: 180,
    fireInterval: 1.6,
    bulletSpeed: 160,
    bulletDmg: 6
  },
  {
    id: 'splitter',
    name: 'Splitter',
    texture: 'enemy_splitter',
    scale: 1.1,
    hpMult: 1.5, speedMult: 0.85, dmgMult: 1.0, xpMult: 1.3,
    dropMult: 1.4,
    color: 0x6a5a2a,
    desc: 'Splits into 2 hatchlings on death.',
    spawnsOnDeath: { type: 'hatchling', count: 2 }
  },
  {
    id: 'hatchling',
    name: 'Hatchling',
    texture: 'enemy_runner',
    scale: 0.6,
    hpMult: 0.25, speedMult: 1.4, dmgMult: 0.7, xpMult: 0.4,
    dropMult: 0.0,
    color: 0xaa8030,
    desc: 'Spawned by Splitters.'
  },
  {
    id: 'elite',
    name: 'Elite',
    texture: 'enemy_elite',
    scale: 1.6,
    hpMult: 9, speedMult: 0.7, dmgMult: 2.0, xpMult: 6,
    dropMult: 4,
    color: 0x9020aa,
    desc: 'Heavily augmented. Drops rare ore.',
    eliteDropBoost: true
  }
];

export const ENEMY_BY_ID = Object.fromEntries(ENEMY_TYPES.map(e => [e.id, e]));

// Time-based weighted spawn table. Earlier the table the more common.
// Format: { until: seconds, weights: { typeId: weight, ... } }
// SpawnSystem picks the first entry where elapsed < until.
export const SPAWN_TABLE = [
  { until: 30,  weights: { corrupted: 100 } },
  { until: 60,  weights: { corrupted: 75, runner: 25 } },
  { until: 120, weights: { corrupted: 55, runner: 25, brute: 12, spitter: 8 } },
  { until: 200, weights: { corrupted: 45, runner: 25, brute: 12, spitter: 10, splitter: 8 } },
  { until: 300, weights: { corrupted: 35, runner: 22, brute: 14, spitter: 13, splitter: 13, elite: 3 } },
  { until: 9999,weights: { corrupted: 25, runner: 22, brute: 16, spitter: 16, splitter: 16, elite: 5 } }
];

export function pickEnemyType(elapsed) {
  const row = SPAWN_TABLE.find(r => elapsed < r.until) || SPAWN_TABLE[SPAWN_TABLE.length - 1];
  const total = Object.values(row.weights).reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (const [id, w] of Object.entries(row.weights)) {
    r -= w;
    if (r <= 0) return ENEMY_BY_ID[id];
  }
  return ENEMY_BY_ID.corrupted;
}
