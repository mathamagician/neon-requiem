import Phaser from 'phaser';
import { TILE_SIZE, COLORS } from '../../shared/constants';

/**
 * BootScene generates all placeholder textures (colored rectangles)
 * so we can prototype without any external art assets.
 * These will be replaced with real sprite sheets later.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create() {
    // -- Player placeholder (Vanguard) --
    this.generateRect('player', 14, 24, COLORS.vanguard);

    // -- Player sword swing (attack hitbox visual) --
    this.generateRect('slash', 20, 8, 0xaaddff, 0.7);

    // -- Enemies --
    this.generateRect('enemy-grunt', 14, 16, COLORS.enemy);
    this.generateRect('enemy-ranged', 12, 16, 0xff8844);
    this.generateRect('enemy-flyer', 14, 12, 0xff66aa);

    // -- Projectiles --
    this.generateRect('projectile-enemy', 6, 4, 0xff6644);
    this.generateRect('projectile-player', 8, 4, COLORS.neon);

    // -- Tiles --
    this.generateRect('tile-ground', TILE_SIZE, TILE_SIZE, COLORS.ground);
    this.generateRect('tile-platform', TILE_SIZE, TILE_SIZE, COLORS.platform);

    // -- Particles --
    this.generateRect('particle', 3, 3, 0xffffff);
    this.generateRect('particle-hit', 2, 2, 0xffcc44);

    // -- Generate a simple tileset image for the tilemap --
    this.generateTileset();

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

  /** Generate a tileset texture with multiple tile types for the tilemap */
  private generateTileset() {
    const g = this.add.graphics();
    const ts = TILE_SIZE;

    // Tile 0: empty (transparent) — skip, tilemap treats 0 as empty
    // Tile 1: ground (solid)
    g.fillStyle(COLORS.ground);
    g.fillRect(0, 0, ts, ts);
    g.lineStyle(1, 0x556677);
    g.strokeRect(0, 0, ts, ts);

    // Tile 2: platform (one-way)
    g.fillStyle(COLORS.platform);
    g.fillRect(ts, 0, ts, ts);
    g.lineStyle(1, 0x667788);
    g.strokeRect(ts, 0, ts, ts);
    // Top line brighter to show it's a platform
    g.lineStyle(2, COLORS.neon, 0.5);
    g.lineBetween(ts, 0, ts * 2, 0);

    // Tile 3: neon accent wall
    g.fillStyle(0x1a1a2e);
    g.fillRect(ts * 2, 0, ts, ts);
    g.lineStyle(1, COLORS.neon, 0.6);
    g.strokeRect(ts * 2, 0, ts, ts);

    g.generateTexture('tileset', ts * 3, ts);
    g.destroy();
  }
}
