import Phaser from 'phaser';

const TWO_PI = Math.PI * 2;

export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, meta = {}) {
    super(scene, x, y, 'player');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setCollideWorldBounds(true);
    if (this.body) {
      this.body.setSize(8, 8);
      this.body.setOffset(2, 2);
    }
    this.scene = scene;
    this.meta = meta;

    this.stats = {
      // Core combat
      maxHp: 100 + (meta.startHp || 0),
      damage: 10 * (1 + (meta.damageBonus || 0)),
      moveSpeed: 100 * (1 + (meta.speedBonus || 0)),
      fireRate: 2.5 * (1 + (meta.fireRateBonus || 0)),
      pierce: meta.startPierce || 0,
      projectiles: 1 + (meta.startProjectiles || 0),
      pickupRadius: 50 * (1 + (meta.pickupBonus || 0)),
      bulletSpeed: 320,
      bulletLife: 0.9,
      range: 380,
      // Crit
      critChance: meta.startCrit || 0,
      critMult: 2.0,
      // AI smoothing
      reactionRate: 0.18 + (meta.reaction || 0),
      precision: 0.04 + (meta.precision || 0),
      // Element
      burnChance: 0,
      burnDmg: 0,
      burnTickRate: 1,
      chainChance: 0,
      chainCount: 0,
      chainDmgMult: 1,
      explosionDmg: 0,
      explosionRadius: 0,
      // Defensive
      regen: 0,
      armor: 0,
      lifesteal: 0,
      dodge: 0,
      thorns: 0,
      evadeBonus: 0,
      lastStandCharges: 0,
      secondWind: 0,
      healOnKill: 0,
      // Utility
      luck: 0,
      xpGain: 0,
      xpBonusFlat: 0,
      researchMult: 1,
      dropQty: 1,
      // Drone
      droneDmgMult: 1,
      droneCrit: false,
      // Behaviors
      ricochet: 0,
      homingStrength: 0,
      splitOnHit: 0,
      slowOnHit: 0,
      chillOnHit: 0,
      executeThreshold: 0,
      panicBurst: 0,
      magnetPulse: 0,
      gravityPulse: 0,
      kiteBias: 0, fleeBias: 0, collectBias: 0,
      berserker: false,
      critHasteOn: false,
      critHasteTimer: 0,
      // Fusion flags
      electricFire: false, firebomb: false, stormBomb: false,
      eternal: false, explosionChain: false, clusterCount: 0,
      critExplodeDmg: 0, critExplodeRadius: 0,
      burnSpread: 0, chainNoFalloff: false, chainLoop: 0,
      xpOverflow: false
    };

    this.hp = this.stats.maxHp;
    this.xp = 0;
    this.level = 1;
    this.xpToNext = this.computeXpToNext(1);
    this.kills = 0;
    this.fireTimer = 0;
    this.aimAngle = 0;
    this.targetVel = new Phaser.Math.Vector2(0, 0);
    this.smoothedVel = new Phaser.Math.Vector2(0, 0);
    this.invulnTimer = 0;
    this.behaviorLabel = 'wander';
    this.drones = [];
    this.ownedPerks = new Set();

    // Periodic effect timers
    this.magnetPulseTimer = 8;
    this.gravityPulseTimer = 12;

    // Apply meta perks (e.g., starting drones)
    for (let i = 0; i < (meta.startDrones || 0); i++) this.addDrone();

    // Apply equipped weapon
    this.weapon = meta.weaponData || null;
    this.burstShotsLeft = 0;
    if (this.weapon && this.weapon.apply) this.weapon.apply(this);

    this.shadow = scene.add.ellipse(x, y + 6, 10, 4, 0x000000, 0.4);
    this.shadow.setDepth(0);
    this.setDepth(1);

    this.aimLine = scene.add.graphics();
    this.aimLine.setDepth(0);
  }

  computeXpToNext(level) { return Math.floor(8 + level * level * 1.4 + level * 4); }

  takeDamage(amount) {
    if (this.invulnTimer > 0 || !this.active) return;
    // Dodge
    if (this.stats.dodge > 0 && Math.random() < this.stats.dodge) {
      this.scene.spawnDamageNumber(this.x, this.y - 12, 'EVADE', '#88e8ff');
      this.invulnTimer = 0.25;
      return;
    }
    let dmg = amount;
    if (this.scene.runState && this.scene.runState.playerDmgTaken) dmg *= this.scene.runState.playerDmgTaken;
    if (this.stats.armor > 0) dmg = dmg * (1 - Math.min(0.85, this.stats.armor));
    this.hp -= dmg;
    this.invulnTimer = 0.4 + (this.stats.evadeBonus || 0);
    this.scene.cameras.main.shake(80, 0.005);
    this.scene.spawnDamageNumber(this.x, this.y - 12, Math.ceil(dmg), '#ff7070');

    // Panic burst
    if (this.stats.panicBurst > 0) {
      const n = 12;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TWO_PI;
        this.scene.spawnBullet(this.x, this.y, a, this.stats);
      }
    }

    // Last stand
    if (this.hp <= 0 && this.stats.lastStandCharges > 0) {
      this.stats.lastStandCharges -= 1;
      this.hp = 1;
      this.invulnTimer = 1.5;
      this.scene.spawnDamageNumber(this.x, this.y - 24, 'LAST STAND', '#ffd34b');
      return;
    }

    if (this.hp <= 0) { this.hp = 0; this.scene.onPlayerDeath(); }
  }

  gainXp(amount) {
    const mult = 1 + (this.meta.xpBonus || 0) + (this.stats.xpGain || 0);
    const flat = this.stats.xpBonusFlat || 0;
    this.xp += amount * mult + flat;
    let levelsGained = 0;
    while (this.xp >= this.xpToNext) {
      const overflow = this.xp - this.xpToNext;
      this.xp = this.stats.xpOverflow ? overflow : 0;
      this.level += 1;
      this.xpToNext = this.computeXpToNext(this.level);
      if (this.stats.secondWind > 0) {
        this.hp = Math.min(this.stats.maxHp, this.hp + this.stats.maxHp * this.stats.secondWind);
      }
      levelsGained += 1;
    }
    if (levelsGained > 0) this.scene.queueLevelUps(levelsGained);
  }

  addDrone() {
    const d = this.scene.spawnDrone(this);
    this.drones.push(d);
    const n = this.drones.length;
    this.drones.forEach((dr, i) => dr.setOrbitOffset((i / n) * TWO_PI));
  }

  update(time, delta) {
    if (!this.active) return;
    const dt = delta / 1000;
    this.invulnTimer = Math.max(0, this.invulnTimer - dt);
    if (this.stats.critHasteTimer > 0) this.stats.critHasteTimer -= dt;

    // Regen
    if (this.stats.regen > 0 && this.hp < this.stats.maxHp) {
      this.hp = Math.min(this.stats.maxHp, this.hp + this.stats.regen * dt);
    }
    // Eternal: small heal-over-time when lifesteal > 0
    if (this.stats.eternal && this.stats.lifesteal > 0 && this.hp < this.stats.maxHp) {
      this.hp = Math.min(this.stats.maxHp, this.hp + 0.5 * dt);
    }

    // Magnet pulse — periodically pull all xp
    if (this.stats.magnetPulse > 0) {
      this.magnetPulseTimer -= dt;
      if (this.magnetPulseTimer <= 0) {
        this.magnetPulseTimer = 8 / Math.max(1, this.stats.magnetPulse);
        this.scene.xpShards.getChildren().forEach(s => {
          if (!s.active) return;
          const dx = this.x - s.x, dy = this.y - s.y;
          const m = Math.sqrt(dx*dx+dy*dy) || 0.001;
          if (s.body) s.body.setVelocity(dx / m * 600, dy / m * 600);
        });
      }
    }
    // Gravity pulse — yank all enemies briefly
    if (this.stats.gravityPulse > 0) {
      this.gravityPulseTimer -= dt;
      if (this.gravityPulseTimer <= 0) {
        this.gravityPulseTimer = 12 / Math.max(1, this.stats.gravityPulse);
        this.scene.enemies.getChildren().forEach(e => {
          if (!e.active) return;
          const dx = this.x - e.x, dy = this.y - e.y;
          const m = Math.sqrt(dx*dx+dy*dy) || 0.001;
          if (e.body) e.body.setVelocity(dx / m * 220, dy / m * 220);
        });
        // visual
        const ring = this.scene.add.circle(this.x, this.y, 6, 0xb347ff, 0.3).setDepth(50);
        this.scene.tweens.add({ targets: ring, radius: 200, alpha: 0, duration: 500, onComplete: () => ring.destroy() });
      }
    }

    this.runAI(dt, time);
    this.applyMovement(dt);
    this.tryShoot(dt);
    this.collectXp();

    if (this.shadow) this.shadow.setPosition(this.x, this.y + 6);
    if (this.invulnTimer > 0) this.alpha = 0.4 + Math.sin(time * 0.04) * 0.3;
    else if (this.alpha !== 1) this.alpha = 1;

    // Aim line — subtle dashed line to current target
    if (this.aimLine) {
      this.aimLine.clear();
      if (this._aimTarget && this._aimTarget.active && this._aimDist < this.stats.range) {
        this.aimLine.lineStyle(1, 0xb347ff, 0.35);
        this.aimLine.beginPath();
        this.aimLine.moveTo(this.x, this.y);
        this.aimLine.lineTo(this._aimTarget.x, this._aimTarget.y);
        this.aimLine.strokePath();
      }
    }
  }

  effectiveStats() {
    const s = this.stats;
    let fr = s.fireRate;
    let dmg = s.damage;
    if (s.berserker && this.hp / s.maxHp < 0.30) {
      fr *= 1.5;
      dmg *= 1.5;
    }
    if (s.critHasteOn && s.critHasteTimer > 0) fr *= 1.5;
    return { fireRate: fr, damage: dmg };
  }

  runAI(dt, time) {
    const enemies = this.scene.enemies.getChildren();
    const xpShards = this.scene.xpShards.getChildren();
    const ores = this.scene.orePickups ? this.scene.orePickups.getChildren() : [];

    let nearestEnemy = null, bestEnemyD2 = Infinity;
    let densityCount = 0;
    const densityVec = new Phaser.Math.Vector2(0, 0);
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (!e.active) continue;
      const dx = e.x - this.x, dy = e.y - this.y;
      const d2 = dx*dx + dy*dy;
      if (d2 < bestEnemyD2) { bestEnemyD2 = d2; nearestEnemy = e; }
      if (d2 < 120 * 120) {
        const d = Math.sqrt(d2) || 0.001;
        const w = 1 - d / 120;
        densityVec.x += -dx / d * w;
        densityVec.y += -dy / d * w;
        densityCount++;
      }
    }
    const enemyDist = nearestEnemy ? Math.sqrt(bestEnemyD2) : 9999;

    let nearestPickup = null, bestPickupD2 = Infinity;
    for (let i = 0; i < xpShards.length; i++) {
      const s = xpShards[i];
      if (!s.active) continue;
      const dx = s.x - this.x, dy = s.y - this.y;
      const d2 = dx*dx + dy*dy;
      if (d2 < bestPickupD2) { bestPickupD2 = d2; nearestPickup = s; }
    }
    for (let i = 0; i < ores.length; i++) {
      const o = ores[i];
      if (!o.active) continue;
      const dx = o.x - this.x, dy = o.y - this.y;
      const d2 = dx*dx + dy*dy;
      if (d2 < bestPickupD2) { bestPickupD2 = d2; nearestPickup = o; }
    }
    const pickupDist = nearestPickup ? Math.sqrt(bestPickupD2) : 9999;

    const hpFrac = this.hp / this.stats.maxHp;

    const fleeMul    = 1 + (this.stats.fleeBias || 0);
    const collectMul = 1 + (this.stats.collectBias || 0);
    const kiteMul    = 1 + (this.stats.kiteBias || 0);

    const scoreFlee = nearestEnemy
      ? Phaser.Math.Clamp(1 - enemyDist / 80, 0, 1) * (0.6 + (1 - hpFrac) * 1.2) * fleeMul + densityCount * 0.04
      : 0;
    const scoreCollect = nearestPickup
      ? Phaser.Math.Clamp(1 - pickupDist / 260, 0, 1) * 0.7 * collectMul
      : 0;
    const scoreKite = nearestEnemy
      ? Phaser.Math.Clamp((enemyDist - 60) / 90, 0, 1) * 0.55 * kiteMul
      : 0;
    const scoreWander = 0.15;

    const scores = { flee: scoreFlee, collect: scoreCollect, kite: scoreKite, wander: scoreWander };
    let topName = 'wander', topVal = -1;
    for (const k in scores) if (scores[k] > topVal) { topVal = scores[k]; topName = k; }
    this.behaviorLabel = topName;

    const steer = new Phaser.Math.Vector2(0, 0);

    if (scoreFlee > 0 && nearestEnemy) {
      const ax = this.x - nearestEnemy.x, ay = this.y - nearestEnemy.y;
      const m = Math.sqrt(ax*ax + ay*ay) || 0.001;
      steer.x += (ax / m) * scoreFlee * 1.4;
      steer.y += (ay / m) * scoreFlee * 1.4;
      if (densityCount > 0) {
        const dm = densityVec.length() || 0.001;
        steer.x += (densityVec.x / dm) * scoreFlee * 0.8;
        steer.y += (densityVec.y / dm) * scoreFlee * 0.8;
      }
    }
    if (scoreCollect > 0 && nearestPickup) {
      const ax = nearestPickup.x - this.x, ay = nearestPickup.y - this.y;
      const m = Math.sqrt(ax*ax + ay*ay) || 0.001;
      steer.x += (ax / m) * scoreCollect * 1.2;
      steer.y += (ay / m) * scoreCollect * 1.2;
    }
    if (scoreKite > 0 && nearestEnemy) {
      const tx = nearestEnemy.x - this.x, ty = nearestEnemy.y - this.y;
      const m = Math.sqrt(tx*tx + ty*ty) || 0.001;
      const px = -ty / m, py = tx / m;
      const side = Math.sin(time * 0.0008) > 0 ? 1 : -1;
      steer.x += px * scoreKite * 0.8 * side;
      steer.y += py * scoreKite * 0.8 * side;
    }
    const wanderAngle = Math.sin(time * 0.0007) * Math.PI * 2 + Math.cos(time * 0.0011) * Math.PI;
    steer.x += Math.cos(wanderAngle) * scoreWander * 0.3;
    steer.y += Math.sin(wanderAngle) * scoreWander * 0.3;

    const margin = 80;
    const w = this.scene.arenaWidth, h = this.scene.arenaHeight;
    if (this.x < margin)        steer.x += (margin - this.x) / margin * 1.4;
    if (this.x > w - margin)    steer.x -= (this.x - (w - margin)) / margin * 1.4;
    if (this.y < margin)        steer.y += (margin - this.y) / margin * 1.4;
    if (this.y > h - margin)    steer.y -= (this.y - (h - margin)) / margin * 1.4;

    const len = Math.sqrt(steer.x*steer.x + steer.y*steer.y);
    if (len > 0.001) { steer.x /= len; steer.y /= len; }

    this.targetVel.x = steer.x * this.stats.moveSpeed;
    this.targetVel.y = steer.y * this.stats.moveSpeed;

    if (nearestEnemy) {
      this.aimAngle = Math.atan2(nearestEnemy.y - this.y, nearestEnemy.x - this.x);
      this._aimTarget = nearestEnemy;
      this._aimDist = enemyDist;
    } else {
      this._aimTarget = null;
      this._aimDist = 9999;
    }
  }

  applyMovement(dt) {
    const factor = Phaser.Math.Clamp(this.stats.reactionRate + dt * 6 * this.stats.precision, 0, 1);
    this.smoothedVel.x = Phaser.Math.Linear(this.smoothedVel.x, this.targetVel.x, factor);
    this.smoothedVel.y = Phaser.Math.Linear(this.smoothedVel.y, this.targetVel.y, factor);
    if (this.body) this.body.setVelocity(this.smoothedVel.x, this.smoothedVel.y);
  }

  tryShoot(dt) {
    this.fireTimer -= dt;
    if (this.fireTimer > 0) return;
    if (!this._aimTarget || this._aimDist > this.stats.range) return;
    const eff = this.effectiveStats();
    const baseAngle = this.aimAngle;
    const fireStats = {
      ...this.stats,
      damage: eff.damage,
      bulletColor: this.weapon?.bulletColor || 0xe0b0ff,
      bulletScale: this.weapon?.bulletScale || 1
    };

    const mode = this.weapon ? this.weapon.fireMode : 'standard';

    if (mode === 'beam') {
      this.fireTimer = 1 / eff.fireRate;
      this.fireBeam(baseAngle, fireStats);
    } else if (mode === 'ring') {
      this.fireTimer = 1 / eff.fireRate;
      const n = this.weapon.ringCount || 12;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        this.scene.spawnBullet(this.x, this.y, a, fireStats);
      }
    } else if (mode === 'burst') {
      const burstCount = this.weapon.burstCount || 3;
      const burstDelay = this.weapon.burstDelay || 0.06;
      if (this.burstShotsLeft > 0) {
        this.fireTimer = burstDelay;
        this.burstShotsLeft -= 1;
      } else {
        this.fireTimer = 1 / eff.fireRate;
        this.burstShotsLeft = burstCount - 1;
      }
      this.fireSpread(baseAngle, fireStats);
    } else {
      this.fireTimer = 1 / eff.fireRate;
      this.fireSpread(baseAngle, fireStats);
    }
    this.scene.audio.shoot();
  }

  fireSpread(baseAngle, fireStats) {
    const spread = 0.12;
    const n = this.stats.projectiles;
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0 : (i / (n - 1) - 0.5);
      const angle = baseAngle + t * spread * (n - 1);
      this.scene.spawnBullet(this.x, this.y, angle, fireStats);
    }
  }

  fireBeam(angle, fireStats) {
    const range = this.stats.range;
    const ex = this.x + Math.cos(angle) * range;
    const ey = this.y + Math.sin(angle) * range;
    const dx = ex - this.x, dy = ey - this.y;
    const segLen2 = dx * dx + dy * dy;
    const list = this.scene.enemies.getChildren();
    const hits = [];
    for (let i = 0; i < list.length; i++) {
      const e = list[i];
      if (!e.active) continue;
      const px = e.x - this.x, py = e.y - this.y;
      const t = Phaser.Math.Clamp((px * dx + py * dy) / segLen2, 0, 1);
      const cx = this.x + dx * t, cy = this.y + dy * t;
      const ddx = e.x - cx, ddy = e.y - cy;
      const distance = Math.sqrt(ddx * ddx + ddy * ddy);
      const r = 14 * (e.scaleY || 1);
      if (distance < r) hits.push({ e, t });
    }
    hits.sort((a, b) => a.t - b.t);
    let pierce = (this.stats.pierce || 0) + this.stats.projectiles;
    let furthest = 0;
    for (const h of hits) {
      if (pierce-- <= 0) break;
      let dmg = fireStats.damage;
      let crit = false;
      if (Math.random() < this.stats.critChance) { dmg *= this.stats.critMult; crit = true; }
      h.e.takeDamage(dmg, crit);
      this.scene.spawnHitFlash(h.e.x, h.e.y);
      if (this.stats.lifesteal > 0) this.hp = Math.min(this.stats.maxHp, this.hp + dmg * this.stats.lifesteal);
      if (this.stats.burnDmg > 0 && Math.random() < this.stats.burnChance) h.e.applyBurn(this.stats.burnDmg, 2.0);
      furthest = Math.max(furthest, h.t);
    }
    // Beam visual
    const endT = Math.max(0.6, furthest + 0.05);
    const endX = this.x + dx * endT, endY = this.y + dy * endT;
    const line = this.scene.add.graphics();
    const w = this.weapon?.beamWidth || 2;
    line.lineStyle(w, this.weapon?.beamColor || 0xffaaff, 1);
    line.beginPath(); line.moveTo(this.x, this.y); line.lineTo(endX, endY); line.strokePath();
    line.setDepth(60);
    this.scene.tweens.add({ targets: line, alpha: 0, duration: 160, onComplete: () => line.destroy() });
  }

  collectXp() {
    const radius = this.stats.pickupRadius;
    const radius2 = radius * radius;
    const shards = this.scene.xpShards.getChildren();
    for (let i = 0; i < shards.length; i++) {
      const s = shards[i];
      if (!s.active) continue;
      const dx = s.x - this.x, dy = s.y - this.y;
      const d2 = dx*dx + dy*dy;
      if (d2 < radius2) {
        const d = Math.sqrt(d2) || 0.001;
        const pull = 240 + (radius - d) * 4;
        if (s.body) s.body.setVelocity(-dx / d * pull, -dy / d * pull);
        if (d < 14) {
          this.gainXp(s.value);
          this.scene.audio.pickup();
          s.disableBody(true, true);
        }
      } else if (s.body && (s.body.velocity.x !== 0 || s.body.velocity.y !== 0)) {
        s.body.setVelocity(s.body.velocity.x * 0.92, s.body.velocity.y * 0.92);
      }
    }

    // Ore pickups
    if (!this.scene.orePickups) return;
    const ores = this.scene.orePickups.getChildren();
    for (let i = 0; i < ores.length; i++) {
      const o = ores[i];
      if (!o.active) continue;
      const dx = o.x - this.x, dy = o.y - this.y;
      const d2 = dx*dx + dy*dy;
      if (d2 < radius2) {
        const d = Math.sqrt(d2) || 0.001;
        const pull = 240 + (radius - d) * 4;
        if (o.body) o.body.setVelocity(-dx / d * pull, -dy / d * pull);
        if (d < 14) {
          this.scene.collectOre(o.oreId, o.qty);
          o.disableBody(true, true);
        }
      } else if (o.body && (o.body.velocity.x !== 0 || o.body.velocity.y !== 0)) {
        o.body.setVelocity(o.body.velocity.x * 0.92, o.body.velocity.y * 0.92);
      }
    }
  }

  destroy(fromScene) {
    if (this.shadow) { this.shadow.destroy(); this.shadow = null; }
    if (this.aimLine) { this.aimLine.destroy(); this.aimLine = null; }
    super.destroy(fromScene);
  }
}
