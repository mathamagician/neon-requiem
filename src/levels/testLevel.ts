/**
 * Test level for prototyping.
 * Tile indices:
 *   0 = empty (air)
 *   1 = solid ground
 *   2 = one-way platform
 *   3 = neon accent wall
 */

export const LEVEL_WIDTH_TILES = 120;
export const LEVEL_HEIGHT_TILES = 22; // taller for more vertical room

export function createTestLevel(): number[][] {
  const W = LEVEL_WIDTH_TILES;
  const H = LEVEL_HEIGHT_TILES;
  const level: number[][] = [];

  for (let y = 0; y < H; y++) {
    level[y] = new Array(W).fill(0);
  }

  // -- Ground floor (bottom 2 rows) --
  for (let x = 0; x < W; x++) {
    level[H - 1][x] = 1;
    level[H - 2][x] = 1;
  }

  // -- Pits (gaps in ground) --
  const pits = [
    { start: 22, width: 3 },
    { start: 50, width: 3 },
    { start: 78, width: 3 },
  ];
  for (const pit of pits) {
    for (let px = pit.start; px < pit.start + pit.width; px++) {
      level[H - 1][px] = 0;
      level[H - 2][px] = 0;
    }
  }

  // -- Platforms --
  const platforms: { x: number; y: number; w: number }[] = [
    // Zone 1: Tutorial area (tiles 2-20)
    { x: 5, y: H - 5, w: 4 },
    { x: 11, y: H - 7, w: 3 },
    { x: 16, y: H - 5, w: 4 },

    // Zone 2: Combat area (tiles 25-48)
    { x: 25, y: H - 5, w: 5 },
    { x: 32, y: H - 7, w: 4 },
    { x: 38, y: H - 5, w: 5 },
    { x: 44, y: H - 8, w: 3 },

    // Zone 3: Platforming challenge (tiles 53-75)
    { x: 53, y: H - 5, w: 3 },
    { x: 58, y: H - 7, w: 3 },
    { x: 63, y: H - 5, w: 3 },
    { x: 58, y: H - 10, w: 4 },
    { x: 64, y: H - 12, w: 3 },
    { x: 69, y: H - 9, w: 4 },
    { x: 74, y: H - 6, w: 3 },

    // Zone 4: Pre-boss gauntlet (tiles 80-95)
    { x: 81, y: H - 5, w: 4 },
    { x: 86, y: H - 8, w: 3 },
    { x: 91, y: H - 5, w: 4 },

    // Boss arena platforms (tiles 100-118)
    { x: 104, y: H - 6, w: 4 },
    { x: 112, y: H - 6, w: 4 },
    { x: 108, y: H - 10, w: 3 },
  ];

  for (const plat of platforms) {
    for (let px = plat.x; px < plat.x + plat.w; px++) {
      if (px < W) level[plat.y][px] = 2;
    }
  }

  // -- Low walls (jumpable — only 2 tiles tall, below jump height) --
  const walls: { x: number; y: number; h: number }[] = [
    { x: 47, y: H - 4, h: 2 },
    { x: 48, y: H - 4, h: 2 },
  ];
  for (const wall of walls) {
    for (let wy = wall.y; wy < wall.y + wall.h && wy < H - 2; wy++) {
      if (wy >= 0) level[wy][wall.x] = 1;
    }
  }

  // -- Boundary walls (left and right edges) --
  for (let y = 0; y < H - 2; y++) {
    level[y][0] = 3;
    level[y][W - 1] = 3;
  }

  // -- Boss arena entrance wall (neon gate) --
  // Only covers lower portion — player can walk through a gap at ground level
  for (let y = 0; y < H - 5; y++) {
    level[y][99] = 3;
  }
  // Gap at tiles H-5 to H-3 lets the player walk into the arena

  // -- Boss arena ceiling --
  for (let x = 100; x < W - 1; x++) {
    level[1][x] = 1;
  }

  return level;
}

export const BOSS_SPAWN_X = 110 * 16;
export const BOSS_TRIGGER_X = 101 * 16;

// Second boss (Hollow King) — placed mid-level before the wall obstacle
export const BOSS2_SPAWN_X = 60 * 16;
export const BOSS2_TRIGGER_X = 52 * 16;
