import Phaser from 'phaser';
import { Palette, pixelText } from '../ui/HUD.js';
import { findOre } from '../data/materials.js';

export default class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }

  create(data) {
    const W = this.scale.width, H = this.scale.height;
    this.add.rectangle(0, 0, W, H, Palette.bg).setOrigin(0, 0);

    this.add.text(W / 2, H / 2 - 160, 'OBSERVER UNIT — TERMINATED',
      pixelText(22, '#ff5050', 3)).setOrigin(0.5);
    this.add.text(W / 2, H / 2 - 130, 'directive zero — neural matrix preserved',
      pixelText(11, Palette.textDim, 0)).setOrigin(0.5);

    const m = Math.floor(data.time / 60);
    const s = Math.floor(data.time % 60);
    const lines = [
      `Survival     ${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`,
      `Kills        ${data.kills}`,
      `Level        ${data.level}`,
      ``,
      `+ ${data.earned} Research Data`
    ];
    this.add.text(W / 2, H / 2 - 60, lines.join('\n'), {
      ...pixelText(14, Palette.textPrimary, 0),
      align: 'center',
      lineSpacing: 8
    }).setOrigin(0.5);

    // Ore drops
    const ores = data.oresGained || {};
    const oreEntries = Object.entries(ores).filter(([, n]) => n > 0);
    if (oreEntries.length > 0) {
      const lines2 = oreEntries.map(([k, n]) => {
        const o = findOre(k);
        return `+ ${n}× ${o ? o.name : k}`;
      }).join('   ');
      this.add.text(W / 2, H / 2 + 30, lines2, pixelText(13, Palette.accentBright, 0)).setOrigin(0.5);
    } else {
      this.add.text(W / 2, H / 2 + 30, 'no ore recovered', pixelText(11, Palette.textDim, 0)).setOrigin(0.5);
    }

    // Newly unlocked achievements
    const ach = data.newAchievements || [];
    if (ach.length > 0) {
      this.add.text(W / 2, H / 2 + 60, `★ ${ach.length} ACHIEVEMENT${ach.length > 1 ? 'S' : ''} UNLOCKED ★`,
        pixelText(13, '#ffd34b', 2)).setOrigin(0.5);
      ach.slice(0, 3).forEach((a, i) => {
        this.add.text(W / 2, H / 2 + 80 + i * 16, `${a.name}  +${a.reward} RD`,
          pixelText(11, '#ffe06f', 0)).setOrigin(0.5);
      });
    }

    const btn = this.add.rectangle(W / 2, H / 2 + 130, 220, 40, Palette.panel).setStrokeStyle(2, Palette.accent);
    this.add.text(W / 2, H / 2 + 130, 'CONTINUE',
      pixelText(15, Palette.textPrimary, 0)).setOrigin(0.5);
    btn.setInteractive({ useHandCursor: true });
    btn.on('pointerover', () => btn.setFillStyle(Palette.panelBright));
    btn.on('pointerout',  () => btn.setFillStyle(Palette.panel));
    btn.on('pointerdown', () => this.scene.start('MenuScene'));

    this.input.keyboard.once('keydown-SPACE', () => this.scene.start('MenuScene'));
    this.input.keyboard.once('keydown-ENTER', () => this.scene.start('MenuScene'));
  }
}
