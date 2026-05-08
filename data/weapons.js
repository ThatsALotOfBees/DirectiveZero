// 36 craftable weapons. Each weapon, when equipped, applies its own
// stat profile to the player at run start. A few weapons use special
// fire modes (beam / burst / ring) handled in Player.tryShoot.

// rarity mirrors the perks rarity tier (1..20) for color consistency.
// recipe lists Research Data + Ingot requirements (one-time craft).

const T = (research, ingots = {}) => ({ research, ingots });

export const WEAPONS = [
  // ===== Tier 1: starter / common =====
  {
    id: 'pulse_carbine',
    name: 'Pulse Carbine',
    desc: 'Standard issue. Balanced rate of fire and damage.',
    rarity: 1, fireMode: 'standard',
    bulletColor: 0xe0b0ff,
    starter: true,
    recipe: T(0),
    apply: (p) => {} // baseline (no changes)
  },

  // ===== Common automatics / variations =====
  {
    id: 'rapid_smg',
    name: 'Rapid SMG',
    desc: 'High fire rate, low damage. Hose them down.',
    rarity: 3, fireMode: 'standard',
    bulletColor: 0xffd0aa,
    recipe: T(120, { ironIngot: 2 }),
    apply: (p) => { p.stats.fireRate *= 2.2; p.stats.damage *= 0.55; p.stats.bulletSpeed *= 1.10; }
  },
  {
    id: 'heavy_carbine',
    name: 'Heavy Carbine',
    desc: 'Slow, hard-hitting rounds. Good baseline.',
    rarity: 3, fireMode: 'standard',
    bulletColor: 0xffa86b, bulletScale: 1.4,
    recipe: T(140, { ironIngot: 2 }),
    apply: (p) => { p.stats.fireRate *= 0.7; p.stats.damage *= 2.0; }
  },
  {
    id: 'auto_shotgun',
    name: 'Auto Shotgun',
    desc: '5 spread pellets per shot. Short bullet life.',
    rarity: 4, fireMode: 'standard',
    bulletColor: 0xffe0a0,
    recipe: T(180, { ironIngot: 3 }),
    apply: (p) => { p.stats.fireRate *= 0.85; p.stats.damage *= 0.55; p.stats.projectiles += 4; p.stats.bulletLife *= 0.65; p.stats.bulletSpeed *= 0.9; }
  },
  {
    id: 'sniper_rifle',
    name: 'Marksman Rifle',
    desc: 'Massive damage, very slow rate. Long range.',
    rarity: 5, fireMode: 'standard',
    bulletColor: 0xffffff, bulletScale: 1.4,
    recipe: T(220, { ironIngot: 2, steelIngot: 1 }),
    apply: (p) => { p.stats.fireRate *= 0.35; p.stats.damage *= 5.0; p.stats.bulletSpeed *= 2.2; p.stats.range += 200; p.stats.bulletLife *= 1.5; p.stats.pierce += 1; }
  },
  {
    id: 'twin_pistol',
    name: 'Twin Pistols',
    desc: '+1 projectile, mild fire rate boost.',
    rarity: 3, fireMode: 'standard',
    bulletColor: 0xffd0ff,
    recipe: T(120, { ironIngot: 2 }),
    apply: (p) => { p.stats.projectiles += 1; p.stats.fireRate *= 1.15; p.stats.damage *= 0.85; }
  },

  // ===== Element-flavored =====
  {
    id: 'flamethrower',
    name: 'Flamethrower',
    desc: 'Stream of short-range fire. Always ignites.',
    rarity: 6, fireMode: 'standard',
    bulletColor: 0xff7733,
    recipe: T(280, { steelIngot: 2 }),
    apply: (p) => { p.stats.fireRate *= 4.5; p.stats.damage *= 0.30; p.stats.bulletSpeed *= 0.55; p.stats.bulletLife *= 0.40; p.stats.burnChance = Math.max(p.stats.burnChance, 1.0); p.stats.burnDmg = Math.max(p.stats.burnDmg, 4); }
  },
  {
    id: 'cryo_cannon',
    name: 'Cryo Cannon',
    desc: 'Hits chill enemies. Moderate damage.',
    rarity: 7, fireMode: 'standard',
    bulletColor: 0x88e0ff,
    recipe: T(280, { steelIngot: 2 }),
    apply: (p) => { p.stats.chillOnHit = (p.stats.chillOnHit || 0) + 2; p.stats.damage *= 0.9; p.stats.fireRate *= 1.0; }
  },
  {
    id: 'tesla_wand',
    name: 'Tesla Wand',
    desc: 'Every shot chains lightning.',
    rarity: 8, fireMode: 'standard',
    bulletColor: 0xb0c8ff,
    recipe: T(320, { steelIngot: 1, cobaltIngot: 1 }),
    apply: (p) => { p.stats.chainChance = 1.0; p.stats.chainCount = Math.max(p.stats.chainCount, 2); p.stats.damage *= 0.85; }
  },
  {
    id: 'rocket_launcher',
    name: 'Rocket Launcher',
    desc: 'Single explosive rocket, slow fire rate.',
    rarity: 8, fireMode: 'standard',
    bulletColor: 0xff8b3a, bulletScale: 1.6,
    recipe: T(360, { steelIngot: 2, cobaltIngot: 1 }),
    apply: (p) => { p.stats.fireRate *= 0.45; p.stats.damage *= 1.6; p.stats.explosionDmg = Math.max(p.stats.explosionDmg, 14); p.stats.explosionRadius = Math.max(p.stats.explosionRadius, 60); p.stats.bulletSpeed *= 0.85; }
  },
  {
    id: 'plasma_smg',
    name: 'Plasma SMG',
    desc: 'Fast plasma rounds with mild burn.',
    rarity: 6, fireMode: 'standard',
    bulletColor: 0xff66dd,
    recipe: T(260, { steelIngot: 2 }),
    apply: (p) => { p.stats.fireRate *= 1.7; p.stats.damage *= 0.7; p.stats.burnChance = Math.max(p.stats.burnChance, 0.4); p.stats.burnDmg = Math.max(p.stats.burnDmg, 3); }
  },
  {
    id: 'acid_sprayer',
    name: 'Acid Sprayer',
    desc: 'Slow corrosion bullets. Long-lasting damage.',
    rarity: 7, fireMode: 'standard',
    bulletColor: 0xbfff66,
    recipe: T(300, { steelIngot: 2 }),
    apply: (p) => { p.stats.fireRate *= 1.5; p.stats.damage *= 0.6; p.stats.burnChance = 0.8; p.stats.burnDmg = Math.max(p.stats.burnDmg, 5); }
  },

  // ===== Beam weapons =====
  {
    id: 'laser_beam',
    name: 'Laser Beam',
    desc: 'Instant beam. Pierces multiple enemies.',
    rarity: 9, fireMode: 'beam',
    bulletColor: 0xff4488, beamColor: 0xff4488, beamWidth: 2,
    recipe: T(420, { cobaltIngot: 1 }),
    apply: (p) => { p.stats.fireRate *= 1.6; p.stats.damage *= 0.7; p.stats.range += 200; p.stats.pierce += 4; }
  },
  {
    id: 'twin_beam',
    name: 'Twin Beam',
    desc: 'Two parallel laser lines.',
    rarity: 11, fireMode: 'beam',
    bulletColor: 0x88aaff, beamColor: 0x88aaff, beamWidth: 2,
    recipe: T(540, { cobaltIngot: 2 }),
    apply: (p) => { p.stats.fireRate *= 1.4; p.stats.damage *= 0.65; p.stats.projectiles = Math.max(2, p.stats.projectiles); p.stats.pierce += 3; }
  },
  {
    id: 'helix_lance',
    name: 'Helix Lance',
    desc: 'Wide twin beam. High pierce.',
    rarity: 13, fireMode: 'beam',
    bulletColor: 0xffaa33, beamColor: 0xffaa33, beamWidth: 3,
    recipe: T(700, { cobaltIngot: 2, voidAlloy: 1 }),
    apply: (p) => { p.stats.fireRate *= 1.3; p.stats.damage *= 1.0; p.stats.projectiles = Math.max(3, p.stats.projectiles); p.stats.pierce += 5; }
  },
  {
    id: 'void_beam',
    name: 'Void Beam',
    desc: 'Heavy beam, slow rate, big damage.',
    rarity: 14, fireMode: 'beam',
    bulletColor: 0xb070ff, beamColor: 0xb070ff, beamWidth: 4,
    recipe: T(900, { voidAlloy: 2 }),
    apply: (p) => { p.stats.fireRate *= 0.7; p.stats.damage *= 3.0; p.stats.range += 250; p.stats.pierce += 8; }
  },

  // ===== Burst & wave =====
  {
    id: 'burst_rifle',
    name: 'Burst Rifle',
    desc: 'Fires 3-round bursts.',
    rarity: 5, fireMode: 'burst',
    bulletColor: 0xa8d6ff, burstCount: 3, burstDelay: 0.06,
    recipe: T(220, { ironIngot: 2, steelIngot: 1 }),
    apply: (p) => { p.stats.fireRate *= 0.85; p.stats.damage *= 0.95; }
  },
  {
    id: 'manic_burst',
    name: 'Manic Burst',
    desc: '5-round bursts with quick spacing.',
    rarity: 9, fireMode: 'burst',
    bulletColor: 0xff77ff, burstCount: 5, burstDelay: 0.04,
    recipe: T(420, { steelIngot: 2, cobaltIngot: 1 }),
    apply: (p) => { p.stats.fireRate *= 0.65; p.stats.damage *= 0.9; }
  },
  {
    id: 'pulse_wave',
    name: 'Pulse Wave',
    desc: 'Fires a 360° ring on every shot.',
    rarity: 11, fireMode: 'ring',
    bulletColor: 0x88ffff, ringCount: 12,
    recipe: T(560, { cobaltIngot: 2 }),
    apply: (p) => { p.stats.fireRate *= 0.55; p.stats.damage *= 0.55; p.stats.bulletLife *= 0.5; p.stats.bulletSpeed *= 0.8; }
  },
  {
    id: 'thunderclap',
    name: 'Thunderclap',
    desc: 'Wide explosive ring. Slow.',
    rarity: 13, fireMode: 'ring',
    bulletColor: 0xffd34b, ringCount: 8,
    recipe: T(720, { cobaltIngot: 2, voidAlloy: 1 }),
    apply: (p) => { p.stats.fireRate *= 0.40; p.stats.damage *= 1.1; p.stats.explosionDmg = Math.max(p.stats.explosionDmg, 6); p.stats.explosionRadius = Math.max(p.stats.explosionRadius, 30); }
  },

  // ===== Special / synergy =====
  {
    id: 'railgun',
    name: 'Railgun',
    desc: 'Pierces everything. High damage, slow.',
    rarity: 12, fireMode: 'standard',
    bulletColor: 0xeeeeff, bulletScale: 1.6,
    recipe: T(600, { cobaltIngot: 2, voidAlloy: 1 }),
    apply: (p) => { p.stats.fireRate *= 0.55; p.stats.damage *= 3.5; p.stats.bulletSpeed *= 2.5; p.stats.bulletLife *= 1.5; p.stats.pierce += 10; p.stats.range += 300; }
  },
  {
    id: 'gauss_rifle',
    name: 'Gauss Rifle',
    desc: 'Long-range pierce, scoped.',
    rarity: 10, fireMode: 'standard',
    bulletColor: 0x88ffaa,
    recipe: T(440, { steelIngot: 1, cobaltIngot: 2 }),
    apply: (p) => { p.stats.fireRate *= 0.7; p.stats.damage *= 1.7; p.stats.bulletSpeed *= 1.6; p.stats.range += 240; p.stats.pierce += 4; }
  },
  {
    id: 'photon_pistol',
    name: 'Photon Pistol',
    desc: 'Light-fast, low damage.',
    rarity: 4, fireMode: 'standard',
    bulletColor: 0xffffff,
    recipe: T(160, { ironIngot: 2 }),
    apply: (p) => { p.stats.fireRate *= 1.6; p.stats.damage *= 0.7; p.stats.bulletSpeed *= 1.4; }
  },
  {
    id: 'pulse_spreader',
    name: 'Pulse Spreader',
    desc: '7 projectiles in a wide spread.',
    rarity: 8, fireMode: 'standard',
    bulletColor: 0xb0d0ff,
    recipe: T(360, { steelIngot: 2 }),
    apply: (p) => { p.stats.projectiles += 6; p.stats.fireRate *= 0.7; p.stats.damage *= 0.55; }
  },
  {
    id: 'aether_splitter',
    name: 'Aether Splitter',
    desc: 'Bullets split into 2 on hit.',
    rarity: 12, fireMode: 'standard',
    bulletColor: 0xc090ff,
    recipe: T(560, { cobaltIngot: 1, voidAlloy: 1 }),
    apply: (p) => { p.stats.splitOnHit = (p.stats.splitOnHit || 0) + 2; p.stats.damage *= 0.85; }
  },
  {
    id: 'star_drill',
    name: 'Star Drill',
    desc: 'Drilling rounds with high pierce.',
    rarity: 10, fireMode: 'standard',
    bulletColor: 0xffe066, bulletScale: 1.3,
    recipe: T(440, { cobaltIngot: 1, voidAlloy: 1 }),
    apply: (p) => { p.stats.pierce += 6; p.stats.bulletSpeed *= 0.85; p.stats.damage *= 1.1; p.stats.bulletLife *= 1.4; }
  },
  {
    id: 'boomerang',
    name: 'Boomerang Rifle',
    desc: 'Bullets ricochet to nearby targets.',
    rarity: 11, fireMode: 'standard',
    bulletColor: 0xffd34b,
    recipe: T(520, { cobaltIngot: 2 }),
    apply: (p) => { p.stats.ricochet = (p.stats.ricochet || 0) + 3; p.stats.damage *= 0.9; }
  },
  {
    id: 'mortar',
    name: 'Plasma Mortar',
    desc: 'Slow lobs. Big AOE.',
    rarity: 11, fireMode: 'standard',
    bulletColor: 0xff8b3a, bulletScale: 1.5,
    recipe: T(540, { cobaltIngot: 2, voidAlloy: 1 }),
    apply: (p) => { p.stats.fireRate *= 0.5; p.stats.damage *= 1.5; p.stats.explosionDmg = Math.max(p.stats.explosionDmg, 18); p.stats.explosionRadius = Math.max(p.stats.explosionRadius, 80); p.stats.bulletSpeed *= 0.7; }
  },
  {
    id: 'chronoblaster',
    name: 'Chronoblaster',
    desc: 'Hits slow enemies and pierce.',
    rarity: 11, fireMode: 'standard',
    bulletColor: 0x9bd0ff,
    recipe: T(540, { cobaltIngot: 2 }),
    apply: (p) => { p.stats.slowOnHit = (p.stats.slowOnHit || 0) + 1; p.stats.pierce += 2; }
  },
  {
    id: 'singularity_gun',
    name: 'Singularity Gun',
    desc: 'Bullets pull enemies briefly.',
    rarity: 14, fireMode: 'standard',
    bulletColor: 0xb070ff, bulletScale: 1.3,
    recipe: T(820, { voidAlloy: 2 }),
    apply: (p) => { p.stats.gravityPulse = (p.stats.gravityPulse || 0) + 1; p.stats.damage *= 1.2; }
  },
  {
    id: 'ion_storm',
    name: 'Ion Storm',
    desc: 'Chain to many targets every shot.',
    rarity: 14, fireMode: 'standard',
    bulletColor: 0xa8d8ff,
    recipe: T(820, { voidAlloy: 2, plasmaCell: 1 }),
    apply: (p) => { p.stats.chainChance = 1.0; p.stats.chainCount = Math.max(p.stats.chainCount, 4); p.stats.chainDmgMult = (p.stats.chainDmgMult || 1) * 1.2; }
  },
  {
    id: 'quantum_burst',
    name: 'Quantum Burst',
    desc: 'Erratic 4-round bursts.',
    rarity: 12, fireMode: 'burst',
    bulletColor: 0xff77ff, burstCount: 4, burstDelay: 0.05,
    recipe: T(620, { cobaltIngot: 2, voidAlloy: 1 }),
    apply: (p) => { p.stats.damage *= 1.0; p.stats.fireRate *= 0.7; p.stats.critChance += 0.10; }
  },

  // ===== Endgame =====
  {
    id: 'apex_rifle',
    name: 'Apex Rifle',
    desc: 'Versatile endgame. +pierce, +crit, +chain.',
    rarity: 16, fireMode: 'standard',
    bulletColor: 0xffe06f,
    recipe: T(1200, { voidAlloy: 2, plasmaCell: 2 }),
    apply: (p) => { p.stats.damage *= 1.6; p.stats.fireRate *= 1.3; p.stats.pierce += 3; p.stats.critChance += 0.10; p.stats.chainCount = Math.max(p.stats.chainCount, 1); p.stats.chainChance = Math.max(p.stats.chainChance, 0.4); }
  },
  {
    id: 'omega_cannon',
    name: 'Omega Cannon',
    desc: 'Huge explosive shots and burn.',
    rarity: 17, fireMode: 'standard',
    bulletColor: 0xffaa33, bulletScale: 1.8,
    recipe: T(1500, { voidAlloy: 3, plasmaCell: 2 }),
    apply: (p) => { p.stats.fireRate *= 0.55; p.stats.damage *= 2.5; p.stats.explosionDmg = Math.max(p.stats.explosionDmg, 24); p.stats.explosionRadius = Math.max(p.stats.explosionRadius, 90); p.stats.burnChance = Math.max(p.stats.burnChance, 0.6); p.stats.burnDmg = Math.max(p.stats.burnDmg, 6); }
  },
  {
    id: 'mythic_cannon',
    name: 'Mythic Cannon',
    desc: 'Endgame: enormous damage with all elements.',
    rarity: 19, fireMode: 'standard',
    bulletColor: 0xff4be0, bulletScale: 1.6,
    recipe: T(2400, { voidAlloy: 4, plasmaCell: 4 }),
    apply: (p) => { p.stats.damage *= 3.0; p.stats.fireRate *= 1.1; p.stats.pierce += 4; p.stats.chainChance = Math.max(p.stats.chainChance, 0.7); p.stats.chainCount = Math.max(p.stats.chainCount, 3); p.stats.burnChance = Math.max(p.stats.burnChance, 0.6); p.stats.burnDmg = Math.max(p.stats.burnDmg, 10); p.stats.explosionDmg = Math.max(p.stats.explosionDmg, 12); p.stats.explosionRadius = Math.max(p.stats.explosionRadius, 50); p.stats.critChance += 0.20; }
  }
];

export const WEAPONS_BY_ID = Object.fromEntries(WEAPONS.map(w => [w.id, w]));

export function findWeapon(id) { return WEAPONS_BY_ID[id]; }

export function describeRecipe(weapon) {
  const parts = [`${weapon.recipe.research} RD`];
  for (const [k, v] of Object.entries(weapon.recipe.ingots || {})) {
    parts.push(`${v}× ${k.replace('Ingot', ' ingot').replace('Cell',' cell').replace('Alloy',' alloy')}`);
  }
  return parts.join(' · ');
}

export function canCraftWeapon(weapon, save) {
  if (save.weapons?.[weapon.id]) return false; // already owned
  if (save.research < weapon.recipe.research) return false;
  for (const [k, v] of Object.entries(weapon.recipe.ingots || {})) {
    if ((save.materials?.[k] || 0) < v) return false;
  }
  return true;
}

export function craftWeapon(weapon, save) {
  save.research -= weapon.recipe.research;
  for (const [k, v] of Object.entries(weapon.recipe.ingots || {})) {
    save.materials[k] = (save.materials[k] || 0) - v;
  }
  save.weapons = save.weapons || {};
  save.weapons[weapon.id] = 1;
}
