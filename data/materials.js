// Ores drop randomly from enemies. Ingots are crafted from ores at the Smelter
// and used (alongside Research Data) to purchase permanent Upgrades.

export const RARITIES = {
  common:    { color: '#cccccc', label: 'Common'    },
  uncommon:  { color: '#88ff88', label: 'Uncommon'  },
  rare:      { color: '#5fa8ff', label: 'Rare'      },
  epic:      { color: '#c065ff', label: 'Epic'      },
  legendary: { color: '#ffaa33', label: 'Legendary' }
};

export const ORES = [
  { id: 'crudeOre',    name: 'Crude Ore',     rarity: 'common',    color: 0x8e8a85, desc: 'Base alloy fragment from corrupted shells.' },
  { id: 'ironOre',     name: 'Iron Ore',      rarity: 'uncommon',  color: 0xb89272, desc: 'Refined iron, recoverable from heavier units.' },
  { id: 'cobaltOre',   name: 'Cobalt Ore',    rarity: 'rare',      color: 0x4f7fbf, desc: 'Crystalline cobalt — found in dense swarms.' },
  { id: 'voidShard',   name: 'Void Shard',    rarity: 'epic',      color: 0x9050d0, desc: 'Unstable shard. Hums with hostile data.' },
  { id: 'plasmaCore',  name: 'Plasma Core',   rarity: 'legendary', color: 0xff66dd, desc: 'Pure plasma, exceedingly rare.' }
];

export const INGOTS = [
  { id: 'ironIngot',     name: 'Iron Ingot',     rarity: 'common',    color: 0xc0a888, desc: 'Workable plate stock.' },
  { id: 'steelIngot',    name: 'Steel Ingot',    rarity: 'uncommon',  color: 0x6f7888, desc: 'Hardened structural alloy.' },
  { id: 'cobaltIngot',   name: 'Cobalt Ingot',   rarity: 'rare',      color: 0x6090e0, desc: 'Energy-conductive ingot.' },
  { id: 'voidAlloy',     name: 'Void Alloy',     rarity: 'epic',      color: 0xb070ff, desc: 'Stabilised void shard, woven into alloy.' },
  { id: 'plasmaCell',    name: 'Plasma Cell',    rarity: 'legendary', color: 0xff88ff, desc: 'Refined plasma battery for elite gear.' }
];

// Recipes: produce 1 ingot from listed ore inputs
export const RECIPES = [
  { id: 'ironIngot',   produces: 'ironIngot',   inputs: { crudeOre: 4 } },
  { id: 'steelIngot',  produces: 'steelIngot',  inputs: { crudeOre: 2, ironOre: 3 } },
  { id: 'cobaltIngot', produces: 'cobaltIngot', inputs: { ironOre: 2, cobaltOre: 3 } },
  { id: 'voidAlloy',   produces: 'voidAlloy',   inputs: { cobaltOre: 2, voidShard: 2 } },
  { id: 'plasmaCell',  produces: 'plasmaCell',  inputs: { voidShard: 1, plasmaCore: 1 } }
];

// Per-kill drop chance & weighted ore selection.
// Total drop chance scales with the player's run progress separately.
export const DROP_TABLE = {
  baseChance: 0.06,    // ~6% chance per kill at base luck=1
  weights: [
    { ore: 'crudeOre',   weight: 70 },
    { ore: 'ironOre',    weight: 22 },
    { ore: 'cobaltOre',  weight: 6 },
    { ore: 'voidShard',  weight: 1.6 },
    { ore: 'plasmaCore', weight: 0.4 }
  ]
};

export function rollOreDrop(luckMult = 1, timeBonus = 0) {
  const roll = Math.random();
  const chance = DROP_TABLE.baseChance * luckMult + timeBonus;
  if (roll > chance) return null;
  const total = DROP_TABLE.weights.reduce((s, w) => s + w.weight, 0);
  let pick = Math.random() * total;
  for (const w of DROP_TABLE.weights) {
    if (pick < w.weight) return w.ore;
    pick -= w.weight;
  }
  return DROP_TABLE.weights[0].ore;
}

export function findOre(id)   { return ORES.find(o => o.id === id); }
export function findIngot(id) { return INGOTS.find(i => i.id === id); }
export function findRecipe(id){ return RECIPES.find(r => r.id === id); }
export function findMaterial(id) { return findOre(id) || findIngot(id); }
