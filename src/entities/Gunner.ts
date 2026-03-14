import Phaser from 'phaser';
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

type GunnerState = 'idle' | 'run' | 'jump' | 'fall' | 'shoot' | 'charge' | 'hurt' | 'dash';

export class Gunner {
  scene: Phaser.Scene;
  sprite: Phaser.Physics.Arcade.Sprite;
  body: Phaser.Physics.Arcade.Body;

  state: GunnerState = 'idle';
  facingRight = true;
  hp: number;
  maxHp: number;
  energy: number;
  maxEnergy: number;
  level = 1;
  xp = 0;
  xpToNext = 100;

  // Combat
  isAttacking = false;
  attackCombo = 0;
  private shootCooldown = 0;
  private chargeTime = 0;
  private isCharging = false;
  private readonly CHARGE_THRESHOLD = 400; // ms to fully charge
  invincibleUntil = 0;
  hitstopUntil = 0;

  // Projectile group
  projectiles: Phaser.Physics.Arcade.Group;

  // Movement
  private coyoteTimeLeft = 0;
  private jumpBuffered = false;
  private jumpBufferTimer = 0;
  private wasOnFloor = false;

  // Dash
  private dashCooldown = 0;
  private isDashing = false;
  private dashTimer = 0;
  private readonly DASH_DURATION = 150;
  private readonly DASH_SPEED = 280;
  private readonly DASH_COOLDOWN = 700;

  // Input
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: {
    attack: Phaser.Input.Keyboard.Key;
    dash: Phaser.Input.Keyboard.Key;
    up: Phaser.Input.Keyboard.Key;
  };

  // Particles
  private dustEmitter: Phaser.GameObjects.Particles.ParticleEmitter;

  // Charge visual
  private chargeIndicator: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.hp = Math.floor(PLAYER_MAX_HP * 0.85); // Gunner has less HP
    this.maxHp = this.hp;
    this.energy = Math.floor(PLAYER_MAX_ENERGY * 1.2); // More energy
    this.maxEnergy = this.energy;

    // Create sprite with gunner color
    const g = scene.add.graphics();
    g.fillStyle(COLORS.gunner);
    g.fillRect(0, 0, 14, 24);
    g.lineStyle(1, 0x66ffaa);
    g.strokeRect(0, 0, 14, 24);
    // Arm cannon indicator
    g.fillStyle(0xaaffcc);
    g.fillRect(10, 8, 4, 4);
    g.generateTexture('player-gunner', 14, 24);
    g.destroy();

    this.sprite = scene.physics.add.sprite(x, y, 'player-gunner');
    this.sprite.setOrigin(0.5, 1);
    this.body = this.sprite.body as Phaser.Physics.Arcade.Body;
    this.body.setSize(12, 22);
    this.body.setOffset(1, 2);
    this.body.setCollideWorldBounds(true);
    this.body.setMaxVelocityY(600);
    (this.sprite as any).owner = this;

    // Projectile group
    this.projectiles = scene.physics.add.group({
      defaultKey: 'projectile-player',
      maxSize: 20,
    });

