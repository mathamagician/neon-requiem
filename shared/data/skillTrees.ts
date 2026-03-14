/**
 * Skill tree definitions — one branch per class for v0.5.
 * Each skill has a level requirement and cost (skill points).
 * Skills provide passive bonuses or unlock new combat mechanics.
 */

import type { ClassName } from '../../src/scenes/GameScene';

export interface SkillDef {
  id: string;
  name: string;
  description: string;
  /** Minimum character level to unlock */
  levelReq: number;
  /** Skill point cost */
  cost: number;
  /** Which skill must be unlocked first (null = root skill) */
  prerequisite: string | null;
  /** Passive effect key → value (applied by the game) */
  effects: Record<string, number>;
}

export interface SkillBranch {
  id: string;
  name: string;
  className: ClassName;
  description: string;
  skills: SkillDef[];
}

/**
 * VANGUARD — Warblade Branch
 * Focuses on melee combo extensions, damage multipliers, and execute mechanics.
 */
const warbladeSkills: SkillDef[] = [
  {
    id: 'wb_sharp_edge',
    name: 'Sharp Edge',
    description: '+15% melee damage',
    levelReq: 3,
    cost: 1,
    prerequisite: null,
    effects: { meleeDamageBonus: 0.15 },
  },
  {
    id: 'wb_combo_speed',
    name: 'Swift Combos',
    description: '-20% attack cooldown',
    levelReq: 5,
    cost: 1,
    prerequisite: 'wb_sharp_edge',
    effects: { attackCooldownReduction: 0.20 },
  },
  {
    id: 'wb_third_strike',
    name: 'Heavy Finisher',
    description: '+30% damage on 3rd combo hit',
    levelReq: 8,
    cost: 1,
    prerequisite: 'wb_combo_speed',
    effects: { finisherDamageBonus: 0.30 },
  },
  {
    id: 'wb_energy_strikes',
    name: 'Energy Strikes',
    description: '+2 energy per hit (total 5)',
    levelReq: 10,
    cost: 1,
    prerequisite: 'wb_sharp_edge',
    effects: { energyPerHit: 2 },
  },
  {
    id: 'wb_lunge',
    name: 'Lunging Strike',
    description: 'All combo hits lunge forward',
    levelReq: 12,
    cost: 2,
    prerequisite: 'wb_third_strike',
    effects: { allComboLunge: 1 },
  },
  {
    id: 'wb_execute',
    name: 'Execute',
    description: '+50% damage to enemies below 25% HP',
    levelReq: 15,
    cost: 2,
    prerequisite: 'wb_lunge',
    effects: { executeDamageBonus: 0.50, executeThreshold: 0.25 },
  },
  {
    id: 'wb_blade_storm',
    name: 'Blade Storm',
    description: '4th combo hit: wide arc hitting all nearby',
    levelReq: 18,
    cost: 2,
    prerequisite: 'wb_execute',
    effects: { fourthComboHit: 1 },
  },
  {
    id: 'wb_mastery',
    name: 'Warblade Mastery',
    description: '+25% melee damage, +10% crit chance',
    levelReq: 20,
    cost: 3,
    prerequisite: 'wb_blade_storm',
    effects: { meleeDamageBonus: 0.25, critChanceBonus: 0.10 },
  },
];

/**
 * GUNNER — Sharpshooter Branch
 * Focuses on ranged damage, charge speed, and piercing.
 */
const sharpshooterSkills: SkillDef[] = [
  {
    id: 'ss_steady_aim',
    name: 'Steady Aim',
    description: '+15% ranged damage',
    levelReq: 3,
    cost: 1,
    prerequisite: null,
    effects: { rangedDamageBonus: 0.15 },
  },
  {
    id: 'ss_quick_charge',
    name: 'Quick Charge',
    description: '-25% charge time',
    levelReq: 5,
    cost: 1,
    prerequisite: 'ss_steady_aim',
    effects: { chargeTimeReduction: 0.25 },
  },
  {
    id: 'ss_rapid_fire',
    name: 'Rapid Fire',
    description: '-30% shot cooldown',
    levelReq: 8,
    cost: 1,
    prerequisite: 'ss_quick_charge',
    effects: { shotCooldownReduction: 0.30 },
  },
  {
    id: 'ss_piercing_rounds',
    name: 'Piercing Rounds',
    description: 'Normal shots pierce 1 enemy',
    levelReq: 10,
    cost: 1,
    prerequisite: 'ss_steady_aim',
    effects: { normalPiercing: 1 },
  },
  {
    id: 'ss_crit_shots',
    name: 'Critical Shots',
    description: '+15% crit chance on charged shots',
    levelReq: 12,
    cost: 2,
    prerequisite: 'ss_rapid_fire',
    effects: { chargedCritBonus: 0.15 },
  },
  {
    id: 'ss_overcharge',
    name: 'Overcharge',
    description: 'Hold charge longer for +50% damage',
    levelReq: 15,
    cost: 2,
    prerequisite: 'ss_crit_shots',
    effects: { overchargeDamageBonus: 0.50 },
  },
  {
    id: 'ss_split_shot',
    name: 'Split Shot',
    description: 'Charged shots split into 3 on hit',
    levelReq: 18,
    cost: 2,
    prerequisite: 'ss_overcharge',
    effects: { splitShot: 1 },
  },
  {
    id: 'ss_mastery',
    name: 'Sharpshooter Mastery',
    description: '+25% ranged damage, +20% charge speed',
    levelReq: 20,
    cost: 3,
    prerequisite: 'ss_split_shot',
    effects: { rangedDamageBonus: 0.25, chargeTimeReduction: 0.20 },
  },
];

