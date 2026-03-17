import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../../shared/constants';
import {
  getSettings, saveSettings,
  type KeyBindings, type GameSettings,
} from '../systems/AccessibilitySettings';
import { setSoundVolume } from '../systems/SoundManager';
import { setMusicVolume } from '../systems/MusicManager';

const MONO = 'Consolas, "Courier New", monospace';

type SettingsSection = 'controls' | 'accessibility' | 'audio';

const KEY_ACTIONS: { action: keyof KeyBindings; label: string }[] = [
  { action: 'left', label: 'Move Left' },
  { action: 'right', label: 'Move Right' },
  { action: 'jump', label: 'Jump' },
  { action: 'attack', label: 'Attack' },
  { action: 'power', label: 'Boss Power' },
  { action: 'swapPower', label: 'Swap Power' },
  { action: 'inventory', label: 'Inventory' },
  { action: 'interact', label: 'Interact' },
];

const COLORBLIND_LABELS: Record<string, string> = {
  none: 'Off',
  protanopia: 'Protanopia',
  deuteranopia: 'Deuteranopia',
  tritanopia: 'Tritanopia',
};

export class SettingsScene extends Phaser.Scene {
  private settings!: GameSettings;
  private section: SettingsSection = 'controls';
  private selectedIndex = 0;
  private waitingForKey = false;
  private rows: Phaser.GameObjects.Text[] = [];
  private sectionTabs: Phaser.GameObjects.Text[] = [];
  private instructionText!: Phaser.GameObjects.Text;
  private calledFrom: string = 'TitleScene';

  constructor() {
    super({ key: 'SettingsScene' });
  }

  init(data?: { from?: string }) {
    this.calledFrom = data?.from ?? 'TitleScene';
    this.settings = getSettings();
    this.section = 'controls';
    this.selectedIndex = 0;
    this.waitingForKey = false;
  }

  create() {
    // Background
    const bg = this.add.graphics();
    bg.fillStyle(0x050510, 0.95);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Title
    this.add.text(GAME_WIDTH / 2, 14, 'SETTINGS', {
      fontSize: '16px', fontFamily: MONO, color: '#00ffcc',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5);

    // Section tabs
    this.sectionTabs = [];
    const tabY = 34;
    const controlsTab = this.add.text(GAME_WIDTH * 0.2, tabY, 'CONTROLS', {
      fontSize: '11px', fontFamily: MONO, color: '#ffffff',
      stroke: '#000000', strokeThickness: 1,
    }).setOrigin(0.5);
    const accessTab = this.add.text(GAME_WIDTH * 0.5, tabY, 'ACCESSIBILITY', {
      fontSize: '11px', fontFamily: MONO, color: '#888888',
      stroke: '#000000', strokeThickness: 1,
    }).setOrigin(0.5);
    const audioTab = this.add.text(GAME_WIDTH * 0.8, tabY, 'AUDIO', {
      fontSize: '11px', fontFamily: MONO, color: '#888888',
      stroke: '#000000', strokeThickness: 1,
    }).setOrigin(0.5);
    this.sectionTabs = [controlsTab, accessTab, audioTab];

    // Instructions
    this.instructionText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 18, 'UP/DOWN: Select | Z/ENTER: Change | LEFT/RIGHT: Tab | ESC: Back', {
      fontSize: '10px', fontFamily: MONO, color: '#556677',
      stroke: '#000000', strokeThickness: 1,
    }).setOrigin(0.5);

    this.buildRows();

    // Input
    this.input.keyboard!.on('keydown', (e: KeyboardEvent) => {
      if (this.waitingForKey) {
        this.captureKey(e);
        return;
      }

      switch (e.key) {
        case 'ArrowUp':
          this.selectedIndex = (this.selectedIndex - 1 + this.rows.length) % this.rows.length;
          this.updateHighlight();
          break;
        case 'ArrowDown':
          this.selectedIndex = (this.selectedIndex + 1) % this.rows.length;
          this.updateHighlight();
          break;
        case 'ArrowLeft':
          if (this.section === 'audio') {
            this.adjustVolume(-5);
          } else {
            this.switchSection(-1);
          }
          break;
        case 'ArrowRight':
          if (this.section === 'audio') {
            this.adjustVolume(5);
          } else {
            this.switchSection(1);
          }
          break;
        case 'z':
        case 'Z':
        case 'Enter':
          this.activateRow();
          break;
        case 'Escape':
          this.closeSettings();
          break;
      }
    });
  }

