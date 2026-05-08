import Phaser from 'phaser';
import { SaveSystem } from '../systems/SaveSystem.js';
import { Audio } from '../systems/AudioSystem.js';
import { Palette, pixelText } from '../ui/HUD.js';
import { PERKS, FUSIONS, RARITIES, rarityOf } from '../data/perks.js';
import { ACHIEVEMENTS } from '../data/achievements.js';

const TABS = ['PERKS', 'FUSIONS', 'ACHIEVEMENTS', 'STATS'];

const FILTERS = [
  { id: 'all',    label: 'All',         match: () => true },
  { id: 'seen',   label: 'Seen',        match: (p, save) => (save.perksSeen?.[p.id] || 0) > 0 },
  { id: 'locked', label: 'Locked',      match: (p, save) => !(save.perksSeen?.[p.id] || 0) }
];

const TIER_FILTERS = [
  { id: 'allT', label: 'All Tiers', from: 1,  to: 20 },
  { id: 't15',  label: '1-5',       from: 1,  to: 5  },
  { id: 't610', label: '6-10',      from: 6,  to: 10 },
  { id: 't1115',label: '11-15',     from: 11, to: 15 },
  { id: 't1620',label: '16-20',     from: 16, to: 20 }
];

export default class CodexScene extends Phaser.Scene {
  constructor() { super('CodexScene'); }

