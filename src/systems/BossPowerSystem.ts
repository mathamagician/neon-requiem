import Phaser from 'phaser';
import type { GameScene } from '../scenes/GameScene';
import type { BossPowerDef } from '../../shared/data/bossPowers';
import { COLORS } from '../../shared/constants';

/**
 * BossPowerSystem handles the execution of absorbed boss powers.
 * Called when the player presses C to use their equipped power.
 */
export class BossPowerSystem {
  private scene: GameScene;
  private cooldownUntil = 0;
  private activeEffects: Phaser.GameObjects.GameObject[] = [];

  constructor(scene: GameScene) {
    this.scene = scene;
  }

  /** Try to use the currently equipped boss power. Returns true if fired. */
  usePower(power: BossPowerDef, time: number): boolean {
    if (time < this.cooldownUntil) return false;

    const player = this.scene.player;
    if (player.energy < power.energyCost) return false;

    // Consume energy and start cooldown
    player.energy = Math.max(0, player.energy - power.energyCost);
    this.cooldownUntil = time + power.cooldownMs;

    // Arcana scaling: +3% damage per arcana point above 5
    const inv = this.scene.getInventory();
    const arcana = inv.getEffectiveStat('arcana');
    const damageMultiplier = 1 + (arcana - 5) * 0.03;
    const damage = Math.round(power.baseDamage * damageMultiplier);

    // Execute the power (pass power.id for weakness checks)
    switch (power.id) {
      case 'chain_lightning': this.chainLightning(damage, power.color, power.id); break;
      case 'soul_drain': this.soulDrain(damage, power.color, power.id); break;
      default: this.genericProjectile(damage, power, power.id); break;
    }

    return true;
  }

  /** Get remaining cooldown in ms (0 if ready) */
  getCooldownRemaining(time: number): number {
    return Math.max(0, this.cooldownUntil - time);
  }

  update(_time: number, _delta: number) {
    // Cleanup destroyed effects
    this.activeEffects = this.activeEffects.filter(e => (e as any).active);
  }

  /** Chain Lightning: arcs between nearby enemies */
  private chainLightning(damage: number, color: number, powerId: string) {
    const player = this.scene.player;
    const px = player.sprite.x;
    const py = player.sprite.y - 12;
    const dir = player.facingRight ? 1 : -1;

    // Initial bolt projectile
    const bolt = this.scene.physics.add.sprite(px + dir * 16, py, 'projectile-enemy');
    bolt.setDisplaySize(12, 8);
    bolt.setTint(color);
    const bb = bolt.body as Phaser.Physics.Arcade.Body;
    bb.setAllowGravity(false);
    bb.setVelocityX(dir * 200);
    (bolt as any).damage = damage;
    (bolt as any).isPlayerPower = true;
    this.activeEffects.push(bolt);

    // Arc effect — find enemies near bolt path and chain to them
    this.scene.time.delayedCall(200, () => {
      if (!bolt.active) return;
      const enemies = this.scene.enemies.getChildren() as Phaser.Physics.Arcade.Sprite[];
      let chainCount = 0;
      for (const enemySprite of enemies) {
        if (!enemySprite.active || chainCount >= 3) break;
        const dist = Phaser.Math.Distance.Between(bolt.x, bolt.y, enemySprite.x, enemySprite.y);
        if (dist < 80) {
          // Draw lightning arc
          const arc = this.scene.add.graphics();
          arc.lineStyle(2, color, 0.8);
          this.drawLightningArc(arc, bolt.x, bolt.y, enemySprite.x, enemySprite.y);
          this.scene.time.delayedCall(150, () => arc.destroy());

          // Deal chain damage
          const enemy = (enemySprite as any).owner;
          if (enemy && enemy.state !== 'dead') {
            enemy.takeDamage(Math.round(damage * 0.6), bolt.x, this.scene.time.now);
          }
          chainCount++;
        }
      }

      // Also check boss
      const boss = this.scene.getBoss();
      if (boss && boss.isActive && boss.state !== 'dead' && chainCount < 3) {
        const dist = Phaser.Math.Distance.Between(bolt.x, bolt.y, boss.sprite.x, boss.sprite.y);
        if (dist < 80) {
          const arc = this.scene.add.graphics();
          arc.lineStyle(2, color, 0.8);
          this.drawLightningArc(arc, bolt.x, bolt.y, boss.sprite.x, boss.sprite.y - 20);
          this.scene.time.delayedCall(150, () => arc.destroy());
          boss.takeDamage(Math.round(damage * 0.6), bolt.x, this.scene.time.now, powerId);
        }
      }
    });

    // Hit detection for main bolt
    this.addPlayerProjectileHitDetection(bolt, damage, powerId);

    // Auto-destroy
    this.scene.time.delayedCall(1000, () => { if (bolt.active) bolt.destroy(); });

    // Camera flash
    this.scene.cameras.main.flash(50, 0, 255, 200);
  }

