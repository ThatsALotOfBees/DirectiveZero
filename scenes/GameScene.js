import Phaser from 'phaser';
import Player from '../entities/Player.js';
import Enemy from '../entities/Enemy.js';
import Projectile from '../entities/Projectile.js';
import XPShard from '../entities/XPShard.js';
import OrePickup from '../entities/OrePickup.js';
import EnemyBullet from '../entities/EnemyBullet.js';
import Drone from '../entities/Drone.js';
import SpawnSystem from '../systems/SpawnSystem.js';
import { SaveSystem } from '../systems/SaveSystem.js';
import { Audio } from '../systems/AudioSystem.js';
import { findPerk } from '../data/perks.js';
import { UPGRADES } from '../data/upgrades.js';
import { rollOreDrop, ORES, findOre } from '../data/materials.js';
import { ENEMY_BY_ID } from '../data/enemies.js';
import { findWeapon } from '../data/weapons.js';
import { findModifier } from '../data/modifiers.js';
import { grantAchievements } from '../data/achievements.js';

export default class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  init(data) {
    this.modifierId = (data && data.modifierId) || 'none';
  }

  create() {
    Audio.init();
    Audio.resume();
    this.audio = Audio;

    this.arenaWidth = 1600;
    this.arenaHeight = 1000;
    this.runState = { spawnMult: 1, dropMult: 1, enemyHpMult: 1, enemySpeedMult: 1, enemyDmgMult: 1, playerDmgTaken: 1, startLevel: 1 };

    this.physics.world.setBounds(0, 0, this.arenaWidth, this.arenaHeight);
    this.cameras.main.setBounds(0, 0, this.arenaWidth, this.arenaHeight);
    this.cameras.main.setBackgroundColor('#0a0a0f');

    this.bg = this.add.tileSprite(0, 0, this.arenaWidth, this.arenaHeight, 'floor')
      .setOrigin(0, 0).setDepth(-100);
    this.add.rectangle(this.arenaWidth/2, this.arenaHeight/2, this.arenaWidth-4, this.arenaHeight-4)
      .setFillStyle().setStrokeStyle(2, 0x6e1fad, 0.6).setDepth(-50);

    const save = SaveSystem.load();
    this.save = save;
    const meta = this.computeMeta(save);

    this.enemyTypes = ENEMY_BY_ID;

    this.enemies = this.physics.add.group({ classType: Enemy, defaultKey: 'enemy', maxSize: -1, runChildUpdate: false });
    this.projectiles = this.physics.add.group({ classType: Projectile, defaultKey: 'bullet', maxSize: 600, runChildUpdate: true });
    this.xpShards = this.physics.add.group({ classType: XPShard, defaultKey: 'xp', maxSize: -1, runChildUpdate: true });
    this.orePickups = this.physics.add.group({ classType: OrePickup, defaultKey: 'ore_crude', maxSize: -1, runChildUpdate: true });
    this.enemyBullets = this.physics.add.group({ classType: EnemyBullet, defaultKey: 'enemy_bullet', maxSize: 200, runChildUpdate: true });

    this.drones = this.add.group();
    this.damageNumbers = [];
    this.runOres = {};       // ores collected this run
    this.runResearch = 0;    // bonus research collected this run

    this.player = new Player(this, this.arenaWidth / 2, this.arenaHeight / 2, meta);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);

    // Apply selected run modifier to player + run state
    const modifier = findModifier(this.modifierId);
    this.modifier = modifier;
    if (modifier && modifier.apply) modifier.apply(this.runState, this.player);
    if (this.runState.startLevel > 1) this.player.level = this.runState.startLevel;

    // Hazards (destructible obstacles scattered in arena)
    this.hazards = this.physics.add.staticGroup();
    this.spawnHazards(14);

    this.spawnSystem = new SpawnSystem(this);

    // Level-up queue
    this.pendingLevelUps = 0;

    // Run-banished perks
    this.bannedPerks = new Set();

    // DPS tracking
    this.dpsWindow = []; // {t, dmg}
    this.dps = 0;

    this.physics.add.overlap(this.projectiles, this.enemies, (b, e) => this.handleBulletHit(b, e));
    this.physics.add.overlap(this.player, this.enemyBullets, (p, b) => this.handleEnemyBulletHit(b));
    this.physics.add.collider(this.player, this.hazards);
    this.physics.add.collider(this.enemies, this.hazards);
    this.physics.add.collider(this.projectiles, this.hazards, (b) => { if (b.active) b.disableBody(true, true); });

    this.runTime = 0;
    this.gameOver = false;
    this.paused = false;

    this.scene.launch('UIScene', { gameScene: this });
    this.events.on('resumeFromPerk', () => this.consumeLevelUp());
    this.input.keyboard.on('keydown-M', () => Audio.toggleMute());
    this.input.keyboard.on('keydown-ESC', () => this.openPauseMenu());
    this.input.keyboard.on('keydown-P', () => this.openPauseMenu());

    // Apply settings: volume, music
    const settings = this.save.settings || {};
    Audio.setVolume(settings.volume ?? 0.4);
    Audio.setMusicVolume(settings.musicVolume ?? 0.25);
    if (settings.music !== false) Audio.startMusic(settings.musicVolume ?? 0.25);

    this.events.on('shutdown', () => { Audio.stopMusic(); });
  }

  spawnHazards(n) {
    const placed = [];
    const cx = this.arenaWidth / 2, cy = this.arenaHeight / 2;
    const minD = 120; // keep clear around player spawn
    let tries = 0;
    while (placed.length < n && tries++ < n * 8) {
      const x = 80 + Math.random() * (this.arenaWidth - 160);
      const y = 80 + Math.random() * (this.arenaHeight - 160);
      const dx = x - cx, dy = y - cy;
      if (dx * dx + dy * dy < minD * minD) continue;
      const w = 28 + Math.floor(Math.random() * 28);
      const h = 28 + Math.floor(Math.random() * 28);
      let bad = false;
      for (const p of placed) {
        if (Math.abs(p.x - x) < (p.w + w) / 2 + 12 && Math.abs(p.y - y) < (p.h + h) / 2 + 12) { bad = true; break; }
      }
      if (bad) continue;
      const r = this.add.rectangle(x, y, w, h, 0x1a1a26).setStrokeStyle(1, 0x4a3a6a);
      this.physics.add.existing(r, true);
      this.hazards.add(r);
      placed.push({ x, y, w, h });
    }
  }

  // Pause menu
  openPauseMenu() {
    if (this.gameOver || this.paused) return;
    this.paused = true;
    this.physics.pause();
    this.scene.launch('PauseScene', { gameScene: this });
    this.scene.bringToTop('PauseScene');
  }

  // Resume from pause without spending level-ups
  resumeFromPause() {
    this.paused = false;
    this.physics.resume();
  }

  // Boss announcement banner (UIScene listens)
  announceBoss(boss) {
    const ui = this.scene.get('UIScene');
    if (ui && ui.showBossBanner) ui.showBossBanner(boss);
    this.cameras.main.shake(280, 0.012);
  }

  // Level-up queue
  queueLevelUps(n) {
    this.pendingLevelUps += n;
    if (!this.paused) this.onLevelUp();
  }

  consumeLevelUp() {
    if (this.pendingLevelUps > 0) this.pendingLevelUps -= 1;
    if (this.pendingLevelUps > 0) {
      // Re-show PerkScene for next queued level up
      this.scene.launch('PerkScene', { gameScene: this });
      this.scene.bringToTop('PerkScene');
    } else {
      this.paused = false;
      this.physics.resume();
    }
  }

  computeMeta(save) {
    const meta = {
      startHp: 0, damageBonus: 0, xpBonus: 0, pickupBonus: 0,
      reaction: 0, precision: 0, fireRateBonus: 0, speedBonus: 0,
      startCrit: 0, startPierce: 0, startProjectiles: 0, startDrones: 0,
      droneDmgMult: 0
    };
    UPGRADES.forEach(u => {
      if (!save.upgrades?.[u.id]) return;
      for (const [k, v] of Object.entries(u.effect || {})) {
        meta[k] = (meta[k] || 0) + v;
      }
    });
    if (save.equippedWeapon) {
      meta.weaponData = findWeapon(save.equippedWeapon);
    }
    return meta;
  }

  update(time, delta) {
    if (this.gameOver || this.paused) return;
    const dt = delta / 1000;
    this.runTime += dt;

    // Roll DPS window (last 3s)
    const cutoff = this.runTime - 3;
    while (this.dpsWindow.length > 0 && this.dpsWindow[0].t < cutoff) this.dpsWindow.shift();
    let totalDmg = 0;
    for (const e of this.dpsWindow) totalDmg += e.dmg;
    this.dps = totalDmg / 3;

    if (this.player && this.player.active) this.player.update(time, delta);
    const enemies = this.enemies.getChildren();
    for (let i = 0; i < enemies.length; i++) if (enemies[i].active) enemies[i].update(time, delta);
    this.drones.getChildren().forEach(d => d.update(time, delta));

    for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
      const n = this.damageNumbers[i];
      n.life -= dt;
      n.text.y -= 18 * dt;
      n.text.alpha = Math.max(0, n.life / n.maxLife);
      if (n.life <= 0) { n.text.destroy(); this.damageNumbers.splice(i, 1); }
    }

    this.spawnSystem.update(dt);
  }

  // ---------- Spawn helpers ----------
  spawnBullet(x, y, angle, stats) {
    const b = this.projectiles.get(x, y);
    if (b) b.fire(x, y, angle, stats);
  }
  spawnEnemyBullet(x, y, vx, vy, dmg) {
    const b = this.enemyBullets.get(x, y);
    if (b) b.fire(x, y, vx, vy, dmg);
  }
  spawnDrone(owner) { const d = new Drone(this, owner); this.drones.add(d); return d; }
  spawnXp(x, y, value) { const s = this.xpShards.get(x, y); if (s) s.spawn(x, y, value); }
  spawnOreDrop(x, y, oreId, qty = 1) {
    const o = this.orePickups.get(x, y);
    if (o) o.spawn(x, y, oreId, qty);
  }

  spawnDamageNumber(x, y, value, color = '#ffffff', big = false) {
    if (this.save.settings && this.save.settings.damageNumbers === false) return;
    if (this.damageNumbers.length > 80) {
      const old = this.damageNumbers.shift();
      if (old) old.text.destroy();
    }
    const t = this.add.text(x, y, String(value), {
      fontFamily: '"Segoe UI", "Helvetica Neue", Arial, sans-serif',
      fontSize: big ? '16px' : '13px',
      fontStyle: 'bold',
      color, stroke: '#000000', strokeThickness: 2
    }).setOrigin(0.5).setDepth(100);
    const maxLife = 0.7;
    this.damageNumbers.push({ text: t, life: maxLife, maxLife });
  }

  spawnHitFlash(x, y) {
    const p = this.add.image(x, y, 'particle').setTint(0xe0b0ff).setDepth(50);
    p.setScale(2);
    this.tweens.add({ targets: p, scale: 0, alpha: 0, duration: 160, onComplete: () => p.destroy() });
  }

  spawnExplosion(x, y, radius, dmg, sourceEnemy = null, opts = {}) {
    const exp = this.add.image(x, y, 'explosion').setDepth(60).setScale(0.3).setTint(opts.tint || 0xff7733);
    this.tweens.add({ targets: exp, scaleX: radius / 14, scaleY: radius / 14, alpha: 0, duration: 280, onComplete: () => exp.destroy() });
    this.cameras.main.shake(120, 0.008);
    this.audio.explode();
    if (dmg > 0) {
      const r2 = radius * radius;
      const list = this.enemies.getChildren();
      for (let i = 0; i < list.length; i++) {
        const e = list[i];
        if (!e.active || e === sourceEnemy) continue;
        const dx = e.x - x, dy = e.y - y;
        if (dx*dx + dy*dy < r2) {
          e.takeDamage(dmg);
          if (opts.ignite && this.player.stats.burnDmg > 0) e.applyBurn(this.player.stats.burnDmg, 2.0);
        }
      }
    }
  }

  // ---------- Combat ----------
  handleBulletHit(bullet, enemy) {
    if (!bullet.active || !enemy.active) return;
    if (bullet.hits.has(enemy)) return;
    bullet.hits.add(enemy);

    const player = this.player;

    let dmg = bullet.damage;
    let isCrit = false;
    if (Math.random() < bullet.critChance) {
      dmg *= bullet.critMult;
      isCrit = true;
      if (player.stats.critHasteOn) player.stats.critHasteTimer = 0.6;
      if (player.stats.critExplodeDmg > 0) {
        this.spawnExplosion(enemy.x, enemy.y, player.stats.critExplodeRadius, player.stats.critExplodeDmg, enemy, { tint: 0xffaa33 });
      }
    }

    // Execute threshold
    if (player.stats.executeThreshold > 0 && enemy.hp / enemy.maxHp <= player.stats.executeThreshold) {
      dmg = Math.max(dmg, enemy.hp + 1);
      this.spawnDamageNumber(enemy.x, enemy.y - 10, 'EXECUTE', '#ff6f8a', true);
    }

    enemy.takeDamage(dmg, isCrit);
    this.dpsWindow.push({ t: this.runTime, dmg });
    this.spawnHitFlash(enemy.x, enemy.y);
    this.audio.hit();

    // Lifesteal
    if (player.stats.lifesteal > 0 && player.hp < player.stats.maxHp) {
      player.hp = Math.min(player.stats.maxHp, player.hp + dmg * player.stats.lifesteal);
    }

    // Slow / chill on hit
    if (bullet.slowOnHit > 0) enemy.applySlow?.(0.6, 0.6);
    if (bullet.chillOnHit > 0) enemy.applySlow?.(0.4, 1.2);

    // Burn
    if (bullet.burnDmg > 0 && Math.random() < bullet.burnChance) enemy.applyBurn(bullet.burnDmg, 2.0);

    // Chain
    if (bullet.chainCount > 0 && Math.random() < bullet.chainChance) {
      this.chainLightning(enemy, bullet.damage * 0.6 * (player.stats.chainDmgMult || 1), bullet.chainCount, new Set([enemy]));
    }

    // Explosive
    if (bullet.explosionDmg > 0) {
      this.spawnExplosion(enemy.x, enemy.y, bullet.explosionRadius, bullet.explosionDmg, enemy, { ignite: !!player.stats.firebomb });
      if (player.stats.clusterCount > 0) {
        for (let i = 0; i < player.stats.clusterCount; i++) {
          const a = Math.random() * Math.PI * 2;
          const r = Math.random() * (bullet.explosionRadius * 0.8);
          const cx = enemy.x + Math.cos(a) * r, cy = enemy.y + Math.sin(a) * r;
          this.time.delayedCall(80 * i + 60, () => this.spawnExplosion(cx, cy, bullet.explosionRadius * 0.6, bullet.explosionDmg * 0.6, null));
        }
      }
    }

    // Split on hit
    if (bullet.splitOnHit > 0 && bullet.active) {
      for (let i = 0; i < bullet.splitOnHit; i++) {
        const a = Math.random() * Math.PI * 2;
        const stats = {
          bulletSpeed: bullet.speed * 0.85, bulletLife: bullet.life * 0.7,
          pierce: 0, damage: bullet.damage * 0.55,
          critChance: bullet.critChance, critMult: bullet.critMult,
          burnChance: 0, burnDmg: 0, chainChance: 0, chainCount: 0,
          explosionDmg: 0, explosionRadius: 0,
          ricochet: 0, homingStrength: 0, splitOnHit: 0,
          slowOnHit: 0, chillOnHit: 0
        };
        this.spawnBullet(bullet.x, bullet.y, a, stats);
      }
    }

    // Pierce / ricochet / consume
    if (bullet.pierce > 0) {
      bullet.pierce -= 1;
    } else if (bullet.ricochet > 0) {
      bullet.ricochet -= 1;
      const list = this.enemies.getChildren();
      let target = null, bestD2 = 200 * 200;
      for (let i = 0; i < list.length; i++) {
        const e = list[i];
        if (!e.active || bullet.hits.has(e)) continue;
        const dx = e.x - bullet.x, dy = e.y - bullet.y;
        const d2 = dx*dx + dy*dy;
        if (d2 < bestD2) { bestD2 = d2; target = e; }
      }
      if (target && bullet.body) {
        const ang = Math.atan2(target.y - bullet.y, target.x - bullet.x);
        bullet.body.setVelocity(Math.cos(ang) * bullet.speed, Math.sin(ang) * bullet.speed);
        bullet.setRotation(ang);
        bullet.life = Math.max(bullet.life, 0.4);
      } else {
        bullet.disableBody(true, true);
      }
    } else {
      bullet.disableBody(true, true);
    }
  }

  chainLightning(from, damage, count, hitSet) {
    if (count <= 0) return;
    const player = this.player;
    let nearest = null, bestD2 = 180 * 180;
    const list = this.enemies.getChildren();
    for (let i = 0; i < list.length; i++) {
      const e = list[i];
      if (!e.active || hitSet.has(e)) continue;
      const dx = e.x - from.x, dy = e.y - from.y;
      const d2 = dx*dx + dy*dy;
      if (d2 < bestD2) { bestD2 = d2; nearest = e; }
    }
    if (!nearest) {
      // Loop back?
      if (player.stats.chainLoop > 0 && Math.random() < player.stats.chainLoop && hitSet.size > 1) {
        const arr = Array.from(hitSet);
        nearest = arr[Math.floor(Math.random() * arr.length)];
      } else return;
    }
    hitSet.add(nearest);

    const line = this.add.graphics();
    line.lineStyle(2, 0xb0d0ff, 1).beginPath();
    line.moveTo(from.x, from.y); line.lineTo(nearest.x, nearest.y);
    line.strokePath(); line.setDepth(70);
    this.tweens.add({ targets: line, alpha: 0, duration: 180, onComplete: () => line.destroy() });

    nearest.takeDamage(damage);
    if (player.stats.electricFire && player.stats.burnDmg > 0) nearest.applyBurn(player.stats.burnDmg, 1.6);
    if (player.stats.stormBomb) this.spawnExplosion(nearest.x, nearest.y, 28, Math.max(2, damage * 0.4), nearest, { tint: 0x88aaff });

    const next = player.stats.chainNoFalloff ? damage : damage * 0.85;
    this.chainLightning(nearest, next, count - 1, hitSet);
  }

  handleEnemyBulletHit(bullet) {
    if (!bullet.active) return;
    this.player.takeDamage(bullet.damage);
    bullet.disableBody(true, true);
  }

  // ---------- Drops & XP ----------
  collectOre(oreId, qty) {
    const got = qty + (this.player.stats.dropQty - 1);
    this.runOres[oreId] = (this.runOres[oreId] || 0) + got;
    this.save.materials[oreId] = (this.save.materials[oreId] || 0) + got;
    this.save.stats.totalOres = (this.save.stats.totalOres || 0) + got;
    SaveSystem.save(this.save);
    const ore = findOre(oreId);
    this.spawnDamageNumber(this.player.x, this.player.y - 16, '+' + got + ' ' + (ore?.name || oreId), ore?.color ? '#'+ore.color.toString(16).padStart(6,'0') : '#ffffff');
    this.audio.pickup();
  }

  onEnemyDeath(enemy) {
    this.player.kills += 1;
    const xpVal = Math.max(1, Math.floor((1 + this.runTime / 60) * (enemy.type ? enemy.type.xpMult || 1 : 1)));
    this.spawnXp(enemy.x, enemy.y, xpVal);

    // Death particle burst
    this.spawnDeathBurst(enemy.x, enemy.y, enemy.type);

    // Heal on kill
    if (this.player.stats.healOnKill > 0 && this.player.hp < this.player.stats.maxHp) {
      this.player.hp = Math.min(this.player.stats.maxHp, this.player.hp + this.player.stats.healOnKill);
    }

    // Splitter spawnsOnDeath
    if (enemy.type && enemy.type.spawnsOnDeath) {
      const so = enemy.type.spawnsOnDeath;
      for (let i = 0; i < so.count; i++) {
        const a = (i / so.count) * Math.PI * 2 + Math.random() * 0.6;
        const sx = enemy.x + Math.cos(a) * 12;
        const sy = enemy.y + Math.sin(a) * 12;
        this.spawnSystem.spawnAt(sx, sy, so.type);
      }
    }

    // Boss death = bigger shake + announce
    if (enemy.type && enemy.type.isBoss) {
      this.cameras.main.shake(360, 0.018);
      this.cameras.main.flash(220, 200, 100, 255);
    }

    // Ore drop
    const luck = (1 + (this.player.stats.luck || 0)) * (this.runState?.dropMult || 1);
    const dropMult = enemy.type ? (enemy.type.dropMult || 1) : 1;
    const oreId = rollOreDrop(luck * dropMult, Math.min(this.runTime / 600, 0.04));
    if (oreId) this.spawnOreDrop(enemy.x, enemy.y, oreId, 1);

    // Elite / boss extra drops
    if (enemy.type && enemy.type.eliteDropBoost) {
      const extras = enemy.type.isBoss ? 4 : 2;
      for (let i = 0; i < extras; i++) {
        const id = rollOreDrop(2 * luck * dropMult, 0.15);
        if (id) this.spawnOreDrop(enemy.x + (Math.random()-0.5)*16, enemy.y + (Math.random()-0.5)*16, id, 1);
      }
    }
  }

  spawnDeathBurst(x, y, type) {
    const isBoss = !!(type && type.isBoss);
    const color = type && type.color ? type.color : 0xb347ff;
    const n = isBoss ? 18 : 6;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = isBoss ? 80 + Math.random() * 120 : 50 + Math.random() * 60;
      const dx = Math.cos(a) * sp;
      const dy = Math.sin(a) * sp;
      const p = this.add.image(x, y, 'particle').setTint(color).setDepth(50).setScale(isBoss ? 2.4 : 1.6);
      this.tweens.add({
        targets: p,
        x: x + dx,
        y: y + dy,
        scale: 0, alpha: 0,
        duration: isBoss ? 540 : 360,
        onComplete: () => p.destroy()
      });
    }
  }

  onLevelUp() {
    this.audio.levelUp();
    this.paused = true;
    this.physics.pause();
    if (!this.scene.isActive('PerkScene')) {
      this.scene.launch('PerkScene', { gameScene: this });
      this.scene.bringToTop('PerkScene');
    }
  }

  applyPerk(perkId) {
    const perk = findPerk(perkId);
    if (!perk) return;
    perk.apply(this.player);
    this.player.ownedPerks.add(perkId);
    if (this.save.perksSeen) this.save.perksSeen[perkId] = (this.save.perksSeen[perkId] || 0) + 1;
    SaveSystem.save(this.save);
  }

  // End run early without death — banks RD
  endRunEarly() {
    if (this.gameOver) return;
    this.gameOver = true;
    this.physics.pause();
    Audio.stopMusic();
    const earnedBase = Math.floor(10 + this.player.kills * 0.5 + this.runTime * 0.3 + this.player.level * 5);
    const earned = Math.floor(earnedBase * (this.player.stats.researchMult || 1));
    this.save.research += earned;
    this.save.stats.runs += 1;
    this.save.stats.totalKills += this.player.kills;
    if (this.runTime > this.save.stats.bestTime) this.save.stats.bestTime = this.runTime;
    if (this.player.kills > this.save.stats.bestKills) this.save.stats.bestKills = this.player.kills;
    if (this.player.level > this.save.stats.bestLevel) this.save.stats.bestLevel = this.player.level;
    const granted = grantAchievements(this.save);
    SaveSystem.save(this.save);
    this.scene.stop('UIScene');
    this.scene.stop('PauseScene');
    this.scene.start('GameOverScene', {
      time: this.runTime,
      kills: this.player.kills,
      level: this.player.level,
      earned,
      oresGained: this.runOres,
      newAchievements: granted,
      ended: true
    });
  }

  onPlayerDeath() {
    if (this.gameOver) return;
    this.gameOver = true;
    this.audio.death();
    Audio.stopMusic();
    this.physics.pause();

    const earnedBase = Math.floor(10 + this.player.kills * 0.5 + this.runTime * 0.3 + this.player.level * 5);
    const earned = Math.floor(earnedBase * (this.player.stats.researchMult || 1));
    this.save.research += earned;
    this.save.stats.runs += 1;
    this.save.stats.totalKills += this.player.kills;
    if (this.runTime > this.save.stats.bestTime) this.save.stats.bestTime = this.runTime;
    if (this.player.kills > this.save.stats.bestKills) this.save.stats.bestKills = this.player.kills;
    if (this.player.level > this.save.stats.bestLevel) this.save.stats.bestLevel = this.player.level;
    const granted = grantAchievements(this.save);
    SaveSystem.save(this.save);

    this.cameras.main.shake(400, 0.012);
    this.cameras.main.flash(160, 60, 0, 0);

    this.time.delayedCall(900, () => {
      this.scene.stop('UIScene');
      this.scene.start('GameOverScene', {
        time: this.runTime,
        kills: this.player.kills,
        level: this.player.level,
        earned,
        oresGained: this.runOres,
        newAchievements: granted
      });
    });
  }
}
