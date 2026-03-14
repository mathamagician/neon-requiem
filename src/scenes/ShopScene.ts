import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../../shared/constants';
import { generateDrop, type EquipmentItem, RARITY_COLORS, type Rarity } from '../../shared/data/equipment';
import type { InventorySystem } from '../systems/InventorySystem';

const MONO = 'Consolas, "Courier New", monospace';
const FONT = 'Arial, Helvetica, sans-serif';

interface ShopItem {
  type: 'equipment';
  item: EquipmentItem;
  price: number;
}

interface ConsumableItem {
  type: 'consumable';
  id: string;
  name: string;
  description: string;
  price: number;
  color: number;
}

type ShopEntry = ShopItem | ConsumableItem;

/** Generates a shop stock based on player level */
function generateShopStock(playerLevel: number): ShopEntry[] {
  const stock: ShopEntry[] = [];

  // Consumables (always available)
  stock.push({
    type: 'consumable', id: 'potion_hp', name: 'Repair Kit',
    description: 'Restore 40% HP', price: 50, color: 0xff4444,
  });
  stock.push({
    type: 'consumable', id: 'potion_energy', name: 'Surge Cell',
    description: 'Restore 40% Energy', price: 40, color: 0x44aaff,
  });
  stock.push({
    type: 'consumable', id: 'potion_full', name: 'Nano Revive',
    description: 'Full HP + Energy restore', price: 120, color: 0x44ffaa,
  });

  // Equipment (3 random pieces, biased uncommon+)
  for (let i = 0; i < 3; i++) {
    const item = generateDrop(playerLevel);
    const rarityMultiplier: Record<Rarity, number> = {
      common: 1, uncommon: 1.5, rare: 2.5, epic: 4, legendary: 8,
    };
    const price = Math.floor((30 + playerLevel * 10) * (rarityMultiplier[item.rarity] ?? 1));
    stock.push({ type: 'equipment', item, price });
  }

  return stock;
}

export class ShopScene extends Phaser.Scene {
  private gameScene!: any;
  private inventory!: InventorySystem;
  private stock: ShopEntry[] = [];
  private selectedIndex = 0;
  private itemTexts: Phaser.GameObjects.Text[] = [];
  private infoText!: Phaser.GameObjects.Text;
  private goldText!: Phaser.GameObjects.Text;
  private gold = 0;

  constructor() {
    super({ key: 'ShopScene' });
  }

  init(data: { gameScene: any }) {
    this.gameScene = data.gameScene;
    this.inventory = this.gameScene.getInventory();
    this.gold = this.gameScene.gold ?? 0;
    this.stock = generateShopStock(this.gameScene.player?.level ?? 1);
  }

  create() {
    // Dim overlay
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.85);
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Title
    this.add.text(GAME_WIDTH / 2, 16, 'THRESHOLD SHOP', {
      fontSize: '16px', fontFamily: MONO, color: '#ccaa66',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5);

    // Gold display
    this.goldText = this.add.text(GAME_WIDTH - 20, 16, `Gold: ${this.gold}`, {
      fontSize: '12px', fontFamily: MONO, color: '#ffcc44',
      stroke: '#000000', strokeThickness: 1,
    }).setOrigin(1, 0.5);

    // Item list
    this.itemTexts = [];
    const startY = 42;
    const lineH = 28;

    for (let i = 0; i < this.stock.length; i++) {
      const entry = this.stock[i];
      const y = startY + i * lineH;

      let name: string;
      let color: string;
      let priceStr: string;

      if (entry.type === 'consumable') {
        name = entry.name;
        color = '#' + entry.color.toString(16).padStart(6, '0');
        priceStr = `${entry.price}g`;
      } else {
        name = entry.item.name;
        const rarityHex = RARITY_COLORS[entry.item.rarity];
        color = '#' + rarityHex.toString(16).padStart(6, '0');
        priceStr = `${entry.price}g`;
      }

      const text = this.add.text(30, y, `${name}  [${priceStr}]`, {
        fontSize: '12px', fontFamily: MONO, color,
        stroke: '#000000', strokeThickness: 1,
      });
      this.itemTexts.push(text);
    }

    // Info panel
    this.infoText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 70, '', {
      fontSize: '11px', fontFamily: FONT, color: '#aabbcc',
      stroke: '#000000', strokeThickness: 1, wordWrap: { width: GAME_WIDTH - 40 },
    }).setOrigin(0.5, 0);

