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
import { TutorialSystem } from '../systems/TutorialSystem';
import { generateDrop } from '../../shared/data/equipment';
import { createTestLevel, LEVEL_WIDTH_TILES, LEVEL_HEIGHT_TILES } from '../levels/testLevel';
import { createCryptvaultLevel } from '../levels/cryptvaultLevel';
import { createHubLevel } from '../levels/hubLevel';
import { getBlightedGardenTiles } from '../levels/blightedGardenLevel';
import { getNeonCitadelTiles } from '../levels/neonCitadelLevel';
import { getVoidNexusTiles } from '../levels/voidNexusLevel';
import { getBossArenaTiles } from '../levels/bossArenaLevel';
import { getZone, type ZoneDef } from '../levels/zones';
import { renderZoneBackground } from '../art/backgroundRenderer';
import { Boss } from '../entities/Boss';
import { HollowKing } from '../entities/HollowKing';
import { LadyHemlock } from '../entities/LadyHemlock';
import { Overclock } from '../entities/Overclock';
import { NexusCore } from '../entities/NexusCore';
import type { AnyPlayer } from '../entities/PlayerTypes';
import { getDefaultBranch } from '../../shared/data/skillTrees';
import { buildSaveData, writeSave, restoreInventory, getNGPlusMultiplier, buildNGPlusSave, type SaveData } from '../systems/SaveSystem';
import { getZoneModifiers, mergeModifiers } from '../systems/ZoneModifiers';
import { playSound } from '../systems/SoundManager';
import { initCameraFX, updateFX, destroyFX } from '../systems/FXManager';
import { startZoneMusic, stopMusic, fadeOutMusic, setCombatActive, setBossActive } from '../systems/MusicManager';
import { NetManager, type NetPlayerState } from '../systems/NetManager';
import { DialogueSystem, type DialogueLine } from '../systems/DialogueSystem';

export type ClassName = 'vanguard' | 'gunner' | 'wraith';

export class GameScene extends Phaser.Scene {
  player!: AnyPlayer;
  enemies!: Phaser.Physics.Arcade.Group;
  groundLayer!: Phaser.Tilemaps.TilemapLayer;
  combat!: CombatSystem;
  bossPowerSystem!: BossPowerSystem;
  private tutorial!: TutorialSystem;
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
  private boss3: LadyHemlock | null = null;
  private boss3Triggered = false;
  private boss4: Overclock | null = null;
  private boss4Triggered = false;
  private boss5: NexusCore | null = null;
  private boss5Triggered = false;
  bossesDefeated: string[] = [];
  gold = 0;
  ngPlusLevel = 0;

  // NPCs
  private npcs: { sprite: Phaser.GameObjects.Sprite; type: string; label: Phaser.GameObjects.Text }[] = [];
  private npcPrompt: Phaser.GameObjects.Text | null = null;

  // Dialogue system
  private dialogue!: DialogueSystem;
  private bossIntroPlayed: Set<string> = new Set();

  // Zone system
  currentZone: string = 'foundry';
  private zoneDef!: ZoneDef;
  private zoneExits: { x: number; y: number; targetZone: string; targetSpawnX: number }[] = [];

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

  // NG+ prompt
  private ngPlusPrompt: Phaser.GameObjects.Text | null = null;

  // Multiplayer ghost sprites
  private ghostSprites: Map<string, Phaser.GameObjects.Sprite> = new Map();
  private ghostLabels: Map<string, Phaser.GameObjects.Text> = new Map();
  private ghostDownedLabels: Map<string, Phaser.GameObjects.Text> = new Map();
  private ghostReviveBars: Map<string, Phaser.GameObjects.Graphics> = new Map();
  private netHudText: Phaser.GameObjects.Text | null = null;
  private netSendTimer = 0;
  private readonly NET_SEND_INTERVAL = 50; // ms between state broadcasts

  // Downed/revive state (multiplayer only)
  private isDowned = false;
  private downedTimer = 0;
  private readonly DOWNED_DURATION = 10000; // 10s before death
  private readonly REVIVE_DURATION = 3000; // 3s proximity to revive
  private readonly REVIVE_PROXIMITY = 50; // pixels
  private downedOverlay: Phaser.GameObjects.Text | null = null;
  private downedTimerText: Phaser.GameObjects.Text | null = null;
  private invincibleUntilTime = 0;
  private reviveProgress: Map<string, number> = new Map();
  private downedPeers: Set<string> = new Set();

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
    this.boss3 = null;
    this.boss4 = null;
    this.boss5 = null;
    this.bossTriggered = false;
    this.boss2Triggered = false;
    this.boss3Triggered = false;
    this.boss4Triggered = false;
    this.boss5Triggered = false;
    this.zoneExits = [];

