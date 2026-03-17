import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, SCALE, COLORS } from '../shared/constants';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';
import { HUDScene } from './scenes/HUDScene';
import { InventoryScene } from './scenes/InventoryScene';
import { TitleScene } from './scenes/TitleScene';
import { ClassSelectScene } from './scenes/ClassSelectScene';
import { ShopScene } from './scenes/ShopScene';
import { SettingsScene } from './scenes/SettingsScene';
import { LoreScene } from './scenes/LoreScene';
import { DeathScene } from './scenes/DeathScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.WEBGL,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  zoom: SCALE,
  pixelArt: true,
  backgroundColor: COLORS.background,
  input: {
    gamepad: true,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 900 },
      debug: false, // Toggle with F1 in-game
    },
  },
  scene: [BootScene, TitleScene, LoreScene, ClassSelectScene, GameScene, HUDScene, InventoryScene, ShopScene, SettingsScene, DeathScene],
  parent: document.body,
};

new Phaser.Game(config);
