/**
 * Test level for Phase 0 prototyping.
 * Returns a 2D array of tile indices:
 *   0 = empty (air)
 *   1 = solid ground
 *   2 = one-way platform
 *   3 = neon accent wall
 *
 * Level is wider than the screen to test camera scrolling.
 */

export const LEVEL_WIDTH_TILES = 120; // ~1920px
export const LEVEL_HEIGHT_TILES = 18; // ~288px

export function createTestLevel(): number[][] {
  const W = LEVEL_WIDTH_TILES;
  const H = LEVEL_HEIGHT_TILES;
  const level: number[][] = [];

  // Initialize empty
  for (let y = 0; y < H; y++) {
    level[y] = new Array(W).fill(0);
  }

  // -- Ground floor (bottom 2 rows) --
  for (let x = 0; x < W; x++) {
    level[H - 1][x] = 1;
    level[H - 2][x] = 1;
  }

  // -- Gaps in the ground (pits) --
  const pits = [
    { start: 18, width: 3 },
    { start: 45, width: 4 },
    { start: 72, width: 3 },
    { start: 95, width: 5 },
  ];
  for (const pit of pits) {
    for (let px = pit.start; px < pit.start + pit.width; px++) {
      level[H - 1][px] = 0;
      level[H - 2][px] = 0;
    }
  }

  // -- Platforms at various heights --
  const platforms: { x: number; y: number; w: number; type?: number }[] = [
    // Starting area — easy platforms
    { x: 5, y: H - 5, w: 4 },
    { x: 10, y: H - 7, w: 3 },

    // Mid section — more complex
    { x: 20, y: H - 5, w: 5 },
    { x: 26, y: H - 8, w: 3 },
    { x: 30, y: H - 6, w: 4 },
    { x: 35, y: H - 9, w: 3 },
    { x: 39, y: H - 5, w: 5 },

    // After first pit — staggered
    { x: 48, y: H - 6, w: 3 },
    { x: 52, y: H - 9, w: 4 },
    { x: 57, y: H - 7, w: 3 },
    { x: 61, y: H - 5, w: 4 },

    // Vertical challenge section
    { x: 65, y: H - 6, w: 2 },
    { x: 68, y: H - 9, w: 2 },
    { x: 65, y: H - 12, w: 2 },
    { x: 68, y: H - 14, w: 3 },

    // High road
    { x: 75, y: H - 10, w: 6 },
    { x: 82, y: H - 10, w: 4 },
    { x: 87, y: H - 8, w: 3 },

    // Final section
    { x: 100, y: H - 5, w: 5 },
    { x: 106, y: H - 8, w: 4 },
    { x: 111, y: H - 6, w: 5 },
  ];

  for (const plat of platforms) {
    const tileType = plat.type ?? 2; // default to one-way platform
    for (let px = plat.x; px < plat.x + plat.w; px++) {
      if (px < W) level[plat.y][px] = tileType;
    }
  }

  // -- Walls (solid blocks creating corridors) --
  const walls: { x: number; y: number; h: number }[] = [
    { x: 43, y: H - 6, h: 4 },
    { x: 44, y: H - 6, h: 4 },
    { x: 90, y: H - 8, h: 6 },
    { x: 91, y: H - 8, h: 6 },
  ];
  for (const wall of walls) {
    for (let wy = wall.y; wy < wall.y + wall.h && wy < H - 2; wy++) {
      if (wy >= 0) level[wy][wall.x] = 1;
    }
  }

  // -- Neon accent walls (decorative but solid) --
  const neonWalls = [
    { x: 0, yStart: 0, yEnd: H - 2 },  // Left boundary
    { x: W - 1, yStart: 0, yEnd: H - 2 }, // Right boundary
  ];
  for (const nw of neonWalls) {
    for (let y = nw.yStart; y <= nw.yEnd; y++) {
      level[y][nw.x] = 3;
    }
  }

  // -- Ceiling sections --
  for (let x = 62; x < 72; x++) {
    level[H - 16][x] = 1;
  }

  // -- BOSS ARENA (rightmost section, tiles 100-118) --
  // Clear the pit at 95 (it's before the arena)
  // Boss arena walls (sealed during fight)
  for (let y = 0; y < H - 2; y++) {
    level[y][99] = 3; // Left wall of arena
  }
  // Arena floor is already there (ground), with a platform for evasion
  // Add some arena platforms
  for (let px = 104; px < 108; px++) {
    level[H - 6][px] = 2;
  }
  for (let px = 110; px < 114; px++) {
    level[H - 6][px] = 2;
  }
  // Arena ceiling for enclosed feel
  for (let x = 100; x < W - 1; x++) {
    level[1][x] = 1;
  }

  return level;
}

/** Boss spawn position in the arena */
export const BOSS_SPAWN_X = 110 * 16; // tile 110
export const BOSS_TRIGGER_X = 101 * 16; // player crosses this to trigger boss
