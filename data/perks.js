// 150+ perks across 26 stat tracks (5 tiers each) + 30 hand-written
// uniques + 13 fusion perks. Each perk has a numeric rarity (1..20).

// 20 rarity tiers. weight controls draw probability in the picker;
// color tints the perk card and Codex entry.
export const RARITIES = [
  { tier: 1,  name: 'Standard',     color: '#cccccc', weight: 1000 },
  { tier: 2,  name: 'Refined',      color: '#dddddd', weight: 700 },
  { tier: 3,  name: 'Augmented',    color: '#9be08a', weight: 500 },
  { tier: 4,  name: 'Hardened',     color: '#7fdcb1', weight: 360 },
  { tier: 5,  name: 'Advanced',     color: '#6ed8d8', weight: 250 },
  { tier: 6,  name: 'Elite',        color: '#5fa8ff', weight: 180 },
  { tier: 7,  name: 'Prototype',    color: '#7c8df0', weight: 130 },
  { tier: 8,  name: 'Experimental', color: '#a76ee0', weight: 95 },
  { tier: 9,  name: 'Classified',   color: '#c065ff', weight: 70 },
  { tier: 10, name: 'Quantum',      color: '#ff7df0', weight: 50 },
  { tier: 11, name: 'Singular',     color: '#ff6f8a', weight: 35 },
  { tier: 12, name: 'Ascendant',    color: '#ff8b3a', weight: 25 },
  { tier: 13, name: 'Aetheric',     color: '#ffb347', weight: 17 },
  { tier: 14, name: 'Voidborn',     color: '#ffd34b', weight: 11 },
  { tier: 15, name: 'Apex',         color: '#ffe06f', weight: 7 },
  { tier: 16, name: 'Primordial',   color: '#f6f6c0', weight: 4.5 },
  { tier: 17, name: 'Cosmic',       color: '#dabfff', weight: 2.7 },
  { tier: 18, name: 'Eternal',      color: '#bff7ff', weight: 1.5 },
  { tier: 19, name: 'Omega',        color: '#ffffff', weight: 0.8 },
  { tier: 20, name: 'Mythical',     color: '#ff4be0', weight: 0.3 }
];

export function rarityOf(tier) { return RARITIES[Math.max(0, Math.min(19, tier - 1))]; }

const ROMAN = ['I', 'II', 'III', 'IV', 'V'];
// Default rarity tiers for each level of a 5-tier track.
const TIER_RARITY = [1, 4, 7, 11, 15];

function pct(n) { return (n * 100).toFixed(0) + '%'; }

function mulTrack(opts) {
  const { stat, names, vals, label, tags = [], rarities = TIER_RARITY } = opts;
  return names.map((name, i) => ({
    id: `${stat}_m${i + 1}`,
    name: `${name} ${ROMAN[i]}`,
    desc: `+${pct(vals[i])} ${label}`,
    rarity: rarities[i],
    tags: ['offense', ...tags],
    apply: (p) => { p.stats[stat] *= (1 + vals[i]); }
  }));
}

function addTrack(opts) {
  const { stat, names, vals, label, tags = [], formatter, rarities = TIER_RARITY } = opts;
  return names.map((name, i) => ({
    id: `${stat}_a${i + 1}`,
    name: `${name} ${ROMAN[i]}`,
    desc: formatter ? formatter(vals[i]) : `+${vals[i]} ${label}`,
    rarity: rarities[i],
    tags,
    apply: (p) => { p.stats[stat] = (p.stats[stat] || 0) + vals[i]; }
  }));
}

function hpTrack(opts) {
  const { names, vals, rarities = TIER_RARITY } = opts;
  return names.map((name, i) => ({
    id: `hp_a${i + 1}`,
    name: `${name} ${ROMAN[i]}`,
    desc: `+${vals[i]} max HP and heal to full`,
    rarity: rarities[i],
    tags: ['defense'],
    apply: (p) => { p.stats.maxHp += vals[i]; p.hp = p.stats.maxHp; }
  }));
}

