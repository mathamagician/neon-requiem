import Phaser from 'phaser';
import { safeShake } from '../systems/AccessibilitySettings';
import {
  PLAYER_SPEED,
  PLAYER_JUMP_VELOCITY,
  PLAYER_MAX_HP,
  PLAYER_MAX_ENERGY,
  COYOTE_TIME_MS,
  JUMP_BUFFER_MS,
  INVINCIBILITY_FRAMES_MS,
  HITSTOP_DURATION_MS,
  KNOCKBACK_VELOCITY,
  COLORS,
} from '../../shared/constants';

type PlayerState = 'idle' | 'run' | 'jump' | 'fall' | 'attack' | 'hurt' | 'dash';

export class Player {
  scene: Phaser.Scene;
  sprite: Phaser.Physics.Arcade.Sprite;
  body: Phaser.Physics.Arcade.Body;

  // State
  state: PlayerState = 'idle';
  facingRight = true;
  hp: number;
  maxHp: number;
  energy: number;
  maxEnergy: number;
  level = 1;
  xp = 0;
  xpToNext = 100;

  // Combat
  attackCombo = 0; // 0, 1, 2 for 3-hit chain
  attackTimer = 0;
  attackCooldown = 0;
  isAttacking = false;
  slashSprite: Phaser.GameObjects.Sprite | null = null;
  invincibleUntil = 0;
  hitstopUntil = 0;

  // Movement feel
  private coyoteTimeLeft = 0;
  private jumpBuffered = false;
  private jumpBufferTimer = 0;
  private wasOnFloor = false;

  // Dash
  private dashCooldown = 0;
  private isDashing = false;
  private dashTimer = 0;
  private readonly DASH_DURATION = 150;
  private readonly DASH_SPEED = 300;
  private readonly DASH_COOLDOWN = 600;

  // Input
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: {
    attack: Phaser.Input.Keyboard.Key;
    dash: Phaser.Input.Keyboard.Key;
    up: Phaser.Input.Keyboard.Key;
  };

  // Particles
  private dustEmitter: Phaser.GameObjects.Particles.ParticleEmitter;
  private hitEmitter: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.hp = PLAYER_MAX_HP;
    this.maxHp = PLAYER_MAX_HP;
    this.energy = PLAYER_MAX_ENERGY;
    this.maxEnergy = PLAYER_MAX_ENERGY;

    // Create sprite
    this.sprite = scene.physics.add.sprite(x, y, 'player');
    this.sprite.setOrigin(0.5, 1);
    this.body = this.sprite.body as Phaser.Physics.Arcade.Body;
    this.body.setSize(14, 36);
    this.body.setOffset(9, 5);
    this.body.setCollideWorldBounds(true);
    this.body.setMaxVelocityY(600);

    // Store reference on sprite for collision callbacks
    (this.sprite as any).owner = this;

