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
 * LADY HEMLOCK — Boss of the Blighted Garden
 * A poison-vine sorceress who controls toxic plant life.
 *
 * Phase 1: Vine whip, thorn spray
 * Phase 2: Adds poison cloud, spawns seedlings
 * Phase 3: Floor becomes toxic, vine cage attack
 */
export class LadyHemlock {
  scene: Phaser.Scene;
  sprite: Phaser.Physics.Arcade.Sprite;
  body: Phaser.Physics.Arcade.Body;

  name = 'LADY HEMLOCK';
  powerId = 'thornlash';
  powerName = 'THORNLASH';
  hp: number;
  maxHp: number;
  damage = 12;
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

  // Poison debuff
  private poisonTimer = 0;
  private poisonSlowMult = 1;

  // Arena bounds
  private arenaLeft: number;
  private arenaRight: number;
  private arenaFloor: number;

  /** This boss is weak to chain_lightning (Voltrexx's power) */
  readonly weakTo = 'chain_lightning';

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.maxHp = 650;
    this.hp = this.maxHp;

    this.arenaLeft = x - 100;
    this.arenaRight = x + 100;
    this.arenaFloor = y;

    this.sprite = scene.physics.add.sprite(x, y, 'boss-hemlock');
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
      fontSize: '14px', fontFamily: 'Arial, Helvetica, sans-serif', color: '#44cc44',
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
    this.scene.cameras.main.flash(200, 30, 100, 0);
  }

  update(time: number, delta: number) {
    if (!this.isActive || this.state === 'dead') return;
    if (time < this.hitstopUntil) return;

    // Poison tick-down
    if (this.poisonTimer > 0) {
      this.poisonTimer -= delta;
      if (this.poisonTimer <= 0) { this.poisonSlowMult = 1; this.sprite.clearTint(); }
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

    switch (this.state) {
      case 'idle':
        this.actionCooldown -= delta * this.poisonSlowMult;
        if (this.actionCooldown <= 0) this.chooseAttack();
        // Gentle sway
        this.sprite.y = this.arenaFloor + Math.sin(time * 0.002) * 2;
        break;
      case 'telegraph':
        this.attackTimer -= delta;
        this.sprite.setTint(time % 200 > 100 ? 0xffffff : 0x44cc44);
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
        this.attackTimer -= delta;
        this.sprite.setTint(0xffcc44);
        if (this.attackTimer <= 0) { this.sprite.clearTint(); this.state = 'idle'; this.actionCooldown = 500; }
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
      if (this.state !== 'dead') this.sprite.clearTint();
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
            tint: [0x44cc44, 0x88ff44, 0xffcc00], quantity: 15, emitting: false,
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
          fontSize: '14px', fontFamily: 'Arial, Helvetica, sans-serif', color: '#44cc44',
          fontStyle: 'bold', stroke: '#000000', strokeThickness: 2,
        }).setOrigin(0.5).setDepth(100);
      this.scene.tweens.add({ targets: text, y: text.y - 30, alpha: 0, duration: 3000, onComplete: () => text.destroy() });

      if (gameScene.absorbBossPower) gameScene.absorbBossPower(this.powerId, 'hemlock');
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
    this.scene.cameras.main.flash(150, 50, 200, 0);
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
      { name: 'Vine Whip', telegraph: 500, duration: 400, cooldown: 1000, execute: () => this.attackVineWhip() },
      { name: 'Thorn Spray', telegraph: 600, duration: 500, cooldown: 1200, execute: () => this.attackThornSpray() },
    ];
    if (this.phase >= 2) {
      base.push({ name: 'Poison Cloud', telegraph: 700, duration: 600, cooldown: 1800, execute: () => this.attackPoisonCloud() });
    }
    if (this.phase >= 3) {
      base.push({ name: 'Vine Cage', telegraph: 800, duration: 800, cooldown: 2200, execute: () => this.attackVineCage() });
    }
    return base;
  }

  /** Vine whip — long horizontal vine lash toward player */
  private attackVineWhip() {
    const dir = this.facingRight ? 1 : -1;
    // Create a long vine projectile
    for (let i = 0; i < 4; i++) {
      this.scene.time.delayedCall(i * 60, () => {
        const vine = this.scene.physics.add.sprite(
          this.sprite.x + dir * (20 + i * 18), this.sprite.y - 14, 'projectile-enemy'
        );
        vine.setDisplaySize(16, 6);
        vine.setTint(0x44aa44);
        const vb = vine.body as Phaser.Physics.Arcade.Body;
        vb.setAllowGravity(false);
        vb.setVelocityX(dir * 60);
        (vine as any).damage = this.damage;
        (vine as any).isEnemyProjectile = true;
        this.hazards.push(vine);
        const gs = this.scene as any;
        gs.combat?.addEnemyProjectile(vine);
        this.scene.time.delayedCall(1200, () => { if (vine.active) vine.destroy(); });
      });
    }
  }

  /** Thorn spray — shotgun of thorn projectiles */
  private attackThornSpray() {
    const count = this.phase >= 3 ? 7 : 5;
    const gs = this.scene as any;
    const playerX = gs.player?.sprite.x ?? this.sprite.x;
    const baseAngle = Phaser.Math.Angle.Between(this.sprite.x, this.sprite.y - 14, playerX, gs.player?.sprite.y ?? this.arenaFloor);

    for (let i = 0; i < count; i++) {
      const spread = (i - (count - 1) / 2) * 0.18;
      const angle = baseAngle + spread;
      const thorn = this.scene.physics.add.sprite(this.sprite.x, this.sprite.y - 14, 'projectile-enemy');
      thorn.setDisplaySize(6, 4);
      thorn.setTint(0x88cc44);
      thorn.setRotation(angle);
      const tb = thorn.body as Phaser.Physics.Arcade.Body;
      tb.setAllowGravity(false);
      const speed = 90 + Math.random() * 30;
      tb.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
      (thorn as any).damage = 8;
      (thorn as any).isEnemyProjectile = true;
      this.hazards.push(thorn);
      gs.combat?.addEnemyProjectile(thorn);
      this.scene.time.delayedCall(2000, () => { if (thorn.active) thorn.destroy(); });
    }
  }

  /** Poison cloud — lingers on the ground, damages on contact */
  private attackPoisonCloud() {
    const gs = this.scene as any;
    const playerX = gs.player?.sprite.x ?? this.sprite.x;
    const count = this.phase >= 3 ? 3 : 2;

    for (let i = 0; i < count; i++) {
      const cx = playerX + (i - (count - 1) / 2) * 40;
      const cloud = this.scene.physics.add.sprite(cx, this.arenaFloor - 12, 'projectile-enemy');
      cloud.setDisplaySize(24, 16);
      cloud.setTint(0x66ff66);
      cloud.setAlpha(0.5);
      const cb = cloud.body as Phaser.Physics.Arcade.Body;
      cb.setAllowGravity(false);
      (cloud as any).damage = 6;
      (cloud as any).isEnemyProjectile = true;
      this.hazards.push(cloud);
      gs.combat?.addEnemyProjectile(cloud);

      // Pulse alpha
      this.scene.tweens.add({
        targets: cloud, alpha: 0.2, duration: 400, yoyo: true, repeat: 4,
        onComplete: () => { if (cloud.active) cloud.destroy(); },
      });
    }
  }

  /** Vine cage — vines erupt from floor around player */
  private attackVineCage() {
    safeShake(this.scene.cameras.main, 200, 0.012);
    const gs = this.scene as any;
    const playerX = gs.player?.sprite.x ?? this.sprite.x;

    // Erupting vines in a semicircle around the player
    for (let i = 0; i < 6; i++) {
      this.scene.time.delayedCall(i * 120, () => {
        const offset = (i - 2.5) * 20;
        const vine = this.scene.physics.add.sprite(playerX + offset, this.arenaFloor, 'projectile-enemy');
        vine.setDisplaySize(8, 20);
        vine.setTint(0x338833);
        const vb = vine.body as Phaser.Physics.Arcade.Body;
        vb.setAllowGravity(false);
        vb.setVelocityY(-120);
        (vine as any).damage = 10;
        (vine as any).isEnemyProjectile = true;
        this.hazards.push(vine);
        gs.combat?.addEnemyProjectile(vine);
        this.scene.time.delayedCall(1000, () => { if (vine.active) vine.destroy(); });
      });
    }
  }

  private cleanupHazards() {
    for (const h of this.hazards) { if ((h as any).active) (h as any).destroy(); }
    this.hazards = [];
  }

  private checkHazardHits(player: any, time: number) {
    if (this.state === 'attack' || this.state === 'idle') {
      const dist = Phaser.Math.Distance.Between(player.sprite.x, player.sprite.y, this.sprite.x, this.sprite.y - 20);
      if (dist < 22) player.takeDamage(this.damage, this.sprite.x, time);
    }
  }

  private drawHpBar() {
    const barW = 300, barH = 8;
    const x = GAME_WIDTH / 2 - barW / 2, y = GAME_HEIGHT - 46;
    const ratio = Math.max(0, this.hp / this.maxHp);

    this.hpBarBg.clear();
    this.hpBarBg.fillStyle(0x002200, 0.8);
    this.hpBarBg.fillRect(x, y, barW, barH);
    this.hpBarBg.lineStyle(1, 0x444444);
    this.hpBarBg.strokeRect(x, y, barW, barH);

    this.hpBar.clear();
    const colors = [0x44ff44, 0xffcc44, 0xff4444];
    this.hpBar.fillStyle(colors[this.phase - 1], 1);
    this.hpBar.fillRect(x, y, barW * ratio, barH);

    this.hpBarBg.lineStyle(1, 0xffffff, 0.3);
    this.hpBarBg.lineBetween(x + barW * 0.33, y, x + barW * 0.33, y + barH);
    this.hpBarBg.lineBetween(x + barW * 0.66, y, x + barW * 0.66, y + barH);
  }
}
