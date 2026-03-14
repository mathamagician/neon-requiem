import Phaser from 'phaser';
import {
  ENEMY_PATROL_SPEED,
  ENEMY_CHASE_SPEED,
  ENEMY_DETECT_RANGE,
  ENEMY_ATTACK_RANGE,
  KNOCKBACK_VELOCITY,
  HITSTOP_DURATION_MS,
  COLORS,
} from '../../shared/constants';

export type EnemyType = 'grunt' | 'ranged' | 'flyer';

type EnemyState = 'patrol' | 'chase' | 'attack' | 'hurt' | 'dead';

interface EnemyStats {
  hp: number;
  damage: number;
  speed: number;
  xpValue: number;
  textureKey: string;
}

const ENEMY_CONFIGS: Record<EnemyType, EnemyStats> = {
  grunt: { hp: 30, damage: 10, speed: ENEMY_PATROL_SPEED, xpValue: 15, textureKey: 'enemy-grunt' },
  ranged: { hp: 20, damage: 8, speed: ENEMY_PATROL_SPEED * 0.7, xpValue: 20, textureKey: 'enemy-ranged' },
  flyer: { hp: 15, damage: 6, speed: ENEMY_PATROL_SPEED * 1.2, xpValue: 18, textureKey: 'enemy-flyer' },
};

export class Enemy {
  scene: Phaser.Scene;
  sprite: Phaser.Physics.Arcade.Sprite;
  body: Phaser.Physics.Arcade.Body;
  type: EnemyType;
  state: EnemyState = 'patrol';

  hp: number;
  maxHp: number;
  damage: number;
  speed: number;
  xpValue: number;

  facingRight = false;
  private patrolDir = 1;
  private patrolTimer = 0;
  private attackCooldown = 0;
  private hurtTimer = 0;
  private hitstopUntil = 0;
  private spawnX: number;