  create() {
    const W = this.scale.width, H = this.scale.height;
    this.W = W; this.H = H;
    this.cameras.main.setBackgroundColor('#080812');
    this.add.tileSprite(0, 0, W, H, 'floor').setOrigin(0, 0).setAlpha(0.4).setDepth(-100);
    this.add.rectangle(0, 0, W, H, 0x06060e, 0.6).setOrigin(0, 0).setDepth(-90);

    this.save = SaveSystem.load();
    this.activeTab = 'PERKS';
    this.scrollY = 0;
    this.maxScroll = 0;
    this.filterId = 'all';
    this.tierFilter = 'allT';

    this.add.text(24, 18, 'CODEX', pixelText(22, Palette.textPrimary, 3)).setOrigin(0, 0);
    this.add.text(W - 24, 24,
      `${PERKS.length} PERKS · ${FUSIONS.length} FUSIONS · ${ACHIEVEMENTS.length} ACHIEVEMENTS`,
      pixelText(11, Palette.textDim, 0)).setOrigin(1, 0);

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
      this.tabContainer[`tab_${label}`] = btn; btn._txt = txt;
    });

    // Filter row (only used by PERKS tab)
    this.filterContainer = this.add.container(0, 96);

    this.contentTop = 138;
    this.contentBottom = H - 56;
    this.viewport = this.add.rectangle(0, this.contentTop, W, this.contentBottom - this.contentTop, 0x0c0c14, 0.4).setOrigin(0, 0);
    this.viewport.setStrokeStyle(1, Palette.border);

    this.list = this.add.container(0, this.contentTop);
    const maskShape = this.add.graphics().setVisible(false);
    maskShape.fillRect(0, this.contentTop, W, this.contentBottom - this.contentTop);
    this.list.setMask(maskShape.createGeometryMask());

    const back = this.add.rectangle(24, H - 36, 140, 32, Palette.panel).setOrigin(0, 0).setStrokeStyle(1, Palette.border);
    this.add.text(94, H - 20, 'BACK', pixelText(14, Palette.textPrimary, 0)).setOrigin(0.5);
    back.setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => { Audio.click(); this.scene.start('MenuScene'); });
    this.input.keyboard.on('keydown-ESC', () => this.scene.start('MenuScene'));

    this.input.on('wheel', (_p, _objs, _dx, dy) => {
      this.scrollY += dy * 0.4;
      this.scrollY = Phaser.Math.Clamp(this.scrollY, 0, this.maxScroll);
      this.list.y = this.contentTop - this.scrollY;
    });

    this.setTab('PERKS');
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
    this.filterContainer.removeAll(true);

    if (label === 'PERKS') {
      this.buildFilters();
      this.buildPerks();
    } else if (label === 'FUSIONS') {
      this.buildFusions();
    } else if (label === 'ACHIEVEMENTS') {
      this.buildAchievements();
    } else if (label === 'STATS') {
      this.buildStats();
    }
    this.scrollY = Phaser.Math.Clamp(this.scrollY, 0, this.maxScroll);
    this.list.y = this.contentTop - this.scrollY;
  }

  buildFilters() {
    let x = 24;
    FILTERS.forEach(f => {
      const active = this.filterId === f.id;
      const btn = this.add.rectangle(x, 0, 78, 26, active ? Palette.accent : Palette.panel).setOrigin(0, 0).setStrokeStyle(1, Palette.border);
      const txt = this.add.text(x + 39, 13, f.label, pixelText(11, active ? '#0a0a14' : Palette.textPrimary, 0)).setOrigin(0.5);
      btn.setInteractive({ useHandCursor: true });
      btn.on('pointerdown', () => { this.filterId = f.id; Audio.click(); this.setTab('PERKS'); });
      this.filterContainer.add([btn, txt]);
      x += 86;
    });
    x += 16;
    TIER_FILTERS.forEach(f => {
      const active = this.tierFilter === f.id;
      const btn = this.add.rectangle(x, 0, 78, 26, active ? Palette.accent : Palette.panel).setOrigin(0, 0).setStrokeStyle(1, Palette.border);
      const txt = this.add.text(x + 39, 13, f.label, pixelText(11, active ? '#0a0a14' : Palette.textPrimary, 0)).setOrigin(0.5);
      btn.setInteractive({ useHandCursor: true });
      btn.on('pointerdown', () => { this.tierFilter = f.id; Audio.click(); this.setTab('PERKS'); });
      this.filterContainer.add([btn, txt]);
      x += 86;
    });
  }

  rarityBadge(x, y, tier) {
    const r = rarityOf(tier);
    const bg = this.add.rectangle(x, y, 90, 18, 0x14141d).setOrigin(0, 0.5).setStrokeStyle(1, Phaser.Display.Color.HexStringToColor(r.color).color);
    const txt = this.add.text(x + 45, y, `T${tier} ${r.name}`, pixelText(10, r.color, 0)).setOrigin(0.5);
    return [bg, txt];
  }

  buildPerks() {
    let y = 12;
    const filter = FILTERS.find(f => f.id === this.filterId) || FILTERS[0];
    const tier = TIER_FILTERS.find(f => f.id === this.tierFilter) || TIER_FILTERS[0];
    const filtered = PERKS.filter(p => p.rarity >= tier.from && p.rarity <= tier.to && filter.match(p, this.save))
      .sort((a, b) => a.rarity - b.rarity || a.name.localeCompare(b.name));

    if (filtered.length === 0) {
      this.list.add(this.add.text(this.W / 2, y + 30, 'No perks match this filter.', pixelText(12, Palette.textDim, 0)).setOrigin(0.5));
      this.maxScroll = 0; return;
    }
    filtered.forEach(p => {
      const seen = (this.save.perksSeen?.[p.id] || 0) > 0;
      y = this.makePerkRow(p, y, seen);
    });
    this.maxScroll = Math.max(0, y + 20 - (this.contentBottom - this.contentTop));
  }

  makePerkRow(p, y, seen) {
    const W = this.W;
    const r = rarityOf(p.rarity);
    const bg = this.add.rectangle(24, y, W - 48, 36, seen ? 0x14141d : 0x0c0c14)
      .setOrigin(0, 0).setStrokeStyle(1, Phaser.Display.Color.HexStringToColor(r.color).color);
    const name = this.add.text(36, y + 6, p.name, pixelText(13, seen ? r.color : '#444466', 0));
    const desc = this.add.text(36, y + 22, seen ? p.desc : '— locked —', pixelText(10, seen ? Palette.textSecondary : '#444466', 0));
    const badges = this.rarityBadge(W - 132, y + 18, p.rarity);
    const seenCount = this.save.perksSeen?.[p.id] || 0;
    const cnt = this.add.text(W - 36, y + 18, seenCount > 0 ? `×${seenCount}` : '—',
      pixelText(11, seenCount > 0 ? '#88dd88' : '#555577', 0)).setOrigin(1, 0.5);
    this.list.add([bg, name, desc, ...badges, cnt]);
    return y + 40;
  }

  buildFusions() {
    let y = 12;
    const intro = this.add.text(24, y, 'Fusions appear as choices when their tag prerequisites are owned.',
      pixelText(12, Palette.textDim, 0));
    this.list.add(intro);
    y += 26;
    FUSIONS.forEach(f => {
      const W = this.W;
      const r = rarityOf(f.rarity);
      const bg = this.add.rectangle(24, y, W - 48, 50, 0x14141d).setOrigin(0, 0).setStrokeStyle(1, Phaser.Display.Color.HexStringToColor(r.color).color);
      const name = this.add.text(36, y + 6, f.name, pixelText(14, r.color, 0));
      const desc = this.add.text(36, y + 22, f.desc, pixelText(11, Palette.textSecondary, 0));
      const req = this.add.text(36, y + 36, 'Requires tags: ' + f.requires.join(', '), pixelText(10, Palette.textDim, 0));
      const badges = this.rarityBadge(W - 132, y + 24, f.rarity);
      this.list.add([bg, name, desc, req, ...badges]);
      y += 56;
    });
    this.maxScroll = Math.max(0, y + 20 - (this.contentBottom - this.contentTop));
  }

  buildAchievements() {
    let y = 12;
    const earned = ACHIEVEMENTS.filter(a => this.save.achievements?.[a.id]).length;
    const head = this.add.text(24, y, `${earned} / ${ACHIEVEMENTS.length} unlocked`,
      pixelText(13, Palette.accentBright, 0));
    this.list.add(head);
    y += 26;
    ACHIEVEMENTS.forEach(a => {
      const got = !!this.save.achievements?.[a.id];
      const W = this.W;
      const bg = this.add.rectangle(24, y, W - 48, 38, got ? 0x162a1c : 0x14141d).setOrigin(0, 0).setStrokeStyle(1, got ? 0x55aa55 : Palette.border);
      const name = this.add.text(36, y + 6, a.name, pixelText(13, got ? '#88ff88' : Palette.textPrimary, 0));
      const desc = this.add.text(36, y + 22, a.desc, pixelText(10, got ? '#aaccaa' : Palette.textSecondary, 0));
      const reward = this.add.text(W - 36, y + 19, `+${a.reward} RD`, pixelText(11, got ? '#88ff88' : Palette.textDim, 0)).setOrigin(1, 0.5);
      this.list.add([bg, name, desc, reward]);
      y += 42;
    });
    this.maxScroll = Math.max(0, y + 20 - (this.contentBottom - this.contentTop));
  }

  buildStats() {
    let y = 18;
    const s = this.save.stats;
    const m = Math.floor(s.bestTime / 60); const sec = Math.floor(s.bestTime % 60);
    const lines = [
      `Runs Logged           ${s.runs}`,
      `Total Kills           ${s.totalKills}`,
      `Best Survival         ${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`,
      `Best Kill Count       ${s.bestKills}`,
      `Best Level            ${s.bestLevel}`,
      `Total Ores Collected  ${s.totalOres || 0}`,
      `Total Ingots Crafted  ${s.totalIngots || 0}`,
      ``,
      `Research Data         ${this.save.research}`,
      `Equipped Weapon       ${this.save.equippedWeapon}`,
      `Owned Weapons         ${Object.keys(this.save.weapons || {}).length} / ${this.W ? '36' : ''}`,
      `Perks Seen            ${Object.keys(this.save.perksSeen || {}).length} / ${PERKS.length}`,
      `Achievements          ${Object.keys(this.save.achievements || {}).length} / ${ACHIEVEMENTS.length}`
    ];
    lines.forEach(l => {
      const t = this.add.text(36, y, l, pixelText(13, Palette.textSecondary, 0));
      this.list.add(t);
      y += 22;
    });
    this.maxScroll = Math.max(0, y + 20 - (this.contentBottom - this.contentTop));
  }
}
