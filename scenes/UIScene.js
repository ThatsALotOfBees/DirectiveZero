import Phaser from 'phaser';
import { Palette, pixelText } from '../ui/HUD.js';

export default class UIScene extends Phaser.Scene {
  constructor() { super('UIScene'); }

  create(data) {
    this.gameScene = data.gameScene;
    const W = this.scale.width, H = this.scale.height;

    // Top-left run stats panel
    this.add.rectangle(8, 8, 240, 78, Palette.panel, 0.85)
      .setOrigin(0, 0).setStrokeStyle(1, Palette.border);
    this.timeText  = this.add.text(16, 14, 'TIME 00:00',  pixelText(13)).setOrigin(0, 0);
    this.waveText  = this.add.text(16, 30, 'WAVE 1',      pixelText(11, Palette.textSecondary)).setOrigin(0, 0);
    this.killsText = this.add.text(120, 30, 'K 0',         pixelText(11, Palette.textSecondary)).setOrigin(0, 0);
    this.levelText = this.add.text(16, 46, 'LV 1',         pixelText(11, Palette.textPrimary)).setOrigin(0, 0);
    this.aiText    = this.add.text(80, 46, 'AI: WANDER',   pixelText(10, Palette.textDim)).setOrigin(0, 0);
    this.dpsText   = this.add.text(16, 64, 'DPS 0',        pixelText(11, '#88ff88')).setOrigin(0, 0);
    this.modText   = this.add.text(120, 64, '',            pixelText(10, '#ffd34b')).setOrigin(0, 0);

    // HP bar — top center
    this.hpBg = this.add.rectangle(W / 2, 18, 320, 14, Palette.panel)
      .setStrokeStyle(1, Palette.border);
    this.hpFill = this.add.rectangle(W / 2 - 159, 18, 318, 12, Palette.hp).setOrigin(0, 0.5);
    this.hpText = this.add.text(W / 2, 18, '100/100', pixelText(10)).setOrigin(0.5);

    this.xpBg = this.add.rectangle(W / 2, 36, 320, 8, Palette.panel)
      .setStrokeStyle(1, Palette.border);
    this.xpFill = this.add.rectangle(W / 2 - 159, 36, 0, 6, Palette.xp).setOrigin(0, 0.5);

    // Right protocol panel
    this.add.rectangle(W - 8, 8, 200, 220, Palette.panel, 0.85)
      .setOrigin(1, 0).setStrokeStyle(1, Palette.border);
    this.add.text(W - 196, 14, 'PROTOCOLS',    pixelText(11, Palette.textPrimary)).setOrigin(0, 0);
    this.add.text(W - 196, 26, 'active perks',  pixelText(9, Palette.textDim)).setOrigin(0, 0);

    this.perksList = [];
    this.perkCounts = {};

    // Equipped weapon readout (bottom right)
    const w = this.gameScene.player.weapon;
    if (w) {
      this.add.rectangle(W - 8, H - 30, 220, 36, Palette.panel, 0.8)
        .setOrigin(1, 0.5).setStrokeStyle(1, Palette.border);
      this.add.text(W - 16, H - 38, 'WEAPON',
        pixelText(10, Palette.textDim, 0)).setOrigin(1, 0);
      this.add.text(W - 16, H - 22, w.name,
        pixelText(13, Palette.accentBright, 0)).setOrigin(1, 0);
    }

    // Footer
    this.add.text(W / 2, H - 14, 'OBSERVER UNIT — AUTONOMOUS — [ESC] pause · [M] mute',
      pixelText(10, Palette.textDim)).setOrigin(0.5);

    // Low-HP vignette overlay
    this.vignette = this.add.rectangle(0, 0, W, H, 0xff0000, 0).setOrigin(0, 0);
    this.vignette.setScrollFactor(0).setDepth(900);

    // Boss banner (hidden)
    this.bossBanner = this.add.container(W / 2, 100).setDepth(950);
    this.bossBanner.setVisible(false);
    this.bossBg = this.add.rectangle(0, 0, 380, 60, 0x1a0a1f, 0.92).setStrokeStyle(2, 0xff66dd);
    this.bossText = this.add.text(0, -8, '', pixelText(20, '#ff66dd', 2)).setOrigin(0.5);
    this.bossSub = this.add.text(0, 14, '', pixelText(11, Palette.textSecondary)).setOrigin(0.5);
    this.bossBanner.add([this.bossBg, this.bossText, this.bossSub]);

    if (this.gameScene.modifier && this.gameScene.modifier.id !== 'none') {
      this.modText.setText('MOD: ' + this.gameScene.modifier.name);
    }
  }

