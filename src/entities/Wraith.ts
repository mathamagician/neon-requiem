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

type WraithState = 'idle' | 'run' | 'jump' | 'fall' | 'attack' | 'hurt' | 'dash' | 'wallcling';

export class Wraith {
  scene: Phaser.Scene;
  sprite: Phaser.Physics.Arcade.Sprite;
  body: Phaser.Physics.Arcade.Body;

  state: WraithState = 'idle';
  facingRight = true;
  hp: number;
  maxHp: number;
  energy: number;
  maxEnergy: number;
  level = 1;
  xp = 0;
  xpToNext = 100;

  // Combat — fast twin daggers
  isAttacking = false;
  attackCombo = 0; // 0-3 for 4-hit flurry
  private attackTimer = 0;
  private attackCooldown = 0;
  slashSprite: Phaser.GameObjects.Sprite | null = null;
  invincibleUntil = 0;
  hitstopUntil = 0;

  // Crit system
  private critChance = 0.2; // 20% base crit
  private critMultiplier = 1.8;
  private lastHitWasCrit = false;

  // Movement — Wraith is fastest
  private readonly WRAITH_SPEED = PLAYER_SPEED * 1.25;
  private readonly WRAITH_JUMP = PLAYER_JUMP_VELOCITY * 1.1;
  private coyoteTimeLeft = 0;
  private jumpBuffered = false;
  private jumpBufferTimer = 0;
  private wasOnFloor = false;

  // Wall cling (Wraith starts with this!)
  private isTouchingWall = false;
  private wallDir = 0; // -1 left, 1 right
  private wallSlideSpeed = 30;

  // Dash — Wraith dash is faster and shorter
  private dashCooldown = 0;
  private isDashing = false;
  private dashTimer = 0;
  private readonly DASH_DURATION = 120;
  private readonly DASH_SPEED = 350;
  private readonly DASH_COOLDOWN = 500;

  // Afterimage effect
  private afterimages: Phaser.GameObjects.Sprite[] = [];

  // Input
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: {
    attack: Phaser.Input.Keyboard.Key;
    dash: Phaser.Input.Keyboard.Key;
    up: Phaser.Input.Keyboard.Key;
  };

  private dustEmitter: Phaser.GameObjects.Particles.ParticleEmitter;
  private critEmitter: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.hp = Math.floor(PLAYER_MAX_HP * 0.7); // Lowest HP
    this.maxHp = this.hp;
    this.energy = PLAYER_MAX_ENERGY;
    this.maxEnergy = this.energy;

    // Wraith texture
    const g = scene.add.graphics();
    g.fillStyle(COLORS.wraith);
    g.fillRect(0, 0, 12, 22);
    g.lineStyle(1, 0xcc66ff);
    g.strokeRect(0, 0, 12, 22);
    // "Cloak" detail
    g.fillStyle(0x6622aa, 0.5);
    g.fillTriangle(0, 22, 6, 14, 12, 22);
    g.generateTexture('player-wraith', 12, 22);
    g.destroy();

