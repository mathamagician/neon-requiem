import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../../shared/constants';
import { RARITY_COLORS, RARITY_NAMES } from '../../shared/data/equipment';
import type { EquipSlot } from '../../shared/data/equipment';
import { SKILL_BRANCHES } from '../../shared/data/skillTrees';
import type { InventorySystem } from '../systems/InventorySystem';
import type { GameScene } from './GameScene';
import { playSound } from '../systems/SoundManager';
import { drawPanel, drawDivider, drawTabs, drawStatBar, drawSectionHeader, drawItemSlot, RARITY_INT } from '../systems/UIHelper';

const FONT = 'Arial, Helvetica, sans-serif';
const MONO = 'Consolas, "Courier New", monospace';

type TabMode = 'stats' | 'backpack' | 'skills';
const TABS: TabMode[] = ['stats', 'backpack', 'skills'];
const TAB_NAMES = ['STATS', 'BACKPACK', 'SKILLS'];

export class InventoryScene extends Phaser.Scene {
  private gameScene!: GameScene;
  private panelGfx!: Phaser.GameObjects.Graphics;
  private contentGfx!: Phaser.GameObjects.Graphics;
  private texts: Phaser.GameObjects.Text[] = [];
  private selectedIndex = 0;
  private mode: TabMode = 'stats';
  private _discardBound = false;

  constructor() {
    super({ key: 'InventoryScene' });
  }

  init(data: { gameScene: GameScene }) {
    this.gameScene = data.gameScene;
    this.selectedIndex = 0;
    this._discardBound = false;
  }

  create() {
    // Panel graphics (drawn once per refresh)
    this.panelGfx = this.add.graphics();
    this.contentGfx = this.add.graphics();

    this.input.keyboard!.on('keydown-TAB', (e: KeyboardEvent) => { e.preventDefault(); this.closeInventory(); });
    this.input.keyboard!.on('keydown-ESC', () => this.closeInventory());
    this.input.keyboard!.on('keydown-LEFT', () => {
      const idx = TABS.indexOf(this.mode);
      this.mode = TABS[(idx - 1 + TABS.length) % TABS.length];
      this.selectedIndex = 0;
      playSound('menuSelect');
      this.refresh();
    });
    this.input.keyboard!.on('keydown-RIGHT', () => {
      const idx = TABS.indexOf(this.mode);
      this.mode = TABS[(idx + 1) % TABS.length];
      this.selectedIndex = 0;
      playSound('menuSelect');
      this.refresh();
    });
    this.input.keyboard!.on('keydown-UP', () => {
      this.selectedIndex = Math.max(0, this.selectedIndex - 1);
      playSound('menuSelect');
      this.refresh();
    });
    this.input.keyboard!.on('keydown-DOWN', () => {
      this.selectedIndex++;
      playSound('menuSelect');
      this.refresh();
    });
    this.input.keyboard!.on('keydown-Z', () => this.handleAction());

    this.refresh();
  }

  private refresh() {
    this.texts.forEach(t => t.destroy());
    this.texts = [];
    this.panelGfx.clear();
    this.contentGfx.clear();

    const inv = this.gameScene.getInventory();
    const player = this.gameScene.player;
    const g = this.panelGfx;

    // Full-screen dimmed background
    g.fillStyle(0x050510, 0.92);
    g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Main panel
    drawPanel(g, 8, 8, GAME_WIDTH - 16, GAME_HEIGHT - 16);

    // Title bar
    drawSectionHeader(g, 12, 12, GAME_WIDTH - 24, 0x00ffcc);
    this.txt('INVENTORY', GAME_WIDTH / 2, 16, { fontSize: '16px', color: '#00ffcc', fontStyle: 'bold' }).setOrigin(0.5, 0);

    // Gold display
    this.txt(`${this.gameScene.gold}g`, GAME_WIDTH - 24, 16, {
      fontSize: '13px', color: '#ffcc44', fontFamily: MONO,
    }).setOrigin(1, 0);

    // Tab bar
    const tabY = 36;
    const tabW = Math.floor((GAME_WIDTH - 28) / 3);
    const activeIdx = TABS.indexOf(this.mode);
    drawTabs(g, TAB_NAMES, activeIdx, 14, tabY, tabW, 20);
    for (let i = 0; i < TAB_NAMES.length; i++) {
      this.txt(TAB_NAMES[i], 14 + i * tabW + tabW / 2, tabY + 4, {
        fontSize: '12px', fontFamily: MONO,
        color: i === activeIdx ? '#00ffcc' : '#556677',
        fontStyle: i === activeIdx ? 'bold' : 'normal',
      }).setOrigin(0.5, 0);
    }

    // Footer
    this.txt('TAB/ESC: Close  |  ←/→: Tab  |  ↑/↓: Select  |  Z: Use', GAME_WIDTH / 2, GAME_HEIGHT - 20, {
      fontSize: '10px', color: '#445566', fontFamily: MONO,
    }).setOrigin(0.5);

    // Content area starts at y=60
    if (this.mode === 'stats') {
      this.renderStats(inv, player);
    } else if (this.mode === 'backpack') {
      this.renderBackpack(inv);
    } else {
      this.renderSkills(inv, player);
    }
  }