    // Input (same as Vanguard)
    this.cursors = scene.input.keyboard!.createCursorKeys();
    this.keys = {
      attack: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.Z),
      dash: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.X),
      up: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
    };

    this.dustEmitter = scene.add.particles(0, 0, 'particle', {
      speed: { min: 10, max: 30 },
      angle: { min: 220, max: 320 },
      scale: { start: 0.8, end: 0 },
      lifespan: 200,
      tint: 0x556677,
      emitting: false,
    });

    this.chargeIndicator = scene.add.graphics();
    this.chargeIndicator.setDepth(15);
  }

  update(time: number, delta: number) {
    const onFloor = this.body.onFloor();

    // Hitstop
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

    // Coyote time
    if (onFloor) this.coyoteTimeLeft = COYOTE_TIME_MS;
    if (!onFloor) this.coyoteTimeLeft = Math.max(0, this.coyoteTimeLeft - delta);
    this.wasOnFloor = onFloor;

    // Jump buffer
    if (this.jumpBuffered) {
      this.jumpBufferTimer -= delta;
      if (this.jumpBufferTimer <= 0) this.jumpBuffered = false;
    }

    // Dash
    if (this.dashCooldown > 0) this.dashCooldown -= delta;
    if (this.isDashing) {
      this.dashTimer -= delta;
      if (this.dashTimer <= 0) {
        this.isDashing = false;
        this.body.setAllowGravity(true);
      } else {
        const dir = this.facingRight ? 1 : -1;
        this.body.setVelocityX(dir * this.DASH_SPEED);
        this.body.setVelocityY(0);
        this.body.setAllowGravity(false);
        this.sprite.setAlpha(0.6);
        return;
      }
    }

    if (this.state === 'hurt') return;

    this.handleMovement(onFloor);
    this.handleJump(onFloor);
    this.handleShooting(time, delta);
    this.handleDash(time);
    this.updateState(onFloor);

    // Shoot cooldown
    if (this.shootCooldown > 0) this.shootCooldown -= delta;

    // Update charge visual
    this.updateChargeVisual();
  }

  private handleMovement(onFloor: boolean) {
    // Slower while charging
    const speedMult = this.isCharging ? 0.5 : 1;
    const left = this.cursors.left.isDown;
    const right = this.cursors.right.isDown;

    if (left) {
      this.body.setVelocityX(-PLAYER_SPEED * speedMult);
      this.facingRight = false;
      this.sprite.setFlipX(true);
    } else if (right) {
      this.body.setVelocityX(PLAYER_SPEED * speedMult);
      this.facingRight = true;
      this.sprite.setFlipX(false);
    } else {
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
    }
    if ((this.cursors.up.isUp && this.keys.up.isUp) && this.body.velocity.y < PLAYER_JUMP_VELOCITY * 0.4) {
      this.body.setVelocityY(this.body.velocity.y * 0.5);
    }
  }

  private handleShooting(time: number, delta: number) {
    // Hold Z to charge, release to fire
    if (this.keys.attack.isDown) {
      if (!this.isCharging && this.shootCooldown <= 0) {
        this.isCharging = true;
        this.chargeTime = 0;
      }
      if (this.isCharging) {
        this.chargeTime += delta;
      }
    }

    if (Phaser.Input.Keyboard.JustUp(this.keys.attack) && this.isCharging) {
      this.fireProjectile(time);
      this.isCharging = false;
      this.chargeTime = 0;
    }

    // Quick tap = instant shot
    if (Phaser.Input.Keyboard.JustDown(this.keys.attack) && this.shootCooldown <= 0 && !this.isCharging) {
      // Will be handled on release or next frame
    }
  }

  private fireProjectile(_time: number) {
    const isCharged = this.chargeTime >= this.CHARGE_THRESHOLD;
    const dir = this.facingRight ? 1 : -1;

    const proj = this.projectiles.get(
      this.sprite.x + dir * 12,
      this.sprite.y - 12,
      'projectile-player'
    ) as Phaser.Physics.Arcade.Sprite;

    if (!proj) return;
    proj.setActive(true).setVisible(true);
    proj.body!.enable = true;

    const projBody = proj.body as Phaser.Physics.Arcade.Body;
    projBody.setAllowGravity(false);

    if (isCharged) {
      // Charge shot: bigger, faster, pierces
      proj.setDisplaySize(12, 6);
      projBody.setVelocity(dir * 200, 0);
      proj.setTint(0x00ffcc);
      (proj as any).damage = 25;
      (proj as any).piercing = true;
    } else {
      // Normal shot
      proj.setDisplaySize(8, 4);
      projBody.setVelocity(dir * 160, 0);
      proj.clearTint();
      (proj as any).damage = 8;
      (proj as any).piercing = false;
    }

    (proj as any).isPlayerProjectile = true;
    this.shootCooldown = isCharged ? 400 : 200;

    // Auto-destroy after 2 seconds
    this.scene.time.delayedCall(2000, () => {
      if (proj.active) {
        proj.setActive(false).setVisible(false);
        proj.body!.enable = false;
      }
    });

    // Recoil
    this.body.setVelocityX(this.body.velocity.x - dir * 30);

    this.isAttacking = true;
    this.scene.time.delayedCall(150, () => { this.isAttacking = false; });
  }

  private handleDash(time: number) {
    if (!Phaser.Input.Keyboard.JustDown(this.keys.dash)) return;
    if (this.dashCooldown > 0 || this.isDashing) return;
    this.isDashing = true;
    this.dashTimer = this.DASH_DURATION;
    this.dashCooldown = this.DASH_COOLDOWN;
    this.invincibleUntil = Math.max(this.invincibleUntil, time + this.DASH_DURATION);
  }

  private updateChargeVisual() {
    this.chargeIndicator.clear();
    if (!this.isCharging) return;

    const ratio = Math.min(1, this.chargeTime / this.CHARGE_THRESHOLD);
    const dir = this.facingRight ? 1 : -1;
    const x = this.sprite.x + dir * 10;
    const y = this.sprite.y - 12;

    if (ratio >= 1) {
      // Fully charged — glow
      this.chargeIndicator.fillStyle(COLORS.neon, 0.6 + Math.sin(Date.now() * 0.01) * 0.3);
      this.chargeIndicator.fillCircle(x, y, 4);
    } else {
      // Charging — growing circle
      this.chargeIndicator.lineStyle(1, COLORS.neon, ratio);
      this.chargeIndicator.strokeCircle(x, y, 2 + ratio * 3);
    }
  }

  private updateState(onFloor: boolean) {
    if (this.isDashing) this.state = 'dash';
    else if (this.isCharging) this.state = 'charge';
    else if (this.isAttacking) this.state = 'shoot';
    else if (!onFloor && this.body.velocity.y < 0) this.state = 'jump';
    else if (!onFloor && this.body.velocity.y > 0) this.state = 'fall';
    else if (Math.abs(this.body.velocity.x) > 10) this.state = 'run';
    else this.state = 'idle';
  }

  takeDamage(amount: number, sourceX: number, time: number) {
    if (time < this.invincibleUntil) return;
    this.hp = Math.max(0, this.hp - amount);
    this.invincibleUntil = time + INVINCIBILITY_FRAMES_MS;
    this.hitstopUntil = time + HITSTOP_DURATION_MS;
    const dir = this.sprite.x < sourceX ? -1 : 1;
    this.body.setVelocityX(dir * KNOCKBACK_VELOCITY);
    this.body.setVelocityY(-120);
    this.scene.cameras.main.shake(100, 0.01);
    this.sprite.setTint(0xff4444);
    this.scene.time.delayedCall(100, () => this.sprite.clearTint());
    this.state = 'hurt';
    this.scene.time.delayedCall(300, () => {
      if (this.state === 'hurt') this.state = 'idle';
    });
    if (this.hp <= 0) this.die();
  }

  onAttackHit(time: number) {
    this.hitstopUntil = time + HITSTOP_DURATION_MS * 0.5;
    this.gainEnergy(2);
  }

  gainXP(amount: number) {
    this.xp += amount;
    if (this.xp >= this.xpToNext) {
      this.xp -= this.xpToNext;
      this.level++;
      this.xpToNext = Math.floor(this.xpToNext * 1.3);
      this.maxHp += 6;
      this.hp = this.maxHp;
      this.maxEnergy += 4;
      this.energy = this.maxEnergy;
      (this.scene as any).onPlayerLevelUp?.();
    }
  }

  gainEnergy(amount: number) {
    this.energy = Math.min(this.maxEnergy, this.energy + amount);
  }

  private die() {
    this.sprite.setPosition(48, 100);
    this.hp = this.maxHp;
    this.energy = this.maxEnergy;
    this.scene.cameras.main.flash(300, 255, 50, 50);
  }

  getAttackHitbox(): Phaser.Geom.Rectangle | null { return null; } // Gunner uses projectiles
  getAttackDamage(): number { return 0; }
}