  showBossBanner(boss) {
    this.bossText.setText(boss.name);
    this.bossSub.setText('boss inbound');
    this.bossBanner.setAlpha(0).setScale(0.8).setVisible(true);
    this.tweens.add({ targets: this.bossBanner, alpha: 1, scale: 1, duration: 220, ease: 'Back.Out' });
    this.time.delayedCall(2400, () => {
      this.tweens.add({ targets: this.bossBanner, alpha: 0, duration: 280, onComplete: () => this.bossBanner.setVisible(false) });
    });
  }

  update() {
    const gs = this.gameScene;
    if (!gs || !gs.player) return;
    const p = gs.player;
    const t = gs.runTime;
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    this.timeText.setText('TIME ' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0'));
    const wave = Math.floor(t / 30) + 1;
    this.waveText.setText('WAVE ' + wave);
    this.killsText.setText('K ' + p.kills);
    this.levelText.setText('LV ' + p.level);
    this.aiText.setText('AI: ' + p.behaviorLabel.toUpperCase());
    this.dpsText.setText('DPS ' + Math.round(gs.dps || 0));

    const hpFrac = Phaser.Math.Clamp(p.hp / p.stats.maxHp, 0, 1);
    this.hpFill.width = 318 * hpFrac;
    if (hpFrac < 0.3) this.hpFill.setFillStyle(0xff3030);
    else if (hpFrac < 0.6) this.hpFill.setFillStyle(0xff8030);
    else this.hpFill.setFillStyle(0xff5050);
    this.hpText.setText(Math.max(0, Math.ceil(p.hp)) + '/' + Math.ceil(p.stats.maxHp));

    const xpFrac = Phaser.Math.Clamp(p.xp / p.xpToNext, 0, 1);
    this.xpFill.width = 318 * xpFrac;

    // Low HP red vignette
    if (hpFrac < 0.5) {
      const intensity = (0.5 - hpFrac) / 0.5; // 0..1
      const pulse = 0.7 + 0.3 * Math.sin(this.time.now * 0.008);
      this.vignette.fillAlpha = Math.min(0.35, intensity * 0.45 * pulse);
    } else {
      this.vignette.fillAlpha = 0;
    }
  }

  addPerk(perkId, perkName, rarity = 1) {
    const W = this.scale.width;
    if (this.perkCounts[perkId]) {
      const e = this.perkCounts[perkId];
      e.count += 1;
      e.text.setText(`${perkName} x${e.count}`);
      return;
    }
    const RARITY_COLORS = ['#cccccc','#dddddd','#9be08a','#7fdcb1','#6ed8d8','#5fa8ff','#7c8df0','#a76ee0','#c065ff','#ff7df0','#ff6f8a','#ff8b3a','#ffb347','#ffd34b','#ffe06f','#f6f6c0','#dabfff','#bff7ff','#ffffff','#ff4be0'];
    const color = RARITY_COLORS[Math.max(0, Math.min(19, rarity - 1))];
    const idx = this.perksList.length;
    const t = this.add.text(W - 196, 42 + idx * 13, perkName,
      pixelText(11, color, 0)).setOrigin(0, 0);
    this.perksList.push(t);
    this.perkCounts[perkId] = { count: 1, text: t };
  }
}
