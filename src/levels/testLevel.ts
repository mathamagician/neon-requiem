/**
 * Neon Foundry — industrial cyber-forge.
 * Zone 1 of the game. Features varied terrain, vertical sections,
 * secret alcoves, multi-level platforming, procedural mid-sections,
 * and a sealed boss arena.
 * Tile indices:
 *   0 = empty (air)
 *   1 = solid ground
 *   2 = one-way platform
 *   3 = neon accent wall
 *   4 = spikes (hazard, deals damage)
 */

import { generateSection, pickSectionTypes } from './proceduralGen';

export const LEVEL_WIDTH_TILES = 160;
export const LEVEL_HEIGHT_TILES = 22;

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

  // -- Boundary walls --
  for (let y = 0; y < H - 2; y++) {
    level[y][0] = 3;
    level[y][W - 1] = 3;
  }

  // ===== SECTION 1: Entry corridor (tiles 2-20) =====
  // Gentle introduction — low platforms, no pits
  const s1Platforms: { x: number; y: number; w: number }[] = [
    { x: 4, y: H - 5, w: 4 },
    { x: 10, y: H - 7, w: 3 },
    { x: 15, y: H - 5, w: 5 },
    // High secret ledge near ceiling with accent frame
    { x: 6, y: H - 12, w: 3 },
  ];
  // Entry archway accent
  for (let y = 3; y < H - 5; y++) level[y][2] = 3;
  level[3][3] = 3;
  // Ceiling overhang — gives a tunnel feel to the entry
  for (let x = 2; x < 8; x++) level[2][x] = 1;
  // Small pipe structures on ceiling
  for (let x = 12; x < 16; x++) level[1][x] = 1;

  // ===== SECTION 2: First pit + combat arena (tiles 20-35) =====
  // Pit 1 — narrow, forgiving
  for (let px = 21; px < 24; px++) {
    level[H - 1][px] = 0;
    level[H - 2][px] = 0;
  }
  const s2Platforms: { x: number; y: number; w: number }[] = [
    { x: 24, y: H - 5, w: 5 },
    { x: 26, y: H - 8, w: 3 },
    { x: 30, y: H - 5, w: 4 },
    { x: 32, y: H - 9, w: 3 },
  ];
  // Low wall barrier between sections — jumpable
  for (let wy = H - 4; wy < H - 2; wy++) {
    level[wy][20] = 1;
  }
  // Overhead machinery (solid blocks)
  level[3][26] = 1;
  level[3][27] = 1;
  level[4][26] = 1;
  level[4][27] = 1;

  // ===== SECTION 3: Vertical shaft + multi-level (tiles 35-52) =====
  // This is the signature section — a vertical shaft with platforms
  // going both up and across, rewarding exploration

  // Ground rises into a raised plateau (tiles 38-48)
  for (let x = 38; x < 48; x++) {
    level[H - 3][x] = 1;
    level[H - 4][x] = 1;
  }
  // Accent trim on plateau edges
  level[H - 5][38] = 3;
  level[H - 5][47] = 3;

  // Vertical shaft pit (deep, tiles 35-37)
  for (let px = 35; px < 38; px++) {
    level[H - 1][px] = 0;
    level[H - 2][px] = 0;
  }
  // Platform bridge over shaft
  const s3Platforms: { x: number; y: number; w: number }[] = [
    { x: 35, y: H - 5, w: 3 },   // over the pit
    { x: 40, y: H - 7, w: 3 },   // on the plateau
    { x: 44, y: H - 9, w: 3 },   // climbing higher
    { x: 40, y: H - 11, w: 4 },  // upper route
    { x: 46, y: H - 13, w: 3 },  // near ceiling secret area
    // Upper corridor platforms
    { x: 36, y: H - 13, w: 3 },  // connects to high route
    { x: 49, y: H - 5, w: 3 },   // descent from plateau
  ];
  // Accent pillars on the plateau
  level[H - 5][41] = 3;
  level[H - 6][41] = 3;
  level[H - 5][45] = 3;
  level[H - 6][45] = 3;

  // Ceiling structures over vertical section
  for (let x = 38; x < 48; x++) level[1][x] = 1;
  for (let x = 38; x < 42; x++) level[2][x] = 1;

  // Secret alcove — hidden nook in the ceiling structure
  // Player must platform to the very top to find it
  level[3][39] = 3;
  level[3][46] = 3;

  // ===== SECTION 4: Pipe run (tiles 52-65) =====
  // Fast-paced horizontal section with hazard pits
  // Pit 3
  for (let px = 54; px < 57; px++) {
    level[H - 1][px] = 0;
    level[H - 2][px] = 0;
  }
  // Pit 4
  for (let px = 62; px < 64; px++) {
    level[H - 1][px] = 0;
    level[H - 2][px] = 0;
  }
  const s4Platforms: { x: number; y: number; w: number }[] = [
    { x: 52, y: H - 5, w: 3 },
    { x: 56, y: H - 4, w: 2 },   // low rescue platform over pit
    { x: 58, y: H - 6, w: 3 },
    { x: 62, y: H - 5, w: 2 },   // over pit 4
    { x: 65, y: H - 7, w: 3 },
  ];
  // Overhead pipes (solid ceiling detail)
  for (let x = 53; x < 65; x++) level[2][x] = 1;
  // Hanging pipes — accent
  level[3][55] = 3;
  level[4][55] = 3;
  level[3][60] = 3;
  level[4][60] = 3;

  // ===== SECTION 5: Forge chamber (tiles 65-80) =====
  // Large open chamber with multi-level platforms
  // Raised floor sections
  for (let x = 70; x < 75; x++) {
    level[H - 3][x] = 1;
  }
  // Pit 5 — wider, more dangerous
  for (let px = 77; px < 81; px++) {
    level[H - 1][px] = 0;
    level[H - 2][px] = 0;
  }
  const s5Platforms: { x: number; y: number; w: number }[] = [
    { x: 67, y: H - 5, w: 4 },
    { x: 72, y: H - 7, w: 3 },
    { x: 67, y: H - 9, w: 3 },
    { x: 73, y: H - 10, w: 4 },
    { x: 78, y: H - 5, w: 3 },   // rescue platform in pit
    { x: 76, y: H - 8, w: 3 },
    // Upper secret area — reward for climbing
    { x: 69, y: H - 14, w: 5 },
  ];
  // Forge pillars
  const forgePillars = [68, 74];
  for (const px of forgePillars) {
    for (let y = H - 5; y >= H - 8; y--) level[y][px] = 3;
  }
  // Ceiling detail — forge hood
  for (let x = 68; x < 76; x++) level[1][x] = 1;
  for (let x = 70; x < 74; x++) level[2][x] = 1;

  // ===== SECTION 6: Pre-boss gauntlet (tiles 80-98) =====
  // Intense run with tight platforms and multiple hazards
  // Pit 6
  for (let px = 85; px < 88; px++) {
    level[H - 1][px] = 0;
    level[H - 2][px] = 0;
  }
  // Pit 7
  for (let px = 93; px < 96; px++) {
    level[H - 1][px] = 0;
    level[H - 2][px] = 0;
  }
  const s6Platforms: { x: number; y: number; w: number }[] = [
    { x: 81, y: H - 5, w: 4 },
    { x: 84, y: H - 8, w: 3 },
    { x: 88, y: H - 5, w: 4 },
    { x: 86, y: H - 10, w: 3 },  // high route over gauntlet
    { x: 91, y: H - 7, w: 3 },
    { x: 95, y: H - 5, w: 4 },
    { x: 93, y: H - 9, w: 3 },
  ];
  // Gauntlet walls — creates tight corridors
  for (let y = 2; y < H - 8; y++) level[y][83] = 1;
  for (let y = 2; y < H - 6; y++) level[y][90] = 1;

  // ===== PROCEDURAL SECTIONS (tiles 98-138) =====
  // Two generated sections between the gauntlet and boss arena
  const procTypes = pickSectionTypes(2, 42);
  generateSection(level, { H, startX: 98, endX: 118, type: procTypes[0], seed: 4201 });
  generateSection(level, { H, startX: 118, endX: 138, type: procTypes[1], seed: 4202 });

  // ===== BOSS ARENA (tiles 139-158) =====
  // Boss arena entrance wall (neon gate)
  for (let y = 0; y < H - 5; y++) {
    level[y][139] = 3;
  }

  // Boss arena ceiling
  for (let x = 140; x < W - 1; x++) {
    level[1][x] = 1;
  }

  // Boss arena platforms — staggered for dodging
  const bossPlats: { x: number; y: number; w: number }[] = [
    { x: 143, y: H - 6, w: 4 },
    { x: 151, y: H - 6, w: 4 },
    { x: 147, y: H - 10, w: 4 },
    // Small escape platforms on edges
    { x: 141, y: H - 9, w: 2 },
    { x: 156, y: H - 9, w: 2 },
  ];

  // Boss arena pillars
  level[H - 3][142] = 3;
  level[H - 4][142] = 3;
  level[H - 3][157] = 3;
  level[H - 4][157] = 3;

  // ===== Flow bridges — fill gaps between hand-crafted sections =====
  const bridges: { x: number; y: number; w: number }[] = [
    // Bridge from section 1 to section 2 (flat zone around tile 18-20)
    { x: 18, y: H - 4, w: 3 },
    // Bridge from section 2 to section 3 (tiles 33-35)
    { x: 33, y: H - 6, w: 3 },
    // Bridge from section 3 to section 4 (tiles 50-52)
    { x: 50, y: H - 4, w: 3 },
    // Bridge from section 5 to section 6 (tile 80)
    { x: 79, y: H - 4, w: 3 },
    // Extra mid-section platforms for flow in section 6
    { x: 96, y: H - 7, w: 3 },
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
  // Spike strips at pit edges and in the gauntlet — tile 4 placed on ground-level row
  const spikePositions = [
    // Pit 1 edges (section 2)
    { x: 20, y: H - 3 }, { x: 24, y: H - 3 },
    // Pipe run pit edges (section 4)
    { x: 53, y: H - 3 }, { x: 57, y: H - 3 },
    { x: 61, y: H - 3 }, { x: 64, y: H - 3 },
    // Forge pit edges (section 5)
    { x: 71, y: H - 3 }, { x: 76, y: H - 3 },
    // Gauntlet floor spikes (section 6)
    { x: 84, y: H - 3 }, { x: 85, y: H - 3 },
    { x: 91, y: H - 3 }, { x: 92, y: H - 3 },
    // Boss arena edge spikes
    { x: 140, y: H - 3 }, { x: 158, y: H - 3 },
  ];
  for (const sp of spikePositions) {
    if (sp.x >= 0 && sp.x < W && sp.y >= 0 && sp.y < H) {
      level[sp.y][sp.x] = 4;
    }
  }

  return level;
}