    // Controls hint
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 20, 'UP/DOWN: Browse | Z/ENTER: Buy | ESC/TAB: Leave', {
      fontSize: '10px', fontFamily: MONO, color: '#556677',
      stroke: '#000000', strokeThickness: 1,
    }).setOrigin(0.5);

    this.updateSelection();

    // Input
    this.input.keyboard!.on('keydown-UP', () => {
      this.selectedIndex = (this.selectedIndex - 1 + this.stock.length) % this.stock.length;
      this.updateSelection();
    });
    this.input.keyboard!.on('keydown-DOWN', () => {
      this.selectedIndex = (this.selectedIndex + 1) % this.stock.length;
      this.updateSelection();
    });
    this.input.keyboard!.on('keydown-Z', () => this.buySelected());
    this.input.keyboard!.on('keydown-ENTER', () => this.buySelected());
    this.input.keyboard!.on('keydown-ESC', () => this.closeShop());
    this.input.keyboard!.on('keydown-TAB', (e: KeyboardEvent) => {
      e.preventDefault();
      this.closeShop();
    });
  }

  private updateSelection() {
    for (let i = 0; i < this.itemTexts.length; i++) {
      this.itemTexts[i].setAlpha(i === this.selectedIndex ? 1 : 0.5);
      this.itemTexts[i].setText(
        (i === this.selectedIndex ? '> ' : '  ') + this.getEntryLabel(this.stock[i])
      );
    }

    // Update info text
    const entry = this.stock[this.selectedIndex];
    if (entry.type === 'consumable') {
      this.infoText.setText(entry.description);
    } else {
      const item = entry.item;
      const mods = item.modifiers.map(m => `+${m.value} ${m.stat}`).join(', ');
      this.infoText.setText(`${item.rarity.toUpperCase()} ${item.slot} | Base: ${item.baseStat}\n${mods || 'No bonuses'}`);
    }
  }

  private getEntryLabel(entry: ShopEntry): string {
    if (entry.type === 'consumable') {
      return `${entry.name}  [${entry.price}g]`;
    }
    return `${entry.item.name}  [${entry.price}g]`;
  }

  private buySelected() {
    const entry = this.stock[this.selectedIndex];
    if (this.gold < entry.price) {
      this.showMessage('Not enough gold!', '#ff4444');
      return;
    }

    if (entry.type === 'consumable') {
      this.gold -= entry.price;
      this.gameScene.gold = this.gold;
      this.goldText.setText(`Gold: ${this.gold}`);
      this.applyConsumable(entry);
      this.showMessage(`Used ${entry.name}`, '#44ffaa');
    } else {
      if (this.inventory.backpack.length >= this.inventory.MAX_BACKPACK) {
        this.showMessage('Backpack full!', '#ff4444');
        return;
      }
      this.gold -= entry.price;
      this.gameScene.gold = this.gold;
      this.goldText.setText(`Gold: ${this.gold}`);
      this.inventory.addItem(entry.item);
      // Remove from shop stock
      this.stock.splice(this.selectedIndex, 1);
      this.selectedIndex = Math.min(this.selectedIndex, this.stock.length - 1);
      this.rebuildList();
      this.showMessage(`Purchased ${entry.item.name}`, '#44ffaa');
    }
  }

  private applyConsumable(entry: ConsumableItem) {
    const player = this.gameScene.player;
    if (!player) return;

    switch (entry.id) {
      case 'potion_hp':
        player.hp = Math.min(player.maxHp, player.hp + Math.floor(player.maxHp * 0.4));
        break;
      case 'potion_energy':
        player.energy = Math.min(player.maxEnergy, player.energy + Math.floor(player.maxEnergy * 0.4));
        break;
      case 'potion_full':
        player.hp = player.maxHp;
        player.energy = player.maxEnergy;
        break;
    }
  }

  private rebuildList() {
    for (const t of this.itemTexts) t.destroy();
    this.itemTexts = [];

    const startY = 42;
    const lineH = 28;

    for (let i = 0; i < this.stock.length; i++) {
      const entry = this.stock[i];
      const y = startY + i * lineH;
      let color: string;

      if (entry.type === 'consumable') {
        color = '#' + entry.color.toString(16).padStart(6, '0');
      } else {
        const rarityHex = RARITY_COLORS[entry.item.rarity];
        color = '#' + rarityHex.toString(16).padStart(6, '0');
      }

      const text = this.add.text(30, y, '', {
        fontSize: '12px', fontFamily: MONO, color,
        stroke: '#000000', strokeThickness: 1,
      });
      this.itemTexts.push(text);
    }

    this.updateSelection();
  }

  private showMessage(msg: string, color: string) {
    const text = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 45, msg, {
      fontSize: '12px', fontFamily: FONT, color,
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5);

    this.tweens.add({
      targets: text, alpha: 0, y: text.y - 10,
      duration: 1500, onComplete: () => text.destroy(),
    });
  }

  private closeShop() {
    this.scene.stop('ShopScene');
    this.scene.resume('GameScene');
  }
}
