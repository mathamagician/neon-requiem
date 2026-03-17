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
  exits: { tileX: number; targetZone: string; targetSpawnTileX: number; label?: string }[];
  /** If true, skip straight to boss arena (practice mode) */
  bossOnly?: boolean;
}

export const ZONES: Record<string, ZoneDef> = {
  hub: {
    id: 'hub',
    name: 'The Threshold',
    width: 60,
    height: 18,
    palette: { ground: 0x334455, platform: 0x445566, accent: 0x00ffcc, bg1: 0x121225, bg2: 0x181830 },
    enemyTypes: [],
    bossId: null,
    exits: [
      // Zone doors
      { tileX: 6, targetZone: 'cryptvault', targetSpawnTileX: 2, label: 'CRYPTVAULT' },
      { tileX: 16, targetZone: 'garden', targetSpawnTileX: 2, label: 'GARDEN' },
      { tileX: 42, targetZone: 'citadel', targetSpawnTileX: 2, label: 'CITADEL' },
      { tileX: 52, targetZone: 'foundry', targetSpawnTileX: 2, label: 'FOUNDRY' },
      // Boss practice doors
      { tileX: 10, targetZone: 'cryptvault_boss', targetSpawnTileX: 2, label: 'BOSS: Hollow King' },
      { tileX: 19, targetZone: 'garden_boss', targetSpawnTileX: 2, label: 'BOSS: Hemlock' },
      { tileX: 44, targetZone: 'citadel_boss', targetSpawnTileX: 2, label: 'BOSS: Overclock' },
      { tileX: 55, targetZone: 'foundry_boss', targetSpawnTileX: 2, label: 'BOSS: Voltrexx' },
    ],
  },

  foundry: {
    id: 'foundry',
    name: 'Neon Foundry',
    width: 160,
    height: 22,
    palette: { ground: 0x334455, platform: 0x445566, accent: 0x00ffcc, bg1: 0x121225, bg2: 0x181830 },
    enemyTypes: ['grunt', 'ranged', 'flyer', 'charger'],
    bossId: 'voltrexx',
    bossSpawnTileX: 150,
    bossTriggerTileX: 141,
    exits: [
      { tileX: 1, targetZone: 'hub', targetSpawnTileX: 52 },
    ],
  },

  foundry_boss: {
    id: 'foundry_boss',
    name: 'Neon Foundry — Boss',
    width: 30,
    height: 22,
    palette: { ground: 0x334455, platform: 0x445566, accent: 0x00ffcc, bg1: 0x121225, bg2: 0x181830 },
    enemyTypes: [],
    bossId: 'voltrexx',
    bossSpawnTileX: 20,
    bossTriggerTileX: 5,
    bossOnly: true,
    exits: [
      { tileX: 1, targetZone: 'hub', targetSpawnTileX: 55 },
    ],
  },

  cryptvault: {
    id: 'cryptvault',
    name: 'Cryptvault',
    width: 140,
    height: 22,
    palette: { ground: 0x2a2535, platform: 0x3a3050, accent: 0x6644aa, bg1: 0x10101e, bg2: 0x181828 },
    enemyTypes: ['skeleton', 'ghost', 'bone_archer', 'shade'],
    bossId: 'hollow_king',
    bossSpawnTileX: 130,
    bossTriggerTileX: 122,
    exits: [
      { tileX: 1, targetZone: 'hub', targetSpawnTileX: 6 },
    ],
  },

  cryptvault_boss: {
    id: 'cryptvault_boss',
    name: 'Cryptvault — Boss',
    width: 30,
    height: 22,
    palette: { ground: 0x2a2535, platform: 0x3a3050, accent: 0x6644aa, bg1: 0x10101e, bg2: 0x181828 },
    enemyTypes: [],
    bossId: 'hollow_king',
    bossSpawnTileX: 20,
    bossTriggerTileX: 5,
    bossOnly: true,
    exits: [
      { tileX: 1, targetZone: 'hub', targetSpawnTileX: 10 },
    ],
  },

  garden: {
    id: 'garden',
    name: 'Blighted Garden',
    width: 150,
    height: 22,
    palette: { ground: 0x2a3a1a, platform: 0x3a4a2a, accent: 0x44cc44, bg1: 0x101408, bg2: 0x182210 },
    enemyTypes: ['grunt', 'ranged', 'flyer'],
    bossId: 'hemlock',
    bossSpawnTileX: 140,
    bossTriggerTileX: 132,
    exits: [
      { tileX: 1, targetZone: 'hub', targetSpawnTileX: 16 },
    ],
  },

  garden_boss: {
    id: 'garden_boss',
    name: 'Blighted Garden — Boss',
    width: 30,
    height: 22,
    palette: { ground: 0x2a3a1a, platform: 0x3a4a2a, accent: 0x44cc44, bg1: 0x101408, bg2: 0x182210 },
    enemyTypes: [],
    bossId: 'hemlock',
    bossSpawnTileX: 20,
    bossTriggerTileX: 5,
    bossOnly: true,
    exits: [
      { tileX: 1, targetZone: 'hub', targetSpawnTileX: 19 },
    ],
  },

  citadel: {
    id: 'citadel',
    name: 'Neon Citadel',
    width: 160,
    height: 22,
    palette: { ground: 0x252540, platform: 0x353560, accent: 0x44ccff, bg1: 0x0a0a20, bg2: 0x141435 },
    enemyTypes: ['grunt', 'ranged', 'charger', 'shade'],
    bossId: 'overclock',
    bossSpawnTileX: 150,
    bossTriggerTileX: 140,
    exits: [
      { tileX: 1, targetZone: 'hub', targetSpawnTileX: 42 },
    ],
  },

  citadel_boss: {
    id: 'citadel_boss',
    name: 'Neon Citadel — Boss',
    width: 30,
    height: 22,
    palette: { ground: 0x252540, platform: 0x353560, accent: 0x44ccff, bg1: 0x0a0a20, bg2: 0x141435 },
    enemyTypes: [],
    bossId: 'overclock',
    bossSpawnTileX: 20,
    bossTriggerTileX: 5,
    bossOnly: true,
    exits: [
      { tileX: 1, targetZone: 'hub', targetSpawnTileX: 44 },
    ],
  },
};

export function getZone(id: string): ZoneDef {
  return ZONES[id] ?? ZONES.hub;
}
