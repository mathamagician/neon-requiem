/**
 * Accessibility settings — persisted to localStorage.
 * Provides remappable controls, screen shake toggle, and visual options.
 */

const SETTINGS_KEY = 'neon-requiem-settings';

export interface KeyBindings {
  left: string;
  right: string;
  jump: string;
  attack: string;
  power: string;      // boss power
  swapPower: string;
  inventory: string;
  interact: string;
}

export interface AccessibilityOptions {
  screenShake: boolean;
  /** 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia' */
  colorblindMode: string;
  /** HUD scale multiplier (1 = default, 1.5 = large) */
  hudScale: number;
  /** Show damage numbers */
  showDamageNumbers: boolean;
}

export interface GameSettings {
  keys: KeyBindings;
  accessibility: AccessibilityOptions;
}

const DEFAULT_KEYS: KeyBindings = {
  left: 'LEFT',
  right: 'RIGHT',
  jump: 'UP',
  attack: 'X',
  power: 'C',
  swapPower: 'S',
  inventory: 'TAB',
  interact: 'Z',
};

const DEFAULT_ACCESSIBILITY: AccessibilityOptions = {
  screenShake: true,
  colorblindMode: 'none',
  hudScale: 1,
  showDamageNumbers: true,
};

let cachedSettings: GameSettings | null = null;

/** Load settings from localStorage (or defaults) */
export function getSettings(): GameSettings {
  if (cachedSettings) return cachedSettings;

  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      cachedSettings = {
        keys: { ...DEFAULT_KEYS, ...parsed.keys },
        accessibility: { ...DEFAULT_ACCESSIBILITY, ...parsed.accessibility },
      };
      return cachedSettings;
    }
  } catch { /* use defaults */ }

  cachedSettings = {
    keys: { ...DEFAULT_KEYS },
    accessibility: { ...DEFAULT_ACCESSIBILITY },
  };
  return cachedSettings;
}

/** Save settings to localStorage */
export function saveSettings(settings: GameSettings) {
  cachedSettings = settings;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

/** Update a single key binding */
export function rebindKey(action: keyof KeyBindings, newKey: string) {
  const s = getSettings();
  s.keys[action] = newKey;
  saveSettings(s);
}

/** Toggle screen shake */
export function toggleScreenShake() {
  const s = getSettings();
  s.accessibility.screenShake = !s.accessibility.screenShake;
  saveSettings(s);
  return s.accessibility.screenShake;
}

/** Cycle colorblind mode */
export function cycleColorblindMode(): string {
  const modes = ['none', 'protanopia', 'deuteranopia', 'tritanopia'];
  const s = getSettings();
  const idx = modes.indexOf(s.accessibility.colorblindMode);
  s.accessibility.colorblindMode = modes[(idx + 1) % modes.length];
  saveSettings(s);
  return s.accessibility.colorblindMode;
}

/** Get Phaser key code string for an action */
export function getKeyForAction(action: keyof KeyBindings): string {
  return getSettings().keys[action];
}

/** Shake camera only if screen shake is enabled */
export function safeShake(camera: { shake: (duration: number, intensity: number) => void }, duration: number, intensity: number) {
  if (getSettings().accessibility.screenShake) {
    camera.shake(duration, intensity);
  }
}
