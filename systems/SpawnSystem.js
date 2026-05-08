import Phaser from 'phaser';
import { pickEnemyType, ENEMY_BY_ID } from '../data/enemies.js';
import { nextBoss } from '../data/bosses.js';

export default class SpawnSystem {
  constructor(scene) {
    this.scene = scene;
    this.spawnTimer = 0.5;
    this.elapsed = 0;
    this.lastBurstAt = -999;
    this.lastBossAt = -1;
  }

  update(dt) {
    this.elapsed += dt;
    const rs = this.scene.runState;

    const baseRate = 0.9 * (rs?.spawnMult || 1);
    const ramp = Math.min(this.elapsed / 50, 7);
    const rate = baseRate * (1 + ramp);
    const interval = 1 / rate;

    this.spawnTimer -= dt;
    while (this.spawnTimer <= 0) {
      this.spawnTimer += interval;
      this.spawnOne();
    }

    if (this.elapsed - this.lastBurstAt > 30) {
      this.lastBurstAt = this.elapsed;
      const burstCount = 8 + Math.floor(this.elapsed / 30) * 2;
      for (let i = 0; i < burstCount; i++) this.spawnOne(true);
    }

    // Boss check
    const boss = nextBoss(this.elapsed, this.lastBossAt);
    if (boss) {
      this.lastBossAt = boss.atTime;
      this.spawnBoss(boss);
    }
  }

  spawnOne(burst = false, forcedType = null) {
    const px = this.scene.player.x;
    const py = this.scene.player.y;
    const angle = Math.random() * Math.PI * 2;
    const dist = burst ? (320 + Math.random() * 100) : (360 + Math.random() * 80);
    const x = Phaser.Math.Clamp(px + Math.cos(angle) * dist, 24, this.scene.arenaWidth - 24);
    const y = Phaser.Math.Clamp(py + Math.sin(angle) * dist, 24, this.scene.arenaHeight - 24);

    const type = forcedType || pickEnemyType(this.elapsed);
    const rs = this.scene.runState || {};
    const t = this.elapsed;
    const baseHp = 6 + t * 0.45;
    const baseSpd = 38 + Math.min(t * 0.5, 36);
    const baseDmg = 5 + Math.min(t * 0.06, 14);

    const hp = baseHp * (type.hpMult || 1) * (rs.enemyHpMult || 1);
    const spd = baseSpd * (type.speedMult || 1) * (rs.enemySpeedMult || 1);
    const dmg = baseDmg * (type.dmgMult || 1) * (rs.enemyDmgMult || 1);

    const enemy = this.scene.enemies.get(x, y);
    if (enemy) enemy.spawn(x, y, hp, spd, dmg, type);
  }

  spawnBoss(boss) {
    const px = this.scene.player.x;
    const py = this.scene.player.y;
    const angle = Math.random() * Math.PI * 2;
    const dist = 380;
    const x = Phaser.Math.Clamp(px + Math.cos(angle) * dist, 60, this.scene.arenaWidth - 60);
    const y = Phaser.Math.Clamp(py + Math.sin(angle) * dist, 60, this.scene.arenaHeight - 60);

    const rs = this.scene.runState || {};
    const t = this.elapsed;
    const baseHp = 6 + t * 0.45;
    const baseSpd = 38 + Math.min(t * 0.5, 36);
    const baseDmg = 5 + Math.min(t * 0.06, 14);

    const hp = baseHp * (boss.hpMult || 1) * (rs.enemyHpMult || 1);
    const spd = baseSpd * (boss.speedMult || 1) * (rs.enemySpeedMult || 1);
    const dmg = baseDmg * (boss.dmgMult || 1) * (rs.enemyDmgMult || 1);

    const enemy = this.scene.enemies.get(x, y);
    if (enemy) enemy.spawn(x, y, hp, spd, dmg, boss);

    this.scene.announceBoss?.(boss);
  }

  spawnAt(x, y, typeId) {
    const enemy = this.scene.enemies.get(x, y);
    if (!enemy) return;
    const type = (typeId && ENEMY_BY_ID[typeId]) || pickEnemyType(this.elapsed);
    const rs = this.scene.runState || {};
    const t = this.elapsed;
    const hp = (6 + t * 0.45) * (type.hpMult || 1) * (rs.enemyHpMult || 1);
    const spd = (38 + Math.min(t * 0.5, 36)) * (type.speedMult || 1) * (rs.enemySpeedMult || 1);
    const dmg = (5 + Math.min(t * 0.06, 14)) * (type.dmgMult || 1) * (rs.enemyDmgMult || 1);
    enemy.spawn(x, y, hp, spd, dmg, type);
  }
}