const tracks = [];

// === Multiplicative stat tracks ===
tracks.push(...mulTrack({ stat: 'fireRate', label: 'fire rate', tags: ['fireRate'],
  names: ['OVERCLOCK','TURBO LOOP','RAPID PROTOCOL','BURST CASCADE','MANIC FIRE'],
  vals:  [0.10, 0.14, 0.20, 0.27, 0.36] }));
tracks.push(...mulTrack({ stat: 'damage', label: 'damage', tags: ['damage'],
  names: ['AMPLIFY','LETHAL CALIBRATION','HEAVY MUNITIONS','OVERLOAD','HYPERLETHAL'],
  vals:  [0.12, 0.18, 0.25, 0.34, 0.46] }));
tracks.push(...mulTrack({ stat: 'moveSpeed', label: 'movement speed', tags: ['mobility'],
  names: ['SERVO BOOST','KINETIC TUNE','AGILE FRAME','BLITZ PROTOCOL','PHANTOM STEP'],
  vals:  [0.10, 0.15, 0.20, 0.27, 0.36] }));
tracks.push(...mulTrack({ stat: 'pickupRadius', label: 'pickup radius', tags: ['utility'],
  names: ['MAGNET FIELD','WIDE SCAN','GRAVITIC LURE','TRACTOR ARRAY','EVENT HORIZON'],
  vals:  [0.20, 0.30, 0.40, 0.55, 0.75] }));
tracks.push(...mulTrack({ stat: 'bulletSpeed', label: 'projectile speed',
  names: ['FAST FIRE','HOT ROUNDS','RAILGUN SPIN','HYPERVELOCITY','LIGHTSHOT'],
  vals:  [0.15, 0.22, 0.30, 0.40, 0.55] }));
tracks.push(...mulTrack({ stat: 'bulletLife', label: 'projectile range',
  names: ['EXTENDED BARREL','LONG SIGHT','FAR REACH','TRACKER ROUNDS','INFINITE LANE'],
  vals:  [0.15, 0.22, 0.30, 0.40, 0.55] }));
tracks.push(...mulTrack({ stat: 'critMult', label: 'critical multiplier', tags: ['crit'],
  names: ['SHARP EDGE','WEAKPOINT','EXECUTE','DEEP CUT','LETHAL HARMONIC'],
  vals:  [0.15, 0.22, 0.30, 0.42, 0.60] }));
tracks.push(...mulTrack({ stat: 'reactionRate', label: 'AI reaction', tags: ['ai'],
  names: ['FOCUS','HEIGHTENED REFLEX','NEURAL SHARP','PRECOG','ZEN'],
  vals:  [0.10, 0.15, 0.20, 0.27, 0.36] }));

// === Additive stat tracks ===
tracks.push(...addTrack({ stat: 'pierce', label: 'pierce', tags: ['offense'],
  names: ['PHASE ROUNDS','GHOST SHELLS','SPECTRAL ROUND','ETHER PIERCE','NULL ROUND'],
  vals:  [1, 1, 2, 2, 3],
  formatter: (v) => `+${v} projectile pierce` }));
tracks.push(...addTrack({ stat: 'projectiles', label: 'projectile', tags: ['offense'],
  names: ['MULTISHOT','TWIN FIRE','TRIPLET BARREL','SCATTER ARRAY','STORM VOLLEY'],
  vals:  [1, 1, 1, 1, 2],
  formatter: (v) => `+${v} projectile per shot` }));
tracks.push(...addTrack({ stat: 'critChance', label: 'crit', tags: ['crit'],
  names: ['CRIT ANALYSIS','WEAK SCAN','TARGETING LOCK','SURGICAL EYE','PERFECT SHOT'],
  vals:  [0.08, 0.10, 0.12, 0.15, 0.20],
  formatter: (v) => `+${pct(v)} critical hit chance` }));
