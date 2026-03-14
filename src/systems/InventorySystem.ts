import type { EquipmentItem, EquipSlot } from '../../shared/data/equipment';

export interface PlayerStats {
  might: number;
  precision: number;
  arcana: number;
  vitality: number;
  unspent: number;
}

export class InventorySystem {
  /** Equipped items by slot */
  equipped: Partial<Record<EquipSlot, EquipmentItem>> = {};

  /** Backpack — max 20 items */
  backpack: EquipmentItem[] = [];
  readonly MAX_BACKPACK = 20;

  /** Core stats (allocated on level up) */
  stats: PlayerStats = { might: 5, precision: 5, arcana: 5, vitality: 5, unspent: 0 };

  /** Absorbed boss powers */
  bossPoweSlots: [string | null, string | null] = [null, null];

  /** Add an item to backpack. Returns false if full. */
  addItem(item: EquipmentItem): boolean {
    if (this.backpack.length >= this.MAX_BACKPACK) return false;
    this.backpack.push(item);
    return true;
  }

  /** Equip an item from backpack. Returns the previously equipped item (or null). */
  equip(item: EquipmentItem): EquipmentItem | null {
    const prev = this.equipped[item.slot] ?? null;
    this.equipped[item.slot] = item;
    // Remove from backpack
    this.backpack = this.backpack.filter(i => i.id !== item.id);
    // Put old item back in backpack
    if (prev) this.backpack.push(prev);
    return prev;
  }

  /** Unequip to backpack */
  unequip(slot: EquipSlot): boolean {
    const item = this.equipped[slot];
    if (!item) return false;
    if (this.backpack.length >= this.MAX_BACKPACK) return false;
    this.backpack.push(item);
    delete this.equipped[slot];
    return true;
  }

  /** Drop/discard an item from backpack */
  discard(itemId: string) {
    this.backpack = this.backpack.filter(i => i.id !== itemId);
  }

  /** Get total stat bonuses from all equipment */
  getEquipBonuses(): Record<string, number> {
    const bonuses: Record<string, number> = {};
    for (const item of Object.values(this.equipped)) {
      if (!item) continue;
      for (const mod of item.modifiers) {
        bonuses[mod.stat] = (bonuses[mod.stat] ?? 0) + mod.value;
      }
    }
    return bonuses;
  }

  /** Calculate effective stat value (base + equipment) */
  getEffectiveStat(stat: keyof PlayerStats): number {
    if (stat === 'unspent') return this.stats.unspent;
    const bonuses = this.getEquipBonuses();
    return this.stats[stat] + (bonuses[stat] ?? 0);
  }

  /** Called on level up — grants stat points */
  onLevelUp() {
    this.stats.unspent += 3;
  }

  /** Allocate a stat point */
  allocateStat(stat: 'might' | 'precision' | 'arcana' | 'vitality'): boolean {
    if (this.stats.unspent <= 0) return false;
    this.stats[stat]++;
    this.stats.unspent--;
    return true;
  }
}
