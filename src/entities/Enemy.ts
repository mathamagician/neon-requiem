import Phaser from 'phaser';
import { playSound } from '../systems/SoundManager';
import { safeShake } from '../systems/AccessibilitySettings';
import {
  ENEMY_PATROL_SPEED,
  ENEMY_CHASE_SPEED,
  ENEMY_DETECT_RANGE,
  ENEMY_ATTACK_RANGE,
  KNOCKBACK_VELOCITY,
  HITSTOP_DURATION_MS,
  COLORS,
  TILE_SIZE,
} from '../../shared/constants';

export type EnemyType = 'grunt' | 'ranged' | 'flyer' | 'charger' | 'skeleton' | 'ghost' | 'bone_archer' | 'shade';

type EnemyState = 'patrol' | 'chase' | 'attack' | 'hurt' | 'dead';

interface EnemyStats {
  hp: number;
  damage: number;
  speed: number;
  xpValue: number;
  textureKey: string;
}

const ENEMY_CONFIGS: Record<EnemyType, EnemyStats> = {
  // Neon Foundry enemies
  grunt: { hp: 30, damage: 10, speed: ENEMY_PATROL_SPEED, xpValue: 15, textureKey: 'enemy-grunt' },
  ranged: { hp: 20, damage: 8, speed: ENEMY_PATROL_SPEED * 0.8, xpValue: 20, textureKey: 'enemy-ranged' },
  flyer: { hp: 15, damage: 6, speed: ENEMY_PATROL_SPEED * 1.2, xpValue: 18, textureKey: 'enemy-flyer' },
  charger: { hp: 50, damage: 18, speed: ENEMY_PATROL_SPEED * 0.6, xpValue: 28, textureKey: 'enemy-charger' },
  // Cryptvault enemies
  skeleton: { hp: 35, damage: 12, speed: ENEMY_PATROL_SPEED * 0.9, xpValue: 18, textureKey: 'enemy-skeleton' },
  ghost: { hp: 20, damage: 8, speed: ENEMY_PATROL_SPEED * 1.3, xpValue: 22, textureKey: 'enemy-ghost' },
  bone_archer: { hp: 22, damage: 10, speed: ENEMY_PATROL_SPEED * 0.7, xpValue: 25, textureKey: 'enemy-bone-archer' },
  shade: { hp: 25, damage: 14, speed: ENEMY_PATROL_SPEED * 1.1, xpValue: 30, textureKey: 'enemy-shade' },
};

