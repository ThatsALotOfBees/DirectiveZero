import Phaser from 'phaser';
import { Palette, pixelText } from '../ui/HUD.js';
import { SaveSystem } from '../systems/SaveSystem.js';
import { Audio } from '../systems/AudioSystem.js';

export default class SettingsScene extends Phaser.Scene {
  constructor() { super('SettingsScene'); }

  create() {
    const W = this.scale.width, H = this.scale.height;
    this.cameras.main.setBackgroundColor('#080812');
    this.add.tileSprite(0, 0, W, H, 'floor').setOrigin(0, 0).setAlpha(0.4).setDepth(-100);
    this.add.rectangle(0, 0, W, H, 0x06060e, 0.6).setOrigin(0, 0).setDepth(-90);

    this.save = SaveSystem.load();
    if (!this.save.settings) this.save.settings = {};
    const s = this.save.settings;
    s.volume = s.volume ?? 0.4;
    s.musicVolume = s.musicVolume ?? 0.25;
    s.music = s.music ?? true;
    s.shake = s.shake ?? 1.0;
    s.damageNumbers = s.damageNumbers ?? true;

    this.add.text(W / 2, 50, 'SETTINGS',
      pixelText(26, Palette.textPrimary, 3)).setOrigin(0.5);

    let y = 130;
    this.makeSlider(W / 2, y, 'SFX Volume', s.volume, 0, 1, 0.05, (v) => { s.volume = v; Audio.setVolume(v); }); y += 56;
    this.makeSlider(W / 2, y, 'Music Volume', s.musicVolume, 0, 1, 0.05, (v) => { s.musicVolume = v; Audio.setMusicVolume(v); }); y += 56;
    this.makeSlider(W / 2, y, 'Screen Shake', s.shake, 0, 2, 0.1, (v) => { s.shake = v; }); y += 56;
    this.makeToggle(W / 2, y, 'Music', s.music, (v) => {
      s.music = v;
      if (v) Audio.startMusic(s.musicVolume); else Audio.stopMusic();
    }); y += 48;
    this.makeToggle(W / 2, y, 'Damage Numbers', s.damageNumbers, (v) => { s.damageNumbers = v; }); y += 48;

    // Fullscreen toggle
    this.makeToggle(W / 2, y, 'Fullscreen (F11)', this.scale.isFullscreen, (v) => {
      if (v) this.scale.startFullscreen(); else this.scale.stopFullscreen();
    }); y += 48;

    // Save & back
    const back = this.add.rectangle(W / 2, H - 60, 240, 44, Palette.panelBright).setStrokeStyle(2, Palette.accent);
    this.add.text(W / 2, H - 60, 'SAVE & BACK',
      pixelText(15, Palette.textPrimary, 0)).setOrigin(0.5);
    back.setInteractive({ useHandCursor: true });
    back.on('pointerover', () => back.setFillStyle(0x2a1a3a));
    back.on('pointerout',  () => back.setFillStyle(Palette.panelBright));
    back.on('pointerdown', () => {
      SaveSystem.save(this.save);
      Audio.click();
      this.scene.start('MenuScene');
    });
    this.input.keyboard.on('keydown-ESC', () => {
      SaveSystem.save(this.save);
      this.scene.start('MenuScene');
    });
  }

  makeSlider(cx, y, label, value, min, max, step, onChange) {
    const lbl = this.add.text(cx - 200, y, label, pixelText(13, Palette.textPrimary, 0)).setOrigin(0, 0.5);
    const trackW = 240;
    const track = this.add.rectangle(cx + 60, y, trackW, 10, Palette.panel).setStrokeStyle(1, Palette.border).setOrigin(0, 0.5);
    const fillW = ((value - min) / (max - min)) * trackW;
    const fill = this.add.rectangle(cx + 60, y, fillW, 8, Palette.accent).setOrigin(0, 0.5);
    const valTxt = this.add.text(cx + 60 + trackW + 16, y, value.toFixed(2),
      pixelText(12, Palette.accentBright, 0)).setOrigin(0, 0.5);
    track.setInteractive({ useHandCursor: true });
    track.on('pointerdown', (p) => {
      const localX = p.x - (cx + 60);
      const t = Phaser.Math.Clamp(localX / trackW, 0, 1);
      let v = min + t * (max - min);
      v = Math.round(v / step) * step;
      v = Phaser.Math.Clamp(v, min, max);
      fill.width = ((v - min) / (max - min)) * trackW;
      valTxt.setText(v.toFixed(2));
      onChange(v);
    });
  }

  makeToggle(cx, y, label, value, onChange) {
    const lbl = this.add.text(cx - 200, y, label, pixelText(13, Palette.textPrimary, 0)).setOrigin(0, 0.5);
    const bg = this.add.rectangle(cx + 60, y, 60, 24, value ? Palette.accent : Palette.panel).setStrokeStyle(1, Palette.border);
    const txt = this.add.text(cx + 60, y, value ? 'ON' : 'OFF', pixelText(11, value ? '#0a0a14' : Palette.textPrimary, 0)).setOrigin(0.5);
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerdown', () => {
      value = !value;
      bg.setFillStyle(value ? Palette.accent : Palette.panel);
      txt.setText(value ? 'ON' : 'OFF');
      txt.setColor(value ? '#0a0a14' : Palette.textPrimary);
      onChange(value);
    });
  }
}
