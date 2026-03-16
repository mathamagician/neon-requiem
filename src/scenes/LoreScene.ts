import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../../shared/constants';
import { playSound } from '../systems/SoundManager';

const MONO = 'Consolas, "Courier New", monospace';
const FONT = 'Arial, Helvetica, sans-serif';

const PAGES = [
  {
    title: 'THE WORLD',
    body: [
      'In the year 2187, magic resurged from beneath',
      'the ruins of a hyper-connected world. Ancient',
      'ley lines fused with fiber-optic networks,',
      'creating the Neon — a volatile energy that',
      'warps both technology and living things.',
      '',
      'The great cities fell. In their place rose the',
      'Threshold — a sanctuary built where the old',
      'world\'s data highways cross the deepest ley',
      'lines. Here, survivors gather to push back the',
      'corruption spreading through four cursed zones.',
    ],
  },
  {
    title: 'THE MISSION',
    body: [
      'Four corrupted zones surround the Threshold.',
      'Each is controlled by a powerful boss who has',
      'merged with the Neon, becoming something',
      'beyond human or machine.',
      '',
      'Defeat each boss to absorb their power.',
      'Their abilities become yours — chain lightning,',
      'soul drain, thornlash, and plasma surge.',
      'Only by mastering all four can you push back',
      'the corruption and restore the Threshold.',
      '',
      'But the bosses grow stronger in a chain.',
      'Each one\'s weakness is another\'s power.',
    ],
  },
  {
    title: 'THE HEROES',
    body: [
      'VANGUARD — The shield-bearer. A former city',
      'guard who wields a spear, sword, and unbreak-',
      'able neon-forged shield. Tough and relentless.',
      '',
      'GUNNER — The marksman. An engineer who built',
      'a charged plasma cannon from salvaged tech.',
      'Deadly at range, fragile up close.',
      '',
      'WRAITH — The shadow. A rogue who moves between',
      'the Neon\'s cracks. Twin daggers, double jumps,',
      'wall clings. The fastest and most lethal — but',
      'one mistake is death.',
    ],
  },
];

export class LoreScene extends Phaser.Scene {
  private pageIndex = 0;
  private pageTexts: Phaser.GameObjects.Text[] = [];
  private titleText!: Phaser.GameObjects.Text;
  private navText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'LoreScene' });
  }

  create() {
    this.pageIndex = 0;

    // Background
    const bg = this.add.graphics();
    bg.fillStyle(0x050510, 0.97);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Decorative line
    const line = this.add.graphics();
    line.lineStyle(1, 0x00ffcc, 0.3);
    line.lineBetween(40, 50, GAME_WIDTH - 40, 50);
    line.lineBetween(40, GAME_HEIGHT - 50, GAME_WIDTH - 40, GAME_HEIGHT - 50);

    this.titleText = this.add.text(GAME_WIDTH / 2, 30, '', {
      fontSize: '18px', fontFamily: FONT, color: '#00ffcc',
      fontStyle: 'bold', stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5);

    this.navText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 30, '', {
      fontSize: '11px', fontFamily: MONO, color: '#556677',
      stroke: '#000000', strokeThickness: 1,
    }).setOrigin(0.5);

    this.renderPage();

    // Input
    this.input.keyboard!.on('keydown', (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
        case 'z':
        case 'Z':
        case 'Enter':
          if (this.pageIndex < PAGES.length - 1) {
            this.pageIndex++;
            this.renderPage();
            playSound('menuSelect');
          } else {
            playSound('menuConfirm');
            this.scene.start('ClassSelectScene');
          }
          break;
        case 'ArrowLeft':
          if (this.pageIndex > 0) {
            this.pageIndex--;
            this.renderPage();
            playSound('menuSelect');
          }
          break;
        case 'Escape':
          this.scene.start('TitleScene');
          break;
      }
    });
  }

  private renderPage() {
    // Clean up old text
    for (const t of this.pageTexts) t.destroy();
    this.pageTexts = [];

    const page = PAGES[this.pageIndex];
    this.titleText.setText(page.title);

    const startY = 65;
    const lineH = 18;
    for (let i = 0; i < page.body.length; i++) {
      const txt = this.add.text(GAME_WIDTH / 2, startY + i * lineH, page.body[i], {
        fontSize: '13px', fontFamily: FONT, color: '#bbccdd',
        stroke: '#000000', strokeThickness: 1,
      }).setOrigin(0.5);
      this.pageTexts.push(txt);
    }

    // Navigation hint
    const isLast = this.pageIndex === PAGES.length - 1;
    const isFirst = this.pageIndex === 0;
    let nav = '';
    if (!isFirst) nav += 'LEFT: Back | ';
    nav += isLast ? 'Z/ENTER: Begin | ' : 'Z/ENTER/RIGHT: Next | ';
    nav += 'ESC: Title';
    nav += `   (${this.pageIndex + 1}/${PAGES.length})`;
    this.navText.setText(nav);
  }
}
