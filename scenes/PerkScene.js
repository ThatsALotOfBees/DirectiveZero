import Phaser from 'phaser';
import { pickRandomPerks, getAvailableFusions, rarityOf } from '../data/perks.js';
import { Palette, pixelText } from '../ui/HUD.js';
import { SaveSystem } from '../systems/SaveSystem.js';

const REROLL_COST = 5;

export default class PerkScene extends Phaser.Scene {
  constructor() { super('PerkScene'); }

  create(data) {
    this.gameScene = data.gameScene;
    this.picked = false;
    this.W = this.scale.width;
    this.H = this.scale.height;

    this.add.rectangle(0, 0, this.W, this.H, 0x000000, 0.65).setOrigin(0, 0);

    this.titleText = this.add.text(this.W / 2, 36, 'NEURAL UPGRADE',
      pixelText(26, Palette.textPrimary, 3)).setOrigin(0.5);
    this.subtitleText = this.add.text(this.W / 2, 64,
      `LV ${this.gameScene.player.level}` +
      (this.gameScene.pendingLevelUps > 1 ? `   (${this.gameScene.pendingLevelUps} level-ups queued)` : '') +
      `   —   choose a directive`,
      pixelText(13, Palette.textSecondary, 0)).setOrigin(0.5);

    this.cardObjs = [];
    this.choices = [];
    this.refresh();

    // Reroll / End-run buttons
    const btnY = this.H - 40;
    const save = SaveSystem.load();
    this.rerollBtn = this.makeBottomBtn(this.W / 2 - 110, btnY, 200, `REROLL (${REROLL_COST} RD)`, () => {
      const cur = SaveSystem.load();
      if (cur.research < REROLL_COST) return;
      cur.research -= REROLL_COST;
      this.gameScene.save.research = cur.research;
      SaveSystem.save(cur);
      this.gameScene.audio.click();
      this.refresh();
    });
    this.makeBottomBtn(this.W / 2 + 110, btnY, 200, 'END RUN', () => {
      this.gameScene.audio.click();
      this.scene.stop();
      this.gameScene.endRunEarly();
    });
  }

  refresh() {
    // Clear existing cards
    this.cardObjs.forEach(o => o.destroy());
    this.cardObjs = [];

    const owned = this.gameScene.player.ownedPerks;
    const banned = this.gameScene.bannedPerks || new Set();
    const exclude = new Set([...owned, ...banned]);
    this.choices = pickRandomPerks(3, exclude);
    const fusions = getAvailableFusions(owned);
    if (fusions.length > 0) {
      const fusion = fusions[Math.floor(Math.random() * fusions.length)];
      this.choices.push(fusion);
    }

    const cardW = 200, cardH = 240, gap = 20;
    const totalW = cardW * this.choices.length + gap * (this.choices.length - 1);
    const startX = (this.W - totalW) / 2;
    const cardY = (this.H - cardH) / 2 + 16;

    this.choices.forEach((perk, i) => {
      const x = startX + i * (cardW + gap);
      const objs = this.makeCard(x, cardY, cardW, cardH, perk, i + 1, !!perk.requires);
      this.cardObjs.push(...objs);
    });

    // Re-bind hotkeys
    this.input.keyboard.removeAllListeners('keydown-ONE');
    this.input.keyboard.removeAllListeners('keydown-TWO');
    this.input.keyboard.removeAllListeners('keydown-THREE');
    this.input.keyboard.removeAllListeners('keydown-FOUR');
    this.input.keyboard.removeAllListeners('keydown-R');
    if (this.choices[0]) this.input.keyboard.once('keydown-ONE',   () => this.pick(this.choices[0]));
    if (this.choices[1]) this.input.keyboard.once('keydown-TWO',   () => this.pick(this.choices[1]));
    if (this.choices[2]) this.input.keyboard.once('keydown-THREE', () => this.pick(this.choices[2]));
    if (this.choices[3]) this.input.keyboard.once('keydown-FOUR',  () => this.pick(this.choices[3]));
    this.input.keyboard.on('keydown-R', () => {
      if (this.gameScene.save.research >= REROLL_COST) {
        this.gameScene.save.research -= REROLL_COST;
        SaveSystem.save(this.gameScene.save);
        this.gameScene.audio.click();
        this.refresh();
      }
    });
  }

