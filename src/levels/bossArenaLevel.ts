/**
 * Generic boss practice arena — 30×22 tiles.
 * Simple flat arena with some platforms for dodging.
 * Used by all *_boss zone variants.
 */

const W = 30;
const H = 22;

export function getBossArenaTiles(): number[][] {
  const level: number[][] = [];
  for (let y = 0; y < H; y++) {
    level[y] = new Array(W).fill(0);
  }

  // Ground floor
  for (let x = 0; x < W; x++) {
    level[H - 1][x] = 1;
    level[H - 2][x] = 1;
  }

  // Ceiling
  for (let x = 0; x < W; x++) level[0][x] = 1;

  // Walls
  for (let y = 0; y < H - 2; y++) {
    level[y][0] = 3;
    level[y][W - 1] = 3;
  }

  // Exit portal area (left wall gap)
  level[H - 3][0] = 0;
  level[H - 4][0] = 0;

  // Gate accent at entrance
  level[H - 3][2] = 3;
  level[H - 4][2] = 3;
  level[H - 5][2] = 3;

  // Combat platforms — 3 tiers for dodging
  // Low platforms (left and right)
  for (let x = 6; x < 10; x++) level[H - 5][x] = 2;
  for (let x = 20; x < 24; x++) level[H - 5][x] = 2;

  // Mid platform (center)
  for (let x = 12; x < 18; x++) level[H - 8][x] = 2;

  // High platforms (left and right)
  for (let x = 4; x < 8; x++) level[H - 11][x] = 2;
  for (let x = 22; x < 26; x++) level[H - 11][x] = 2;

  // Accent pillars
  level[H - 3][10] = 3; level[H - 4][10] = 3;
  level[H - 3][19] = 3; level[H - 4][19] = 3;

  return level;
}
