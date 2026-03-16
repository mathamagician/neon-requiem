/**
 * Zone definitions for the game world.
 * Each zone has its own level layout, enemies, tileset colors, and boss.
 */

export interface ZoneDef {
  id: string;
  name: string;
  width: number;
  height: number;
  /** Tile palette: [ground, platform, accent, background] colors */
  palette: { ground: number; platform: number; accent: number; bg1: number; bg2: number };
  /** Enemy types to spawn in this zone */
  enemyTypes: ('grunt' | 'ranged' | 'flyer' | 'charger' | 'skeleton' | 'ghost' | 'bone_archer' | 'shade')[];
  /** Boss ID (or null for hub) */
  bossId: string | null;
  /** Boss spawn tile X */
  bossSpawnTileX?: number;
  /** Boss trigger tile X */
  bossTriggerTileX?: number;
  /** Exits: connections to other zones */
  exits: { tileX: number; targetZone: string; targetSpawnTileX: number }[];
}

export const ZONES: Record<string, ZoneDef> = {
  hub: {
    id: 'hub',
    name: 'The Threshold',
    width: 40,
    height: 18,
    palette: { ground: 0x334455, platform: 0x445566, accent: 0x00ffcc, bg1: 0x0a0a1a, bg2: 0x111125 },
    enemyTypes: [],
    bossId: null,
    exits: [
      { tileX: 38, targetZone: 'foundry', targetSpawnTileX: 2 },
      { tileX: 1, targetZone: 'cryptvault', targetSpawnTileX: 2 },
      { tileX: 20, targetZone: 'garden', targetSpawnTileX: 2 },
    ],
  },

  foundry: {
    id: 'foundry',
    name: 'Neon Foundry',
    width: 120,
    height: 22,
    palette: { ground: 0x334455, platform: 0x445566, accent: 0x00ffcc, bg1: 0x0a0a1a, bg2: 0x111125 },
    enemyTypes: ['grunt', 'ranged', 'flyer', 'charger'],
    bossId: 'voltrexx',
    bossSpawnTileX: 110,
    bossTriggerTileX: 101,
    exits: [
      { tileX: 1, targetZone: 'hub', targetSpawnTileX: 36 },
    ],
  },

  cryptvault: {
    id: 'cryptvault',
    name: 'Cryptvault',
    width: 100,
    height: 22,
    palette: { ground: 0x2a2535, platform: 0x3a3050, accent: 0x6644aa, bg1: 0x080812, bg2: 0x12101e },
    enemyTypes: ['skeleton', 'ghost', 'bone_archer', 'shade'],
    bossId: 'hollow_king',
    bossSpawnTileX: 90,
    bossTriggerTileX: 82,
    exits: [
      { tileX: 1, targetZone: 'hub', targetSpawnTileX: 3 },
    ],
  },
  garden: {
    id: 'garden',
    name: 'Blighted Garden',
    width: 110,
    height: 22,
    palette: { ground: 0x2a3a1a, platform: 0x3a4a2a, accent: 0x44cc44, bg1: 0x080a04, bg2: 0x101a08 },
    enemyTypes: ['grunt', 'ranged', 'flyer'],
    bossId: 'hemlock',
    bossSpawnTileX: 100,
    bossTriggerTileX: 92,
    exits: [
      { tileX: 1, targetZone: 'hub', targetSpawnTileX: 20 },
    ],
  },
};

export function getZone(id: string): ZoneDef {
  return ZONES[id] ?? ZONES.hub;
}
