/**
 * Procedural section generator for extending zone levels.
 * Generates platforming sections that splice into hand-crafted levels
 * between the authored content and the boss arena.
 *
 * Physics constraints (TILE_SIZE=16, speed=120, jump=-280, gravity=900):
 *   Max jump height: ~2.7 tiles
 *   Max horizontal at same height: ~4 tiles
 *   Max upward reach with horizontal: 2 tiles up + 2 tiles across
 *
 * Section types:
 *   'pit_run'    — ground with pits to jump over, platforms above
 *   'vertical'   — raised plateau with climbing platforms
 *   'corridor'   — low ceiling, tight navigation, claustrophobic
 *   'arena'      — open chamber with multi-level platforms
 */

// Tile indices: 0=air, 1=solid, 2=platform, 3=accent, 4=spike

type SectionType = 'pit_run' | 'vertical' | 'corridor' | 'arena';

interface GenOptions {
  /** Level height (rows) */
  H: number;
  /** Start tile X in the level array */
  startX: number;
  /** End tile X (exclusive) */
  endX: number;
  /** Which section pattern to use */
  type: SectionType;
  /** Random seed component (use zone + section index for deterministic results) */
  seed: number;
}

/** Simple seeded PRNG (mulberry32) for deterministic generation */
function mulberry32(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Write a procedural section directly into the level array.
 * The level array must already be sized to accommodate the section.
 */
export function generateSection(level: number[][], opts: GenOptions): void {
  const rng = mulberry32(opts.seed);
  switch (opts.type) {
    case 'pit_run':
      genPitRun(level, opts, rng);
      break;
    case 'vertical':
      genVertical(level, opts, rng);
      break;
    case 'corridor':
      genCorridor(level, opts, rng);
      break;
    case 'arena':
      genArena(level, opts, rng);
      break;
  }
}

/** Pick a random section type sequence for a zone */
export function pickSectionTypes(count: number, seed: number): SectionType[] {
  const rng = mulberry32(seed);
  const types: SectionType[] = ['pit_run', 'vertical', 'corridor', 'arena'];
  const result: SectionType[] = [];
  let last: SectionType | null = null;
  for (let i = 0; i < count; i++) {
    // Avoid repeating the same type consecutively
    const available = types.filter(t => t !== last);
    const pick = available[Math.floor(rng() * available.length)];
    result.push(pick);
    last = pick;
  }
  return result;
}

// ============ Section Generators ============

function genPitRun(level: number[][], opts: GenOptions, rng: () => number): void {
  const { H, startX, endX } = opts;
  const width = endX - startX;

  // Ground is continuous except for pits
  // Place 2-4 pits depending on section width
  const pitCount = Math.max(2, Math.floor(width / 10));
  const spacing = Math.floor(width / (pitCount + 1));

  const pits: { x: number; w: number }[] = [];
  for (let i = 0; i < pitCount; i++) {
    const cx = startX + spacing * (i + 1) + Math.floor(rng() * 3) - 1;
    const pw = 2 + Math.floor(rng() * 2); // 2-3 tile wide pits
    pits.push({ x: cx, w: pw });
    // Carve pit
    for (let px = cx; px < cx + pw && px < endX; px++) {
      if (px >= startX) {
        level[H - 1][px] = 0;
        level[H - 2][px] = 0;
      }
    }
  }

  // Platforms above pits and between them
  const platforms: { x: number; y: number; w: number }[] = [];

  for (const pit of pits) {
    // Rescue platform over each pit
    platforms.push({ x: pit.x, y: H - 4, w: Math.min(pit.w, 3) });

    // Higher platform near pit (varied height)
    const highY = H - 6 - Math.floor(rng() * 3); // H-6 to H-8
    const side = rng() > 0.5 ? pit.x - 2 : pit.x + pit.w;
    if (side >= startX && side + 3 < endX) {
      platforms.push({ x: side, y: highY, w: 3 });
    }
  }

  // Add some floating platforms between pits for flow
  for (let i = 0; i < pitCount - 1; i++) {
    const betweenX = pits[i].x + pits[i].w + Math.floor(rng() * 3) + 1;
    if (betweenX + 3 < (pits[i + 1]?.x ?? endX)) {
      const fy = H - 5 - Math.floor(rng() * 3);
      platforms.push({ x: betweenX, y: fy, w: 2 + Math.floor(rng() * 2) });
    }
  }

  // Upper route — high platforms across the section
  const upperCount = Math.max(2, Math.floor(width / 12));
  for (let i = 0; i < upperCount; i++) {
    const ux = startX + 3 + Math.floor(i * (width - 6) / upperCount) + Math.floor(rng() * 3);
    if (ux + 3 < endX) {
      platforms.push({ x: ux, y: H - 10 - Math.floor(rng() * 3), w: 3 });
    }
  }

  // Spikes at pit edges
  for (const pit of pits) {
    const leftEdge = pit.x - 1;
    const rightEdge = pit.x + pit.w;
    if (leftEdge >= startX) level[H - 3][leftEdge] = 4;
    if (rightEdge < endX) level[H - 3][rightEdge] = 4;
  }

  writePlatforms(level, platforms, endX, H);

  // Ceiling detail — overhead pipes
  for (let x = startX + 2; x < endX - 2; x++) {
    if (rng() < 0.3) level[1][x] = 1;
  }
}

function genVertical(level: number[][], opts: GenOptions, rng: () => number): void {
  const { H, startX, endX } = opts;
  const width = endX - startX;
  const midX = startX + Math.floor(width / 2);

  // Raised plateau in the center
  const plateauStart = midX - 4;
  const plateauEnd = midX + 4;
  for (let x = Math.max(startX, plateauStart); x < Math.min(endX, plateauEnd); x++) {
    level[H - 3][x] = 1;
    level[H - 4][x] = 1;
  }

  // Deep pit before plateau
  const pitStart = Math.max(startX + 1, plateauStart - 3);
  const pitEnd = plateauStart;
  for (let px = pitStart; px < pitEnd; px++) {
    level[H - 1][px] = 0;
    level[H - 2][px] = 0;
  }

  // Accent trim on plateau edges
  if (plateauStart >= startX) level[H - 5][plateauStart] = 3;
  if (plateauEnd - 1 < endX) level[H - 5][plateauEnd - 1] = 3;

  // Zigzag platforms climbing up from left to right
  const platforms: { x: number; y: number; w: number }[] = [];

  // Bridge over the pit
  platforms.push({ x: pitStart, y: H - 5, w: 3 });

  // Climbing platforms on/around the plateau
  const climbSteps = 5 + Math.floor(rng() * 3);
  let cx = plateauStart + 1;
  let cy = H - 7;
  let goRight = true;

  for (let i = 0; i < climbSteps; i++) {
    platforms.push({ x: cx, y: cy, w: 3 });
    // Zigzag
    if (goRight) {
      cx += 3 + Math.floor(rng() * 2);
      if (cx + 3 >= plateauEnd + 3) { goRight = false; cx -= 5; }
    } else {
      cx -= 3 + Math.floor(rng() * 2);
      if (cx < plateauStart - 2) { goRight = true; cx += 5; }
    }
    cy -= 2; // Go up 2 tiles per step (within reachability)
    if (cy < 4) break;
  }

  // Descent platforms on the right side
  const descentX = plateauEnd + 1;
  if (descentX + 3 < endX) {
    platforms.push({ x: descentX, y: H - 5, w: 3 });
    platforms.push({ x: descentX + 2, y: H - 7, w: 3 });
  }

  // Accent pillars on plateau
  const pillarX1 = plateauStart + 2;
  const pillarX2 = plateauEnd - 3;
  for (const px of [pillarX1, pillarX2]) {
    if (px >= startX && px < endX) {
      level[H - 5][px] = 3;
      level[H - 6][px] = 3;
    }
  }

  // Ceiling structure
  for (let x = plateauStart; x < plateauEnd && x < endX; x++) {
    if (x >= startX) level[1][x] = 1;
  }

  writePlatforms(level, platforms, endX, H);
}

function genCorridor(level: number[][], opts: GenOptions, rng: () => number): void {
  const { H, startX, endX } = opts;
  const width = endX - startX;

  // Low ceiling — creates claustrophobic feel
  const ceilStart = startX + 2;
  const ceilEnd = endX - 2;
  for (let x = ceilStart; x < ceilEnd; x++) {
    level[4][x] = 1;
    if (rng() < 0.6) level[5][x] = 1;
  }

  // Pits in the corridor (narrower, more frequent)
  const pitCount = Math.max(2, Math.floor(width / 8));
  const platforms: { x: number; y: number; w: number }[] = [];

  for (let i = 0; i < pitCount; i++) {
    const pitX = startX + 3 + Math.floor(i * (width - 6) / pitCount) + Math.floor(rng() * 2);
    const pitW = 2;
    for (let px = pitX; px < pitX + pitW && px < endX; px++) {
      if (px >= startX) {
        level[H - 1][px] = 0;
        level[H - 2][px] = 0;
      }
    }
    // Low rescue platform (ceiling forces ground play)
    platforms.push({ x: pitX, y: H - 4, w: 2 });
  }

  // Some mid-height platforms (can't go too high due to ceiling)
  const midCount = Math.floor(width / 10);
  for (let i = 0; i < midCount; i++) {
    const mx = startX + 4 + Math.floor(rng() * (width - 8));
    if (mx + 3 < endX) {
      platforms.push({ x: mx, y: H - 5 - Math.floor(rng() * 2), w: 3 });
    }
  }

  // Bone piles / debris — solid blocks on ground
  const debrisCount = 2 + Math.floor(rng() * 3);
  for (let i = 0; i < debrisCount; i++) {
    const dx = startX + 3 + Math.floor(rng() * (width - 6));
    if (dx < endX) level[H - 3][dx] = 1;
  }

  // Hanging accent (chains/stalactites)
  for (let i = 0; i < 3; i++) {
    const ax = startX + 3 + Math.floor(rng() * (width - 6));
    if (ax < endX) {
      level[5][ax] = 3;
      if (rng() < 0.5) level[6][ax] = 3;
    }
  }

  writePlatforms(level, platforms, endX, H);
}

function genArena(level: number[][], opts: GenOptions, rng: () => number): void {
  const { H, startX, endX } = opts;
  const width = endX - startX;
  const midX = startX + Math.floor(width / 2);

  // Open chamber — high ceiling (no low ceiling blocks)
  // Ceiling detail
  for (let x = startX + 1; x < endX - 1; x++) {
    level[1][x] = 1;
  }

  // Raised floor on edges
  for (let x = startX + 1; x < startX + 4; x++) level[H - 3][x] = 1;
  for (let x = endX - 4; x < endX - 1; x++) level[H - 3][x] = 1;

  // Central pit
  const pitStart = midX - 2;
  const pitEnd = midX + 2;
  for (let px = pitStart; px < pitEnd; px++) {
    if (px >= startX && px < endX) {
      level[H - 1][px] = 0;
      level[H - 2][px] = 0;
    }
  }

  // Multi-level platforms — 3 tiers
  const platforms: { x: number; y: number; w: number }[] = [];

  // Bottom tier — left and right
  platforms.push({ x: startX + 2, y: H - 5, w: 4 });
  platforms.push({ x: endX - 6, y: H - 5, w: 4 });
  // Rescue over pit
  platforms.push({ x: midX - 1, y: H - 4, w: 3 });

  // Mid tier
  platforms.push({ x: startX + 4, y: H - 8, w: 3 });
  platforms.push({ x: midX - 1, y: H - 7, w: 3 });
  platforms.push({ x: endX - 7, y: H - 8, w: 3 });

  // Top tier
  platforms.push({ x: startX + 3, y: H - 11, w: 3 });
  platforms.push({ x: midX - 2, y: H - 11, w: 4 });
  platforms.push({ x: endX - 6, y: H - 11, w: 3 });

  // Secret near-ceiling platform
  if (width > 18) {
    platforms.push({ x: midX - 2, y: H - 15, w: 4 });
  }

  // Accent pillars
  const pillarLeft = startX + 3;
  const pillarRight = endX - 4;
  for (const px of [pillarLeft, pillarRight]) {
    if (px >= startX && px < endX) {
      for (let y = H - 5; y >= H - 8; y--) level[y][px] = 3;
    }
  }

  // Spikes at pit edges
  if (pitStart - 1 >= startX) level[H - 3][pitStart - 1] = 4;
  if (pitEnd < endX) level[H - 3][pitEnd] = 4;

  writePlatforms(level, platforms, endX, H);
}

// ============ Helpers ============

function writePlatforms(
  level: number[][],
  platforms: { x: number; y: number; w: number }[],
  maxX: number,
  H: number,
): void {
  for (const plat of platforms) {
    for (let px = plat.x; px < plat.x + plat.w; px++) {
      if (px >= 0 && px < maxX && plat.y >= 0 && plat.y < H) {
        level[plat.y][px] = 2;
      }
    }
  }
}
