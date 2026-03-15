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

    // -- NPCs --
    this.generateRect('npc-shopkeeper', 14, 22, 0xccaa66);

    // -- Projectiles --
    this.generateRect('projectile-enemy', 6, 4, 0xff6644);
    this.generateRect('projectile-player', 8, 4, COLORS.neon);

    // -- Tiles --
    this.generateRect('tile-ground', TILE_SIZE, TILE_SIZE, COLORS.ground);
    this.generateRect('tile-platform', TILE_SIZE, TILE_SIZE, COLORS.platform);

    // -- Particles --
    this.generateRect('particle', 3, 3, 0xffffff);
    this.generateRect('particle-hit', 2, 2, 0xffcc44);

    // -- Generate tileset images for tilemaps --
    this.generateTileset();
    this.generateCryptvaultTileset();
    this.generateHubTileset();

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

  /**
   * Generate tileset textures using Canvas 2D so tiles 1 and 3 can be
   * fully transparent (invisible ground/walls) while tile 2 (platform) is visible.
   * Phaser Graphics.generateTexture always produces an opaque background,
   * so we use raw Canvas for true transparency.
   */
  private generateTileset() {
    const ts = TILE_SIZE;
    this.generateCanvasTileset('tileset', ts, {
      platformFill: '#445566',
      platformBorder: '#667788',
      platformAccent: 'rgba(0,255,204,0.5)', // neon
    });
  }

  private generateCryptvaultTileset() {
    const ts = TILE_SIZE;
    this.generateCanvasTileset('tileset-cryptvault', ts, {
      platformFill: '#3a3050',
      platformBorder: '#4a4070',
      platformAccent: 'rgba(102,68,170,0.5)',
    });
  }

  private generateHubTileset() {
    const ts = TILE_SIZE;
    this.generateCanvasTileset('tileset-hub', ts, {
      platformFill: '#4a3a2a',
      platformBorder: '#5a4a3a',
      platformAccent: 'rgba(204,170,102,0.5)',
    });
  }

  /** Shared tileset generator using Canvas 2D for true alpha transparency */
  private generateCanvasTileset(
    key: string,
    ts: number,
    colors: { platformFill: string; platformBorder: string; platformAccent: string }
  ) {
    const canvas = document.createElement('canvas');
    canvas.width = ts * 3;
    canvas.height = ts;
    const ctx = canvas.getContext('2d')!;

    // Tile 1 (0,0): ground — TRANSPARENT (invisible, collision only)
    // Tile 3 (ts*2,0): accent wall — TRANSPARENT (invisible, collision only)
    // (Canvas starts fully transparent, so we just skip drawing on these tiles)

    // Tile 2 (ts,0): platform — VISIBLE
    ctx.fillStyle = colors.platformFill;
    ctx.fillRect(ts, 0, ts, ts);
    ctx.strokeStyle = colors.platformBorder;
    ctx.lineWidth = 1;
    ctx.strokeRect(ts + 0.5, 0.5, ts - 1, ts - 1);
    // Bright top line to show it's a one-way platform
    ctx.strokeStyle = colors.platformAccent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ts, 1);
    ctx.lineTo(ts * 2, 1);
    ctx.stroke();

    this.textures.addCanvas(key, canvas);
  }
}
