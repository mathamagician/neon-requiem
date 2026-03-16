import Phaser from 'phaser';
import { TILE_SIZE, COLORS } from '../../shared/constants';
import { generateUpgradedSprites } from '../art/spriteRenderer';

/**
 * BootScene generates all placeholder textures using detailed pixel art
 * sprite data so we can prototype without any external art assets.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create() {
    // -- Generate upgraded pixel art sprites (characters + enemies) --
    generateUpgradedSprites(this);

    // -- Player sword swing (attack hitbox visual) --
    this.generateRect('slash', 20, 8, 0xaaddff, 0.7);

    // -- Projectiles --
    this.generateRect('projectile-enemy', 6, 4, 0xff6644);
    this.generateRect('projectile-player', 8, 4, COLORS.neon);

    // -- Tiles --
    this.generateRect('tile-ground', TILE_SIZE, TILE_SIZE, COLORS.ground);
    this.generateRect('tile-platform', TILE_SIZE, TILE_SIZE, COLORS.platform);

    // -- Particles --
    this.generateRect('particle', 3, 3, 0xffffff);
    this.generateRect('particle-hit', 2, 2, 0xffcc44);

    this.scene.start('TitleScene');
  }

  /** Create a simple colored rectangle texture */
  private generateRect(
    key: string,
    w: number,
    h: number,
    color: number,
    alpha: number = 1
  ) {
    const g = this.add.graphics();
    g.fillStyle(color, alpha);
    g.fillRect(0, 0, w, h);
    // Add a 1px lighter border for visibility
    g.lineStyle(1, Phaser.Display.Color.IntegerToColor(color).brighten(40).color, alpha);
    g.strokeRect(0, 0, w, h);
    g.generateTexture(key, w, h);
    g.destroy();
  }

}
