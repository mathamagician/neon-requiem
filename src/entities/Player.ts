import Phaser from 'phaser';
import { safeShake } from '../systems/AccessibilitySettings';
import { playSound } from '../systems/SoundManager';
import { readGamepad, type GamepadState } from '../systems/GamepadInput';
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

type PlayerState = 'idle' | 'run' | 'jump' | 'fall' | 'attack' | 'hurt' | 'dash' | 'shield';

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
  attackCombo = 0; // 0=spear, 1=sword, 2=shield punch
  attackTimer = 0;
  attackCooldown = 0;
  isAttacking = false;
  private comboResetTimer = 0; // ms until combo resets to spear (0)
  private readonly COMBO_RESET_MS = 400; // time after attack ends before combo resets
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

  // Shield system — Vanguard's signature mechanic
  isShielding = false;
  private shieldHp = 50;
  private maxShieldHp = 50;
  private shieldRegenDelay = 0; // ms until shield starts regenerating
  private shieldGraphic: Phaser.GameObjects.Graphics;
  private shieldFlashUntil = 0;

  // Drop-through platforms (double-tap down)
  droppingThrough = false;
  private lastDownPress = 0;
  private readonly DROP_TAP_WINDOW = 250; // ms between taps

  // Pogo attack (hold attack + down while airborne)
  isPogoing = false;
  private pogoHitCooldown = 0;
  private readonly POGO_BOUNCE_VEL = -260; // upward bounce on hit
  private readonly POGO_DAMAGE = 14;
  private readonly POGO_FALL_BOOST = 100; // extra downward speed during pogo

  // Input
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: {
    attack: Phaser.Input.Keyboard.Key;
    dash: Phaser.Input.Keyboard.Key;
    up: Phaser.Input.Keyboard.Key;
    shield: Phaser.Input.Keyboard.Key;
  };

  // Particles
  private gp: GamepadState | null = null;
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
      shield: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
    };

    // Shield visual
    this.shieldGraphic = scene.add.graphics();
    this.shieldGraphic.setDepth(12);

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
    this.gp = readGamepad(this.scene);
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
    // wasOnFloor updated after landing dust check (below)

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
      } else {
        this.updateSlashPosition();
      }
    }

    // Combo reset — if not attacking for a while, reset to spear (0)
    if (!this.isAttacking && this.comboResetTimer > 0) {
      this.comboResetTimer -= dt;
      if (this.comboResetTimer <= 0) {
        this.attackCombo = 0;
        this.comboResetTimer = 0;
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

    // Shield
    this.handleShield(delta);

    // Drop-through platforms (double-tap down)
    this.handleDropThrough(onFloor);

    // Handle input
    this.handleMovement(onFloor);
    this.handleJump(onFloor);
    this.handleAttack(time);
    this.handlePogo(onFloor, time);
    this.handleDash(time);

    // Update state
    this.updateState(onFloor);

    // Pogo cooldown tick
    if (this.pogoHitCooldown > 0) this.pogoHitCooldown -= dt;

    // Landing: cancel pogo, emit dust
    if (onFloor && !this.wasOnFloor) {
      this.isPogoing = false;
      this.emitDust(4);
      playSound('land');
    }
    this.wasOnFloor = onFloor;

    // Draw shield visual
    this.drawShield(time);
  }

  private handleMovement(onFloor: boolean) {
    if (this.isAttacking && onFloor) {
      // Slow movement during ground attacks
      this.body.setVelocityX(this.body.velocity.x * 0.8);
      return;
    }

    // Slow movement while shielding
    const shieldMult = this.isShielding ? 0.4 : 1;

    const left = this.cursors.left.isDown || !!this.gp?.left;
    const right = this.cursors.right.isDown || !!this.gp?.right;

    if (left) {
      this.body.setVelocityX(-PLAYER_SPEED * shieldMult);
      this.facingRight = false;
      this.sprite.setFlipX(true);
    } else if (right) {
      this.body.setVelocityX(PLAYER_SPEED * shieldMult);
      this.facingRight = true;
      this.sprite.setFlipX(false);
    } else {
      // Deceleration — snappy ground stops, floaty air control
      if (onFloor) {
        this.body.setVelocityX(this.body.velocity.x * 0.6);
        if (Math.abs(this.body.velocity.x) < 8) this.body.setVelocityX(0);
      } else {
        this.body.setVelocityX(this.body.velocity.x * 0.9);
      }
    }
  }

  private handleJump(onFloor: boolean) {
    const jumpPressed = Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
                        Phaser.Input.Keyboard.JustDown(this.keys.up) ||
                        !!this.gp?.jumpJust;

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
      playSound('jump');
    }

    // Variable jump height — release early for short hop
    if ((this.cursors.up.isUp && this.keys.up.isUp && !this.gp?.jump) && this.body.velocity.y < PLAYER_JUMP_VELOCITY * 0.4) {
      this.body.setVelocityY(this.body.velocity.y * 0.5);
    }
  }

  private handleAttack(time: number) {
    if (!Phaser.Input.Keyboard.JustDown(this.keys.attack) && !this.gp?.attackJust) return;
    if (this.attackCooldown > 0) return;
    if (this.isDashing) return;

    this.startAttack(time);
  }

  private handleDash(_time: number) {
    if (!Phaser.Input.Keyboard.JustDown(this.keys.dash) && !this.gp?.dashJust) return;
    if (this.dashCooldown > 0 || this.isDashing) return;

    this.isDashing = true;
    this.dashTimer = this.DASH_DURATION;
    this.dashCooldown = this.DASH_COOLDOWN;
    playSound('dash');
    this.invincibleUntil = Math.max(this.invincibleUntil, _time + this.DASH_DURATION);

    // Dash burst particles
    this.emitDust(6);
  }

  /** Pogo attack: hold attack + down while airborne → plunge downward with spear */
  private handlePogo(onFloor: boolean, _time: number) {
    if (onFloor || this.isDashing) {
      if (this.isPogoing) {
        this.isPogoing = false;
        // Clean up pogo spear visual
        if (this.slashSprite && this.slashSprite.rotation !== 0) {
          this.slashSprite.destroy();
          this.slashSprite = null;
        }
      }
      return;
    }

    // Activate pogo: hold attack + down while in the air
    const holdingAttack = this.keys.attack.isDown || !!this.gp?.attack;
    const holdingDown = this.cursors.down.isDown || !!this.gp?.down;

    if (holdingAttack && holdingDown && !this.isPogoing) {
      this.isPogoing = true;
      playSound('spearThrust');
    }

    // Cancel pogo if player releases keys
    if (this.isPogoing && (!holdingAttack || !holdingDown)) {
      this.isPogoing = false;
      if (this.slashSprite && this.slashSprite.rotation !== 0) {
        this.slashSprite.destroy();
        this.slashSprite = null;
      }
      return;
    }

    if (this.isPogoing) {
      // Boost downward speed for a fast plunge
      if (this.body.velocity.y < this.POGO_FALL_BOOST) {
        this.body.setVelocityY(this.body.velocity.y + 15);
      }

      // Create/update downward spear visual
      if (!this.slashSprite || this.slashSprite.rotation === 0) {
        if (this.slashSprite) this.slashSprite.destroy();
        const textureKey = this.scene.textures.exists('weapon-spear') ? 'weapon-spear' : 'slash';
        this.slashSprite = this.scene.add.sprite(
          this.sprite.x,
          this.sprite.y + 4,
          textureKey
        );
        this.slashSprite.setDisplaySize(8, 28); // rotated: narrow and tall
        this.slashSprite.setRotation(Math.PI / 2); // point downward
        this.slashSprite.setAlpha(0.9);
        this.slashSprite.setDepth(10);
      } else {
        // Track player position
        this.slashSprite.setPosition(this.sprite.x, this.sprite.y + 4);
      }
    }
  }

  /** Called by CombatSystem when pogo hits an enemy — bounce up */
  pogoBounce() {
    this.body.setVelocityY(this.POGO_BOUNCE_VEL);
    playSound('swordHit');
    this.pogoHitCooldown = 200; // brief invulnerability between pogo hits
  }

  private startAttack(time: number) {
    this.isAttacking = true;

    // Combo chain: if pressing attack within the combo window, advance.
    // Otherwise always start with spear (combo 0).
    if (this.comboResetTimer > 0 && this.attackCombo < 2) {
      // Within combo window — advance: spear→sword→shield
      this.attackCombo++;
    } else {
      // Too slow or chain complete — reset to spear
      this.attackCombo = 0;
    }

    // Attack 0: Spear thrust (fast, medium range)
    // Attack 1: Sword slash (standard, close range, higher damage)
    // Attack 2: Shield punch (slow windup, pushback + stagger)
    const durations = [180, 220, 320];
    this.attackTimer = durations[this.attackCombo];
    this.attackCooldown = 50;
    this.comboResetTimer = 0; // Clear — will be set fresh in endAttack

    this.createSlash(time);
    const sounds = ['spearThrust', 'swordSwing', 'shieldPunch'];
    playSound(sounds[this.attackCombo] as any);
  }

  private createSlash(_time: number) {
    if (this.slashSprite) this.slashSprite.destroy();

    const dir = this.facingRight ? 1 : -1;

    // Hitbox offset and size varies per combo attack
    // Spear: far reach, narrow | Sword: medium, wide | Shield: close, very wide
    const offsets = [24, 16, 12]; // distance from player center
    const widths = [28, 24, 30];
    const heights = [8, 14, 16];
    const offsetX = dir * offsets[this.attackCombo];
    const offsetY = this.attackCombo === 0 ? -22 : -16; // spear at shoulder height

    const w = widths[this.attackCombo];
    const h = heights[this.attackCombo];

    // Use different texture keys for weapon visuals
    const textures = ['weapon-spear', 'weapon-sword', 'weapon-shield'];
    const textureKey = this.scene.textures.exists(textures[this.attackCombo])
      ? textures[this.attackCombo] : 'slash';

    this.slashSprite = this.scene.add.sprite(
      this.sprite.x + offsetX,
      this.sprite.y + offsetY,
      textureKey
    );
    this.slashSprite.setDisplaySize(w, h);
    this.slashSprite.setAlpha(0.8);
    this.slashSprite.setFlipX(!this.facingRight);
    this.slashSprite.setDepth(10);

    // Rotation per attack
    const rotations = [0, -0.2, 0];
    this.slashSprite.setRotation(rotations[this.attackCombo] * dir);

    // Forward lunge — spear has moderate, shield punch has big
    const lunges = [60, 40, 100];
    this.body.setVelocityX(dir * lunges[this.attackCombo]);
  }

  private updateSlashPosition() {
    if (!this.slashSprite) return;
    const dir = this.facingRight ? 1 : -1;
    const offsets = [24, 16, 12];
    const offsetY = this.attackCombo === 0 ? -22 : -16;
    this.slashSprite.setPosition(
      this.sprite.x + dir * offsets[this.attackCombo],
      this.sprite.y + offsetY
    );
  }

  private endAttack() {
    this.isAttacking = false;
    if (this.slashSprite) {
      this.slashSprite.destroy();
      this.slashSprite = null;
    }
    // Start combo reset countdown — if player attacks again before this expires,
    // they advance to the next weapon in the chain. Otherwise resets to spear.
    this.comboResetTimer = this.COMBO_RESET_MS;
  }

  private updateState(onFloor: boolean) {
    if (this.isDashing) {
      this.state = 'dash';
    } else if (this.isShielding) {
      this.state = 'shield';
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
    playSound('playerHurt');
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
    this.scene.time.delayedCall(100, () => { if (this.sprite.active) this.sprite.clearTint(); });

    this.state = 'hurt';
    this.scene.time.delayedCall(200, () => {
      if (this.state === 'hurt') this.state = 'idle';
    });

    if (this.hp <= 0) {
      playSound('playerDeath');
      this.die();
    }
  }

  /** Called when the player's attack hits an enemy */
  onAttackHit(time: number) {
    this.hitstopUntil = time + HITSTOP_DURATION_MS;
    safeShake(this.scene.cameras.main, 50, 0.005);
    this.gainEnergy(3);
    playSound('swordHit');
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
      this.sprite.setTint(0x44ffff);
      this.scene.time.delayedCall(200, () => this.sprite.clearTint());
      playSound('levelUp');
      (this.scene as any).onPlayerLevelUp?.();
    }
  }

  gainEnergy(amount: number) {
    this.energy = Math.min(this.maxEnergy, this.energy + amount);
  }

  private handleShield(delta: number) {
    this.isShielding = (this.keys.shield.isDown || !!this.gp?.shield) && !this.isDashing && !this.isAttacking;

    // Shield regen when not blocking
    if (!this.isShielding) {
      if (this.shieldRegenDelay > 0) {
        this.shieldRegenDelay -= delta;
      } else {
        this.shieldHp = Math.min(this.maxShieldHp, this.shieldHp + delta * 0.02);
      }
    }
  }

  private handleDropThrough(onFloor: boolean) {
    const downJust = Phaser.Input.Keyboard.JustDown(this.cursors.down) || !!this.gp?.downJust;
    if (downJust && onFloor) {
      const now = this.scene.time.now;
      if (now - this.lastDownPress < this.DROP_TAP_WINDOW) {
        this.droppingThrough = true;
        this.body.setVelocityY(40); // Small nudge through platform
        this.scene.time.delayedCall(200, () => { this.droppingThrough = false; });
        this.lastDownPress = 0; // Reset to prevent triple-tap
      } else {
        this.lastDownPress = now;
      }
    }
  }

  /** Called when shield absorbs a hit. Returns true if shield blocked, false if shield broke. */
  shieldBlock(damage: number, time: number): boolean {
    if (!this.isShielding || this.shieldHp <= 0) return false;

    // Check facing: only blocks attacks from the front
    // (caller must verify source direction)

    const absorbed = Math.min(this.shieldHp, damage);
    this.shieldHp -= absorbed;
    playSound('shieldBlock');
    this.shieldRegenDelay = 1500; // 1.5s before shield starts regenerating
    this.shieldFlashUntil = time + 100;

    // Convert absorbed damage to energy — this is the Vanguard's unique resource loop
    this.gainEnergy(Math.ceil(absorbed * 0.4));

    // Shield break
    if (this.shieldHp <= 0) {
      this.shieldHp = 0;
      this.shieldRegenDelay = 3000; // Longer regen delay on break
      // Stagger the player briefly
      safeShake(this.scene.cameras.main, 80, 0.008);
      return false; // Shield broke — remaining damage gets through
    }

    // Successful block — knockback is reduced
    safeShake(this.scene.cameras.main, 40, 0.004);
    return true;
  }

  private drawShield(time: number) {
    this.shieldGraphic.clear();
    if (!this.isShielding && this.shieldHp >= this.maxShieldHp) return;

    const dir = this.facingRight ? 1 : -1;
    const sx = this.sprite.x + dir * 10;
    const sy = this.sprite.y - 20;

    if (this.isShielding) {
      // Shield arc
      const flash = time < this.shieldFlashUntil;
      const color = flash ? 0xffffff : COLORS.vanguard;
      const alpha = 0.4 + (this.shieldHp / this.maxShieldHp) * 0.4;
      this.shieldGraphic.lineStyle(2, color, alpha);
      // Draw arc facing direction
      const startAngle = this.facingRight ? -1.2 : Math.PI - 1.2 + 0.8;
      this.shieldGraphic.beginPath();
      this.shieldGraphic.arc(sx, sy, 12, startAngle, startAngle + 1.6, false);
      this.shieldGraphic.strokePath();

      // Inner glow
      this.shieldGraphic.lineStyle(1, color, alpha * 0.5);
      this.shieldGraphic.beginPath();
      this.shieldGraphic.arc(sx, sy, 10, startAngle, startAngle + 1.6, false);
      this.shieldGraphic.strokePath();
    }

    // Shield HP bar (shown when not full)
    if (this.shieldHp < this.maxShieldHp) {
      const barX = this.sprite.x - 10;
      const barY = this.sprite.y - this.sprite.height - 10;
      const barW = 20;
      const barH = 2;
      const ratio = this.shieldHp / this.maxShieldHp;
      this.shieldGraphic.fillStyle(0x222244);
      this.shieldGraphic.fillRect(barX, barY, barW, barH);
      this.shieldGraphic.fillStyle(COLORS.vanguard);
      this.shieldGraphic.fillRect(barX, barY, barW * ratio, barH);
    }
  }

  /** Clean up all owned game objects (call before destroying this player) */
  destroy() {
    this.shieldGraphic.destroy();
    this.dustEmitter.destroy();
    this.hitEmitter.destroy();
    this.slashSprite?.destroy();
  }

  private die() {
    // Respawn at zone spawn point
    const gs = this.scene as any;
    const spawnX = gs.zoneDef?.exits?.[0] ? (gs.zoneDef.exits[0].tileX + 1) * 16 : 48;
    const spawnY = (gs.zoneDef?.height ?? 22) * 16 - 80;
    this.sprite.setPosition(spawnX, spawnY);
    this.hp = this.maxHp;
    this.energy = this.maxEnergy;
    this.shieldHp = this.maxShieldHp;
    this.shieldRegenDelay = 0;
    this.shieldGraphic.clear();
    this.scene.cameras.main.flash(300, 255, 50, 50);
  }

  private emitDust(count: number) {
    this.dustEmitter.emitParticleAt(this.sprite.x, this.sprite.y, count);
  }

  /** Get the attack hitbox in world coords (used by CombatSystem) */
  getAttackHitbox(): Phaser.Geom.Rectangle | null {
    // Pogo attack: hitbox below the player's feet
    if (this.isPogoing && this.pogoHitCooldown <= 0) {
      return new Phaser.Geom.Rectangle(
        this.sprite.x - 8,
        this.sprite.y - 4,
        16,
        16
      );
    }

    if (!this.isAttacking || !this.slashSprite) return null;
    const widths = [28, 24, 30]; // spear wide reach, sword medium, shield wide
    const heights = [18, 14, 16]; // spear hitbox tall to cover low enemies despite high visual
    const w = widths[this.attackCombo];
    const h = heights[this.attackCombo];
    return new Phaser.Geom.Rectangle(
      this.slashSprite.x - w / 2,
      this.slashSprite.y - h / 2,
      w,
      h
    );
  }

  /** Is the current attack a shield punch (combo hit 2)? Used by CombatSystem for stagger. */
  isShieldPunch(): boolean {
    return this.attackCombo === 2 && this.isAttacking;
  }

  /** Damage dealt by current attack combo step, scaled by might + skills */
  getAttackDamage(): number {
    // Pogo attack damage
    if (this.isPogoing) return this.POGO_DAMAGE;

    // Spear: moderate | Sword: high | Shield punch: moderate but staggers
    const damages = [10, 16, 12];
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
