import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../../shared/constants';
import { RARITY_COLORS, RARITY_NAMES } from '../../shared/data/equipment';
import type { EquipSlot } from '../../shared/data/equipment';
import type { InventorySystem } from '../systems/InventorySystem';
import type { GameScene } from './GameScene';

const FONT = 'Arial, Helvetica, sans-serif';
const MONO = 'Consolas, "Courier New", monospace';

export class InventoryScene extends Phaser.Scene {
  private gameScene!: GameScene;
  private bg!: Phaser.GameObjects.Graphics;
  private texts: Phaser.GameObjects.Text[] = [];
  private selectedIndex = 0;
  private mode: 'stats' | 'backpack' = 'stats';
  private _discardBound = false;

  constructor() {
    super({ key: 'InventoryScene' });
  }

  init(data: { gameScene: GameScene }) {
    this.gameScene = data.gameScene;
    this.selectedIndex = 0;
    this._discardBound = false;
  }

  create() {
    this.bg = this.add.graphics();
    this.bg.fillStyle(0x0a0a18, 0.92);
    this.bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Border frame
    this.bg.lineStyle(2, 0x00ffcc, 0.4);
    this.bg.strokeRect(10, 10, GAME_WIDTH - 20, GAME_HEIGHT - 20);

    this.input.keyboard!.on('keydown-TAB', (e: KeyboardEvent) => { e.preventDefault(); this.closeInventory(); });
    this.input.keyboard!.on('keydown-ESC', () => this.closeInventory());
    this.input.keyboard!.on('keydown-LEFT', () => { this.mode = 'stats'; this.selectedIndex = 0; this.refresh(); });
    this.input.keyboard!.on('keydown-RIGHT', () => { this.mode = 'backpack'; this.selectedIndex = 0; this.refresh(); });
    this.input.keyboard!.on('keydown-UP', () => { this.selectedIndex = Math.max(0, this.selectedIndex - 1); this.refresh(); });
    this.input.keyboard!.on('keydown-DOWN', () => { this.selectedIndex++; this.refresh(); });
    this.input.keyboard!.on('keydown-Z', () => this.handleAction());

    this.refresh();
  }

  private refresh() {
    this.texts.forEach(t => t.destroy());
    this.texts = [];

    const inv = this.gameScene.getInventory();
    const player = this.gameScene.player;

    // Helper: create text and track it
    const t = (text: string, x: number, y: number, opts: Partial<Phaser.Types.GameObjects.Text.TextStyle> = {}) => {
      const obj = this.add.text(x, y, text, {
        fontSize: '13px', fontFamily: FONT, color: '#cccccc',
        stroke: '#000000', strokeThickness: 1,
        ...opts,
      });
      this.texts.push(obj);
      return obj;
    };

    // Title
    t('INVENTORY', GAME_WIDTH / 2, 20, {
      fontSize: '20px', color: '#00ffcc', fontStyle: 'bold', strokeThickness: 2,
    }).setOrigin(0.5);

    // Tab switcher
    const statsActive = this.mode === 'stats';
    const tabY = 46;
    t(statsActive ? '[ STATS ]' : '  STATS  ', GAME_WIDTH / 2 - 70, tabY, {
      fontSize: '14px', color: statsActive ? '#ffffff' : '#555555', fontFamily: MONO,
    });
    t(!statsActive ? '[ BACKPACK ]' : '  BACKPACK  ', GAME_WIDTH / 2 + 20, tabY, {
      fontSize: '14px', color: !statsActive ? '#ffffff' : '#555555', fontFamily: MONO,
    });

    // Footer
    t('TAB/ESC: Close  |  LEFT/RIGHT: Tab  |  UP/DOWN: Select  |  Z: Use', GAME_WIDTH / 2, GAME_HEIGHT - 22, {
      fontSize: '11px', color: '#555566', fontFamily: MONO,
    }).setOrigin(0.5);

    if (this.mode === 'stats') {
      this.renderStats(inv, player, t);
    } else {
      this.renderBackpack(inv, t);
    }
  }

