import Phaser from 'phaser';
import type { GameScene } from '../scenes/GameScene';
import type { Enemy } from '../entities/Enemy';
import type { Player } from '../entities/Player';

/**
 * CombatSystem handles hit detection between:
 * - Player attacks → Enemies
 * - Enemy contact → Player
 * - Enemy projectiles → Player
 */
export class CombatSystem {
  private scene: GameScene;
  private enemyProjectiles: Phaser.Physics.Arcade.Sprite[] = [];
  private hitEnemiesThisSwing: Set<Phaser.Physics.Arcade.Sprite> = new Set();
  private lastAttackCombo = -1;
  private overlapCollider: Phaser.Physics.Arcade.Collider;

  constructor(scene: GameScene) {
    this.scene = scene;

    // Enemy body contact → player damage
    this.overlapCollider = scene.physics.add.overlap(
      scene.player.sprite,
      scene.enemies,
      this.onPlayerEnemyContact,
      undefined,
      this
    );
  }

  /** Remove physics listeners to prevent leaks on class switch */
  destroy() {
    this.overlapCollider.destroy();
  }

  update(time: number, _delta: number) {
    // Reset hit tracking when a new attack swing starts
    if (this.scene.player.attackCombo !== this.lastAttackCombo && this.scene.player.isAttacking) {
      this.hitEnemiesThisSwing.clear();
      this.lastAttackCombo = this.scene.player.attackCombo;
    }

    // Player attack → enemy + boss hit detection
    this.checkPlayerAttackHits(time);
    this.checkPlayerAttackBoss(time);
    this.checkPlayerProjectileHits(time);

    // Enemy projectile → player
    this.checkProjectileHits(time);

    // Cleanup dead projectiles
    this.enemyProjectiles = this.enemyProjectiles.filter(p => p.active);
  }

  addEnemyProjectile(proj: Phaser.Physics.Arcade.Sprite) {
    this.enemyProjectiles.push(proj);
  }

  private checkPlayerAttackHits(time: number) {
    const player = this.scene.player;
    const hitbox = player.getAttackHitbox();
    if (!hitbox) return;

    const enemies = this.scene.enemies.getChildren() as Phaser.Physics.Arcade.Sprite[];
    for (const enemySprite of enemies) {
      if (!enemySprite.active) continue;
      if (this.hitEnemiesThisSwing.has(enemySprite)) continue;

      const enemy = (enemySprite as any).owner as Enemy;
      if (!enemy || enemy.state === 'dead') continue;

      const enemyBounds = enemySprite.getBounds();
      if (Phaser.Geom.Rectangle.Overlaps(hitbox, enemyBounds)) {
        // Hit!
        this.hitEnemiesThisSwing.add(enemySprite);

        // Wraith backstab + poison check
        this.applyWraithEffects(player, enemy);

        const damage = player.getAttackDamage();
        enemy.takeDamage(damage, player.sprite.x, time);
        player.onAttackHit(time);

        // Vanguard shield punch — extra knockback on regular enemies
        if ((player as any).isShieldPunch?.()) {
          const dir = enemySprite.x > player.sprite.x ? 1 : -1;
          enemySprite.body!.velocity.x = dir * 200;
          (enemySprite.body as any).velocity.y = -80;
        }
      }
    }
  }

  private onPlayerEnemyContact: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (
    _playerObj,
    enemyObj
  ) => {
    const player = this.scene.player;
    const enemy = (enemyObj as any).owner as Enemy | undefined;
    if (!enemy || enemy.state === 'dead' || enemy.state === 'hurt') return;

    const time = this.scene.time.now;
    if (this.tryShieldBlock(player, enemy.damage, enemy.sprite.x, time)) return;
    player.takeDamage(enemy.damage, enemy.sprite.x, time);
  };

