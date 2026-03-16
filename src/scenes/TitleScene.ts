import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../../shared/constants';
import { hasSave, loadSave, deleteSave, formatSaveInfo } from '../systems/SaveSystem';
import { playSound } from '../systems/SoundManager';

const FONT = 'Arial, Helvetica, sans-serif';
const MONO = 'Consolas, "Courier New", monospace';

export class TitleScene extends Phaser.Scene {
  private selectedIndex = 0;
  private menuItems: Phaser.GameObjects.Text[] = [];
  private cursor!: Phaser.GameObjects.Text;
  private saveInfoText!: Phaser.GameObjects.Text;
  private hasSaveData = false;

  constructor() {
    super({ key: 'TitleScene' });
  }

  create() {
    this.hasSaveData = hasSave();

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
    this.add.text(GAME_WIDTH / 2, 70, 'NEON', {
      fontSize: '48px', fontFamily: FONT, color: '#00ffcc',
      fontStyle: 'bold', stroke: '#003333', strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 120, 'REQUIEM', {
      fontSize: '48px', fontFamily: FONT, color: '#ff2244',
      fontStyle: 'bold', stroke: '#330011', strokeThickness: 4,
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(GAME_WIDTH / 2, 158, 'Where dark magic meets dying technology', {
      fontSize: '14px', fontFamily: FONT, color: '#556677',
      stroke: '#000000', strokeThickness: 1,
    }).setOrigin(0.5);

    // Menu items
    const menuY = 200;
    const spacing = 28;
    this.menuItems = [];

    if (this.hasSaveData) {
      this.menuItems.push(this.add.text(GAME_WIDTH / 2, menuY, 'CONTINUE', {
        fontSize: '16px', fontFamily: MONO, color: '#00ffcc',
        stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0.5));

      // Show save info
      const save = loadSave();
      this.saveInfoText = this.add.text(GAME_WIDTH / 2, menuY + 18, save ? formatSaveInfo(save) : '', {
        fontSize: '11px', fontFamily: MONO, color: '#445566',
        stroke: '#000000', strokeThickness: 1,
      }).setOrigin(0.5);
    }

    const newGameY = this.hasSaveData ? menuY + spacing + 16 : menuY;
    this.menuItems.push(this.add.text(GAME_WIDTH / 2, newGameY, 'NEW GAME', {
      fontSize: '16px', fontFamily: MONO, color: '#ffffff',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5));

    this.menuItems.push(this.add.text(GAME_WIDTH / 2, newGameY + spacing, 'SETTINGS', {
      fontSize: '16px', fontFamily: MONO, color: '#888899',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5));

    // Cursor
    this.cursor = this.add.text(0, 0, '>', {
      fontSize: '16px', fontFamily: MONO, color: '#ffffff',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5);
    this.updateMenu();

    // Credits
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 40, 'A game by Eddie, Changa & Tai', {
      fontSize: '13px', fontFamily: FONT, color: '#444455',
      stroke: '#000000', strokeThickness: 1,
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 20, 'v1.3.1', {
      fontSize: '12px', fontFamily: FONT, color: '#333344',
      stroke: '#000000', strokeThickness: 1,
    }).setOrigin(0.5);

    // Controls
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 60, 'UP/DOWN: Select  |  Z/ENTER: Confirm', {
      fontSize: '11px', fontFamily: MONO, color: '#555566',
      stroke: '#000000', strokeThickness: 1,
    }).setOrigin(0.5);

    // Input
    this.input.keyboard!.on('keydown-UP', () => {
      this.selectedIndex = (this.selectedIndex - 1 + this.menuItems.length) % this.menuItems.length;
      playSound('menuSelect');
      this.updateMenu();
    });
    this.input.keyboard!.on('keydown-DOWN', () => {
      this.selectedIndex = (this.selectedIndex + 1) % this.menuItems.length;
      playSound('menuSelect');
      this.updateMenu();
    });
    this.input.keyboard!.on('keydown-Z', () => this.confirm());
    this.input.keyboard!.on('keydown-ENTER', () => this.confirm());

    // Click/tap fallback
    this.input.on('pointerdown', () => this.confirm());
  }

  private updateMenu() {
    for (let i = 0; i < this.menuItems.length; i++) {
      this.menuItems[i].setAlpha(i === this.selectedIndex ? 1 : 0.5);
    }
    const sel = this.menuItems[this.selectedIndex];
    this.cursor.setPosition(sel.x - 70, sel.y);
  }

  private confirm() {
    const isContinue = this.hasSaveData && this.selectedIndex === 0;
    const settingsIndex = this.menuItems.length - 1; // Settings is always last
    const isSettings = this.selectedIndex === settingsIndex;

    if (isSettings) {
      this.scene.start('SettingsScene', { from: 'TitleScene' });
      return;
    }

    playSound('menuConfirm');
    this.cameras.main.flash(300, 255, 255, 255);

    this.time.delayedCall(300, () => {
      if (isContinue) {
        const save = loadSave();
        if (save) {
          this.scene.start('GameScene', { selectedClass: save.className, saveData: save, zoneId: save.currentZone ?? 'foundry' });
          return;
        }
      }
      // New game — delete any existing save and go to class select
      deleteSave();
      this.scene.start('ClassSelectScene');
    });
  }
}
