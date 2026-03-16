import Phaser from 'phaser';
import { TILE_SIZE, GAME_WIDTH, GAME_HEIGHT, SPIKE_DAMAGE_PERCENT, SPIKE_TICK_MS } from '../../shared/constants';
import { Player } from '../entities/Player';
import { Gunner } from '../entities/Gunner';
import { Wraith } from '../entities/Wraith';
import { Enemy } from '../entities/Enemy';
import type { EnemyType } from '../entities/Enemy';
import { CombatSystem } from '../systems/CombatSystem';
import { InventorySystem } from '../systems/InventorySystem';
import { BossPowerSystem } from '../systems/BossPowerSystem';
import { generateDrop } from '../../shared/data/equipment';
import { createTestLevel, LEVEL_WIDTH_TILES, LEVEL_HEIGHT_TILES } from '../levels/testLevel';
import { createCryptvaultLevel } from '../levels/cryptvaultLevel';
import { createHubLevel } from '../levels/hubLevel';
import { getZone, type ZoneDef } from '../levels/zones';
import { renderZoneBackground } from '../art/backgroundRenderer';
import { Boss } from '../entities/Boss';
import { HollowKing } from '../entities/HollowKing';
import type { AnyPlayer } from '../entities/PlayerTypes';
import { getDefaultBranch } from '../../shared/data/skillTrees';
import { buildSaveData, writeSave, restoreInventory, type SaveData } from '../systems/SaveSystem';
import { playSound } from '../systems/SoundManager';
import { initCameraFX, updateFX, destroyFX } from '../systems/FXManager';
import { startMusic, stopMusic } from '../systems/MusicManager';

export type ClassName = 'vanguard' | 'gunner' | 'wraith';

export class GameScene extends Phaser.Scene {
  player!: AnyPlayer;
  enemies!: Phaser.Physics.Arcade.Group;
  groundLayer!: Phaser.Tilemaps.TilemapLayer;
  combat!: CombatSystem;
  bossPowerSystem!: BossPowerSystem;
  debugMode = false;
  currentClass: ClassName = 'vanguard';
  private classLabel!: Phaser.GameObjects.Text;
  private inventory!: InventorySystem;

  private lootDrops: { sprite: Phaser.GameObjects.Sprite; item: any }[] = [];
  private enemyInstances: Enemy[] = [];
  bossPowers: string[] = [];
  private boss: Boss | null = null;
  private bossTriggered = false;
  private boss2: HollowKing | null = null;
  private boss2Triggered = false;
  bossesDefeated: string[] = [];
  gold = 0;

  // NPCs
  private npcs: { sprite: Phaser.GameObjects.Sprite; type: string; label: Phaser.GameObjects.Text }[] = [];
  private npcPrompt: Phaser.GameObjects.Text | null = null;

  // Zone system
  currentZone: string = 'foundry';
  private zoneDef!: ZoneDef;
  private zoneExits: { x: number; targetZone: string; targetSpawnX: number }[] = [];

  // Save system
  private pendingSave: SaveData | null = null;
  private savePoints: { x: number; y: number; sprite: Phaser.GameObjects.Sprite }[] = [];
  private lastSaveNotif = 0;

  // Boss power input
  private powerKey!: Phaser.Input.Keyboard.Key;
  private swapPowerKey!: Phaser.Input.Keyboard.Key;
  private interactKey!: Phaser.Input.Keyboard.Key;

