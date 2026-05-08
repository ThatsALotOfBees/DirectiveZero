import Phaser from 'phaser';

export default class Projectile extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'bullet');
    this.scene = scene;
  }

  fire(x, y, angle, stats) {
    this.enableBody(true, x, y, true, true);
    this.setActive(true).setVisible(true);
    if (this.body) {
      this.body.setSize(4, 4);
      this.body.setOffset(0, 0);
      this.body.setVelocity(Math.cos(angle) * stats.bulletSpeed, Math.sin(angle) * stats.bulletSpeed);
    }
    this.setRotation(angle);
    this.setTint(stats.bulletColor || 0xffffff);
    this.setScale(stats.bulletScale || 1);
    this.life = stats.bulletLife;
    this.pierce = stats.pierce;
    this.damage = stats.damage;
    this.speed = stats.bulletSpeed;
    this.critChance = stats.critChance || 0;
    this.critMult = stats.critMult || 2.0;
    this.burnChance = stats.burnChance || 0;
    this.burnDmg = stats.burnDmg || 0;
    this.chainChance = stats.chainChance || 0;
    this.chainCount = stats.chainCount || 0;
    this.explosionDmg = stats.explosionDmg || 0;
    this.explosionRadius = stats.explosionRadius || 0;
    this.ricochet = stats.ricochet || 0;
    this.homingStrength = stats.homingStrength || 0;
    this.splitOnHit = stats.splitOnHit || 0;
    this.slowOnHit = stats.slowOnHit || 0;
    this.chillOnHit = stats.chillOnHit || 0;
    this.hits = new Set();
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    if (!this.active) return;
    const dt = delta / 1000;
    this.life -= dt;
    if (this.life <= 0) { this.disableBody(true, true); return; }

    // Homing: gentle curve toward nearest enemy
    if (this.homingStrength > 0 && this.body) {
      const enemies = this.scene.enemies.getChildren();
      let best = null, bestD2 = 200 * 200;
      for (let i = 0; i < enemies.length; i++) {
        const e = enemies[i];
        if (!e.active || this.hits.has(e)) continue;
        const dx = e.x - this.x, dy = e.y - this.y;
        const d2 = dx*dx + dy*dy;
        if (d2 < bestD2) { bestD2 = d2; best = e; }
      }
      if (best) {
        const tx = best.x - this.x, ty = best.y - this.y;
        const tm = Math.sqrt(tx*tx + ty*ty) || 0.001;
        const targetVx = (tx / tm) * this.speed;
        const targetVy = (ty / tm) * this.speed;
        const k = Phaser.Math.Clamp(this.homingStrength * dt * 0.6, 0, 1);
        this.body.velocity.x = Phaser.Math.Linear(this.body.velocity.x, targetVx, k);
        this.body.velocity.y = Phaser.Math.Linear(this.body.velocity.y, targetVy, k);
        this.setRotation(Math.atan2(this.body.velocity.y, this.body.velocity.x));
      }
    }

    const s = this.scene;
    if (this.x < -20 || this.x > s.arenaWidth + 20 || this.y < -20 || this.y > s.arenaHeight + 20) {
      this.disableBody(true, true);
    }
  }
}
