/**
 * The Threshold — hub town (redesigned).
 * A neon-lit sanctuary with clearly labeled zone portals.
 * Each zone has TWO doors: a zone entrance (full level) and a boss practice door.
 * Layout: 60 tiles wide × 18 tiles tall
 *
 * Structure (left to right):
 *   [0-3]   Left wall
 *   [4-12]  Cryptvault wing — zone door at 6, boss door at 10
 *   [13-17] Garden wing — zone door at 15, boss door at 19  (on upper platform)
 *   [18-22] Save crystal area
 *   [23-37] Central plaza — shop, save crystal, upper walkway
 *   [38-42] Citadel wing — zone door at 41, boss door at 45 (on upper platform)
 *   [43-55] Foundry wing — zone door at 51, boss door at 55
 *   [56-59] Right wall
 *
 * Tile indices: 0=air, 1=solid, 2=platform, 3=accent wall
 */

const W = 60;
const H = 18;

export function createHubLevel(): number[][] {
  const level: number[][] = [];
  for (let y = 0; y < H; y++) {
    level[y] = new Array(W).fill(0);
  }

  // ========== FLOOR & BOUNDARIES ==========
  // Ground floor (bottom 2 rows)
  for (let x = 0; x < W; x++) {
    level[H - 1][x] = 1;
    level[H - 2][x] = 1;
  }

  // Ceiling
  for (let x = 0; x < W; x++) {
    level[0][x] = 1;
  }

  // Boundary walls
  for (let y = 0; y < H - 2; y++) {
    level[y][0] = 3;
    level[y][W - 1] = 3;
  }

  // ========== CRYPTVAULT WING (left) ==========
  // One-way platform approach to zone door (tileX ~6)
  for (let x = 4; x < 9; x++) level[H - 4][x] = 2;

  // ========== GARDEN WING (center-left, upper platform) ==========
  // Raised platform for garden doors
  for (let x = 14; x < 21; x++) level[H - 5][x] = 2;

  // ========== CENTRAL PLAZA ==========
  // Shop platform — one-way so you can walk under it
  for (let x = 26; x < 34; x++) level[H - 4][x] = 2;

  // Upper walkway
  for (let x = 16; x < 44; x++) level[H - 7][x] = 2;

  // Access ramps to upper walkway
  for (let x = 12; x < 16; x++) level[H - 5][x] = 2;
  for (let x = 44; x < 48; x++) level[H - 5][x] = 2;

  // Upper alcove (above shop)
  for (let x = 27; x < 33; x++) level[H - 10][x] = 2;

  // ========== CITADEL WING (center-right, upper platform) ==========
  // Raised platform for citadel doors
  for (let x = 39; x < 46; x++) level[H - 5][x] = 2;

  // ========== FOUNDRY WING (right) ==========
  // One-way platform approach to zone door (tileX ~52)
  for (let x = 49; x < 55; x++) level[H - 4][x] = 2;

  return level;
}
