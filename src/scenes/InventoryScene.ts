import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../../shared/constants';
import { RARITY_COLORS, RARITY_NAMES } from '../../shared/data/equipment';
import type { EquipmentItem, EquipSlot } from '../../shared/data/equipment';
import type { InventorySystem } from '../systems/InventorySystem';
import type { GameScene } from './GameScene';

/**
 * Full-screen inventory overlay.
 * TAB to toggle open/close.
 * Shows: stats, equipped items, backpack, stat allocation.
 */
export class InventoryScene extends Phaser.Scene {
  private gameScene!: GameScene;
  private bg!: Phaser.GameObjects.Graphics;
  private texts: Phaser.GameObjects.Text[] = [];
  private selectedIndex = 0;
  private mode: 'stats' | 'backpack' = 'stats';

  constructor() {
    super({ key: 'InventoryScene' });
  }

  init(data: { gameScene: GameScene }) {
    this.gameScene = data.gameScene;
  }

  create() {
    // Semi-transparent background
    this.bg = this.add.graphics();
    this.bg.fillStyle(0x000000, 0.85);
    this.bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Close on TAB or ESC
    this.input.keyboard!.on('keydown-TAB', () => this.closeInventory());
    this.input.keyboard!.on('keydown-ESC', () => this.closeInventory());

    // Navigate
    this.input.keyboard!.on('keydown-LEFT', () => { this.mode = 'stats'; this.refresh(); });
    this.input.keyboard!.on('keydown-RIGHT', () => { this.mode = 'backpack'; this.refresh(); });
    this.input.keyboard!.on('keydown-UP', () => { this.selectedIndex = Math.max(0, this.selectedIndex - 1); this.refresh(); });
    this.input.keyboard!.on('keydown-DOWN', () => { this.selectedIndex++; this.refresh(); });

    // Allocate stat / equip item with Z
    this.input.keyboard!.on('keydown-Z', () => this.handleAction());

    this.refresh();
  }

  private refresh() {
    // Clear old texts
    this.texts.forEach(t => t.destroy());
    this.texts = [];

    const inv = this.gameScene.getInventory();
    const player = this.gameScene.player;
    const ts = (text: string, x: number, y: number, color = '#ffffff', size = '7px') => {
      const t = this.add.text(x, y, text, {
        fontSize: size, fontFamily: 'monospace', color, resolution: 2,
      });
      this.texts.push(t);
      return t;
    };

    // Title bar
    ts('INVENTORY', GAME_WIDTH / 2 - 25, 4, '#00ffcc', '8px');
    ts(`[<] ${this.mode === 'stats' ? '> STATS <' : 'STATS'}   ${this.mode === 'backpack' ? '> BACKPACK <' : 'BACKPACK'} [>]`,
      GAME_WIDTH / 2 - 60, 16, '#888888', '6px');
    ts('TAB/ESC: Close | Arrows: Navigate | Z: Select', GAME_WIDTH / 2 - 80, GAME_HEIGHT - 10, '#555555', '5px');

    if (this.mode === 'stats') {
      this.renderStats(inv, player, ts);
    } else {
      this.renderBackpack(inv, ts);
    }
  }