  private renderStats(inv: InventorySystem, player: any) {
    const g = this.contentGfx;
    const lx = 20;
    const rx = GAME_WIDTH / 2 + 10;
    let ly = 62;
    let ry = 62;

    // -- Left column: Character stats --
    drawSectionHeader(g, lx, ly, GAME_WIDTH / 2 - 24, 0x4488ff);
    this.txt(`${this.gameScene.currentClass.toUpperCase()}  Lv.${player.level}`, lx + 4, ly + 3, {
      fontSize: '13px', color: '#ffffff', fontStyle: 'bold',
    });
    ly += 26;

    // XP bar
    this.txt('XP', lx + 4, ly, { fontSize: '10px', color: '#aa8833', fontFamily: MONO });
    drawStatBar(g, lx + 24, ly + 1, 120, 8, player.xp / player.xpToNext, 0xffcc44);
    this.txt(`${player.xp}/${player.xpToNext}`, lx + 150, ly, { fontSize: '10px', color: '#887744', fontFamily: MONO });
    ly += 16;

    // HP bar
    this.txt('HP', lx + 4, ly, { fontSize: '10px', color: '#44ff44', fontFamily: MONO });
    drawStatBar(g, lx + 24, ly + 1, 120, 8, player.hp / player.maxHp, 0x44ff44);
    this.txt(`${player.hp}/${player.maxHp}`, lx + 150, ly, { fontSize: '10px', color: '#44aa44', fontFamily: MONO });
    ly += 16;

    // Energy bar
    this.txt('EN', lx + 4, ly, { fontSize: '10px', color: '#4488ff', fontFamily: MONO });
    drawStatBar(g, lx + 24, ly + 1, 120, 8, player.energy / player.maxEnergy, 0x4488ff);
    this.txt(`${player.energy}/${player.maxEnergy}`, lx + 150, ly, { fontSize: '10px', color: '#4488aa', fontFamily: MONO });
    ly += 22;

    // Stats
    drawDivider(g, lx, ly, GAME_WIDTH / 2 - 24);
    ly += 6;

    if (inv.stats.unspent > 0) {
      this.txt(`${inv.stats.unspent} point${inv.stats.unspent > 1 ? 's' : ''} to allocate`, lx + 4, ly, {
        fontSize: '11px', color: '#ffcc44', fontStyle: 'bold',
      });
      ly += 16;
    }

    const statNames = ['might', 'precision', 'arcana', 'vitality'] as const;
    const statColors = [0xff8844, 0x44ff88, 0x8844ff, 0xff4488];
    const statHex = ['#ff8844', '#44ff88', '#8844ff', '#ff4488'];
    const statDescs = ['Melee dmg, HP', 'Ranged dmg, crit', 'Power dmg, energy', 'Max HP, defense'];

    for (let i = 0; i < statNames.length; i++) {
      const name = statNames[i];
      const base = inv.stats[name];
      const bonus = inv.getEquipBonuses()[name] ?? 0;
      const isSel = this.selectedIndex === i;

      // Selection highlight
      if (isSel) {
        g.fillStyle(statColors[i], 0.1);
        g.fillRect(lx, ly - 1, GAME_WIDTH / 2 - 24, 18);
      }

      const arrow = isSel ? '▸ ' : '  ';
      const bonusTxt = bonus > 0 ? ` (+${bonus})` : '';
      this.txt(`${arrow}${name.toUpperCase()}`, lx + 4, ly + 1, {
        fontSize: '12px', color: isSel ? '#ffffff' : statHex[i],
        fontFamily: MONO, fontStyle: isSel ? 'bold' : 'normal',
      });
      this.txt(`${base}${bonusTxt}`, lx + 110, ly + 1, {
        fontSize: '12px', color: isSel ? '#ffffff' : statHex[i], fontFamily: MONO,
      });
      this.txt(statDescs[i], lx + 150, ly + 2, {
        fontSize: '9px', color: '#556677', fontFamily: MONO,
      });
      ly += 20;
    }

    // -- Right column: Equipment --
    drawSectionHeader(g, rx, ry, GAME_WIDTH / 2 - 24, 0x00ffcc);
    this.txt('EQUIPPED', rx + 4, ry + 3, { fontSize: '13px', color: '#00ffcc', fontStyle: 'bold' });
    ry += 26;

    const slots: EquipSlot[] = ['weapon', 'armor', 'accessory1', 'accessory2'];
    const slotLabels = ['Weapon', 'Armor', 'Acc. 1', 'Acc. 2'];
    const slotSize = 22;

    for (let i = 0; i < slots.length; i++) {
      const item = inv.equipped[slots[i]];
      const rColor = item ? (RARITY_INT[item.rarity] ?? 0xaaaaaa) : 0x333344;

      // Item slot icon
      drawItemSlot(g, rx + 4, ry, slotSize, rColor, !!item);

      // Slot label and item name
      this.txt(slotLabels[i], rx + slotSize + 10, ry, { fontSize: '10px', color: '#667788', fontFamily: MONO });
      if (item) {
        const c = '#' + RARITY_COLORS[item.rarity].toString(16).padStart(6, '0');
        this.txt(item.name, rx + slotSize + 10, ry + 12, { fontSize: '11px', color: c, fontStyle: 'bold' });
      } else {
        this.txt('(empty)', rx + slotSize + 10, ry + 12, { fontSize: '11px', color: '#333344' });
      }
      ry += slotSize + 6;
    }

    // Boss Powers
    ry += 4;
    drawDivider(g, rx, ry, GAME_WIDTH / 2 - 24);
    ry += 8;
    this.txt('BOSS POWERS', rx + 4, ry, { fontSize: '11px', color: '#00ffcc', fontStyle: 'bold' });
    ry += 18;

    for (let s = 0; s < 2; s++) {
      const power = inv.getSlotPower(s as 0 | 1);
      const isActive = inv.activePowerSlot === s;
      const prefix = isActive ? '[C]' : '   ';
      this.txt(`${prefix} Slot ${s + 1}:`, rx + 4, ry, {
        fontSize: '11px', color: isActive ? '#ffffff' : '#667788', fontFamily: MONO,
      });
      if (power) {
        const c = '#' + power.color.toString(16).padStart(6, '0');
        this.txt(power.name, rx + 80, ry, { fontSize: '11px', color: c, fontStyle: 'bold' });
      } else {
        this.txt('(empty)', rx + 80, ry, { fontSize: '11px', color: '#333344' });
      }
      ry += 16;
    }
  }