  /** Check Gunner projectiles hitting enemies and boss */
  private checkPlayerProjectileHits(time: number) {
    const player = this.scene.player as any;
    if (!player.projectiles) return; // Only Gunner has projectiles

    const projectiles = player.projectiles.getChildren() as Phaser.Physics.Arcade.Sprite[];
    for (const proj of projectiles) {
      if (!proj.active) continue;
      const projBounds = proj.getBounds();
      const damage = (proj as any).damage ?? 8;
      const piercing = (proj as any).piercing ?? false;

      // Check enemies
      const enemies = this.scene.enemies.getChildren() as Phaser.Physics.Arcade.Sprite[];
      for (const enemySprite of enemies) {
        if (!enemySprite.active) continue;
        const enemy = (enemySprite as any).owner as any;
        if (!enemy || enemy.state === 'dead') continue;
        if (Phaser.Geom.Rectangle.Overlaps(projBounds, enemySprite.getBounds())) {
          enemy.takeDamage(damage, proj.x, time);
          player.onAttackHit(time);
          if (!piercing) { proj.setActive(false).setVisible(false); proj.body!.enable = false; break; }
        }
      }

      // Check boss
      if (!proj.active) continue;
      const boss = this.scene.getBoss();
      if (boss && boss.isActive && boss.state !== 'dead') {
        if (Phaser.Geom.Rectangle.Overlaps(projBounds, boss.sprite.getBounds())) {
          boss.takeDamage(damage, proj.x, time);
          player.onAttackHit(time);
          if (!piercing) { proj.setActive(false).setVisible(false); proj.body!.enable = false; }
        }
      }
    }
  }

  /** Check if player melee attack hits the boss */
  private checkPlayerAttackBoss(time: number) {
    const boss = this.scene.getBoss();
    if (!boss || !boss.isActive || boss.state === 'dead') return;

    const player = this.scene.player;
    const hitbox = player.getAttackHitbox();
    if (!hitbox) return;

    // Don't double-hit on same swing
    if (this.hitEnemiesThisSwing.has(boss.sprite)) return;

    const bossBounds = boss.sprite.getBounds();
    if (Phaser.Geom.Rectangle.Overlaps(hitbox, bossBounds)) {
      this.hitEnemiesThisSwing.add(boss.sprite);

      // Wraith backstab + poison on boss
      this.applyWraithEffects(player, boss);

      const damage = player.getAttackDamage();
      boss.takeDamage(damage, player.sprite.x, time);
      player.onAttackHit(time);

      // Vanguard shield punch stagger — interrupts boss telegraph/attack
      if ((player as any).isShieldPunch?.()) {
        this.applyStagger(boss, player.sprite.x);
      }
    }
  }

  private checkProjectileHits(time: number) {
    const player = this.scene.player;
    const playerBounds = player.sprite.getBounds();

    for (const proj of this.enemyProjectiles) {
      if (!proj.active) continue;

      const projBounds = proj.getBounds();
      if (Phaser.Geom.Rectangle.Overlaps(playerBounds, projBounds)) {
        const damage = (proj as any).damage ?? 8;
        if (this.tryShieldBlock(player, damage, proj.x, time)) {
          proj.destroy();
          continue;
        }
        player.takeDamage(damage, proj.x, time);
        proj.destroy();
      }
    }
  }

  /** Apply stagger to a boss — interrupts telegraph and pushes back */
  private applyStagger(boss: any, sourceX: number) {
    // Only stagger during telegraph (charge-up) or attack states
    if (boss.state !== 'telegraph' && boss.state !== 'attack') return;

    boss.state = 'hurt';
    boss.sprite.setTint(0xffff44);
    const dir = boss.sprite.x > sourceX ? 1 : -1;
    boss.body.setVelocityX(dir * 120);

    // Reset boss attack timer — they lose their current attack
    if (boss.currentAttack) boss.currentAttack = null;
    if (boss.attackTimer !== undefined) boss.attackTimer = 1000; // 1s recovery

    boss.scene.time.delayedCall(500, () => {
      if (boss.state === 'hurt') {
        boss.state = 'idle';
        boss.sprite.clearTint();
        boss.body.setVelocityX(0);
      }
    });
  }

  /** Apply Wraith-specific effects: backstab check and poison on finisher */
  private applyWraithEffects(player: any, target: any) {
    if (!player.checkBackstab) return; // Only Wraith has checkBackstab

    // Backstab check: is the Wraith behind the target?
    const targetFacingRight = target.facingRight ?? false;
    player.checkBackstab(target.sprite.x, targetFacingRight);

    // Poison on 4th combo hit
    if (player.shouldApplyPoison?.() && target.applyPoison) {
      const { duration, slow } = player.getPoisonParams();
      target.applyPoison(duration, slow);
    }
  }

  /** Check if the Vanguard's shield blocks this hit. Returns true if fully blocked. */
  private tryShieldBlock(player: any, damage: number, sourceX: number, time: number): boolean {
    // Only Vanguard (Player class) has shieldBlock
    if (!player.shieldBlock || !player.isShielding) return false;

    // Only blocks from the front — check if source is on the facing side
    const facingRight = player.facingRight;
    const sourceIsRight = sourceX > player.sprite.x;
    if (facingRight !== sourceIsRight) return false; // Attack from behind — no block

    return (player as Player).shieldBlock(damage, time);
  }
}