  private renderStats(
    inv: InventorySystem,
    player: any,
    ts: (text: string, x: number, y: number, color?: string, size?: string) => Phaser.GameObjects.Text
  ) {
    const x = 10;
    let y = 30;

    // Player info
    ts(`Level ${player.level}  XP: ${player.xp}/${player.xpToNext}`, x, y, '#ffcc44');
    y += 12;
    ts(`HP: ${player.hp}/${player.maxHp}  Energy: ${player.energy}/${player.maxEnergy}`, x, y, '#88ff88');
    y += 16;

    // Stats
    ts('-- STATS --', x, y, '#00ffcc');
    y += 10;
    const statNames = ['might', 'precision', 'arcana', 'vitality'] as const;
    const statColors = ['#ff8844', '#44ff88', '#8844ff', '#ff4488'];

    for (let i = 0; i < statNames.length; i++) {
      const name = statNames[i];
      const base = inv.stats[name];
      const bonus = inv.getEquipBonuses()[name] ?? 0;
      const isSelected = this.mode === 'stats' && this.selectedIndex === i;
      const prefix = isSelected ? '> ' : '  ';
      const bonusText = bonus > 0 ? ` (+${bonus})` : '';
      ts(`${prefix}${name.toUpperCase()}: ${base}${bonusText}`, x, y, isSelected ? '#ffffff' : statColors[i]);
      y += 10;
    }

    if (inv.stats.unspent > 0) {
      y += 4;
      ts(`${inv.stats.unspent} points to allocate (Z to spend)`, x, y, '#ffcc44');
    }

    // Equipped items
    y += 16;
    ts('-- EQUIPPED --', x, y, '#00ffcc');
    y += 10;

    const slots: EquipSlot[] = ['weapon', 'armor', 'accessory1', 'accessory2'];
    const slotLabels = ['Weapon', 'Armor', 'Accessory 1', 'Accessory 2'];
    for (let i = 0; i < slots.length; i++) {
      const item = inv.equipped[slots[i]];
      if (item) {
        const color = '#' + RARITY_COLORS[item.rarity].toString(16).padStart(6, '0');
        ts(`  ${slotLabels[i]}: ${item.name} (${RARITY_NAMES[item.rarity]})`, x, y, color);
        if (item.modifiers.length > 0) {
          y += 8;
          ts(`    ${item.description}`, x, y, '#888888', '5px');
        }
      } else {
        ts(`  ${slotLabels[i]}: (empty)`, x, y, '#555555');
      }
      y += 10;
    }
  }

  private renderBackpack(
    inv: InventorySystem,
    ts: (text: string, x: number, y: number, color?: string, size?: string) => Phaser.GameObjects.Text
  ) {
    const x = 10;
    let y = 30;

    ts(`BACKPACK (${inv.backpack.length}/${inv.MAX_BACKPACK})`, x, y, '#00ffcc');
    y += 12;

    if (inv.backpack.length === 0) {
      ts('  (empty — defeat enemies to find loot!)', x, y, '#555555');
      return;
    }

    this.selectedIndex = Math.min(this.selectedIndex, inv.backpack.length - 1);

    // Show up to 12 items with scroll
    const startIdx = Math.max(0, this.selectedIndex - 6);
    const endIdx = Math.min(inv.backpack.length, startIdx + 12);

    for (let i = startIdx; i < endIdx; i++) {
      const item = inv.backpack[i];
      const isSelected = this.selectedIndex === i;
      const prefix = isSelected ? '> ' : '  ';
      const color = '#' + RARITY_COLORS[item.rarity].toString(16).padStart(6, '0');
      ts(`${prefix}${item.name} [${item.slot}]`, x, y, isSelected ? '#ffffff' : color);
      y += 8;

      if (isSelected) {
        // Show details for selected item
        ts(`    ${RARITY_NAMES[item.rarity]} | Base: +${item.baseStat}`, x, y, color, '5px');
        y += 7;
        if (item.description) {
          ts(`    ${item.description}`, x, y, '#aaaaaa', '5px');
          y += 7;
        }
        ts('    Z: Equip  |  X: Discard', x, y, '#ffcc44', '5px');
        y += 7;
      }
      y += 2;
    }

    // Handle X to discard
    if (!this._discardHandler) {
      this._discardHandler = true;
      this.input.keyboard!.on('keydown-X', () => {
        if (this.mode === 'backpack' && inv.backpack[this.selectedIndex]) {
          inv.discard(inv.backpack[this.selectedIndex].id);
          this.refresh();
        }
      });
    }
  }

  private _discardHandler = false;

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