  // Level data (stored for pit/spike detection)
  private levelData: number[][] = [];
  private lastSpikeDamageTime = 0;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data?: { selectedClass?: ClassName; saveData?: SaveData; zoneId?: string; spawnX?: number }) {
    if (data?.selectedClass) {
      this.currentClass = data.selectedClass;
    }
    this.pendingSave = data?.saveData ?? null;
    this.currentZone = data?.zoneId ?? 'foundry';
  }

  create() {
    this.zoneDef = getZone(this.currentZone);
    this.inventory = new InventorySystem();
    this.inventory.setActiveBranch(getDefaultBranch(this.currentClass).id);
    this.bossPowerSystem = new BossPowerSystem(this);
    this.bossesDefeated = [];
    this.bossPowers = [];
    this.gold = 0;
    this.boss = null;
    this.boss2 = null;
    this.bossTriggered = false;
    this.boss2Triggered = false;
    this.zoneExits = [];

    // -- Restore from save if present --
    const save = this.pendingSave;
    if (save) {
      restoreInventory(this.inventory, save);
      this.bossesDefeated = [...save.bossesDefeated];
      this.bossPowers = [...save.collectedPowers];
      this.gold = save.gold ?? 0;
    }

    // -- Build tilemap based on zone --
    this.levelData = this.getLevelData();
    const levelData = this.levelData;
    const levelW = this.zoneDef.width;
    const levelH = this.zoneDef.height;

    const map = this.make.tilemap({
      data: levelData,
      tileWidth: TILE_SIZE,
      tileHeight: TILE_SIZE,
    });

    // Use a 3-tile-wide opaque strip for the collision-only tilemap.
    // All 3 tiles are identical white — we only need valid frames for collision.
    // The tilemap is INVISIBLE — visual platforms are drawn separately.
    const collisionTileKey = 'tile-collision-strip';
    if (!this.textures.exists(collisionTileKey)) {
      const g = this.add.graphics();
      g.fillStyle(0xffffff);
      g.fillRect(0, 0, TILE_SIZE * 3, TILE_SIZE);
      g.generateTexture(collisionTileKey, TILE_SIZE * 3, TILE_SIZE);
      g.destroy();
    }
    const tileset = map.addTilesetImage('tileset', collisionTileKey, TILE_SIZE, TILE_SIZE, 0, 0)!;
    this.groundLayer = map.createLayer(0, tileset, 0, 0)!;
    this.groundLayer.setVisible(false); // Collision only — visuals are separate
    this.groundLayer.setCollision([1, 3]);
    this.groundLayer.setCollision(2);
    this.groundLayer.forEachTile(tile => {
      if (tile.index === 2) tile.setCollision(false, false, true, false);
    });

    // Draw platform visuals as a separate graphics layer (decoupled from collision)
    this.drawPlatformVisuals(levelData, levelW, levelH);

    // -- Spawn player --
    const initData = this.scene.settings.data as any;
    const spawnTileX = initData?.spawnX;
    const defaultSpawnX = save ? save.posX : 48;
    const spawnX = spawnTileX != null ? spawnTileX * TILE_SIZE : defaultSpawnX;
    const spawnY = save ? save.posY : levelH * TILE_SIZE - 80;
    this.player = this.createPlayer(this.currentClass, spawnX, spawnY);

    // -- Restore player stats from save --
    if (save) {
      this.player.level = save.level;
      this.player.xp = save.xp;
      this.player.xpToNext = save.xpToNext;
      this.player.hp = save.hp;
      this.player.maxHp = save.maxHp;
      this.player.energy = save.energy;
      this.player.maxEnergy = save.maxEnergy;
    }

    // -- Spawn enemies --
    this.enemies = this.physics.add.group();
    this.enemyInstances = [];
    this.spawnZoneEnemies();

    // -- Collisions --
    this.physics.add.collider(this.player.sprite, this.groundLayer);
    this.physics.add.collider(this.enemies, this.groundLayer);

    // -- Boss (zone-specific) --
    const bossFloorY = levelH * TILE_SIZE - 32;
    if (this.zoneDef.bossId === 'voltrexx' && !this.bossesDefeated.includes('voltrexx')) {
      const bossX = (this.zoneDef.bossSpawnTileX ?? 110) * TILE_SIZE;
      this.boss = new Boss(this, bossX, bossFloorY);
      this.physics.add.collider(this.boss.sprite, this.groundLayer);
    }
    if (this.zoneDef.bossId === 'hollow_king' && !this.bossesDefeated.includes('hollow_king')) {
      const bossX = (this.zoneDef.bossSpawnTileX ?? 90) * TILE_SIZE;
      this.boss2 = new HollowKing(this, bossX, bossFloorY);
      this.physics.add.collider(this.boss2.sprite, this.groundLayer);
    }

    // -- Zone exits --
    this.setupZoneExits(levelH);

    // -- Combat --
    this.combat = new CombatSystem(this);

    // -- Camera --
    const worldWidth = levelW * TILE_SIZE;
    const worldHeight = levelH * TILE_SIZE;
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);
    this.cameras.main.setDeadzone(40, 20);
    initCameraFX(this.cameras.main);
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

    // Boss power keys
    this.powerKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.C);
    this.swapPowerKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.interactKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    const classColors: Record<ClassName, string> = { vanguard: '#4488ff', gunner: '#44ff88', wraith: '#aa44ff' };
    this.classLabel = this.add.text(GAME_WIDTH / 2, 6, `${this.zoneDef.name} — ${this.currentClass.toUpperCase()}  [1/2/3 | TAB | C | S]`, {
      fontSize: '12px', fontFamily: 'Consolas, monospace', color: classColors[this.currentClass],
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(100);

    // -- Background --
    this.createBackground(worldWidth, worldHeight);

    // -- Save crystals --
    this.savePoints = [];
    this.spawnSaveCrystals();

    // -- NPCs (hub only) --
    this.npcs = [];
    this.npcPrompt = null;
    if (this.currentZone === 'hub') {
      this.spawnHubNPCs();
    }

    // -- Show load notification --
    if (save) {
      this.showNotification('Save loaded');
    }

    // -- Background music --
    // Start on first user interaction (AudioContext requires gesture)
    const startZoneMusic = () => {
      startMusic(this.currentZone);
      this.input.off('pointerdown', startZoneMusic);
      this.input.keyboard!.off('keydown', startZoneMusic);
    };
    this.input.on('pointerdown', startZoneMusic);
    this.input.keyboard!.on('keydown', startZoneMusic);
  }

  /** Clean up persistent resources when scene shuts down */
  shutdown() {
    stopMusic();
    destroyFX();
  }

  update(time: number, delta: number) {
    this.player.update(time, delta);
    for (const enemy of this.enemyInstances) enemy.update(time, delta);
    this.combat.update(time, delta);
    this.bossPowerSystem.update(time, delta);
    this.checkLootPickup();
    this.checkSavePoints(time);
    this.handleBossPowerInput(time);

    // Boss triggers (zone-relative)
    const bossTriggerX = (this.zoneDef.bossTriggerTileX ?? 999) * TILE_SIZE;
    if (this.boss && !this.bossTriggered && this.player.sprite.x > bossTriggerX) {
      this.bossTriggered = true;
      this.boss.activate();
    }
    if (this.boss?.isActive) {
      this.boss.update(time, delta);
    }

    if (this.boss2 && !this.boss2Triggered && this.player.sprite.x > bossTriggerX) {
      this.boss2Triggered = true;
      this.boss2.activate();
    }
    if (this.boss2?.isActive) {
      this.boss2.update(time, delta);
    }

    // Post-processing FX
    const anyBossActive = (this.boss?.isActive && this.boss.state !== 'dead')
      || (this.boss2?.isActive && this.boss2.state !== 'dead');
    updateFX(delta, !!anyBossActive, this.player.hp / this.player.maxHp);

    // Pit hazard check
    this.checkPitFall(time);

    // Spike hazard check
    this.checkSpikeHazard(time);

    // NPC interaction
    this.checkNPCProximity();

    // Zone exit checking
    this.checkZoneExits();
  }

  private handleBossPowerInput(time: number) {
    // C key: use equipped boss power
    if (Phaser.Input.Keyboard.JustDown(this.powerKey)) {
      const power = this.inventory.getActivePower();
      if (power) {
        this.bossPowerSystem.usePower(power, time);
      }
    }

    // S key: swap active power slot
    if (Phaser.Input.Keyboard.JustDown(this.swapPowerKey)) {
      this.inventory.toggleActivePowerSlot();
    }
  }

  /** Returns the first active boss (for combat system hit detection) */
  getBoss(): Boss | HollowKing | null {
    if (this.boss2?.isActive && this.boss2.state !== 'dead') return this.boss2;
    if (this.boss?.isActive && this.boss.state !== 'dead') return this.boss;
    return null;
  }

  /** Returns all active bosses for systems that need to check both */
  getAllActiveBosses(): (Boss | HollowKing)[] {
    const bosses: (Boss | HollowKing)[] = [];
    if (this.boss?.isActive && this.boss.state !== 'dead') bosses.push(this.boss);
    if (this.boss2?.isActive && this.boss2.state !== 'dead') bosses.push(this.boss2);
    return bosses;
  }

  getInventory(): InventorySystem { return this.inventory; }

  /** Called by Boss on death — absorbs power into inventory and auto-saves */
  absorbBossPower(powerId: string, bossId?: string) {
    this.bossPowers.push(powerId);
    this.inventory.absorbPower(powerId);
    playSound('powerAbsorb');
    if (bossId && !this.bossesDefeated.includes(bossId)) {
      this.bossesDefeated.push(bossId);
    }
    // Auto-save after boss defeat
    this.saveGame();
    this.showNotification('Boss defeated — game saved!');
  }

  /** Called by Enemy on death — spawns a loot drop and gold */
  spawnLootDrop(x: number, y: number) {
    // Always drop some gold
    const goldAmount = 5 + Math.floor(Math.random() * 10) + this.player.level * 2;
    this.gold += goldAmount;
    playSound('goldPickup');
    this.showLootText(x, y - 16, `+${goldAmount}g`, 'legendary');

    // 40% chance to drop equipment
    if (Math.random() > 0.4) return;

    const item = generateDrop(this.player.level);
    const rarityColors: Record<string, number> = {
      common: 0xaaaaaa, uncommon: 0x44cc44, rare: 0x4488ff, epic: 0xaa44ff, legendary: 0xffaa00,
    };

    const color = rarityColors[item.rarity] ?? 0xffffff;
    const textureKey = `loot-${item.rarity}`;
    if (!this.textures.exists(textureKey)) {
      const g = this.add.graphics();
      g.fillStyle(color, 0.9);
      g.fillRect(0, 0, 6, 6);
      g.lineStyle(1, 0xffffff, 0.5);
      g.strokeRect(0, 0, 6, 6);
      g.generateTexture(textureKey, 6, 6);
      g.destroy();
    }

    const sprite = this.physics.add.sprite(x, y - 10, textureKey);
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
        const added = this.inventory.addItem(drop.item);
        if (added) {
          playSound('pickup');
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
      fontSize: '11px', fontFamily: 'Arial, sans-serif', color: rarityColors[rarity] ?? '#ffffff',
      stroke: '#000000', strokeThickness: 2,
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
    const text = this.add.text(this.player.sprite.x, this.player.sprite.y - 30, 'LEVEL UP!', {
      fontSize: '16px', fontFamily: 'Arial, sans-serif', color: '#ffcc44',
      fontStyle: 'bold', stroke: '#000000', strokeThickness: 3,
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
    const oldXpToNext = this.player.xpToNext;
    const oldMaxHp = this.player.maxHp;
    const oldHp = this.player.hp;
    const oldMaxEnergy = this.player.maxEnergy;
    const oldEnergy = this.player.energy;

    // Clean up old player's game objects and combat overlap listener
    this.player.destroy();
    this.player.sprite.destroy();
    this.combat.destroy();

    this.player = this.createPlayer(cls, x, y);
    this.player.level = oldLevel;
    this.player.xp = oldXp;
    this.player.xpToNext = oldXpToNext;
    this.player.maxHp = oldMaxHp;
    this.player.hp = oldHp;
    this.player.maxEnergy = oldMaxEnergy;
    this.player.energy = oldEnergy;
    this.physics.add.collider(this.player.sprite, this.groundLayer);
    this.combat = new CombatSystem(this);
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);
    this.currentClass = cls;
    const colors: Record<ClassName, string> = { vanguard: '#4488ff', gunner: '#44ff88', wraith: '#aa44ff' };
    (this.classLabel as Phaser.GameObjects.Text).setText(`${this.zoneDef.name} — ${cls.toUpperCase()}  [1/2/3 | TAB | C | S]`).setColor(colors[cls]);
  }

  // -- Zone System Helpers --

  private getLevelData(): number[][] {
    switch (this.currentZone) {
      case 'cryptvault': return createCryptvaultLevel();
      case 'hub': return createHubLevel();
      default: return createTestLevel();
    }
  }

  private getTilesetKey(): string {
    switch (this.currentZone) {
      case 'cryptvault': return 'tileset-cryptvault';
      case 'hub': return 'tileset-hub';
      default: return 'tileset';
    }
  }

  /**
   * Draw ALL tile visuals as a separate graphics layer, completely decoupled
   * from the collision tilemap. This follows the Hollow Knight pattern:
   * collision geometry is invisible, visuals are their own layer.
   *
   * Tile 0 = empty (no visual)
   * Tile 1 = ground (solid, dark, with edge highlights on exposed faces)
   * Tile 2 = platform (one-way, neon accent line on top)
   * Tile 3 = wall (same as ground visually)
   * Tile 4 = spikes (non-solid, deals damage, sharp triangles)
   */
  private drawPlatformVisuals(levelData: number[][], levelW: number, levelH: number) {
    const ts = TILE_SIZE;
    const palette = this.zoneDef.palette;
    const groundColor = palette.ground;
    const platformColor = palette.platform;
    const accentColor = palette.accent;

    const groundBorder = Phaser.Display.Color.IntegerToColor(groundColor).brighten(20).color;
    const platformBorder = Phaser.Display.Color.IntegerToColor(platformColor).brighten(30).color;

    // Helper: is the tile at (tx,ty) empty/air?
    const isEmpty = (tx: number, ty: number) =>
      tx < 0 || tx >= levelW || ty < 0 || ty >= levelH || levelData[ty][tx] === 0;

    const gfx = this.add.graphics();
    gfx.setDepth(1); // Above background, below entities

    for (let y = 0; y < levelH; y++) {
      for (let x = 0; x < levelW; x++) {
        const tile = levelData[y][x];
        if (tile === 0) continue;

        const px = x * ts;
        const py = y * ts;

        if (tile === 1 || tile === 3) {
          // Ground / wall fill
          gfx.fillStyle(groundColor);
          gfx.fillRect(px, py, ts, ts);

          // Draw edge highlights only on faces exposed to air (shows pits/gaps)
          gfx.lineStyle(1, groundBorder, 0.6);
          if (isEmpty(x, y - 1)) gfx.lineBetween(px, py, px + ts, py);           // top edge
          if (isEmpty(x, y + 1)) gfx.lineBetween(px, py + ts, px + ts, py + ts); // bottom edge
          if (isEmpty(x - 1, y)) gfx.lineBetween(px, py, px, py + ts);           // left edge
          if (isEmpty(x + 1, y)) gfx.lineBetween(px + ts, py, px + ts, py + ts); // right edge
        } else if (tile === 2) {
          // Platform fill
          gfx.fillStyle(platformColor);
          gfx.fillRect(px, py, ts, ts);

          // Border
          gfx.lineStyle(1, platformBorder, 0.8);
          gfx.strokeRect(px + 0.5, py + 0.5, ts - 1, ts - 1);

          // Neon accent top line (shows it's a one-way platform)
          gfx.lineStyle(2, accentColor, 0.6);
          gfx.lineBetween(px, py + 1, px + ts, py + 1);
        } else if (tile === 4) {
          // Spike — dark base with sharp red/orange triangles
          gfx.fillStyle(0x1a1a2e);
          gfx.fillRect(px, py + ts * 0.6, ts, ts * 0.4);

          // Draw 3 spike triangles
          const spikeColor = this.currentZone === 'cryptvault' ? 0x8844cc : 0xff4422;
          gfx.fillStyle(spikeColor);
          for (let s = 0; s < 3; s++) {
            const sx = px + 1 + s * 5;
            gfx.fillTriangle(
              sx, py + ts,          // bottom-left
              sx + 2.5, py + 2,     // tip
              sx + 5, py + ts       // bottom-right
            );
          }
          // Bright tip highlights
          gfx.fillStyle(0xffaa66);
          for (let s = 0; s < 3; s++) {
            const sx = px + 1 + s * 5;
            gfx.fillRect(sx + 2, py + 2, 1, 2);
          }
        }
      }
    }
  }

  private spawnZoneEnemies() {
    if (this.currentZone === 'hub') return; // No enemies in hub

    const types = this.zoneDef.enemyTypes as EnemyType[];
    if (types.length === 0) return;

    // Generate enemy positions spread across the level
    const levelW = this.zoneDef.width;
    const count = this.currentZone === 'cryptvault' ? 12 : 10;
    const startTile = 8;
    const endTile = (this.zoneDef.bossTriggerTileX ?? levelW - 5) - 3;
    const spacing = Math.floor((endTile - startTile) / count);

    for (let i = 0; i < count; i++) {
      const tileX = startTile + i * spacing + Math.floor(Math.random() * 3);
      const worldX = tileX * TILE_SIZE;
      const type = types[i % types.length];
      const groundY = this.findGroundY(worldX) ?? (this.zoneDef.height * TILE_SIZE - 60);
      const spawnY = (type === 'flyer' || type === 'ghost') ? groundY - 40 : groundY - 20;
      const enemy = new Enemy(this, worldX, spawnY, type);
      this.enemies.add(enemy.sprite);
      this.enemyInstances.push(enemy);
    }
  }

  private findGroundY(x: number): number | null {
    for (let y = 0; y < this.zoneDef.height; y++) {
      const tile = this.groundLayer.getTileAtWorldXY(x, y * TILE_SIZE);
      if (tile && tile.index === 1) return y * TILE_SIZE;
    }
    return null;
  }

  private setupZoneExits(levelH: number) {
    const groundY = levelH * TILE_SIZE - 48;
    for (const exit of this.zoneDef.exits) {
      const worldX = exit.tileX * TILE_SIZE;

      // Visual: glowing portal
      const g = this.add.graphics();
      g.fillStyle(0x00ffcc, 0.3);
      g.fillRect(0, 0, 16, 32);
      g.lineStyle(2, 0x00ffcc, 0.7);
      g.strokeRect(0, 0, 16, 32);
      const key = `exit-${exit.tileX}-${exit.targetZone}`;
      g.generateTexture(key, 16, 32);
      g.destroy();

      const sprite = this.add.sprite(worldX, groundY, key).setDepth(5);
      this.tweens.add({
        targets: sprite,
        alpha: { from: 0.5, to: 1 },
        duration: 1000,
        yoyo: true,
        repeat: -1,
      });

      // Zone name label
      this.add.text(worldX, groundY - 22, exit.targetZone === 'hub' ? 'HUB' : getZone(exit.targetZone).name.toUpperCase(), {
        fontSize: '10px', fontFamily: 'Consolas, monospace', color: '#00ffcc',
        stroke: '#000000', strokeThickness: 1,
      }).setOrigin(0.5).setDepth(5);

      this.zoneExits.push({
        x: worldX,
        targetZone: exit.targetZone,
        targetSpawnX: exit.targetSpawnTileX,
      });
    }
  }

  private checkZoneExits() {
    const px = this.player.sprite.x;
    const py = this.player.sprite.y;

    for (const exit of this.zoneExits) {
      if (Math.abs(px - exit.x) < 16 && py > (this.zoneDef.height - 6) * TILE_SIZE) {
        // Save before transitioning
        playSound('zoneTransit');
        this.saveGame();

        // Build save data to carry through zone transition (preserves inventory/state)
        const transitionSave = buildSaveData(
          this.currentClass, this.player, this.inventory, this.bossesDefeated, exit.targetZone, this.gold
        );

        // Stop music before transitioning (prevents oscillator leak)
        stopMusic(true);

        // Transition to new zone
        this.scene.stop('HUDScene');
        this.scene.restart({
          selectedClass: this.currentClass,
          saveData: transitionSave,
          zoneId: exit.targetZone,
          spawnX: exit.targetSpawnX,
        });
        return;
      }
    }
  }

  private createBackground(worldWidth: number, worldHeight: number) {
    renderZoneBackground(this, this.currentZone, worldWidth, worldHeight);
  }

  // -- Save System --

  /** Save current game state to localStorage */
  saveGame() {
    const data = buildSaveData(this.currentClass, this.player, this.inventory, this.bossesDefeated, this.currentZone, this.gold);
    writeSave(data);
  }

  /** Spawn save crystals at key locations */
  private spawnSaveCrystals() {
    const groundY = this.zoneDef.height * TILE_SIZE - 48;

    // Zone-specific crystal positions
    let crystalPositions: { x: number; y: number }[];
    if (this.currentZone === 'hub') {
      crystalPositions = [
        { x: 20 * TILE_SIZE, y: groundY }, // Hub center
      ];
    } else if (this.currentZone === 'cryptvault') {
      crystalPositions = [
        { x: 4 * TILE_SIZE, y: groundY },
        { x: 40 * TILE_SIZE, y: groundY },
        { x: 76 * TILE_SIZE, y: groundY },
      ];
    } else {
      // Foundry (default)
      crystalPositions = [
        { x: 48, y: groundY },
        { x: 800, y: groundY },
        { x: 80 * TILE_SIZE, y: groundY },
      ];
    }

    for (const pos of crystalPositions) {
      const sprite = this.add.sprite(pos.x, pos.y, 'save-crystal').setDepth(5);

      // Glow/bob animation
      this.tweens.add({
        targets: sprite,
        y: pos.y - 3,
        alpha: { from: 0.7, to: 1 },
        duration: 1200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      this.savePoints.push({ x: pos.x, y: pos.y, sprite });
    }
  }

  /** Check if player is near a save crystal */
  private checkSavePoints(time: number) {
    if (time - this.lastSaveNotif < 3000) return; // Debounce

    const px = this.player.sprite.x;
    const py = this.player.sprite.y;

    for (const sp of this.savePoints) {
      const dist = Phaser.Math.Distance.Between(px, py, sp.x, sp.y);
      if (dist < 24) {
        this.saveGame();
        playSound('savePoint');
        this.lastSaveNotif = time;

        // Flash the crystal
        sp.sprite.setTint(0xffffff);
        this.time.delayedCall(200, () => sp.sprite.clearTint());

        // Heal player slightly at save point
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + Math.floor(this.player.maxHp * 0.15));
        this.player.energy = Math.min(this.player.maxEnergy, this.player.energy + Math.floor(this.player.maxEnergy * 0.15));

        this.showNotification('Game saved');
        break;
      }
    }
  }

  // -- Pit Hazard --

  private lastPitDamageTime = 0;

  /** Check if the player is falling into a pit (gap in the ground floor) */
  private checkPitFall(time: number) {
    const p = this.player.sprite;
    const levelH = this.zoneDef.height;
    const bottomY = (levelH - 1) * TILE_SIZE; // bottom row of level

    // Only check when player is near the bottom of the level
    if (p.y < bottomY - TILE_SIZE) return;

    // Check the tile column the player is in
    const tileX = Math.floor(p.x / TILE_SIZE);
    const bottomRow = levelH - 1;
    const aboveRow = levelH - 2;

    // If both bottom rows are air (pit), deal damage
    if (
      tileX >= 0 && tileX < this.zoneDef.width &&
      this.levelData[bottomRow]?.[tileX] === 0 &&
      this.levelData[aboveRow]?.[tileX] === 0
    ) {
      // Debounce: damage every 400ms while in pit
      if (time - this.lastPitDamageTime > 400) {
        this.lastPitDamageTime = time;
        // Deal 25% maxHp damage per tick — pits are lethal if you don't escape quickly
        const pitDmg = Math.max(5, Math.floor(this.player.maxHp * 0.25));
        this.player.takeDamage(pitDmg, p.x, time);
        playSound('playerHurt');
        this.showNotification('Falling!', '#ff4444');
      }
    }
  }

  // -- Spike Hazard --

  /** Check if the player is standing on a spike tile (type 4) */
  private checkSpikeHazard(time: number) {
    if (time - this.lastSpikeDamageTime < SPIKE_TICK_MS) return;

    const p = this.player.sprite;
    const tileX = Math.floor(p.x / TILE_SIZE);
    const tileY = Math.floor(p.y / TILE_SIZE); // feet row
    const tileAbove = tileY - 1;

    // Check the tile at player's feet and one above
    for (const ty of [tileY, tileAbove]) {
      if (ty < 0 || ty >= this.zoneDef.height) continue;
      if (tileX < 0 || tileX >= this.zoneDef.width) continue;
      if (this.levelData[ty]?.[tileX] === 4) {
        this.lastSpikeDamageTime = time;
        const dmg = Math.max(3, Math.floor(this.player.maxHp * SPIKE_DAMAGE_PERCENT));
        this.player.takeDamage(dmg, p.x, time);
        playSound('playerHurt');
        this.showNotification('Spikes!', '#ff6644');
        return;
      }
    }
  }

  // -- NPCs --

  private spawnHubNPCs() {
    const groundY = this.zoneDef.height * TILE_SIZE - 48;

    // Shopkeeper at center of hub
    const shopX = 20 * TILE_SIZE;
    const sprite = this.add.sprite(shopX, groundY, 'npc-shopkeeper').setOrigin(0.5, 1).setDepth(5);

    const label = this.add.text(shopX, groundY - 28, 'SHOP', {
      fontSize: '10px', fontFamily: 'Consolas, monospace', color: '#ccaa66',
      stroke: '#000000', strokeThickness: 1,
    }).setOrigin(0.5).setDepth(5);

    // Gentle bobbing
    this.tweens.add({
      targets: sprite, y: groundY - 2,
      duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

    this.npcs.push({ sprite, type: 'shop', label });
  }

  private checkNPCProximity() {
    if (this.npcs.length === 0) return;

    const px = this.player.sprite.x;
    const py = this.player.sprite.y;
    let nearNpc: typeof this.npcs[0] | null = null;

    for (const npc of this.npcs) {
      const dist = Phaser.Math.Distance.Between(px, py, npc.sprite.x, npc.sprite.y);
      if (dist < 30) {
        nearNpc = npc;
        break;
      }
    }

    if (nearNpc) {
      // Show interaction prompt
      if (!this.npcPrompt) {
        this.npcPrompt = this.add.text(nearNpc.sprite.x, nearNpc.sprite.y - 40, 'Press E to interact', {
          fontSize: '10px', fontFamily: 'Consolas, monospace', color: '#ffffff',
          stroke: '#000000', strokeThickness: 1,
        }).setOrigin(0.5).setDepth(50);
      }

      // Check for interaction key
      if (Phaser.Input.Keyboard.JustDown(this.interactKey)) {
        this.openNPCInteraction(nearNpc.type);
      }
    } else if (this.npcPrompt) {
      this.npcPrompt.destroy();
      this.npcPrompt = null;
    }
  }

  private openNPCInteraction(type: string) {
    if (type === 'shop') {
      this.scene.pause('GameScene');
      this.scene.launch('ShopScene', { gameScene: this });
    }
  }

  /** Show a brief notification at the top of the screen */
  private showNotification(message: string, color = '#00ffcc') {
    const text = this.add.text(GAME_WIDTH / 2, 24, message, {
      fontSize: '13px', fontFamily: 'Arial, sans-serif', color,
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(200);

    this.tweens.add({
      targets: text,
      alpha: 0,
      y: 14,
      duration: 2000,
      delay: 800,
      onComplete: () => text.destroy(),
    });
  }
}
