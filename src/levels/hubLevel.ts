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
  // Archway frame for zone door (tileX ~6)
  for (let y = 2; y < H - 6; y++) level[y][3] = 3;
  level[2][4] = 3; level[2][5] = 3; level[2][6] = 3; level[2][7] = 3;
  for (let y = 2; y < H - 6; y++) level[y][8] = 3;
  // Stepped approach
  for (let x = 4; x < 9; x++) level[H - 4][x] = 2;

  // Boss practice door area (tileX ~10)
  for (let y = 4; y < H - 6; y++) level[y][9] = 3;
  level[4][10] = 3; level[4][11] = 3;
  for (let y = 4; y < H - 6; y++) level[y][12] = 3;

  // ========== GARDEN WING (center-left, upper platform) ==========
  // Raised platform for garden doors
  for (let x = 14; x < 21; x++) level[H - 5][x] = 2;
  // Archway frame
  level[H - 8][14] = 3; level[H - 8][20] = 3;
  level[H - 7][14] = 3; level[H - 7][20] = 3;
  level[H - 6][14] = 3; level[H - 6][20] = 3;

  // ========== CENTRAL PLAZA ==========
  // Raised shop platform
  for (let x = 26; x < 34; x++) level[H - 3][x] = 1;
  level[H - 4][26] = 2; level[H - 4][33] = 2;

  // Upper walkway
  for (let x = 16; x < 44; x++) level[H - 7][x] = 2;

  // Access ramps to upper walkway
  for (let x = 12; x < 16; x++) level[H - 5][x] = 2;
  for (let x = 44; x < 48; x++) level[H - 5][x] = 2;

  // Decorative pillars
  for (const px of [13, 22, 37, 46]) {
    level[H - 3][px] = 3;
    level[H - 4][px] = 3;
  }

  // Upper alcove (above shop)
  for (let x = 27; x < 33; x++) level[H - 10][x] = 2;
  level[H - 10][26] = 3; level[H - 10][33] = 3;
  level[H - 11][26] = 3; level[H - 11][33] = 3;

  // Ceiling arches
  level[1][15] = 1; level[1][16] = 1;
  level[1][43] = 1; level[1][44] = 1;

  // ========== CITADEL WING (center-right, upper platform) ==========
  // Raised platform for citadel doors
  for (let x = 39; x < 46; x++) level[H - 5][x] = 2;
  // Archway frame
  level[H - 8][39] = 3; level[H - 8][45] = 3;
  level[H - 7][39] = 3; level[H - 7][45] = 3;
  level[H - 6][39] = 3; level[H - 6][45] = 3;

  // ========== FOUNDRY WING (right) ==========
  // Archway frame for zone door (tileX ~51)
  for (let y = 2; y < H - 6; y++) level[y][49] = 3;
  level[2][50] = 3; level[2][51] = 3; level[2][52] = 3; level[2][53] = 3;
  for (let y = 2; y < H - 6; y++) level[y][54] = 3;
  // Stepped approach
  for (let x = 49; x < 55; x++) level[H - 4][x] = 2;

  // Boss practice door area (tileX ~55)
  for (let y = 4; y < H - 6; y++) level[y][47] = 3;
  level[4][48] = 3; level[4][47] = 3;
  for (let y = 4; y < H - 6; y++) level[y][56] = 3;

  return level;
}