  private buildRows() {
    for (const r of this.rows) r.destroy();
    this.rows = [];
    this.selectedIndex = 0;

    const startY = 56;
    const lineH = 22;

    if (this.section === 'controls') {
      for (let i = 0; i < KEY_ACTIONS.length; i++) {
        const { action, label } = KEY_ACTIONS[i];
        const currentKey = this.settings.keys[action];
        const text = this.add.text(40, startY + i * lineH, `${label}: ${currentKey}`, {
          fontSize: '11px', fontFamily: MONO, color: '#cccccc',
          stroke: '#000000', strokeThickness: 1,
        });
        this.rows.push(text);
      }
    } else if (this.section === 'accessibility') {
      // Accessibility options
      const items = [
        `Screen Shake: ${this.settings.accessibility.screenShake ? 'ON' : 'OFF'}`,
        `Colorblind Mode: ${COLORBLIND_LABELS[this.settings.accessibility.colorblindMode] ?? 'Off'}`,
        `Damage Numbers: ${this.settings.accessibility.showDamageNumbers ? 'ON' : 'OFF'}`,
        `HUD Scale: ${this.settings.accessibility.hudScale}x`,
      ];
      for (let i = 0; i < items.length; i++) {
        const text = this.add.text(40, startY + i * lineH, items[i], {
          fontSize: '11px', fontFamily: MONO, color: '#cccccc',
          stroke: '#000000', strokeThickness: 1,
        });
        this.rows.push(text);
      }
    } else {
      // Audio section
      const sfx = this.settings.accessibility.sfxVolume ?? 30;
      const music = this.settings.accessibility.musicVolume ?? 6;
      const bar = (val: number) => {
        const filled = Math.round(val / 5);
        return '|'.repeat(filled) + '·'.repeat(20 - filled);
      };
      const items = [
        `SFX Volume:   [${bar(sfx)}] ${sfx}%`,
        `Music Volume: [${bar(music)}] ${music}%`,
      ];
      for (let i = 0; i < items.length; i++) {
        const text = this.add.text(20, startY + i * lineH, items[i], {
          fontSize: '11px', fontFamily: MONO, color: '#cccccc',
          stroke: '#000000', strokeThickness: 1,
        });
        this.rows.push(text);
      }
    }

    this.updateHighlight();

    // Update instructions per section
    if (this.section === 'audio') {
      this.instructionText.setText('UP/DOWN: Select | LEFT/RIGHT: Adjust | Z/ENTER: Tab | ESC: Back');
    } else {
      this.instructionText.setText('UP/DOWN: Select | Z/ENTER: Change | LEFT/RIGHT: Tab | ESC: Back');
    }
  }

  private updateHighlight() {
    for (let i = 0; i < this.rows.length; i++) {
      this.rows[i].setAlpha(i === this.selectedIndex ? 1 : 0.5);
    }
  }

  private switchSection(dir: number) {
    const sections: SettingsSection[] = ['controls', 'accessibility', 'audio'];
    const idx = sections.indexOf(this.section);
    const newIdx = (idx + dir + sections.length) % sections.length;
    this.section = sections[newIdx];

    // Update tab colors
    for (let i = 0; i < this.sectionTabs.length; i++) {
      this.sectionTabs[i].setColor(i === newIdx ? '#ffffff' : '#888888');
    }

    this.buildRows();
  }