  private renderStats(
    inv: InventorySystem,
    player: any,
    t: (text: string, x: number, y: number, opts?: Partial<Phaser.Types.GameObjects.Text.TextStyle>) => Phaser.GameObjects.Text
  ) {
    const lx = 30; // Left column
    const rx = GAME_WIDTH / 2 + 20; // Right column
    let ly = 70;
    let ry = 70;

    // -- Left column: Player Info + Stats --
    t(`Level ${player.level}`, lx, ly, { fontSize: '16px', color: '#ffcc44', fontStyle: 'bold' });
    t(`XP: ${player.xp} / ${player.xpToNext}`, lx + 100, ly + 2, { fontSize: '12px', color: '#aa8833' });
    ly += 24;

    t(`HP: ${player.hp} / ${player.maxHp}`, lx, ly, { fontSize: '13px', color: '#44ff44' });
    t(`Energy: ${player.energy} / ${player.maxEnergy}`, lx + 140, ly, { fontSize: '13px', color: '#4488ff' });
    ly += 28;

    // Stats header
    t('STATS', lx, ly, { fontSize: '14px', color: '#00ffcc', fontStyle: 'bold' });
    if (inv.stats.unspent > 0) {
      t(`(${inv.stats.unspent} points — Z to allocate)`, lx + 60, ly + 1, { fontSize: '12px', color: '#ffcc44' });
    }
    ly += 22;

    const statNames = ['might', 'precision', 'arcana', 'vitality'] as const;
    const statColors = ['#ff8844', '#44ff88', '#8844ff', '#ff4488'];
    const statDescs = ['Melee damage, HP bonus', 'Ranged damage, crit chance', 'Boss power damage, energy', 'Max HP, defense, regen'];

    for (let i = 0; i < statNames.length; i++) {
      const name = statNames[i];
      const base = inv.stats[name];
      const bonus = inv.getEquipBonuses()[name] ?? 0;
      const isSelected = this.selectedIndex === i;
      const arrow = isSelected ? '>' : ' ';
      const bonusTxt = bonus > 0 ? `  (+${bonus})` : '';

      t(`${arrow} ${name.toUpperCase()}: ${base}${bonusTxt}`, lx, ly, {
        fontSize: '14px', color: isSelected ? '#ffffff' : statColors[i],
        fontFamily: MONO, fontStyle: isSelected ? 'bold' : 'normal',
      });
      if (isSelected) {
        t(`  ${statDescs[i]}`, lx + 10, ly + 18, { fontSize: '11px', color: '#777777' });
      }
      ly += isSelected ? 38 : 22;
    }

    // -- Right column: Equipped items --
    t('EQUIPPED', rx, ry, { fontSize: '14px', color: '#00ffcc', fontStyle: 'bold' });
    ry += 24;

    const slots: EquipSlot[] = ['weapon', 'armor', 'accessory1', 'accessory2'];
    const slotLabels = ['Weapon', 'Armor', 'Accessory 1', 'Accessory 2'];

    for (let i = 0; i < slots.length; i++) {
      const item = inv.equipped[slots[i]];
      t(`${slotLabels[i]}:`, rx, ry, { fontSize: '12px', color: '#888888' });
      ry += 16;
      if (item) {
        const c = '#' + RARITY_COLORS[item.rarity].toString(16).padStart(6, '0');
        t(`  ${item.name}`, rx, ry, { fontSize: '13px', color: c, fontStyle: 'bold' });
        ry += 16;
        t(`  ${RARITY_NAMES[item.rarity]} — ${item.description || 'No mods'}`, rx, ry, {
          fontSize: '11px', color: '#777777',
        });
      } else {
        t('  (empty)', rx, ry, { fontSize: '13px', color: '#444444' });
      }
      ry += 22;
    }
  }

  private renderBackpack(
    inv: InventorySystem,
    t: (text: string, x: number, y: number, opts?: Partial<Phaser.Types.GameObjects.Text.TextStyle>) => Phaser.GameObjects.Text
  ) {
    const x = 30;
    let y = 70;

    t(`BACKPACK  (${inv.backpack.length} / ${inv.MAX_BACKPACK})`, x, y, {
      fontSize: '14px', color: '#00ffcc', fontStyle: 'bold',
    });
    y += 26;

    if (inv.backpack.length === 0) {
      t('No items yet — defeat enemies to find loot!', x, y, { fontSize: '13px', color: '#555555' });
      return;
    }

    this.selectedIndex = Math.min(this.selectedIndex, inv.backpack.length - 1);

    const maxVisible = 10;
    const startIdx = Math.max(0, this.selectedIndex - Math.floor(maxVisible / 2));
    const endIdx = Math.min(inv.backpack.length, startIdx + maxVisible);

    for (let i = startIdx; i < endIdx; i++) {
      const item = inv.backpack[i];
      const isSel = this.selectedIndex === i;
      const arrow = isSel ? '>' : ' ';
      const c = '#' + RARITY_COLORS[item.rarity].toString(16).padStart(6, '0');

      t(`${arrow} ${item.name}`, x, y, {
        fontSize: '14px', color: isSel ? '#ffffff' : c,
        fontFamily: MONO, fontStyle: isSel ? 'bold' : 'normal',
      });
      t(`[${item.slot}]`, x + 250, y + 1, { fontSize: '11px', color: '#666666' });

      if (isSel) {
        y += 20;
        t(`${RARITY_NAMES[item.rarity]}  |  Base: +${item.baseStat}`, x + 16, y, {
          fontSize: '12px', color: c,
        });
        y += 16;
        if (item.description) {
          t(item.description, x + 16, y, { fontSize: '12px', color: '#aaaaaa' });
          y += 16;
        }
        t('Z: Equip   X: Discard', x + 16, y, { fontSize: '12px', color: '#ffcc44', fontStyle: 'bold' });
        y += 6;
      }
      y += 22;
    }

    if (!this._discardBound) {
      this._discardBound = true;
      this.input.keyboard!.on('keydown-X', () => {
        if (this.mode === 'backpack' && inv.backpack[this.selectedIndex]) {
          inv.discard(inv.backpack[this.selectedIndex].id);
          this.refresh();
        }
      });
    }
  }

  private handleAction() {
    const inv = this.gameScene.getInventory();
    if (this.mode === 'stats') {
      const statNames = ['might', 'precision', 'arcana', 'vitality'] as const;
      if (this.selectedIndex < statNames.length) {
        inv.allocateStat(statNames[this.selectedIndex]);
        this.refresh();
      }
    } else if (this.mode === 'backpack') {
      const item = inv.backpack[this.selectedIndex];
      if (item) {
        inv.equip(item);
        this.refresh();
      }
    }
  }

  private closeInventory() {
    this.scene.stop('InventoryScene');
    this.gameScene.scene.resume('GameScene');
  }
}
