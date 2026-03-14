import Phaser from 'phaser';
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
 * THE HOLLOW KING — Boss of the Cryptvault
 * An undead monarch on a throne of skulls.
 *
 * Phase 1 (100-66% HP): Bone volley, soul slash
 * Phase 2 (66-33% HP): Adds skull summon, faster attacks
 * Phase 3 (33-0% HP): Death grip pull, undead rage
 */
export class HollowKing {
  scene: Phaser.Scene;
  sprite: Phaser.Physics.Arcade.Sprite;
  body: Phaser.Physics.Arcade.Body;

  name = 'THE HOLLOW KING';
  powerId = 'soul_drain';
  powerName = 'SOUL DRAIN';
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
  private facingRight = false;

  // Visual
  private hpBarBg: Phaser.GameObjects.Graphics;
  private hpBar: Phaser.GameObjects.Graphics;
  private nameText: Phaser.GameObjects.Text;
  private phaseText: Phaser.GameObjects.Text;

  // Hazards
  private hazards: Phaser.GameObjects.GameObject[] = [];

  // Arena
  private arenaLeft: number;
  private arenaRight: number;
  private arenaFloor: number;

  // Summoned skulls (Phase 2+)
  private skulls: Phaser.Physics.Arcade.Sprite[] = [];

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.maxHp = 250;
    this.hp = this.maxHp;

    this.arenaLeft = x - 100;
    this.arenaRight = x + 100;
    this.arenaFloor = y;

    // Generate boss texture (skeletal king)
    const g = scene.add.graphics();
    // Body — dark bone/purple
    g.fillStyle(0x442266);
    g.fillRect(0, 0, 28, 36);
    // Crown
    g.fillStyle(0xffcc44);
    g.fillRect(4, 0, 20, 4);
    g.fillRect(6, -3, 4, 4);
    g.fillRect(14, -3, 4, 4);
    g.fillRect(18, -3, 4, 4);
    // Skull face
    g.fillStyle(0xddddcc);
    g.fillRect(6, 6, 16, 12);
    // Eye sockets
    g.fillStyle(0x4488ff);
    g.fillRect(8, 8, 4, 4);
    g.fillRect(16, 8, 4, 4);
    // Ribcage lines
    g.lineStyle(1, 0xddddcc, 0.6);
    g.lineBetween(6, 22, 22, 22);
    g.lineBetween(6, 26, 22, 26);
    g.lineBetween(6, 30, 22, 30);
    // Border
    g.lineStyle(2, 0x4488ff);
    g.strokeRect(0, 0, 28, 36);
    g.generateTexture('boss-hollowking', 28, 36);
    g.destroy();

    // Sprite
    this.sprite = scene.physics.add.sprite(x, y, 'boss-hollowking');
    this.sprite.setOrigin(0.5, 1);
    this.body = this.sprite.body as Phaser.Physics.Arcade.Body;
    this.body.setSize(24, 34);
    this.body.setImmovable(true);
    this.body.setAllowGravity(false);
    (this.sprite as any).owner = this;
    (this.sprite as any).isBoss = true;

    // HP bar
    this.hpBarBg = scene.add.graphics().setScrollFactor(0).setDepth(200);
    this.hpBar = scene.add.graphics().setScrollFactor(0).setDepth(201);
    this.nameText = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 28, '', {
      fontSize: '14px', fontFamily: 'Arial, Helvetica, sans-serif', color: '#4488ff',
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

    this.scene.cameras.main.shake(300, 0.015);
    this.scene.cameras.main.flash(200, 50, 0, 150);
  }

  update(time: number, delta: number) {
    if (!this.isActive || this.state === 'dead') return;
    if (time < this.hitstopUntil) return;

    const gameScene = this.scene as any;
    const player = gameScene.player;
    if (!player) return;

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

    switch (this.state) {
      case 'idle':
        this.actionCooldown -= delta;
        if (this.actionCooldown <= 0) this.chooseAttack();
        // Hover
        this.sprite.y = this.arenaFloor + Math.sin(time * 0.002) * 4;
        break;

      case 'telegraph':
        this.attackTimer -= delta;
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
        this.attackTimer -= delta;
        this.sprite.setTint(0x4488ff);
        if (this.attackTimer <= 0) {
          this.sprite.clearTint();
          this.state = 'idle';
          this.actionCooldown = 500;
        }
        break;
    }

    // Update skulls
    this.updateSkulls(player, time);
    this.drawHpBar();
    this.checkHazardHits(player, time);
  }

  takeDamage(amount: number, _sourceX: number, time: number) {
    if (this.state === 'dead' || this.state === 'transition') return;

    this.hp = Math.max(0, this.hp - amount);
    this.hitstopUntil = time + HITSTOP_DURATION_MS;

    this.sprite.setTint(0xffffff);
    this.scene.time.delayedCall(100, () => {
      if (this.state !== 'dead') this.sprite.clearTint();
    });

    this.scene.cameras.main.shake(60, 0.008);

    if (this.hp <= 0) this.die();
  }

