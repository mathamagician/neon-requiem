// Game world constants
export const TILE_SIZE = 16;
export const GAME_WIDTH = 640;
export const GAME_HEIGHT = 360;
export const SCALE = 2; // Render at 640x360, display at 1280x720

// Physics
export const GRAVITY = 900;
export const TERMINAL_VELOCITY = 600;

// Player defaults
export const PLAYER_SPEED = 120;
export const PLAYER_JUMP_VELOCITY = -280;
export const PLAYER_MAX_HP = 100;
export const PLAYER_MAX_ENERGY = 50;
export const COYOTE_TIME_MS = 120; // ms after leaving platform where jump still works
export const JUMP_BUFFER_MS = 150; // ms before landing where jump input is remembered

// Movement feel — acceleration/deceleration for responsive but weighty controls
export const PLAYER_ACCEL = 800;       // px/s² — how fast player reaches top speed
export const PLAYER_DECEL = 500;       // px/s² — ground slide when releasing input
export const PLAYER_AIR_ACCEL = 500;   // px/s² — less control in air
export const PLAYER_AIR_DECEL = 200;   // px/s² — very low air friction (momentum)

// Combat
export const INVINCIBILITY_FRAMES_MS = 800;
export const HITSTOP_DURATION_MS = 50;
export const KNOCKBACK_VELOCITY = 150;

// Environmental hazards
export const SPIKE_DAMAGE_PERCENT = 0.15; // % of maxHP per spike tick
export const SPIKE_TICK_MS = 600; // ms between spike damage ticks

// Enemy defaults
export const ENEMY_PATROL_SPEED = 40;
export const ENEMY_CHASE_SPEED = 70;
export const ENEMY_DETECT_RANGE = 120;
export const ENEMY_ATTACK_RANGE = 24;

// Colors (for placeholder graphics)
export const COLORS = {
  vanguard: 0x4488ff,
  gunner: 0x44ff88,
  wraith: 0xaa44ff,
  channeler: 0xff8844,
  enemy: 0xff4444,
  ground: 0x334455,
  platform: 0x445566,
  background: 0x121225,
  hpBar: 0x44ff44,
  hpBarBg: 0x442222,
  energyBar: 0x4488ff,
  energyBarBg: 0x222244,
  neon: 0x00ffcc,
  danger: 0xff2244,
};
