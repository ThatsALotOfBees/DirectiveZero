import Phaser from 'phaser';

export default class XPShard extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'xp');
    this.scene = scene;
  }

  spawn(x, y, value) {
    this.enableBody(true, x, y, true, true);
    this.setActive(true);
    this.setVisible(true);
    if (this.body) {
      this.body.setSize(6, 6);
      this.body.setOffset(0, 0);
      this.body.setVelocity(0, 0);
    }
    this.value = value;
    this.bobPhase = Math.random() * Math.PI * 2;
    this.setScale(1);
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    if (!this.active) return;
    // tiny pulsing scale so shards feel alive
    const s = 1 + Math.sin(time * 0.006 + this.bobPhase) * 0.08;
    this.setScale(s);
  }
}