/** Which enemy types can jump */
const CAN_JUMP: Set<EnemyType> = new Set(['grunt', 'skeleton', 'charger']);
/** Which enemy types shoot projectiles */
const CAN_SHOOT: Set<EnemyType> = new Set(['ranged', 'bone_archer']);
/** Jump velocity for ground enemies */
const ENEMY_JUMP_VEL = -220;
/** How close ranged enemies prefer to stay from the player */
const RANGED_PREFERRED_DIST = 80;
/** Charger rush speed multiplier */
const CHARGER_RUSH_SPEED = 3.5;
const CHARGER_TELEGRAPH_MS = 600;
/** Shade phase timing */
const SHADE_PHASE_INTERVAL = 2500;
const SHADE_PHASE_DURATION = 800;

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
  private spawnY: number;
  private jumpCooldown = 0;
  private patrolJumpTimer = 1000 + Math.random() * 2000; // delay before first patrol hop

  // Deferred knockback — applied when hitstop ends
  private pendingKnockbackX = 0;
  private pendingKnockbackY = 0;

  // Poison debuff — slows movement
  private poisonTimer = 0;
  private poisonSlowMult = 1; // multiplier applied to speed (< 1 = slowed)

  // Charger state
  private chargeState: 'idle' | 'telegraph' | 'rushing' = 'idle';
  private chargeTimer = 0;
  private chargeDir = 0;

  // Shade state (phases in/out of visibility)
  private shadePhaseTimer = SHADE_PHASE_INTERVAL;
  private isPhased = false;
  private shadePhaseCount = 0;

  // HP bar
  private hpBarBg: Phaser.GameObjects.Graphics;
  private hpBar: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, x: number, y: number, type: EnemyType) {
    this.scene = scene;
    this.type = type;
    this.spawnX = x;
    this.spawnY = y;

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

    // Set body size for upgraded sprites
    if (type === 'ghost' || type === 'shade') {
      this.body.setSize(12, 14);
      this.body.setOffset(4, 2);
    } else if (type === 'charger') {
      this.body.setSize(18, 22);
      this.body.setOffset(3, 2);
    } else {
      this.body.setSize(14, 18);
      this.body.setOffset(3, 2);
    }

    if (type === 'flyer' || type === 'ghost' || type === 'shade') {
      this.body.setAllowGravity(false);
    }

    // Shade starts semi-transparent
    if (type === 'shade') {
      this.sprite.setAlpha(0.6);
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

    // Hitstop — freeze in place
    if (_time < this.hitstopUntil) {
      this.body.setVelocity(0, 0);
      return;
    }

    // Apply deferred knockback when hitstop just ended
    if (this.pendingKnockbackX !== 0 || this.pendingKnockbackY !== 0) {
      this.body.setVelocityX(this.pendingKnockbackX);
      this.body.setVelocityY(this.pendingKnockbackY);
      this.pendingKnockbackX = 0;
      this.pendingKnockbackY = 0;
    }

    // Hurt recovery — decelerate after knockback
    if (this.state === 'hurt') {
      this.hurtTimer -= delta;
      // Strong friction to stop sliding quickly
      this.body.setVelocityX(this.body.velocity.x * 0.8);
      if (Math.abs(this.body.velocity.x) < 5) this.body.setVelocityX(0);
      if (this.hurtTimer <= 0) this.state = 'patrol';
      this.drawHpBar();
      return;
    }

    // Poison tick-down
    if (this.poisonTimer > 0) {
      this.poisonTimer -= delta;
      if (this.poisonTimer <= 0) {
        this.poisonSlowMult = 1;
        this.sprite.clearTint();
      }
    }

    // Cooldown timers
    if (this.attackCooldown > 0) this.attackCooldown -= delta;
    if (this.jumpCooldown > 0) this.jumpCooldown -= delta;

    // Find player
    const gameScene = this.scene as any;
    const player = gameScene.player;
    if (!player) return;

    const distX = player.sprite.x - this.sprite.x;
    const distY = player.sprite.y - this.sprite.y;
    const dist = Math.sqrt(distX * distX + distY * distY);

    // --- Charger special behavior ---
    if (this.type === 'charger') {
      this.updateCharger(dist, distX, delta, player);
      this.drawHpBar();
      return;
    }

    // --- Shade special behavior ---
    if (this.type === 'shade') {
      this.updateShade(dist, distX, distY, delta, player);
      this.drawHpBar();
      return;
    }

    // Ranged enemies attack from further away
    const attackRange = CAN_SHOOT.has(this.type) ? RANGED_PREFERRED_DIST : ENEMY_ATTACK_RANGE;
    const detectRange = CAN_SHOOT.has(this.type) ? ENEMY_DETECT_RANGE * 1.5 : ENEMY_DETECT_RANGE;

    // State machine
    if (dist < detectRange) {
      if (dist < attackRange && this.attackCooldown <= 0) {
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

    // Walk bobbing — subtle vertical oscillation to show movement
    if (this.type !== 'flyer' && this.type !== 'ghost' && Math.abs(this.body.velocity.x) > 10 && this.body.onFloor()) {
      this.sprite.y += Math.sin(_time * 0.012) * 0.5;
    }

    this.drawHpBar();
  }

  private patrol(delta: number) {
    this.patrolTimer -= delta;
    if (this.patrolTimer <= 0) {
      this.patrolDir *= -1;
      this.patrolTimer = 1200 + Math.random() * 1800;
    }

    // Wander within a reasonable radius of spawn
    const maxWander = 100;
    if (Math.abs(this.sprite.x - this.spawnX) > maxWander) {
      this.patrolDir = this.sprite.x > this.spawnX ? -1 : 1;
    }

    this.body.setVelocityX(this.patrolDir * this.speed * this.poisonSlowMult);

    // Flying enemies bob up and down
    if (this.type === 'flyer' || this.type === 'ghost') {
      this.body.setVelocityY(Math.sin(Date.now() * 0.003) * 25);
    }

    // Ground enemies occasionally jump while patrolling (looks lively)
    if (CAN_JUMP.has(this.type) && this.body.onFloor()) {
      this.patrolJumpTimer -= delta;
      if (this.patrolJumpTimer <= 0) {
        this.patrolJumpTimer = 2000 + Math.random() * 3000;
        this.body.setVelocityY(ENEMY_JUMP_VEL * 0.5); // small hop
      }
    }
  }

  private chase(distX: number, distY: number, dist: number) {
    const chaseSpeed = ENEMY_CHASE_SPEED * this.poisonSlowMult;

    // Ranged enemies try to keep distance — back away if too close, close in if too far
    if (CAN_SHOOT.has(this.type)) {
      if (dist < RANGED_PREFERRED_DIST * 0.6) {
        // Too close — back away
        this.body.setVelocityX(distX > 0 ? -chaseSpeed * 0.8 : chaseSpeed * 0.8);
      } else if (dist > RANGED_PREFERRED_DIST * 1.5) {
        // Too far — approach
        this.body.setVelocityX(distX > 0 ? chaseSpeed * 0.6 : -chaseSpeed * 0.6);
      } else {
        // Good distance — strafe slowly
        this.body.setVelocityX(this.patrolDir * chaseSpeed * 0.3);
      }
    } else {
      // Melee enemies chase directly
      this.body.setVelocityX(distX > 0 ? chaseSpeed : -chaseSpeed);
    }

    // Flying enemies track vertically
    if (this.type === 'flyer' || this.type === 'ghost') {
      this.body.setVelocityY(distY > 0 ? chaseSpeed * 0.7 : -chaseSpeed * 0.7);
    }

    // Ground enemies jump when player is above them or when blocked by a wall
    if (CAN_JUMP.has(this.type) && this.body.onFloor() && this.jumpCooldown <= 0) {
      const shouldJump = distY < -TILE_SIZE * 2 // player is above
        || (this.body.blocked.left || this.body.blocked.right); // stuck against wall
      if (shouldJump) {
        this.body.setVelocityY(ENEMY_JUMP_VEL);
        this.jumpCooldown = 800;
      }
    }
  }

  /** Charger: slow patrol, telegraphed rush when player is near */
  private updateCharger(dist: number, distX: number, delta: number, _player: any) {
    if (this.chargeState === 'idle') {
      // Slow patrol until player is in range
      if (dist < ENEMY_DETECT_RANGE * 1.2 && this.attackCooldown <= 0) {
        // Telegraph — flash red, lock direction
        this.chargeState = 'telegraph';
        this.chargeTimer = CHARGER_TELEGRAPH_MS;
        this.chargeDir = distX > 0 ? 1 : -1;
        this.body.setVelocityX(0);
        this.sprite.setTint(0xff6644);
        playSound('enemyHit');
      } else {
        this.patrol(delta);
      }
    } else if (this.chargeState === 'telegraph') {
      this.chargeTimer -= delta;
      // Shake in place to telegraph
      this.sprite.x += (Math.random() - 0.5) * 2;
      this.body.setVelocityX(0);
      if (this.chargeTimer <= 0) {
        this.chargeState = 'rushing';
        this.chargeTimer = 600; // Rush for 600ms
        this.sprite.setTint(0xff2222);
      }
    } else if (this.chargeState === 'rushing') {
      this.chargeTimer -= delta;
      const rushSpeed = ENEMY_CHASE_SPEED * CHARGER_RUSH_SPEED * this.poisonSlowMult;
      this.body.setVelocityX(this.chargeDir * rushSpeed);
      // Stop if hit a wall
      if (this.body.blocked.left || this.body.blocked.right || this.chargeTimer <= 0) {
        this.chargeState = 'idle';
        this.attackCooldown = 1500;
        this.sprite.clearTint();
        if (this.poisonTimer > 0) this.sprite.setTint(0x88ff88);
        // Wall impact — brief stun
        if (this.body.blocked.left || this.body.blocked.right) {
          this.body.setVelocityX(0);
          this.hurtTimer = 400;
          this.state = 'hurt';
          return;
        }
      }
    }
    this.state = this.chargeState === 'idle' ? 'patrol' : 'chase';
    this.facingRight = this.body.velocity.x > 0 || this.chargeDir > 0;
    this.sprite.setFlipX(!this.facingRight);
  }

  /** Shade: phases in/out, teleports behind player when phased */
  private updateShade(dist: number, distX: number, distY: number, delta: number, player: any) {
    this.shadePhaseTimer -= delta;

    if (this.isPhased) {
      // Currently invisible — move toward player's back
      this.chargeTimer -= delta;
      const behindX = player.sprite.x + (player.facingRight ? -30 : 30);
      const dx = behindX - this.sprite.x;
      const dy = (player.sprite.y - 10) - this.sprite.y;
      this.body.setVelocity(
        Math.sign(dx) * Math.min(Math.abs(dx) * 3, 150),
        Math.sign(dy) * Math.min(Math.abs(dy) * 3, 100)
      );
      // Shimmer effect
      this.sprite.setAlpha(0.1 + Math.sin(Date.now() * 0.02) * 0.08);

      if (this.chargeTimer <= 0) {
        // Phase back in — attack!
        this.isPhased = false;
        this.sprite.setAlpha(0.7);
        this.shadePhaseTimer = SHADE_PHASE_INTERVAL;
        this.shadePhaseCount++;
        playSound('swordSwing');
      }
    } else {
      // Visible — float and approach
      if (dist < ENEMY_DETECT_RANGE) {
        this.body.setVelocityX(distX > 0 ? this.speed * this.poisonSlowMult : -this.speed * this.poisonSlowMult);
        this.body.setVelocityY(distY > 0 ? this.speed * 0.6 : -this.speed * 0.6);
        this.state = 'chase';
      } else {
        this.patrol(delta);
        // Bob vertically like ghost
        this.body.setVelocityY(Math.sin(Date.now() * 0.003) * 20);
        this.state = 'patrol';
      }

      // Phase out when timer expires and player is in range
      if (this.shadePhaseTimer <= 0 && dist < ENEMY_DETECT_RANGE * 1.3) {
        this.isPhased = true;
        this.chargeTimer = SHADE_PHASE_DURATION;
        this.sprite.setAlpha(0.15);
        playSound('dash');
      }

      // Gentle alpha pulse when visible
      this.sprite.setAlpha(0.5 + Math.sin(Date.now() * 0.004) * 0.15);
    }

    this.facingRight = this.body.velocity.x > 0;
    this.sprite.setFlipX(!this.facingRight);
  }

  private doAttack(_player: any) {
    // Ranged enemies have longer cooldown but attack from further away
    this.attackCooldown = CAN_SHOOT.has(this.type) ? 1200 : 800;

    if (CAN_SHOOT.has(this.type)) {
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

  /** Apply poison debuff — slows enemy for duration */
  applyPoison(duration: number, slowAmount: number) {
    this.poisonTimer = duration;
    this.poisonSlowMult = slowAmount; // e.g. 0.4 = 60% slow
    this.sprite.setTint(0x88ff88); // Green tint while poisoned
  }

  takeDamage(amount: number, sourceX: number, time: number) {
    if (this.state === 'dead') return;
    // Shades are invulnerable while phased out
    if (this.type === 'shade' && this.isPhased) return;

    this.hp -= amount;
    this.hitstopUntil = time + HITSTOP_DURATION_MS;

    // Defer knockback until after hitstop ends
    const dir = this.sprite.x < sourceX ? -1 : 1;
    this.pendingKnockbackX = dir * KNOCKBACK_VELOCITY;
    const isFloater = this.type === 'flyer' || this.type === 'ghost' || this.type === 'shade';
    this.pendingKnockbackY = isFloater ? -30 : -100; // Upward pop on hit for juicier knockback

    // Freeze immediately for hitstop
    this.body.setVelocity(0, 0);

    // Flash white
    this.sprite.setTint(0xffffff);
    this.scene.time.delayedCall(80, () => {
      if (this.state !== 'dead') this.sprite.setTint(0xffaaaa);
      this.scene.time.delayedCall(80, () => {
        if (this.state !== 'dead') {
          // Re-apply poison tint if still poisoned, otherwise clear
          this.sprite.setTint(this.poisonTimer > 0 ? 0x88ff88 : 0xffffff);
          if (this.poisonTimer <= 0) this.sprite.clearTint();
        }
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
    playSound('enemyDeath');

    // Grant XP and spawn loot
    const gameScene = this.scene as any;
    if (gameScene.player) {
      gameScene.player.gainXP(this.xpValue);
    }
    if (gameScene.spawnLootDrop) {
      // Tougher enemies have higher drop rate and quality boost
      const dropBoost = (this.type === 'charger' || this.type === 'shade') ? 0.15 : 0;
      gameScene.spawnLootDrop(this.sprite.x, this.sprite.y, dropBoost);
    }

    // Brief slow-mo on kill (scene-level timestamp prevents stacking)
    const gs = this.scene as any;
    const now = this.scene.time.now;
    const slowEnd = (gs._killSlowEnd ?? 0) as number;
    if (now > slowEnd) {
      this.scene.physics.world.timeScale = 2;
      gs._killSlowEnd = now + 80;
      this.scene.time.delayedCall(80, () => { this.scene.physics.world.timeScale = 1; });
    }

    // Subtle screen shake on enemy death
    safeShake(this.scene.cameras.main, 40, 0.004);

    // Death burst — larger and more dramatic with type-specific colors
    const burstColors = this.type === 'ghost' || this.type === 'shade'
      ? [0x8844cc, 0xaa66ff, 0x6622aa]
      : this.type === 'skeleton' || this.type === 'bone_archer'
      ? [0xccccaa, 0xddddcc, 0xaa9988]
      : [0xff4444, 0xff6644, 0xffaa44];

    const deathBurst = this.scene.add.particles(this.sprite.x, this.sprite.y - 8, 'particle', {
      speed: { min: 40, max: 120 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.2, end: 0 },
      lifespan: 400,
      tint: burstColors,
      quantity: 12,
      emitting: false,
    });
    deathBurst.explode(12);
    this.scene.time.delayedCall(500, () => deathBurst.destroy());

    // Hide sprite instead of destroying — avoids group/physics desync
    this.sprite.setActive(false).setVisible(false);
    this.body.enable = false;
    this.hpBar.clear();
    this.hpBarBg.clear();

    // Respawn after delay (for testing — remove later)
    this.scene.time.delayedCall(5000, () => {
      this.respawn();
    });
  }

  private respawn() {
    this.hp = this.maxHp;
    this.state = 'patrol';
    this.poisonTimer = 0;
    this.poisonSlowMult = 1;

    // Re-enable the existing sprite at spawn position
    this.sprite.setPosition(this.spawnX, this.spawnY);
    this.sprite.setActive(true).setVisible(true);
    this.sprite.clearTint();
    this.body.enable = true;
    this.body.setVelocity(0, 0);

    // Restore type-specific physics settings
    if (this.type === 'charger') {
      this.body.setSize(18, 22);
      this.body.setOffset(3, 2);
      this.chargeState = 'idle';
      this.chargeTimer = 0;
      this.chargeDir = 0;
    } else if (this.type === 'shade') {
      this.body.setSize(12, 14);
      this.body.setOffset(4, 2);
      this.isPhased = false;
      this.shadePhaseTimer = 2500;
      this.shadePhaseCount = 0;
      this.sprite.setAlpha(1);
    } else if (this.type === 'ghost') {
      this.body.setSize(12, 14);
      this.body.setOffset(4, 2);
    } else {
      this.body.setSize(14, 18);
      this.body.setOffset(3, 2);
    }
    if (this.type === 'flyer' || this.type === 'ghost' || this.type === 'shade') this.body.setAllowGravity(false);
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
