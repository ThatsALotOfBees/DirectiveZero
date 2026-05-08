# Directive Zero

A 2D top-down pixel-art auto-battler / survivor game where you don't directly control the character — instead, an AI-controlled **Observer Unit** fights, dodges, and collects on its own. You act as the trainer: pick perks, craft permanent upgrades, build synergies, watch it survive a little longer each run.

Built with **Phaser 3** + **Vite**, packaged for Windows desktop with **Electron** + `@electron/packager`.

## Quick start (dev)

```bash
npm install
npm run dev
```

Then open `http://localhost:5173`.

## Build a Windows executable

```bash
npm run package
```

Produces `release/Directive Zero-win32-x64/Directive Zero.exe` along with the Electron runtime files. Double-click the EXE to play — no install needed.

## Controls

The game plays itself. You only steer the meta:

- `1` `2` `3` `4` — pick a perk on level-up
- `R` — reroll perks (5 RD)
- `ESC` / `P` — pause menu
- `M` — mute
- `F11` — fullscreen
- `SPACE` — start a run from the main menu

## What's in the game

- **150+ perks** across **20 rarity tiers** (Standard → Mythical), with 13 fusion perks that unlock based on tag prerequisites.
- **60 craftable permanent upgrades** in 12 tracks × 5 tiers, gated by ingot cost.
- **36 weapons** with 4 fire modes (`standard`, `burst`, `ring`, `beam`/laser).
- **7 enemy variants** plus 5 bosses with timed appearances.
- **Materials economy**: 5 ores drop randomly on kills → smelt to 5 ingots → spend on upgrades and weapons.
- **15 run modifiers** picked at run start (Horde, Glass Cannon, Pyro Pact, Apex Protocol, etc.).
- **26 achievements** that retroactively grant Research Data.
- **Codex** with rarity/tier/seen filters; **Workshop** with Upgrades / Smelter / Weapons / Inventory tabs.
- **Pause menu**, **settings** (volume, music, screen shake, damage-numbers toggle), **DPS readout**, low-HP vignette, aim-line, ambient procedural music.

## Project layout

```
index.html            entry HTML loaded by Vite + Electron
main.js               Phaser game config + scene registration
electron/main.cjs     Electron main process (creates BrowserWindow)
scenes/               Phaser scenes: Boot, Menu, Game, UI, Perk, Pause,
                      Settings, Workshop, Codex, RunModifier, GameOver
entities/             Player, Enemy, Projectile, EnemyBullet, OrePickup,
                      XPShard, Drone
systems/              SpawnSystem, SaveSystem, AudioSystem (procedural SFX + drone)
data/                 perks, weapons, upgrades, materials, enemies, bosses,
                      modifiers, achievements
ui/                   shared palette + text style helper
```

Saves use `localStorage` in Electron's user-data folder
(`%APPDATA%\directive-zero\` on Windows). Wipe save from the main-menu link.

## Tech

- [Phaser 3](https://phaser.io/) — rendering, physics, input
- [Vite](https://vitejs.dev/) — dev server + bundler
- [Electron 33](https://www.electronjs.org/) — desktop wrapper
- [@electron/packager](https://github.com/electron/packager) — Windows build

All in-game art is generated procedurally in [scenes/BootScene.js](scenes/BootScene.js); audio is synthesized at runtime in [systems/AudioSystem.js](systems/AudioSystem.js). Zero external assets.