tracks.push(...addTrack({ stat: 'burnChance', label: 'burn chance', tags: ['element','burn'],
  names: ['INCENDIARY','PYRE TIPPED','IGNITER','INFERNAL','SOLAR FLARE'],
  vals:  [0.30, 0.20, 0.20, 0.20, 0.20],
  formatter: (v) => `+${pct(v)} ignite chance` }));
tracks.push(...addTrack({ stat: 'burnDmg', label: 'burn damage', tags: ['element','burn'],
  names: ['FUEL MIX','NAPALM','WHITE PHOSPHOR','PLASMA WICK','STAR ASH'],
  vals:  [2, 3, 4, 6, 9],
  formatter: (v) => `+${v} burn damage per tick` }));
tracks.push(...addTrack({ stat: 'chainChance', label: 'chain', tags: ['element','chain'],
  names: ['STATIC EDGE','TESLA SPARK','ARC PRIMER','CHAIN HEX','STORMCALL'],
  vals:  [0.20, 0.15, 0.15, 0.15, 0.20],
  formatter: (v) => `+${pct(v)} chain lightning chance` }));
tracks.push(...addTrack({ stat: 'chainCount', label: 'chain', tags: ['element','chain'],
  names: ['ARC EXPAND','CONDUIT','TESLA NET','STORM WEB','LIGHTNING DOMINION'],
  vals:  [1, 1, 1, 1, 2],
  formatter: (v) => `+${v} chain target` }));
tracks.push(...addTrack({ stat: 'explosionDmg', label: 'explosion', tags: ['element','explosive'],
  names: ['EXPLOSIVE ROUNDS','FRAG TIPS','CONCUSSIVE','DEMOLITION','OBLITERATE'],
  vals:  [6, 4, 5, 7, 10],
  formatter: (v) => `+${v} explosive damage` }));
tracks.push(...addTrack({ stat: 'explosionRadius', label: 'explosion', tags: ['element','explosive'],
  names: ['WIDE PRIMER','BIG BLOOM','SHOCKWAVE','KILL ZONE','CRATER MAKER'],
  vals:  [22, 14, 14, 16, 20],
  formatter: (v) => `+${v}px explosion radius` }));
tracks.push(...hpTrack({
  names: ['REINFORCE','PLATE WEAVE','TITAN HEART','BULWARK','ETERNAL FRAME'],
  vals:  [20, 30, 45, 65, 95] }));
tracks.push(...addTrack({ stat: 'regen', label: 'regen', tags: ['defense'],
  names: ['REPAIR LOOP','NANO MEND','SELF-WEAVE','RECONSTRUCT','PHOENIX CYCLE'],
  vals:  [0.6, 0.9, 1.4, 2.1, 3.2],
  formatter: (v) => `+${v.toFixed(1)} HP/sec regeneration` }));
tracks.push(...addTrack({ stat: 'armor', label: 'armor', tags: ['defense'],
  names: ['ARMOR PLATE','BLAST PADDING','KINETIC SHELL','AEGIS WEAVE','BULWARK CORE'],
  vals:  [0.06, 0.06, 0.06, 0.06, 0.06],
  formatter: (v) => `+${pct(v)} damage reduction` }));
tracks.push(...addTrack({ stat: 'lifesteal', label: 'lifesteal', tags: ['defense'],
  names: ['LEECH CIRCUIT','BLOOD DRAW','PARASITE CODE','CRIMSON LOOP','HEMOLOCK'],
  vals:  [0.02, 0.03, 0.04, 0.05, 0.07],
  formatter: (v) => `+${pct(v)} lifesteal on hit` }));
tracks.push(...addTrack({ stat: 'dodge', label: 'dodge', tags: ['defense'],
  names: ['STEP','SHADOW STEP','BLINK STEP','PHASE STEP','GHOST WALK'],
  vals:  [0.05, 0.05, 0.05, 0.05, 0.05],
  formatter: (v) => `+${pct(v)} dodge chance` }));
tracks.push(...addTrack({ stat: 'thorns', label: 'thorns', tags: ['defense'],
  names: ['SPIKE PLATE','BARB CIRCUIT','RETALIATION','SHRAPNEL HALO','WAR REFLEX'],
  vals:  [3, 4, 6, 9, 14],
  formatter: (v) => `Reflect ${v} damage on contact` }));
