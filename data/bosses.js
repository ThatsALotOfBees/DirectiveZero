// Boss spawn schedule. Triggered by SpawnSystem when run time crosses a
// threshold. Bosses are heavy enemies with massive HP and unique drops.

export const BOSSES = [
  {
    atTime: 120, id: 'crusher',
    name: 'CRUSHER',
    texture: 'boss_crusher',
    scale: 2.2,
    hpMult: 60, speedMult: 0.55, dmgMult: 2.2, xpMult: 30,
    dropMult: 6, color: 0xc0c0d0, isBoss: true,
    desc: 'A heavy unit that wades through fire.'
  },
  {
    atTime: 240, id: 'overseer',
    name: 'OVERSEER',
    texture: 'boss_overseer',
    scale: 2.0,
    hpMult: 100, speedMult: 0.7, dmgMult: 2.5, xpMult: 50,
    dropMult: 8, color: 0xc060ff, isBoss: true,
    ranged: true, rangedDist: 220, fireInterval: 1.0, bulletSpeed: 220, bulletDmg: 12,
    desc: 'Spits clusters of plasma at range.'
  },
  {
    atTime: 360, id: 'leviathan',
    name: 'LEVIATHAN',
    texture: 'boss_leviathan',
    scale: 2.6,
    hpMult: 180, speedMult: 0.5, dmgMult: 3.0, xpMult: 80,
    dropMult: 12, color: 0x66ddff, isBoss: true,
    eliteDropBoost: true,
    desc: 'A massive armored core. Drops rare ore.'
  },
  {
    atTime: 540, id: 'omega',
    name: 'OMEGA',
    texture: 'boss_omega',
    scale: 2.8,
    hpMult: 320, speedMult: 0.65, dmgMult: 3.5, xpMult: 140,
    dropMult: 18, color: 0xffaa33, isBoss: true,
    eliteDropBoost: true,
    desc: 'Apex predator. Drops Plasma.'
  },
  {
    atTime: 780, id: 'directive_one',
    name: 'DIRECTIVE 1',
    texture: 'boss_omega',
    scale: 3.0,
    hpMult: 600, speedMult: 0.7, dmgMult: 4.0, xpMult: 240,
    dropMult: 28, color: 0xff44ee, isBoss: true,
    eliteDropBoost: true,
    desc: 'Endgame guardian. Repeats every 4 minutes after.'
  }
];

// Returns next boss to spawn, given current elapsed time and last spawned at.
export function nextBoss(elapsed, lastSpawnAt) {
  for (const b of BOSSES) {
    if (b.atTime > lastSpawnAt && elapsed >= b.atTime) return b;
  }
  // After last boss, repeat the final boss every 240s
  const last = BOSSES[BOSSES.length - 1];
  const phase = lastSpawnAt < last.atTime ? last.atTime : Math.floor(lastSpawnAt / 240) * 240 + 240;
  if (elapsed >= phase) return { ...last, atTime: phase };
  return null;
}