  private renderBackpack(inv: InventorySystem) {
    const g = this.contentGfx;
    const x = 20;
    let y = 62;

    drawSectionHeader(g, x, y, GAME_WIDTH - 40, 0x00ffcc);
    this.txt(`BACKPACK  ${inv.backpack.length}/${inv.MAX_BACKPACK}`, x + 4, y + 3, {
      fontSize: '13px', color: '#00ffcc', fontStyle: 'bold',
    });
    y += 26;

    if (inv.backpack.length === 0) {
      this.txt('No items yet — defeat enemies to find loot!', x + 4, y, { fontSize: '12px', color: '#445566' });
      return;
    }

    this.selectedIndex = Math.min(this.selectedIndex, inv.backpack.length - 1);

    const maxVisible = 8;
    const startIdx = Math.max(0, this.selectedIndex - Math.floor(maxVisible / 2));
    const endIdx = Math.min(inv.backpack.length, startIdx + maxVisible);

    // Scroll indicator
    if (startIdx > 0) {
      this.txt('▲ more', x + 4, y - 2, { fontSize: '9px', color: '#445566', fontFamily: MONO });
    }

    for (let i = startIdx; i < endIdx; i++) {
      const item = inv.backpack[i];
      const isSel = this.selectedIndex === i;
      const rColor = RARITY_INT[item.rarity] ?? 0xaaaaaa;
      const cHex = '#' + RARITY_COLORS[item.rarity].toString(16).padStart(6, '0');

      // Selection highlight
      if (isSel) {
        g.fillStyle(rColor, 0.08);
        g.fillRect(x, y - 1, GAME_WIDTH - 40, isSel ? 52 : 22);
      }

      // Item icon
      drawItemSlot(g, x + 4, y, 18, rColor, true);

      // Item name and slot
      this.txt(item.name, x + 28, y, {
        fontSize: '12px', color: isSel ? '#ffffff' : cHex,
        fontStyle: isSel ? 'bold' : 'normal',
      });
      this.txt(`[${item.slot}]`, x + 28 + 200, y + 1, { fontSize: '10px', color: '#556677', fontFamily: MONO });

      if (isSel) {
        // Detail row
        this.txt(`${RARITY_NAMES[item.rarity]}  |  Base: +${item.baseStat}`, x + 28, y + 16, {
          fontSize: '11px', color: cHex,
        });
        if (item.description) {
          this.txt(item.description, x + 28, y + 30, { fontSize: '10px', color: '#889999' });
        }
        this.txt('Z: Equip   X: Discard', x + 28, y + (item.description ? 42 : 30), {
          fontSize: '10px', color: '#ffcc44', fontFamily: MONO, fontStyle: 'bold',
        });
        y += item.description ? 56 : 46;
      } else {
        y += 22;
      }
    }

    if (endIdx < inv.backpack.length) {
      this.txt('▼ more', x + 4, y + 2, { fontSize: '9px', color: '#445566', fontFamily: MONO });
    }

    if (!this._discardBound) {
      this._discardBound = true;
      this.input.keyboard!.on('keydown-X', () => {
        if (this.mode === 'backpack' && inv.backpack[this.selectedIndex]) {
          inv.discard(inv.backpack[this.selectedIndex].id);
          playSound('menuSelect');
          this.refresh();
        }
      });
    }
  }