tracks.push(...addTrack({ stat: 'xpGain', label: 'xp gain', tags: ['utility'],
  names: ['UPLINK BOOST','SHARD SCAN','NEURAL FEED','OVERFLOW MIND','COSMIC ARCHIVE'],
  vals:  [0.10, 0.15, 0.20, 0.28, 0.40],
  formatter: (v) => `+${pct(v)} XP gain` }));
tracks.push(...addTrack({ stat: 'luck', label: 'luck', tags: ['utility'],
  names: ['LUCK MOD','DROP HACK','FATE TWIST','GOLD HEART','COSMIC FAVOR'],
  vals:  [0.20, 0.30, 0.45, 0.65, 1.00],
  formatter: (v) => `+${pct(v)} ore drop chance` }));
tracks.push(...addTrack({ stat: 'range', label: 'range', tags: ['offense'],
  names: ['LONG LANE','OPEN SIGHT','OPTIC EXPAND','SCOPE CORE','OMNIVISION'],
  vals:  [40, 50, 60, 75, 95],
  formatter: (v) => `+${v}px firing range` }));

// === Hand-written unique perks ===
const unique = [
  // Drones
  { id: 'orbit_drone',   name: 'ORBIT DRONE',     desc: 'Spawn an orbiting attack drone.',         rarity: 8,  tags: ['drone'],    apply: (p) => p.addDrone() },
  { id: 'twin_drones',   name: 'TWIN DRONES',     desc: 'Spawn 2 orbiting drones.',                 rarity: 12, tags: ['drone'],    apply: (p) => { p.addDrone(); p.addDrone(); } },
  { id: 'drone_speed',   name: 'GYROSPIN',        desc: '+50% drone orbit speed.',                  rarity: 5,  tags: ['drone'],    apply: (p) => p.drones.forEach(d => d.orbitSpeed *= 1.5) },
  { id: 'drone_radius',  name: 'WIDE ORBIT',      desc: '+25% drone orbit radius.',                 rarity: 5,  tags: ['drone'],    apply: (p) => p.drones.forEach(d => d.orbitRadius *= 1.25) },
  { id: 'drone_dmg',     name: 'DRONE OVERLOAD',  desc: 'Drones deal +60% damage.',                 rarity: 9,  tags: ['drone'],    apply: (p) => { p.stats.droneDmgMult = (p.stats.droneDmgMult || 1) * 1.6; } },
  // Crit synergies
  { id: 'crit_storm',    name: 'CRIT STORM',      desc: 'Crits cause a small explosion.',           rarity: 12, tags: ['crit','element'], apply: (p) => { p.stats.critExplodeDmg = (p.stats.critExplodeDmg || 0) + 8; p.stats.critExplodeRadius = Math.max(p.stats.critExplodeRadius || 0, 40); } },
  { id: 'crit_haste',    name: 'CRIT HASTE',      desc: 'Crits give 0.6s of +50% fire rate.',       rarity: 10, tags: ['crit','fireRate'], apply: (p) => { p.stats.critHasteOn = true; } },
  // Burn synergies
  { id: 'burn_spread',   name: 'PYRE BLOOM',      desc: 'Burn spreads to nearby enemies on tick.',  rarity: 13, tags: ['burn'],     apply: (p) => { p.stats.burnSpread = (p.stats.burnSpread || 0) + 1; } },
  { id: 'burn_double',   name: 'INFERNAL TICK',   desc: 'Burn ticks twice as fast.',                rarity: 9,  tags: ['burn'],     apply: (p) => { p.stats.burnTickRate = (p.stats.burnTickRate || 1) * 2; } },
  // Chain synergies
  { id: 'chain_loop',    name: 'STATIC LOOP',     desc: 'Chain lightning may loop back.',           rarity: 12, tags: ['chain'],    apply: (p) => { p.stats.chainLoop = (p.stats.chainLoop || 0) + 0.25; } },
  { id: 'chain_full',    name: 'OVERVOLT',        desc: 'Chain damage no longer falls off.',        rarity: 11, tags: ['chain'],    apply: (p) => { p.stats.chainNoFalloff = true; } },
  // Explosive synergies
  { id: 'expl_clusters', name: 'CLUSTER MUNITION',desc: 'Explosions spawn 3 secondary blasts.',     rarity: 13, tags: ['explosive'], apply: (p) => { p.stats.clusterCount = (p.stats.clusterCount || 0) + 3; } },
  { id: 'expl_chain',    name: 'CHAIN REACTION',  desc: 'Explosions can trigger other explosions.', rarity: 10, tags: ['explosive'], apply: (p) => { p.stats.explosionChain = true; } },
  // Berserker / low-hp
  { id: 'berserker',     name: 'BERSERKER PROTOCOL', desc: 'Below 30% HP: +50% damage and fire rate.', rarity: 9, tags: ['offense','defense'], apply: (p) => { p.stats.berserker = true; } },
  { id: 'last_stand',    name: 'LAST STAND',      desc: 'Survive one lethal hit at 1 HP per run.',  rarity: 13, tags: ['defense'],  apply: (p) => { p.stats.lastStandCharges = (p.stats.lastStandCharges || 0) + 1; } },
  { id: 'second_wind',   name: 'SECOND WIND',     desc: 'On level up, restore 25% HP.',             rarity: 8,  tags: ['defense','utility'], apply: (p) => { p.stats.secondWind = (p.stats.secondWind || 0) + 0.25; } },
  // Movement / utility
  { id: 'evade_field',   name: 'EVADE FIELD',     desc: 'Longer invulnerability after being hit.',  rarity: 4,  tags: ['defense'],  apply: (p) => { p.stats.evadeBonus = (p.stats.evadeBonus || 0) + 0.4; } },
  { id: 'panic_burst',   name: 'PANIC BURST',     desc: 'When hit, fire a 12-bullet ring.',         rarity: 13, tags: ['offense'],  apply: (p) => { p.stats.panicBurst = (p.stats.panicBurst || 0) + 1; } },
  { id: 'execute',       name: 'EXECUTE',         desc: 'Instakill enemies below 8% HP.',           rarity: 9,  tags: ['offense'],  apply: (p) => { p.stats.executeThreshold = Math.max(p.stats.executeThreshold || 0, 0.08); } },
  { id: 'execute_plus',  name: 'TERMINATE',       desc: 'Execute threshold raised to 15%.',         rarity: 14, tags: ['offense'],  apply: (p) => { p.stats.executeThreshold = Math.max(p.stats.executeThreshold || 0, 0.15); } },
  // Element trifecta
  { id: 'all_element',   name: 'ELEMENTAL FUSION', desc: 'Burn, chain, explode chances +15%.',      rarity: 13, tags: ['element'],  apply: (p) => { p.stats.burnChance += 0.15; p.stats.chainChance += 0.15; } },
  // AI biases
  { id: 'kite_proto',    name: 'KITE PROTOCOL',   desc: 'AI maintains better spacing.',             rarity: 5,  tags: ['ai'],       apply: (p) => { p.stats.kiteBias = (p.stats.kiteBias || 0) + 0.6; } },
  { id: 'flee_bias',     name: 'PRESERVATION CODE',desc: 'AI flees more at low HP.',                rarity: 5,  tags: ['ai'],       apply: (p) => { p.stats.fleeBias = (p.stats.fleeBias || 0) + 0.6; } },
  { id: 'hunter_bias',   name: 'HUNTER CODE',     desc: 'AI prioritizes XP shards more.',           rarity: 5,  tags: ['ai'],       apply: (p) => { p.stats.collectBias = (p.stats.collectBias || 0) + 0.6; } },
  // Pickup / XP
  { id: 'overflow',      name: 'OVERFLOW ARCHIVE',desc: 'Excess XP carries to the next level.',     rarity: 9,  tags: ['utility'],  apply: (p) => { p.stats.xpOverflow = true; } },
  { id: 'magnet_pulse',  name: 'MAGNET PULSE',    desc: 'Periodically pulls all XP shards.',        rarity: 9,  tags: ['utility'],  apply: (p) => { p.stats.magnetPulse = (p.stats.magnetPulse || 0) + 1; } },
  { id: 'gold_finger',   name: 'GOLD FINGER',     desc: 'XP shards have +1 value.',                 rarity: 5,  tags: ['utility'],  apply: (p) => { p.stats.xpBonusFlat = (p.stats.xpBonusFlat || 0) + 1; } },
  // Exotic weapons
  { id: 'ricochet',      name: 'RICOCHET',        desc: 'Bullets bounce 1× off enemies.',           rarity: 10, tags: ['offense'],  apply: (p) => { p.stats.ricochet = (p.stats.ricochet || 0) + 1; } },
  { id: 'homing',        name: 'HOMING ROUNDS',   desc: 'Bullets curve toward enemies.',            rarity: 13, tags: ['offense'],  apply: (p) => { p.stats.homingStrength = (p.stats.homingStrength || 0) + 4; } },
  { id: 'split_shot',    name: 'SPLIT SHOT',      desc: 'Bullets split into 2 on impact.',          rarity: 13, tags: ['offense'],  apply: (p) => { p.stats.splitOnHit = (p.stats.splitOnHit || 0) + 2; } },
  { id: 'piercing_will', name: 'PIERCING WILL',   desc: '+2 pierce, but bullets fly slower.',       rarity: 9,  tags: ['offense'],  apply: (p) => { p.stats.pierce += 2; p.stats.bulletSpeed *= 0.85; } },
  // Defense / heal
  { id: 'shield_overcharge', name: 'SHIELD OVERCHARGE', desc: '+30 max HP and 1s of invulnerability.', rarity: 9, tags: ['defense'], apply: (p) => { p.stats.maxHp += 30; p.hp = Math.min(p.stats.maxHp, p.hp + 30); p.invulnTimer = Math.max(p.invulnTimer, 1.0); } },
  { id: 'final_breath',  name: 'FINAL BREATH',    desc: 'Heal 8 HP on each kill.',                  rarity: 12, tags: ['defense'],  apply: (p) => { p.stats.healOnKill = (p.stats.healOnKill || 0) + 8; } },
  // Bonus / oddball
  { id: 'glass_cannon',  name: 'GLASS CANNON',    desc: '+80% damage, -25% max HP.',                rarity: 12, tags: ['offense','defense'], apply: (p) => { p.stats.damage *= 1.8; p.stats.maxHp = Math.max(10, Math.floor(p.stats.maxHp * 0.75)); p.hp = Math.min(p.hp, p.stats.maxHp); } },
  { id: 'iron_will',     name: 'IRON WILL',       desc: '+40 max HP, -10% movement speed.',         rarity: 5,  tags: ['defense'],  apply: (p) => { p.stats.maxHp += 40; p.hp += 40; p.stats.moveSpeed *= 0.9; } },
  { id: 'pacifier',      name: 'PACIFIER',        desc: 'Hits briefly slow enemies.',               rarity: 9,  tags: ['utility'],  apply: (p) => { p.stats.slowOnHit = (p.stats.slowOnHit || 0) + 1; } },
  { id: 'cold_round',    name: 'CRYO ROUND',      desc: 'Hits briefly chill enemies.',              rarity: 9,  tags: ['element'],  apply: (p) => { p.stats.chillOnHit = (p.stats.chillOnHit || 0) + 1; } },
  // Time / luck
  { id: 'fortune',       name: 'FORTUNE PROTOCOL',desc: '+50% Research Data this run.',             rarity: 11, tags: ['utility'],  apply: (p) => { p.stats.researchMult = (p.stats.researchMult || 1) * 1.5; } },
  { id: 'deep_pockets',  name: 'DEEP POCKETS',    desc: 'Ore drops give +1 quantity.',              rarity: 11, tags: ['utility'],  apply: (p) => { p.stats.dropQty = (p.stats.dropQty || 1) + 1; } },
  // Legendary / mythical
  { id: 'singularity',   name: 'SINGULARITY',     desc: 'Periodic gravity well pulls all enemies.', rarity: 17, tags: ['utility'],  apply: (p) => { p.stats.gravityPulse = (p.stats.gravityPulse || 0) + 1; } },
  { id: 'overdrive',     name: 'OVERDRIVE',       desc: '+30% fire rate, +20% damage, +15% speed.',  rarity: 16, tags: ['offense','mobility'], apply: (p) => { p.stats.fireRate *= 1.3; p.stats.damage *= 1.2; p.stats.moveSpeed *= 1.15; } },
  { id: 'apex',          name: 'APEX PREDATOR',   desc: '+20% to ALL primary stats.',                rarity: 18, tags: ['offense','defense'],  apply: (p) => { p.stats.fireRate *= 1.2; p.stats.damage *= 1.2; p.stats.moveSpeed *= 1.2; p.stats.maxHp = Math.floor(p.stats.maxHp * 1.2); p.hp = p.stats.maxHp; } },
  { id: 'directive_zero',name: 'DIRECTIVE ZERO',  desc: '+1 projectile, +1 pierce, +1 chain target.',rarity: 19, tags: ['offense'],  apply: (p) => { p.stats.projectiles += 1; p.stats.pierce += 1; p.stats.chainCount = (p.stats.chainCount || 0) + 1; } },
  { id: 'omni_drone',    name: 'OMNI-DRONE ARRAY',desc: 'Spawn 3 drones at once.',                  rarity: 17, tags: ['drone'],    apply: (p) => { p.addDrone(); p.addDrone(); p.addDrone(); } },
  { id: 'mythic_bond',   name: 'MYTHIC BOND',     desc: 'Doubles all current perk effects (run only).', rarity: 20, tags: ['offense','defense'], apply: (p) => { p.stats.damage *= 2; p.stats.fireRate *= 1.4; p.stats.maxHp *= 2; p.hp = p.stats.maxHp; p.stats.moveSpeed *= 1.3; } }
];

