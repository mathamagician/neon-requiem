/**
 * Cryptvault — undead gothic catacombs.
 * Tile indices: 0=air, 1=solid, 2=platform, 3=accent wall
 */

const W = 100;
const H = 22;

export function createCryptvaultLevel(): number[][] {
  const level: number[][] = [];
  for (let y = 0; y < H; y++) {
    level[y] = new Array(W).fill(0);
  }

  // Ground floor (bottom 2 rows)
  for (let x = 0; x < W; x++) {
    level[H - 1][x] = 1;
    level[H - 2][x] = 1;
  }

  // Pits (gaps in ground — spike pits thematically)
  const pits = [
    { start: 18, width: 2 },
    { start: 35, width: 3 },
    { start: 55, width: 2 },
    { start: 70, width: 3 },
  ];
  for (const pit of pits) {
    for (let px = pit.start; px < pit.start + pit.width; px++) {
      level[H - 1][px] = 0;
      level[H - 2][px] = 0;
    }
  }

  // Boundary walls
  for (let y = 0; y < H - 2; y++) {
    level[y][0] = 3;
    level[y][W - 1] = 3;
  }

  // Platforms — gothic catacomb shelves and walkways
  const platforms: { x: number; y: number; w: number }[] = [
    // Zone entrance area (tiles 3-15)
    { x: 5, y: H - 5, w: 4 },
    { x: 11, y: H - 7, w: 3 },

    // Skeleton corridor (tiles 16-35)
    { x: 20, y: H - 5, w: 5 },
    { x: 27, y: H - 7, w: 4 },
    { x: 22, y: H - 9, w: 3 },
    { x: 32, y: H - 5, w: 4 },

    // Ghost gallery (tiles 38-55) — more vertical platforming
    { x: 38, y: H - 5, w: 3 },
    { x: 42, y: H - 7, w: 3 },
    { x: 46, y: H - 9, w: 3 },
    { x: 42, y: H - 11, w: 3 },
    { x: 50, y: H - 6, w: 4 },
    { x: 38, y: H - 13, w: 5 },

    // Dark corridor (tiles 57-75) — tight platforming
    { x: 57, y: H - 5, w: 3 },
    { x: 62, y: H - 7, w: 4 },
    { x: 67, y: H - 5, w: 3 },
    { x: 72, y: H - 8, w: 3 },

    // Pre-boss gauntlet (tiles 76-82)
    { x: 76, y: H - 5, w: 4 },

    // Boss arena platforms (tiles 83-98)
    { x: 86, y: H - 6, w: 4 },
    { x: 93, y: H - 6, w: 4 },
    { x: 89, y: H - 10, w: 3 },
  ];

  for (const plat of platforms) {
    for (let px = plat.x; px < plat.x + plat.w; px++) {
      if (px < W) level[plat.y][px] = 2;
    }
  }

  // Gothic pillars (solid 2-tile walls — atmosphere)
  const pillars = [15, 30, 45, 60, 75];
  for (const px of pillars) {
    level[H - 3][px] = 1;
    level[H - 4][px] = 1;
  }

  // Coffin shelves — short solid blocks in walls
  for (let y = H - 8; y <= H - 6; y++) {
    level[y][1] = 1;
    level[y][2] = 1;
  }

  // Boss arena entrance wall (accent gate)
  for (let y = 0; y < H - 5; y++) {
    level[y][82] = 3;
  }

  // Boss arena ceiling
  for (let x = 83; x < W - 1; x++) {
    level[1][x] = 1;
  }

  return level;
}