  private renderSkills(inv: InventorySystem, player: any) {
    const g = this.contentGfx;
    const x = 20;
    let y = 62;

    const branchId = inv.activeBranch;
    if (!branchId || !SKILL_BRANCHES[branchId]) {
      this.txt('No skill branch selected', x, y, { fontSize: '12px', color: '#445566' });
      return;
    }

    const branch = SKILL_BRANCHES[branchId];

    drawSectionHeader(g, x, y, GAME_WIDTH - 40, 0x8844ff);
    this.txt(branch.name.toUpperCase(), x + 4, y + 3, { fontSize: '13px', color: '#aa66ff', fontStyle: 'bold' });
    this.txt(branch.description, x + 140, y + 4, { fontSize: '10px', color: '#667788' });
    y += 26;

    // Skill points
    const spColor = inv.skillPoints > 0 ? '#ffcc44' : '#445566';
    this.txt(`Skill Points: ${inv.skillPoints}`, x + 4, y, { fontSize: '12px', color: spColor, fontFamily: MONO });
    y += 20;

    drawDivider(g, x, y, GAME_WIDTH - 40);
    y += 8;

    const skills = branch.skills;
    this.selectedIndex = Math.min(this.selectedIndex, skills.length - 1);

    for (let i = 0; i < skills.length; i++) {
      const skill = skills[i];
      const isUnlocked = inv.hasSkill(skill.id);
      const prereqMet = !skill.prerequisite || inv.hasSkill(skill.prerequisite);
      const levelMet = player.level >= skill.levelReq;
      const canAfford = inv.skillPoints >= skill.cost;
      const canUnlock = !isUnlocked && prereqMet && levelMet && canAfford;
      const isSel = this.selectedIndex === i;

      // Determine color and status
      let nodeColor = 0x333344;
      let textColor = '#444455';
      let status = '';
      if (isUnlocked) {
        nodeColor = 0x44ff44;
        textColor = '#44ff44';
        status = ' ✓';
      } else if (canUnlock) {
        nodeColor = 0xffffff;
        textColor = '#ffffff';
        status = ` [${skill.cost}pt]`;
      } else if (!prereqMet) {
        status = ' 🔒';
      } else if (!levelMet) {
        status = ` [Lv${skill.levelReq}]`;
      } else {
        status = ` [${skill.cost}pt]`;
      }

      // Selection highlight
      if (isSel) {
        g.fillStyle(nodeColor, 0.1);
        g.fillRect(x, y - 2, GAME_WIDTH - 40, isSel ? 38 : 20);
      }

      // Skill node indicator
      g.fillStyle(nodeColor, isUnlocked ? 0.9 : 0.4);
      g.fillCircle(x + 10, y + 6, 5);
      if (isUnlocked) {
        g.lineStyle(1, 0xffffff, 0.5);
        g.strokeCircle(x + 10, y + 6, 5);
      }

      // Connect to next skill
      if (i < skills.length - 1) {
        const nextUnlocked = inv.hasSkill(skills[i + 1].id);
        g.lineStyle(1, isUnlocked && nextUnlocked ? 0x44ff44 : 0x333344, 0.4);
        g.lineBetween(x + 10, y + 12, x + 10, y + 20);
      }

      this.txt(`${isSel ? '▸ ' : '  '}${skill.name}${status}`, x + 20, y, {
        fontSize: '12px', color: isSel ? (isUnlocked ? '#88ff88' : '#ffffff') : textColor,
        fontFamily: MONO, fontStyle: isSel ? 'bold' : 'normal',
      });

      if (isSel) {
        this.txt(skill.description, x + 22, y + 16, { fontSize: '10px', color: '#889999' });
        if (canUnlock) {
          this.txt('Z: Unlock', x + 22, y + 28, { fontSize: '10px', color: '#ffcc44', fontFamily: MONO, fontStyle: 'bold' });
        }
        y += 40;
      } else {
        y += 22;
      }
    }
  }

