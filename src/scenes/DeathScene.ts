import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../../shared/constants';
import { playSound } from '../systems/SoundManager';
import { stopMusic } from '../systems/MusicManager';
import type { ClassName } from './GameScene';

const MONO = 'Consolas, "Courier New", monospace';

interface DeathSceneData {
  zoneName: string;
  className: ClassName;
  zoneId: string;
}

export class DeathScene extends Phaser.Scene {
  private selectedIndex = 0;
  private options: { label: string; action: () => void }[] = [];
  private optionTexts: Phaser.GameObjects.Text[] = [];
  private deathData!: DeathSceneData;
  private inputReady = false;

  constructor() {
    super({ key: 'DeathScene' });
  }

  init(data: DeathSceneData) {
    this.deathData = data;
    this.selectedIndex = 0;
    this.inputReady = false;
  }

  create() {
    // Play death sound
    playSound('playerDeath');

    // Dark semi-transparent overlay
    const overlay = this.add.rectangle(
      GAME_WIDTH / 2, GAME_HEIGHT / 2,
      GAME_WIDTH, GAME_HEIGHT,
      0x000000, 0
    ).setOrigin(0.5).setDepth(0);

    // Fade in the overlay
    this.tweens.add({
      targets: overlay,
      fillAlpha: 0.75,
      duration: 600,
      ease: 'Power2',
    });

    // "YOU DIED" text — large, red, fades in
    const diedText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50, 'YOU DIED', {
      fontSize: '32px',
      fontFamily: MONO,
      color: '#ff2244',
      stroke: '#000000',
      strokeThickness: 4,
      fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0).setDepth(1);

    this.tweens.add({
      targets: diedText,
      alpha: 1,
      y: GAME_HEIGHT / 2 - 55,
      duration: 800,
      ease: 'Power2',
    });

    // Zone name below
    const zoneText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20, this.deathData.zoneName, {
      fontSize: '14px',
      fontFamily: MONO,
      color: '#667788',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5).setAlpha(0).setDepth(1);

    this.tweens.add({
      targets: zoneText,
      alpha: 0.8,
      duration: 800,
      delay: 300,
      ease: 'Power2',
    });

    // Menu options
    this.options = [
      {
        label: 'RETRY ZONE',
        action: () => this.retryZone(),
      },
      {
        label: 'RETURN TO HUB',
        action: () => this.returnToHub(),
      },
    ];

    const menuStartY = GAME_HEIGHT / 2 + 20;
    this.optionTexts = [];

    for (let i = 0; i < this.options.length; i++) {
      const text = this.add.text(GAME_WIDTH / 2, menuStartY + i * 28, this.options[i].label, {
        fontSize: '16px',
        fontFamily: MONO,
        color: '#556677',
        stroke: '#000000',
        strokeThickness: 2,
      }).setOrigin(0.5).setAlpha(0).setDepth(1);

      this.tweens.add({
        targets: text,
        alpha: 1,
        duration: 600,
        delay: 600 + i * 150,
        ease: 'Power2',
      });

      this.optionTexts.push(text);
    }

    // Selection cursor indicator
    this.updateSelection();

    // Delay input readiness to prevent accidental selection
    this.time.delayedCall(800, () => {
      this.inputReady = true;
    });

    // Keyboard input
    this.input.keyboard!.on('keydown-UP', () => {
      if (!this.inputReady) return;
      this.selectedIndex = (this.selectedIndex - 1 + this.options.length) % this.options.length;
      this.updateSelection();
    });

    this.input.keyboard!.on('keydown-DOWN', () => {
      if (!this.inputReady) return;
      this.selectedIndex = (this.selectedIndex + 1) % this.options.length;
      this.updateSelection();
    });

    this.input.keyboard!.on('keydown-Z', () => {
      if (!this.inputReady) return;
      this.confirmSelection();
    });

    this.input.keyboard!.on('keydown-ENTER', () => {
      if (!this.inputReady) return;
      this.confirmSelection();
    });
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
    // Prevent double-confirm
    this.inputReady = false;
    this.options[this.selectedIndex].action();
  }

  private retryZone() {
    // Stop music before transitioning
    stopMusic(true);

    // Stop HUD and death scene, restart GameScene with same zone/class but no save (fresh attempt)
    this.scene.stop('HUDScene');
    this.scene.stop('DeathScene');
    this.scene.stop('GameScene');
    this.scene.start('GameScene', {
      selectedClass: this.deathData.className,
      zoneId: this.deathData.zoneId,
      // No saveData — fresh zone attempt
    });
  }

  private returnToHub() {
    // Stop music before transitioning
    stopMusic(true);

    // Stop HUD and death scene, restart GameScene to hub
    this.scene.stop('HUDScene');
    this.scene.stop('DeathScene');
    this.scene.stop('GameScene');
    this.scene.start('GameScene', {
      selectedClass: this.deathData.className,
      zoneId: 'hub',
      // No saveData — fresh hub entry
    });
  }
}