  // HP bar
  private hpBarBg: Phaser.GameObjects.Graphics;
  private hpBar: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, x: number, y: number, type: EnemyType) {
    this.scene = scene;
    this.type = type;
    this.spawnX = x;

    const config = ENEMY_CONFIGS[type];
    this.hp = config.hp;
    this.maxHp = config.hp;
    this.damage = config.damage;
    this.speed = config.speed;
    this.xpValue = config.xpValue;

    this.sprite = scene.physics.add.sprite(x, y, config.textureKey);
    this.sprite.setOrigin(0.5, 1);
    this.body = this.sprite.body as Phaser.Physics.Arcade.Body;
    this.body.setCollideWorldBounds(true);

    if (type === 'flyer') {
      this.body.setAllowGravity(false);
    }

    // Store reference for collision
    (this.sprite as any).owner = this;
    (this.sprite as any).isEnemy = true;

    // HP bar graphics
    this.hpBarBg = scene.add.graphics();
    this.hpBar = scene.add.graphics();
    this.hpBarBg.setDepth(20);
    this.hpBar.setDepth(21);
  }

  update(_time: number, delta: number) {
    if (this.state === 'dead') return;

    // Hitstop
    if (_time < this.hitstopUntil) {
      this.body.setVelocity(0, this.type === 'flyer' ? 0 : this.body.velocity.y);
      return;
    }

    // Hurt recovery
    if (this.state === 'hurt') {
      this.hurtTimer -= delta;
      if (this.hurtTimer <= 0) this.state = 'patrol';
      this.drawHpBar();
      return;
    }

    // Attack cooldown
    if (this.attackCooldown > 0) this.attackCooldown -= delta;

    // Find player
    const gameScene = this.scene as any;
    const player = gameScene.player;
    if (!player) return;

    const distX = player.sprite.x - this.sprite.x;
    const distY = player.sprite.y - this.sprite.y;
    const dist = Math.sqrt(distX * distX + distY * distY);

    // State machine
    if (dist < ENEMY_DETECT_RANGE) {
      if (dist < ENEMY_ATTACK_RANGE && this.attackCooldown <= 0) {
        this.state = 'attack';
        this.doAttack(player);
      } else {
        this.state = 'chase';
        this.chase(distX, distY, dist);
      }
    } else {
      this.state = 'patrol';
      this.patrol(delta);
    }

    // Face direction
    this.facingRight = this.body.velocity.x > 0;
    this.sprite.setFlipX(!this.facingRight);

    this.drawHpBar();
  }

  private patrol(delta: number) {
    this.patrolTimer -= delta;
    if (this.patrolTimer <= 0) {
      this.patrolDir *= -1;
      this.patrolTimer = 1500 + Math.random() * 2000;
    }

    // Don't wander too far from spawn
    const maxWander = 60;
    if (Math.abs(this.sprite.x - this.spawnX) > maxWander) {
      this.patrolDir = this.sprite.x > this.spawnX ? -1 : 1;
    }

    this.body.setVelocityX(this.patrolDir * this.speed);

    if (this.type === 'flyer') {
      this.body.setVelocityY(Math.sin(Date.now() * 0.003) * 20);
    }
  }

  private chase(distX: number, distY: number, _dist: number) {
    const chaseSpeed = ENEMY_CHASE_SPEED;
    this.body.setVelocityX(distX > 0 ? chaseSpeed : -chaseSpeed);

    if (this.type === 'flyer') {
      this.body.setVelocityY(distY > 0 ? chaseSpeed * 0.6 : -chaseSpeed * 0.6);
    }
  }

  private doAttack(_player: any) {
    this.attackCooldown = 1000;

    if (this.type === 'ranged') {
      this.shootProjectile(_player);
    }
    // Grunt/flyer damage is handled by contact collision in CombatSystem
  }

  private shootProjectile(player: any) {
    const proj = this.scene.physics.add.sprite(this.sprite.x, this.sprite.y - 8, 'projectile-enemy');
    proj.setOrigin(0.5, 0.5);
    const projBody = proj.body as Phaser.Physics.Arcade.Body;
    projBody.setAllowGravity(false);

    const angle = Phaser.Math.Angle.Between(
      this.sprite.x, this.sprite.y,
      player.sprite.x, player.sprite.y
    );
    const speed = 100;
    projBody.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);

    // Store damage on projectile
    (proj as any).damage = this.damage;
    (proj as any).isEnemyProjectile = true;

    // Auto-destroy after 3 seconds
    this.scene.time.delayedCall(3000, () => {
      if (proj.active) proj.destroy();
    });

    // Add to combat system tracking
    const gameScene = this.scene as any;
    if (gameScene.combat) {
      gameScene.combat.addEnemyProjectile(proj);
    }
  }

  takeDamage(amount: number, sourceX: number, time: number) {
    if (this.state === 'dead') return;

    this.hp -= amount;
    this.hitstopUntil = time + HITSTOP_DURATION_MS;

    // Knockback
    const dir = this.sprite.x < sourceX ? -1 : 1;
    this.body.setVelocityX(dir * KNOCKBACK_VELOCITY);
    if (this.type !== 'flyer') {
      this.body.setVelocityY(-80);
    }

    // Flash white
    this.sprite.setTint(0xffffff);
    this.scene.time.delayedCall(80, () => {
      if (this.state !== 'dead') this.sprite.setTint(0xffaaaa);
      this.scene.time.delayedCall(80, () => {
        if (this.state !== 'dead') this.sprite.clearTint();
      });
    });

    if (this.hp <= 0) {
      this.die();
    } else {
      this.state = 'hurt';
      this.hurtTimer = 300;
    }
  }

  private die() {
    this.state = 'dead';

    // Grant XP and spawn loot
    const gameScene = this.scene as any;
    if (gameScene.player) {
      gameScene.player.gainXP(this.xpValue);
    }
    if (gameScene.spawnLootDrop) {
      gameScene.spawnLootDrop(this.sprite.x, this.sprite.y);
    }

    // Death particles
    const emitter = this.scene.add.particles(this.sprite.x, this.sprite.y - 8, 'particle', {
      speed: { min: 30, max: 80 },
      angle: { min: 0, max: 360 },
      scale: { start: 1, end: 0 },
      lifespan: 300,
      tint: COLORS.danger,
      quantity: 10,
      emitting: false,
    });
    emitter.explode(10);
    this.scene.time.delayedCall(400, () => emitter.destroy());

    // Cleanup
    this.hpBar.destroy();
    this.hpBarBg.destroy();
    this.sprite.destroy();

    // Respawn after delay (for testing — remove later)
    this.scene.time.delayedCall(5000, () => {
      this.respawn();
    });
  }

  private respawn() {
    this.hp = this.maxHp;
    this.state = 'patrol';
    const config = ENEMY_CONFIGS[this.type];

    this.sprite = this.scene.physics.add.sprite(this.spawnX, this.spawnX, config.textureKey);
    this.sprite.setOrigin(0.5, 1);
    this.body = this.sprite.body as Phaser.Physics.Arcade.Body;
    this.body.setCollideWorldBounds(true);
    if (this.type === 'flyer') this.body.setAllowGravity(false);
    (this.sprite as any).owner = this;
    (this.sprite as any).isEnemy = true;

    this.hpBarBg = this.scene.add.graphics();
    this.hpBar = this.scene.add.graphics();
    this.hpBarBg.setDepth(20);
    this.hpBar.setDepth(21);

    // Re-add to collision groups
    const gameScene = this.scene as any;
    if (gameScene.enemies) gameScene.enemies.add(this.sprite);
    if (gameScene.groundLayer) {
      this.scene.physics.add.collider(this.sprite, gameScene.groundLayer);
    }
  }

  private drawHpBar() {
    if (this.hp >= this.maxHp) {
      this.hpBarBg.clear();
      this.hpBar.clear();
      return;
    }

    const x = this.sprite.x - 10;
    const y = this.sprite.y - this.sprite.height - 6;
    const w = 20;
    const h = 2;
    const hpRatio = Math.max(0, this.hp / this.maxHp);

    this.hpBarBg.clear();
    this.hpBarBg.fillStyle(COLORS.hpBarBg);
    this.hpBarBg.fillRect(x, y, w, h);

    this.hpBar.clear();
    this.hpBar.fillStyle(COLORS.hpBar);
    this.hpBar.fillRect(x, y, w * hpRatio, h);
  }
}