tracks.push(...unique);

export const PERKS = tracks;

// ===== FUSIONS =====
// Surface only when their tag prerequisites are owned by the player.
export const FUSIONS = [
  { id: 'fuse_elecfire',    name: 'ELECTRIC FIRE',  desc: 'Burn ticks now also arc to nearby enemies.', requires: ['burn','chain'],     rarity: 12, apply: (p) => { p.stats.electricFire = true; } },
  { id: 'fuse_firebomb',    name: 'FIREBOMB',       desc: 'Explosions ignite all enemies hit.',         requires: ['burn','explosive'], rarity: 12, apply: (p) => { p.stats.firebomb = true; } },
  { id: 'fuse_stormbomb',   name: 'STORM BOMB',     desc: 'Chain links trigger mini explosions.',       requires: ['chain','explosive'],rarity: 13, apply: (p) => { p.stats.stormBomb = true; } },
  { id: 'fuse_drone_strike',name: 'DRONE STRIKE',   desc: 'Drones inherit your crit chance.',           requires: ['drone','crit'],     rarity: 12, apply: (p) => { p.stats.droneCrit = true; } },
  { id: 'fuse_eternal',     name: 'ETERNAL',        desc: 'Lifesteal also slowly heals over time.',     requires: ['defense'],          rarity: 14, apply: (p) => { p.stats.eternal = true; } },
  { id: 'fuse_lord_sparks', name: 'LORD OF SPARKS', desc: '+1 chain target and +50% chain damage.',     requires: ['chain'],            rarity: 11, apply: (p) => { p.stats.chainCount = (p.stats.chainCount || 0) + 1; p.stats.chainDmgMult = (p.stats.chainDmgMult || 1) * 1.5; } },
  { id: 'fuse_pyromancer',  name: 'PYROMANCER',     desc: '+50% burn damage and tick rate.',            requires: ['burn'],             rarity: 11, apply: (p) => { p.stats.burnDmg = Math.floor((p.stats.burnDmg || 0) * 1.5); p.stats.burnTickRate = (p.stats.burnTickRate || 1) * 1.5; } },
  { id: 'fuse_artillery',   name: 'ARTILLERY',      desc: '+50% explosion radius and damage.',          requires: ['explosive'],        rarity: 11, apply: (p) => { p.stats.explosionRadius = Math.floor((p.stats.explosionRadius || 0) * 1.5); p.stats.explosionDmg = Math.floor((p.stats.explosionDmg || 0) * 1.5); } },
  { id: 'fuse_swarmlord',   name: 'SWARM LORD',     desc: '+1 drone, +20% drone speed and damage.',     requires: ['drone'],            rarity: 12, apply: (p) => { p.addDrone(); p.drones.forEach(d => { d.orbitSpeed *= 1.2; }); p.stats.droneDmgMult = (p.stats.droneDmgMult || 1) * 1.2; } },
  { id: 'fuse_marksman',    name: 'MARKSMAN',       desc: '+15% crit chance, +30% crit multiplier.',    requires: ['crit'],             rarity: 11, apply: (p) => { p.stats.critChance += 0.15; p.stats.critMult *= 1.30; } },
  { id: 'fuse_cataclysm',   name: 'CATACLYSM',      desc: 'All elemental triggers chance +20%.',        requires: ['element'],          rarity: 14, apply: (p) => { p.stats.burnChance = Math.min(1, p.stats.burnChance + 0.2); p.stats.chainChance = Math.min(1, p.stats.chainChance + 0.2); } },
  { id: 'fuse_god_mode',    name: 'GOD CIRCUIT',    desc: '+30 HP, +10% damage, +5% lifesteal.',        requires: ['offense','defense'],rarity: 16, apply: (p) => { p.stats.maxHp += 30; p.hp = Math.min(p.stats.maxHp, p.hp + 30); p.stats.damage *= 1.10; p.stats.lifesteal = (p.stats.lifesteal || 0) + 0.05; } },
  { id: 'fuse_singular',    name: 'SINGULAR FORCE', desc: 'Doubles damage of one random element.',      requires: ['element'],          rarity: 13, apply: (p) => { const choices = ['burnDmg','chainDmgMult','explosionDmg']; const k = choices[Math.floor(Math.random()*choices.length)]; if (k === 'chainDmgMult') p.stats.chainDmgMult = (p.stats.chainDmgMult || 1) * 2; else p.stats[k] = (p.stats[k] || 0) * 2; } }
];