  private die() {
    this.state = 'dead';
    this.cleanupHazards();
    this.cleanupSkulls();

    this.scene.cameras.main.shake(500, 0.03);

    // Explosion sequence — blue/purple themed
    for (let i = 0; i < 5; i++) {
      this.scene.time.delayedCall(i * 200, () => {
        const ox = (Math.random() - 0.5) * 30;
        const oy = (Math.random() - 0.5) * 30;
        const emitter = this.scene.add.particles(
          this.sprite.x + ox, this.sprite.y - 18 + oy, 'particle', {
            speed: { min: 40, max: 120 },
            angle: { min: 0, max: 360 },
            scale: { start: 1.5, end: 0 },
            lifespan: 400,
            tint: [0x4488ff, 0x442266, 0xddddcc],
            quantity: 15,
            emitting: false,
          }
        );
        emitter.explode(15);
        this.scene.time.delayedCall(500, () => emitter.destroy());
      });
    }

    this.scene.time.delayedCall(1200, () => {
      const gameScene = this.scene as any;
      if (gameScene.player) {
        gameScene.player.gainXP(250);
      }

      const text = this.scene.add.text(this.sprite.x, this.sprite.y - 50,
        `POWER ABSORBED: ${this.powerName}`, {
          fontSize: '14px', fontFamily: 'Arial, Helvetica, sans-serif', color: '#4488ff',
          fontStyle: 'bold', stroke: '#000000', strokeThickness: 2,
        }).setOrigin(0.5).setDepth(100);

      this.scene.tweens.add({
        targets: text, y: text.y - 30, alpha: 0, duration: 3000,
        onComplete: () => text.destroy(),
      });

      if (gameScene.absorbBossPower) {
        gameScene.absorbBossPower(this.powerId);
      }

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
    this.scene.cameras.main.shake(200, 0.02);
    this.scene.cameras.main.flash(150, 50, 0, 200);
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
        name: 'Bone Volley',
        telegraph: 500,
        duration: 400,
        cooldown: 1200,
        execute: () => this.attackBoneVolley(),
      },
      {
        name: 'Soul Slash',
        telegraph: 400,
        duration: 300,
        cooldown: 1000,
        execute: () => this.attackSoulSlash(),
      },
    ];

    if (this.phase >= 2) {
      base.push({
        name: 'Skull Summon',
        telegraph: 600,
        duration: 200,
        cooldown: 2000,
        execute: () => this.attackSkullSummon(),
      });
    }

    if (this.phase >= 3) {
      base.push({
        name: 'Death Grip',
        telegraph: 700,
        duration: 600,
        cooldown: 1800,
        execute: () => this.attackDeathGrip(),
      });
    }

    return base;
  }

  /** Bone Volley — fires 3-5 bone projectiles in a spread */
  private attackBoneVolley() {
    const gameScene = this.scene as any;
    const playerX = gameScene.player?.sprite.x ?? this.sprite.x;
    const dir = playerX > this.sprite.x ? 1 : -1;
    const count = this.phase >= 3 ? 5 : 3;
    const spreadAngle = 30; // degrees total spread

    for (let i = 0; i < count; i++) {
      const angle = -spreadAngle / 2 + (spreadAngle / (count - 1)) * i;
      const rad = angle * Math.PI / 180;
      const speed = 130;
      const vx = dir * speed * Math.cos(rad);
      const vy = speed * Math.sin(rad) - 30;

      const bone = this.scene.physics.add.sprite(
        this.sprite.x + dir * 10,
        this.sprite.y - 16,
        'projectile-enemy'
      );
      bone.setDisplaySize(6, 6);
      bone.setTint(0xddddcc);
      const bb = bone.body as Phaser.Physics.Arcade.Body;
      bb.setAllowGravity(false);
      bb.setVelocity(vx, vy);
      (bone as any).damage = this.damage;
      this.hazards.push(bone);
      gameScene.combat?.addEnemyProjectile(bone);

      this.scene.time.delayedCall(2000, () => { if (bone.active) bone.destroy(); });
    }
  }

  /** Soul Slash — wide melee arc in front of the boss */
  private attackSoulSlash() {
    const dir = this.facingRight ? 1 : -1;
    const sx = this.sprite.x + dir * 24;
    const sy = this.sprite.y - 16;

    // Visual slash
    const slash = this.scene.add.graphics();
    slash.fillStyle(0x4488ff, 0.5);
    slash.fillEllipse(0, 0, 40, 20);
    slash.setPosition(sx, sy);
    slash.setDepth(5);

    // Damage zone
    const zone = this.scene.physics.add.sprite(sx, sy, 'projectile-enemy');
    zone.setDisplaySize(40, 20);
    zone.setAlpha(0.3);
    zone.setTint(0x4488ff);
    const zb = zone.body as Phaser.Physics.Arcade.Body;
    zb.setAllowGravity(false);
    (zone as any).damage = this.damage + 3;
    this.hazards.push(zone);
    const gameScene = this.scene as any;
    gameScene.combat?.addEnemyProjectile(zone);

    this.scene.time.delayedCall(250, () => {
      slash.destroy();
      if (zone.active) zone.destroy();
    });
  }

