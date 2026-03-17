import Phaser from 'phaser';
import { safeShake } from '../systems/AccessibilitySettings';
import { playSound } from '../systems/SoundManager';
import { flashBloom } from '../systems/FXManager';
import { COLORS, HITSTOP_DURATION_MS, GAME_WIDTH, GAME_HEIGHT } from '../../shared/constants';

type BossPhase = 1 | 2 | 3;
type BossState = 'idle' | 'telegraph' | 'attack' | 'hurt' | 'dead' | 'transition';

interface BossAttack {
  name: string;
  telegraph: number;
  duration: number;
  cooldown: number;
  execute: () => void;
}

/**
 * NEXUS CORE — Final Boss of the Void Nexus
 * The source of all corruption — a colossal void entity that warps reality.
 *
 * Phase 1 (100-60% HP): "Corruption" — void bolts (slow homing), corruption zones on ground
 * Phase 2 (60-30% HP): "Convergence" — teleports, rapid void beams, shockwaves on landing
 * Phase 3 (<30% HP): "Singularity" — all attacks faster + gravity well pulling player to center + screen distortion
 */
export class NexusCore {
  scene: Phaser.Scene;
  sprite: Phaser.Physics.Arcade.Sprite;
  body: Phaser.Physics.Arcade.Body;

  name = 'NEXUS CORE';
  powerId = 'voidPulse';
  powerName = 'VOID PULSE';
  hp: number;
  maxHp: number;
  damage = 18;
  state: BossState = 'idle';
  phase: BossPhase = 1;
  isActive = false;

  private attackTimer = 0;
  private currentAttack: BossAttack | null = null;
  private actionCooldown = 2000;
  private hitstopUntil = 0;
  facingRight = false;

  // Visual
  private hpBarBg: Phaser.GameObjects.Graphics;
  private hpBar: Phaser.GameObjects.Graphics;
  private nameText: Phaser.GameObjects.Text;
  private phaseText: Phaser.GameObjects.Text;

  // Hazards
  private hazards: Phaser.GameObjects.GameObject[] = [];

  // Homing void bolts (Phase 1+)
  private voidBolts: Phaser.Physics.Arcade.Sprite[] = [];

  // Rage mode — triggers at 30% HP (same as phase 3 entry)
  private enraged = false;

  // Poison debuff — slows boss attack rate
  private poisonTimer = 0;
  private poisonSlowMult = 1;

  // Gravity well (Phase 3)
  private gravityWellActive = false;

  // Teleport cooldown (Phase 2+)
  private teleportTimer = 0;

  // Arena bounds
  private arenaLeft: number;
  private arenaRight: number;
  private arenaFloor: number;
  private arenaCenterX: number;

  /** This boss is weak to plasma_surge (Overclock's power) */
  readonly weakTo = 'plasma_surge';

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.maxHp = 600;
    this.hp = this.maxHp;

    this.arenaLeft = x - 120;
    this.arenaRight = x + 120;
    this.arenaFloor = y;
    this.arenaCenterX = x;

    // Sprite — larger than other bosses (24x24 display)
    this.sprite = scene.physics.add.sprite(x, y, 'boss-nexuscore');
    this.sprite.setOrigin(0.5, 1);
    this.sprite.setDisplaySize(24, 24);
    this.sprite.setTint(0xff44ff);
    this.body = this.sprite.body as Phaser.Physics.Arcade.Body;
    this.body.setSize(20, 22);
    this.body.setImmovable(true);
    this.body.setAllowGravity(false);
    (this.sprite as any).owner = this;
    (this.sprite as any).isBoss = true;

