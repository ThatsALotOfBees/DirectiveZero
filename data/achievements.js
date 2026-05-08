// Achievements check the persistent save state after each run.
// Granting an achievement awards Research Data once.

export const ACHIEVEMENTS = [
  { id: 'first_blood',     name: 'First Blood',         desc: 'Kill your first enemy.',           reward: 5,    check: (s) => s.stats.totalKills >= 1 },
  { id: 'centurion',       name: 'Centurion',           desc: 'Kill 100 enemies (lifetime).',     reward: 25,   check: (s) => s.stats.totalKills >= 100 },
  { id: 'massacre',        name: 'Massacre',            desc: 'Kill 1000 enemies (lifetime).',    reward: 100,  check: (s) => s.stats.totalKills >= 1000 },
  { id: 'extinction',      name: 'Extinction Event',    desc: 'Kill 10000 enemies (lifetime).',   reward: 500,  check: (s) => s.stats.totalKills >= 10000 },
  { id: 'survivor_60',     name: 'Survivor',            desc: 'Survive 60 seconds in one run.',   reward: 10,   check: (s) => s.stats.bestTime >= 60 },
  { id: 'survivor_180',    name: 'Long Watch',          desc: 'Survive 3 minutes in one run.',    reward: 30,   check: (s) => s.stats.bestTime >= 180 },
  { id: 'survivor_300',    name: 'Endurance',           desc: 'Survive 5 minutes in one run.',    reward: 75,   check: (s) => s.stats.bestTime >= 300 },
  { id: 'survivor_600',    name: 'Eternal Vigil',       desc: 'Survive 10 minutes in one run.',   reward: 250,  check: (s) => s.stats.bestTime >= 600 },
  { id: 'level_10',        name: 'Quick Study',         desc: 'Reach level 10 in a run.',         reward: 15,   check: (s) => s.stats.bestLevel >= 10 },
  { id: 'level_25',        name: 'Adept',               desc: 'Reach level 25 in a run.',         reward: 50,   check: (s) => s.stats.bestLevel >= 25 },
  { id: 'level_50',        name: 'Master',              desc: 'Reach level 50 in a run.',         reward: 200,  check: (s) => s.stats.bestLevel >= 50 },
  { id: 'rich',            name: 'Solvent',             desc: 'Hold 1000 Research Data.',         reward: 25,   check: (s) => s.research >= 1000 },
  { id: 'rich2',           name: 'Tycoon',              desc: 'Hold 10000 Research Data.',        reward: 100,  check: (s) => s.research >= 10000 },
  { id: 'first_ore',       name: 'Geologist',           desc: 'Pick up your first ore.',          reward: 5,    check: (s) => (s.stats.totalOres || 0) >= 1 },
  { id: 'pile_o_ore',      name: 'Pile of Ore',         desc: 'Pick up 100 ores total.',          reward: 30,   check: (s) => (s.stats.totalOres || 0) >= 100 },
  { id: 'first_smelt',     name: 'Smelter',             desc: 'Smelt your first ingot.',          reward: 10,   check: (s) => (s.stats.totalIngots || 0) >= 1 },
  { id: 'foundry',         name: 'Foundry Master',      desc: 'Smelt 50 ingots.',                 reward: 75,   check: (s) => (s.stats.totalIngots || 0) >= 50 },
  { id: 'first_weapon',    name: 'Armorer',             desc: 'Craft any weapon.',                reward: 25,   check: (s) => Object.keys(s.weapons || {}).length >= 2 },
  { id: 'arsenal',         name: 'Arsenal',             desc: 'Craft 10 weapons.',                reward: 100,  check: (s) => Object.keys(s.weapons || {}).length >= 10 },
  { id: 'collector',       name: 'Collector',           desc: 'Craft 25 weapons.',                reward: 300,  check: (s) => Object.keys(s.weapons || {}).length >= 25 },
  { id: 'first_upgrade',   name: 'Upgrader',            desc: 'Buy any permanent upgrade.',       reward: 10,   check: (s) => Object.keys(s.upgrades || {}).length >= 1 },
  { id: 'first_tier_5',    name: 'Apex Engineer',       desc: 'Reach tier 5 in any track.',       reward: 200,  check: (s) => Object.keys(s.upgrades || {}).some(k => k.endsWith('_t5')) },
  { id: 'all_tracks',      name: 'Generalist',          desc: 'Buy at least one upgrade in every track.', reward: 150, check: (s) => {
    const tracks = ['hp','damage','xp','pickup','reaction','precision','fireRate','speed','crit','pierce','projectile','drone'];
    return tracks.every(t => Object.keys(s.upgrades || {}).some(k => k.startsWith(t + '_t')));
  } },
  { id: 'codex_50',        name: 'Codex Initiate',      desc: 'See 50 different perks.',          reward: 50,   check: (s) => Object.keys(s.perksSeen || {}).length >= 50 },
  { id: 'codex_100',       name: 'Codex Scholar',       desc: 'See 100 different perks.',         reward: 150,  check: (s) => Object.keys(s.perksSeen || {}).length >= 100 },
  { id: 'codex_all',       name: 'Codex Complete',      desc: 'See every perk.',                  reward: 500,  check: (s) => Object.keys(s.perksSeen || {}).length >= 150 }
];

// Mutates save: grants any unlocked achievements. Returns array of newly granted ones.
export function grantAchievements(save) {
  save.achievements = save.achievements || {};
  const granted = [];
  for (const a of ACHIEVEMENTS) {
    if (save.achievements[a.id]) continue;
    if (a.check(save)) {
      save.achievements[a.id] = 1;
      save.research += a.reward;
      granted.push(a);
    }
  }
  return granted;
}
