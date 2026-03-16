import Phaser from 'phaser';
import { safeShake } from '../systems/AccessibilitySettings';
import { playSound } from '../systems/SoundManager';
import { flashBloom } from '../systems/FXManager';
import { COLORS, HITSTOP_DURATION_MS, GAME_WIDTH, GAME_HEIGHT } from '../../shared/constants';

export type BossPhase = 1 | 2 | 3;
type BossState = 'idle' | 'telegraph' | 'attack' | 'hurt' | 'dead' | 'transition';

interface BossAttack {
  name: string;
  telegraph: number; // ms warning before attack
  duration: number;  // ms attack lasts
  cooldown: number;  // ms before next attack
  execute: () => void;
}

/**
 * VOLTREXX — Boss of the Neon Foundry
 * A massive power-core construct that controls electricity.
 *
 * Phase 1 (100-66% HP): Simple patterns — ground slam, horizontal lightning
 * Phase 2 (66-33% HP): Adds chain lightning, faster patterns
 * Phase 3 (33-0% HP): Arena hazards, desperation attacks
 */
export class Boss {
  scene: Phaser.Scene;
  sprite: Phaser.Physics.Arcade.Sprite;
  body: Phaser.Physics.Arcade.Body;

  name = 'VOLTREXX';
  powerId = 'chain_lightning';
  powerName = 'CHAIN LIGHTNING';
  hp: number;
  maxHp: number;
  damage = 15;
  state: BossState = 'idle';
  phase: BossPhase = 1;
  isActive = false;

  private attackTimer = 0;
  private currentAttack: BossAttack | null = null;
  private attackQueue: BossAttack[] = [];
  private actionCooldown = 1500;
  private hitstopUntil = 0;
  private facingRight = false;

  // Visual
  private hpBarBg: Phaser.GameObjects.Graphics;
  private hpBar: Phaser.GameObjects.Graphics;
  private nameText: Phaser.GameObjects.Text;
  private phaseText: Phaser.GameObjects.Text;

  // Attack projectiles/hazards
  private hazards: Phaser.GameObjects.GameObject[] = [];

  // Poison debuff — slows boss attack rate
  private poisonTimer = 0;
  private poisonSlowMult = 1;

  // Arena bounds
  private arenaLeft: number;
  private arenaRight: number;
  private arenaFloor: number;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.maxHp = 800;
    this.hp = this.maxHp;

    // Arena bounds (boss fight area)
    this.arenaLeft = x - 100;
    this.arenaRight = x + 100;
    this.arenaFloor = y;

    // Generate boss texture (large, imposing)
    const g = scene.add.graphics();
    // Core body
    g.fillStyle(0x2244aa);
    g.fillRect(0, 0, 32, 40);
    // Neon core
    g.fillStyle(COLORS.neon, 0.8);
    g.fillCircle(16, 16, 6);
    // Electric arcs (decorative lines)
    g.lineStyle(1, 0x00ffcc, 0.6);
    g.lineBetween(4, 8, 12, 16);
    g.lineBetween(28, 8, 20, 16);
    g.lineBetween(8, 32, 16, 24);
    g.lineBetween(24, 32, 16, 24);
    // Border
    g.lineStyle(2, 0x4488ff);
    g.strokeRect(0, 0, 32, 40);
    g.generateTexture('boss-voltrexx', 32, 40);
    g.destroy();

    // Sprite
    this.sprite = scene.physics.add.sprite(x, y, 'boss-voltrexx');
    this.sprite.setOrigin(0.5, 1);
    this.body = this.sprite.body as Phaser.Physics.Arcade.Body;
    this.body.setSize(28, 38);
    this.body.setImmovable(true);
    this.body.setAllowGravity(false);
    (this.sprite as any).owner = this;
    (this.sprite as any).isBoss = true;

