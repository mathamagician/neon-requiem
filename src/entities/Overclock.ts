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
 * OVERCLOCK — Boss of the Neon Citadel
 * A rogue AI combat mech that has overclocked itself beyond safety limits.
 *
 * Phase 1: Laser Sweep, Missile Barrage
 * Phase 2: Adds EMP Pulse, Laser Sweep fires faster
 * Phase 3: Adds Overclock Mode (charge attacks), all attacks deal +20% damage
 */
export class Overclock {
  scene: Phaser.Scene;
  sprite: Phaser.Physics.Arcade.Sprite;
  body: Phaser.Physics.Arcade.Body;

  name = 'OVERCLOCK';
  powerId = 'plasma_surge';
  powerName = 'PLASMA SURGE';
  hp: number;
  maxHp: number;
  damage = 15;
  state: BossState = 'idle';
  phase: BossPhase = 1;
  isActive = false;

  private attackTimer = 0;
  private currentAttack: BossAttack | null = null;
  private actionCooldown = 1500;
  private hitstopUntil = 0;
  facingRight = false;

  // Visual
  private hpBarBg: Phaser.GameObjects.Graphics;
  private hpBar: Phaser.GameObjects.Graphics;
  private nameText: Phaser.GameObjects.Text;
  private phaseText: Phaser.GameObjects.Text;

  // Hazards
  private hazards: Phaser.GameObjects.GameObject[] = [];

  // Rage mode — triggers at 30% HP
  private enraged = false;

  // Poison debuff
  private poisonTimer = 0;
  private poisonSlowMult = 1;

  // Overclock Mode (Phase 3 charge attack)
  private overclockChargesLeft = 0;
  private overclockSpeedTimer = 0;

  // Arena bounds
  private arenaLeft: number;
  private arenaRight: number;
  private arenaFloor: number;

  /** This boss is weak to thornlash (Lady Hemlock's power) */
  readonly weakTo = 'thornlash';

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.maxHp = 800;
    this.hp = this.maxHp;

    this.arenaLeft = x - 100;
    this.arenaRight = x + 100;
    this.arenaFloor = y;

    this.sprite = scene.physics.add.sprite(x, y, 'boss-overclock');
    this.sprite.setOrigin(0.5, 1);
    this.body = this.sprite.body as Phaser.Physics.Arcade.Body;
    this.body.setSize(24, 34);
    this.body.setImmovable(true);
    this.body.setAllowGravity(false);
    (this.sprite as any).owner = this;
    (this.sprite as any).isBoss = true;

