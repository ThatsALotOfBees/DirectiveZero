import Phaser from 'phaser';

// Render every Text object at 2× pixel density so it stays crisp when the
// pixel-art canvas is scaled to fit the window.
const _origTextFactory = Phaser.GameObjects.GameObjectFactory.prototype.text;
Phaser.GameObjects.GameObjectFactory.prototype.text = function (...args) {
  const t = _origTextFactory.apply(this, args);
  if (t && t.setResolution) t.setResolution(2);
  return t;
};

import BootScene from './scenes/BootScene.js';
import MenuScene from './scenes/MenuScene.js';
import GameScene from './scenes/GameScene.js';
import UIScene from './scenes/UIScene.js';
import PerkScene from './scenes/PerkScene.js';
import GameOverScene from './scenes/GameOverScene.js';
import WorkshopScene from './scenes/WorkshopScene.js';
import CodexScene from './scenes/CodexScene.js';
import PauseScene from './scenes/PauseScene.js';
import SettingsScene from './scenes/SettingsScene.js';
import RunModifierScene from './scenes/RunModifierScene.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  pixelArt: true,
  roundPixels: true,
  backgroundColor: '#0a0a0f',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 960,
    height: 540
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false
    }
  },
  scene: [BootScene, MenuScene, GameScene, UIScene, PerkScene, GameOverScene, WorkshopScene, CodexScene, PauseScene, SettingsScene, RunModifierScene]
};

new Phaser.Game(config);
