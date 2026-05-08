export const META_UPGRADES = [
  {
    id: 'startHp',
    name: 'CHASSIS PLATING',
    desc: '+10 starting HP per level',
    baseCost: 50,
    costGrowth: 1.55,
    maxLevel: 10,
    value: (lvl) => lvl * 10
  },
  {
    id: 'xpGain',
    name: 'NEURAL UPLINK',
    desc: '+5% XP gain per level',
    baseCost: 60,
    costGrowth: 1.55,
    maxLevel: 10,
    value: (lvl) => lvl * 0.05
  },
  {
    id: 'reaction',
    name: 'REACTION CORE',
    desc: 'Sharper AI reaction',
    baseCost: 80,
    costGrowth: 1.6,
    maxLevel: 5,
    value: (lvl) => lvl * 0.06
  },
  {
    id: 'damage',
    name: 'POWER MATRIX',
    desc: '+5% base damage per level',
    baseCost: 70,
    costGrowth: 1.55,
    maxLevel: 10,
    value: (lvl) => lvl * 0.05
  },
  {
    id: 'pickup',
    name: 'COLLECTION ARRAY',
    desc: '+10% pickup radius per level',
    baseCost: 50,
    costGrowth: 1.5,
    maxLevel: 8,
    value: (lvl) => lvl * 0.10
  },
  {
    id: 'precision',
    name: 'GYRO PRECISION',
    desc: 'Smoother movement control',
    baseCost: 90,
    costGrowth: 1.6,
    maxLevel: 5,
    value: (lvl) => lvl * 0.05
  }
];

export function upgradeCost(upg, currentLevel) {
  return Math.floor(upg.baseCost * Math.pow(upg.costGrowth, currentLevel));
}
