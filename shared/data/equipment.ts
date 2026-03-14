/** Equipment rarity tiers */
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export type EquipSlot = 'weapon' | 'armor' | 'accessory1' | 'accessory2';

export interface Modifier {
  stat: 'might' | 'precision' | 'arcana' | 'vitality' | 'critChance' | 'speed' | 'energyRegen';
  value: number;
}

export interface EquipmentItem {
  id: string;
  name: string;
  slot: EquipSlot;
  rarity: Rarity;
  modifiers: Modifier[];
  description: string;
  /** Base defense for armor, base damage bonus for weapons */
  baseStat: number;
}

export const RARITY_COLORS: Record<Rarity, number> = {
  common: 0xaaaaaa,
  uncommon: 0x44cc44,
  rare: 0x4488ff,
  epic: 0xaa44ff,
  legendary: 0xffaa00,
};

export const RARITY_NAMES: Record<Rarity, string> = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
};

/** Possible modifier pools by slot */
const WEAPON_MODS: Modifier[] = [
  { stat: 'might', value: 3 },
  { stat: 'precision', value: 3 },
  { stat: 'critChance', value: 5 },
  { stat: 'arcana', value: 2 },
  { stat: 'speed', value: 5 },
];

const ARMOR_MODS: Modifier[] = [
  { stat: 'vitality', value: 4 },
  { stat: 'might', value: 2 },
  { stat: 'energyRegen', value: 2 },
  { stat: 'speed', value: 3 },
];

const ACCESSORY_MODS: Modifier[] = [
  { stat: 'critChance', value: 4 },
  { stat: 'arcana', value: 3 },
  { stat: 'energyRegen', value: 3 },
  { stat: 'precision', value: 2 },
  { stat: 'vitality', value: 2 },
  { stat: 'speed', value: 4 },
];

const WEAPON_NAMES = [
  'Circuit Blade', 'Pulse Edge', 'Neon Saber', 'Rift Cutter', 'Void Fang',
  'Ember Striker', 'Shadow Spike', 'Arc Razor', 'Storm Cleaver', 'Hex Edge',
];

const ARMOR_NAMES = [
  'Gridweave Vest', 'Pale Guard', 'Neon Shell', 'Crypt Plate', 'Rift Coat',
  'Ember Ward', 'Shadow Wrap', 'Signal Mail', 'Breach Armor', 'Hex Shroud',
];

const ACCESSORY_NAMES = [
  'Spark Ring', 'Ghost Charm', 'Crypt Pendant', 'Neon Band', 'Void Shard',
  'Ember Stone', 'Shadow Locket', 'Arc Brooch', 'Storm Gem', 'Hex Totem',
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Generate a random equipment drop scaled to player level */
export function generateDrop(playerLevel: number, slot?: EquipSlot): EquipmentItem {
  const s = slot ?? pick<EquipSlot>(['weapon', 'armor', 'accessory1', 'accessory2']);
  const actualSlot = s === 'accessory2' ? 'accessory1' : s; // normalize for name pool

  // Rarity roll — higher level = better odds
  const roll = Math.random() + playerLevel * 0.01;
  let rarity: Rarity;
  if (roll > 0.95) rarity = 'epic';
  else if (roll > 0.80) rarity = 'rare';
  else if (roll > 0.55) rarity = 'uncommon';
  else rarity = 'common';

  const modCount = { common: 0, uncommon: 1, rare: 2, epic: 2, legendary: 3 }[rarity];
  const modPool = actualSlot === 'weapon' ? WEAPON_MODS
    : actualSlot === 'armor' ? ARMOR_MODS
    : ACCESSORY_MODS;

  // Pick random modifiers (no duplicates)
  const shuffled = [...modPool].sort(() => Math.random() - 0.5);
  const mods: Modifier[] = shuffled.slice(0, modCount).map(m => ({
    ...m,
    value: Math.ceil(m.value * (0.8 + Math.random() * 0.4 + playerLevel * 0.05)),
  }));

  const namePool = actualSlot === 'weapon' ? WEAPON_NAMES
    : actualSlot === 'armor' ? ARMOR_NAMES
    : ACCESSORY_NAMES;

  const baseStat = Math.ceil((3 + playerLevel * 0.8) * (1 + ['common', 'uncommon', 'rare', 'epic', 'legendary'].indexOf(rarity) * 0.2));

  const modDesc = mods.map(m => `+${m.value} ${m.stat}`).join(', ');

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: pick(namePool),
    slot: s === 'accessory2' ? 'accessory2' : actualSlot as EquipSlot,
    rarity,
    modifiers: mods,
    baseStat,
    description: modDesc || 'No special properties',
  };
}
