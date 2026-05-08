import Phaser from 'phaser';

export default class Drone extends Phaser.GameObjects.Sprite {
  constructor(scene, owner) {
    super(scene, owner.x, owner.y, 'drone');
    scene.add.existing(this);
    this.scene = scene;
    this.owner = owner;
    this.orbitRadius = 38;
    this.orbitSpeed = 2.4;
    this.orbitAngle = Math.random() * Math.PI * 2;
    this.orbitOffset = 0;
    this.fireTimer = 0;
    this.setDepth(2);
  }

  setOrbitOffset(o) { this.orbitOffset = o; }

  update(time, delta) {
    const dt = delta / 1000;
    if (!this.owner || !this.owner.active) return;
    this.orbitAngle += this.orbitSpeed * dt;
    const a = this.orbitAngle + this.orbitOffset;
    this.x = this.owner.x + Math.cos(a) * this.orbitRadius;
    this.y = this.owner.y + Math.sin(a) * this.orbitRadius;
    this.setRotation(a + Math.PI / 2);

    this.fireTimer -= dt;
    if (this.fireTimer > 0) return;

    let target = null;
    let bestD2 = 18 * 18;
    const enemies = this.scene.enemies.getChildren();
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (!e.active) continue;
      const dx = e.x - this.x, dy = e.y - this.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < bestD2) { bestD2 = d2; target = e; }
    }
    if (target) {
      const stats = this.owner.stats;
      const baseDmg = stats.damage * 0.55 * (stats.droneDmgMult || 1);
      let dmg = baseDmg;
      let crit = false;
      if (stats.droneCrit && Math.random() < stats.critChance) {
        dmg *= stats.critMult;
        crit = true;
      }
      target.takeDamage(dmg, crit);
      this.scene.spawnHitFlash(target.x, target.y);
      this.fireTimer = 0.28;
    }
  }
}
