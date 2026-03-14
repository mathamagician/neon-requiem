import Phaser from 'phaser';
import { TILE_SIZE } from '../../shared/constants';
import { Player } from '../entities/Player';
import { Gunner } from '../entities/Gunner';
import { Wraith } from '../entities/Wraith';
import { Enemy } from '../entities/Enemy';
import { CombatSystem } from '../systems/CombatSystem';
import { InventorySystem } from '../systems/InventorySystem';
import { generateDrop } from '../../shared/data/equipment';
import { createTestLevel, LEVEL_WIDTH_TILES, LEVEL_HEIGHT_TILES, BOSS_SPAWN_X, BOSS_TRIGGER_X } from '../levels/testLevel';
import { Boss } from '../entities/Boss';
import type { AnyPlayer } from '../entities/PlayerTypes';

export type ClassName = 'vanguard' | 'gunner' | 'wraith';

export class GameScene extends Phaser.Scene {
  player!: AnyPlayer;
  enemies!: Phaser.Physics.Arcade.Group;
  groundLayer!: Phaser.Tilemaps.TilemapLayer;
  combat!: CombatSystem;
  debugMode = false;
  currentClass: ClassName = 'vanguard';
  private classLabel!: Phaser.GameObjects.Text;
  private inventory!: InventorySystem;

