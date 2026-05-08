import Phaser from 'phaser';
import { SaveSystem } from '../systems/SaveSystem.js';
import { Audio } from '../systems/AudioSystem.js';
import { Palette, pixelText } from '../ui/HUD.js';
import { findWeapon } from '../data/weapons.js';

export default class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    this.cameras.main.setBackgroundColor('#070710');
    this.add.tileSprite(0, 0, W, H, 'floor').setOrigin(0, 0).setAlpha(0.5).setDepth(-100);
    this.add.rectangle(0, 0, W, H, 0x07070f, 0.6).setOrigin(0, 0).setDepth(-90);

    this.save = SaveSystem.load();

    // Title
    this.add.text(W / 2, 60, 'DIRECTIVE ZERO',
      pixelText(36, Palette.textPrimary, 4)).setOrigin(0.5);
    this.add.text(W / 2, 96, 'Observer Unit Combat Simulation',
      pixelText(13, Palette.textSecondary, 0)).setOrigin(0.5);

    // Currency / equipped weapon strip
    const stripY = 130;
    this.add.text(W / 2, stripY,
      `RESEARCH DATA: ${this.save.research}`,
      pixelText(15, Palette.accent, 2)).setOrigin(0.5);

    const equipped = findWeapon(this.save.equippedWeapon || 'pulse_carbine');
    this.add.text(W / 2, stripY + 26,
      `Equipped: ${equipped ? equipped.name : 'Pulse Carbine'}`,
      pixelText(13, Palette.textSecondary, 0)).setOrigin(0.5);

    // Best stats
    const s = this.save.stats;
    const m = Math.floor(s.bestTime / 60);
    const sec = Math.floor(s.bestTime % 60);
    this.add.text(W / 2, stripY + 50,
      `Best:  ${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}   Kills ${s.bestKills}   Level ${s.bestLevel}   Runs ${s.runs}`,
      pixelText(12, Palette.textDim, 0)).setOrigin(0.5);

    // Buttons
    const btnY = 220;
    const btnGap = 50;
    this.makeButton(W / 2, btnY,           'INITIATE RUN', () => {
      Audio.init(); Audio.resume(); Audio.click();
      this.scene.start('RunModifierScene');
    }, true);
    this.makeButton(W / 2, btnY + btnGap,  'WORKSHOP',     () => { Audio.click(); this.scene.start('WorkshopScene'); });
    this.makeButton(W / 2, btnY + btnGap*2,'CODEX',        () => { Audio.click(); this.scene.start('CodexScene'); });
    this.makeButton(W / 2, btnY + btnGap*3,'SETTINGS',     () => { Audio.click(); this.scene.start('SettingsScene'); });

    // Wipe save link
    const reset = this.add.text(W - 16, H - 14, '[ wipe save data ]',
      pixelText(11, Palette.textDim, 0)).setOrigin(1, 1);
    reset.setInteractive({ useHandCursor: true });
    reset.on('pointerover', () => reset.setColor('#ff6666'));
    reset.on('pointerout',  () => reset.setColor('#9c83c8'));
    reset.on('pointerdown', () => {
      if (confirm('Wipe all save data? This cannot be undone.')) {
        SaveSystem.reset();
        this.scene.restart();
      }
    });

    this.add.text(16, H - 14, 'F11 fullscreen · M mute',
      pixelText(11, Palette.textDim, 0)).setOrigin(0, 1);

    this.input.keyboard.once('keydown-SPACE', () => {
      Audio.init(); Audio.resume();
      this.scene.start('RunModifierScene');
    });
  }

  makeButton(x, y, label, onClick, primary = false) {
    const w = 280, h = 44;
    const fill = primary ? Palette.panelBright : Palette.panel;
    const border = primary ? Palette.accent : Palette.border;
    const bg = this.add.rectangle(x, y, w, h, fill).setStrokeStyle(2, border);
    const text = this.add.text(x, y, label,
      pixelText(16, Palette.textPrimary, 0)).setOrigin(0.5);
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerover', () => { bg.setFillStyle(0x2a1a3a); text.setColor('#ffffff'); });
    bg.on('pointerout',  () => { bg.setFillStyle(fill); text.setColor(Palette.textPrimary); });
    bg.on('pointerdown', onClick);
    return { bg, text };
  }
}