  private handleAction() {
    const inv = this.gameScene.getInventory();
    const player = this.gameScene.player;

    if (this.mode === 'stats') {
      const statNames = ['might', 'precision', 'arcana', 'vitality'] as const;
      if (this.selectedIndex < statNames.length && inv.stats.unspent > 0) {
        inv.allocateStat(statNames[this.selectedIndex]);
        playSound('menuConfirm');
        this.refresh();
      }
    } else if (this.mode === 'backpack') {
      const item = inv.backpack[this.selectedIndex];
      if (item) {
        inv.equip(item);
        playSound('menuConfirm');
        // Clamp index after backpack changes
        this.selectedIndex = Math.min(this.selectedIndex, Math.max(0, inv.backpack.length - 1));
        this.refresh();
      }
    } else if (this.mode === 'skills') {
      const branchId = inv.activeBranch;
      if (branchId && SKILL_BRANCHES[branchId]) {
        const skill = SKILL_BRANCHES[branchId].skills[this.selectedIndex];
        if (skill) {
          const ok = inv.unlockSkill(skill.id, player.level);
          if (ok) playSound('levelUp');
          this.refresh();
        }
      }
    }
  }

  private closeInventory() {
    this.input.keyboard!.removeAllListeners();
    this.scene.stop('InventoryScene');
    this.gameScene.scene.resume('GameScene');
  }

  /** Helper to create text and track for cleanup */
  private txt(text: string, x: number, y: number, opts: Partial<Phaser.Types.GameObjects.Text.TextStyle> = {}): Phaser.GameObjects.Text {
    const obj = this.add.text(x, y, text, {
      fontSize: '12px', fontFamily: FONT, color: '#cccccc',
      stroke: '#000000', strokeThickness: 1,
      ...opts,
    });
    this.texts.push(obj);
    return obj;
  }
}
