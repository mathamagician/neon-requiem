import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../../shared/constants';
import type { ClassName } from './GameScene';

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

    this.add.text(GAME_WIDTH / 2, 20, 'CHOOSE YOUR CLASS', {
      fontSize: '10px', fontFamily: 'monospace', color: '#00ffcc', resolution: 2,
    }).setOrigin(0.5);

    // Class options
    const startY = 60;
    const spacing = 30;

    for (let i = 0; i < CLASSES.length; i++) {
      const cls = CLASSES[i];
      const colorStr = '#' + cls.color.toString(16).padStart(6, '0');
      const t = this.add.text(GAME_WIDTH / 2, startY + i * spacing, cls.name, {
        fontSize: '10px', fontFamily: 'monospace', color: colorStr, resolution: 2,
      }).setOrigin(0.5);
      this.classTexts.push(t);
    }

    // Selection cursor
    this.cursor = this.add.text(GAME_WIDTH / 2 - 55, startY, '>', {
      fontSize: '10px', fontFamily: 'monospace', color: '#ffffff', resolution: 2,
    }).setOrigin(0.5);

    // Details area
    this.descText = this.add.text(GAME_WIDTH / 2, 170, '', {
      fontSize: '6px', fontFamily: 'monospace', color: '#aaaaaa', resolution: 2, wordWrap: { width: 300 },
    }).setOrigin(0.5);

    this.statsText = this.add.text(GAME_WIDTH / 2, 185, '', {
      fontSize: '6px', fontFamily: 'monospace', color: '#888888', resolution: 2,
    }).setOrigin(0.5);

    this.weaponText = this.add.text(GAME_WIDTH / 2, 195, '', {
      fontSize: '6px', fontFamily: 'monospace', color: '#556677', resolution: 2,
    }).setOrigin(0.5);

    // Preview box
    this.preview = this.add.graphics();

    // Controls
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 15, 'UP/DOWN: Select | Z/ENTER: Confirm', {
      fontSize: '6px', fontFamily: 'monospace', color: '#555555', resolution: 2,
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
    this.updateSelection();
  }

  private updateSelection() {
    const cls = CLASSES[this.selectedIndex];
    const startY = 60;
    const spacing = 30;

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
    this.preview.fillRect(GAME_WIDTH / 2 - 7, 135, 14, 24);
    this.preview.lineStyle(1, 0xffffff, 0.3);
    this.preview.strokeRect(GAME_WIDTH / 2 - 7, 135, 14, 24);
  }

  private confirm() {
    const cls = CLASSES[this.selectedIndex];

    // Flash effect
    this.cameras.main.flash(300, 255, 255, 255);

    this.time.delayedCall(300, () => {
      this.scene.start('GameScene', { selectedClass: cls.id });
    });
  }
}