    // HP bar (screen-fixed, wide bar at top)
    this.hpBarBg = scene.add.graphics().setScrollFactor(0).setDepth(200);
    this.hpBar = scene.add.graphics().setScrollFactor(0).setDepth(201);
    this.nameText = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 28, '', {
      fontSize: '14px', fontFamily: 'Arial, Helvetica, sans-serif', color: '#ff4444',
      fontStyle: 'bold', stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(202);
    this.phaseText = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 12, '', {
      fontSize: '12px', fontFamily: 'Arial, Helvetica, sans-serif', color: '#ffcc44',
      stroke: '#000000', strokeThickness: 1,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(202);

    // Start hidden
    this.sprite.setVisible(false);
    this.hpBarBg.setVisible(false);
    this.hpBar.setVisible(false);
  }

  /** Activate the boss (called when player enters boss arena) */
  activate() {
    if (this.isActive) return;
    this.isActive = true;
    this.sprite.setVisible(true);
    this.hpBarBg.setVisible(true);
    this.hpBar.setVisible(true);
    this.nameText.setText(this.name);

    // Dramatic entrance
    playSound('bossRoar');
    safeShake(this.scene.cameras.main, 300, 0.015);
    this.scene.cameras.main.flash(200, 0, 100, 200);
  }

  update(time: number, delta: number) {
    if (!this.isActive || this.state === 'dead') return;

    // Hitstop
    if (time < this.hitstopUntil) return;

    // Poison tick-down
    if (this.poisonTimer > 0) {
      this.poisonTimer -= delta;
      if (this.poisonTimer <= 0) {
        this.poisonSlowMult = 1;
        this.sprite.clearTint();
      }
    }

    const gameScene = this.scene as any;
    const player = gameScene.player;
    if (!player) return;

    // Face player
    this.facingRight = player.sprite.x > this.sprite.x;
    this.sprite.setFlipX(this.facingRight);

    // Phase transitions
    const hpPercent = this.hp / this.maxHp;
    if (hpPercent <= 0.33 && this.phase < 3) {
      this.phase = 3;
      this.onPhaseChange();
    } else if (hpPercent <= 0.66 && this.phase < 2) {
      this.phase = 2;
      this.onPhaseChange();
    }

    // State machine
    switch (this.state) {
      case 'idle':
        this.actionCooldown -= delta * this.poisonSlowMult; // Poison slows attack rate
        if (this.actionCooldown <= 0) {
          this.chooseAttack();
        }
        // Gentle hover
        this.sprite.y = this.arenaFloor + Math.sin(time * 0.003) * 3;
        break;

      case 'telegraph':
        this.attackTimer -= delta;
        // Flash during telegraph
        this.sprite.setTint(time % 200 > 100 ? 0xffffff : 0x4488ff);
        if (this.attackTimer <= 0) {
          this.sprite.clearTint();
          this.state = 'attack';
          this.currentAttack?.execute();
          this.attackTimer = this.currentAttack?.duration ?? 500;
        }
        break;

      case 'attack':
        this.attackTimer -= delta;
        if (this.attackTimer <= 0) {
          this.state = 'idle';
          this.actionCooldown = this.currentAttack?.cooldown ?? 1500;
          this.currentAttack = null;
        }
        break;

      case 'hurt':
        this.attackTimer -= delta;
        if (this.attackTimer <= 0) this.state = 'idle';
        break;

      case 'transition':
        // Phase change animation
        this.attackTimer -= delta;
        this.sprite.setTint(0xffcc44);
        if (this.attackTimer <= 0) {
          this.sprite.clearTint();
          this.state = 'idle';
          this.actionCooldown = 500;
        }
        break;
    }

    this.drawHpBar();
    this.checkHazardHits(player, time);
  }

  /** Apply poison debuff — slows boss attack rate */
  applyPoison(duration: number, slowAmount: number) {
    this.poisonTimer = duration;
    this.poisonSlowMult = slowAmount;
    this.sprite.setTint(0x88ff88);
  }

  /** Power this boss is weak to — takes 1.5x damage */
  readonly weakTo = 'soul_drain';

  takeDamage(amount: number, _sourceX: number, time: number, powerId?: string) {
    if (this.state === 'dead' || this.state === 'transition') return;

    // Weakness check: 1.5x damage from the countering power
    let finalDmg = amount;
    let isWeak = false;
    if (powerId && powerId === this.weakTo) {
      finalDmg = Math.round(amount * 1.5);
      isWeak = true;
    }

    this.hp = Math.max(0, this.hp - finalDmg);
    this.hitstopUntil = time + HITSTOP_DURATION_MS;

    // Flash — yellow for weakness, white for normal
    this.sprite.setTint(isWeak ? 0xffff00 : 0xffffff);
    this.scene.time.delayedCall(100, () => {
      if (this.state !== 'dead') this.sprite.clearTint();
    });

    // Show "WEAK!" text on weakness hit
    if (isWeak) {
      const weakText = this.scene.add.text(this.sprite.x, this.sprite.y - 40, 'WEAK!', {
        fontSize: '14px', fontFamily: 'Arial, sans-serif', color: '#ffff44',
        fontStyle: 'bold', stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0.5).setDepth(50);
      this.scene.tweens.add({
        targets: weakText, y: weakText.y - 16, alpha: 0, duration: 700,
        onComplete: () => weakText.destroy(),
      });
    }

    playSound('bossHit');
    flashBloom(this.scene, isWeak ? 3 : 2, 120);
    safeShake(this.scene.cameras.main, isWeak ? 80 : 60, isWeak ? 0.012 : 0.008);

    if (this.hp <= 0) {
      this.die();
    }
  }

  private die() {
    this.state = 'dead';
    this.cleanupHazards();
    playSound('bossDeath');

    // Explosion sequence
    safeShake(this.scene.cameras.main, 500, 0.03);

    // Multiple explosions
    for (let i = 0; i < 5; i++) {
      this.scene.time.delayedCall(i * 200, () => {
        const ox = (Math.random() - 0.5) * 30;
        const oy = (Math.random() - 0.5) * 30;
        const emitter = this.scene.add.particles(
          this.sprite.x + ox, this.sprite.y - 20 + oy, 'particle', {
            speed: { min: 40, max: 120 },
            angle: { min: 0, max: 360 },
            scale: { start: 1.5, end: 0 },
            lifespan: 400,
            tint: [COLORS.neon, 0x4488ff, 0xffffff],
            quantity: 15,
            emitting: false,
          }
        );
        emitter.explode(15);
        this.scene.time.delayedCall(500, () => emitter.destroy());
      });
    }

    // Boss death reward
    this.scene.time.delayedCall(1200, () => {
      // Grant XP
      const gameScene = this.scene as any;
      if (gameScene.player) {
        gameScene.player.gainXP(200);
      }

      // Show power absorbed text
      const text = this.scene.add.text(this.sprite.x, this.sprite.y - 50,
        `POWER ABSORBED: ${this.powerName}`, {
          fontSize: '14px', fontFamily: 'Arial, Helvetica, sans-serif', color: '#00ffcc',
          fontStyle: 'bold', stroke: '#000000', strokeThickness: 2,
        }).setOrigin(0.5).setDepth(100);

      this.scene.tweens.add({
        targets: text,
        y: text.y - 30,
        alpha: 0,
        duration: 3000,
        onComplete: () => text.destroy(),
      });

      // Add boss power to inventory
      if (gameScene.absorbBossPower) {
        gameScene.absorbBossPower(this.powerId, 'voltrexx');
      }

      // Spawn loot
      if (gameScene.spawnLootDrop) {
        for (let i = 0; i < 3; i++) {
          gameScene.spawnLootDrop(this.sprite.x + (i - 1) * 15, this.sprite.y);
        }
      }

      this.sprite.destroy();
      this.hpBar.destroy();
      this.hpBarBg.destroy();
      this.nameText.destroy();
      this.phaseText.destroy();
    });
  }

  private onPhaseChange() {
    this.state = 'transition';
    this.attackTimer = 1000;
    this.cleanupHazards();
    this.phaseText.setText(`PHASE ${this.phase}`);

    // Screen effects
    safeShake(this.scene.cameras.main, 200, 0.02);
    this.scene.cameras.main.flash(150, 255, 200, 0);
  }

  private chooseAttack() {
    const attacks = this.getAttacksForPhase();
    const attack = attacks[Math.floor(Math.random() * attacks.length)];
    this.currentAttack = attack;
    this.state = 'telegraph';
    this.attackTimer = attack.telegraph;
  }

  private getAttacksForPhase(): BossAttack[] {
    const base: BossAttack[] = [
      {
        name: 'Ground Slam',
        telegraph: 600,
        duration: 400,
        cooldown: 1200,
        execute: () => this.attackGroundSlam(),
      },
      {
        name: 'Lightning Bolt',
        telegraph: 500,
        duration: 300,
        cooldown: 1000,
        execute: () => this.attackLightningBolt(),
      },
    ];

    if (this.phase >= 2) {
      base.push({
        name: 'Chain Lightning',
        telegraph: 700,
        duration: 500,
        cooldown: 1500,
        execute: () => this.attackChainLightning(),
      });
    }

    if (this.phase >= 3) {
      base.push({
        name: 'Electric Storm',
        telegraph: 800,
        duration: 800,
        cooldown: 2000,
        execute: () => this.attackElectricStorm(),
      });
    }

    return base;
  }

  /** Ground slam — shockwave along the floor */
  private attackGroundSlam() {
    safeShake(this.scene.cameras.main, 150, 0.015);

    // Two shockwaves going left and right
    for (const dir of [-1, 1]) {
      const wave = this.scene.physics.add.sprite(this.sprite.x, this.arenaFloor - 4, 'projectile-enemy');
      wave.setDisplaySize(12, 8);
      wave.setTint(0x4488ff);
      const wb = wave.body as Phaser.Physics.Arcade.Body;
      wb.setAllowGravity(false);
      wb.setVelocityX(dir * 120);
      (wave as any).damage = this.damage;
      (wave as any).isEnemyProjectile = true;
      this.hazards.push(wave);

      const gameScene = this.scene as any;
      gameScene.combat?.addEnemyProjectile(wave);

      this.scene.time.delayedCall(1500, () => {
        if (wave.active) wave.destroy();
      });
    }
  }

  /** Lightning bolt — vertical strike at player position */
  private attackLightningBolt() {
    const gameScene = this.scene as any;
    const playerX = gameScene.player?.sprite.x ?? this.sprite.x;

    // Warning indicator
    const warning = this.scene.add.graphics();
    warning.lineStyle(2, 0xff4444, 0.5);
    warning.lineBetween(playerX, 0, playerX, this.arenaFloor);
    warning.setDepth(5);

    this.scene.time.delayedCall(300, () => {
      warning.destroy();

      // Lightning strike
      const bolt = this.scene.add.graphics();
      bolt.lineStyle(3, COLORS.neon, 0.9);
      // Jagged lightning line
      let bx = playerX;
      let by = 0;
      while (by < this.arenaFloor) {
        const nx = bx + (Math.random() - 0.5) * 15;
        const ny = by + 10 + Math.random() * 15;
        bolt.lineBetween(bx, by, nx, ny);
        bx = nx;
        by = ny;
      }
      bolt.setDepth(10);

      // Damage zone
      const strike = this.scene.physics.add.sprite(playerX, this.arenaFloor - 10, 'projectile-enemy');
      strike.setDisplaySize(20, 20);
      strike.setAlpha(0.3);
      strike.setTint(COLORS.neon);
      const sb = strike.body as Phaser.Physics.Arcade.Body;
      sb.setAllowGravity(false);
      (strike as any).damage = this.damage + 5;
      (strike as any).isEnemyProjectile = true;
      this.hazards.push(strike);
      gameScene.combat?.addEnemyProjectile(strike);

      this.scene.time.delayedCall(200, () => {
        bolt.destroy();
        if (strike.active) strike.destroy();
      });
    });
  }

  /** Chain lightning — arcs between multiple points */
  private attackChainLightning() {
    const count = this.phase >= 3 ? 5 : 3;
    for (let i = 0; i < count; i++) {
      this.scene.time.delayedCall(i * 150, () => {
        const x = this.arenaLeft + Math.random() * (this.arenaRight - this.arenaLeft);
        const bolt = this.scene.physics.add.sprite(x, this.arenaFloor - 8, 'projectile-enemy');
        bolt.setDisplaySize(10, 16);
        bolt.setTint(COLORS.neon);
        const bb = bolt.body as Phaser.Physics.Arcade.Body;
        bb.setAllowGravity(false);
        (bolt as any).damage = 10;
        (bolt as any).isEnemyProjectile = true;
        this.hazards.push(bolt);
        const gameScene = this.scene as any;
        gameScene.combat?.addEnemyProjectile(bolt);

        // Flash
        this.scene.cameras.main.flash(50, 0, 200, 255);

        this.scene.time.delayedCall(400, () => {
          if (bolt.active) bolt.destroy();
        });
      });
    }
  }

  /** Electric storm — rain of projectiles from above */
  private attackElectricStorm() {
    safeShake(this.scene.cameras.main, 300, 0.01);

    for (let i = 0; i < 8; i++) {
      this.scene.time.delayedCall(i * 100, () => {
        const x = this.arenaLeft + Math.random() * (this.arenaRight - this.arenaLeft);
        const spark = this.scene.physics.add.sprite(x, this.arenaFloor - 100, 'projectile-enemy');
        spark.setDisplaySize(6, 6);
        spark.setTint(0x4488ff);
        const sb = spark.body as Phaser.Physics.Arcade.Body;
        sb.setAllowGravity(false);
        sb.setVelocityY(100 + Math.random() * 60);
        sb.setVelocityX((Math.random() - 0.5) * 30);
        (spark as any).damage = 8;
        (spark as any).isEnemyProjectile = true;
        this.hazards.push(spark);
        const gameScene = this.scene as any;
        gameScene.combat?.addEnemyProjectile(spark);

        this.scene.time.delayedCall(2000, () => {
          if (spark.active) spark.destroy();
        });
      });
    }
  }

  private cleanupHazards() {
    for (const h of this.hazards) {
      if ((h as any).active) (h as any).destroy();
    }
    this.hazards = [];
  }

  private checkHazardHits(player: any, time: number) {
    // Contact damage from boss body
    if (this.state === 'attack' || this.state === 'idle') {
      const dist = Phaser.Math.Distance.Between(
        player.sprite.x, player.sprite.y,
        this.sprite.x, this.sprite.y - 20
      );
      if (dist < 25) {
        player.takeDamage(this.damage, this.sprite.x, time);
      }
    }
  }

  private drawHpBar() {
    const barW = 300;
    const barH = 8;
    const x = GAME_WIDTH / 2 - barW / 2;
    const y = GAME_HEIGHT - 46;
    const ratio = Math.max(0, this.hp / this.maxHp);

    this.hpBarBg.clear();
    this.hpBarBg.fillStyle(0x220000, 0.8);
    this.hpBarBg.fillRect(x, y, barW, barH);
    this.hpBarBg.lineStyle(1, 0x444444);
    this.hpBarBg.strokeRect(x, y, barW, barH);

    this.hpBar.clear();
    // Color changes by phase
    const colors = [0x44ff44, 0xffcc44, 0xff4444];
    this.hpBar.fillStyle(colors[this.phase - 1], 1);
    this.hpBar.fillRect(x, y, barW * ratio, barH);

    // Phase markers
    this.hpBarBg.lineStyle(1, 0xffffff, 0.3);
    this.hpBarBg.lineBetween(x + barW * 0.33, y, x + barW * 0.33, y + barH);
    this.hpBarBg.lineBetween(x + barW * 0.66, y, x + barW * 0.66, y + barH);
  }
}