    this.hpBarBg = scene.add.graphics().setScrollFactor(0).setDepth(200);
    this.hpBar = scene.add.graphics().setScrollFactor(0).setDepth(201);
    this.nameText = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 28, '', {
      fontSize: '14px', fontFamily: 'Arial, Helvetica, sans-serif', color: '#44ccff',
      fontStyle: 'bold', stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(202);
    this.phaseText = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 12, '', {
      fontSize: '12px', fontFamily: 'Arial, Helvetica, sans-serif', color: '#ffcc44',
      stroke: '#000000', strokeThickness: 1,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(202);

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
    safeShake(this.scene.cameras.main, 300, 0.015);
    this.scene.cameras.main.flash(200, 0, 80, 200);

    // Boss intro card
    this.scene.physics.pause();
    const nameCard = this.scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20, 'OVERCLOCK', {
      fontSize: '28px', fontFamily: 'Arial, Helvetica, sans-serif', color: '#44ccff',
      fontStyle: 'bold', stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(300).setAlpha(0);

    const subtitle = this.scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 15, 'Rogue AI Combat Mech', {
      fontSize: '14px', fontFamily: 'Consolas, "Courier New", monospace', color: '#888899',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(300).setAlpha(0);

    // Fade in
    this.scene.tweens.add({ targets: [nameCard, subtitle], alpha: 1, duration: 400 });
    // Hold then fade out and resume
    this.scene.time.delayedCall(1500, () => {
      this.scene.tweens.add({ targets: [nameCard, subtitle], alpha: 0, duration: 400, onComplete: () => { nameCard.destroy(); subtitle.destroy(); }});
      this.scene.physics.resume();
    });
  }

  update(time: number, delta: number) {
    if (!this.isActive || this.state === 'dead') return;
    if (time < this.hitstopUntil) return;

    // Overclock Mode speed timer
    if (this.overclockSpeedTimer > 0) {
      this.overclockSpeedTimer -= delta;
      if (this.overclockSpeedTimer <= 0) {
        if (this.enraged) this.sprite.setTint(0xff4444); else this.sprite.clearTint();
      }
    }

    const gameScene = this.scene as any;
    const player = gameScene.player;
    if (!player) return;

    this.facingRight = player.sprite.x > this.sprite.x;
    this.sprite.setFlipX(this.facingRight);

    // Phase transitions
    const hpPercent = this.hp / this.maxHp;
    if (hpPercent <= 0.33 && this.phase < 3) { this.phase = 3; this.onPhaseChange(); }
    else if (hpPercent <= 0.66 && this.phase < 2) { this.phase = 2; this.onPhaseChange(); }

    // Rage mode at 30% HP
    if (!this.enraged && this.hp <= this.maxHp * 0.3) {
      this.enraged = true;
      this.sprite.setTint(0xff4444);
      playSound('bossRoar');
      safeShake(this.scene.cameras.main, 300, 0.02);

      const enrageText = this.scene.add.text(this.sprite.x, this.sprite.y - 50, 'ENRAGED!', {
        fontSize: '16px', fontFamily: 'Arial, Helvetica, sans-serif', color: '#ff4444',
        fontStyle: 'bold', stroke: '#000000', strokeThickness: 3,
      }).setOrigin(0.5).setDepth(100);
      this.scene.tweens.add({
        targets: enrageText, y: enrageText.y - 24, alpha: 0, duration: 1200,
        onComplete: () => enrageText.destroy(),
      });
    }

    // Poison tick
    if (this.poisonTimer > 0) {
      this.poisonTimer -= delta;
      if (this.poisonTimer <= 0) {
        this.poisonSlowMult = 1;
        this.sprite.setTint(this.enraged ? 0xff4444 : 0x44ccff);
      }
    }

    switch (this.state) {
      case 'idle':
        this.actionCooldown -= delta * this.poisonSlowMult;
        if (this.actionCooldown <= 0) this.chooseAttack();
        // Mechanical hover bob
        this.sprite.y = this.arenaFloor + Math.sin(time * 0.003) * 2;
        break;
      case 'telegraph':
        this.attackTimer -= delta;
        this.sprite.setTint(time % 200 > 100 ? 0xffffff : 0x44ccff);
        if (this.attackTimer <= 0) {
          if (this.enraged) this.sprite.setTint(0xff4444); else this.sprite.clearTint();
          this.state = 'attack';
          this.currentAttack?.execute();
          this.attackTimer = this.currentAttack?.duration ?? 500;
        }
        break;
      case 'attack':
        this.attackTimer -= delta;
        if (this.attackTimer <= 0) {
          this.state = 'idle';
          const baseCooldown = this.currentAttack?.cooldown ?? 1500;
          this.actionCooldown = this.enraged ? baseCooldown * 0.7 : baseCooldown;
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
          if (this.enraged) this.sprite.setTint(0xff4444); else this.sprite.clearTint();
          this.state = 'idle';
          this.actionCooldown = 500;
        }
        break;
    }

    this.drawHpBar();
    this.checkHazardHits(player, time);
  }

  applyPoison(duration: number, slowAmount: number) {
    this.poisonTimer = duration;
    this.poisonSlowMult = slowAmount;
    this.sprite.setTint(0x88ff88);
  }

  takeDamage(amount: number, _sourceX: number, time: number, powerId?: string) {
    if (this.state === 'dead' || this.state === 'transition') return;

    let finalDmg = amount;
    let isWeak = false;
    if (powerId && powerId === this.weakTo) { finalDmg = Math.round(amount * 1.5); isWeak = true; }

    this.hp = Math.max(0, this.hp - finalDmg);
    this.hitstopUntil = time + HITSTOP_DURATION_MS;

    this.sprite.setTint(isWeak ? 0xffff00 : 0xffffff);
    this.scene.time.delayedCall(100, () => {
      if (this.state !== 'dead') {
        if (this.enraged) this.sprite.setTint(0xff4444); else this.sprite.clearTint();
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
    this.cleanupHazards();
    playSound('bossDeath');
    safeShake(this.scene.cameras.main, 500, 0.03);

    for (let i = 0; i < 5; i++) {
      this.scene.time.delayedCall(i * 200, () => {
        const ox = (Math.random() - 0.5) * 30;
        const oy = (Math.random() - 0.5) * 30;
        const emitter = this.scene.add.particles(
          this.sprite.x + ox, this.sprite.y - 20 + oy, 'particle', {
            speed: { min: 40, max: 120 }, angle: { min: 0, max: 360 },
            scale: { start: 1.5, end: 0 }, lifespan: 400,
            tint: [0x44ccff, 0x0088ff, 0xffffff], quantity: 15, emitting: false,
          });
        emitter.explode(15);
        this.scene.time.delayedCall(500, () => emitter.destroy());
      });
    }

    this.scene.time.delayedCall(1200, () => {
      const gameScene = this.scene as any;
      if (gameScene.player) gameScene.player.gainXP(250);

      const text = this.scene.add.text(this.sprite.x, this.sprite.y - 50,
        `POWER ABSORBED: ${this.powerName}`, {
          fontSize: '14px', fontFamily: 'Arial, Helvetica, sans-serif', color: '#44ccff',
          fontStyle: 'bold', stroke: '#000000', strokeThickness: 2,
        }).setOrigin(0.5).setDepth(100);
      this.scene.tweens.add({ targets: text, y: text.y - 30, alpha: 0, duration: 3000, onComplete: () => text.destroy() });

      if (gameScene.absorbBossPower) gameScene.absorbBossPower(this.powerId, 'overclock');
      if (gameScene.spawnLootDrop) {
        for (let i = 0; i < 3; i++) gameScene.spawnLootDrop(this.sprite.x + (i - 1) * 15, this.sprite.y);
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
    safeShake(this.scene.cameras.main, 200, 0.02);
    this.scene.cameras.main.flash(150, 0, 100, 255);
  }

  private chooseAttack() {
    const attacks = this.getAttacksForPhase();
    const attack = attacks[Math.floor(Math.random() * attacks.length)];
    this.currentAttack = attack;
    this.state = 'telegraph';
    this.attackTimer = attack.telegraph;
  }

  private getAttacksForPhase(): BossAttack[] {
    const laserTelegraph = this.phase >= 2 ? 600 : 800;
    const base: BossAttack[] = [
      { name: 'Laser Sweep', telegraph: laserTelegraph, duration: 500, cooldown: 1200, execute: () => this.attackLaserSweep() },
      { name: 'Missile Barrage', telegraph: 600, duration: 600, cooldown: 1400, execute: () => this.attackMissileBarrage() },
    ];
    if (this.phase >= 2) {
      const empCooldown = this.enraged ? 900 : 1800;
      base.push({ name: 'EMP Pulse', telegraph: 700, duration: 600, cooldown: empCooldown, execute: () => this.attackEMPPulse() });
    }
    if (this.phase >= 3) {
      base.push({ name: 'Overclock Mode', telegraph: 500, duration: 3000, cooldown: 2500, execute: () => this.attackOverclockMode() });
    }
    return base;
  }

  /** Phase 3 damage multiplier */
  private get phaseDamageMult(): number {
    return this.phase >= 3 ? 1.2 : 1.0;
  }

  /** Laser Sweep — horizontal beam across the arena */
  private attackLaserSweep() {
    const dir = this.facingRight ? 1 : -1;
    const projectileCount = 6;
    const gs = this.scene as any;

    for (let i = 0; i < projectileCount; i++) {
      this.scene.time.delayedCall(i * 50, () => {
        const laser = this.scene.physics.add.sprite(
          this.sprite.x + dir * (20 + i * 22), this.sprite.y - 16, 'projectile-enemy'
        );
        laser.setDisplaySize(18, 4);
        laser.setTint(0x44ccff);
        const lb = laser.body as Phaser.Physics.Arcade.Body;
        lb.setAllowGravity(false);
        lb.setVelocityX(dir * 100);
        (laser as any).damage = Math.round(this.damage * this.phaseDamageMult);
        (laser as any).isEnemyProjectile = true;
        this.hazards.push(laser);
        gs.combat?.addEnemyProjectile(laser);
        this.scene.time.delayedCall(1200, () => { if (laser.active) laser.destroy(); });
      });
    }
  }

  /** Missile Barrage — 4-6 projectiles aimed at player position with slight spread */
  private attackMissileBarrage() {
    const gs = this.scene as any;
    const playerX = gs.player?.sprite.x ?? this.sprite.x;
    const playerY = gs.player?.sprite.y ?? this.arenaFloor;
    const baseAngle = Phaser.Math.Angle.Between(this.sprite.x, this.sprite.y - 14, playerX, playerY);
    const count = 4 + Math.floor(Math.random() * 3); // 4-6 missiles

    for (let i = 0; i < count; i++) {
      const spread = (i - (count - 1) / 2) * 0.15;
      const angle = baseAngle + spread;
      const missile = this.scene.physics.add.sprite(this.sprite.x, this.sprite.y - 14, 'projectile-enemy');
      missile.setDisplaySize(8, 5);
      missile.setTint(0xff6644);
      missile.setRotation(angle);
      const mb = missile.body as Phaser.Physics.Arcade.Body;
      mb.setAllowGravity(false);
      const speed = 80 + Math.random() * 30;
      mb.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
      (missile as any).damage = Math.round(10 * this.phaseDamageMult);
      (missile as any).isEnemyProjectile = true;
      this.hazards.push(missile);
      gs.combat?.addEnemyProjectile(missile);
      this.scene.time.delayedCall(2000, () => { if (missile.active) missile.destroy(); });
    }
  }

  /** EMP Pulse — circular shockwave expanding outward from boss position */
  private attackEMPPulse() {
    safeShake(this.scene.cameras.main, 150, 0.01);
    const gs = this.scene as any;
    const pulseRadius = 80;

    // Visual ring expanding outward
    const ring = this.scene.add.graphics().setDepth(40);
    this.hazards.push(ring as any);
    let currentRadius = 0;
    const expandSpeed = this.enraged ? 0.18 : 0.12; // pixels per ms
    let pulseDamageDealt = false;

    const pulseUpdate = this.scene.time.addEvent({
      delay: 16,
      repeat: 60,
      callback: () => {
        if (this.state === 'dead') { ring.destroy(); pulseUpdate.destroy(); return; }
        currentRadius += expandSpeed * 16;
        ring.clear();
        ring.lineStyle(3, 0x44ccff, Math.max(0, 1 - currentRadius / pulseRadius));
        ring.strokeCircle(this.sprite.x, this.sprite.y - 16, currentRadius);

        // Check if player is within the shockwave band (hit once only)
        if (!pulseDamageDealt && gs.player) {
          const dist = Phaser.Math.Distance.Between(
            gs.player.sprite.x, gs.player.sprite.y,
            this.sprite.x, this.sprite.y - 16
          );
          if (dist < currentRadius + 8 && dist > currentRadius - 12) {
            gs.player.takeDamage(Math.round(12 * this.phaseDamageMult), this.sprite.x, this.scene.time.now);
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

  /** Overclock Mode — boss speeds up dramatically, charges at player twice */
  private attackOverclockMode() {
    this.overclockSpeedTimer = 3000;
    this.overclockChargesLeft = 2;
    this.sprite.setTint(0xff4444);

    // Cyan particle burst to signal overclock
    const emitter = this.scene.add.particles(
      this.sprite.x, this.sprite.y - 16, 'particle', {
        speed: { min: 30, max: 80 }, angle: { min: 0, max: 360 },
        scale: { start: 1, end: 0 }, lifespan: 300,
        tint: [0x44ccff, 0xff4444], quantity: 10, emitting: false,
      });
    emitter.explode(10);
    this.scene.time.delayedCall(400, () => emitter.destroy());

    // Two charges with a gap between
    this.performCharge(0);
    this.scene.time.delayedCall(1500, () => this.performCharge(1));
  }

  /** Single charge toward player position */
  private performCharge(index: number) {
    if (this.state === 'dead') return;
    const gs = this.scene as any;
    const playerX = gs.player?.sprite.x ?? this.sprite.x;
    const dir = playerX > this.sprite.x ? 1 : -1;
    const chargeSpeed = 200;

    // Brief telegraph flash
    this.sprite.setTint(0xff8844);

    this.scene.time.delayedCall(200, () => {
      if (this.state === 'dead') return;
      this.sprite.setTint(0xff4444);
      this.body.setVelocityX(dir * chargeSpeed);

      // Leave trail particles
      const trailEvent = this.scene.time.addEvent({
        delay: 60,
        repeat: 8,
        callback: () => {
          const trail = this.scene.add.particles(
            this.sprite.x, this.sprite.y - 16, 'particle', {
              speed: { min: 10, max: 30 }, angle: { min: 0, max: 360 },
              scale: { start: 0.6, end: 0 }, lifespan: 200,
              tint: [0x44ccff], quantity: 3, emitting: false,
            });
          trail.explode(3);
          this.scene.time.delayedCall(300, () => trail.destroy());
        },
      });

      // Stop after a short dash and clamp to arena
      this.scene.time.delayedCall(500, () => {
        this.body.setVelocityX(0);
        this.sprite.x = Phaser.Math.Clamp(this.sprite.x, this.arenaLeft, this.arenaRight);
        trailEvent.destroy();
      });
    });
  }

  private cleanupHazards() {
    for (const h of this.hazards) { if ((h as any).active) (h as any).destroy(); }
    this.hazards = [];
  }

  private checkHazardHits(player: any, time: number) {
    if (this.state === 'attack' || this.state === 'idle') {
      const dist = Phaser.Math.Distance.Between(player.sprite.x, player.sprite.y, this.sprite.x, this.sprite.y - 20);
      if (dist < 22) player.takeDamage(Math.round(this.damage * this.phaseDamageMult), this.sprite.x, time);
    }
  }

  private drawHpBar() {
    const barW = 300, barH = 8;
    const x = GAME_WIDTH / 2 - barW / 2, y = GAME_HEIGHT - 46;
    const ratio = Math.max(0, this.hp / this.maxHp);

    this.hpBarBg.clear();
    this.hpBarBg.fillStyle(0x001122, 0.8);
    this.hpBarBg.fillRect(x, y, barW, barH);
    this.hpBarBg.lineStyle(1, 0x444444);
    this.hpBarBg.strokeRect(x, y, barW, barH);

    this.hpBar.clear();
    const colors = [0x44ccff, 0xffcc44, 0xff4444];
    this.hpBar.fillStyle(colors[this.phase - 1], 1);
    this.hpBar.fillRect(x, y, barW * ratio, barH);

    this.hpBarBg.lineStyle(1, 0xffffff, 0.3);
    this.hpBarBg.lineBetween(x + barW * 0.33, y, x + barW * 0.33, y + barH);
    this.hpBarBg.lineBetween(x + barW * 0.66, y, x + barW * 0.66, y + barH);
  }
}
