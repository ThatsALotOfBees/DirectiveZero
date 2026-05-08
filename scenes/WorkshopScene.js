import Phaser from 'phaser';
import { SaveSystem } from '../systems/SaveSystem.js';
import { Audio } from '../systems/AudioSystem.js';
import { Palette, pixelText } from '../ui/HUD.js';
import { UPGRADES, TRACKS, canAfford, payFor, isOwned, tierUnlocked, describeCost } from '../data/upgrades.js';
import { ORES, INGOTS, RECIPES, findOre, findIngot } from '../data/materials.js';
import { WEAPONS, canCraftWeapon, craftWeapon, describeRecipe } from '../data/weapons.js';
import { rarityOf } from '../data/perks.js';

const TABS = ['UPGRADES', 'SMELTER', 'WEAPONS', 'INVENTORY'];

export default class WorkshopScene extends Phaser.Scene {
  constructor() { super('WorkshopScene'); }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;
    this.W = W; this.H = H;

    this.cameras.main.setBackgroundColor('#080812');
    this.add.tileSprite(0, 0, W, H, 'floor').setOrigin(0, 0).setAlpha(0.4).setDepth(-100);
    this.add.rectangle(0, 0, W, H, 0x06060e, 0.6).setOrigin(0, 0).setDepth(-90);

    this.save = SaveSystem.load();
    this.activeTab = 'UPGRADES';
    this.scrollY = 0;
    this.maxScroll = 0;

    // Header
    this.add.text(24, 18, 'WORKSHOP', pixelText(22, Palette.textPrimary, 3)).setOrigin(0, 0);
    this.researchText = this.add.text(W - 24, 22,
      this.statusLine(),
      pixelText(13, Palette.accent, 0)).setOrigin(1, 0);

    // Tabs
    this.tabContainer = this.add.container(0, 56);
    TABS.forEach((label, i) => {
      const x = 24 + i * 158;
      const btn = this.add.rectangle(x, 0, 150, 32, Palette.panel).setOrigin(0, 0).setStrokeStyle(1, Palette.border);
      const txt = this.add.text(x + 75, 16, label, pixelText(13, Palette.textPrimary, 0)).setOrigin(0.5);
      btn.setInteractive({ useHandCursor: true });
      btn.on('pointerdown', () => { Audio.click(); this.setTab(label); });
      btn.on('pointerover', () => { if (this.activeTab !== label) btn.setFillStyle(Palette.panelBright); });
      btn.on('pointerout',  () => { if (this.activeTab !== label) btn.setFillStyle(Palette.panel); });
      this.tabContainer.add([btn, txt]);
      btn._label = label; btn._txt = txt;
      this.tabContainer[`tab_${label}`] = btn;
    });

    // Content area (clipped via mask)
    const contentTop = 100;
    const contentBottom = H - 56;
    this.contentTop = contentTop;
    this.contentBottom = contentBottom;
    this.viewport = this.add.rectangle(0, contentTop, W, contentBottom - contentTop, 0x0c0c14, 0.4).setOrigin(0, 0);
    this.viewport.setStrokeStyle(1, Palette.border);

    this.list = this.add.container(0, contentTop);
    const maskShape = this.add.graphics().setVisible(false);
    maskShape.fillRect(0, contentTop, W, contentBottom - contentTop);
    this.list.setMask(maskShape.createGeometryMask());
    this.maskShape = maskShape;

    // Back button
    const back = this.add.rectangle(24, H - 36, 140, 32, Palette.panel).setOrigin(0, 0).setStrokeStyle(1, Palette.border);
    const backTxt = this.add.text(94, H - 20, 'BACK', pixelText(14, Palette.textPrimary, 0)).setOrigin(0.5);
    back.setInteractive({ useHandCursor: true });
    back.on('pointerover', () => back.setFillStyle(Palette.panelBright));
    back.on('pointerout',  () => back.setFillStyle(Palette.panel));
    back.on('pointerdown', () => { Audio.click(); this.scene.start('MenuScene'); });
    this.input.keyboard.on('keydown-ESC', () => this.scene.start('MenuScene'));

    // Scroll wheel
    this.input.on('wheel', (_p, _objs, _dx, dy) => {
      this.scrollY += dy * 0.4;
      this.scrollY = Phaser.Math.Clamp(this.scrollY, 0, this.maxScroll);
      this.list.y = this.contentTop - this.scrollY;
    });

    // Tooltips area
    this.tooltipText = this.add.text(W / 2, H - 22, '', pixelText(11, Palette.textDim, 0)).setOrigin(0.5);

