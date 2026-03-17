/**
 * Cryptvault — undead gothic catacombs.
 * Dark, atmospheric level with vertical shafts, burial alcoves,
 * hidden passages, claustrophobic corridors, and procedural mid-sections.
 * Tile indices: 0=air, 1=solid, 2=platform, 3=accent wall, 4=spikes
 */

import { generateSection, pickSectionTypes } from './proceduralGen';

const W = 140;
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

  // Entry archway accent — high only (non-blocking)
  for (let y = 3; y < H - 8; y++) level[y][1] = 3;

  const s1Platforms: { x: number; y: number; w: number }[] = [
    { x: 4, y: H - 5, w: 4 },
    { x: 10, y: H - 7, w: 3 },
    { x: 5, y: H - 9, w: 3 },  // leads up to coffin shelf
  ];

  // Coffin shelf — upper alcove only, doesn't block ground
  for (let y = H - 9; y <= H - 7; y++) {
    level[y][1] = 1;
    level[y][2] = 1;
  }

  // ===== SECTION 2: Skeleton corridor (tiles 15-32) =====
  // First pit — narrow spike trap
  for (let px = 17; px < 19; px++) {
    level[H - 1][px] = 0;
    level[H - 2][px] = 0;
  }

  // Section divider — one-way platform
  level[H - 4][15] = 2;

  const s2Platforms: { x: number; y: number; w: number }[] = [
    { x: 19, y: H - 5, w: 5 },
    { x: 25, y: H - 7, w: 4 },
    { x: 21, y: H - 9, w: 3 },
    { x: 30, y: H - 5, w: 4 },
    // Upper passage — secret route above the corridor
    { x: 22, y: H - 12, w: 5 },
    { x: 28, y: H - 14, w: 4 },
  ];

  // Gothic accent trim on ceiling (non-blocking)
  for (const px of [16, 24, 31]) {
    level[2][px] = 3;
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

  // Burial chamber wall — upper only, ground passage stays open
  for (let y = 2; y < H - 8; y++) {
    level[y][33] = 1;
  }

  // ===== SECTION 4: Ghost gallery (tiles 42-58) =====
  // Vertical platforming showcase — climb up through the gallery
  // This is where ghosts float — lots of vertical space

  // Raised floor — one-way platform so ground path stays open
  for (let x = 45; x < 50; x++) {
    level[H - 4][x] = 2;
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

  // Gallery accent trim on ceiling (non-blocking)
  level[2][42] = 3;
  level[2][51] = 3;

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

  // Bone pile accent (ceiling detail only)
  level[2][60] = 3;
  level[2][67] = 3;

  // ===== SECTION 6: Catacomb descent (tiles 72-82) =====
  // Opens up again before boss — multi-level with wall structures
  const s6Platforms: { x: number; y: number; w: number }[] = [
    { x: 74, y: H - 5, w: 4 },
    { x: 73, y: H - 8, w: 3 },
    { x: 78, y: H - 6, w: 3 },
    { x: 76, y: H - 10, w: 4 },
    { x: 73, y: H - 13, w: 3 },  // high secret alcove
  ];

  // Catacomb wall — upper only, ground passage stays open
  for (let y = 3; y < H - 10; y++) level[y][75] = 1;

  // Catacomb accent trim on ceiling (non-blocking)
  level[2][73] = 3;
  level[2][80] = 3;

  // ===== PROCEDURAL SECTIONS (tiles 82-122) =====
  const procTypes = pickSectionTypes(2, 77);
  generateSection(level, { H, startX: 82, endX: 102, type: procTypes[0], seed: 7701 });
  generateSection(level, { H, startX: 102, endX: 122, type: procTypes[1], seed: 7702 });

  // ===== BOSS ARENA (tiles 122-138) =====
  // Boss arena entrance wall (accent gate)
  for (let y = 0; y < H - 5; y++) {
    level[y][122] = 3;
  }

  // Boss arena ceiling
  for (let x = 123; x < W - 1; x++) {
    level[1][x] = 1;
  }

  // Boss arena platforms — symmetrical for fair boss fight
  const bossPlats: { x: number; y: number; w: number }[] = [
    { x: 125, y: H - 6, w: 4 },
    { x: 133, y: H - 6, w: 4 },
    { x: 129, y: H - 10, w: 4 },
    // Escape ledges on arena edges
    { x: 123, y: H - 8, w: 2 },
    { x: 137, y: H - 8, w: 2 },
  ];

  // Boss arena pillars (atmospheric, also tactical cover)
  level[H - 3][124] = 3;
  level[H - 4][124] = 3;
  level[H - 5][124] = 3;
  level[H - 3][137] = 3;
  level[H - 4][137] = 3;
  level[H - 5][137] = 3;

  // Throne platform — where Hollow King stands
  for (let x = 128; x < 133; x++) {
    level[H - 3][x] = 1;
  }
  // Accent trim on throne
  level[H - 4][128] = 3;
  level[H - 4][132] = 3;

  // ===== Flow bridges — fill gaps between hand-crafted sections =====
  const bridges: { x: number; y: number; w: number }[] = [
    // Bridge from section 1 to section 2 (tiles 13-15)
    { x: 13, y: H - 4, w: 3 },
    // Bridge from section 2 to section 3 (tiles 31-33)
    { x: 31, y: H - 5, w: 3 },
    // Bridge from section 3 to section 4 (tiles 40-42)
    { x: 40, y: H - 4, w: 3 },
    // Bridge from section 5 to section 6 (tiles 71-73)
    { x: 71, y: H - 4, w: 3 },
    // Extra mid-height platforms in ghost gallery for flow
    { x: 54, y: H - 9, w: 3 },
  ];

  // ==== Place all platforms ====
  const allPlatforms = [
    ...s1Platforms, ...s2Platforms, ...s3Platforms, ...s4Platforms,
    ...s5Platforms, ...s6Platforms, ...bridges, ...bossPlats,
  ];

  for (const plat of allPlatforms) {
    for (let px = plat.x; px < plat.x + plat.w; px++) {
      if (px >= 0 && px < W && plat.y >= 0 && plat.y < H) {
        level[plat.y][px] = 2;
      }
    }
  }

  // ==== Environmental hazards: Spikes ====
  // Purple spikes at pit edges and key chokepoints
  const spikePositions = [
    // First pit edges (section 2)
    { x: 20, y: H - 3 }, { x: 24, y: H - 3 },
    // Burial pit edges (section 3)
    { x: 32, y: H - 3 }, { x: 41, y: H - 3 },
    // Gallery pit edges (section 4)
    { x: 48, y: H - 3 }, { x: 53, y: H - 3 },
    // Dark corridor pits (section 5)
    { x: 61, y: H - 3 }, { x: 64, y: H - 3 },
    { x: 68, y: H - 3 }, { x: 71, y: H - 3 },
    // Catacomb descent (section 6)
    { x: 78, y: H - 3 }, { x: 79, y: H - 3 },
    // Boss arena edges
    { x: 125, y: H - 3 }, { x: 137, y: H - 3 },
  ];
  for (const sp of spikePositions) {
    if (sp.x >= 0 && sp.x < W && sp.y >= 0 && sp.y < H) {
      level[sp.y][sp.x] = 4;
    }
  }

  return level;
}
