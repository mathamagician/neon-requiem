/**
 * The Void Nexus — endgame zone (Zone 5).
 * Unlocked after defeating all 4 bosses. The source of the corruption.
 * Floating platforms over void, glitch effects, mixed enemy types,
 * and a final boss arena.
 * Tile indices: 0=air, 1=solid, 2=platform, 3=accent wall, 4=spikes
 */

import { generateSection, pickSectionTypes } from './proceduralGen';

const W = 180;
const H = 22;

export function getVoidNexusTiles(): number[][] {
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

  // ===== SECTION 1: Entry rift (tiles 2-18) =====
  // The void tears open — platforms over nothingness
  // Pit at entry — forces immediate jumping
  for (let px = 4; px < 7; px++) {
    level[H - 1][px] = 0;
    level[H - 2][px] = 0;
  }

  const s1Platforms: { x: number; y: number; w: number }[] = [
    { x: 4, y: H - 4, w: 3 },    // over entry pit
    { x: 8, y: H - 6, w: 3 },
    { x: 12, y: H - 5, w: 4 },
    { x: 16, y: H - 7, w: 3 },
    // High secret
    { x: 6, y: H - 11, w: 3 },
  ];

  // ===== SECTION 2: Void bridge (tiles 18-35) =====
  // Long gap with floating platforms — no ground for most of it
  for (let px = 20; px < 32; px++) {
    level[H - 1][px] = 0;
    level[H - 2][px] = 0;
  }

  const s2Platforms: { x: number; y: number; w: number }[] = [
    { x: 18, y: H - 5, w: 3 },
    { x: 21, y: H - 6, w: 3 },
    { x: 24, y: H - 4, w: 2 },    // low rescue
    { x: 27, y: H - 7, w: 3 },
    { x: 30, y: H - 5, w: 3 },
    { x: 33, y: H - 6, w: 3 },
    // Upper route
    { x: 20, y: H - 10, w: 3 },
    { x: 25, y: H - 11, w: 3 },
    { x: 30, y: H - 10, w: 3 },
  ];

  // ===== SECTION 3: Corruption chamber (tiles 35-55) =====
  // Solid ground returns, multi-level combat arena
  for (let px = 40; px < 43; px++) {
    level[H - 1][px] = 0;
    level[H - 2][px] = 0;
  }
  for (let px = 48; px < 51; px++) {
    level[H - 1][px] = 0;
    level[H - 2][px] = 0;
  }

  const s3Platforms: { x: number; y: number; w: number }[] = [
    { x: 36, y: H - 5, w: 4 },
    { x: 40, y: H - 4, w: 3 },    // over pit
    { x: 44, y: H - 7, w: 3 },
    { x: 48, y: H - 4, w: 3 },    // over pit
    { x: 52, y: H - 5, w: 4 },
    // Multi-level
    { x: 38, y: H - 9, w: 3 },
    { x: 44, y: H - 10, w: 4 },
    { x: 50, y: H - 9, w: 3 },
    // High platforms
    { x: 41, y: H - 13, w: 3 },
    { x: 47, y: H - 13, w: 3 },
  ];

  // ===== SECTION 4: Glitch corridor (tiles 55-75) =====
  // Tight section with spike traps
  for (let px = 59; px < 62; px++) {
    level[H - 1][px] = 0;
    level[H - 2][px] = 0;
  }
  for (let px = 67; px < 70; px++) {
    level[H - 1][px] = 0;
    level[H - 2][px] = 0;
  }

  const s4Platforms: { x: number; y: number; w: number }[] = [
    { x: 56, y: H - 5, w: 3 },
    { x: 59, y: H - 4, w: 3 },
    { x: 63, y: H - 6, w: 3 },
    { x: 67, y: H - 4, w: 3 },
    { x: 71, y: H - 5, w: 4 },
    // Mid-level
    { x: 57, y: H - 8, w: 3 },
    { x: 63, y: H - 9, w: 3 },
    { x: 69, y: H - 8, w: 3 },
    // High route
    { x: 60, y: H - 12, w: 4 },
    { x: 66, y: H - 12, w: 4 },
  ];

  // ===== SECTION 5: Data storm (tiles 75-95) =====
  // Open section with void pits and platform islands
  for (let px = 78; px < 82; px++) {
    level[H - 1][px] = 0;
    level[H - 2][px] = 0;
  }
  for (let px = 86; px < 92; px++) {
    level[H - 1][px] = 0;
    level[H - 2][px] = 0;
  }

  const s5Platforms: { x: number; y: number; w: number }[] = [
    { x: 76, y: H - 5, w: 3 },
    { x: 79, y: H - 4, w: 3 },    // rescue over pit
    { x: 83, y: H - 6, w: 3 },
    { x: 87, y: H - 5, w: 3 },    // island in big pit
    { x: 90, y: H - 4, w: 2 },    // rescue
    { x: 93, y: H - 5, w: 3 },
    // Upper route over big pit
    { x: 77, y: H - 9, w: 3 },
    { x: 83, y: H - 10, w: 3 },
    { x: 88, y: H - 9, w: 3 },
    // Secret top
    { x: 84, y: H - 14, w: 4 },
  ];

  // ===== PROCEDURAL SECTIONS (tiles 95-155) =====
  const procTypes = pickSectionTypes(3, 666);
  generateSection(level, { H, startX: 95, endX: 115, type: procTypes[0], seed: 6601 });
  generateSection(level, { H, startX: 115, endX: 135, type: procTypes[1], seed: 6602 });
  generateSection(level, { H, startX: 135, endX: 155, type: procTypes[2], seed: 6603 });

  // ===== BOSS ARENA (tiles 155-178) =====
  // Final boss arena — "NEXUS CORE"
  for (let y = 0; y < H - 4; y++) {
    level[y][155] = 3;
  }

  // Boss arena ceiling
  for (let x = 156; x < W - 1; x++) {
    level[1][x] = 1;
  }

  const bossPlats: { x: number; y: number; w: number }[] = [
    // Left combat platform
    { x: 158, y: H - 6, w: 5 },
    // Right combat platform
    { x: 171, y: H - 6, w: 5 },
    // Center main stage
    { x: 163, y: H - 5, w: 6 },
    // High center
    { x: 164, y: H - 11, w: 4 },
    // Side escape ledges
    { x: 157, y: H - 10, w: 3 },
    { x: 174, y: H - 10, w: 3 },
    // Upper perches
    { x: 158, y: H - 15, w: 3 },
    { x: 173, y: H - 15, w: 3 },
  ];

  // ==== Place all platforms ====
  const allPlatforms = [
    ...s1Platforms, ...s2Platforms, ...s3Platforms, ...s4Platforms,
    ...s5Platforms, ...bossPlats,
  ];

  for (const plat of allPlatforms) {
    for (let px = plat.x; px < plat.x + plat.w; px++) {
      if (px >= 0 && px < W && plat.y >= 0 && plat.y < H) {
        level[plat.y][px] = 2;
      }
    }
  }

  // ==== Spikes ====
  const spikePositions = [
    // Entry pit
    { x: 3, y: H - 3 }, { x: 7, y: H - 3 },
    // Void bridge edges
    { x: 19, y: H - 3 }, { x: 32, y: H - 3 },
    // Corruption chamber
    { x: 39, y: H - 3 }, { x: 43, y: H - 3 },
    { x: 47, y: H - 3 }, { x: 51, y: H - 3 },
    // Glitch corridor
    { x: 58, y: H - 3 }, { x: 62, y: H - 3 },
    { x: 66, y: H - 3 }, { x: 70, y: H - 3 },
    // Data storm
    { x: 77, y: H - 3 }, { x: 82, y: H - 3 },
    { x: 85, y: H - 3 }, { x: 92, y: H - 3 },
    // Boss arena
    { x: 156, y: H - 3 }, { x: 177, y: H - 3 },
  ];

  for (const sp of spikePositions) {
    if (sp.x >= 0 && sp.x < W && sp.y >= 0 && sp.y < H) {
      level[sp.y][sp.x] = 4;
    }
  }

  return level;
}