    this.sprite = scene.physics.add.sprite(x, y, 'player-wraith');
    this.sprite.setOrigin(0.5, 1);
    this.body = this.sprite.body as Phaser.Physics.Arcade.Body;
    this.body.setSize(10, 20);
    this.body.setOffset(1, 2);
    this.body.setCollideWorldBounds(true);
    this.body.setMaxVelocityY(600);
    (this.sprite as any).owner = this;

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
      tint: 0x8844cc,
      emitting: false,
    });

    this.critEmitter = scene.add.particles(0, 0, 'particle-hit', {
      speed: { min: 60, max: 120 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.2, end: 0 },
      lifespan: 200,
      tint: 0xffcc00,
      emitting: false,
    });
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
      this.sprite.setAlpha(Math.sin(time * 0.025) > 0 ? 1 : 0.2);
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

    // Attack timer
    if (this.attackCooldown > 0) this.attackCooldown -= delta;
    if (this.isAttacking) {
      this.attackTimer -= delta;
      if (this.attackTimer <= 0) this.endAttack();
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
        this.spawnAfterimage();
        return;
      }
    }

    // Wall cling check
    this.checkWallCling(onFloor);

    if (this.state === 'hurt') return;

    this.handleMovement(onFloor);
    this.handleJump(onFloor);
    this.handleAttack(time);
    this.handleDash(time);
    this.updateState(onFloor);

    // Afterimage cleanup
    this.afterimages = this.afterimages.filter(img => {
      if (img.alpha <= 0.05) { img.destroy(); return false; }
      return true;
    });
  }

  private checkWallCling(onFloor: boolean) {
    if (onFloor) { this.isTouchingWall = false; return; }

    this.isTouchingWall = this.body.blocked.left || this.body.blocked.right;
    if (this.isTouchingWall) {
      this.wallDir = this.body.blocked.left ? -1 : 1;
      // Slow fall while on wall
      if (this.body.velocity.y > this.wallSlideSpeed) {
        this.body.setVelocityY(this.wallSlideSpeed);
      }
    }
  }

  private handleMovement(onFloor: boolean) {
    if (this.isAttacking && onFloor) {
      this.body.setVelocityX(this.body.velocity.x * 0.85);
      return;
    }

    const left = this.cursors.left.isDown;
    const right = this.cursors.right.isDown;

    if (left) {
      this.body.setVelocityX(-this.WRAITH_SPEED);
      this.facingRight = false;
      this.sprite.setFlipX(true);
    } else if (right) {
      this.body.setVelocityX(this.WRAITH_SPEED);
      this.facingRight = true;
      this.sprite.setFlipX(false);
    } else {
      if (onFloor) this.body.setVelocityX(this.body.velocity.x * 0.75);
      else this.body.setVelocityX(this.body.velocity.x * 0.93);
    }
  }

  private handleJump(onFloor: boolean) {
    const jumpPressed = Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
                        Phaser.Input.Keyboard.JustDown(this.keys.up);
    if (jumpPressed) {
      this.jumpBuffered = true;
      this.jumpBufferTimer = JUMP_BUFFER_MS;
    }

    // Wall jump!
    if (this.jumpBuffered && this.isTouchingWall && !onFloor) {
      this.body.setVelocityY(this.WRAITH_JUMP);
      this.body.setVelocityX(-this.wallDir * this.WRAITH_SPEED); // Jump away from wall
      this.jumpBuffered = false;
      this.isTouchingWall = false;
      this.facingRight = this.wallDir < 0;
      this.sprite.setFlipX(!this.facingRight);
      this.dustEmitter.emitParticleAt(this.sprite.x, this.sprite.y - 10, 3);
      return;
    }

    const canJump = onFloor || this.coyoteTimeLeft > 0;
    if (this.jumpBuffered && canJump) {
      this.body.setVelocityY(this.WRAITH_JUMP);
      this.jumpBuffered = false;
      this.coyoteTimeLeft = 0;
    }

    // Variable jump height
    if ((this.cursors.up.isUp && this.keys.up.isUp) && this.body.velocity.y < this.WRAITH_JUMP * 0.4) {
      this.body.setVelocityY(this.body.velocity.y * 0.5);
    }
  }

  private handleAttack(time: number) {
    if (!Phaser.Input.Keyboard.JustDown(this.keys.attack)) return;
    if (this.attackCooldown > 0 || this.isDashing) return;
    this.startAttack(time);
  }

  private startAttack(_time: number) {
    this.isAttacking = true;

    if (this.attackCombo < 3 && this.attackTimer > -150) {
      this.attackCombo++;
    } else {
      this.attackCombo = 0;
    }

    // Wraith attacks are very fast
    const durations = [100, 90, 80, 200]; // 4th hit is the finisher
    this.attackTimer = durations[this.attackCombo];
    this.attackCooldown = 50; // Very low — encourages rapid mashing

    this.createSlash();
  }

  private createSlash() {
    if (this.slashSprite) this.slashSprite.destroy();

    const dir = this.facingRight ? 1 : -1;
    const offsetX = dir * 12;
    const widths = [14, 16, 14, 22];
    const w = widths[this.attackCombo];
    const h = 8;

    this.slashSprite = this.scene.add.sprite(
      this.sprite.x + offsetX,
      this.sprite.y - 10 + (this.attackCombo % 2 === 0 ? -2 : 2), // Alternating height
      'slash'
    );
    this.slashSprite.setDisplaySize(w, h);
    this.slashSprite.setAlpha(0.6);
    this.slashSprite.setTint(COLORS.wraith);
    this.slashSprite.setDepth(10);

    // Small forward lunge on each hit
    this.body.setVelocityX(dir * 40);
  }

  private endAttack() {
    this.isAttacking = false;
    if (this.slashSprite) {
      this.slashSprite.destroy();
      this.slashSprite = null;
    }
    this.scene.time.delayedCall(250, () => {
      if (!this.isAttacking) this.attackCombo = 0;
    });
  }

  private handleDash(time: number) {
    if (!Phaser.Input.Keyboard.JustDown(this.keys.dash)) return;
    if (this.dashCooldown > 0 || this.isDashing) return;
    this.isDashing = true;
    this.dashTimer = this.DASH_DURATION;
    this.dashCooldown = this.DASH_COOLDOWN;
    this.invincibleUntil = Math.max(this.invincibleUntil, time + this.DASH_DURATION);
  }

  private spawnAfterimage() {
    const img = this.scene.add.sprite(this.sprite.x, this.sprite.y, 'player-wraith');
    img.setOrigin(0.5, 1);
    img.setAlpha(0.4);
    img.setTint(COLORS.wraith);
    img.setFlipX(this.sprite.flipX);
    this.scene.tweens.add({
      targets: img,
      alpha: 0,
      duration: 200,
    });
    this.afterimages.push(img);
  }

  private updateState(onFloor: boolean) {
    if (this.isDashing) this.state = 'dash';
    else if (this.isTouchingWall && !onFloor) this.state = 'wallcling';
    else if (this.isAttacking) this.state = 'attack';
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
    this.body.setVelocityX(dir * KNOCKBACK_VELOCITY * 1.2); // Wraith gets knocked further
    this.body.setVelocityY(-120);
    this.scene.cameras.main.shake(100, 0.01);
    this.sprite.setTint(0xff4444);
    this.scene.time.delayedCall(100, () => this.sprite.clearTint());
    this.state = 'hurt';
    this.scene.time.delayedCall(250, () => {
      if (this.state === 'hurt') this.state = 'idle';
    });
    if (this.hp <= 0) this.die();
  }

  onAttackHit(time: number) {
    this.hitstopUntil = time + HITSTOP_DURATION_MS * 0.6; // Shorter hitstop for fast attacks
    this.scene.cameras.main.shake(30, 0.003);

    // Crit check
    this.lastHitWasCrit = Math.random() < this.critChance;
    if (this.lastHitWasCrit) {
      this.critEmitter.emitParticleAt(this.sprite.x + (this.facingRight ? 15 : -15), this.sprite.y - 10, 6);
      this.scene.cameras.main.shake(60, 0.008);
    }

    this.gainEnergy(2);
  }

  gainXP(amount: number) {
    this.xp += amount;
    if (this.xp >= this.xpToNext) {
      this.xp -= this.xpToNext;
      this.level++;
      this.xpToNext = Math.floor(this.xpToNext * 1.3);
      this.maxHp += 5;
      this.hp = this.maxHp;
      this.maxEnergy += 3;
      this.energy = this.maxEnergy;
      this.critChance = Math.min(0.4, this.critChance + 0.01);
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

  getAttackHitbox(): Phaser.Geom.Rectangle | null {
    if (!this.isAttacking || !this.slashSprite) return null;
    const widths = [14, 16, 14, 22];
    const w = widths[this.attackCombo];
    const h = 8;
    return new Phaser.Geom.Rectangle(
      this.slashSprite.x - w / 2,
      this.slashSprite.y - h / 2,
      w, h
    );
  }

  getAttackDamage(): number {
    const baseDamages = [6, 7, 6, 14]; // Low per-hit but fast and 4th hit is big
    let dmg = baseDamages[this.attackCombo];
    if (this.lastHitWasCrit) dmg = Math.floor(dmg * this.critMultiplier);
    return dmg;
  }
}