    this.setTab('UPGRADES');
  }

  statusLine() {
    return `Research ${this.save.research}   ` +
      ORES.map(o => `${this.save.materials[o.id]||0}× ${o.name.split(' ')[0]}`).join('  ');
  }

  refreshStatus() {
    this.researchText.setText(this.statusLine());
  }

  setTab(label) {
    const tabChanged = this.activeTab !== label;
    this.activeTab = label;
    TABS.forEach(l => {
      const btn = this.tabContainer[`tab_${l}`];
      if (btn) btn.setFillStyle(l === label ? Palette.accent : Palette.panel);
      if (btn && btn._txt) btn._txt.setColor(l === label ? '#0a0a14' : Palette.textPrimary);
    });
    if (tabChanged) this.scrollY = 0;
    this.list.removeAll(true);

    if (label === 'UPGRADES')   this.buildUpgrades();
    else if (label === 'SMELTER')   this.buildSmelter();
    else if (label === 'WEAPONS')   this.buildWeapons();
    else if (label === 'INVENTORY') this.buildInventory();

    this.scrollY = Phaser.Math.Clamp(this.scrollY, 0, this.maxScroll);
    this.list.y = this.contentTop - this.scrollY;
  }

  // ===== UPGRADES =====
  buildUpgrades() {
    let y = 12;
    TRACKS.forEach(track => {
      const header = this.add.text(24, y, track.name.toUpperCase(),
        pixelText(15, Palette.accentBright, 0)).setOrigin(0, 0);
      const sub = this.add.text(24, y + 18, track.desc,
        pixelText(11, Palette.textDim, 0)).setOrigin(0, 0);
      this.list.add([header, sub]);
      y += 38;
      const trackUpgrades = UPGRADES.filter(u => u.track === track.id);
      trackUpgrades.forEach(u => {
        const row = this.makeUpgradeRow(u, y);
        this.list.add(row);
        y += 46;
      });
      y += 10;
    });
    this.maxScroll = Math.max(0, y + 20 - (this.contentBottom - this.contentTop));
  }

  makeUpgradeRow(u, y) {
    const W = this.W;
    const owned = isOwned(u, this.save);
    const unlocked = tierUnlocked(u, this.save);
    const afford = canAfford(u, this.save);

    const bg = this.add.rectangle(24, y, W - 48, 40, owned ? 0x1c2a1c : Palette.panel)
      .setOrigin(0, 0).setStrokeStyle(1, owned ? 0x55aa55 : Palette.border);
    const name = this.add.text(36, y + 8, u.name, pixelText(13, Palette.textPrimary, 0)).setOrigin(0, 0);
    const desc = this.add.text(36, y + 22, u.desc, pixelText(11, Palette.textSecondary, 0)).setOrigin(0, 0);

    let action;
    if (owned) {
      action = this.add.text(W - 60, y + 20, 'OWNED', pixelText(12, '#88dd88', 0)).setOrigin(1, 0.5);
    } else if (!unlocked) {
      action = this.add.text(W - 60, y + 20, 'LOCKED', pixelText(12, '#666688', 0)).setOrigin(1, 0.5);
    } else {
      const costStr = describeCost(u);
      const btn = this.add.rectangle(W - 60, y + 20, 280, 28, afford ? Palette.panelBright : 0x14141d)
        .setOrigin(1, 0.5).setStrokeStyle(1, afford ? Palette.accent : 0x3a2a4a);
      const label = this.add.text(W - 200, y + 20, costStr, pixelText(11, afford ? Palette.accentBright : '#553a66', 0)).setOrigin(0.5);
      if (afford) {
        btn.setInteractive({ useHandCursor: true });
        btn.on('pointerover', () => btn.setFillStyle(0x2a1a3a));
        btn.on('pointerout',  () => btn.setFillStyle(Palette.panelBright));
        btn.on('pointerdown', () => {
          payFor(u, this.save);
          SaveSystem.save(this.save);
          Audio.click();
          this.refreshStatus();
          this.setTab('UPGRADES');
        });
      }
      return [bg, name, desc, btn, label];
    }
    return [bg, name, desc, action];
  }

  // ===== SMELTER =====
  buildSmelter() {
    let y = 12;
    const intro = this.add.text(24, y, 'Smelt ores into ingots. Ingots unlock advanced upgrades and weapons.',
      pixelText(12, Palette.textDim, 0)).setOrigin(0, 0);
    this.list.add(intro);
    y += 28;
    RECIPES.forEach(r => {
      const row = this.makeSmelterRow(r, y);
      this.list.add(row);
      y += 64;
    });
    y += 12;
    const iSection = this.add.text(24, y, 'INGOT STOCK',
      pixelText(14, Palette.accentBright, 0)).setOrigin(0, 0);
    this.list.add(iSection);
    y += 24;
    INGOTS.forEach(ing => {
      const row = this.add.rectangle(24, y, this.W - 48, 28, Palette.panel).setOrigin(0, 0).setStrokeStyle(1, Palette.border);
      const lbl = this.add.text(36, y + 8, ing.name, pixelText(12, Palette.textPrimary, 0)).setOrigin(0, 0);
      const cnt = this.add.text(this.W - 64, y + 14, String(this.save.materials[ing.id] || 0), pixelText(13, Palette.accent, 0)).setOrigin(1, 0.5);
      this.list.add([row, lbl, cnt]);
      y += 32;
    });
    this.maxScroll = Math.max(0, y + 20 - (this.contentBottom - this.contentTop));
  }

  makeSmelterRow(r, y) {
    const W = this.W;
    const ing = findIngot(r.produces);
    const inputDesc = Object.entries(r.inputs).map(([k, v]) => {
      const o = findOre(k);
      return `${v}× ${o ? o.name : k}`;
    }).join(' + ');
    const haveAll = Object.entries(r.inputs).every(([k, v]) => (this.save.materials[k] || 0) >= v);
    const haveAll5 = Object.entries(r.inputs).every(([k, v]) => (this.save.materials[k] || 0) >= v * 5);

    const bg = this.add.rectangle(24, y, W - 48, 56, Palette.panel).setOrigin(0, 0).setStrokeStyle(1, Palette.border);
    const name = this.add.text(36, y + 6, `Smelt ${ing.name}`, pixelText(14, Palette.textPrimary, 0)).setOrigin(0, 0);
    const recipe = this.add.text(36, y + 26, `${inputDesc}  →  1× ${ing.name}`, pixelText(11, Palette.textSecondary, 0)).setOrigin(0, 0);
    const stock = this.add.text(36, y + 40, `Stock: ${this.save.materials[ing.id] || 0}`, pixelText(10, Palette.textDim, 0)).setOrigin(0, 0);

    const objs = [bg, name, recipe, stock];

    const btn1 = this.add.rectangle(W - 200, y + 28, 80, 24, haveAll ? Palette.panelBright : 0x14141d).setOrigin(0.5).setStrokeStyle(1, haveAll ? Palette.accent : 0x3a2a4a);
    const t1 = this.add.text(W - 200, y + 28, 'CRAFT 1', pixelText(11, haveAll ? Palette.accentBright : '#553a66', 0)).setOrigin(0.5);
    if (haveAll) {
      btn1.setInteractive({ useHandCursor: true });
      btn1.on('pointerdown', () => this.smeltOnce(r, 1));
    }
    const btn5 = this.add.rectangle(W - 110, y + 28, 80, 24, haveAll5 ? Palette.panelBright : 0x14141d).setOrigin(0.5).setStrokeStyle(1, haveAll5 ? Palette.accent : 0x3a2a4a);
    const t5 = this.add.text(W - 110, y + 28, 'CRAFT 5', pixelText(11, haveAll5 ? Palette.accentBright : '#553a66', 0)).setOrigin(0.5);
    if (haveAll5) {
      btn5.setInteractive({ useHandCursor: true });
      btn5.on('pointerdown', () => this.smeltOnce(r, 5));
    }
    objs.push(btn1, t1, btn5, t5);
    return objs;
  }

  smeltOnce(r, qty) {
    for (let n = 0; n < qty; n++) {
      for (const [k, v] of Object.entries(r.inputs)) {
        if ((this.save.materials[k] || 0) < v) return;
      }
      for (const [k, v] of Object.entries(r.inputs)) {
        this.save.materials[k] -= v;
      }
      this.save.materials[r.produces] = (this.save.materials[r.produces] || 0) + 1;
      this.save.stats.totalIngots = (this.save.stats.totalIngots || 0) + 1;
    }
    SaveSystem.save(this.save);
    Audio.click();
    this.refreshStatus();
    this.setTab('SMELTER');
  }

  // ===== WEAPONS =====
  buildWeapons() {
    let y = 12;
    const intro = this.add.text(24, y, 'Craft and equip weapons. Equipped weapon is used at run start.',
      pixelText(12, Palette.textDim, 0)).setOrigin(0, 0);
    this.list.add(intro);
    y += 26;

    WEAPONS.forEach(w => {
      const row = this.makeWeaponRow(w, y);
      this.list.add(row);
      y += 56;
    });
    this.maxScroll = Math.max(0, y + 20 - (this.contentBottom - this.contentTop));
  }

  makeWeaponRow(w, y) {
    const W = this.W;
    const owned = !!this.save.weapons?.[w.id];
    const equipped = this.save.equippedWeapon === w.id;
    const afford = canCraftWeapon(w, this.save);
    const r = rarityOf(w.rarity);

    const bg = this.add.rectangle(24, y, W - 48, 48, equipped ? 0x2a1c3a : (owned ? 0x1c2a1c : Palette.panel))
      .setOrigin(0, 0).setStrokeStyle(2, equipped ? Palette.accent : (owned ? 0x55aa55 : Palette.border));

    const name = this.add.text(36, y + 6, w.name, pixelText(14, r.color, 0)).setOrigin(0, 0);
    const tier = this.add.text(36 + name.width + 8, y + 8, r.name, pixelText(10, r.color, 0)).setOrigin(0, 0);
    const desc = this.add.text(36, y + 26, w.desc, pixelText(11, Palette.textSecondary, 0)).setOrigin(0, 0);
    const objs = [bg, name, tier, desc];

    let btnLabel;
    let onClick;
    let canClick;
    if (equipped) {
      btnLabel = 'EQUIPPED';
      canClick = false;
    } else if (owned) {
      btnLabel = 'EQUIP';
      canClick = true;
      onClick = () => {
        this.save.equippedWeapon = w.id;
        SaveSystem.save(this.save);
        Audio.click();
        this.setTab('WEAPONS');
      };
    } else {
      btnLabel = 'CRAFT — ' + describeRecipe(w);
      canClick = afford;
      onClick = () => {
        if (!canCraftWeapon(w, this.save)) return;
        craftWeapon(w, this.save);
        SaveSystem.save(this.save);
        Audio.click();
        this.refreshStatus();
        this.setTab('WEAPONS');
      };
    }

    const btn = this.add.rectangle(W - 60, y + 24, 360, 28, canClick ? Palette.panelBright : 0x14141d)
      .setOrigin(1, 0.5).setStrokeStyle(1, canClick ? Palette.accent : 0x3a2a4a);
    const txt = this.add.text(W - 60 - 180, y + 24, btnLabel,
      pixelText(11, canClick ? Palette.accentBright : '#553a66', 0)).setOrigin(0.5);
    if (canClick) {
      btn.setInteractive({ useHandCursor: true });
      btn.on('pointerover', () => btn.setFillStyle(0x2a1a3a));
      btn.on('pointerout',  () => btn.setFillStyle(Palette.panelBright));
      btn.on('pointerdown', onClick);
    }
    objs.push(btn, txt);
    return objs;
  }

  // ===== INVENTORY =====
  buildInventory() {
    let y = 12;
    const head1 = this.add.text(24, y, 'ORE STOCKPILE', pixelText(15, Palette.accentBright, 0));
    this.list.add(head1);
    y += 24;
    ORES.forEach(o => {
      const row = this.add.rectangle(24, y, this.W - 48, 30, Palette.panel).setOrigin(0, 0).setStrokeStyle(1, Palette.border);
      const name = this.add.text(36, y + 8, o.name, pixelText(12, '#'+o.color.toString(16).padStart(6,'0'), 0)).setOrigin(0, 0);
      const desc = this.add.text(160, y + 8, o.desc, pixelText(10, Palette.textDim, 0)).setOrigin(0, 0);
      const cnt = this.add.text(this.W - 60, y + 15, String(this.save.materials[o.id] || 0),
        pixelText(13, Palette.accent, 0)).setOrigin(1, 0.5);
      this.list.add([row, name, desc, cnt]);
      y += 34;
    });
    y += 12;
    const head2 = this.add.text(24, y, 'INGOT STOCK', pixelText(15, Palette.accentBright, 0));
    this.list.add(head2);
    y += 24;
    INGOTS.forEach(ing => {
      const row = this.add.rectangle(24, y, this.W - 48, 30, Palette.panel).setOrigin(0, 0).setStrokeStyle(1, Palette.border);
      const name = this.add.text(36, y + 8, ing.name, pixelText(12, '#'+ing.color.toString(16).padStart(6,'0'), 0)).setOrigin(0, 0);
      const desc = this.add.text(160, y + 8, ing.desc, pixelText(10, Palette.textDim, 0)).setOrigin(0, 0);
      const cnt = this.add.text(this.W - 60, y + 15, String(this.save.materials[ing.id] || 0),
        pixelText(13, Palette.accent, 0)).setOrigin(1, 0.5);
      this.list.add([row, name, desc, cnt]);
      y += 34;
    });
    this.maxScroll = Math.max(0, y + 20 - (this.contentBottom - this.contentTop));
  }
}
