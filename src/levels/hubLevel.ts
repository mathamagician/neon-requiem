/**
 * The Threshold — hub town.
 * Small safe zone with save crystal, shop NPC, and exits to zones.
 * Tile indices: 0=air, 1=solid, 2=platform, 3=accent wall
 */

const W = 40;
const H = 18;

export function createHubLevel(): number[][] {
  const level: number[][] = [];
  for (let y = 0; y < H; y++) {
    level[y] = new Array(W).fill(0);
  }

  // Ground floor (bottom 2 rows)
  for (let x = 0; x < W; x++) {
    level[H - 1][x] = 1;
    level[H - 2][x] = 1;
  }

  // Boundary walls
  for (let y = 0; y < H - 2; y++) {
    level[y][0] = 3;
    level[y][W - 1] = 3;
  }

  // Ceiling
  for (let x = 0; x < W; x++) {
    level[0][x] = 1;
  }

  // Upper walkway platforms
  for (let x = 12; x < 28; x++) {
    level[H - 6][x] = 2;
  }

  // Small raised area near left exit (Cryptvault direction)
  for (let x = 3; x < 7; x++) {
    level[H - 4][x] = 2;
  }

  // Small raised area near right exit (Foundry direction)
  for (let x = 33; x < 37; x++) {
    level[H - 4][x] = 2;
  }

  // Decorative accent pillars
  level[H - 3][10] = 3;
  level[H - 4][10] = 3;
  level[H - 3][29] = 3;
  level[H - 4][29] = 3;

  return level;
}
