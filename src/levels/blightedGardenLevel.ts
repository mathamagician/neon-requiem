/**
 * Blighted Garden — overgrown toxic garden.
 * Nature has reclaimed a tech facility: poison vines, toxic pools,
 * bioluminescent spores, corrupted flora, and procedural mid-sections.
 * Tile indices: 0=air, 1=solid, 2=platform, 3=accent wall, 4=spikes
 */

import { generateSection, pickSectionTypes } from './proceduralGen';

const W = 150;
const H = 22;

export function getBlightedGardenTiles(): number[][] {
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

  // ===== SECTION 1: Entrance corridor (tiles 2-15) =====
  // Overgrown tunnel — roots hanging from ceiling, mossy ground

  // Low ceiling overhang — creates a tunnel feel
  for (let x = 2; x < 10; x++) level[2][x] = 1;
  for (let x = 2; x < 6; x++) level[3][x] = 1;

  // Vine archway accent — upper only (non-blocking)
  for (let y = 3; y < H - 8; y++) level[y][2] = 3;

  // Mossy mound — one-way platform, doesn't block ground
  for (let x = 8; x < 12; x++) level[H - 4][x] = 2;

  const s1Platforms: { x: number; y: number; w: number }[] = [
    { x: 4, y: H - 5, w: 4 },
    { x: 10, y: H - 7, w: 3 },
    { x: 13, y: H - 5, w: 3 },
    // Secret high ledge — hidden among ceiling roots
    { x: 5, y: H - 12, w: 3 },
  ];

  // Hanging root detail from ceiling
  level[3][7] = 3;
  level[4][7] = 3;
  level[3][12] = 3;

  // ===== SECTION 2: Poison pit section (tiles 15-30) =====
  // Toxic pits with spikes, narrow platforms above — punishing but fair

  // Section divider — one-way platform
  level[H - 4][15] = 2;

  // Toxic pit 1 (wide)
  for (let px = 17; px < 21; px++) {
    level[H - 1][px] = 0;
    level[H - 2][px] = 0;
  }

  // Toxic pit 2
  for (let px = 24; px < 27; px++) {
    level[H - 1][px] = 0;
    level[H - 2][px] = 0;
  }

  // Toxic pit 3 (narrow)
  for (let px = 28; px < 30; px++) {
    level[H - 1][px] = 0;
    level[H - 2][px] = 0;
  }

  const s2Platforms: { x: number; y: number; w: number }[] = [
    { x: 16, y: H - 5, w: 3 },
    { x: 19, y: H - 4, w: 2 },    // low rescue over pit 1
    { x: 21, y: H - 6, w: 3 },
    { x: 25, y: H - 5, w: 2 },    // over pit 2
    { x: 23, y: H - 8, w: 3 },    // upper route
    { x: 28, y: H - 4, w: 2 },    // over pit 3
    { x: 18, y: H - 10, w: 3 },   // high route across poison section
    { x: 26, y: H - 10, w: 3 },   // connects high route
  ];

  // Thorny overhang ceiling detail
  for (let x = 18; x < 26; x++) level[2][x] = 1;
  level[3][20] = 3;
  level[3][24] = 3;

  // ===== SECTION 3: Vertical garden shaft (tiles 30-45) =====
  // Tall climbing section — vine platforms going up, rewarding exploration

  // Shaft walls — upper only, ground passage stays open
  for (let y = 4; y < H - 8; y++) level[y][30] = 1;
  for (let y = 6; y < H - 8; y++) level[y][45] = 1;

  // Ground drops away in the shaft — deep pit
  for (let px = 31; px < 35; px++) {
    level[H - 1][px] = 0;
    level[H - 2][px] = 0;
  }

  // Raised earth — one-way platform, doesn't block ground
  for (let x = 40; x < 45; x++) {
    level[H - 4][x] = 2;
  }

  const s3Platforms: { x: number; y: number; w: number }[] = [
    { x: 31, y: H - 4, w: 3 },    // over the pit — first step up
    { x: 35, y: H - 6, w: 3 },    // stepping stone
    { x: 32, y: H - 8, w: 3 },    // zigzag left
    { x: 37, y: H - 7, w: 3 },    // mid-right
    { x: 34, y: H - 10, w: 3 },   // zigzag left higher
    { x: 39, y: H - 9, w: 3 },    // mid-right higher
    { x: 36, y: H - 12, w: 3 },   // near top
    { x: 41, y: H - 11, w: 3 },   // high right
    { x: 33, y: H - 14, w: 4 },   // secret top platform — reward ledge
    { x: 39, y: H - 14, w: 3 },   // connects to exit at top
  ];

  // Accent vines on shaft walls — high only
  level[5][30] = 3;
  level[7][30] = 3;
  level[5][45] = 3;
  level[7][45] = 3;

  // Ceiling structures — canopy above the shaft
  for (let x = 31; x < 44; x++) level[1][x] = 1;
  for (let x = 33; x < 40; x++) level[2][x] = 1;
  // Gap in ceiling for the secret area
  level[1][37] = 0;
  level[1][38] = 0;

  // ===== SECTION 4: Canopy run (tiles 45-60) =====
  // High-speed platforming across treetop platforms with gaps below
  // The shaft wall at 45 has a gap at the top for passage

  // Open the shaft exit at upper levels
  for (let y = 2; y < 6; y++) level[y][45] = 0;

  // Canopy — elevated one-way platform, ground stays passable
  for (let x = 46; x < 60; x++) {
    level[H - 4][x] = 2;
  }
  // Gaps in the canopy and ground
  for (const [start, end] of [[49, 51], [54, 56], [58, 60]]) {
    for (let gx = start; gx < end; gx++) {
      level[H - 4][gx] = 0; // remove canopy platform
      level[H - 2][gx] = 0; // remove ground
      level[H - 1][gx] = 0;
    }
  }

  const s4Platforms: { x: number; y: number; w: number }[] = [
    { x: 46, y: H - 6, w: 3 },    // entry platform from shaft
    { x: 49, y: H - 5, w: 2 },    // over gap 1
    { x: 52, y: H - 7, w: 3 },    // high route
    { x: 54, y: H - 5, w: 2 },    // over gap 2
    { x: 57, y: H - 6, w: 3 },    // approach gap 3
    { x: 47, y: H - 10, w: 3 },   // upper canopy — secret high route
    { x: 53, y: H - 10, w: 3 },   // upper canopy continued
    { x: 58, y: H - 8, w: 2 },    // over gap 3
  ];

  // Canopy ceiling — leafy overhang
  for (let x = 46; x < 60; x++) level[3][x] = 1;
  // Hanging vines from canopy ceiling
  level[4][48] = 3;
  level[5][48] = 3;
  level[4][52] = 3;
  level[4][57] = 3;
  level[5][57] = 3;

  // ===== SECTION 5: Greenhouse chamber (tiles 60-75) =====
  // Large open area, multi-level, wide pit at bottom center

  // Wide toxic pool pit
  for (let px = 64; px < 72; px++) {
    level[H - 1][px] = 0;
    level[H - 2][px] = 0;
  }

  // Raised earth — one-way platforms, ground stays open
  for (let x = 60; x < 64; x++) level[H - 4][x] = 2;
  for (let x = 72; x < 76; x++) level[H - 4][x] = 2;

  const s5Platforms: { x: number; y: number; w: number }[] = [
    { x: 61, y: H - 6, w: 4 },    // left lower
    { x: 66, y: H - 5, w: 3 },    // rescue platform over pit
    { x: 71, y: H - 6, w: 4 },    // right lower
    { x: 63, y: H - 9, w: 3 },    // left upper
    { x: 68, y: H - 8, w: 3 },    // center upper
    { x: 73, y: H - 9, w: 3 },    // right upper
    { x: 66, y: H - 11, w: 4 },   // high center — combat platform
    // Secret alcove top-left of greenhouse
    { x: 61, y: H - 14, w: 3 },
    // Secret alcove top-right
    { x: 73, y: H - 13, w: 3 },
  ];

  // Greenhouse glass ceiling
  for (let x = 61; x < 75; x++) level[1][x] = 1;
  for (let x = 63; x < 73; x++) level[2][x] = 1;

  // Greenhouse accent on ceiling (non-blocking)
  level[2][62] = 3;
  level[2][74] = 3;

  // Center chandelier / hanging garden
  level[3][67] = 3;
  level[3][68] = 3;
  level[4][67] = 3;
  level[4][68] = 3;

  // ===== SECTION 6: Pre-boss gauntlet (tiles 75-90) =====
  // Tight corridors, spike traps, thorn walls — intense

  // Gauntlet walls — upper only, ground passage stays open
  for (let y = 2; y < H - 10; y++) level[y][78] = 1;
  for (let y = 4; y < H - 10; y++) level[y][84] = 1;

  // Gauntlet pits
  for (let px = 80; px < 83; px++) {
    level[H - 1][px] = 0;
    level[H - 2][px] = 0;
  }
  for (let px = 86; px < 89; px++) {
    level[H - 1][px] = 0;
    level[H - 2][px] = 0;
  }

  const s6Platforms: { x: number; y: number; w: number }[] = [
    { x: 76, y: H - 5, w: 3 },    // entry
    { x: 79, y: H - 7, w: 3 },    // over corridor wall gap
    { x: 80, y: H - 4, w: 2 },    // rescue over pit 1
    { x: 83, y: H - 5, w: 2 },    // between walls
    { x: 85, y: H - 8, w: 3 },    // over corridor wall 2
    { x: 86, y: H - 4, w: 2 },    // rescue over pit 2
    { x: 88, y: H - 6, w: 3 },    // exit approach
    { x: 81, y: H - 10, w: 3 },   // high bypass route
    { x: 87, y: H - 10, w: 3 },   // high route continued
  ];

  // Thorny ceiling detail
  for (let x = 76; x < 90; x++) level[1][x] = 1;
  level[2][79] = 3;
  level[2][83] = 3;
  level[2][87] = 3;

  // ===== PROCEDURAL SECTIONS (tiles 90-130) =====
  const procTypes = pickSectionTypes(2, 55);
  generateSection(level, { H, startX: 90, endX: 110, type: procTypes[0], seed: 5501 });
  generateSection(level, { H, startX: 110, endX: 130, type: procTypes[1], seed: 5502 });

  // ===== BOSS ARENA (tiles 130-148) =====
  // Walled arena — entrance gate, platforms for dodging, edge spikes

  // Boss arena entrance wall (vine gate)
  for (let y = 0; y < H - 4; y++) {
    level[y][130] = 3;
  }
  // Solid block at bottom of gate to seal it
  for (let y = H - 4; y < H - 2; y++) {
    level[y][130] = 1;
  }

  // Boss arena ceiling
  for (let x = 131; x < W - 1; x++) {
    level[1][x] = 1;
  }

  // Boss arena platforms — staggered for dodging boss attacks
  const bossPlats: { x: number; y: number; w: number }[] = [
    { x: 134, y: H - 6, w: 4 },    // left combat platform
    { x: 143, y: H - 6, w: 4 },    // right combat platform
    { x: 139, y: H - 10, w: 4 },   // center high platform
    // Small escape ledges on arena edges
    { x: 132, y: H - 9, w: 2 },
    { x: 147, y: H - 9, w: 2 },
    // Mid-height side platforms for ranged attacks
    { x: 133, y: H - 13, w: 3 },
    { x: 145, y: H - 13, w: 3 },
  ];

  // Boss arena accent pillars
  level[H - 3][133] = 3;
  level[H - 4][133] = 3;
  level[H - 3][148] = 3;
  level[H - 4][148] = 3;

  // Central root structure in arena
  level[H - 3][140] = 1;
  level[H - 4][140] = 1;
  level[H - 5][140] = 3;

  // ===== Flow bridges — fill gaps between hand-crafted sections =====
  const bridges: { x: number; y: number; w: number }[] = [
    // Bridge into poison pits (tile 15-16)
    { x: 14, y: H - 4, w: 2 },
    // Bridge from poison section to vertical shaft (tiles 29-31)
    { x: 29, y: H - 5, w: 3 },
    // Extra stepping stone in vertical shaft
    { x: 43, y: H - 6, w: 3 },
    // Bridge from canopy to greenhouse (tiles 59-61)
    { x: 59, y: H - 5, w: 3 },
    // Bridge from greenhouse to gauntlet (tiles 75-76)
    { x: 75, y: H - 4, w: 3 },
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
  const spikePositions = [
    // Poison pit edges (section 2)
    { x: 16, y: H - 3 }, { x: 21, y: H - 3 },
    { x: 23, y: H - 3 }, { x: 27, y: H - 3 },
    // Shaft pit edge (section 3)
    { x: 30, y: H - 3 }, { x: 35, y: H - 3 },
    // Canopy gap edges (section 4)
    { x: 48, y: H - 3 }, { x: 51, y: H - 3 },
    { x: 53, y: H - 3 }, { x: 56, y: H - 3 },
    // Greenhouse pit edges (section 5)
    { x: 63, y: H - 3 }, { x: 72, y: H - 3 },
    // Inside greenhouse pit — extra danger
    { x: 65, y: H - 3 }, { x: 70, y: H - 3 },
    // Gauntlet spikes (section 6) — dense hazard zone
    { x: 79, y: H - 3 }, { x: 80, y: H - 3 },
    { x: 83, y: H - 3 },
    { x: 85, y: H - 3 }, { x: 89, y: H - 3 },
    // Boss arena edge spikes
    { x: 131, y: H - 3 }, { x: 132, y: H - 3 },
    { x: 147, y: H - 3 }, { x: 148, y: H - 3 },
  ];

  for (const sp of spikePositions) {
    if (sp.x >= 0 && sp.x < W && sp.y >= 0 && sp.y < H) {
      level[sp.y][sp.x] = 4;
    }
  }

  return level;
}
