import Phaser from 'phaser';

export default class EnemyBullet extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'enemy_bullet');
    this.scene = scene;
  }

  fire(x, y, vx, vy, damage) {
    this.enableBody(true, x, y, true, true);
    this.setActive(true).setVisible(true);
    if (this.body) {
      this.body.setSize(4, 4);
      this.body.setOffset(0, 0);
      this.body.setVelocity(vx, vy);
    }
    this.damage = damage;
    this.life = 3.0;
    this.setRotation(Math.atan2(vy, vx));
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    if (!this.active) return;
    this.life -= delta / 1000;
    if (this.life <= 0) { this.disableBody(true, true); return; }
    const s = this.scene;
    if (this.x < -20 || this.x > s.arenaWidth + 20 || this.y < -20 || this.y > s.arenaHeight + 20) {
      this.disableBody(true, true);
    }
  }
}
