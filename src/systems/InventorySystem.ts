import type { EquipmentItem, EquipSlot } from '../../shared/data/equipment';
import { getBossPower } from '../../shared/data/bossPowers';
import type { BossPowerDef } from '../../shared/data/bossPowers';
import { SKILL_BRANCHES, getSkillById } from '../../shared/data/skillTrees';
import type { SkillDef } from '../../shared/data/skillTrees';

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

  /** Absorbed boss powers — all collected */
  collectedPowers: string[] = [];

  /** Currently equipped boss power slots (max 2) */
  bossPowerSlots: [string | null, string | null] = [null, null];

  /** Active boss power slot index (0 or 1) — which one C key fires */
  activePowerSlot = 0;

  /** Unlocked skill IDs */
  unlockedSkills: Set<string> = new Set();

  /** Available skill points */
  skillPoints = 0;

  /** Active skill branch ID */
  activeBranch: string | null = null;

  /** Add an item to backpack. Returns false if full. */
  addItem(item: EquipmentItem): boolean {
    if (this.backpack.length >= this.MAX_BACKPACK) return false;
    this.backpack.push(item);
    return true;
  }

  /** Equip an item from backpack. Returns the previously equipped item (or null). */
  equip(item: EquipmentItem): EquipmentItem | null {
    const prev = this.equipped[item.slot] ?? null;
    // Don't re-equip the same item that's already in the slot
    if (prev && prev.id === item.id) return null;
    this.equipped[item.slot] = item;
    // Remove by reference (splice), not by ID filter, to avoid deleting duplicates
    const idx = this.backpack.indexOf(item);
    if (idx !== -1) this.backpack.splice(idx, 1);
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

  /** Absorb a boss power */
  absorbPower(powerId: string) {
    if (this.collectedPowers.includes(powerId)) return;
    this.collectedPowers.push(powerId);
    // Auto-equip to first empty slot
    if (this.bossPowerSlots[0] === null) {
      this.bossPowerSlots[0] = powerId;
    } else if (this.bossPowerSlots[1] === null) {
      this.bossPowerSlots[1] = powerId;
    }
  }

  /** Equip a collected power into a slot */
  equipPower(powerId: string, slot: 0 | 1) {
    if (!this.collectedPowers.includes(powerId)) return;
    // If this power is in the other slot, swap
    const otherSlot = slot === 0 ? 1 : 0;
    if (this.bossPowerSlots[otherSlot] === powerId) {
      this.bossPowerSlots[otherSlot] = this.bossPowerSlots[slot];
    }
    this.bossPowerSlots[slot] = powerId;
  }

  /** Get the currently active boss power definition */
  getActivePower(): BossPowerDef | undefined {
    const id = this.bossPowerSlots[this.activePowerSlot];
    return id ? getBossPower(id) : undefined;
  }

  /** Get a specific slot's power definition */
  getSlotPower(slot: 0 | 1): BossPowerDef | undefined {
    const id = this.bossPowerSlots[slot];
    return id ? getBossPower(id) : undefined;
  }

  /** Toggle between power slot 0 and 1 */
  toggleActivePowerSlot() {
    this.activePowerSlot = this.activePowerSlot === 0 ? 1 : 0;
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

  /** Allocate a stat point */
  allocateStat(stat: 'might' | 'precision' | 'arcana' | 'vitality'): boolean {
    if (this.stats.unspent <= 0) return false;
    this.stats[stat]++;
    this.stats.unspent--;
    return true;
  }

  // -- Skill Tree --

  /** Set the active skill branch for this character */
  setActiveBranch(branchId: string) {
    this.activeBranch = branchId;
  }

  /** Try to unlock a skill. Returns true if successful. */
  unlockSkill(skillId: string, playerLevel: number): boolean {
    if (!this.activeBranch) return false;
    if (this.skillPoints <= 0) return false;
    if (this.unlockedSkills.has(skillId)) return false;

    const skill = getSkillById(this.activeBranch, skillId);
    if (!skill) return false;
    if (playerLevel < skill.levelReq) return false;
    if (skill.cost > this.skillPoints) return false;
    if (skill.prerequisite && !this.unlockedSkills.has(skill.prerequisite)) return false;

    this.unlockedSkills.add(skillId);
    this.skillPoints -= skill.cost;
    return true;
  }

  /** Check if a skill is unlocked */
  hasSkill(skillId: string): boolean {
    return this.unlockedSkills.has(skillId);
  }

  /** Get the total effect value for a given effect key across all unlocked skills */
  getSkillEffect(effectKey: string): number {
    if (!this.activeBranch) return 0;
    const branch = SKILL_BRANCHES[this.activeBranch];
    if (!branch) return 0;

    let total = 0;
    for (const skill of branch.skills) {
      if (this.unlockedSkills.has(skill.id) && skill.effects[effectKey] !== undefined) {
        total += skill.effects[effectKey];
      }
    }
    return total;
  }

  /** Called on level up — grants stat points AND skill points */
  onLevelUp() {
    this.stats.unspent += 3;
    // Skill point every other level starting at level 3
    this.skillPoints += 1;
  }
}