    // Input
    this.cursors = scene.input.keyboard!.createCursorKeys();
    this.keys = {
      attack: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.Z),
      dash: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.X),
      up: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
    };

    // Particles
    this.dustEmitter = scene.add.particles(0, 0, 'particle', {
      speed: { min: 10, max: 30 },
      angle: { min: 220, max: 320 },
      scale: { start: 0.8, end: 0 },
      lifespan: 200,
      tint: 0x556677,
      emitting: false,
    });

    this.hitEmitter = scene.add.particles(0, 0, 'particle-hit', {
      speed: { min: 40, max: 100 },
      angle: { min: 0, max: 360 },
      scale: { start: 1, end: 0 },
      lifespan: 150,
      tint: COLORS.neon,
      emitting: false,
    });
  }

  update(time: number, delta: number) {
    const dt = delta;
    const onFloor = this.body.onFloor();

    // Hitstop — freeze everything
    if (time < this.hitstopUntil) {
      this.body.setVelocity(0, 0);
      this.body.setAllowGravity(false);
      return;
    }
    this.body.setAllowGravity(true);

    // Invincibility flash
    if (time < this.invincibleUntil) {
      this.sprite.setAlpha(Math.sin(time * 0.02) > 0 ? 1 : 0.3);
    } else {
      this.sprite.setAlpha(1);
    }

    // Coyote time tracking
    if (onFloor) {
      this.coyoteTimeLeft = COYOTE_TIME_MS;
    } else if (this.wasOnFloor && !onFloor && this.body.velocity.y >= 0) {
      // Just left the ground (didn't jump) — start coyote timer
    }
    if (!onFloor) {
      this.coyoteTimeLeft = Math.max(0, this.coyoteTimeLeft - dt);
    }
    this.wasOnFloor = onFloor;

    // Jump buffer
    if (this.jumpBuffered) {
      this.jumpBufferTimer -= dt;
      if (this.jumpBufferTimer <= 0) this.jumpBuffered = false;
    }

    // Attack timer
    if (this.attackCooldown > 0) this.attackCooldown -= dt;
    if (this.isAttacking) {
      this.attackTimer -= dt;
      if (this.attackTimer <= 0) {
        this.endAttack();
      }
    }

    // Dash timer
    if (this.dashCooldown > 0) this.dashCooldown -= dt;
    if (this.isDashing) {
      this.dashTimer -= dt;
      if (this.dashTimer <= 0) {
        this.isDashing = false;
        this.body.setAllowGravity(true);
      } else {
        // During dash: move fast in facing direction, no gravity
        const dir = this.facingRight ? 1 : -1;
        this.body.setVelocityX(dir * this.DASH_SPEED);
        this.body.setVelocityY(0);
        this.body.setAllowGravity(false);
        this.state = 'dash';
        // Dash trail effect
        this.sprite.setAlpha(0.6);
        return;
      }
    }

    // Hurt state
    if (this.state === 'hurt') return;

    // Handle input
    this.handleMovement(onFloor);
    this.handleJump(onFloor);
    this.handleAttack(time);
    this.handleDash(time);

    // Update state
    this.updateState(onFloor);

    // Landing dust
    if (onFloor && !this.wasOnFloor) {
      this.emitDust(4);
    }
  }

  private handleMovement(onFloor: boolean) {
    if (this.isAttacking && onFloor) {
      // Slow movement during ground attacks
      this.body.setVelocityX(this.body.velocity.x * 0.8);
      return;
    }

    const left = this.cursors.left.isDown;
    const right = this.cursors.right.isDown;

    if (left) {
      this.body.setVelocityX(-PLAYER_SPEED);
      this.facingRight = false;
      this.sprite.setFlipX(true);
    } else if (right) {
      this.body.setVelocityX(PLAYER_SPEED);
      this.facingRight = true;
      this.sprite.setFlipX(false);
    } else {
      // Deceleration
      if (onFloor) {
        this.body.setVelocityX(this.body.velocity.x * 0.7);
      } else {
        this.body.setVelocityX(this.body.velocity.x * 0.92);
      }
    }
  }

  private handleJump(onFloor: boolean) {
    const jumpPressed = Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
                        Phaser.Input.Keyboard.JustDown(this.keys.up);

    if (jumpPressed) {
      this.jumpBuffered = true;
      this.jumpBufferTimer = JUMP_BUFFER_MS;
    }

    const canJump = onFloor || this.coyoteTimeLeft > 0;

    if (this.jumpBuffered && canJump) {
      this.body.setVelocityY(PLAYER_JUMP_VELOCITY);
      this.jumpBuffered = false;
      this.coyoteTimeLeft = 0;
      this.emitDust(3);
    }

    // Variable jump height — release early for short hop
    if ((this.cursors.up.isUp && this.keys.up.isUp) && this.body.velocity.y < PLAYER_JUMP_VELOCITY * 0.4) {
      this.body.setVelocityY(this.body.velocity.y * 0.5);
    }
  }

  private handleAttack(time: number) {
    if (!Phaser.Input.Keyboard.JustDown(this.keys.attack)) return;
    if (this.attackCooldown > 0) return;
    if (this.isDashing) return;

    this.startAttack(time);
  }

  private handleDash(_time: number) {
    if (!Phaser.Input.Keyboard.JustDown(this.keys.dash)) return;
    if (this.dashCooldown > 0 || this.isDashing) return;

    this.isDashing = true;
    this.dashTimer = this.DASH_DURATION;
    this.dashCooldown = this.DASH_COOLDOWN;
    this.invincibleUntil = Math.max(this.invincibleUntil, _time + this.DASH_DURATION);

    // Dash burst particles
    this.emitDust(6);
  }

  private startAttack(time: number) {
    this.isAttacking = true;

    // Combo chain: timing window for next hit
    if (this.attackCombo < 2 && this.attackTimer > -200) {
      this.attackCombo++;
    } else {
      this.attackCombo = 0;
    }

    // Attack duration varies by combo hit
    const durations = [200, 180, 300]; // 3rd hit is slower but stronger
    this.attackTimer = durations[this.attackCombo];
    this.attackCooldown = 80;

    // Create slash hitbox visual
    this.createSlash(time);
  }

  private createSlash(_time: number) {
    if (this.slashSprite) this.slashSprite.destroy();

    const dir = this.facingRight ? 1 : -1;
    const offsetX = dir * 16;
    const offsetY = -16;

    // Size varies by combo
    const widths = [20, 22, 28];
    const heights = [10, 10, 14];
    const w = widths[this.attackCombo];
    const h = heights[this.attackCombo];

    this.slashSprite = this.scene.add.sprite(
      this.sprite.x + offsetX,
      this.sprite.y + offsetY,
      'slash'
    );
    this.slashSprite.setDisplaySize(w, h);
    this.slashSprite.setAlpha(0.7);
    this.slashSprite.setFlipX(!this.facingRight);
    this.slashSprite.setDepth(10);

    // Rotation for variety
    const rotations = [0, -0.15, 0.3];
    this.slashSprite.setRotation(rotations[this.attackCombo] * dir);

    // Slight forward lunge on combo 3
    if (this.attackCombo === 2) {
      this.body.setVelocityX(dir * 80);
    }
  }

  private endAttack() {
    this.isAttacking = false;
    if (this.slashSprite) {
      this.slashSprite.destroy();
      this.slashSprite = null;
    }
    // Reset combo after delay if no follow-up
    this.scene.time.delayedCall(300, () => {
      if (!this.isAttacking) this.attackCombo = 0;
    });
  }

  private updateState(onFloor: boolean) {
    if (this.isDashing) {
      this.state = 'dash';
    } else if (this.isAttacking) {
      this.state = 'attack';
    } else if (!onFloor && this.body.velocity.y < 0) {
      this.state = 'jump';
    } else if (!onFloor && this.body.velocity.y > 0) {
      this.state = 'fall';
    } else if (Math.abs(this.body.velocity.x) > 10) {
      this.state = 'run';
    } else {
      this.state = 'idle';
    }
  }

  /** Called by CombatSystem when this player is hit */
  takeDamage(amount: number, sourceX: number, time: number) {
    if (time < this.invincibleUntil) return;

    // Vitality damage reduction: -2% per vitality above 5, capped at 40%
    const inv = (this.scene as any).getInventory?.();
    const vitality = inv ? inv.getEffectiveStat('vitality') : 5;
    const reduction = Math.min(0.4, Math.max(0, (vitality - 5) * 0.02));
    const finalDmg = Math.max(1, Math.round(amount * (1 - reduction)));

    this.hp = Math.max(0, this.hp - finalDmg);
    this.invincibleUntil = time + INVINCIBILITY_FRAMES_MS;
    this.hitstopUntil = time + HITSTOP_DURATION_MS;

    // Knockback away from source
    const dir = this.sprite.x < sourceX ? -1 : 1;
    this.body.setVelocityX(dir * KNOCKBACK_VELOCITY);
    this.body.setVelocityY(-120);

    // Screen shake
    safeShake(this.scene.cameras.main, 100, 0.01);

    // Hit particles
    this.hitEmitter.emitParticleAt(this.sprite.x, this.sprite.y - 12, 8);

    // Flash red
    this.sprite.setTint(0xff4444);
    this.scene.time.delayedCall(100, () => this.sprite.clearTint());

    this.state = 'hurt';
    this.scene.time.delayedCall(300, () => {
      if (this.state === 'hurt') this.state = 'idle';
    });

    if (this.hp <= 0) {
      this.die();
    }
  }

  /** Called when the player's attack hits an enemy */
  onAttackHit(time: number) {
    this.hitstopUntil = time + HITSTOP_DURATION_MS;
    safeShake(this.scene.cameras.main, 50, 0.005);
    this.gainEnergy(3);
  }

  gainXP(amount: number) {
    this.xp += amount;
    if (this.xp >= this.xpToNext) {
      this.xp -= this.xpToNext;
      this.level++;
      this.xpToNext = Math.floor(this.xpToNext * 1.3);
      // Vitality scaling: base +8 HP, plus +2 HP per vitality above 5
      const inv = (this.scene as any).getInventory?.();
      const vitalityBonus = inv ? Math.max(0, inv.getEffectiveStat('vitality') - 5) * 2 : 0;
      this.maxHp += 8 + vitalityBonus;
      this.hp = this.maxHp;
      this.maxEnergy += 3;
      this.energy = this.maxEnergy;
      this.sprite.setTint(0xffffff);
      this.scene.time.delayedCall(200, () => this.sprite.clearTint());
      (this.scene as any).onPlayerLevelUp?.();
    }
  }

  gainEnergy(amount: number) {
    this.energy = Math.min(this.maxEnergy, this.energy + amount);
  }

  private die() {
    // For now: respawn at start
    this.sprite.setPosition(48, 100);
    this.hp = this.maxHp;
    this.energy = this.maxEnergy;
    this.scene.cameras.main.flash(300, 255, 50, 50);
  }

  private emitDust(count: number) {
    this.dustEmitter.emitParticleAt(this.sprite.x, this.sprite.y, count);
  }

  /** Get the attack hitbox in world coords (used by CombatSystem) */
  getAttackHitbox(): Phaser.Geom.Rectangle | null {
    if (!this.isAttacking || !this.slashSprite) return null;
    const widths = [20, 22, 28];
    const heights = [10, 10, 14];
    const w = widths[this.attackCombo];
    const h = heights[this.attackCombo];
    return new Phaser.Geom.Rectangle(
      this.slashSprite.x - w / 2,
      this.slashSprite.y - h / 2,
      w,
      h
    );
  }

  /** Damage dealt by current attack combo step, scaled by might + skills */
  getAttackDamage(): number {
    const damages = [10, 12, 20]; // 3rd hit deals most
    let dmg = damages[this.attackCombo];

    // Stat scaling: +4% melee damage per might above 5
    const inv = (this.scene as any).getInventory?.();
    if (inv) {
      const might = inv.getEffectiveStat('might');
      dmg = Math.round(dmg * (1 + (might - 5) * 0.04));

      // Skill: meleeDamageBonus (percentage)
      const meleeBonus = inv.getSkillEffect('meleeDamageBonus');
      if (meleeBonus) dmg = Math.round(dmg * (1 + meleeBonus));

      // Skill: finisherDamageBonus — applies only to 3rd hit
      if (this.attackCombo === 2) {
        const finisherBonus = inv.getSkillEffect('finisherDamageBonus');
        if (finisherBonus) dmg = Math.round(dmg * (1 + finisherBonus));
      }
    }
    return dmg;
  }
}
