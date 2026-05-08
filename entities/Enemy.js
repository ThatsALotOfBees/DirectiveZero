import Phaser from 'phaser';

export default class Enemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'enemy');
    this.scene = scene;
  }

  spawn(x, y, hp, speed, damage, type) {
    this.enableBody(true, x, y, true, true);
    this.setActive(true).setVisible(true);
    this.type = type || null;
    const tex = type && type.texture ? type.texture : 'enemy';
    if (this.scene.textures.exists(tex)) this.setTexture(tex);
    const sc = type ? (type.scale || 1) : 1;
    this.setScale(sc);
    if (this.body) {
      this.body.setSize(8, 8);
      this.body.setOffset(1, 1);
    }
    this.maxHp = hp;
    this.hp = hp;
    this.speed = speed;
    this.damage = damage;
    this.attackTimer = 0;
    this.fireTimer = type && type.ranged ? 1.0 + Math.random() * (type.fireInterval || 1.5) : 0;
    this.burnTimer = 0;
    this.burnDmg = 0;
    this.burnTickTimer = 0;
    this.flashTimer = 0;
    this.slowTimer = 0;
    this.slowFactor = 1;
    this.clearTint();
    this.setAlpha(1);
  }

  takeDamage(amount, isCrit = false) {
    if (!this.active) return false;
    this.hp -= amount;
    this.flashTimer = 0.07;
    this.scene.spawnDamageNumber(this.x, this.y - 8 * this.scaleY, Math.ceil(amount), isCrit ? '#ffc94a' : '#ffffff', isCrit);
    if (this.hp <= 0) { this.die(); return true; }
    return false;
  }

  applyBurn(damage, duration) {
    this.burnDmg = Math.max(this.burnDmg, damage);
    this.burnTimer = Math.max(this.burnTimer, duration);
  }

  applySlow(factor, duration) {
    this.slowFactor = Math.min(this.slowFactor, factor);
    this.slowTimer = Math.max(this.slowTimer, duration);
  }

  die() {
    this.scene.onEnemyDeath(this);
    this.disableBody(true, true);
  }

  update(time, delta) {
    if (!this.active) return;
    const dt = delta / 1000;

    // Visual flash / status tints
    if (this.flashTimer > 0) {
      this.flashTimer -= dt;
      this.setTint(0xffffff);
    } else if (this.slowTimer > 0) {
      this.setTint(0x88ccff);
    } else if (this.burnTimer > 0) {
      this.setTint(0xff6620);
    } else {
      this.clearTint();
    }

    // Burn DoT
    if (this.burnTimer > 0) {
      this.burnTimer -= dt;
      const tickRate = (this.scene.player?.stats?.burnTickRate || 1);
      this.burnTickTimer += dt * tickRate;
      if (this.burnTickTimer >= 0.4) {
        this.burnTickTimer = 0;
        this.takeDamage(this.burnDmg);
        if (!this.active) return;
        // Burn spread (PYRE BLOOM)
        if (this.scene.player?.stats?.burnSpread) {
          const list = this.scene.enemies.getChildren();
          for (let i = 0; i < list.length; i++) {
            const e = list[i];
            if (!e.active || e === this || e.burnTimer > 0) continue;
            const dx = e.x - this.x, dy = e.y - this.y;
            if (dx*dx + dy*dy < 60*60) e.applyBurn(this.burnDmg, 1.2);
          }
        }
      }
    }

    // Slow timer
    if (this.slowTimer > 0) {
      this.slowTimer -= dt;
      if (this.slowTimer <= 0) this.slowFactor = 1;
    }

    const player = this.scene.player;
    if (!player || !player.active) {
      if (this.body) this.body.setVelocity(0, 0);
      return;
    }
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const d = Math.sqrt(dx * dx + dy * dy) || 0.001;

    // Ranged enemies hover at distance and fire
    if (this.type && this.type.ranged) {
      const desired = this.type.rangedDist || 180;
      const margin = 30;
      let vx = 0, vy = 0;
      if (d > desired + margin) {
        vx = (dx / d) * this.speed;
        vy = (dy / d) * this.speed;
      } else if (d < desired - margin) {
        vx = -(dx / d) * this.speed * 0.6;
        vy = -(dy / d) * this.speed * 0.6;
      } else {
        // strafe perpendicular
        const px = -dy / d, py = dx / d;
        vx = px * this.speed * 0.4;
        vy = py * this.speed * 0.4;
      }
      if (this.body) this.body.setVelocity(vx * this.slowFactor, vy * this.slowFactor);

      this.fireTimer -= dt;
      if (this.fireTimer <= 0 && d < 360) {
        this.fireTimer = this.type.fireInterval || 1.6;
        const speed = this.type.bulletSpeed || 160;
        const bvx = (dx / d) * speed;
        const bvy = (dy / d) * speed;
        this.scene.spawnEnemyBullet(this.x, this.y, bvx, bvy, this.type.bulletDmg || 5);
      }
    } else {
      // Pursue and contact-attack
      if (this.body) this.body.setVelocity((dx / d) * this.speed * this.slowFactor, (dy / d) * this.speed * this.slowFactor);
      this.attackTimer -= dt;
      if (d < 14 * this.scaleY && this.attackTimer <= 0) {
        player.takeDamage(this.damage);
        // Thorns
        if (player.stats.thorns > 0) this.takeDamage(player.stats.thorns);
        this.attackTimer = 0.6;
      }
    }
  }
}
