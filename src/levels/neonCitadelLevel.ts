/**
 * Neon Citadel — high-tech cyber fortress (Zone 4).
 * Neon-lit corridors, data streams, holographic barriers,
 * server racks, fortified command center, and procedural mid-sections.
 * Tile indices: 0=air, 1=solid, 2=platform, 3=accent wall, 4=spikes
 */

import { generateSection, pickSectionTypes } from './proceduralGen';

const W = 160;
const H = 22;

export function getNeonCitadelTiles(): number[][] {
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
  // Tight security corridor with laser grids, accent walls as data conduits

  // Low ceiling — creates claustrophobic corridor
  for (let x = 2; x < 15; x++) level[3][x] = 1;
  for (let x = 2; x < 10; x++) level[4][x] = 1;

  // Data conduit accent walls along corridor
  for (let y = 5; y < H - 4; y++) level[y][2] = 3;
  for (let y = 5; y < H - 4; y++) level[y][8] = 3;
  for (let y = 5; y < H - 4; y++) level[y][14] = 3;

  // Passage gaps in conduit walls
  for (let y = H - 7; y < H - 4; y++) level[y][8] = 0;
  for (let y = H - 7; y < H - 4; y++) level[y][14] = 0;

  // Raised floor segments (security checkpoints)
  for (let x = 5; x < 8; x++) level[H - 3][x] = 1;
  for (let x = 11; x < 14; x++) level[H - 3][x] = 1;

  const s1Platforms: { x: number; y: number; w: number }[] = [
    { x: 3, y: H - 6, w: 4 },
    { x: 9, y: H - 5, w: 4 },
    // Secret alcove above ceiling — reachable through gap at x=10
    { x: 10, y: 2, w: 3 },
  ];

  // Ceiling gap for secret alcove access
  level[3][10] = 0;
  level[3][11] = 0;
  level[3][12] = 0;

  // ===== SECTION 2: Server room (tiles 15-30) =====
  // Large open room with stacked platform "server racks"

  // Ceiling opens up for the tall room
  for (let x = 16; x < 30; x++) level[1][x] = 1;

  // Server rack columns (accent walls with platforms between)
  const rackColumns = [17, 21, 25, 29];
  for (const col of rackColumns) {
    for (let y = H - 8; y < H - 2; y++) level[y][col] = 3;
  }

  const s2Platforms: { x: number; y: number; w: number }[] = [
    // Bottom rack row
    { x: 18, y: H - 4, w: 3 },
    { x: 22, y: H - 4, w: 3 },
    { x: 26, y: H - 4, w: 3 },
    // Middle rack row
    { x: 16, y: H - 7, w: 3 },
    { x: 22, y: H - 7, w: 3 },
    { x: 27, y: H - 7, w: 3 },
    // Top rack row
    { x: 18, y: H - 10, w: 4 },
    { x: 24, y: H - 10, w: 4 },
    // High maintenance catwalk
    { x: 16, y: H - 13, w: 5 },
    { x: 24, y: H - 13, w: 5 },
    // Secret alcove — top of server room, behind ceiling
    { x: 20, y: 3, w: 3 },
  ];

  // Gap in ceiling for secret access
  level[1][20] = 0;
  level[1][21] = 0;
  level[1][22] = 0;

  // ===== SECTION 3: Vertical data shaft (tiles 30-45) =====
  // Tall shaft with zigzag platforms, spike walls on sides

  // Shaft walls
  for (let y = 2; y < H - 2; y++) level[y][30] = 1;
  for (let y = 2; y < H - 2; y++) level[y][45] = 1;

  // Passage openings in shaft walls
  for (let y = H - 5; y < H - 2; y++) level[y][30] = 0;
  for (let y = 3; y < 6; y++) level[y][45] = 0;

  // Remove ground inside shaft to create deep pit
  for (let px = 31; px < 45; px++) {
    level[H - 1][px] = 0;
    level[H - 2][px] = 0;
  }
  // Small landing at bottom-left entry
  for (let px = 31; px < 34; px++) {
    level[H - 1][px] = 1;
    level[H - 2][px] = 1;
  }

  // Shaft ceiling
  for (let x = 31; x < 45; x++) level[1][x] = 1;

  const s3Platforms: { x: number; y: number; w: number }[] = [
    // Zigzag climb from bottom-left to top-right
    { x: 31, y: H - 5, w: 3 },
    { x: 37, y: H - 6, w: 3 },
    { x: 33, y: H - 8, w: 3 },
    { x: 40, y: H - 7, w: 3 },
    { x: 35, y: H - 10, w: 3 },
    { x: 41, y: H - 9, w: 3 },
    { x: 33, y: H - 12, w: 3 },
    { x: 39, y: H - 11, w: 3 },
    { x: 36, y: H - 14, w: 3 },
    { x: 42, y: H - 13, w: 3 },
    // Upper shaft platforms — stepping stones to exit
    { x: 38, y: H - 16, w: 3 },
    { x: 33, y: H - 17, w: 3 },
    { x: 40, y: 6, w: 3 },
    // Top exit platform
    { x: 42, y: 4, w: 3 },
    // Secret ledge — hard to reach, tucked against left wall near top
    { x: 31, y: 4, w: 3 },
  ];

  // Accent data stream lines on shaft walls
  level[6][30] = 3;
  level[9][30] = 3;
  level[12][30] = 3;
  level[15][30] = 3;
  level[5][45] = 3;
  level[8][45] = 3;
  level[11][45] = 3;
  level[14][45] = 3;

  // ===== SECTION 4: Neon highway (tiles 45-65) =====
  // Long horizontal run with gaps and varied-height platforms

  // Open the shaft exit at top for passage into highway
  // (already handled by passage openings above)

  // Highway elevated road surface
  for (let x = 46; x < 65; x++) level[H - 3][x] = 1;

  // Gaps in the highway — must jump across
  const highwayGaps = [
    { start: 49, end: 51 },
    { start: 54, end: 56 },
    { start: 59, end: 62 },
  ];
  for (const gap of highwayGaps) {
    for (let gx = gap.start; gx < gap.end; gx++) {
      level[H - 3][gx] = 0;
      level[H - 2][gx] = 0;
      level[H - 1][gx] = 0;
    }
  }

  const s4Platforms: { x: number; y: number; w: number }[] = [
    // Entry from shaft — drops to highway level
    { x: 46, y: H - 6, w: 3 },
    // Over gap 1
    { x: 49, y: H - 5, w: 2 },
    // Mid-run platforms at varying heights
    { x: 52, y: H - 7, w: 3 },
    // Over gap 2
    { x: 54, y: H - 5, w: 2 },
    // Speed section platforms
    { x: 57, y: H - 6, w: 2 },
    // Over gap 3 — wider, needs two hops
    { x: 59, y: H - 4, w: 2 },
    { x: 61, y: H - 6, w: 2 },
    // High-speed upper route
    { x: 47, y: H - 10, w: 3 },
    { x: 52, y: H - 11, w: 3 },
    { x: 57, y: H - 10, w: 3 },
    { x: 62, y: H - 9, w: 3 },
  ];

  // Highway ceiling — creates tunnel feel
  for (let x = 46; x < 65; x++) level[3][x] = 1;

  // Neon accent strips on ceiling
  level[4][48] = 3;
  level[4][53] = 3;
  level[4][58] = 3;
  level[4][63] = 3;

  // ===== SECTION 5: Control center (tiles 65-80) =====
  // Open room with elevated command platform in center, multiple levels

  // Control center ceiling
  for (let x = 66; x < 80; x++) level[1][x] = 1;

  // Central command pillar base
  for (let x = 70; x < 75; x++) level[H - 3][x] = 1;
  for (let x = 71; x < 74; x++) level[H - 4][x] = 1;

  // Side structural walls (partial height)
  for (let y = H - 8; y < H - 3; y++) level[y][66] = 3;
  for (let y = H - 8; y < H - 3; y++) level[y][79] = 3;

  const s5Platforms: { x: number; y: number; w: number }[] = [
    // Ground-level side platforms
    { x: 66, y: H - 5, w: 3 },
    { x: 76, y: H - 5, w: 3 },
    // Mid-level access platforms
    { x: 67, y: H - 8, w: 3 },
    { x: 76, y: H - 8, w: 3 },
    // Central command platform (elevated)
    { x: 70, y: H - 8, w: 5 },
    // Upper observation platforms
    { x: 67, y: H - 12, w: 4 },
    { x: 75, y: H - 12, w: 4 },
    // Top command deck — overlooking entire center
    { x: 70, y: H - 14, w: 5 },
    // Secret alcove — high left corner behind structural wall
    { x: 66, y: 3, w: 3 },
  ];

  // Holographic display accents in center
  level[H - 5][72] = 3;
  level[H - 6][72] = 3;
  level[H - 5][73] = 3;

  // Ceiling hanging accent (chandelier / hologram projector)
  level[2][72] = 3;
  level[2][73] = 3;
  level[3][72] = 3;
  level[3][73] = 3;

  // ===== SECTION 6: Firewall gauntlet (tiles 80-95) =====
  // Dense platforming with spikes, narrow passages, alternating spike/platform rows

  // Gauntlet ceiling — low and oppressive
  for (let x = 80; x < 95; x++) level[2][x] = 1;

  // Internal walls creating narrow corridors
  for (let y = 5; y < H - 4; y++) level[y][84] = 1;
  for (let y = 5; y < H - 6; y++) level[y][89] = 1;

  // Passage gaps through internal walls
  for (let y = H - 7; y < H - 4; y++) level[y][84] = 0;
  for (let y = H - 9; y < H - 6; y++) level[y][89] = 0;

  // Pits in gauntlet floor
  for (let px = 81; px < 84; px++) {
    level[H - 1][px] = 0;
    level[H - 2][px] = 0;
  }
  for (let px = 86; px < 89; px++) {
    level[H - 1][px] = 0;
    level[H - 2][px] = 0;
  }
  for (let px = 91; px < 94; px++) {
    level[H - 1][px] = 0;
    level[H - 2][px] = 0;
  }

  const s6Platforms: { x: number; y: number; w: number }[] = [
    // Bottom route through corridors
    { x: 80, y: H - 4, w: 2 },
    { x: 82, y: H - 6, w: 2 },
    { x: 85, y: H - 5, w: 2 },
    { x: 87, y: H - 4, w: 2 },
    { x: 90, y: H - 5, w: 2 },
    { x: 92, y: H - 4, w: 2 },
    // Mid-level alternating platforms
    { x: 81, y: H - 9, w: 3 },
    { x: 85, y: H - 8, w: 3 },
    { x: 90, y: H - 9, w: 3 },
    // High bypass route — skilled players can skip the worst spikes
    { x: 80, y: H - 12, w: 3 },
    { x: 85, y: H - 12, w: 3 },
    { x: 91, y: H - 12, w: 3 },
    // Secret alcove above gauntlet ceiling
    { x: 86, y: 1, w: 3 },
  ];

  // Gap in gauntlet ceiling for secret access
  level[2][86] = 0;
  level[2][87] = 0;
  level[2][88] = 0;

  // ===== PROCEDURAL SECTIONS (tiles 95-135) =====
  const procTypes = pickSectionTypes(2, 99);
  generateSection(level, { H, startX: 95, endX: 115, type: procTypes[0], seed: 9901 });
  generateSection(level, { H, startX: 115, endX: 135, type: procTypes[1], seed: 9902 });

  // ===== BOSS ARENA (tiles 135-158) =====
  // Large open arena with side platforms, center platform, accent wall gate

  // Boss gate — accent wall entrance
  for (let y = 0; y < H - 4; y++) {
    level[y][135] = 3;
  }
  // Solid block at bottom of gate
  for (let y = H - 4; y < H - 2; y++) {
    level[y][135] = 1;
  }

  // Boss arena ceiling — high, giving room for the fight
  for (let x = 136; x < W - 1; x++) {
    level[1][x] = 1;
  }

  // Slight raised floor at arena edges for containment
  for (let x = 136; x < 139; x++) level[H - 3][x] = 1;
  for (let x = 155; x < 158; x++) level[H - 3][x] = 1;

  const bossPlats: { x: number; y: number; w: number }[] = [
    // Left elevated combat platform
    { x: 137, y: H - 7, w: 5 },
    // Right elevated combat platform
    { x: 152, y: H - 7, w: 5 },
    // Center platform — main fighting stage
    { x: 144, y: H - 5, w: 6 },
    // High center platform — for aerial dodging
    { x: 145, y: H - 11, w: 4 },
    // Left wall escape ledge
    { x: 136, y: H - 11, w: 3 },
    // Right wall escape ledge
    { x: 155, y: H - 11, w: 3 },
    // Upper side perches — for ranged attacks
    { x: 137, y: H - 15, w: 3 },
    { x: 154, y: H - 15, w: 3 },
  ];

  // Boss arena accent pillars
  level[H - 3][138] = 3;
  level[H - 4][138] = 3;
  level[H - 3][156] = 3;
  level[H - 4][156] = 3;

  // Central holographic pedestal
  level[H - 3][147] = 1;
  level[H - 4][147] = 1;
  level[H - 5][147] = 3;

  // ===== Flow bridges — fill gaps between hand-crafted sections =====
  const bridges: { x: number; y: number; w: number }[] = [
    // Bridge from entrance to server room (tiles 14-16)
    { x: 14, y: H - 5, w: 3 },
    // Bridge from server room to data shaft (tiles 28-30)
    { x: 28, y: H - 4, w: 3 },
    // Bridge from neon highway to control center (tiles 64-66)
    { x: 64, y: H - 5, w: 3 },
    // Bridge from control center to firewall (tiles 79-81)
    { x: 79, y: H - 4, w: 3 },
    // Extra mid-height in firewall for flow
    { x: 93, y: H - 7, w: 3 },
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
    // Section 1: Laser grids in entrance corridor
    // Ceiling spikes (hanging lasers)
    { x: 4, y: 5 }, { x: 5, y: 5 }, { x: 6, y: 5 },
    // Floor spikes between checkpoints
    { x: 9, y: H - 3 }, { x: 10, y: H - 3 },
    // Section 2: Server room hazards — between rack columns
    { x: 19, y: H - 3 }, { x: 23, y: H - 3 },
    // Section 3: Shaft spike hazards — walls
    { x: 31, y: H - 3 }, { x: 32, y: H - 3 },
    { x: 43, y: H - 3 }, { x: 44, y: H - 3 },
    // Section 4: Highway gap edges
    { x: 48, y: H - 3 }, { x: 51, y: H - 3 },
    { x: 53, y: H - 3 }, { x: 56, y: H - 3 },
    // Section 6: Firewall gauntlet — dense spike zone
    // Corridor floor spikes
    { x: 80, y: H - 3 }, { x: 81, y: H - 3 },
    { x: 83, y: H - 3 },
    { x: 85, y: H - 3 }, { x: 86, y: H - 3 },
    { x: 88, y: H - 3 },
    { x: 90, y: H - 3 }, { x: 91, y: H - 3 },
    { x: 93, y: H - 3 },
    // Ceiling spikes in gauntlet
    { x: 82, y: 3 }, { x: 87, y: 3 }, { x: 92, y: 3 },
    // Boss arena edge spikes
    { x: 136, y: H - 3 }, { x: 157, y: H - 3 },
  ];

  for (const sp of spikePositions) {
    if (sp.x >= 0 && sp.x < W && sp.y >= 0 && sp.y < H) {
      level[sp.y][sp.x] = 4;
    }
  }

  return level;
}
