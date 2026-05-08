import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  create() {
    this.makeTextures();
    this.scene.start('MenuScene');
  }

  makeTextures() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    // ===== Player =====
    g.clear();
    g.fillStyle(0x6e1fad, 1);  g.fillRect(2, 9, 8, 1);
    g.fillStyle(0xb347ff, 1);  g.fillRect(2, 2, 8, 7);
    g.fillStyle(0xe0b0ff, 1);  g.fillRect(4, 0, 4, 2); g.fillRect(3, 3, 1, 1); g.fillRect(8, 3, 1, 1);
    g.fillStyle(0xffffff, 1);  g.fillRect(5, 4, 2, 1);
    g.generateTexture('player', 12, 12);

    // ===== Enemy variants =====
    this.makeEnemyTexture(g, 'enemy',          0x3a3a44, 0x4a4a55, 0xff3030);                      // basic
    this.makeEnemyTexture(g, 'enemy_runner',   0x6a3a44, 0x9a4a55, 0xff5050, { wide: false });
    this.makeEnemyTexture(g, 'enemy_brute',    0x2a3a55, 0x445a8a, 0x88ccff, { wide: true });      // wider
    this.makeEnemyTexture(g, 'enemy_spitter',  0x3a5a3a, 0x4a8a4a, 0xaaff80);
    this.makeEnemyTexture(g, 'enemy_splitter', 0x6a5a2a, 0xaa9040, 0xfff080);
    this.makeEnemyTexture(g, 'enemy_elite',    0x9020aa, 0xc060ff, 0xffe066, { aura: true });

    // Boss textures (larger, hand-tweaked).
    this.makeBossTexture(g, 'boss_crusher',    0x6a6a78, 0x9090a0, 0xff5050, 16);
    this.makeBossTexture(g, 'boss_overseer',   0x9020aa, 0xd060ff, 0x88aaff, 14);
    this.makeBossTexture(g, 'boss_leviathan',  0x2a4a8a, 0x6090ee, 0x88ffff, 18);
    this.makeBossTexture(g, 'boss_omega',      0x6a3000, 0xff8b3a, 0xffff00, 18);

    // ===== Bullets =====
    g.clear(); g.fillStyle(0xe0b0ff, 1); g.fillRect(0, 1, 4, 2); g.fillStyle(0xffffff, 1); g.fillRect(1, 1, 2, 2);
    g.generateTexture('bullet', 4, 4);

    g.clear(); g.fillStyle(0x88ff88, 1); g.fillRect(0, 1, 4, 2); g.fillStyle(0xddffaa, 1); g.fillRect(1, 1, 2, 2);
    g.generateTexture('enemy_bullet', 4, 4);

    // ===== XP shard =====
    g.clear();
    g.fillStyle(0xb347ff, 1); g.fillRect(2, 0, 2, 6); g.fillRect(1, 1, 4, 4); g.fillRect(0, 2, 6, 2);
    g.fillStyle(0xe0b0ff, 1); g.fillRect(2, 1, 2, 4);
    g.fillStyle(0xffffff, 1); g.fillRect(2, 2, 2, 2);
    g.generateTexture('xp', 6, 6);

    // ===== Ore textures =====
    this.makeOreTexture(g, 'ore_crude',   0x8e8a85, 0xb0aca5);
    this.makeOreTexture(g, 'ore_iron',    0xb89272, 0xddb494);
    this.makeOreTexture(g, 'ore_cobalt',  0x4f7fbf, 0x88b6e4);
    this.makeOreTexture(g, 'ore_void_shard', 0x9050d0, 0xc090f0, true);
    this.makeOreTexture(g, 'ore_plasma_core', 0xff66dd, 0xffaaee, true);

    // ===== Ingot textures (used in inventory icons) =====
    this.makeIngotTexture(g, 'ingot_iron',     0xc0a888, 0xeae0c0);
    this.makeIngotTexture(g, 'ingot_steel',    0x6f7888, 0xa0b0c4);
    this.makeIngotTexture(g, 'ingot_cobalt',   0x6090e0, 0xa0c8ff);
    this.makeIngotTexture(g, 'ingot_void',     0xb070ff, 0xe0b0ff);
    this.makeIngotTexture(g, 'ingot_plasma',   0xff88ff, 0xffd0ff);

    // ===== Particle =====
    g.clear(); g.fillStyle(0xffffff, 1); g.fillRect(0, 0, 2, 2);
    g.generateTexture('particle', 2, 2);

    // ===== Drone =====
    g.clear();
    g.fillStyle(0x6e1fad, 1);  g.fillRect(0, 1, 6, 4);
    g.fillStyle(0xb347ff, 1);  g.fillRect(1, 1, 4, 4);
    g.fillStyle(0xe0b0ff, 1);  g.fillRect(2, 2, 2, 2);
    g.fillStyle(0xffffff, 1);  g.fillRect(2, 2, 1, 1);
    g.generateTexture('drone', 6, 6);

    // ===== Floor tile =====
    g.clear();
    g.fillStyle(0x0c0c14, 1); g.fillRect(0, 0, 32, 32);
    g.fillStyle(0x14141d, 1); g.fillRect(1, 1, 14, 14); g.fillRect(17, 1, 14, 14); g.fillRect(1, 17, 14, 14); g.fillRect(17, 17, 14, 14);
    g.fillStyle(0x2a1f3a, 1); g.fillRect(15, 0, 2, 32); g.fillRect(0, 15, 32, 2);
    g.fillStyle(0x6e1fad, 0.7); g.fillRect(7, 7, 1, 1); g.fillRect(23, 23, 1, 1);
    g.generateTexture('floor', 32, 32);

    // ===== Explosion ring =====
    g.clear();
    g.lineStyle(2, 0xff7700, 1); g.strokeCircle(16, 16, 14);
    g.lineStyle(1, 0xffaa00, 1); g.strokeCircle(16, 16, 9);
    g.generateTexture('explosion', 32, 32);

    g.destroy();
  }

  makeBossTexture(g, key, body, top, eye, size = 16) {
    g.clear();
    const w = size, h = size;
    g.fillStyle(0x100012, 1); g.fillRect(0, h - 1, w, 1);
    g.fillStyle(body, 1); g.fillRect(1, 1, w - 2, h - 2);
    g.fillStyle(top, 1); g.fillRect(1, 1, w - 2, 2);
    g.fillStyle(eye, 1);
    g.fillRect(3, 4, 2, 2);
    g.fillRect(w - 5, 4, 2, 2);
    g.fillRect(Math.floor(w/2) - 1, 4, 2, 2);
    g.fillStyle(0x100012, 1);
    g.fillRect(2, h - 5, w - 4, 2);
    g.lineStyle(1, eye, 0.9); g.strokeRect(0, 0, w, h);
    g.generateTexture(key, w, h);
  }

  makeEnemyTexture(g, key, body, top, eye, opts = {}) {
    g.clear();
    const w = opts.wide ? 12 : 10;
    const h = 10;
    g.fillStyle(0x1a1a24, 1); g.fillRect(2, h - 2, w - 4, 1);
    g.fillStyle(body, 1); g.fillRect(1, 1, w - 2, h - 2);
    g.fillStyle(top, 1); g.fillRect(1, 1, w - 2, 1);
    g.fillStyle(eye, 1);
    const eyeY = 3;
    g.fillRect(2, eyeY, 2, 2);
    g.fillRect(w - 4, eyeY, 2, 2);
    g.fillStyle(0x100010, 1); g.fillRect(2, h - 4, w - 4, 1);
    if (opts.aura) {
      g.lineStyle(1, eye, 0.8); g.strokeRect(0, 0, w, h);
    }
    g.generateTexture(key, w, h);
  }

  makeOreTexture(g, key, body, hilite, sparkle = false) {
    g.clear();
    const w = 8, h = 8;
    g.fillStyle(0x1a1525, 1); g.fillRect(0, 0, w, h);
    g.fillStyle(body, 1);
    g.fillRect(1, 1, 6, 6);
    g.fillStyle(hilite, 1);
    g.fillRect(2, 2, 2, 2);
    g.fillRect(5, 4, 1, 1);
    if (sparkle) {
      g.fillStyle(0xffffff, 1);
      g.fillRect(3, 1, 1, 1);
      g.fillRect(6, 5, 1, 1);
    }
    g.generateTexture(key, w, h);
  }

  makeIngotTexture(g, key, body, hilite) {
    g.clear();
    const w = 12, h = 8;
    g.fillStyle(0x1a1525, 1); g.fillRect(0, 0, w, h);
    g.fillStyle(body, 1);
    g.fillRect(1, 2, w - 2, h - 4);
    g.fillStyle(hilite, 1);
    g.fillRect(2, 2, w - 4, 1);
    g.fillRect(2, 3, 2, 1);
    g.generateTexture(key, w, h);
  }
}
