import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../../shared/constants';
import { generateDrop, type EquipmentItem, RARITY_COLORS, type Rarity } from '../../shared/data/equipment';
import type { InventorySystem } from '../systems/InventorySystem';
import { playSound } from '../systems/SoundManager';
import { drawPanel, drawDivider, drawSectionHeader, drawItemSlot, RARITY_INT } from '../systems/UIHelper';

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

function generateShopStock(playerLevel: number): ShopEntry[] {
  const stock: ShopEntry[] = [];

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
  private texts: Phaser.GameObjects.Text[] = [];
  private panelGfx!: Phaser.GameObjects.Graphics;
  private contentGfx!: Phaser.GameObjects.Graphics;
  private gold = 0;

  constructor() {
    super({ key: 'ShopScene' });
  }

  init(data: { gameScene: any }) {
    this.gameScene = data.gameScene;
    this.inventory = this.gameScene.getInventory();
    this.gold = this.gameScene.gold ?? 0;
    this.stock = generateShopStock(this.gameScene.player?.level ?? 1);
    this.selectedIndex = 0;
  }

  create() {
    this.panelGfx = this.add.graphics();
    this.contentGfx = this.add.graphics();

    this.input.keyboard!.on('keydown-UP', () => {
      this.selectedIndex = (this.selectedIndex - 1 + this.stock.length) % this.stock.length;
      playSound('menuSelect');
      this.refresh();
    });
    this.input.keyboard!.on('keydown-DOWN', () => {
      this.selectedIndex = (this.selectedIndex + 1) % this.stock.length;
      playSound('menuSelect');
      this.refresh();
    });
    this.input.keyboard!.on('keydown-Z', () => this.buySelected());
    this.input.keyboard!.on('keydown-ENTER', () => this.buySelected());
    this.input.keyboard!.on('keydown-ESC', () => this.closeShop());
    this.input.keyboard!.on('keydown-TAB', (e: KeyboardEvent) => {
      e.preventDefault();
      this.closeShop();
    });

    this.refresh();
  }

  private refresh() {
    this.texts.forEach(t => t.destroy());
    this.texts = [];
    this.panelGfx.clear();
    this.contentGfx.clear();

    const g = this.panelGfx;
    const cg = this.contentGfx;

    // Dim background
    g.fillStyle(0x050510, 0.92);
    g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Main panel
    drawPanel(g, 20, 8, GAME_WIDTH - 40, GAME_HEIGHT - 16, { borderColor: 0xccaa66 });

    // Title bar
    drawSectionHeader(g, 24, 12, GAME_WIDTH - 48, 0xccaa66);
    this.txt('THRESHOLD SHOP', GAME_WIDTH / 2, 16, {
      fontSize: '15px', color: '#ccaa66', fontStyle: 'bold',
    }).setOrigin(0.5, 0);

    // Gold display
    cg.fillStyle(0xffcc44, 0.8);
    cg.fillRect(GAME_WIDTH - 70, 15, 8, 8);
    cg.lineStyle(1, 0xffee88, 0.6);
    cg.strokeRect(GAME_WIDTH - 70, 15, 8, 8);
    this.txt(`${this.gold}`, GAME_WIDTH - 56, 14, {
      fontSize: '14px', color: '#ffcc44', fontFamily: MONO, fontStyle: 'bold',
    });

    // Item list
    const listX = 28;
    let listY = 38;

    // Consumables header
    drawDivider(cg, listX, listY, GAME_WIDTH - 56);
    this.txt('CONSUMABLES', listX + 4, listY + 2, {
      fontSize: '9px', color: '#667788', fontFamily: MONO,
    });
    listY += 16;

    let equipHeaderDrawn = false;

    for (let i = 0; i < this.stock.length; i++) {
      const entry = this.stock[i];
      const isSel = this.selectedIndex === i;

      // Equipment header
      if (entry.type === 'equipment' && !equipHeaderDrawn) {
        equipHeaderDrawn = true;
        listY += 4;
        drawDivider(cg, listX, listY, GAME_WIDTH - 56);
        this.txt('EQUIPMENT', listX + 4, listY + 2, {
          fontSize: '9px', color: '#667788', fontFamily: MONO,
        });
        listY += 16;
      }

      let name: string;
      let rColor: number;
      let price: number;

      if (entry.type === 'consumable') {
        name = entry.name;
        rColor = entry.color;
        price = entry.price;
      } else {
        name = entry.item.name;
        rColor = RARITY_INT[entry.item.rarity] ?? 0xaaaaaa;
        price = entry.price;
      }

      // Selection highlight
      if (isSel) {
        cg.fillStyle(rColor, 0.08);
        cg.fillRect(listX, listY - 2, GAME_WIDTH - 56, 42);
      }

      // Item icon
      drawItemSlot(cg, listX + 4, listY, 16, rColor, true);

      // Name
      const cHex = '#' + rColor.toString(16).padStart(6, '0');
      this.txt(`${isSel ? '▸ ' : '  '}${name}`, listX + 26, listY, {
        fontSize: '12px', color: isSel ? '#ffffff' : cHex,
        fontStyle: isSel ? 'bold' : 'normal',
      });

      // Price
      const canAfford = this.gold >= price;
      this.txt(`${price}g`, GAME_WIDTH - 70, listY, {
        fontSize: '11px', color: canAfford ? '#ffcc44' : '#ff4444',
        fontFamily: MONO,
      });

      if (isSel) {
        if (entry.type === 'consumable') {
          this.txt(entry.description, listX + 28, listY + 16, {
            fontSize: '10px', color: '#889999',
          });
        } else {
          const item = entry.item;
          const mods = item.modifiers.map(m => `+${m.value} ${m.stat}`).join(', ');
          this.txt(`${item.rarity.toUpperCase()} ${item.slot}  |  Base: +${item.baseStat}`, listX + 28, listY + 16, {
            fontSize: '10px', color: cHex,
          });
          if (mods) {
            this.txt(mods, listX + 28, listY + 28, { fontSize: '10px', color: '#889999' });
          }
        }
        listY += 42;
      } else {
        listY += 22;
      }
    }

    // Footer
    this.txt('↑/↓: Browse  |  Z/Enter: Buy  |  ESC/TAB: Leave', GAME_WIDTH / 2, GAME_HEIGHT - 18, {
      fontSize: '10px', color: '#445566', fontFamily: MONO,
    }).setOrigin(0.5);
  }

  private buySelected() {
    const entry = this.stock[this.selectedIndex];
    if (this.gold < entry.price) {
      playSound('menuSelect');
      this.showMessage('Not enough gold!', '#ff4444');
      return;
    }

    if (entry.type === 'consumable') {
      playSound('shopBuy');
      this.gold -= entry.price;
      this.gameScene.gold = this.gold;
      this.applyConsumable(entry);
      this.showMessage(`Used ${entry.name}`, '#44ffaa');
      this.refresh();
    } else {
      if (this.inventory.backpack.length >= this.inventory.MAX_BACKPACK) {
        playSound('menuSelect');
        this.showMessage('Backpack full!', '#ff4444');
        return;
      }
      playSound('shopBuy');
      this.gold -= entry.price;
      this.gameScene.gold = this.gold;
      this.inventory.addItem(entry.item);
      this.stock.splice(this.selectedIndex, 1);
      this.selectedIndex = Math.min(this.selectedIndex, this.stock.length - 1);
      this.showMessage(`Purchased ${entry.item.name}`, '#44ffaa');
      this.refresh();
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

  private showMessage(msg: string, color: string) {
    const text = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 40, msg, {
      fontSize: '12px', fontFamily: FONT, color,
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5);
    this.texts.push(text);

    this.tweens.add({
      targets: text, alpha: 0, y: text.y - 10,
      duration: 1500, onComplete: () => text.destroy(),
    });
  }

  private closeShop() {
    this.input.keyboard!.removeAllListeners();
    this.scene.stop('ShopScene');
    this.scene.resume('GameScene');
  }

  private txt(text: string, x: number, y: number, opts: Partial<Phaser.Types.GameObjects.Text.TextStyle> = {}): Phaser.GameObjects.Text {
    const obj = this.add.text(x, y, text, {
      fontSize: '12px', fontFamily: FONT, color: '#cccccc',
      stroke: '#000000', strokeThickness: 1,
      ...opts,
    });
    this.texts.push(obj);
    return obj;
  }
}
