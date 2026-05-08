import Phaser from 'phaser';
import { Palette, pixelText } from '../ui/HUD.js';
import { Audio } from '../systems/AudioSystem.js';
import { pickRandomModifiers } from '../data/modifiers.js';
import { rarityOf } from '../data/perks.js';

export default class RunModifierScene extends Phaser.Scene {
  constructor() { super('RunModifierScene'); }

  create() {
    const W = this.scale.width, H = this.scale.height;
    this.cameras.main.setBackgroundColor('#06060e');
    this.add.tileSprite(0, 0, W, H, 'floor').setOrigin(0, 0).setAlpha(0.4).setDepth(-100);
    this.add.rectangle(0, 0, W, H, 0x06060e, 0.6).setOrigin(0, 0).setDepth(-90);

    this.add.text(W / 2, 60, 'RUN PROTOCOL',
      pixelText(26, Palette.textPrimary, 3)).setOrigin(0.5);
    this.add.text(W / 2, 90, 'Pick a modifier for this run.',
      pixelText(13, Palette.textSecondary, 0)).setOrigin(0.5);

    const choices = pickRandomModifiers(3);
    const cardW = 240, cardH = 260, gap = 24;
    const totalW = cardW * choices.length + gap * (choices.length - 1);
    const startX = (W - totalW) / 2;
    const cardY = (H - cardH) / 2 + 24;

    choices.forEach((mod, i) => {
      const x = startX + i * (cardW + gap);
      this.makeCard(x, cardY, cardW, cardH, mod, i + 1);
    });

    // Skip / quick start
    const back = this.add.text(24, H - 24, '« back',
      pixelText(12, Palette.textDim, 0)).setOrigin(0, 1).setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => this.scene.start('MenuScene'));

    if (choices[0]) this.input.keyboard.once('keydown-ONE',   () => this.pick(choices[0]));
    if (choices[1]) this.input.keyboard.once('keydown-TWO',   () => this.pick(choices[1]));
    if (choices[2]) this.input.keyboard.once('keydown-THREE', () => this.pick(choices[2]));
    this.input.keyboard.on('keydown-ESC', () => this.scene.start('MenuScene'));
  }

  makeCard(x, y, w, h, mod, hotkey) {
    const r = rarityOf(mod.rarity);
    const rcolor = Phaser.Display.Color.HexStringToColor(r.color).color;
    const bg = this.add.rectangle(x, y, w, h, Palette.panel).setOrigin(0, 0).setStrokeStyle(2, rcolor);
    bg.setInteractive({ useHandCursor: true });

    const badge = this.add.rectangle(x + w / 2, y + 18, w - 24, 22, rcolor, 0.18).setStrokeStyle(1, rcolor);
    this.add.text(x + w / 2, y + 18, `T${mod.rarity} · ${r.name.toUpperCase()}`,
      pixelText(10, r.color, 0)).setOrigin(0.5);

    this.add.text(x + w / 2, y + 60, mod.name,
      pixelText(17, Palette.textPrimary, 2)).setOrigin(0.5);

    const icon = this.add.rectangle(x + w / 2, y + 120, 64, 64, rcolor).setStrokeStyle(2, 0xffffff);
    this.add.text(x + w / 2, y + 120, mod.name.charAt(0), pixelText(30, '#0a0a14', 0)).setOrigin(0.5);

    this.add.text(x + w / 2, y + 170, mod.desc, {
      ...pixelText(12, Palette.textSecondary, 0),
      align: 'center',
      wordWrap: { width: w - 24 }
    }).setOrigin(0.5, 0);

    this.add.text(x + 12, y + h - 20, `[${hotkey}]`, pixelText(11, Palette.textDim, 0)).setOrigin(0, 0.5);
    this.add.text(x + w - 12, y + h - 20, 'select', pixelText(11, Palette.textDim, 0)).setOrigin(1, 0.5);

    bg.on('pointerover', () => bg.setFillStyle(Palette.panelBright));
    bg.on('pointerout',  () => bg.setFillStyle(Palette.panel));
    bg.on('pointerdown', () => this.pick(mod));
  }

  pick(mod) {
    Audio.init(); Audio.resume(); Audio.click();
    this.scene.start('GameScene', { modifierId: mod.id });
  }
}
