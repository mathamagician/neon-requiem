import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../../shared/constants';
import type { GameScene } from './GameScene';

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

    this.levelText = this.add.text(8, 6, '', {
      fontSize: '14px', fontFamily: 'Arial, sans-serif', color: '#ffcc44',
      fontStyle: 'bold', stroke: '#000000', strokeThickness: 2,
    });

    this.comboText = this.add.text(GAME_WIDTH / 2, 50, '', {
      fontSize: '18px', fontFamily: 'Arial, sans-serif', color: '#00ffcc',
      fontStyle: 'bold', stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setAlpha(0);

    this.stateText = this.add.text(GAME_WIDTH - 8, 6, '', {
      fontSize: '11px', fontFamily: 'Consolas, monospace', color: '#999999',
      stroke: '#000000', strokeThickness: 1,
    }).setOrigin(1, 0);

    this.controlsText = this.add.text(GAME_WIDTH / 2, 80,
      'ARROWS: Move/Jump  |  Z: Attack  |  X: Dash  |  TAB: Inventory  |  1/2/3: Class', {
      fontSize: '11px', fontFamily: 'Arial, sans-serif', color: '#667788',
      stroke: '#000000', strokeThickness: 1,
    }).setOrigin(0.5);

    this.time.delayedCall(12000, () => {
      this.tweens.add({ targets: this.controlsText, alpha: 0, duration: 2000 });
    });
  }

  update() {
    if (!this.gameScene?.player) return;
    const p = this.gameScene.player;

    // HP Bar
    const hpX = 8;
    const hpY = 24;
    const hpW = 100;
    const hpH = 8;
    const hpRatio = p.hp / p.maxHp;

    this.hpBar.clear();
    this.hpBar.fillStyle(0x000000, 0.5);
    this.hpBar.fillRect(hpX - 1, hpY - 1, hpW + 2, hpH + 2);
    this.hpBar.fillStyle(COLORS.hpBarBg, 0.8);
    this.hpBar.fillRect(hpX, hpY, hpW, hpH);
    const hpColor = hpRatio > 0.5 ? COLORS.hpBar : hpRatio > 0.25 ? 0xffaa22 : COLORS.danger;
    this.hpBar.fillStyle(hpColor, 1);
    this.hpBar.fillRect(hpX, hpY, hpW * hpRatio, hpH);
    this.hpBar.lineStyle(1, 0x888888, 0.5);
    this.hpBar.strokeRect(hpX, hpY, hpW, hpH);

    // Energy Bar
    const eY = hpY + hpH + 3;
    const eRatio = p.energy / p.maxEnergy;

    this.energyBar.clear();
    this.energyBar.fillStyle(0x000000, 0.5);
    this.energyBar.fillRect(hpX - 1, eY - 1, hpW + 2, hpH + 2);
    this.energyBar.fillStyle(COLORS.energyBarBg, 0.8);
    this.energyBar.fillRect(hpX, eY, hpW, hpH);
    this.energyBar.fillStyle(COLORS.energyBar, 1);
    this.energyBar.fillRect(hpX, eY, hpW * eRatio, hpH);
    this.energyBar.lineStyle(1, 0x888888, 0.5);
    this.energyBar.strokeRect(hpX, eY, hpW, hpH);

    // XP Bar
    const xpY = eY + hpH + 3;
    const xpRatio = p.xp / p.xpToNext;
    this.xpBar.clear();
    this.xpBar.fillStyle(0x000000, 0.4);
    this.xpBar.fillRect(hpX, xpY, hpW, 3);
    this.xpBar.fillStyle(0xffcc44, 0.9);
    this.xpBar.fillRect(hpX, xpY, hpW * xpRatio, 3);

    this.levelText.setText(`LV ${p.level}`);

    // Combo
    if (p.isAttacking && p.attackCombo > 0) {
      const comboNames = ['', 'x2', 'x3!'];
      this.comboText.setText(comboNames[p.attackCombo]);
      this.comboText.setAlpha(1);
      this.comboText.setScale(1 + p.attackCombo * 0.2);
    } else {
      this.comboText.setAlpha(Math.max(0, this.comboText.alpha - 0.05));
    }

    this.stateText.setText(
      `${p.state} | HP:${p.hp}/${p.maxHp} | EN:${p.energy}/${p.maxEnergy} | XP:${p.xp}/${p.xpToNext}`
    );
  }
}