  private lootDrops: { sprite: Phaser.GameObjects.Sprite; item: any }[] = [];
  bossPowers: string[] = [];
  private boss: Boss | null = null;
  private bossTriggered = false;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data?: { selectedClass?: ClassName }) {
    if (data?.selectedClass) {
      this.currentClass = data.selectedClass;
    }
  }

  create() {
    this.inventory = new InventorySystem();

    // -- Build tilemap --
    const map = this.make.tilemap({
      data: createTestLevel(),
      tileWidth: TILE_SIZE,
      tileHeight: TILE_SIZE,
    });

    const tileset = map.addTilesetImage('tileset', 'tileset', TILE_SIZE, TILE_SIZE, 0, 0)!;
    this.groundLayer = map.createLayer(0, tileset, 0, 0)!;
    this.groundLayer.setCollision([1, 3]);
    this.groundLayer.setCollision(2);
    this.groundLayer.forEachTile(tile => {
      if (tile.index === 2) tile.setCollision(false, false, true, false);
    });

    // -- Spawn player --
    const spawnY = LEVEL_HEIGHT_TILES * TILE_SIZE - 80;
    this.player = this.createPlayer(this.currentClass, 48, spawnY);

    // -- Spawn enemies --
    this.enemies = this.physics.add.group({ classType: Enemy, runChildUpdate: true });
    this.spawnEnemies();

    // -- Collisions --
    this.physics.add.collider(this.player.sprite, this.groundLayer);
    this.physics.add.collider(this.enemies, this.groundLayer);

    // -- Boss --
    const bossFloorY = LEVEL_HEIGHT_TILES * TILE_SIZE - 32;
    this.boss = new Boss(this, BOSS_SPAWN_X, bossFloorY);
    this.physics.add.collider(this.boss.sprite, this.groundLayer);

    // -- Combat --
    this.combat = new CombatSystem(this);

    // -- Camera --
    const worldWidth = LEVEL_WIDTH_TILES * TILE_SIZE;
    const worldHeight = LEVEL_HEIGHT_TILES * TILE_SIZE;
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);
    this.cameras.main.setDeadzone(40, 20);
    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);

    // -- HUD --
    this.scene.launch('HUDScene', { gameScene: this });

    // -- Keybindings --
    this.input.keyboard!.on('keydown-F1', () => {
      this.debugMode = !this.debugMode;
      this.physics.world.debugGraphic?.setVisible(this.debugMode);
      if (this.debugMode) this.physics.world.createDebugGraphic();
    });

    // Inventory toggle
    this.input.keyboard!.on('keydown-TAB', (e: KeyboardEvent) => {
      e.preventDefault();
      this.scene.pause('GameScene');
      this.scene.launch('InventoryScene', { gameScene: this });
    });

    // Class switch (testing)
    this.input.keyboard!.on('keydown-ONE', () => this.switchClass('vanguard'));
    this.input.keyboard!.on('keydown-TWO', () => this.switchClass('gunner'));
    this.input.keyboard!.on('keydown-THREE', () => this.switchClass('wraith'));

    const classColors: Record<ClassName, string> = { vanguard: '#4488ff', gunner: '#44ff88', wraith: '#aa44ff' };
    this.classLabel = this.add.text(240, 4, `${this.currentClass.toUpperCase()}  [1/2/3 | TAB: Inventory]`, {
      fontSize: '6px', fontFamily: 'monospace', color: classColors[this.currentClass], resolution: 2,
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(100);

    // -- Background --
    this.createBackground(worldWidth, worldHeight);
  }

  update(time: number, delta: number) {
    this.player.update(time, delta);
    this.combat.update(time, delta);
    this.checkLootPickup();

    // Boss trigger
    if (this.boss && !this.bossTriggered && this.player.sprite.x > BOSS_TRIGGER_X) {
      this.bossTriggered = true;
      this.boss.activate();
    }
    if (this.boss?.isActive) {
      this.boss.update(time, delta);
    }
  }

  getBoss(): Boss | null { return this.boss; }

  getInventory(): InventorySystem { return this.inventory; }

  /** Called by Enemy on death — spawns a loot drop */
  spawnLootDrop(x: number, y: number) {
    // 40% chance to drop loot
    if (Math.random() > 0.4) return;

    const item = generateDrop(this.player.level);
    const rarityColors: Record<string, number> = {
      common: 0xaaaaaa, uncommon: 0x44cc44, rare: 0x4488ff, epic: 0xaa44ff, legendary: 0xffaa00,
    };

    const g = this.add.graphics();
    const color = rarityColors[item.rarity] ?? 0xffffff;
    g.fillStyle(color, 0.9);
    g.fillRect(0, 0, 6, 6);
    g.lineStyle(1, 0xffffff, 0.5);
    g.strokeRect(0, 0, 6, 6);
    g.generateTexture(`loot-${item.id}`, 6, 6);
    g.destroy();

    const sprite = this.physics.add.sprite(x, y - 10, `loot-${item.id}`);
    sprite.setOrigin(0.5, 1);
    const body = sprite.body as Phaser.Physics.Arcade.Body;
    body.setVelocityY(-80);
    body.setVelocityX((Math.random() - 0.5) * 40);
    body.setBounce(0.3);
    body.setCollideWorldBounds(true);
    this.physics.add.collider(sprite, this.groundLayer);

    // Bobbing tween after landing
    this.time.delayedCall(600, () => {
      if (sprite.active) {
        this.tweens.add({
          targets: sprite,
          y: sprite.y - 3,
          duration: 500,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      }
    });

    this.lootDrops.push({ sprite, item });

    // Auto-destroy after 30 seconds
    this.time.delayedCall(30000, () => {
      if (sprite.active) {
        sprite.destroy();
        this.lootDrops = this.lootDrops.filter(d => d.sprite !== sprite);
      }
    });
  }

  private checkLootPickup() {
    const px = this.player.sprite.x;
    const py = this.player.sprite.y;

    for (let i = this.lootDrops.length - 1; i >= 0; i--) {
      const drop = this.lootDrops[i];
      if (!drop.sprite.active) {
        this.lootDrops.splice(i, 1);
        continue;
      }

      const dist = Phaser.Math.Distance.Between(px, py, drop.sprite.x, drop.sprite.y);
      if (dist < 20) {
        // Pick up!
        const added = this.inventory.addItem(drop.item);
        if (added) {
          // Pickup flash
          this.showLootText(drop.sprite.x, drop.sprite.y - 10, drop.item.name, drop.item.rarity);
          drop.sprite.destroy();
          this.lootDrops.splice(i, 1);
        }
      }
    }
  }

  private showLootText(x: number, y: number, name: string, rarity: string) {
    const rarityColors: Record<string, string> = {
      common: '#aaaaaa', uncommon: '#44cc44', rare: '#4488ff', epic: '#aa44ff', legendary: '#ffaa00',
    };
    const text = this.add.text(x, y, `+ ${name}`, {
      fontSize: '6px', fontFamily: 'monospace', color: rarityColors[rarity] ?? '#ffffff', resolution: 2,
    }).setOrigin(0.5).setDepth(50);

    this.tweens.add({
      targets: text,
      y: y - 20,
      alpha: 0,
      duration: 1200,
      onComplete: () => text.destroy(),
    });
  }

  /** On level up, grant stat points */
  onPlayerLevelUp() {
    this.inventory.onLevelUp();
    // Flash notification
    const text = this.add.text(this.player.sprite.x, this.player.sprite.y - 30, 'LEVEL UP!', {
      fontSize: '8px', fontFamily: 'monospace', color: '#ffcc44', resolution: 2,
    }).setOrigin(0.5).setDepth(50).setScrollFactor(1);

    this.tweens.add({
      targets: text,
      y: text.y - 20,
      alpha: 0,
      duration: 1500,
      onComplete: () => text.destroy(),
    });
  }

  private createPlayer(cls: ClassName, x: number, y: number): AnyPlayer {
    switch (cls) {
      case 'gunner': return new Gunner(this, x, y);
      case 'wraith': return new Wraith(this, x, y);
      default: return new Player(this, x, y);
    }
  }

  private switchClass(cls: ClassName) {
    if (cls === this.currentClass) return;
    const x = this.player.sprite.x;
    const y = this.player.sprite.y;
    const oldLevel = this.player.level;
    const oldXp = this.player.xp;
    this.player.sprite.destroy();
    this.player = this.createPlayer(cls, x, y);
    this.player.level = oldLevel;
    this.player.xp = oldXp;
    this.physics.add.collider(this.player.sprite, this.groundLayer);
    this.combat = new CombatSystem(this);
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);
    this.currentClass = cls;
    const colors: Record<ClassName, string> = { vanguard: '#4488ff', gunner: '#44ff88', wraith: '#aa44ff' };
    this.classLabel.setText(`${cls.toUpperCase()}  [1/2/3 | TAB: Inventory]`).setColor(colors[cls]);
  }

  private spawnEnemies() {
    const positions = [
      { x: 200, y: 100, type: 'grunt' as const },
      { x: 350, y: 100, type: 'grunt' as const },
      { x: 500, y: 60, type: 'ranged' as const },
      { x: 650, y: 100, type: 'grunt' as const },
      { x: 800, y: 100, type: 'grunt' as const },
      { x: 950, y: 60, type: 'ranged' as const },
      { x: 1100, y: 80, type: 'flyer' as const },
      { x: 1300, y: 100, type: 'grunt' as const },
      { x: 1450, y: 100, type: 'grunt' as const },
      { x: 1600, y: 60, type: 'ranged' as const },
    ];
    for (const pos of positions) {
      const groundY = this.findGroundY(pos.x) ?? pos.y;
      const enemy = new Enemy(this, pos.x, groundY - 20, pos.type);
      this.enemies.add(enemy.sprite);
    }
  }

  private findGroundY(x: number): number | null {
    for (let y = 0; y < LEVEL_HEIGHT_TILES; y++) {
      const tile = this.groundLayer.getTileAtWorldXY(x, y * TILE_SIZE);
      if (tile && tile.index === 1) return y * TILE_SIZE;
    }
    return null;
  }

  private createBackground(worldWidth: number, worldHeight: number) {
    const bg1 = this.add.graphics();
    bg1.fillGradientStyle(0x05050f, 0x05050f, 0x0a0a2a, 0x0a0a2a, 1);
    bg1.fillRect(0, 0, worldWidth, worldHeight);
    bg1.setScrollFactor(0.1).setDepth(-100);

    const bg2 = this.add.graphics();
    bg2.fillStyle(0x111125, 0.8);
    for (let i = 0; i < Math.floor(worldWidth / 40); i++) {
      const bw = 15 + Math.random() * 25;
      const bh = 30 + Math.random() * 60;
      bg2.fillRect(i * 40 + Math.random() * 10, worldHeight - bh - 20, bw, bh);
    }
    bg2.setScrollFactor(0.3).setDepth(-90);

    const bg3 = this.add.graphics();
    bg3.lineStyle(1, 0x00ffcc, 0.15);
    for (let i = 0; i < 8; i++) {
      const y = worldHeight * 0.3 + Math.random() * worldHeight * 0.4;
      const sx = Math.random() * worldWidth * 0.5;
      bg3.lineBetween(sx, y, sx + 50 + Math.random() * 100, y);
    }
    bg3.setScrollFactor(0.5).setDepth(-80);
  }
}