  makeBottomBtn(x, y, w, label, onClick) {
    const bg = this.add.rectangle(x, y, w, 30, Palette.panel).setStrokeStyle(1, Palette.border);
    const txt = this.add.text(x, y, label, pixelText(12, Palette.textPrimary, 0)).setOrigin(0.5);
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerover', () => bg.setFillStyle(Palette.panelBright));
    bg.on('pointerout',  () => bg.setFillStyle(Palette.panel));
    bg.on('pointerdown', onClick);
    return bg;
  }

  makeCard(x, y, w, h, perk, hotkey, isFusion) {
    const r = rarityOf(perk.rarity);
    const rcolor = Phaser.Display.Color.HexStringToColor(r.color).color;
    const bg = this.add.rectangle(x, y, w, h, isFusion ? 0x1c1030 : Palette.panel)
      .setOrigin(0, 0).setStrokeStyle(isFusion ? 3 : 2, rcolor);
    bg.setInteractive({ useHandCursor: true });

    const badge = this.add.rectangle(x + w / 2, y + 16, w - 24, 20, rcolor, 0.18).setStrokeStyle(1, rcolor);
    const badgeTxt = this.add.text(x + w / 2, y + 16,
      isFusion ? `FUSION · ${r.name.toUpperCase()}` : `T${perk.rarity} · ${r.name.toUpperCase()}`,
      pixelText(10, r.color, 0)).setOrigin(0.5);

    const title = this.add.text(x + w / 2, y + 52, perk.name,
      pixelText(15, Palette.textPrimary, 2)).setOrigin(0.5);

    const icon = this.add.rectangle(x + w / 2, y + 110, 56, 56, rcolor).setStrokeStyle(2, 0xffffff);
    const sigil = this.add.text(x + w / 2, y + 110, perk.name.charAt(0),
      pixelText(28, '#0a0a14', 0)).setOrigin(0.5);

    const desc = this.add.text(x + w / 2, y + 156, perk.desc, {
      ...pixelText(11, Palette.textSecondary, 0),
      align: 'center',
      wordWrap: { width: w - 24 }
    }).setOrigin(0.5, 0);

    const hk = this.add.text(x + 12, y + h - 34, `[${hotkey}]`, pixelText(10, Palette.textDim, 0)).setOrigin(0, 0.5);
    const sel = this.add.text(x + w - 12, y + h - 34, 'select', pixelText(10, Palette.textDim, 0)).setOrigin(1, 0.5);

    // Banish — small × in corner; banishes from this run
    const banBg = this.add.rectangle(x + w - 22, y + 22, 22, 22, 0x14141d).setStrokeStyle(1, 0x6e1fad);
    const banTxt = this.add.text(x + w - 22, y + 22, '×', pixelText(14, '#ff6f8a', 0)).setOrigin(0.5);
    banBg.setInteractive({ useHandCursor: true });
    banBg.on('pointerdown', (ev) => {
      ev.event && ev.event.stopPropagation && ev.event.stopPropagation();
      if (perk.id) this.gameScene.bannedPerks?.add(perk.id);
      this.gameScene.audio.click();
      this.refresh();
    });

    let fusionTxt = null;
    if (isFusion) fusionTxt = this.add.text(x + w / 2, y + h - 56, '◇ FUSION ◇', pixelText(10, '#ffd34b', 0)).setOrigin(0.5);

    bg.on('pointerover', () => { bg.setFillStyle(isFusion ? 0x261540 : Palette.panelBright); icon.setFillStyle(0xffffff); sigil.setColor(r.color); });
    bg.on('pointerout',  () => { bg.setFillStyle(isFusion ? 0x1c1030 : Palette.panel); icon.setFillStyle(rcolor); sigil.setColor('#0a0a14'); });
    bg.on('pointerdown', () => this.pick(perk));

    return [bg, badge, badgeTxt, title, icon, sigil, desc, hk, sel, banBg, banTxt, ...(fusionTxt ? [fusionTxt] : [])];
  }

  pick(perk) {
    if (!perk || this.picked) return;
    this.picked = true;
    this.gameScene.audio.click();
    this.gameScene.applyPerk(perk.id);

    const ui = this.scene.get('UIScene');
    if (ui && ui.addPerk) ui.addPerk(perk.id, perk.name, perk.rarity);

    this.gameScene.events.emit('resumeFromPerk');
    this.scene.stop();
  }
}
