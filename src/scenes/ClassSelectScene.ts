import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../../shared/constants';
import type { ClassName } from './GameScene';
import { playSound } from '../systems/SoundManager';

const FONT = 'Arial, Helvetica, sans-serif';
const MONO = 'Consolas, "Courier New", monospace';

interface ClassInfo {
  name: string;
  id: ClassName;
  color: number;
  desc: string;
  stats: string;
  weapon: string;
}

const CLASSES: ClassInfo[] = [
  {
    name: 'VANGUARD',
    id: 'vanguard',
    color: COLORS.vanguard,
    desc: 'Melee fighter. 3-hit sword combos with heavy knockback.',
    stats: 'HP: HIGH | DMG: HIGH | SPD: MED',
    weapon: 'Plasma Blade',
  },
  {
    name: 'GUNNER',
    id: 'gunner',
    color: 0x44ff88,
    desc: 'Ranged specialist. Charge shots for burst damage.',
    stats: 'HP: MED  | DMG: MED  | SPD: MED',
    weapon: 'Pulse Rifle',
  },
  {
    name: 'WRAITH',
    id: 'wraith',
    color: COLORS.wraith,
    desc: 'Agile assassin. Fast daggers, crits, wall cling.',
    stats: 'HP: LOW  | DMG: CRIT | SPD: HIGH',
    weapon: 'Twin Ether Daggers',
  },
];

export class ClassSelectScene extends Phaser.Scene {
  private selectedIndex = 0;
  private classTexts: Phaser.GameObjects.Text[] = [];
  private descText!: Phaser.GameObjects.Text;
  private statsText!: Phaser.GameObjects.Text;
  private weaponText!: Phaser.GameObjects.Text;
  private preview!: Phaser.GameObjects.Graphics;
  private cursor!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'ClassSelectScene' });
  }

  create() {
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x050510, 0x050510, 0x0a0a2e, 0x0a0a2e, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    this.add.text(GAME_WIDTH / 2, 30, 'CHOOSE YOUR CLASS', {
      fontSize: '22px', fontFamily: FONT, color: '#00ffcc',
      fontStyle: 'bold', stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5);

    // Class options
    const startY = 90;
    const spacing = 45;

    for (let i = 0; i < CLASSES.length; i++) {
      const cls = CLASSES[i];
      const colorStr = '#' + cls.color.toString(16).padStart(6, '0');
      const t = this.add.text(GAME_WIDTH / 2, startY + i * spacing, cls.name, {
        fontSize: '20px', fontFamily: MONO, color: colorStr,
        fontStyle: 'bold', stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0.5);
      this.classTexts.push(t);
    }

    // Selection cursor
    this.cursor = this.add.text(GAME_WIDTH / 2 - 80, startY, '>', {
      fontSize: '20px', fontFamily: MONO, color: '#ffffff',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5);

    // Details area
    this.descText = this.add.text(GAME_WIDTH / 2, 245, '', {
      fontSize: '14px', fontFamily: FONT, color: '#aaaaaa',
      stroke: '#000000', strokeThickness: 1, wordWrap: { width: 500 },
    }).setOrigin(0.5);

    this.statsText = this.add.text(GAME_WIDTH / 2, 270, '', {
      fontSize: '13px', fontFamily: MONO, color: '#888888',
      stroke: '#000000', strokeThickness: 1,
    }).setOrigin(0.5);

    this.weaponText = this.add.text(GAME_WIDTH / 2, 292, '', {
      fontSize: '13px', fontFamily: FONT, color: '#556677',
      stroke: '#000000', strokeThickness: 1,
    }).setOrigin(0.5);

    // Preview box
    this.preview = this.add.graphics();

    // Controls
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 22, 'UP/DOWN: Select  |  Z/ENTER: Confirm', {
      fontSize: '12px', fontFamily: MONO, color: '#555566',
      stroke: '#000000', strokeThickness: 1,
    }).setOrigin(0.5);

    // Input
    this.input.keyboard!.on('keydown-UP', () => this.move(-1));
    this.input.keyboard!.on('keydown-DOWN', () => this.move(1));
    this.input.keyboard!.on('keydown-Z', () => this.confirm());
    this.input.keyboard!.on('keydown-ENTER', () => this.confirm());

    this.updateSelection();
  }

  private move(dir: number) {
    this.selectedIndex = (this.selectedIndex + dir + CLASSES.length) % CLASSES.length;
    playSound('menuSelect');
    this.updateSelection();
  }

  private updateSelection() {
    const cls = CLASSES[this.selectedIndex];
    const startY = 90;
    const spacing = 45;

    // Move cursor
    this.cursor.setY(startY + this.selectedIndex * spacing);

    // Highlight selected, dim others
    for (let i = 0; i < this.classTexts.length; i++) {
      this.classTexts[i].setAlpha(i === this.selectedIndex ? 1 : 0.4);
      this.classTexts[i].setScale(i === this.selectedIndex ? 1.1 : 1);
    }

    // Update details
    this.descText.setText(cls.desc);
    this.statsText.setText(cls.stats);
    this.weaponText.setText(`Weapon: ${cls.weapon}`);

    // Preview character
    this.preview.clear();
    this.preview.fillStyle(cls.color);
    this.preview.fillRect(GAME_WIDTH / 2 - 7, 210, 14, 24);
    this.preview.lineStyle(1, 0xffffff, 0.3);
    this.preview.strokeRect(GAME_WIDTH / 2 - 7, 210, 14, 24);
  }

  private confirm() {
    const cls = CLASSES[this.selectedIndex];
    playSound('menuConfirm');

    // Flash effect
    this.cameras.main.flash(300, 255, 255, 255);

    this.time.delayedCall(300, () => {
      this.scene.start('GameScene', { selectedClass: cls.id });
    });
  }
}
