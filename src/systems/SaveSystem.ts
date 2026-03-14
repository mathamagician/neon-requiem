import type { EquipmentItem, EquipSlot } from '../../shared/data/equipment';
import type { PlayerStats, InventorySystem } from './InventorySystem';
import type { ClassName } from '../scenes/GameScene';

const SAVE_KEY = 'neon-requiem-save';
const SAVE_VERSION = 1;

/** Serializable save data */
export interface SaveData {
  version: number;
  timestamp: number;

  // Player
  className: ClassName;
  level: number;
  xp: number;
  xpToNext: number;
  hp: number;
  maxHp: number;
  energy: number;
  maxEnergy: number;
  posX: number;
  posY: number;

  // Inventory
  stats: PlayerStats;
  equipped: Partial<Record<EquipSlot, EquipmentItem>>;
  backpack: EquipmentItem[];
  collectedPowers: string[];
  bossPowerSlots: [string | null, string | null];
  activePowerSlot: number;
  unlockedSkills: string[];
  skillPoints: number;
  activeBranch: string | null;

  // World state
  gold: number;
  currentZone: string;
  bossesDefeated: string[];
}

/** Check if a save exists */
export function hasSave(): boolean {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    return data && data.version === SAVE_VERSION;
  } catch {
    return false;
  }
}

/** Load save data (returns null if missing/corrupt) */
export function loadSave(): SaveData | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as SaveData;
    if (data.version !== SAVE_VERSION) return null;
    return data;
  } catch {
    return null;
  }
}

/** Build save data from current game state */
export function buildSaveData(
  className: ClassName,
  player: { level: number; xp: number; xpToNext: number; hp: number; maxHp: number; energy: number; maxEnergy: number; sprite: { x: number; y: number } },
  inv: InventorySystem,
  bossesDefeated: string[],
  currentZone: string,
  gold: number
): SaveData {
  return {
    version: SAVE_VERSION,
    timestamp: Date.now(),
    className,
    level: player.level,
    xp: player.xp,
    xpToNext: player.xpToNext,
    hp: player.hp,
    maxHp: player.maxHp,
    energy: player.energy,
    maxEnergy: player.maxEnergy,
    posX: player.sprite.x,
    posY: player.sprite.y,
    stats: { ...inv.stats },
    equipped: { ...inv.equipped },
    backpack: [...inv.backpack],
    collectedPowers: [...inv.collectedPowers],
    bossPowerSlots: [...inv.bossPowerSlots],
    activePowerSlot: inv.activePowerSlot,
    unlockedSkills: [...inv.unlockedSkills],
    skillPoints: inv.skillPoints,
    activeBranch: inv.activeBranch,
    gold,
    currentZone,
    bossesDefeated,
  };
}

/** Write save data to localStorage */
export function writeSave(data: SaveData) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save:', e);
  }
}

/** Delete saved game */
export function deleteSave() {
  localStorage.removeItem(SAVE_KEY);
}

/** Restore inventory state from save data */
export function restoreInventory(inv: InventorySystem, save: SaveData) {
  inv.stats = { ...save.stats };
  inv.equipped = { ...save.equipped };
  inv.backpack = [...save.backpack];
  inv.collectedPowers = [...save.collectedPowers];
  inv.bossPowerSlots = [...save.bossPowerSlots] as [string | null, string | null];
  inv.activePowerSlot = save.activePowerSlot;
  inv.unlockedSkills = new Set(save.unlockedSkills);
  inv.skillPoints = save.skillPoints;
  inv.activeBranch = save.activeBranch;
}

/** Format save data for display */
export function formatSaveInfo(save: SaveData): string {
  const cls = save.className.charAt(0).toUpperCase() + save.className.slice(1);
  const zone = save.currentZone ?? 'foundry';
  const date = new Date(save.timestamp);
  const time = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return `${cls} Lv.${save.level} | ${zone} | ${save.bossesDefeated.length} bosses | ${time}`;
}
