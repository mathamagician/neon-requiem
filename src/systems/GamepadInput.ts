/**
 * GamepadInput — helper to read gamepad state alongside keyboard.
 * Standard mapping (Xbox/PS layout):
 *   Left stick / D-pad: movement
 *   A (0) / Cross: jump
 *   X (2) / Square: attack
 *   B (1) / Circle: dash
 *   Y (3) / Triangle: power
 *   LB (4): swap power
 *   RB (5): interact
 *   Start (9): inventory/pause
 *   Select (8): settings
 */

export interface GamepadState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  jump: boolean;
  attack: boolean;
  dash: boolean;
  power: boolean;
  swapPower: boolean;
  inventory: boolean;
  /** True on the frame the button was first pressed */
  jumpJust: boolean;
  attackJust: boolean;
  dashJust: boolean;
  /** True on the frame the button was first released */
  attackReleased: boolean;
  /** True on the frame down was first pressed (for platform drop-through) */
  downJust: boolean;
  /** Vanguard shield (RB / R1) */
  shield: boolean;
}

const DEADZONE = 0.3;

// Previous frame state for just-pressed/released detection
let prevJump = false;
let prevAttack = false;
let prevDash = false;
let prevDown = false;

export function readGamepad(scene: Phaser.Scene): GamepadState | null {
  if (!scene.input.gamepad) return null;
  const pad = scene.input.gamepad.getPad(0);
  if (!pad) return null;

  const lx = pad.axes.length > 0 ? pad.axes[0].getValue() : 0;
  const ly = pad.axes.length > 1 ? pad.axes[1].getValue() : 0;

  const left = lx < -DEADZONE || pad.left;
  const right = lx > DEADZONE || pad.right;
  const up = ly < -DEADZONE || pad.up;
  const down = ly > DEADZONE || pad.down;

  const jump = !!pad.A;
  const attack = !!pad.X;
  const dash = !!pad.B;

  const jumpJust = jump && !prevJump;
  const attackJust = attack && !prevAttack;
  const dashJust = dash && !prevDash;
  const attackReleased = !attack && prevAttack;
  const downJust = down && !prevDown;

  prevJump = jump;
  prevAttack = attack;
  prevDash = dash;
  prevDown = down;

  return {
    left, right, up, down,
    jump, attack, dash,
    power: !!pad.Y,
    swapPower: !!pad.L1,
    inventory: pad.buttons[9]?.pressed ?? false,
    jumpJust, attackJust, dashJust,
    attackReleased,
    downJust,
    shield: pad.R1 ? true : false,
  };
}