    // -- Restore from save if present --
    const save = this.pendingSave;
    if (save) {
      restoreInventory(this.inventory, save);
      this.bossesDefeated = [...save.bossesDefeated];
      this.bossPowers = [...save.collectedPowers];
      this.gold = save.gold ?? 0;
      this.ngPlusLevel = save.ngPlusLevel ?? 0;
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
    this.physics.add.collider(this.player.sprite, this.groundLayer, undefined, (_sprite, tile) => {
      // Allow dropping through one-way platforms (tile index 2)
      if ((tile as any).index === 2 && (this.player as any).droppingThrough) return false;
      return true;
    });
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
    if (this.zoneDef.bossId === 'hemlock' && !this.bossesDefeated.includes('hemlock')) {
      const bossX = (this.zoneDef.bossSpawnTileX ?? 100) * TILE_SIZE;
      this.boss3 = new LadyHemlock(this, bossX, bossFloorY);
      this.physics.add.collider(this.boss3.sprite, this.groundLayer);
    }
    if (this.zoneDef.bossId === 'overclock' && !this.bossesDefeated.includes('overclock')) {
      const bossX = (this.zoneDef.bossSpawnTileX ?? 110) * TILE_SIZE;
      this.boss4 = new Overclock(this, bossX, bossFloorY);
      this.physics.add.collider(this.boss4.sprite, this.groundLayer);
    }
    if (this.zoneDef.bossId === 'nexus_core' && !this.bossesDefeated.includes('nexus_core')) {
      const bossX = (this.zoneDef.bossSpawnTileX ?? 110) * TILE_SIZE;
      this.boss5 = new NexusCore(this, bossX, bossFloorY);
      this.physics.add.collider(this.boss5.sprite, this.groundLayer);
    }

    // -- Zone exits --
    this.setupZoneExits(levelH);

    // -- Combat --
    this.combat = new CombatSystem(this);

    // -- Tutorial hints --
    this.tutorial = new TutorialSystem(this);

    // -- Camera --
    const worldWidth = levelW * TILE_SIZE;
    const worldHeight = levelH * TILE_SIZE;
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);
    this.cameras.main.setDeadzone(40, 20);
    initCameraFX(this.cameras.main, this);
    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);

    // -- HUD --
    this.scene.launch('HUDScene', { gameScene: this });

    // -- Keybindings --
    this.input.keyboard!.on('keydown-F1', () => {
      this.debugMode = !this.debugMode;
      this.physics.world.debugGraphic?.setVisible(this.debugMode);
      if (this.debugMode) this.physics.world.createDebugGraphic();
    });

    // Pause menu
    this.input.keyboard!.on('keydown-ESC', () => {
      if (!this.scene.isPaused('GameScene')) {
        this.scene.pause('GameScene');
        this.scene.launch('PauseScene', { gameScene: this });
      }
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

    // -- Multiplayer ghost sprites --
    this.ghostSprites = new Map();
    this.ghostLabels = new Map();
    this.ghostDownedLabels = new Map();
    this.ghostReviveBars = new Map();
    this.netSendTimer = 0;
    this.isDowned = false;
    this.downedTimer = 0;
    this.invincibleUntilTime = 0;
    this.reviveProgress = new Map();
    this.downedPeers = new Set();
    this.downedOverlay = null;
    this.downedTimerText = null;
    if (NetManager.isOnline()) {
      this.setupMultiplayer();
    }

    // -- Dialogue system --
    this.dialogue = new DialogueSystem(this);
    this.bossIntroPlayed = new Set();

    // -- Show load notification --
    if (save) {
      this.showNotification('Save loaded');
    }

    // -- Zone title cinematic --
    this.showZoneTitle();

    // -- Fade in on zone entry --
    this.cameras.main.fadeIn(300, 0, 0, 0);

    // -- Background music --
    // Start on first user interaction (AudioContext requires gesture)
    const startMusicOnGesture = () => {
      startZoneMusic(this.currentZone);
      this.input.off('pointerdown', startMusicOnGesture);
      this.input.keyboard!.off('keydown', startMusicOnGesture);
    };
    this.input.on('pointerdown', startMusicOnGesture);
    this.input.keyboard!.on('keydown', startMusicOnGesture);
  }

  /** Clean up persistent resources when scene shuts down */
  shutdown() {
    stopMusic();
    destroyFX();
    // Clean up ghost sprites (don't disconnect NetManager — it persists across zones)
    for (const [id] of this.ghostSprites) {
      this.removeGhostSprite(id);
    }
    this.netHudText = null;
    this.downedOverlay?.destroy();
    this.downedOverlay = null;
    this.downedTimerText?.destroy();
    this.downedTimerText = null;
  }

  update(time: number, delta: number) {
    // Dialogue system always updates (handles its own input)
    this.dialogue.update(time, delta);

    // While dialogue is active, freeze the player and skip most gameplay logic
    if (this.dialogue.dialogueActive) {
      (this.player.sprite.body as Phaser.Physics.Arcade.Body)?.setVelocityX(0);
      return;
    }

    // While downed, freeze the player (no movement/attack/dash)
    if (this.isDowned) {
      (this.player.sprite.body as Phaser.Physics.Arcade.Body)?.setVelocity(0, 0);
      // Still update multiplayer, bosses, and enemies so the world keeps going
    } else {
      this.player.update(time, delta);
    }
    for (const enemy of this.enemyInstances) enemy.update(time, delta);
    this.combat.update(time, delta);
    this.bossPowerSystem.update(time, delta);
    this.tutorial.update(time, delta);
    if (!this.isDowned) {
      this.checkLootPickup();
      this.checkSavePoints(time);
      this.handleBossPowerInput(time);
    }

    // Boss triggers (zone-relative)
    const bossTriggerX = (this.zoneDef.bossTriggerTileX ?? 999) * TILE_SIZE;
    if (this.boss && !this.bossTriggered && this.player.sprite.x > bossTriggerX) {
      this.bossTriggered = true;
      this.showBossIntroThenActivate('voltrexx', this.boss);
    }
    if (this.boss?.isActive) {
      this.boss.update(time, delta);
    }

    if (this.boss2 && !this.boss2Triggered && this.player.sprite.x > bossTriggerX) {
      this.boss2Triggered = true;
      this.showBossIntroThenActivate('hollow_king', this.boss2);
    }
    if (this.boss2?.isActive) {
      this.boss2.update(time, delta);
    }

    if (this.boss3 && !this.boss3Triggered && this.player.sprite.x > bossTriggerX) {
      this.boss3Triggered = true;
      this.showBossIntroThenActivate('hemlock', this.boss3);
    }
    if (this.boss3?.isActive) {
      this.boss3.update(time, delta);
    }

    if (this.boss4 && !this.boss4Triggered && this.player.sprite.x > bossTriggerX) {
      this.boss4Triggered = true;
      this.showBossIntroThenActivate('overclock', this.boss4);
    }
    if (this.boss4?.isActive) {
      this.boss4.update(time, delta);
    }

    if (this.boss5 && !this.boss5Triggered && this.player.sprite.x > bossTriggerX) {
      this.boss5Triggered = true;
      this.showBossIntroThenActivate('nexus_core', this.boss5);
    }
    if (this.boss5?.isActive) {
      this.boss5.update(time, delta);
    }

    // Post-processing FX
    const anyBossActive = (this.boss?.isActive && this.boss.state !== 'dead')
      || (this.boss2?.isActive && this.boss2.state !== 'dead')
      || (this.boss3?.isActive && this.boss3.state !== 'dead')
      || (this.boss4?.isActive && this.boss4.state !== 'dead')
      || (this.boss5?.isActive && this.boss5.state !== 'dead');
    updateFX(delta, !!anyBossActive, this.player.hp / this.player.maxHp);

    // Music layers — boss overrides combat
    setBossActive(!!anyBossActive);
    if (!anyBossActive) {
      // Combat music when enemies are within ~300px
      const px = this.player.sprite.x;
      const py = this.player.sprite.y;
      const COMBAT_RANGE = 300;
      let nearEnemy = false;
      for (const e of this.enemyInstances) {
        if (e.hp <= 0) continue;
        const dx = e.sprite.x - px;
        const dy = e.sprite.y - py;
        if (dx * dx + dy * dy < COMBAT_RANGE * COMBAT_RANGE) {
          nearEnemy = true;
          break;
        }
      }
      setCombatActive(nearEnemy);
    }

    // Pit hazard check
    this.checkPitFall(time);

    // Spike hazard check
    this.checkSpikeHazard(time);

    // NPC interaction
    this.checkNPCProximity();

    // Multiplayer sync
    if (NetManager.isOnline()) {
      this.updateMultiplayer(time, delta);
    }

    // Zone exit checking
    this.checkZoneExits();
  }

  // -- Multiplayer --

  private setupMultiplayer() {
    const roomCode = NetManager.getRoomCode();
    const peerCount = NetManager.getPeerCount() + 1;

    // HUD indicator
    this.netHudText = this.add.text(GAME_WIDTH - 8, 6, `ROOM: ${roomCode} (${peerCount}P)`, {
      fontSize: '10px', fontFamily: 'Consolas, monospace', color: '#00ffcc',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(100);

    // Create ghost sprites for any peers that already exist
    for (const [peerId, peerState] of NetManager.peers) {
      this.createGhostSprite(peerId, peerState);
    }

    // Listen for state updates
    NetManager.onPeerState((state: NetPlayerState) => {
      this.updateGhostFromState(state);
    });

    // Listen for new peers joining mid-game
    NetManager.onPeerJoin((peerId: string) => {
      const state = NetManager.peers.get(peerId);
      if (state) this.createGhostSprite(peerId, state);
      this.updateNetHud();
    });

    // Listen for peers leaving
    NetManager.onPeerLeave((peerId: string) => {
      this.removeGhostSprite(peerId);
      this.downedPeers.delete(peerId);
      this.reviveProgress.delete(peerId);
      this.updateNetHud();
    });

    // Listen for game events (revive signals)
    NetManager.onEvent((event: string, data: unknown) => {
      if (event === 'revived' && typeof data === 'object' && data !== null) {
        const d = data as { targetId: string };
        if (d.targetId === NetManager.playerId && this.isDowned) {
          this.handleRevived();
        }
      }
    });
  }

  private getClassTextureKey(className: string): string {
    switch (className) {
      case 'gunner': return 'player-gunner';
      case 'wraith': return 'player-wraith';
      default: return 'player';
    }
  }

  private createGhostSprite(peerId: string, state: NetPlayerState) {
    if (this.ghostSprites.has(peerId)) return;

    const textureKey = this.getClassTextureKey(state.className);
    const ghost = this.add.sprite(state.x, state.y, textureKey);
    ghost.setAlpha(0.5);
    ghost.setTint(0x00ffcc);
    ghost.setDepth(8);
    this.ghostSprites.set(peerId, ghost);

    // Name label above ghost
    const shortId = peerId.substring(0, 8);
    const label = this.add.text(state.x, state.y - 20, shortId, {
      fontSize: '8px', fontFamily: 'Consolas, monospace', color: '#00ffcc',
      stroke: '#000000', strokeThickness: 1,
    }).setOrigin(0.5).setDepth(8).setAlpha(0.6);
    this.ghostLabels.set(peerId, label);
  }

  private removeGhostSprite(peerId: string) {
    const ghost = this.ghostSprites.get(peerId);
    if (ghost) {
      ghost.destroy();
      this.ghostSprites.delete(peerId);
    }
    const label = this.ghostLabels.get(peerId);
    if (label) {
      label.destroy();
      this.ghostLabels.delete(peerId);
    }
    const downedLabel = this.ghostDownedLabels.get(peerId);
    if (downedLabel) {
      downedLabel.destroy();
      this.ghostDownedLabels.delete(peerId);
    }
    const reviveBar = this.ghostReviveBars.get(peerId);
    if (reviveBar) {
      reviveBar.destroy();
      this.ghostReviveBars.delete(peerId);
    }
  }

  private updateGhostFromState(state: NetPlayerState) {
    // Create ghost if it doesn't exist yet
    if (!this.ghostSprites.has(state.id)) {
      this.createGhostSprite(state.id, state);
    }

    const ghost = this.ghostSprites.get(state.id);
    if (ghost) {
      ghost.setPosition(state.x, state.y);
      ghost.setFlipX(state.flipX);

      // Swap texture if class changed
      const expectedKey = this.getClassTextureKey(state.className);
      if (ghost.texture.key !== expectedKey) {
        ghost.setTexture(expectedKey);
      }

      // Visual feedback for attacking/dashing/ultimate/downed
      if (state.isDowned) {
        ghost.setTint(0xff4444);
        ghost.setAlpha(0.7);
      } else if (state.isUsingUltimate) {
        ghost.setTint(0xffff00);
        ghost.setAlpha(0.8);
      } else if (state.isAttacking) {
        ghost.setTint(0xffffff);
        ghost.setAlpha(0.5);
      } else if (state.isDashing) {
        ghost.setTint(0x88ffff);
        ghost.setAlpha(0.5);
      } else {
        ghost.setTint(0x00ffcc);
        ghost.setAlpha(0.5);
      }
    }

    // Update label position
    const label = this.ghostLabels.get(state.id);
    if (label) {
      label.setPosition(state.x, state.y - 20);
    }

    // Downed state tracking for remote peers
    if (state.isDowned) {
      if (!this.downedPeers.has(state.id)) {
        this.downedPeers.add(state.id);
        this.reviveProgress.set(state.id, 0);
      }
      // Show/update DOWNED label above ghost
      let downedLabel = this.ghostDownedLabels.get(state.id);
      if (!downedLabel) {
        downedLabel = this.add.text(state.x, state.y - 32, 'DOWNED', {
          fontSize: '10px', fontFamily: 'Consolas, monospace', color: '#ff4444',
          fontStyle: 'bold', stroke: '#000000', strokeThickness: 2,
        }).setOrigin(0.5).setDepth(10);
        this.ghostDownedLabels.set(state.id, downedLabel);
      }
      downedLabel.setPosition(state.x, state.y - 32);

      // Show/update revive progress bar
      let reviveBar = this.ghostReviveBars.get(state.id);
      if (!reviveBar) {
        reviveBar = this.add.graphics().setDepth(10);
        this.ghostReviveBars.set(state.id, reviveBar);
      }
      const progress = this.reviveProgress.get(state.id) ?? 0;
      const barW = 30;
      const barH = 4;
      const barX = state.x - barW / 2;
      const barY = state.y - 40;
      reviveBar.clear();
      reviveBar.fillStyle(0x222222, 0.8);
      reviveBar.fillRect(barX, barY, barW, barH);
      reviveBar.fillStyle(0x00ff88, 1);
      reviveBar.fillRect(barX, barY, barW * (progress / this.REVIVE_DURATION), barH);
    } else {
      // Peer is no longer downed - clean up
      if (this.downedPeers.has(state.id)) {
        this.downedPeers.delete(state.id);
        this.reviveProgress.delete(state.id);
        const downedLabel = this.ghostDownedLabels.get(state.id);
        if (downedLabel) { downedLabel.destroy(); this.ghostDownedLabels.delete(state.id); }
        const reviveBar = this.ghostReviveBars.get(state.id);
        if (reviveBar) { reviveBar.destroy(); this.ghostReviveBars.delete(state.id); }
      }
    }
  }

  private updateMultiplayer(time: number, delta: number) {
    // Throttle state sends
    this.netSendTimer += delta;
    if (this.netSendTimer >= this.NET_SEND_INTERVAL) {
      this.netSendTimer = 0;
      const p = this.player;
      const body = p.sprite.body as Phaser.Physics.Arcade.Body;
      const state: NetPlayerState = {
        id: NetManager.playerId,
        x: p.sprite.x,
        y: p.sprite.y,
        velX: body.velocity.x,
        velY: body.velocity.y,
        flipX: p.sprite.flipX,
        hp: p.hp,
        maxHp: p.maxHp,
        className: this.currentClass,
        isAttacking: p.isAttacking,
        isDashing: 'isDashing' in p ? !!(p as any).isDashing : false,
        isUsingUltimate: 'isUsingUltimate' in p ? !!(p as any).isUsingUltimate : false,
        isDowned: this.isDowned,
        facingRight: p.facingRight,
      };
      NetManager.sendState(state);
    }

    // Interpolate ghost positions toward their target (smoother than snapping)
    for (const [peerId, peerState] of NetManager.peers) {
      const ghost = this.ghostSprites.get(peerId);
      if (ghost) {
        const lerpFactor = 0.3;
        ghost.x = Phaser.Math.Linear(ghost.x, peerState.x, lerpFactor);
        ghost.y = Phaser.Math.Linear(ghost.y, peerState.y, lerpFactor);
      }
    }

    // Downed state countdown for local player
    if (this.isDowned) {
      this.downedTimer -= delta;
      if (this.downedTimerText) {
        const secs = Math.max(0, Math.ceil(this.downedTimer / 1000));
        this.downedTimerText.setText('DOWNED  ' + secs + 's');
      }
      if (this.downedTimer <= 0) {
        this.isDowned = false;
        this.cleanupDownedUI();
        this.proceedToDeath();
      }
    }

    // Revive proximity check: if local player is near a downed peer, accumulate revive progress
    if (!this.isDowned) {
      const px = this.player.sprite.x;
      const py = this.player.sprite.y;
      for (const peerId of this.downedPeers) {
        const peerState = NetManager.peers.get(peerId);
        if (!peerState) continue;
        const dx = peerState.x - px;
        const dy = peerState.y - py;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= this.REVIVE_PROXIMITY) {
          const progress = (this.reviveProgress.get(peerId) ?? 0) + delta;
          this.reviveProgress.set(peerId, progress);
          if (progress >= this.REVIVE_DURATION) {
            NetManager.sendEvent('revived', { targetId: peerId });
            this.downedPeers.delete(peerId);
            this.reviveProgress.delete(peerId);
            const downedLabel = this.ghostDownedLabels.get(peerId);
            if (downedLabel) { downedLabel.destroy(); this.ghostDownedLabels.delete(peerId); }
            const reviveBar = this.ghostReviveBars.get(peerId);
            if (reviveBar) { reviveBar.destroy(); this.ghostReviveBars.delete(peerId); }
            this.showNotification('Ally revived!', '#00ff88');
          }
        } else {
          this.reviveProgress.set(peerId, 0);
        }
      }
    }

    // Invincibility flash (post-revive)
    if (this.invincibleUntilTime > 0 && time >= this.invincibleUntilTime) {
      this.invincibleUntilTime = 0;
      this.player.sprite.clearTint();
      this.player.sprite.setAlpha(1);
    } else if (this.invincibleUntilTime > 0) {
      const flash = Math.floor(time / 100) % 2 === 0;
      this.player.sprite.setAlpha(flash ? 1 : 0.4);
    }
  }

  private updateNetHud() {
    if (this.netHudText) {
      const peerCount = NetManager.getPeerCount() + 1;
      this.netHudText.setText(`ROOM: ${NetManager.getRoomCode()} (${peerCount}P)`);
    }
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
  getBoss(): Boss | HollowKing | LadyHemlock | Overclock | NexusCore | null {
    if (this.boss5?.isActive && this.boss5.state !== 'dead') return this.boss5;
    if (this.boss4?.isActive && this.boss4.state !== 'dead') return this.boss4;
    if (this.boss3?.isActive && this.boss3.state !== 'dead') return this.boss3;
    if (this.boss2?.isActive && this.boss2.state !== 'dead') return this.boss2;
    if (this.boss?.isActive && this.boss.state !== 'dead') return this.boss;
    return null;
  }

  /** Returns all active bosses for systems that need to check both */
  getAllActiveBosses(): (Boss | HollowKing | LadyHemlock | Overclock | NexusCore)[] {
    const bosses: (Boss | HollowKing | LadyHemlock | Overclock | NexusCore)[] = [];
    if (this.boss?.isActive && this.boss.state !== 'dead') bosses.push(this.boss);
    if (this.boss2?.isActive && this.boss2.state !== 'dead') bosses.push(this.boss2);
    if (this.boss3?.isActive && this.boss3.state !== 'dead') bosses.push(this.boss3);
    if (this.boss4?.isActive && this.boss4.state !== 'dead') bosses.push(this.boss4);
    if (this.boss5?.isActive && this.boss5.state !== 'dead') bosses.push(this.boss5);
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

  /** Called by Enemy on death — spawns a loot drop and gold.
   *  qualityBoost (0-1) increases drop chance and rarity — used by tougher enemies. */
  spawnLootDrop(x: number, y: number, qualityBoost = 0) {
    // Always drop some gold — tougher enemies drop more
    const goldMult = 1 + qualityBoost * 3;
    const goldAmount = Math.floor((5 + Math.floor(Math.random() * 10) + this.player.level * 2) * goldMult);
    this.gold += goldAmount;
    playSound('goldPickup');
    this.showLootText(x, y - 16, `+${goldAmount}g`, 'legendary');

    // Drop chance: 40% base + qualityBoost (e.g. charger/shade = 55%)
    if (Math.random() > 0.4 + qualityBoost) return;

    // Quality boost translates to effective level boost for rarity calc
    const effectiveLevel = this.player.level + Math.floor(qualityBoost * 10);
    const item = generateDrop(effectiveLevel);
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
    this.physics.add.collider(this.player.sprite, this.groundLayer, undefined, (_sprite, tile) => {
      if ((tile as any).index === 2 && (this.player as any).droppingThrough) return false;
      return true;
    });
    this.combat = new CombatSystem(this);
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);
    this.currentClass = cls;
    const colors: Record<ClassName, string> = { vanguard: '#4488ff', gunner: '#44ff88', wraith: '#aa44ff' };
    (this.classLabel as Phaser.GameObjects.Text).setText(`${this.zoneDef.name} — ${cls.toUpperCase()}  [1/2/3 | TAB | C | S]`).setColor(colors[cls]);
  }

  // -- Zone System Helpers --

  private getLevelData(): number[][] {
    // Boss practice zones use generic arena
    if (this.currentZone.endsWith('_boss')) return getBossArenaTiles();
    switch (this.currentZone) {
      case 'cryptvault': return createCryptvaultLevel();
      case 'hub': return createHubLevel();
      case 'garden': return getBlightedGardenTiles();
      case 'citadel': return getNeonCitadelTiles();
      case 'voidnexus': return getVoidNexusTiles();
      default: return createTestLevel();
    }
  }

  private getTilesetKey(): string {
    switch (this.currentZone) {
      case 'cryptvault': return 'tileset-cryptvault';
      case 'hub': return 'tileset-hub';
      case 'garden': return 'tileset-garden';
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
          const spikeColor = this.currentZone === 'cryptvault' ? 0x8844cc
            : this.currentZone.startsWith('citadel') ? 0x44ccff : 0xff4422;
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
    if (this.currentZone === 'hub' || this.zoneDef.bossOnly) return; // No enemies in hub or boss practice zones

    const types = this.zoneDef.enemyTypes as EnemyType[];
    if (types.length === 0) return;

    // Generate enemy positions spread across the level
    const levelW = this.zoneDef.width;
    // Scale enemy count with level length — ~1 enemy per 10 tiles of playable area
    const endTileForCount = (this.zoneDef.bossTriggerTileX ?? levelW - 5) - 3;
    const count = Math.max(10, Math.floor((endTileForCount - 8) / 10));
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

      // Apply NG+ and zone modifier scaling
      const ngMult = getNGPlusMultiplier(this.ngPlusLevel);
      const zoneMods = getZoneModifiers(this.currentZone, this.ngPlusLevel);
      const merged = mergeModifiers(zoneMods);
      enemy.hp = Math.round(enemy.hp * ngMult * merged.enemyHpMult);
      enemy.maxHp = enemy.hp;
      enemy.damage = Math.round(enemy.damage * ngMult * merged.enemyDamageMult);
      enemy.speed = Math.round(enemy.speed * merged.enemySpeedMult);

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
    const defaultGroundY = levelH * TILE_SIZE - 48;
    for (const exit of this.zoneDef.exits) {
      const worldX = exit.tileX * TILE_SIZE;

      // Check if this is a locked boss practice door or the Void Nexus (requires all 4 bosses)
      const isBossZone = exit.targetZone.endsWith('_boss');
      const isVoidNexus = exit.targetZone === 'voidnexus';
      const targetZoneDef = getZone(exit.targetZone);
      const bossDefeated = isVoidNexus
        ? this.bossesDefeated.length >= 4
        : !isBossZone || !targetZoneDef.bossId || this.bossesDefeated.includes(targetZoneDef.bossId);

      // Portal color: green if accessible, red if locked
      const portalColor = bossDefeated ? 0x00ffcc : 0xff4444;

      // Find actual ground Y at this tile column (portal sits on first solid/platform tile)
      const portalY = this.findGroundY(worldX) ?? defaultGroundY;
      const exitY = portalY - 16; // Center portal above ground

      // Visual: glowing portal
      const g = this.add.graphics();
      g.fillStyle(portalColor, 0.3);
      g.fillRect(0, 0, 16, 32);
      g.lineStyle(2, portalColor, 0.7);
      g.strokeRect(0, 0, 16, 32);
      const key = `exit-${exit.tileX}-${exit.targetZone}`;
      g.generateTexture(key, 16, 32);
      g.destroy();

      const sprite = this.add.sprite(worldX, exitY, key).setDepth(5);
      this.tweens.add({
        targets: sprite,
        alpha: { from: 0.5, to: 1 },
        duration: 1000,
        yoyo: true,
        repeat: -1,
      });

      // Zone name label — use explicit label if provided, else derive from zone name
      const labelText = exit.label ?? (exit.targetZone === 'hub' ? 'HUB' : getZone(exit.targetZone).name.toUpperCase());
      const labelColor = bossDefeated ? '#00ffcc' : '#ff4444';
      this.add.text(worldX, exitY - 22, labelText, {
        fontSize: '10px', fontFamily: 'Consolas, monospace', color: labelColor,
        stroke: '#000000', strokeThickness: 1,
      }).setOrigin(0.5).setDepth(5);

      // Show "LOCKED" below label for locked doors
      if (!bossDefeated) {
        const lockMsg = isVoidNexus ? `${this.bossesDefeated.length}/4 BOSSES` : 'LOCKED';
        this.add.text(worldX, exitY - 12, lockMsg, {
          fontSize: '9px', fontFamily: 'Consolas, monospace', color: '#ff4444',
          stroke: '#000000', strokeThickness: 1,
        }).setOrigin(0.5).setDepth(5);
      }

      // Only add to zoneExits if accessible (locked doors can't be entered)
      if (bossDefeated) {
        this.zoneExits.push({
          x: worldX,
          y: exitY,
          targetZone: exit.targetZone,
          targetSpawnX: exit.targetSpawnTileX,
        });
      }
    }
  }

  private checkZoneExits() {
    const px = this.player.sprite.x;
    const py = this.player.sprite.y;

    for (const exit of this.zoneExits) {
      if (Math.abs(px - exit.x) < 16 && Math.abs(py - exit.y) < 32) {
        // Save before transitioning
        playSound('zoneTransit');
        this.saveGame();

        // Build save data to carry through zone transition (preserves inventory/state)
        const transitionSave = buildSaveData(
          this.currentClass, this.player, this.inventory, this.bossesDefeated, exit.targetZone, this.gold, this.ngPlusLevel
        );

        // Fade out before transitioning
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          // Stop music before transitioning (prevents oscillator leak)
          fadeOutMusic();

          // Transition to new zone
          this.scene.stop('HUDScene');
          this.scene.restart({
            selectedClass: this.currentClass,
            saveData: transitionSave,
            zoneId: exit.targetZone,
            spawnX: exit.targetSpawnX,
          });
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
    const data = buildSaveData(this.currentClass, this.player, this.inventory, this.bossesDefeated, this.currentZone, this.gold, this.ngPlusLevel);
    writeSave(data);
  }

  /** Spawn save crystals at key locations */
  private spawnSaveCrystals() {
    const groundY = this.zoneDef.height * TILE_SIZE - 48;

    // Zone-specific crystal positions
    let crystalPositions: { x: number; y: number }[];
    if (this.zoneDef.bossOnly) {
      // Boss practice zones: single crystal at spawn
      crystalPositions = [{ x: 4 * TILE_SIZE, y: groundY }];
    } else if (this.currentZone === 'hub') {
      crystalPositions = [{ x: 30 * TILE_SIZE, y: groundY }];
    } else if (this.currentZone === 'cryptvault') {
      crystalPositions = [
        { x: 4 * TILE_SIZE, y: groundY },
        { x: 40 * TILE_SIZE, y: groundY },
        { x: 76 * TILE_SIZE, y: groundY },
        { x: 110 * TILE_SIZE, y: groundY },
      ];
    } else if (this.currentZone === 'garden') {
      crystalPositions = [
        { x: 4 * TILE_SIZE, y: groundY },
        { x: 45 * TILE_SIZE, y: groundY },
        { x: 85 * TILE_SIZE, y: groundY },
        { x: 120 * TILE_SIZE, y: groundY },
      ];
    } else if (this.currentZone === 'citadel') {
      crystalPositions = [
        { x: 4 * TILE_SIZE, y: groundY },
        { x: 42 * TILE_SIZE, y: groundY },
        { x: 78 * TILE_SIZE, y: groundY },
        { x: 115 * TILE_SIZE, y: groundY },
      ];
    } else if (this.currentZone === 'voidnexus') {
      crystalPositions = [
        { x: 4 * TILE_SIZE, y: groundY },
        { x: 38 * TILE_SIZE, y: groundY },
        { x: 75 * TILE_SIZE, y: groundY },
        { x: 110 * TILE_SIZE, y: groundY },
        { x: 145 * TILE_SIZE, y: groundY },
      ];
    } else {
      // Foundry (default)
      crystalPositions = [
        { x: 4 * TILE_SIZE, y: groundY },
        { x: 50 * TILE_SIZE, y: groundY },
        { x: 80 * TILE_SIZE, y: groundY },
        { x: 120 * TILE_SIZE, y: groundY },
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

        // Show NG+ prompt in hub when all 4 bosses defeated
        if (this.currentZone === 'hub' && this.bossesDefeated.length >= 4 && !this.ngPlusPrompt) {
          const nextNg = this.ngPlusLevel + 1;
          this.ngPlusPrompt = this.add.text(sp.x, sp.y - 40, `[E] NEW GAME+ ${nextNg}`, {
            fontSize: '11px', fontFamily: 'Consolas, monospace', color: '#ffcc44',
            fontStyle: 'bold', stroke: '#000000', strokeThickness: 2,
          }).setOrigin(0.5).setDepth(10);
          this.tweens.add({
            targets: this.ngPlusPrompt,
            alpha: { from: 0.6, to: 1 },
            duration: 800,
            yoyo: true,
            repeat: -1,
          });
        }
        break;
      }
    }

    // NG+ trigger — press E near save crystal in hub
    if (this.ngPlusPrompt && Phaser.Input.Keyboard.JustDown(this.interactKey)) {
      const px = this.player.sprite.x;
      const py = this.player.sprite.y;
      for (const sp of this.savePoints) {
        if (Phaser.Math.Distance.Between(px, py, sp.x, sp.y) < 32) {
          this.startNewGamePlus();
          break;
        }
      }
    }
  }

  private startNewGamePlus() {
    const currentSave = buildSaveData(
      this.currentClass, this.player, this.inventory,
      this.bossesDefeated, this.currentZone, this.gold, this.ngPlusLevel
    );
    const ngSave = buildNGPlusSave(currentSave);
    writeSave(ngSave);
    playSound('powerAbsorb');

    // Flash and transition
    this.cameras.main.flash(500, 255, 200, 50);
    this.showNotification(`NEW GAME+ ${ngSave.ngPlusLevel} — enemies are stronger!`);

    this.time.delayedCall(1500, () => {
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        fadeOutMusic();
        this.scene.stop('HUDScene');
        this.scene.start('GameScene', {
          selectedClass: this.currentClass,
          saveData: ngSave,
          zoneId: 'hub',
        });
      });
    });
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

    const spawnNPC = (tileX: number, texture: string, labelText: string, labelColor: string, type: string) => {
      const x = tileX * TILE_SIZE;
      const spr = this.add.sprite(x, groundY, texture).setOrigin(0.5, 1).setDepth(5);
      const lbl = this.add.text(x, groundY - 28, labelText, {
        fontSize: '10px', fontFamily: 'Consolas, monospace', color: labelColor,
        stroke: '#000000', strokeThickness: 1,
      }).setOrigin(0.5).setDepth(5);
      this.tweens.add({
        targets: spr, y: groundY - 2,
        duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
      this.npcs.push({ sprite: spr, type, label: lbl });
    };

    spawnNPC(20, 'npc-shopkeeper', 'SHOP', '#ccaa66', 'shop');
    spawnNPC(25, 'npc-lore', 'LORE', '#aa66ff', 'lore');
    spawnNPC(35, 'npc-training', 'TRAINING', '#00ccaa', 'training');
  }

  private checkNPCProximity() {
    if (this.npcs.length === 0) return;
    if (this.dialogue.dialogueActive) return;

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
      if (!this.npcPrompt) {
        this.npcPrompt = this.add.text(nearNpc.sprite.x, nearNpc.sprite.y - 40, 'Press E to interact', {
          fontSize: '10px', fontFamily: 'Consolas, monospace', color: '#ffffff',
          stroke: '#000000', strokeThickness: 1,
        }).setOrigin(0.5).setDepth(50);
      }
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
      this.dialogue.show(this.getShopDialogue());
      // Open actual shop after dialogue finishes
      const waitForDialogue = this.time.addEvent({
        delay: 100, loop: true,
        callback: () => {
          if (!this.dialogue.isActive()) {
            waitForDialogue.destroy();
            this.scene.launch('ShopScene', { gameScene: this });
            this.scene.pause('GameScene');
          }
        },
      });
    } else if (type === 'lore') {
      this.dialogue.show(this.getLoreDialogue());
    } else if (type === 'training') {
      this.dialogue.show(this.getTrainingDialogue());
    }
  }

  private getShopDialogue(): DialogueLine[] {
    const sets: DialogueLine[][] = [
      [
        { speaker: 'MERCHANT', text: 'Welcome, warrior. My wares are the finest in the Threshold.', color: '#ccaa66' },
        { speaker: 'MERCHANT', text: 'Looking to upgrade? I have blades tempered in neon fire.', color: '#ccaa66' },
        { speaker: 'MERCHANT', text: "A tip for free: Voltrexx is weak to sustained pressure. Don't let him charge up.", color: '#ccaa66' },
      ],
      [
        { speaker: 'MERCHANT', text: "Back again? Good. You'll need better gear for what lies ahead.", color: '#ccaa66' },
        { speaker: 'MERCHANT', text: 'The bosses grow stronger the deeper you go. Equip wisely.', color: '#ccaa66' },
      ],
      [
        { speaker: 'MERCHANT', text: "Hemlock's poison lingers. If you find antidote charms, buy them.", color: '#ccaa66' },
        { speaker: 'MERCHANT', text: 'Overclock has no patience. He telegraphs every big attack.', color: '#ccaa66' },
      ],
    ];
    return sets[Math.floor(Math.random() * sets.length)];
  }

  private getLoreDialogue(): DialogueLine[] {
    const sets: DialogueLine[][] = [
      [
        { speaker: 'ARCHIVIST', text: 'This world was not always broken. The corruption came from the Void Nexus.', color: '#aa66ff' },
        { speaker: 'ARCHIVIST', text: "Each zone was once a thriving district. The Foundry forged the city's lifeblood.", color: '#aa66ff' },
        { speaker: 'ARCHIVIST', text: 'The Cryptvault held the memories of the dead. Now they walk freely.', color: '#aa66ff' },
      ],
      [
        { speaker: 'ARCHIVIST', text: 'The Blighted Garden was a paradise, before Hemlock twisted nature itself.', color: '#aa66ff' },
        { speaker: 'ARCHIVIST', text: "The Neon Citadel housed the city's brain. Overclock seized control.", color: '#aa66ff' },
        { speaker: 'ARCHIVIST', text: 'Defeat all four bosses and the path to the Void Nexus will open.', color: '#aa66ff' },
      ],
      [
        { speaker: 'ARCHIVIST', text: 'The Nexus Core pulses with void energy. It is the source of all corruption.', color: '#aa66ff' },
        { speaker: 'ARCHIVIST', text: 'Some say if you destroy it, the world will heal. Others say it will collapse entirely.', color: '#aa66ff' },
      ],
    ];
    return sets[Math.floor(Math.random() * sets.length)];
  }

  private getTrainingDialogue(): DialogueLine[] {
    const sets: DialogueLine[][] = [
      [
        { speaker: 'COMMANDER', text: 'Listen up. Your attack combo cycles through three weapons. Use all three.', color: '#00ccaa' },
        { speaker: 'COMMANDER', text: "Dash with X to dodge through attacks. Time it with the enemy's wind-up.", color: '#00ccaa' },
        { speaker: 'COMMANDER', text: 'In the air, try a downward pogo attack. It keeps you safe from ground hazards.', color: '#00ccaa' },
      ],
      [
        { speaker: 'COMMANDER', text: 'Boss patterns repeat. Learn the rhythm. Dodge, punish, repeat.', color: '#00ccaa' },
        { speaker: 'COMMANDER', text: 'The Hollow King telegraphs his scythe sweep with a long wind-up. Jump over it.', color: '#00ccaa' },
        { speaker: 'COMMANDER', text: "Don't forget your boss powers. Press C to use them. S to swap.", color: '#00ccaa' },
      ],
      [
        { speaker: 'COMMANDER', text: 'Energy regenerates slowly. Land hits to restore it faster.', color: '#00ccaa' },
        { speaker: 'COMMANDER', text: 'Higher combo counts deal bonus damage. Keep the pressure on.', color: '#00ccaa' },
      ],
    ];
    return sets[Math.floor(Math.random() * sets.length)];
  }

  // -- Boss intro dialogues --

  private readonly BOSS_INTRO_LINES: Record<string, DialogueLine[]> = {
    voltrexx: [
      { speaker: 'VOLTREXX', text: "You dare enter my forge? I'll turn you to ash.", color: '#00ffcc' },
      { speaker: 'VOLTREXX', text: 'Feel the lightning surge through every circuit. There is no escape.', color: '#00ffcc' },
      { speaker: 'VOLTREXX', text: 'Come then. Let the current decide your fate.', color: '#00ffcc' },
    ],
    hollow_king: [
      { speaker: 'HOLLOW KING', text: '...Another soul wanders into the crypt.', color: '#6644aa' },
      { speaker: 'HOLLOW KING', text: 'Death is not an ending here. It is a beginning.', color: '#6644aa' },
      { speaker: 'HOLLOW KING', text: 'Join the echoes. You will learn to love the silence.', color: '#6644aa' },
    ],
    hemlock: [
      { speaker: 'LADY HEMLOCK', text: 'How delightful. A visitor to my garden.', color: '#44cc44' },
      { speaker: 'LADY HEMLOCK', text: "Every petal here drips with venom. Beautiful, isn't it?", color: '#44cc44' },
      { speaker: 'LADY HEMLOCK', text: 'Let me show you how nature reclaims what was taken.', color: '#44cc44' },
    ],
    overclock: [
      { speaker: 'OVERCLOCK', text: 'INTRUDER DETECTED. THREAT LEVEL: NEGLIGIBLE.', color: '#44ccff' },
      { speaker: 'OVERCLOCK', text: 'Processing power at 400%. Your reaction time is insufficient.', color: '#44ccff' },
      { speaker: 'OVERCLOCK', text: 'INITIATING TERMINATION PROTOCOL.', color: '#44ccff' },
    ],
    nexus_core: [
      { speaker: 'NEXUS CORE', text: 'You have reached the heart of the void.', color: '#ff44ff' },
      { speaker: 'NEXUS CORE', text: 'I am the corruption. I am the source. I am everything.', color: '#ff44ff' },
      { speaker: 'NEXUS CORE', text: 'All will be consumed. Starting with you.', color: '#ff44ff' },
    ],
  };

  private showBossIntroThenActivate(bossId: string, boss: { activate: () => void }) {
    const introLines = this.BOSS_INTRO_LINES[bossId];
    if (!introLines || this.bossIntroPlayed.has(bossId)) {
      boss.activate();
      setBossActive(true);
      return;
    }
    this.bossIntroPlayed.add(bossId);
    this.dialogue.show(introLines);
    const checkDone = this.time.addEvent({
      delay: 100,
      loop: true,
      callback: () => {
        if (!this.dialogue.isActive()) {
          checkDone.destroy();
          boss.activate();
          setBossActive(true);
        }
      },
    });
  }

  // -- Zone title cinematic --

  private showZoneTitle() {
    const zoneTitles: Record<string, { title: string; subtitle: string }> = {
      hub: { title: 'THE THRESHOLD', subtitle: 'A Moment of Respite' },
      foundry: { title: 'NEON FOUNDRY', subtitle: 'Where Metal Burns' },
      cryptvault: { title: 'CRYPTVAULT', subtitle: 'Echoes of the Dead' },
      garden: { title: 'BLIGHTED GARDEN', subtitle: "Nature's Decay" },
      citadel: { title: 'NEON CITADEL', subtitle: 'Heart of the Machine' },
      voidnexus: { title: 'THE VOID NEXUS', subtitle: 'Source of the Corruption' },
    };
    const baseZone = this.currentZone.replace(/_boss$/, '');
    const entry = zoneTitles[baseZone];
    if (!entry) return;

    const accentColor = '#' + this.zoneDef.palette.accent.toString(16).padStart(6, '0');

    const titleText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 12, entry.title, {
      fontSize: '24px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold',
      color: accentColor, stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(400).setAlpha(0);

    const subtitleText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 14, entry.subtitle, {
      fontSize: '12px', fontFamily: 'Arial, sans-serif',
      color: '#aaaaaa', stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(400).setAlpha(0);

    // Fade in 0.5s, hold 2s, fade out 0.5s = ~3s total
    this.tweens.add({
      targets: [titleText, subtitleText],
      alpha: 1,
      duration: 500,
      onComplete: () => {
        this.time.delayedCall(2000, () => {
          this.tweens.add({
            targets: [titleText, subtitleText],
            alpha: 0,
            duration: 500,
            onComplete: () => {
              titleText.destroy();
              subtitleText.destroy();
            },
          });
        });
      },
    });
  }

  /** Called by player entity on death - enters downed state in multiplayer, or dies in solo */
  onPlayerDeath() {
    // In multiplayer with peers connected, enter downed state instead of dying immediately
    if (NetManager.isOnline() && NetManager.getPeerCount() > 0 && !this.isDowned) {
      this.enterDownedState();
      return;
    }
    this.proceedToDeath();
  }

  /** Actually proceed to the death screen (solo, or downed timer expired) */
  private proceedToDeath() {
    this.scene.pause('GameScene');
    this.scene.launch('DeathScene', {
      zoneName: this.zoneDef.name,
      className: this.currentClass,
      zoneId: this.currentZone,
    });
  }

  /** Enter the downed state - player is incapacitated but can be revived */
  private enterDownedState() {
    this.isDowned = true;
    this.downedTimer = this.DOWNED_DURATION;
    this.player.hp = 0;

    // Disable player movement
    const body = this.player.sprite.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);

    // Visual: red tint on player sprite
    this.player.sprite.setTint(0xff4444);
    this.player.sprite.setAlpha(0.7);

    // HUD overlay for downed state
    this.downedOverlay = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, 'DOWNED', {
      fontSize: '28px', fontFamily: 'Consolas, monospace', color: '#ff4444',
      fontStyle: 'bold', stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(200);

    this.downedTimerText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 10, 'DOWNED  10s', {
      fontSize: '14px', fontFamily: 'Consolas, monospace', color: '#ff8888',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(200);

    // Pulse the overlay
    this.tweens.add({
      targets: this.downedOverlay,
      alpha: { from: 0.6, to: 1 },
      duration: 600,
      yoyo: true,
      repeat: -1,
    });
  }

  /** Handle being revived by a peer */
  private handleRevived() {
    this.isDowned = false;
    this.cleanupDownedUI();

    // Restore to 30% HP
    this.player.hp = Math.floor(this.player.maxHp * 0.3);

    // Brief invincibility (2s)
    this.invincibleUntilTime = this.time.now + 2000;
    this.player.invincibleUntil = this.time.now + 2000;

    // Clear tint and restore alpha
    this.player.sprite.clearTint();
    this.player.sprite.setAlpha(1);

    this.showNotification('REVIVED!', '#00ff88');
    playSound('levelUp');
  }

  /** Remove downed UI elements */
  private cleanupDownedUI() {
    if (this.downedOverlay) {
      this.tweens.killTweensOf(this.downedOverlay);
      this.downedOverlay.destroy();
      this.downedOverlay = null;
    }
    if (this.downedTimerText) {
      this.downedTimerText.destroy();
      this.downedTimerText = null;
    }
    this.player.sprite.clearTint();
    this.player.sprite.setAlpha(1);
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