  /** Skull Summon — spawns floating skulls that home toward player */
  private attackSkullSummon() {
    const count = this.phase >= 3 ? 3 : 2;
    for (let i = 0; i < count; i++) {
      const ox = (Math.random() - 0.5) * 60;
      const skull = this.scene.physics.add.sprite(
        this.sprite.x + ox,
        this.sprite.y - 40,
        'projectile-enemy'
      );
      skull.setDisplaySize(8, 8);
      skull.setTint(0xddddcc);
      const sb = skull.body as Phaser.Physics.Arcade.Body;
      sb.setAllowGravity(false);
      (skull as any).damage = 8;
      (skull as any).isEnemyProjectile = true;
      this.skulls.push(skull);
      this.hazards.push(skull);
      const gameScene = this.scene as any;
      gameScene.combat?.addEnemyProjectile(skull);

      // Auto-destroy after 5 seconds
      this.scene.time.delayedCall(5000, () => {
        if (skull.active) skull.destroy();
        this.skulls = this.skulls.filter(s => s !== skull);
      });
    }
  }

  /** Death Grip — pulls player toward boss */
  private attackDeathGrip() {
    const gameScene = this.scene as any;
    const player = gameScene.player;
    if (!player) return;

    // Warning visual — spectral hand reaching toward player
    const hand = this.scene.add.graphics();
    hand.lineStyle(3, 0x4488ff, 0.6);
    hand.lineBetween(this.sprite.x, this.sprite.y - 16, player.sprite.x, player.sprite.y - 12);
    hand.setDepth(5);

    // Pull player toward boss
    const dx = this.sprite.x - player.sprite.x;
    const dy = (this.sprite.y - 16) - player.sprite.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 10) {
      const pullSpeed = 100;
      player.body.setVelocityX((dx / dist) * pullSpeed);
      player.body.setVelocityY((dy / dist) * pullSpeed * 0.5);
    }

    // Damage if close enough at end of pull
    this.scene.time.delayedCall(500, () => {
      hand.destroy();
      const newDist = Phaser.Math.Distance.Between(
        player.sprite.x, player.sprite.y,
        this.sprite.x, this.sprite.y - 16
      );
      if (newDist < 35) {
        player.takeDamage(this.damage + 5, this.sprite.x, this.scene.time.now);
      }
    });

    this.scene.cameras.main.shake(100, 0.01);
  }

  /** Update homing skulls */
  private updateSkulls(player: any, _time: number) {
    for (const skull of this.skulls) {
      if (!skull.active) continue;
      const dx = player.sprite.x - skull.x;
      const dy = (player.sprite.y - 12) - skull.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 5) {
        const speed = 50;
        skull.body!.velocity.x += (dx / dist) * speed * 0.05;
        skull.body!.velocity.y += (dy / dist) * speed * 0.05;
        // Cap speed
        const v = skull.body!.velocity;
        const spd = Math.sqrt(v.x * v.x + v.y * v.y);
        if (spd > 70) {
          v.x = (v.x / spd) * 70;
          v.y = (v.y / spd) * 70;
        }
      }
    }
  }

  private checkHazardHits(player: any, time: number) {
    if (this.state === 'attack' || this.state === 'idle') {
      const dist = Phaser.Math.Distance.Between(
        player.sprite.x, player.sprite.y,
        this.sprite.x, this.sprite.y - 18
      );
      if (dist < 22) {
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

  private cleanupSkulls() {
    for (const s of this.skulls) {
      if (s.active) s.destroy();
    }
    this.skulls = [];
  }

  private drawHpBar() {
    const barW = 300;
    const barH = 8;
    const x = GAME_WIDTH / 2 - barW / 2;
    const y = GAME_HEIGHT - 46;
    const ratio = Math.max(0, this.hp / this.maxHp);

    this.hpBarBg.clear();
    this.hpBarBg.fillStyle(0x110022, 0.8);
    this.hpBarBg.fillRect(x, y, barW, barH);
    this.hpBarBg.lineStyle(1, 0x444444);
    this.hpBarBg.strokeRect(x, y, barW, barH);

    this.hpBar.clear();
    const colors = [0x4488ff, 0x8844ff, 0xff44ff];
    this.hpBar.fillStyle(colors[this.phase - 1], 1);
    this.hpBar.fillRect(x, y, barW * ratio, barH);

    this.hpBarBg.lineStyle(1, 0xffffff, 0.3);
    this.hpBarBg.lineBetween(x + barW * 0.33, y, x + barW * 0.33, y + barH);
    this.hpBarBg.lineBetween(x + barW * 0.66, y, x + barW * 0.66, y + barH);
  }
}
