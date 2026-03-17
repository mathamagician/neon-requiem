/**
 * Procedural section generator for extending zone levels.
 * Generates platforming sections that splice into hand-crafted levels
 * between the authored content and the boss arena.
 *
 * IMPORTANT: Never place solid blocks (tile 1) or accent walls (tile 3)
 * at ground level (H-3 or below) in the player's path — they block movement.
 * Use one-way platforms (tile 2) for any elevated surfaces the player walks on.
 * Keep ground-level (H-1, H-2) continuous except for intentional pits.
 *
 * Physics constraints (TILE_SIZE=16, speed=120, jump=-280, gravity=900):
 *   Max jump height: ~2.7 tiles
 *   Max horizontal at same height: ~4 tiles
 *   Max upward reach with horizontal: 2 tiles up + 2 tiles across
 *
 * Section types:
 *   'pit_run'    — ground with pits to jump over, platforms above
 *   'vertical'   — climbing section with one-way platforms going up
 *   'corridor'   — ground-level run with overhead platforms and pits
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

  // Place 2-3 pits (keep it reasonable)
  const pitCount = Math.max(2, Math.min(3, Math.floor(width / 10)));
  const spacing = Math.floor(width / (pitCount + 1));

  const pits: { x: number; w: number }[] = [];
  for (let i = 0; i < pitCount; i++) {
    const cx = startX + spacing * (i + 1) + Math.floor(rng() * 3) - 1;
    const pw = 2 + Math.floor(rng() * 2); // 2-3 tile wide pits
    pits.push({ x: cx, w: pw });
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
    // Rescue platform over each pit (low, easy to reach)
    platforms.push({ x: pit.x, y: H - 4, w: Math.min(pit.w + 1, 3) });

    // Higher optional platform near pit
    const highY = H - 7 - Math.floor(rng() * 2);
    const side = rng() > 0.5 ? pit.x - 2 : pit.x + pit.w;
    if (side >= startX && side + 3 < endX) {
      platforms.push({ x: side, y: highY, w: 3 });
    }
  }

  // Floating platforms between pits for flow
  for (let i = 0; i < pitCount - 1; i++) {
    const betweenX = pits[i].x + pits[i].w + Math.floor(rng() * 3) + 1;
    if (betweenX + 3 < (pits[i + 1]?.x ?? endX)) {
      const fy = H - 5 - Math.floor(rng() * 2);
      platforms.push({ x: betweenX, y: fy, w: 3 });
    }
  }

  // Upper route — a few high platforms
  const upperCount = Math.max(1, Math.floor(width / 14));
  for (let i = 0; i < upperCount; i++) {
    const ux = startX + 3 + Math.floor(i * (width - 6) / Math.max(1, upperCount)) + Math.floor(rng() * 3);
    if (ux + 3 < endX) {
      platforms.push({ x: ux, y: H - 10 - Math.floor(rng() * 2), w: 3 });
    }
  }

  writePlatforms(level, platforms, endX, H);
}

function genVertical(level: number[][], opts: GenOptions, rng: () => number): void {
  const { H, startX, endX } = opts;
  const width = endX - startX;
  const midX = startX + Math.floor(width / 2);

  // NO solid plateau — use one-way platforms instead for the elevated area
  // This keeps ground level completely passable

  // One pit for variety
  const pitStart = midX - 1;
  const pitEnd = midX + 1;
  for (let px = pitStart; px < pitEnd; px++) {
    if (px >= startX && px < endX) {
      level[H - 1][px] = 0;
      level[H - 2][px] = 0;
    }
  }

  // Zigzag one-way platforms climbing upward
  const platforms: { x: number; y: number; w: number }[] = [];

  // Ground-level platforms around the pit
  platforms.push({ x: pitStart - 1, y: H - 4, w: 3 });
  platforms.push({ x: pitEnd, y: H - 4, w: 3 });

  // Climbing platforms — zigzag up
  const climbSteps = 4 + Math.floor(rng() * 2);
  let cx = midX - 2;
  let cy = H - 6;
  let goRight = true;

  for (let i = 0; i < climbSteps; i++) {
    if (cx >= startX && cx + 3 < endX && cy >= 3) {
      platforms.push({ x: cx, y: cy, w: 3 });
    }
    if (goRight) {
      cx += 3 + Math.floor(rng() * 2);
      if (cx + 3 >= endX - 1) { goRight = false; cx -= 5; }
    } else {
      cx -= 3 + Math.floor(rng() * 2);
      if (cx < startX + 1) { goRight = true; cx += 5; }
    }
    cy -= 2;
    if (cy < 4) break;
  }

  // Descent platforms on the right side
  const descentX = midX + 3;
  if (descentX + 3 < endX) {
    platforms.push({ x: descentX, y: H - 6, w: 3 });
  }

  writePlatforms(level, platforms, endX, H);
}

function genCorridor(level: number[][], opts: GenOptions, rng: () => number): void {
  const { H, startX, endX } = opts;
  const width = endX - startX;

  // NO low solid ceiling or debris — keep ground fully passable.
  // Use only one-way platforms and pits for challenge.

  // A few small pits
  const pitCount = Math.max(1, Math.floor(width / 10));
  const platforms: { x: number; y: number; w: number }[] = [];

  for (let i = 0; i < pitCount; i++) {
    const pitX = startX + 4 + Math.floor(i * (width - 8) / Math.max(1, pitCount)) + Math.floor(rng() * 2);
    const pitW = 2;
    for (let px = pitX; px < pitX + pitW && px < endX; px++) {
      if (px >= startX) {
        level[H - 1][px] = 0;
        level[H - 2][px] = 0;
      }
    }
    // Rescue platform over pit
    platforms.push({ x: pitX, y: H - 4, w: 2 });
  }

  // Mid-height platforms for variety
  const midCount = Math.max(2, Math.floor(width / 8));
  for (let i = 0; i < midCount; i++) {
    const mx = startX + 3 + Math.floor(i * (width - 6) / midCount) + Math.floor(rng() * 2);
    if (mx + 3 < endX) {
      platforms.push({ x: mx, y: H - 6 - Math.floor(rng() * 2), w: 3 });
    }
  }

  // A couple of high platforms
  platforms.push({ x: startX + 4, y: H - 10, w: 3 });
  if (startX + Math.floor(width / 2) + 3 < endX) {
    platforms.push({ x: startX + Math.floor(width / 2), y: H - 10, w: 3 });
  }

  writePlatforms(level, platforms, endX, H);
}

function genArena(level: number[][], opts: GenOptions, rng: () => number): void {
  const { H, startX, endX } = opts;
  const width = endX - startX;
  const midX = startX + Math.floor(width / 2);

  // NO solid raised floor — keep ground completely passable.
  // One central pit for variety.
  const pitStart = midX - 1;
  const pitEnd = midX + 1;
  for (let px = pitStart; px < pitEnd; px++) {
    if (px >= startX && px < endX) {
      level[H - 1][px] = 0;
      level[H - 2][px] = 0;
    }
  }

  // Multi-level one-way platforms — 3 tiers
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
