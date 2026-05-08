import Phaser from 'phaser';
import { Palette, pixelText } from '../ui/HUD.js';

export default class PauseScene extends Phaser.Scene {
  constructor() { super('PauseScene'); }

  create(data) {
    this.gameScene = data.gameScene;
    const W = this.scale.width, H = this.scale.height;

    this.add.rectangle(0, 0, W, H, 0x000000, 0.7).setOrigin(0, 0);

    this.add.text(W / 2, H / 2 - 140, 'PAUSED',
      pixelText(28, Palette.textPrimary, 3)).setOrigin(0.5);
    this.add.text(W / 2, H / 2 - 110, 'Observer Unit holding position',
      pixelText(13, Palette.textDim, 0)).setOrigin(0.5);

    const btnY = H / 2 - 40;
    const gap = 50;
    this.makeBtn(W / 2, btnY,            'RESUME',          () => this.resume(), true);
    this.makeBtn(W / 2, btnY + gap,      'END RUN',          () => {
      this.scene.stop();
      this.gameScene.endRunEarly();
    });
    this.makeBtn(W / 2, btnY + gap * 2,  'QUIT TO MENU',     () => {
      this.scene.stop('UIScene');
      this.scene.stop('GameScene');
      this.scene.stop();
      this.scene.start('MenuScene');
    });

    this.add.text(W / 2, H - 40, 'ESC to resume',
      pixelText(11, Palette.textDim, 0)).setOrigin(0.5);
    this.input.keyboard.on('keydown-ESC', () => this.resume());
  }

  resume() {
    this.gameScene.resumeFromPause();
    this.scene.stop();
  }

  makeBtn(x, y, label, onClick, primary = false) {
    const w = 240, h = 40;
    const fill = primary ? Palette.panelBright : Palette.panel;
    const bg = this.add.rectangle(x, y, w, h, fill).setStrokeStyle(2, primary ? Palette.accent : Palette.border);
    const txt = this.add.text(x, y, label, pixelText(15, Palette.textPrimary, 0)).setOrigin(0.5);
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerover', () => bg.setFillStyle(0x2a1a3a));
    bg.on('pointerout',  () => bg.setFillStyle(fill));
    bg.on('pointerdown', onClick);
    return { bg, txt };
  }
}