// === Picker ===
export function rarityWeight(tier) { return RARITIES[Math.max(0, Math.min(19, tier - 1))].weight; }

export function pickRandomPerks(count, exclude = new Set()) {
  const pool = PERKS.filter(p => !exclude.has(p.id));
  const chosen = [];
  for (let n = 0; n < count && pool.length > 0; n++) {
    const total = pool.reduce((s, p) => s + rarityWeight(p.rarity), 0);
    let r = Math.random() * total;
    let idx = 0;
    for (let i = 0; i < pool.length; i++) {
      r -= rarityWeight(pool[i].rarity);
      if (r <= 0) { idx = i; break; }
    }
    chosen.push(pool.splice(idx, 1)[0]);
  }
  return chosen;
}

export function getOwnedTags(ownedPerks) {
  const tags = new Set();
  ownedPerks.forEach(id => {
    const perk = PERKS.find(p => p.id === id);
    if (perk && perk.tags) perk.tags.forEach(t => tags.add(t));
  });
  return tags;
}

export function getAvailableFusions(ownedPerks) {
  const tags = getOwnedTags(ownedPerks);
  return FUSIONS.filter(f => {
    if (ownedPerks.has(f.id)) return false;
    return f.requires.every(r => tags.has(r));
  });
}

export function findPerk(id) {
  return PERKS.find(p => p.id === id) || FUSIONS.find(f => f.id === id);
}
