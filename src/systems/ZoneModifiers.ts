/**
 * Zone Modifiers — random mutators applied to zones on NG+ replays
 * for replayability. Each modifier changes gameplay in a meaningful way.
 *
 * Modifiers are selected per-zone based on NG+ level + zone seed.
 * Higher NG+ levels apply more modifiers simultaneously.
 */

/** Available modifier types */
export interface ZoneModifier {
  id: string;
  name: string;
  description: string;
  /** Multiplier for enemy HP (1.0 = unchanged) */
  enemyHpMult: number;
  /** Multiplier for enemy damage */
  enemyDamageMult: number;
  /** Multiplier for enemy speed */
  enemySpeedMult: number;
  /** Multiplier for XP rewards */
  xpMult: number;
  /** Multiplier for gold drops */
  goldMult: number;
  /** Visual tint applied to the zone (0 = none) */
  tint: number;
  /** Display color for the modifier name */
  color: string;
}

const MODIFIER_POOL: ZoneModifier[] = [
  {
    id: 'fragile',
    name: 'GLASS CANNON',
    description: 'Enemies deal 2x damage but have half HP',
    enemyHpMult: 0.5, enemyDamageMult: 2.0, enemySpeedMult: 1.0,
    xpMult: 1.3, goldMult: 1.3, tint: 0xff8844, color: '#ff8844',
  },
  {
    id: 'swarm',
    name: 'SWARM',
    description: 'More enemies, but they have less HP',
    enemyHpMult: 0.7, enemyDamageMult: 1.0, enemySpeedMult: 1.2,
    xpMult: 1.5, goldMult: 1.5, tint: 0x44ff44, color: '#44ff44',
  },
  {
    id: 'ironclad',
    name: 'IRONCLAD',
    description: 'Enemies have 2x HP and deal 1.5x damage',
    enemyHpMult: 2.0, enemyDamageMult: 1.5, enemySpeedMult: 0.8,
    xpMult: 2.0, goldMult: 2.0, tint: 0x8888ff, color: '#8888ff',
  },
  {
    id: 'speed',
    name: 'OVERCLOCK',
    description: 'Enemies move and attack 50% faster',
    enemyHpMult: 1.0, enemyDamageMult: 1.0, enemySpeedMult: 1.5,
    xpMult: 1.4, goldMult: 1.2, tint: 0xffff44, color: '#ffff44',
  },
  {
    id: 'cursed',
    name: 'CURSED',
    description: 'Everything is harder — all enemy stats +30%',
    enemyHpMult: 1.3, enemyDamageMult: 1.3, enemySpeedMult: 1.3,
    xpMult: 1.8, goldMult: 1.8, tint: 0xaa44ff, color: '#aa44ff',
  },
  {
    id: 'bounty',
    name: 'BOUNTY',
    description: 'Normal difficulty but 3x gold and XP',
    enemyHpMult: 1.0, enemyDamageMult: 1.0, enemySpeedMult: 1.0,
    xpMult: 3.0, goldMult: 3.0, tint: 0xffcc00, color: '#ffcc00',
  },
];

/** No-op modifier for normal mode */
const NEUTRAL: ZoneModifier = {
  id: 'none', name: '', description: '',
  enemyHpMult: 1, enemyDamageMult: 1, enemySpeedMult: 1,
  xpMult: 1, goldMult: 1, tint: 0, color: '#ffffff',
};

/** Simple hash for deterministic modifier selection */
function hashZone(zoneId: string, ngLevel: number): number {
  let h = ngLevel * 7919;
  for (let i = 0; i < zoneId.length; i++) {
    h = ((h << 5) - h + zoneId.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/**
 * Get the active modifier(s) for a zone.
 * NG+0 = no modifiers. NG+1 = 1 modifier per zone. NG+2+ = 2 modifiers stacked.
 */
export function getZoneModifiers(zoneId: string, ngPlusLevel: number): ZoneModifier[] {
  if (ngPlusLevel <= 0) return [];
  if (zoneId === 'hub') return []; // Hub is always safe

  const hash = hashZone(zoneId, ngPlusLevel);
  const count = Math.min(ngPlusLevel, 2); // Max 2 modifiers stacked
  const result: ZoneModifier[] = [];

  for (let i = 0; i < count; i++) {
    const idx = (hash + i * 3571) % MODIFIER_POOL.length;
    const mod = MODIFIER_POOL[idx];
    // Avoid duplicates
    if (!result.find(m => m.id === mod.id)) {
      result.push(mod);
    }
  }

  return result;
}

/** Merge multiple modifiers into a single combined modifier */
export function mergeModifiers(mods: ZoneModifier[]): ZoneModifier {
  if (mods.length === 0) return NEUTRAL;
  if (mods.length === 1) return mods[0];

  return {
    id: mods.map(m => m.id).join('+'),
    name: mods.map(m => m.name).join(' + '),
    description: mods.map(m => m.description).join('; '),
    enemyHpMult: mods.reduce((a, m) => a * m.enemyHpMult, 1),
    enemyDamageMult: mods.reduce((a, m) => a * m.enemyDamageMult, 1),
    enemySpeedMult: mods.reduce((a, m) => a * m.enemySpeedMult, 1),
    xpMult: mods.reduce((a, m) => a * m.xpMult, 1),
    goldMult: mods.reduce((a, m) => a * m.goldMult, 1),
    tint: mods[0].tint,
    color: mods[0].color,
  };
}