/**
 * WRAITH — Shadowstrike Branch
 * Focuses on crit damage, dash resets, and backstab mechanics.
 */
const shadowstrikeSkills: SkillDef[] = [
  {
    id: 'sh_keen_blades',
    name: 'Keen Blades',
    description: '+10% crit chance',
    levelReq: 3,
    cost: 1,
    prerequisite: null,
    effects: { critChanceBonus: 0.10 },
  },
  {
    id: 'sh_lethal_precision',
    name: 'Lethal Precision',
    description: '+30% crit damage (2.3x total)',
    levelReq: 5,
    cost: 1,
    prerequisite: 'sh_keen_blades',
    effects: { critDamageBonus: 0.30 },
  },
  {
    id: 'sh_shadow_dash',
    name: 'Shadow Dash',
    description: 'Dash cooldown resets on kill',
    levelReq: 8,
    cost: 1,
    prerequisite: 'sh_lethal_precision',
    effects: { dashResetOnKill: 1 },
  },
  {
    id: 'sh_backstab',
    name: 'Backstab',
    description: '+40% damage from behind enemies',
    levelReq: 10,
    cost: 1,
    prerequisite: 'sh_keen_blades',
    effects: { backstabBonus: 0.40 },
  },
  {
    id: 'sh_flurry',
    name: 'Flurry',
    description: '+20% attack speed during combo',
    levelReq: 12,
    cost: 2,
    prerequisite: 'sh_shadow_dash',
    effects: { comboSpeedBonus: 0.20 },
  },
  {
    id: 'sh_poison_blades',
    name: 'Poison Blades',
    description: 'Crits apply 3s poison (2 dmg/s)',
    levelReq: 15,
    cost: 2,
    prerequisite: 'sh_flurry',
    effects: { poisonOnCrit: 1, poisonDps: 2, poisonDuration: 3000 },
  },
  {
    id: 'sh_death_mark',
    name: 'Death Mark',
    description: 'Enemies hit 5+ times take 25% more damage',
    levelReq: 18,
    cost: 2,
    prerequisite: 'sh_poison_blades',
    effects: { deathMarkThreshold: 5, deathMarkBonus: 0.25 },
  },
  {
    id: 'sh_mastery',
    name: 'Shadowstrike Mastery',
    description: '+15% crit chance, +50% crit damage',
    levelReq: 20,
    cost: 3,
    prerequisite: 'sh_death_mark',
    effects: { critChanceBonus: 0.15, critDamageBonus: 0.50 },
  },
];

export const SKILL_BRANCHES: Record<string, SkillBranch> = {
  warblade: {
    id: 'warblade',
    name: 'Warblade',
    className: 'vanguard',
    description: 'Melee combo extensions, damage multipliers, execute mechanics',
    skills: warbladeSkills,
  },
  sharpshooter: {
    id: 'sharpshooter',
    name: 'Sharpshooter',
    className: 'gunner',
    description: 'Ranged damage, charge speed, piercing rounds',
    skills: sharpshooterSkills,
  },
  shadowstrike: {
    id: 'shadowstrike',
    name: 'Shadowstrike',
    className: 'wraith',
    description: 'Crit damage, dash resets, backstab mechanics',
    skills: shadowstrikeSkills,
  },
};

/** Get the default skill branch for a class */
export function getDefaultBranch(className: ClassName): SkillBranch {
  switch (className) {
    case 'vanguard': return SKILL_BRANCHES.warblade;
    case 'gunner': return SKILL_BRANCHES.sharpshooter;
    case 'wraith': return SKILL_BRANCHES.shadowstrike;
  }
}

/** Get a skill definition by ID */
export function getSkillById(branchId: string, skillId: string): SkillDef | undefined {
  return SKILL_BRANCHES[branchId]?.skills.find(s => s.id === skillId);
}
