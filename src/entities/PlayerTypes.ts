import type { Player } from './Player';
import type { Gunner } from './Gunner';
import type { Wraith } from './Wraith';

/** Union of all playable character classes */
export type AnyPlayer = Player | Gunner | Wraith;

/** Shared interface that all player classes implement */
export interface PlayerLike {
  scene: Phaser.Scene;
  sprite: Phaser.Physics.Arcade.Sprite;
  body: Phaser.Physics.Arcade.Body;
  state: string;
  facingRight: boolean;
  hp: number;
  maxHp: number;
  energy: number;
  maxEnergy: number;
  level: number;
  xp: number;
  xpToNext: number;
  isAttacking: boolean;
  attackCombo: number;
  invincibleUntil: number;
  hitstopUntil: number;

  update(time: number, delta: number): void;
  takeDamage(amount: number, sourceX: number, time: number): void;
  onAttackHit(time: number): void;
  gainXP(amount: number): void;
  gainEnergy(amount: number): void;
  getAttackHitbox(): Phaser.Geom.Rectangle | null;
  getAttackDamage(): number;
}