  /** Soul Drain: melee-range hit that heals the player */
  private soulDrain(damage: number, color: number, powerId: string) {
    const player = this.scene.player;
    const dir = player.facingRight ? 1 : -1;
    const sx = player.sprite.x + dir * 20;
    const sy = player.sprite.y - 12;

    // Create drain zone
    const zone = this.scene.physics.add.sprite(sx, sy, 'slash');
    zone.setDisplaySize(30, 24);
    zone.setTint(color);
    zone.setAlpha(0.7);
    const zb = zone.body as Phaser.Physics.Arcade.Body;
    zb.setAllowGravity(false);
    (zone as any).damage = damage;
    (zone as any).isPlayerPower = true;
    this.activeEffects.push(zone);

    // Check hits immediately
    let healed = false;
    const enemies = this.scene.enemies.getChildren() as Phaser.Physics.Arcade.Sprite[];
    const zoneBounds = new Phaser.Geom.Rectangle(sx - 15, sy - 12, 30, 24);

    for (const enemySprite of enemies) {
      if (!enemySprite.active) continue;
      const enemy = (enemySprite as any).owner;
      if (!enemy || enemy.state === 'dead') continue;
      if (Phaser.Geom.Rectangle.Overlaps(zoneBounds, enemySprite.getBounds())) {
        enemy.takeDamage(damage, sx, this.scene.time.now);
        healed = true;
      }
    }

    // Check boss
    const boss = this.scene.getBoss();
    if (boss && boss.isActive && boss.state !== 'dead') {
      if (Phaser.Geom.Rectangle.Overlaps(zoneBounds, boss.sprite.getBounds())) {
        boss.takeDamage(damage, sx, this.scene.time.now, powerId);
        healed = true;
      }
    }

    // Heal player if we hit something
    if (healed) {
      const healAmount = Math.round(damage * 0.4);
      player.hp = Math.min(player.maxHp, player.hp + healAmount);

      // Heal visual
      const healText = this.scene.add.text(player.sprite.x, player.sprite.y - 30, `+${healAmount} HP`, {
        fontSize: '12px', fontFamily: 'Arial, sans-serif', color: '#44ff44',
        fontStyle: 'bold', stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0.5).setDepth(50);
      this.scene.tweens.add({
        targets: healText, y: healText.y - 20, alpha: 0, duration: 800,
        onComplete: () => healText.destroy(),
      });
    }

    // Fade out zone
    this.scene.tweens.add({
      targets: zone, alpha: 0, scaleX: 1.5, scaleY: 1.5, duration: 300,
      onComplete: () => zone.destroy(),
    });
  }

  /** Generic projectile for powers without specific implementations yet */
  private genericProjectile(damage: number, power: BossPowerDef, powerId: string) {
    const player = this.scene.player;
    const dir = player.facingRight ? 1 : -1;

    const proj = this.scene.physics.add.sprite(
      player.sprite.x + dir * 12,
      player.sprite.y - 12,
      'projectile-enemy'
    );
    proj.setDisplaySize(10, 10);
    proj.setTint(power.color);
    const pb = proj.body as Phaser.Physics.Arcade.Body;
    pb.setAllowGravity(false);
    pb.setVelocityX(dir * 160);
    (proj as any).damage = damage;
    (proj as any).isPlayerPower = true;
    this.activeEffects.push(proj);

    this.addPlayerProjectileHitDetection(proj, damage, powerId);
    this.scene.time.delayedCall(1500, () => { if (proj.active) proj.destroy(); });
  }

  /** Add hit detection for a player-fired projectile */
  private addPlayerProjectileHitDetection(proj: Phaser.Physics.Arcade.Sprite, damage: number, powerId?: string) {
    const checkHits = () => {
      if (!proj.active) return;
      const projBounds = proj.getBounds();

      // Enemies
      const enemies = this.scene.enemies.getChildren() as Phaser.Physics.Arcade.Sprite[];
      for (const enemySprite of enemies) {
        if (!enemySprite.active) continue;
        const enemy = (enemySprite as any).owner;
        if (!enemy || enemy.state === 'dead') continue;
        if (Phaser.Geom.Rectangle.Overlaps(projBounds, enemySprite.getBounds())) {
          enemy.takeDamage(damage, proj.x, this.scene.time.now);
          this.scene.player.onAttackHit(this.scene.time.now);
          proj.setActive(false).setVisible(false);
          if (proj.body) proj.body.enable = false;
          return;
        }
      }

      // Boss (pass powerId for weakness check)
      const boss = this.scene.getBoss();
      if (boss && boss.isActive && boss.state !== 'dead') {
        if (Phaser.Geom.Rectangle.Overlaps(projBounds, boss.sprite.getBounds())) {
          boss.takeDamage(damage, proj.x, this.scene.time.now, powerId);
          this.scene.player.onAttackHit(this.scene.time.now);
          proj.setActive(false).setVisible(false);
          if (proj.body) proj.body.enable = false;
          return;
        }
      }

      // Continue checking
      if (proj.active) this.scene.time.delayedCall(16, checkHits);
    };
    checkHits();
  }

  /** Draw a jagged lightning arc between two points */
  private drawLightningArc(g: Phaser.GameObjects.Graphics, x1: number, y1: number, x2: number, y2: number) {
    const segments = 5;
    let cx = x1, cy = y1;
    for (let i = 0; i < segments; i++) {
      const t = (i + 1) / segments;
      const nx = x1 + (x2 - x1) * t + (Math.random() - 0.5) * 10;
      const ny = y1 + (y2 - y1) * t + (Math.random() - 0.5) * 10;
      g.lineBetween(cx, cy, nx, ny);
      cx = nx;
      cy = ny;
    }
  }
}
