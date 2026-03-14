/**
 * Boss Power definitions — absorbed after defeating a boss.
 * Each power has a usable ability mapped to the C key.
 */

export interface BossPowerDef {
  id: string;
  name: string;
  bossName: string;
  description: string;
  energyCost: number;
  cooldownMs: number;
  /** Base damage before arcana scaling */
  baseDamage: number;
  /** Color tint for projectiles/effects */
  color: number;
  /** Duration of effect in ms (for auras, etc.) */
  durationMs?: number;
}

export const BOSS_POWERS: Record<string, BossPowerDef> = {
  chain_lightning: {
    id: 'chain_lightning',
    name: 'Chain Lightning',
    bossName: 'Voltrexx',
    description: 'Arcs between nearby enemies',
    energyCost: 15,
    cooldownMs: 1200,
    baseDamage: 18,
    color: 0x00ffcc,
  },
  soul_drain: {
    id: 'soul_drain',
    name: 'Soul Drain',
    bossName: 'The Hollow King',
    description: 'Melee hit that heals you',
    energyCost: 12,
    cooldownMs: 1000,
    baseDamage: 14,
    color: 0x4488ff,
    durationMs: 300,
  },
  thornlash: {
    id: 'thornlash',
    name: 'Thornlash',
    bossName: 'Lady Hemlock',
    description: 'Vine whip with poison DOT',
    energyCost: 14,
    cooldownMs: 1100,
    baseDamage: 10,
    color: 0x44cc44,
    durationMs: 3000,
  },
  mortar_burst: {
    id: 'mortar_burst',
    name: 'Mortar Burst',
    bossName: 'Ironmaw',
    description: 'Lobbed explosive, area damage',
    energyCost: 18,
    cooldownMs: 1500,
    baseDamage: 25,
    color: 0xff8844,
  },
  phase_shift: {
    id: 'phase_shift',
    name: 'Phase Shift',
    bossName: 'Spectra',
    description: 'Short-range teleport through walls',
    energyCost: 10,
    cooldownMs: 800,
    baseDamage: 0,
    color: 0xcc44ff,
    durationMs: 200,
  },
  pulse_wave: {
    id: 'pulse_wave',
    name: 'Pulse Wave',
    bossName: 'Conductor IX',
    description: 'Wide-range knockback + stun',
    energyCost: 16,
    cooldownMs: 1400,
    baseDamage: 12,
    color: 0xffcc44,
  },
  immolate: {
    id: 'immolate',
    name: 'Immolate',
    bossName: 'Emberwitch',
    description: 'Surrounds you in damaging fire aura',
    energyCost: 20,
    cooldownMs: 2000,
    baseDamage: 8,
    color: 0xff4422,
    durationMs: 3000,
  },
  gravity_well: {
    id: 'gravity_well',
    name: 'Gravity Well',
    bossName: 'Dreadnaught',
    description: 'Pulls enemies to a point + crush damage',
    energyCost: 22,
    cooldownMs: 1800,
    baseDamage: 20,
    color: 0x8844ff,
    durationMs: 1500,
  },
};

export function getBossPower(id: string): BossPowerDef | undefined {
  return BOSS_POWERS[id];
}
