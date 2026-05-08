const KEY = 'directive-zero-save-v2';
const LEGACY_KEY = 'directive-zero-save-v1';

const DEFAULTS = () => ({
  research: 0,
  upgrades: {},
  weapons: { pulse_carbine: 1 },
  equippedWeapon: 'pulse_carbine',
  materials: {
    crudeOre: 0, ironOre: 0, cobaltOre: 0, voidShard: 0, plasmaCore: 0,
    ironIngot: 0, steelIngot: 0, cobaltIngot: 0, voidAlloy: 0, plasmaCell: 0
  },
  perksSeen: {},
  achievements: {},
  settings: {
    volume: 0.4,
    musicVolume: 0.25,
    music: true,
    shake: 1.0,
    damageNumbers: true
  },
  stats: {
    runs: 0,
    totalKills: 0,
    bestTime: 0,
    bestKills: 0,
    bestLevel: 0,
    totalOres: 0,
    totalIngots: 0
  }
});

function migrate(raw) {
  // v1 → v2: rename legacy upgrade ids to new tier ids if recognized.
  const def = DEFAULTS();
  return {
    research: typeof raw.research === 'number' ? raw.research : 0,
    upgrades: {},
    materials: { ...def.materials, ...(raw.materials || {}) },
    perksSeen: { ...(raw.perksSeen || {}) },
    stats: { ...def.stats, ...(raw.stats || {}) }
  };
}

export const SaveSystem = {
  load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const data = JSON.parse(raw);
        const def = DEFAULTS();
        return {
          research: data.research || 0,
          upgrades: data.upgrades || {},
          weapons: { ...def.weapons, ...(data.weapons || {}) },
          equippedWeapon: data.equippedWeapon || def.equippedWeapon,
          materials: { ...def.materials, ...(data.materials || {}) },
          perksSeen: data.perksSeen || {},
          achievements: data.achievements || {},
          settings: { ...def.settings, ...(data.settings || {}) },
          stats: { ...def.stats, ...(data.stats || {}) }
        };
      }
      const legacy = localStorage.getItem(LEGACY_KEY);
      if (legacy) {
        const m = migrate(JSON.parse(legacy));
        localStorage.setItem(KEY, JSON.stringify(m));
        return m;
      }
      return DEFAULTS();
    } catch (e) {
      return DEFAULTS();
    }
  },
  save(data) {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {}
  },
  reset() {
    try {
      localStorage.removeItem(KEY);
      localStorage.removeItem(LEGACY_KEY);
    } catch (e) {}
  }
};