  private activateRow() {
    if (this.section === 'audio') {
      // In audio tab, Z/Enter cycles to next tab (since Left/Right adjust volume)
      this.switchSection(1);
      return;
    }
    if (this.section === 'controls') {
      // Enter rebind mode
      this.waitingForKey = true;
      this.rows[this.selectedIndex].setColor('#ffcc44');
      this.rows[this.selectedIndex].setText(`${KEY_ACTIONS[this.selectedIndex].label}: [Press a key...]`);
      this.instructionText.setText('Press any key to rebind, or ESC to cancel');
    } else {
      // Toggle accessibility options
      switch (this.selectedIndex) {
        case 0:
          this.settings.accessibility.screenShake = !this.settings.accessibility.screenShake;
          break;
        case 1: {
          const modes = ['none', 'protanopia', 'deuteranopia', 'tritanopia'];
          const idx = modes.indexOf(this.settings.accessibility.colorblindMode);
          this.settings.accessibility.colorblindMode = modes[(idx + 1) % modes.length];
          break;
        }
        case 2:
          this.settings.accessibility.showDamageNumbers = !this.settings.accessibility.showDamageNumbers;
          break;
        case 3: {
          const scales = [1, 1.25, 1.5];
          const idx = scales.indexOf(this.settings.accessibility.hudScale);
          this.settings.accessibility.hudScale = scales[(idx + 1) % scales.length];
          break;
        }
      }
      saveSettings(this.settings);
      this.buildRows();
    }
  }

  private captureKey(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      // Cancel rebind
      this.waitingForKey = false;
      this.buildRows();
      this.instructionText.setText('UP/DOWN: Select | Z/ENTER: Change | LEFT/RIGHT: Tab | ESC: Back');
      return;
    }

    // Map keyboard event to Phaser key name
    const phaserKey = this.eventKeyToPhaserKey(e);
    if (!phaserKey) return;

    const action = KEY_ACTIONS[this.selectedIndex].action;
    this.settings.keys[action] = phaserKey;
    saveSettings(this.settings);

    this.waitingForKey = false;
    this.buildRows();
    this.instructionText.setText('UP/DOWN: Select | Z/ENTER: Change | LEFT/RIGHT: Tab | ESC: Back');
  }

  private eventKeyToPhaserKey(e: KeyboardEvent): string | null {
    // Map common keys to Phaser key names
    const map: Record<string, string> = {
      ArrowUp: 'UP', ArrowDown: 'DOWN', ArrowLeft: 'LEFT', ArrowRight: 'RIGHT',
      ' ': 'SPACE', Tab: 'TAB', Enter: 'ENTER', Shift: 'SHIFT',
      Control: 'CTRL', Alt: 'ALT',
    };

    if (map[e.key]) return map[e.key];

    // Single character keys (letters, numbers)
    if (e.key.length === 1 && /[a-zA-Z0-9]/.test(e.key)) {
      return e.key.toUpperCase();
    }

    return null;
  }

  private adjustVolume(delta: number) {
    if (this.selectedIndex === 0) {
      this.settings.accessibility.sfxVolume = Math.max(0, Math.min(100,
        (this.settings.accessibility.sfxVolume ?? 30) + delta));
      setSoundVolume(this.settings.accessibility.sfxVolume / 100);
    } else if (this.selectedIndex === 1) {
      this.settings.accessibility.musicVolume = Math.max(0, Math.min(100,
        (this.settings.accessibility.musicVolume ?? 6) + delta));
      setMusicVolume(this.settings.accessibility.musicVolume / 100);
    }
    saveSettings(this.settings);
    this.buildRows();
  }

  private closeSettings() {
    if (this.calledFrom === 'PauseScene') {
      this.scene.stop('SettingsScene');
      this.scene.launch('PauseScene', { gameScene: (this.scene.get('GameScene') as any) });
    } else if (this.calledFrom === 'GameScene') {
      this.scene.stop('SettingsScene');
      this.scene.resume('GameScene');
    } else {
      this.scene.start('TitleScene');
    }
  }
}
