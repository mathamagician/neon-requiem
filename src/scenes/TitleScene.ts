import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../../shared/constants';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TitleScene' });
  }

  create() {
    // Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x050510, 0x050510, 0x0a0a2e, 0x0a0a2e, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Neon grid lines (floor perspective)
    const grid = this.add.graphics();
    grid.lineStyle(1, COLORS.neon, 0.12);
    for (let i = 0; i < 20; i++) {
      const x = GAME_WIDTH / 2 + (i - 10) * 30;
      grid.lineBetween(x, GAME_HEIGHT * 0.6, GAME_WIDTH / 2 + (i - 10) * 8, GAME_HEIGHT);
    }
    for (let i = 0; i < 6; i++) {
      const y = GAME_HEIGHT * 0.6 + i * 15;
      grid.lineBetween(0, y, GAME_WIDTH, y);
    }

    // Title
    this.add.text(GAME_WIDTH / 2, 60, 'NEON', {
      fontSize: '24px', fontFamily: 'monospace', color: '#00ffcc', resolution: 2,
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 90, 'REQUIEM', {
      fontSize: '24px', fontFamily: 'monospace', color: '#ff2244', resolution: 2,
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(GAME_WIDTH / 2, 120, 'Where dark magic meets dying technology', {
      fontSize: '6px', fontFamily: 'monospace', color: '#556677', resolution: 2,
    }).setOrigin(0.5);

    // Pulsing "Press any key"
    const startText = this.add.text(GAME_WIDTH / 2, 180, 'PRESS ANY KEY TO START', {
      fontSize: '8px', fontFamily: 'monospace', color: '#ffffff', resolution: 2,
    }).setOrigin(0.5);

    this.tweens.add({
      targets: startText,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    // Credits
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 20, 'A game by Eddie, Changa & Tai', {
      fontSize: '5px', fontFamily: 'monospace', color: '#444455', resolution: 2,
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 12, 'v0.1.0 - Phase 5 Prototype', {
      fontSize: '5px', fontFamily: 'monospace', color: '#333344', resolution: 2,
    }).setOrigin(0.5);

    // Any key to continue
    this.input.keyboard!.on('keydown', () => {
      this.scene.start('ClassSelectScene');
    });

    // Also click/tap
    this.input.on('pointerdown', () => {
      this.scene.start('ClassSelectScene');
    });
  }
}
