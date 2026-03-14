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
    this.add.text(GAME_WIDTH / 2, 80, 'NEON', {
      fontSize: '48px', fontFamily: 'Arial, Helvetica, sans-serif', color: '#00ffcc',
      fontStyle: 'bold', stroke: '#003333', strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 130, 'REQUIEM', {
      fontSize: '48px', fontFamily: 'Arial, Helvetica, sans-serif', color: '#ff2244',
      fontStyle: 'bold', stroke: '#330011', strokeThickness: 4,
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(GAME_WIDTH / 2, 170, 'Where dark magic meets dying technology', {
      fontSize: '14px', fontFamily: 'Arial, Helvetica, sans-serif', color: '#556677',
      stroke: '#000000', strokeThickness: 1,
    }).setOrigin(0.5);

    // Pulsing "Press any key"
    const startText = this.add.text(GAME_WIDTH / 2, 230, 'PRESS ANY KEY TO START', {
      fontSize: '16px', fontFamily: 'Consolas, "Courier New", monospace', color: '#ffffff',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5);

    this.tweens.add({
      targets: startText,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    // Credits
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 40, 'A game by Eddie, Changa & Tai', {
      fontSize: '13px', fontFamily: 'Arial, Helvetica, sans-serif', color: '#444455',
      stroke: '#000000', strokeThickness: 1,
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 20, 'v0.1.0 - Phase 5 Prototype', {
      fontSize: '12px', fontFamily: 'Arial, Helvetica, sans-serif', color: '#333344',
      stroke: '#000000', strokeThickness: 1,
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
