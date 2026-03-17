import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../../shared/constants';
import { stopMusic } from '../systems/MusicManager';
import type { GameScene } from './GameScene';

const MONO = 'Consolas, "Courier New", monospace';

export class PauseScene extends Phaser.Scene {
  private gameScene!: GameScene;
  private selectedIndex = 0;
  private options: { label: string; action: () => void }[] = [];
  private optionTexts: Phaser.GameObjects.Text[] = [];

  constructor() {
    super({ key: 'PauseScene' });
  }

  init(data: { gameScene: GameScene }) {
    this.gameScene = data.gameScene;
    this.selectedIndex = 0;
  }

  create() {
    // Dark semi-transparent overlay
    this.add.rectangle(
      GAME_WIDTH / 2, GAME_HEIGHT / 2,
      GAME_WIDTH, GAME_HEIGHT,
      0x000000, 0.7
    ).setOrigin(0.5);

    // Title
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, 'PAUSED', {
      fontSize: '24px', fontFamily: MONO, color: '#00ffcc',
      stroke: '#000000', strokeThickness: 3, fontStyle: 'bold',
    }).setOrigin(0.5);

    // Menu options
    this.options = [
      { label: 'RESUME', action: () => this.resumeGame() },
      { label: 'SETTINGS', action: () => this.openSettings() },
      { label: 'RETURN TO HUB', action: () => this.returnToHub() },
      { label: 'QUIT TO TITLE', action: () => this.quitToTitle() },
    ];

    const menuStartY = GAME_HEIGHT / 2 - 20;
    this.optionTexts = [];

    for (let i = 0; i < this.options.length; i++) {
      const text = this.add.text(GAME_WIDTH / 2, menuStartY + i * 26, this.options[i].label, {
        fontSize: '14px', fontFamily: MONO, color: '#556677',
        stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0.5);
      this.optionTexts.push(text);
    }

    this.updateSelection();

    // Keyboard input
    this.input.keyboard!.on('keydown-UP', () => {
      this.selectedIndex = (this.selectedIndex - 1 + this.options.length) % this.options.length;
      this.updateSelection();
    });

    this.input.keyboard!.on('keydown-DOWN', () => {
      this.selectedIndex = (this.selectedIndex + 1) % this.options.length;
      this.updateSelection();
    });

    this.input.keyboard!.on('keydown-Z', () => this.confirmSelection());
    this.input.keyboard!.on('keydown-ENTER', () => this.confirmSelection());

    // ESC also resumes
    this.input.keyboard!.on('keydown-ESC', () => this.resumeGame());
  }

  private updateSelection() {
    for (let i = 0; i < this.optionTexts.length; i++) {
      if (i === this.selectedIndex) {
        this.optionTexts[i].setColor('#00ffcc');
        this.optionTexts[i].setText(`> ${this.options[i].label} <`);
      } else {
        this.optionTexts[i].setColor('#556677');
        this.optionTexts[i].setText(this.options[i].label);
      }
    }
  }

  private confirmSelection() {
    this.options[this.selectedIndex].action();
  }

  private resumeGame() {
    this.scene.stop('PauseScene');
    this.scene.resume('GameScene');
  }

  private openSettings() {
    this.scene.stop('PauseScene');
    this.scene.launch('SettingsScene', { from: 'PauseScene' });
  }

  private returnToHub() {
    stopMusic(true);
    this.scene.stop('PauseScene');
    this.scene.stop('HUDScene');
    this.scene.stop('GameScene');
    this.scene.start('GameScene', {
      selectedClass: this.gameScene.currentClass,
      zoneId: 'hub',
    });
  }

  private quitToTitle() {
    stopMusic(true);
    this.scene.stop('PauseScene');
    this.scene.stop('HUDScene');
    this.scene.stop('GameScene');
    this.scene.start('TitleScene');
  }
}
