import Phaser from 'phaser';
import type { GameScene } from '../scenes/GameScene';
import type { Enemy } from '../entities/Enemy';

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

  constructor(scene: GameScene) {
    this.scene = scene;

    // Enemy body contact → player damage
    scene.physics.add.overlap(
      scene.player.sprite,
      scene.enemies,
      this.onPlayerEnemyContact,
      undefined,
      this
    );
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
        const damage = player.getAttackDamage();
        enemy.takeDamage(damage, player.sprite.x, time);
        player.onAttackHit(time);
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
      const damage = player.getAttackDamage();
      boss.takeDamage(damage, player.sprite.x, time);
      player.onAttackHit(time);
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
        player.takeDamage(damage, proj.x, time);
        proj.destroy();
      }
    }
  }
}
