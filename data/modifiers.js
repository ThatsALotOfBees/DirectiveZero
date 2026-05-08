// Run modifiers: pick 1-of-3 at run start. Each tweaks the run-state
// trade-off between difficulty and reward.

export const MODIFIERS = [
  { id: 'none',          name: 'STANDARD',        desc: 'No modifier. Baseline run.',                                  rarity: 1,
    apply: () => {} },
  { id: 'horde',         name: 'HORDE',           desc: '+50% enemy spawn rate. +30% ore drop chance.',                rarity: 6,
    apply: (rs) => { rs.spawnMult = 1.5; rs.dropMult = 1.30; } },
  { id: 'fragile',       name: 'FRAGILE',         desc: '-40% max HP, but +60% damage.',                               rarity: 8,
    apply: (rs, p) => { p.stats.maxHp = Math.max(20, Math.floor(p.stats.maxHp * 0.6)); p.hp = p.stats.maxHp; p.stats.damage *= 1.6; } },
  { id: 'speed_demon',   name: 'SPEED DEMON',     desc: '+40% move & fire rate. Enemies +25% faster.',                 rarity: 7,
    apply: (rs, p) => { p.stats.moveSpeed *= 1.4; p.stats.fireRate *= 1.4; rs.enemySpeedMult = 1.25; } },
  { id: 'glass_brain',   name: 'GLASS BRAIN',     desc: '+100% damage, but you take 2× damage.',                       rarity: 9,
    apply: (rs, p) => { p.stats.damage *= 2.0; rs.playerDmgTaken = 2.0; } },
  { id: 'tinker',        name: 'TINKER',          desc: '+1 starting projectile and pierce.',                          rarity: 5,
    apply: (rs, p) => { p.stats.projectiles += 1; p.stats.pierce += 1; } },
  { id: 'collector',     name: 'COLLECTOR',       desc: '+80% pickup radius. +50% XP gain.',                           rarity: 5,
    apply: (rs, p) => { p.stats.pickupRadius *= 1.8; p.stats.xpGain += 0.5; } },
  { id: 'frost_field',   name: 'FROST FIELD',     desc: 'Bullets chill enemies. Enemies +30% HP.',                     rarity: 7,
    apply: (rs, p) => { p.stats.chillOnHit = (p.stats.chillOnHit || 0) + 1; rs.enemyHpMult = 1.30; } },
  { id: 'pyro_pact',     name: 'PYRO PACT',       desc: 'All bullets ignite. Burn DoT +50%.',                          rarity: 7,
    apply: (rs, p) => { p.stats.burnChance = Math.max(p.stats.burnChance, 1.0); p.stats.burnDmg = Math.max(p.stats.burnDmg, 5); p.stats.burnTickRate = (p.stats.burnTickRate || 1) * 1.5; } },
  { id: 'rich_veins',    name: 'RICH VEINS',      desc: '+150% ore drop chance. -20% damage.',                         rarity: 9,
    apply: (rs, p) => { rs.dropMult = 2.5; p.stats.damage *= 0.8; } },
  { id: 'overcharge',    name: 'OVERCHARGE',      desc: '+1 starting drone. +30% drone damage.',                       rarity: 8,
    apply: (rs, p) => { p.addDrone(); p.stats.droneDmgMult = (p.stats.droneDmgMult || 1) * 1.3; } },
  { id: 'apex_protocol', name: 'APEX PROTOCOL',   desc: '+25% to all primary stats. +40% enemy stats.',                rarity: 11,
    apply: (rs, p) => { p.stats.fireRate *= 1.25; p.stats.damage *= 1.25; p.stats.moveSpeed *= 1.25; p.stats.maxHp = Math.floor(p.stats.maxHp * 1.25); p.hp = p.stats.maxHp; rs.enemyHpMult = 1.4; rs.enemySpeedMult = 1.2; rs.enemyDmgMult = 1.4; } },
  { id: 'big_pockets',   name: 'BIG POCKETS',     desc: '+50% Research Data earned this run.',                         rarity: 6,
    apply: (rs, p) => { p.stats.researchMult = (p.stats.researchMult || 1) * 1.5; } },
  { id: 'second_wind_r', name: 'PHOENIX HEART',   desc: 'Start with +1 Last Stand and +50 max HP.',                    rarity: 8,
    apply: (rs, p) => { p.stats.lastStandCharges = (p.stats.lastStandCharges || 0) + 1; p.stats.maxHp += 50; p.hp = p.stats.maxHp; } },
  { id: 'mythic_pact',   name: 'MYTHIC PACT',     desc: 'Start at level 5. Enemies +30% damage.',                      rarity: 13,
    apply: (rs, p) => { rs.startLevel = 5; rs.enemyDmgMult = 1.3; } }
];

export function pickRandomModifiers(count = 3) {
  const pool = [...MODIFIERS].filter(m => m.id !== 'none');
  const out = [{ ...MODIFIERS[0] }];
  while (out.length < count && pool.length > 0) {
    const idx = Math.floor(Math.random() * pool.length);
    out.push(pool.splice(idx, 1)[0]);
  }
  return out;
}

export function findModifier(id) { return MODIFIERS.find(m => m.id === id); }
