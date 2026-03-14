import Phaser from 'phaser';
import { GAME_WIDTH, COLORS } from '../../shared/constants';
import type { GameScene } from './GameScene';

/**
 * HUD overlay scene — renders on top of the game scene.
 * Shows HP bar, energy bar, level, combo counter, and controls help.
 */
export class HUDScene extends Phaser.Scene {
  private gameScene!: GameScene;
  private hpBar!: Phaser.GameObjects.Graphics;
  private energyBar!: Phaser.GameObjects.Graphics;
  private levelText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  private stateText!: Phaser.GameObjects.Text;
  private controlsText!: Phaser.GameObjects.Text;
  private xpBar!: Phaser.GameObjects.Graphics;

  constructor() {
    super({ key: 'HUDScene' });
  }

  init(data: { gameScene: GameScene }) {
    this.gameScene = data.gameScene;
  }

  create() {
    this.hpBar = this.add.graphics();
    this.energyBar = this.add.graphics();
    this.xpBar = this.add.graphics();

    const textStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontSize: '8px',
      fontFamily: 'monospace',
      color: '#ffffff',
      resolution: 2,
    };

    this.levelText = this.add.text(4, 4, '', { ...textStyle, color: '#ffcc44' });
    this.comboText = this.add.text(GAME_WIDTH / 2, 30, '', {
      ...textStyle,
      fontSize: '10px',
      color: '#00ffcc',
    }).setOrigin(0.5);
    this.comboText.setAlpha(0);

    this.stateText = this.add.text(GAME_WIDTH - 4, 4, '', {
      ...textStyle,
      fontSize: '6px',
      color: '#888888',
    }).setOrigin(1, 0);

    // Controls help (shown at start, fades after 10s)
    this.controlsText = this.add.text(GAME_WIDTH / 2, 50,
      'ARROWS: Move/Jump | Z: Attack | X: Dash | 1/2/3: Class | F1: Debug', {
      ...textStyle,
      fontSize: '6px',
      color: '#556677',
    }).setOrigin(0.5);

    this.time.delayedCall(10000, () => {
      this.tweens.add({
        targets: this.controlsText,
        alpha: 0,
        duration: 2000,
      });
    });
  }

  update() {
    if (!this.gameScene?.player) return;
    const p = this.gameScene.player;

    // HP Bar
    const hpX = 4;
    const hpY = 14;
    const hpW = 60;
    const hpH = 4;
    const hpRatio = p.hp / p.maxHp;

    this.hpBar.clear();
    // Background
    this.hpBar.fillStyle(COLORS.hpBarBg, 0.8);
    this.hpBar.fillRect(hpX, hpY, hpW, hpH);
    // Fill
    const hpColor = hpRatio > 0.5 ? COLORS.hpBar : hpRatio > 0.25 ? 0xffaa22 : COLORS.danger;
    this.hpBar.fillStyle(hpColor, 1);
    this.hpBar.fillRect(hpX, hpY, hpW * hpRatio, hpH);
    // Border
    this.hpBar.lineStyle(1, 0x888888, 0.5);
    this.hpBar.strokeRect(hpX, hpY, hpW, hpH);

    // Energy Bar
    const eY = hpY + hpH + 2;
    const eRatio = p.energy / p.maxEnergy;

    this.energyBar.clear();
    this.energyBar.fillStyle(COLORS.energyBarBg, 0.8);
    this.energyBar.fillRect(hpX, eY, hpW, hpH);
    this.energyBar.fillStyle(COLORS.energyBar, 1);
    this.energyBar.fillRect(hpX, eY, hpW * eRatio, hpH);
    this.energyBar.lineStyle(1, 0x888888, 0.5);
    this.energyBar.strokeRect(hpX, eY, hpW, hpH);

    // XP Bar (thin, below energy)
    const xpY = eY + hpH + 2;
    const xpRatio = p.xp / p.xpToNext;
    this.xpBar.clear();
    this.xpBar.fillStyle(0x222222, 0.6);
    this.xpBar.fillRect(hpX, xpY, hpW, 2);
    this.xpBar.fillStyle(0xffcc44, 0.8);
    this.xpBar.fillRect(hpX, xpY, hpW * xpRatio, 2);

    // Level text
    this.levelText.setText(`LV ${p.level}`);

    // Combo counter
    if (p.isAttacking && p.attackCombo > 0) {
      const comboNames = ['', 'x2', 'x3!'];
      this.comboText.setText(comboNames[p.attackCombo]);
      this.comboText.setAlpha(1);
      this.comboText.setScale(1 + p.attackCombo * 0.15);
    } else {
      this.comboText.setAlpha(Math.max(0, this.comboText.alpha - 0.05));
    }

    // Debug state text
    this.stateText.setText(
      `${p.state} | HP:${p.hp}/${p.maxHp} | E:${p.energy}/${p.maxEnergy} | XP:${p.xp}/${p.xpToNext}`
    );
  }
}
