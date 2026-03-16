/**
 * UIHelper — Reusable panel/frame drawing for inventory, shop, and skill screens.
 * Built on Phaser Graphics — no external UI library needed.
 */
import Phaser from 'phaser';

const PANEL_BG = 0x0c0c1e;
const PANEL_BORDER = 0x00ffcc;
const PANEL_ACCENT = 0x1a1a3a;
const HEADER_BG = 0x111130;
const DIVIDER = 0x222244;
const TAB_ACTIVE = 0x00ffcc;
const TAB_INACTIVE = 0x444466;

/** Draw a rounded panel background */
export function drawPanel(
  gfx: Phaser.GameObjects.Graphics,
  x: number, y: number, w: number, h: number,
  opts: { borderColor?: number; bgColor?: number; borderAlpha?: number; bgAlpha?: number } = {}
) {
  const bg = opts.bgColor ?? PANEL_BG;
  const border = opts.borderColor ?? PANEL_BORDER;
  const bgA = opts.bgAlpha ?? 0.95;
  const borderA = opts.borderAlpha ?? 0.5;

  // Background fill
  gfx.fillStyle(bg, bgA);
  gfx.fillRoundedRect(x, y, w, h, 6);

  // Inner accent border
  gfx.lineStyle(1, border, borderA);
  gfx.strokeRoundedRect(x + 1, y + 1, w - 2, h - 2, 5);
}

/** Draw a horizontal divider line */
export function drawDivider(gfx: Phaser.GameObjects.Graphics, x: number, y: number, w: number) {
  gfx.lineStyle(1, DIVIDER, 0.6);
  gfx.lineBetween(x, y, x + w, y);
}

/** Draw tab buttons with active indicator */
export function drawTabs(
  gfx: Phaser.GameObjects.Graphics,
  tabs: string[],
  activeIndex: number,
  x: number, y: number, tabWidth: number, tabHeight: number
) {
  for (let i = 0; i < tabs.length; i++) {
    const tx = x + i * tabWidth;
    const isActive = i === activeIndex;

    // Tab background
    gfx.fillStyle(isActive ? 0x1a1a40 : 0x0e0e20, isActive ? 0.9 : 0.5);
    gfx.fillRect(tx, y, tabWidth - 2, tabHeight);

    // Active indicator bar
    if (isActive) {
      gfx.fillStyle(TAB_ACTIVE, 0.9);
      gfx.fillRect(tx, y + tabHeight - 2, tabWidth - 2, 2);
    }
  }
}

/** Draw an item slot box with rarity border */
export function drawItemSlot(
  gfx: Phaser.GameObjects.Graphics,
  x: number, y: number, size: number,
  rarityColor: number, filled: boolean
) {
  // Slot background
  gfx.fillStyle(filled ? 0x1a1a30 : 0x0a0a18, 0.9);
  gfx.fillRect(x, y, size, size);

  // Rarity border
  gfx.lineStyle(filled ? 2 : 1, filled ? rarityColor : 0x333344, filled ? 0.8 : 0.3);
  gfx.strokeRect(x, y, size, size);

  // Inner gem if filled
  if (filled) {
    const gemSize = Math.floor(size * 0.4);
    const gx = x + Math.floor((size - gemSize) / 2);
    const gy = y + Math.floor((size - gemSize) / 2);
    gfx.fillStyle(rarityColor, 0.7);
    gfx.fillRect(gx, gy, gemSize, gemSize);
  }
}

/** Draw a stat bar (HP, XP, energy style) */
export function drawStatBar(
  gfx: Phaser.GameObjects.Graphics,
  x: number, y: number, w: number, h: number,
  ratio: number, fillColor: number, bgColor: number = 0x111122
) {
  // Background
  gfx.fillStyle(bgColor, 0.8);
  gfx.fillRect(x, y, w, h);

  // Fill
  const fillW = Math.max(0, Math.floor(w * Math.min(1, ratio)));
  if (fillW > 0) {
    gfx.fillStyle(fillColor, 0.9);
    gfx.fillRect(x, y, fillW, h);
  }

  // Border
  gfx.lineStyle(1, 0x333355, 0.6);
  gfx.strokeRect(x, y, w, h);
}

/** Draw a section header with accent line */
export function drawSectionHeader(
  gfx: Phaser.GameObjects.Graphics,
  x: number, y: number, w: number,
  accentColor: number = TAB_ACTIVE
) {
  gfx.fillStyle(HEADER_BG, 0.7);
  gfx.fillRect(x, y, w, 20);
  gfx.fillStyle(accentColor, 0.6);
  gfx.fillRect(x, y + 18, w, 2);
}

/** Rarity colors as hex integers */
export const RARITY_INT: Record<string, number> = {
  common: 0xaaaaaa,
  uncommon: 0x44cc44,
  rare: 0x4488ff,
  epic: 0xaa44ff,
  legendary: 0xffaa00,
};
