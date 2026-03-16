/**
 * Cryptvault — undead gothic catacombs.
 * Dark, atmospheric level with vertical shafts, burial alcoves,
 * hidden passages, and claustrophobic corridors.
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

  // Boundary walls (full height)
  for (let y = 0; y < H - 2; y++) {
    level[y][0] = 3;
    level[y][W - 1] = 3;
  }

  // ===== SECTION 1: Crypt entrance (tiles 2-15) =====
  // Low vaulted ceiling — oppressive atmosphere
  for (let x = 2; x < 12; x++) level[2][x] = 1;
  for (let x = 4; x < 10; x++) level[3][x] = 1;

  // Entry archway accent
  for (let y = 3; y < H - 3; y++) level[y][1] = 3;
  level[3][2] = 3;

  const s1Platforms: { x: number; y: number; w: number }[] = [
    { x: 4, y: H - 5, w: 4 },
    { x: 10, y: H - 7, w: 3 },
    { x: 5, y: H - 9, w: 3 },  // leads up to coffin shelf
  ];

  // Coffin shelves — solid blocks in the walls (burial alcoves)
  for (let y = H - 9; y <= H - 7; y++) {
    level[y][1] = 1;
    level[y][2] = 1;
  }
  for (let y = H - 6; y <= H - 4; y++) {
    level[y][1] = 1;
    level[y][2] = 1;
  }

  // ===== SECTION 2: Skeleton corridor (tiles 15-32) =====
  // First pit — narrow spike trap
  for (let px = 17; px < 19; px++) {
    level[H - 1][px] = 0;
    level[H - 2][px] = 0;
  }

  // Low wall barrier
  for (let wy = H - 4; wy < H - 2; wy++) {
    level[wy][15] = 1;
  }

  const s2Platforms: { x: number; y: number; w: number }[] = [
    { x: 19, y: H - 5, w: 5 },
    { x: 25, y: H - 7, w: 4 },
    { x: 21, y: H - 9, w: 3 },
    { x: 30, y: H - 5, w: 4 },
    // Upper passage — secret route above the corridor
    { x: 22, y: H - 12, w: 5 },
    { x: 28, y: H - 14, w: 4 },
  ];

  // Gothic pillars throughout the corridor
  const corridorPillars = [16, 24, 31];
  for (const px of corridorPillars) {
    level[H - 3][px] = 1;
    level[H - 4][px] = 1;
    level[H - 5][px] = 1;
  }

  // Overhead stone arches (ceiling detail)
  for (let x = 18; x < 26; x++) level[1][x] = 1;

  // ===== SECTION 3: Burial pit (tiles 32-42) =====
  // Wide pit — the deepest hazard, with rescue platforms
  for (let px = 34; px < 38; px++) {
    level[H - 1][px] = 0;
    level[H - 2][px] = 0;
  }

  const s3Platforms: { x: number; y: number; w: number }[] = [
    { x: 33, y: H - 4, w: 2 },   // ledge before pit
    { x: 35, y: H - 6, w: 2 },   // over pit
    { x: 38, y: H - 5, w: 3 },
    { x: 34, y: H - 9, w: 3 },   // high route over pit
    { x: 39, y: H - 8, w: 3 },
  ];

  // Burial chamber walls — creates a sunken tomb feel
  for (let y = H - 8; y < H - 2; y++) {
    level[y][33] = 1;
  }
  // Accent on chamber wall
  level[H - 9][33] = 3;

  // ===== SECTION 4: Ghost gallery (tiles 42-58) =====
  // Vertical platforming showcase — climb up through the gallery
  // This is where ghosts float — lots of vertical space

  // Raised floor sections
  for (let x = 45; x < 50; x++) {
    level[H - 3][x] = 1;
    level[H - 4][x] = 1;
  }

  // Pit in gallery
  for (let px = 54; px < 56; px++) {
    level[H - 1][px] = 0;
    level[H - 2][px] = 0;
  }

  const s4Platforms: { x: number; y: number; w: number }[] = [
    { x: 42, y: H - 5, w: 3 },
    { x: 46, y: H - 7, w: 3 },
    { x: 50, y: H - 5, w: 3 },
    { x: 43, y: H - 9, w: 3 },
    { x: 48, y: H - 10, w: 3 },
    { x: 53, y: H - 7, w: 3 },
    // Vertical tower — climb to the top for secret area
    { x: 44, y: H - 12, w: 3 },
    { x: 49, y: H - 14, w: 3 },
    { x: 44, y: H - 16, w: 4 },  // near-ceiling secret platform
    { x: 56, y: H - 5, w: 3 },
  ];

  // Gallery pillars — tall, atmospheric
  const galleryPillars = [42, 51];
  for (const px of galleryPillars) {
    for (let y = H - 7; y >= H - 12; y--) level[y][px] = 3;
  }

  // Ceiling vaults over gallery
  for (let x = 43; x < 52; x++) level[1][x] = 1;
  // Hanging accent (stalactites / chains)
  level[2][45] = 3;
  level[3][45] = 3;
  level[2][50] = 3;
  level[3][50] = 3;

  // ===== SECTION 5: Dark corridor (tiles 58-72) =====
  // Tight, claustrophobic — low ceiling sections force ground play
  // Low ceiling creates pressure
  for (let x = 59; x < 70; x++) level[4][x] = 1;
  for (let x = 61; x < 68; x++) level[5][x] = 1;

  // Pits in corridor
  for (let px = 63; px < 65; px++) {
    level[H - 1][px] = 0;
    level[H - 2][px] = 0;
  }
  for (let px = 69; px < 72; px++) {
    level[H - 1][px] = 0;
    level[H - 2][px] = 0;
  }

  const s5Platforms: { x: number; y: number; w: number }[] = [
    { x: 58, y: H - 5, w: 3 },
    { x: 63, y: H - 4, w: 2 },   // low over pit (ceiling forces crouch feel)
    { x: 66, y: H - 5, w: 3 },
    { x: 69, y: H - 5, w: 3 },   // over pit 2
    { x: 72, y: H - 6, w: 3 },
  ];

  // Bone piles — solid blocks scattered on ground
  level[H - 3][60] = 1;
  level[H - 3][67] = 1;

  // ===== SECTION 6: Catacomb descent (tiles 72-82) =====
  // Opens up again before boss — multi-level with wall structures
  const s6Platforms: { x: number; y: number; w: number }[] = [
    { x: 74, y: H - 5, w: 4 },
    { x: 73, y: H - 8, w: 3 },
    { x: 78, y: H - 6, w: 3 },
    { x: 76, y: H - 10, w: 4 },
    { x: 73, y: H - 13, w: 3 },  // high secret alcove
  ];

  // Catacomb wall structures
  for (let y = 3; y < H - 8; y++) level[y][75] = 1;
  // Opening in the wall (player can pass through gap)
  level[H - 6][75] = 0;
  level[H - 7][75] = 0;
  level[H - 8][75] = 0;

  // Tall accent pillars flanking catacomb
  for (let y = H - 8; y >= H - 14; y--) level[y][73] = 3;
  for (let y = H - 8; y >= H - 14; y--) level[y][80] = 3;

  // ===== BOSS ARENA (tiles 82-98) =====
  // Boss arena entrance wall (accent gate)
  for (let y = 0; y < H - 5; y++) {
    level[y][82] = 3;
  }

  // Boss arena ceiling
  for (let x = 83; x < W - 1; x++) {
    level[1][x] = 1;
  }

  // Boss arena platforms — symmetrical for fair boss fight
  const bossPlats: { x: number; y: number; w: number }[] = [
    { x: 85, y: H - 6, w: 4 },
    { x: 93, y: H - 6, w: 4 },
    { x: 89, y: H - 10, w: 4 },
    // Escape ledges on arena edges
    { x: 83, y: H - 8, w: 2 },
    { x: 97, y: H - 8, w: 2 },
  ];

  // Boss arena pillars (atmospheric, also tactical cover)
  level[H - 3][84] = 3;
  level[H - 4][84] = 3;
  level[H - 5][84] = 3;
  level[H - 3][97] = 3;
  level[H - 4][97] = 3;
  level[H - 5][97] = 3;

  // Throne platform — where Hollow King stands
  for (let x = 88; x < 93; x++) {
    level[H - 3][x] = 1;
  }
  // Accent trim on throne
  level[H - 4][88] = 3;
  level[H - 4][92] = 3;

  // ==== Place all platforms ====
  const allPlatforms = [
    ...s1Platforms, ...s2Platforms, ...s3Platforms, ...s4Platforms,
    ...s5Platforms, ...s6Platforms, ...bossPlats,
  ];

  for (const plat of allPlatforms) {
    for (let px = plat.x; px < plat.x + plat.w; px++) {
      if (px >= 0 && px < W && plat.y >= 0 && plat.y < H) {
        level[plat.y][px] = 2;
      }
    }
  }

  return level;
}