    // HP bar
    this.hpBarBg = scene.add.graphics().setScrollFactor(0).setDepth(200);
    this.hpBar = scene.add.graphics().setScrollFactor(0).setDepth(201);
    this.nameText = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 28, '', {
      fontSize: '14px', fontFamily: 'Arial, Helvetica, sans-serif', color: '#ff44ff',
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

  activate() {
    if (this.isActive) return;
    this.isActive = true;
    this.sprite.setVisible(true);
    this.hpBarBg.setVisible(true);
    this.hpBar.setVisible(true);
    this.nameText.setText(this.name);

    playSound('bossRoar');
    safeShake(this.scene.cameras.main, 400, 0.02);
    this.scene.cameras.main.flash(300, 100, 0, 150);

    // Boss intro card
    this.scene.physics.pause();
    const nameCard = this.scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20, 'NEXUS CORE', {
      fontSize: '28px', fontFamily: 'Arial, Helvetica, sans-serif', color: '#ff44ff',
      fontStyle: 'bold', stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(300).setAlpha(0);

    const subtitle = this.scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 15, 'Source of All Corruption', {
      fontSize: '14px', fontFamily: 'Consolas, "Courier New", monospace', color: '#888899',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(300).setAlpha(0);

    this.scene.tweens.add({ targets: [nameCard, subtitle], alpha: 1, duration: 400 });
    this.scene.time.delayedCall(1500, () => {
      this.scene.tweens.add({ targets: [nameCard, subtitle], alpha: 0, duration: 400, onComplete: () => { nameCard.destroy(); subtitle.destroy(); }});
      this.scene.physics.resume();
    });
  }

  update(time: number, delta: number) {
    if (!this.isActive || this.state === 'dead') return;
    if (time < this.hitstopUntil) return;

    // Poison tick-down
    if (this.poisonTimer > 0) {
      this.poisonTimer -= delta;
      if (this.poisonTimer <= 0) {
        this.poisonSlowMult = 1;
        if (this.enraged) this.sprite.setTint(0xff4444);
        else this.sprite.setTint(0xff44ff);
      }
    }

    const gameScene = this.scene as any;
    const player = gameScene.player;
    if (!player) return;

    this.facingRight = player.sprite.x > this.sprite.x;
    this.sprite.setFlipX(this.facingRight);

    // Phase transitions — 3-phase boss with different thresholds than other bosses
    const hpPercent = this.hp / this.maxHp;
    if (hpPercent <= 0.30 && this.phase < 3) {
      this.phase = 3;
      this.onPhaseChange();
    } else if (hpPercent <= 0.60 && this.phase < 2) {
      this.phase = 2;
      this.onPhaseChange();
    }

    // Rage mode at 30% HP (coincides with phase 3)
    if (!this.enraged && this.hp <= this.maxHp * 0.3) {
      this.enraged = true;
      this.gravityWellActive = true;
      this.sprite.setTint(0xff4444);
      playSound('bossRoar');
      safeShake(this.scene.cameras.main, 400, 0.025);

      const enrageText = this.scene.add.text(this.sprite.x, this.sprite.y - 50, 'ENRAGED!', {
        fontSize: '16px', fontFamily: 'Arial, Helvetica, sans-serif', color: '#ff4444',
        fontStyle: 'bold', stroke: '#000000', strokeThickness: 3,
      }).setOrigin(0.5).setDepth(100);
      this.scene.tweens.add({
        targets: enrageText, y: enrageText.y - 24, alpha: 0, duration: 1200,
        onComplete: () => enrageText.destroy(),
      });
    }

    // Gravity well — pulls player toward arena center in phase 3
    if (this.gravityWellActive && player.sprite?.active) {
      const dx = this.arenaCenterX - player.sprite.x;
      const dist = Math.abs(dx);
      if (dist > 15) {
        const pullForce = 35;
        player.body.velocity.x += (dx / dist) * pullForce * (delta / 16);
      }
    }

    // Teleport logic (Phase 2+)
    if (this.phase >= 2 && this.state === 'idle') {
      this.teleportTimer -= delta;
      if (this.teleportTimer <= 0) {
        this.performTeleport();
        this.teleportTimer = this.enraged ? 2500 : 3500;
      }
    }

    // Screen distortion in phase 3 — subtle camera wobble
    if (this.phase >= 3) {
      const wobble = Math.sin(time * 0.008) * 0.003;
      this.scene.cameras.main.setRotation(wobble);
    }

    switch (this.state) {
      case 'idle':
        this.actionCooldown -= delta * this.poisonSlowMult;
        if (this.actionCooldown <= 0) this.chooseAttack();
        // Ethereal float
        this.sprite.y = this.arenaFloor + Math.sin(time * 0.002) * 5;
        // Slow drift in phase 1
        if (this.phase === 1) {
          const driftDir = player.sprite.x > this.sprite.x ? 1 : -1;
          this.sprite.x += driftDir * 0.15 * (delta / 16);
          this.sprite.x = Phaser.Math.Clamp(this.sprite.x, this.arenaLeft, this.arenaRight);
        }
        break;

      case 'telegraph':
        this.attackTimer -= delta;
        this.sprite.setTint(time % 200 > 100 ? 0xffffff : 0xff44ff);
        if (this.attackTimer <= 0) {
          if (this.enraged) this.sprite.setTint(0xff4444);
          else this.sprite.setTint(0xff44ff);
          this.state = 'attack';
          this.currentAttack?.execute();
          this.attackTimer = this.currentAttack?.duration ?? 500;
        }
        break;

      case 'attack':
        this.attackTimer -= delta;
        if (this.attackTimer <= 0) {
          this.state = 'idle';
          const baseCooldown = this.currentAttack?.cooldown ?? 2000;
          this.actionCooldown = this.enraged ? baseCooldown * 0.6 : baseCooldown;
          this.currentAttack = null;
        }
        break;

      case 'hurt':
        this.attackTimer -= delta;
        if (this.attackTimer <= 0) this.state = 'idle';
        break;

      case 'transition':
        this.attackTimer -= delta;
        this.sprite.setTint(0xffcc44);
        if (this.attackTimer <= 0) {
          if (this.enraged) this.sprite.setTint(0xff4444);
          else this.sprite.setTint(0xff44ff);
          this.state = 'idle';
          this.actionCooldown = 500;
        }
        break;
    }

    // Update homing void bolts
    this.updateVoidBolts(player);
    this.drawHpBar();
    this.checkHazardHits(player, time);
  }

  /** Apply poison debuff — slows boss attack rate */
  applyPoison(duration: number, slowAmount: number) {
    this.poisonTimer = duration;
    this.poisonSlowMult = slowAmount;
    this.sprite.setTint(0x88ff88);
  }

  takeDamage(amount: number, _sourceX: number, time: number, powerId?: string) {
    if (this.state === 'dead' || this.state === 'transition') return;

    let finalDmg = amount;
    let isWeak = false;
    if (powerId && powerId === this.weakTo) {
      finalDmg = Math.round(amount * 1.5);
      isWeak = true;
    }

    this.hp = Math.max(0, this.hp - finalDmg);
    this.hitstopUntil = time + HITSTOP_DURATION_MS;

    this.sprite.setTint(isWeak ? 0xffff00 : 0xffffff);
    this.scene.time.delayedCall(100, () => {
      if (this.state !== 'dead') {
        if (this.enraged) this.sprite.setTint(0xff4444);
        else this.sprite.setTint(0xff44ff);
      }
    });

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

    if (this.hp <= 0) this.die();
  }

  private die() {
    this.state = 'dead';
    this.gravityWellActive = false;
    this.cleanupHazards();
    this.cleanupVoidBolts();
    playSound('bossDeath');

    // Reset camera rotation from phase 3 distortion
    this.scene.cameras.main.setRotation(0);

    safeShake(this.scene.cameras.main, 600, 0.04);

    // Explosion sequence — purple/magenta/white themed (biggest of all bosses)
    for (let i = 0; i < 7; i++) {
      this.scene.time.delayedCall(i * 180, () => {
        const ox = (Math.random() - 0.5) * 40;
        const oy = (Math.random() - 0.5) * 40;
        const emitter = this.scene.add.particles(
          this.sprite.x + ox, this.sprite.y - 12 + oy, 'particle', {
            speed: { min: 50, max: 150 },
            angle: { min: 0, max: 360 },
            scale: { start: 2, end: 0 },
            lifespan: 500,
            tint: [0xff44ff, 0x8800ff, 0xffffff, 0xff88ff],
            quantity: 20,
            emitting: false,
          }
        );
        emitter.explode(20);
        this.scene.time.delayedCall(600, () => emitter.destroy());
      });
    }

    this.scene.time.delayedCall(1500, () => {
      const gameScene = this.scene as any;
      if (gameScene.player) {
        gameScene.player.gainXP(400); // Highest XP reward
      }

      const text = this.scene.add.text(this.sprite.x, this.sprite.y - 50,
        `POWER ABSORBED: ${this.powerName}`, {
          fontSize: '14px', fontFamily: 'Arial, Helvetica, sans-serif', color: '#ff44ff',
          fontStyle: 'bold', stroke: '#000000', strokeThickness: 2,
        }).setOrigin(0.5).setDepth(100);
      this.scene.tweens.add({
        targets: text, y: text.y - 30, alpha: 0, duration: 3000,
        onComplete: () => text.destroy(),
      });

      if (gameScene.absorbBossPower) {
        gameScene.absorbBossPower(this.powerId, 'nexus_core');
      }

      if (gameScene.spawnLootDrop) {
        for (let i = 0; i < 5; i++) { // More loot than other bosses
          gameScene.spawnLootDrop(this.sprite.x + (i - 2) * 15, this.sprite.y);
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
    this.attackTimer = 1200; // Slightly longer transition for drama
    this.cleanupHazards();
    this.phaseText.setText(`PHASE ${this.phase}`);
    safeShake(this.scene.cameras.main, 300, 0.025);
    this.scene.cameras.main.flash(200, 150, 0, 200);

    // Reset teleport timer on phase change
    this.teleportTimer = 1000;
  }

  private chooseAttack() {
    const attacks = this.getAttacksForPhase();
    const attack = attacks[Math.floor(Math.random() * attacks.length)];
    this.currentAttack = attack;
    this.state = 'telegraph';
    this.attackTimer = attack.telegraph;
  }

  private getAttacksForPhase(): BossAttack[] {
    const speedMult = this.enraged ? 0.7 : 1;
    const base: BossAttack[] = [
      {
        name: 'Void Bolt',
        telegraph: 500 * speedMult,
        duration: 400,
        cooldown: 2000,
        execute: () => this.attackVoidBolt(),
      },
      {
        name: 'Corruption Zone',
        telegraph: 600 * speedMult,
        duration: 500,
        cooldown: 2200,
        execute: () => this.attackCorruptionZone(),
      },
    ];

    if (this.phase >= 2) {
      base.push({
        name: 'Void Beam',
        telegraph: 400 * speedMult,
        duration: 300,
        cooldown: 1400,
        execute: () => this.attackVoidBeam(),
      });
      base.push({
        name: 'Shockwave',
        telegraph: 500 * speedMult,
        duration: 400,
        cooldown: 1600,
        execute: () => this.attackShockwave(),
      });
    }

    if (this.phase >= 3) {
      base.push({
        name: 'Void Storm',
        telegraph: 400 * speedMult,
        duration: 800,
        cooldown: 1000,
        execute: () => this.attackVoidStorm(),
      });
    }

    return base;
  }

  /** Void Bolt — slow homing projectiles that track the player */
  private attackVoidBolt() {
    const count = this.phase >= 3 ? 5 : (this.phase >= 2 ? 4 : 3);
    const gs = this.scene as any;

    for (let i = 0; i < count; i++) {
      this.scene.time.delayedCall(i * 150, () => {
        const ox = (Math.random() - 0.5) * 30;
        const bolt = this.scene.physics.add.sprite(
          this.sprite.x + ox, this.sprite.y - 20, 'projectile-enemy'
        );
        bolt.setDisplaySize(8, 8);
        bolt.setTint(0xcc44ff);
        const bb = bolt.body as Phaser.Physics.Arcade.Body;
        bb.setAllowGravity(false);
        (bolt as any).damage = 12;
        (bolt as any).isEnemyProjectile = true;
        this.voidBolts.push(bolt);
        this.hazards.push(bolt);
        gs.combat?.addEnemyProjectile(bolt);

        // Auto-destroy after 4 seconds
        this.scene.time.delayedCall(4000, () => {
          if (bolt.active) bolt.destroy();
          this.voidBolts = this.voidBolts.filter(b => b !== bolt);
        });
      });
    }
  }

  /** Corruption Zone — spawns damaging zones on the ground at/near player position */
  private attackCorruptionZone() {
    const gs = this.scene as any;
    const playerX = gs.player?.sprite.x ?? this.sprite.x;
    const count = this.phase >= 3 ? 4 : (this.phase >= 2 ? 3 : 2);

    for (let i = 0; i < count; i++) {
      const cx = playerX + (i - (count - 1) / 2) * 35;

      // Warning indicator
      const warning = this.scene.add.graphics();
      warning.lineStyle(2, 0xff44ff, 0.4);
      warning.strokeRect(cx - 14, this.arenaFloor - 16, 28, 16);
      warning.setDepth(5);

      this.scene.time.delayedCall(400, () => {
        warning.destroy();

        const zone = this.scene.physics.add.sprite(cx, this.arenaFloor - 8, 'projectile-enemy');
        const zoneScale = this.enraged ? 1.4 : 1;
        zone.setDisplaySize(28 * zoneScale, 16 * zoneScale);
        zone.setTint(0x8800cc);
        zone.setAlpha(0.6);
        const zb = zone.body as Phaser.Physics.Arcade.Body;
        zb.setAllowGravity(false);
        (zone as any).damage = 10;
        (zone as any).isEnemyProjectile = true;
        this.hazards.push(zone);
        gs.combat?.addEnemyProjectile(zone);

        // Pulse and then fade
        this.scene.tweens.add({
          targets: zone, alpha: 0.2, duration: 500, yoyo: true, repeat: 3,
          onComplete: () => { if (zone.active) zone.destroy(); },
        });
      });
    }
  }

  /** Void Beam — fast straight-line projectiles fired rapidly (Phase 2+) */
  private attackVoidBeam() {
    const gs = this.scene as any;
    const playerX = gs.player?.sprite.x ?? this.sprite.x;
    const playerY = gs.player?.sprite.y ?? this.arenaFloor;
    const baseAngle = Phaser.Math.Angle.Between(this.sprite.x, this.sprite.y - 12, playerX, playerY);
    const count = this.enraged ? 6 : 4;

    for (let i = 0; i < count; i++) {
      this.scene.time.delayedCall(i * 80, () => {
        const spread = (Math.random() - 0.5) * 0.2;
        const angle = baseAngle + spread;
        const beam = this.scene.physics.add.sprite(this.sprite.x, this.sprite.y - 12, 'projectile-enemy');
        beam.setDisplaySize(12, 4);
        beam.setTint(0xff44ff);
        beam.setRotation(angle);
        const bb = beam.body as Phaser.Physics.Arcade.Body;
        bb.setAllowGravity(false);
        const speed = 160;
        bb.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
        (beam as any).damage = 14;
        (beam as any).isEnemyProjectile = true;
        this.hazards.push(beam);
        gs.combat?.addEnemyProjectile(beam);

        this.scene.time.delayedCall(1500, () => { if (beam.active) beam.destroy(); });
      });
    }
  }

  /** Shockwave — expanding ring from landing position after teleport (Phase 2+) */
  private attackShockwave() {
    safeShake(this.scene.cameras.main, 150, 0.012);
    const gs = this.scene as any;
    const pulseRadius = 90;

    const ring = this.scene.add.graphics().setDepth(40);
    this.hazards.push(ring as any);
    let currentRadius = 0;
    const expandSpeed = this.enraged ? 0.2 : 0.14;
    let pulseDamageDealt = false;

    const pulseUpdate = this.scene.time.addEvent({
      delay: 16,
      repeat: 60,
      callback: () => {
        if (this.state === 'dead') { ring.destroy(); pulseUpdate.destroy(); return; }
        currentRadius += expandSpeed * 16;
        ring.clear();
        ring.lineStyle(3, 0xff44ff, Math.max(0, 1 - currentRadius / pulseRadius));
        ring.strokeCircle(this.sprite.x, this.sprite.y - 12, currentRadius);

        if (!pulseDamageDealt && gs.player) {
          const dist = Phaser.Math.Distance.Between(
            gs.player.sprite.x, gs.player.sprite.y,
            this.sprite.x, this.sprite.y - 12
          );
          if (dist < currentRadius + 8 && dist > currentRadius - 12) {
            gs.player.takeDamage(15, this.sprite.x, this.scene.time.now);
            pulseDamageDealt = true;
          }
        }
      },
    });

    this.scene.time.delayedCall(1100, () => {
      ring.destroy();
      pulseUpdate.destroy();
    });
  }

  /** Void Storm — rain of void projectiles from above (Phase 3 desperation) */
  private attackVoidStorm() {
    safeShake(this.scene.cameras.main, 300, 0.015);
    const gs = this.scene as any;
    const stormDelay = this.enraged ? 40 : 70;

    for (let i = 0; i < 12; i++) {
      this.scene.time.delayedCall(i * stormDelay, () => {
        const x = this.arenaLeft + Math.random() * (this.arenaRight - this.arenaLeft);
        const spark = this.scene.physics.add.sprite(x, this.arenaFloor - 110, 'projectile-enemy');
        spark.setDisplaySize(7, 7);
        spark.setTint(0xcc44ff);
        const sb = spark.body as Phaser.Physics.Arcade.Body;
        sb.setAllowGravity(false);
        sb.setVelocityY(120 + Math.random() * 60);
        sb.setVelocityX((Math.random() - 0.5) * 40);
        (spark as any).damage = 10;
        (spark as any).isEnemyProjectile = true;
        this.hazards.push(spark);
        gs.combat?.addEnemyProjectile(spark);

        this.scene.time.delayedCall(2000, () => { if (spark.active) spark.destroy(); });
      });
    }
  }

  /** Teleport to a random position in the arena (Phase 2+) */
  private performTeleport() {
    if (this.state !== 'idle') return;

    // Vanish particles
    const vanishEmitter = this.scene.add.particles(
      this.sprite.x, this.sprite.y - 12, 'particle', {
        speed: { min: 30, max: 80 }, angle: { min: 0, max: 360 },
        scale: { start: 1, end: 0 }, lifespan: 300,
        tint: [0xff44ff, 0x8800ff], quantity: 10, emitting: false,
      });
    vanishEmitter.explode(10);
    this.scene.time.delayedCall(400, () => vanishEmitter.destroy());

    // New position
    const newX = this.arenaLeft + Math.random() * (this.arenaRight - this.arenaLeft);
    this.sprite.x = newX;

    // Arrival particles
    this.scene.time.delayedCall(100, () => {
      const arriveEmitter = this.scene.add.particles(
        this.sprite.x, this.sprite.y - 12, 'particle', {
          speed: { min: 20, max: 60 }, angle: { min: 0, max: 360 },
          scale: { start: 0.8, end: 0 }, lifespan: 250,
          tint: [0xff44ff, 0xffffff], quantity: 8, emitting: false,
        });
      arriveEmitter.explode(8);
      this.scene.time.delayedCall(350, () => arriveEmitter.destroy());
    });
  }

  /** Update homing void bolts — gently track toward player */
  private updateVoidBolts(player: any) {
    const homingSpeed = this.enraged ? 45 : 35;
    const maxSpeed = this.enraged ? 55 : 45;

    for (const bolt of this.voidBolts) {
      if (!bolt.active) continue;
      const dx = player.sprite.x - bolt.x;
      const dy = (player.sprite.y - 12) - bolt.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 5) {
        bolt.body!.velocity.x += (dx / dist) * homingSpeed * 0.04;
        bolt.body!.velocity.y += (dy / dist) * homingSpeed * 0.04;
        // Cap speed
        const v = bolt.body!.velocity;
        const spd = Math.sqrt(v.x * v.x + v.y * v.y);
        if (spd > maxSpeed) {
          v.x = (v.x / spd) * maxSpeed;
          v.y = (v.y / spd) * maxSpeed;
        }
      }
    }
  }

  private checkHazardHits(player: any, time: number) {
    // Contact damage from boss body
    if (this.state === 'attack' || this.state === 'idle') {
      const dist = Phaser.Math.Distance.Between(
        player.sprite.x, player.sprite.y,
        this.sprite.x, this.sprite.y - 12
      );
      if (dist < 20) {
        player.takeDamage(this.damage, this.sprite.x, time);
      }
    }
  }

  private cleanupHazards() {
    for (const h of this.hazards) {
      if ((h as any).active) (h as any).destroy();
    }
    this.hazards = [];
  }

  private cleanupVoidBolts() {
    for (const b of this.voidBolts) {
      if (b.active) b.destroy();
    }
    this.voidBolts = [];
  }

  private drawHpBar() {
    const barW = 300, barH = 8;
    const x = GAME_WIDTH / 2 - barW / 2, y = GAME_HEIGHT - 46;
    const ratio = Math.max(0, this.hp / this.maxHp);

    this.hpBarBg.clear();
    this.hpBarBg.fillStyle(0x110022, 0.8);
    this.hpBarBg.fillRect(x, y, barW, barH);
    this.hpBarBg.lineStyle(1, 0x444444);
    this.hpBarBg.strokeRect(x, y, barW, barH);

    this.hpBar.clear();
    // Purple -> magenta -> red across phases
    const colors = [0xcc44ff, 0xff44ff, 0xff4444];
    this.hpBar.fillStyle(colors[this.phase - 1], 1);
    this.hpBar.fillRect(x, y, barW * ratio, barH);

    // Phase markers at 60% and 30% (not 66%/33% like other bosses)
    this.hpBarBg.lineStyle(1, 0xffffff, 0.3);
    this.hpBarBg.lineBetween(x + barW * 0.30, y, x + barW * 0.30, y + barH);
    this.hpBarBg.lineBetween(x + barW * 0.60, y, x + barW * 0.60, y + barH);
  }
}
