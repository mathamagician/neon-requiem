import Phaser from 'phaser';
import type { GameScene } from '../scenes/GameScene';
import { GAME_WIDTH } from '../../shared/constants';

/**
 * Lightweight tutorial system that shows contextual hints as floating text.
 * Each hint triggers once per session based on game-state conditions.
 */

type HintId =
  | 'foundry_enter'
  | 'first_enemy'
  | 'first_pit'
  | 'first_boss'
  | 'death';

interface HintDef {
  id: HintId;
  text: string;
  check: (scene: GameScene) => boolean;
}

const HINTS: HintDef[] = [
  {
    id: 'foundry_enter',
    text: 'ARROWS to move, UP to jump',
    check: (s) => s.currentZone === 'foundry',
  },
  {
    id: 'first_enemy',
    text: 'Z to attack, X to dash',
    check: (s) => {
      const enemies = s.enemies.getChildren() as Phaser.Physics.Arcade.Sprite[];
      const px = s.player.sprite.x;
      const py = s.player.sprite.y;
      return enemies.some((e) => {
        if (!e.active) return false;
        const dist = Phaser.Math.Distance.Between(px, py, e.x, e.y);
        return dist < 200;
      });
    },
  },
  {
    id: 'first_pit',
    text: 'Hold DOWN twice to drop through platforms',
    check: (s) => {
      // Trigger when player is near a pit (standing above air tiles)
      const levelData: number[][] = (s as any).levelData;
      if (!levelData || levelData.length === 0) return false;
      const tileX = Math.floor(s.player.sprite.x / 16);
      const bottomRow = levelData.length - 1;
      const aboveRow = bottomRow - 1;
      return (
        tileX >= 0 &&
        tileX < levelData[0].length &&
        levelData[bottomRow]?.[tileX] === 0 &&
        levelData[aboveRow]?.[tileX] === 0 &&
        s.player.sprite.y < (bottomRow - 2) * 16
      );
    },
  },
  {
    id: 'first_boss',
    text: 'Watch the pattern, dodge, then strike',
    check: (s) => {
      const boss = s.getBoss();
      return !!boss && boss.isActive && boss.state !== 'dead';
    },
  },
  {
    id: 'death',
    text: 'Try a different approach \u2014 explore for power-ups',
    check: (s) => s.player.hp <= 0,
  },
];

/** Duration the hint stays fully visible (ms) */
const DISPLAY_MS = 4000;
/** Fade in/out duration (ms) */
const FADE_MS = 500;

export class TutorialSystem {
  private scene: GameScene;
  private shown: Set<HintId> = new Set();
  private activeText: Phaser.GameObjects.Text | null = null;
  private activeTimer: Phaser.Time.TimerEvent | null = null;

  constructor(scene: GameScene) {
    this.scene = scene;
  }

  update(_time: number, _delta: number) {
    // Don't check while a hint is already displayed
    if (this.activeText) return;

    for (const hint of HINTS) {
      if (this.shown.has(hint.id)) continue;
      if (hint.check(this.scene)) {
        this.showHint(hint);
        break;
      }
    }
  }

  private showHint(hint: HintDef) {
    this.shown.add(hint.id);

    const text = this.scene.add
      .text(GAME_WIDTH / 2, 20, hint.text, {
        fontSize: '14px',
        fontFamily: 'Arial, sans-serif',
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3,
        backgroundColor: '#00000088',
        padding: { x: 10, y: 6 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(300)
      .setAlpha(0);

    this.activeText = text;

    // Fade in
    this.scene.tweens.add({
      targets: text,
      alpha: 1,
      duration: FADE_MS,
    });

    // After display duration, fade out and destroy
    this.activeTimer = this.scene.time.delayedCall(DISPLAY_MS + FADE_MS, () => {
      this.scene.tweens.add({
        targets: text,
        alpha: 0,
        duration: FADE_MS,
        onComplete: () => {
          text.destroy();
          this.activeText = null;
          this.activeTimer = null;
        },
      });
    });
  }

  destroy() {
    if (this.activeText) {
      this.activeText.destroy();
      this.activeText = null;
    }
    if (this.activeTimer) {
      this.activeTimer.destroy();
      this.activeTimer = null;
    }
  }
}
