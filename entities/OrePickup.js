import Phaser from 'phaser';

export default class OrePickup extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'ore_crude');
    this.scene = scene;
  }

  spawn(x, y, oreId, qty) {
    this.enableBody(true, x, y, true, true);
    this.setActive(true).setVisible(true);
    if (this.body) {
      this.body.setSize(8, 8);
      this.body.setOffset(0, 0);
      this.body.setVelocity(0, 0);
    }
    const tex = 'ore_' + oreId.replace('Ore', '').replace('Shard', '_shard').replace('Core', '_core').toLowerCase();
    if (this.scene.textures.exists(tex)) this.setTexture(tex);
    else this.setTexture('ore_crude');
    this.oreId = oreId;
    this.qty = qty || 1;
    this.bobPhase = Math.random() * Math.PI * 2;
    // small pop on spawn
    this.setScale(0.2);
    this.scene.tweens.add({ targets: this, scale: 1, duration: 220, ease: 'Back.Out' });
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    if (!this.active) return;
    const s = 1 + Math.sin(time * 0.005 + this.bobPhase) * 0.07;
    this.setScale(s);
  }
}
