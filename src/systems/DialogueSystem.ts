import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../../shared/constants';

export interface DialogueLine {
  speaker: string;
  text: string;
  color?: string; // hex color for speaker name, e.g. '#ffcc44'
}

const BOX_WIDTH = Math.floor(GAME_WIDTH * 0.8);
const BOX_HEIGHT = 60;
const BOX_X = Math.floor((GAME_WIDTH - BOX_WIDTH) / 2);
const BOX_Y = GAME_HEIGHT - BOX_HEIGHT - 10;
const CHARS_PER_SEC = 30;
const TEXT_PADDING = 10;

export class DialogueSystem {
  private scene: Phaser.Scene;
  private active = false;
  private lines: DialogueLine[] = [];
  private lineIndex = 0;

  // Display objects
  private box: Phaser.GameObjects.Graphics | null = null;
  private speakerText: Phaser.GameObjects.Text | null = null;
  private bodyText: Phaser.GameObjects.Text | null = null;
  private advanceHint: Phaser.GameObjects.Text | null = null;

  // Typewriter state
  private fullText = '';
  private displayedChars = 0;
  private typewriterTimer = 0;
  private lineComplete = false;

  // Input
  private zKey: Phaser.Input.Keyboard.Key | null = null;
  private enterKey: Phaser.Input.Keyboard.Key | null = null;

  /** True while dialogue is showing — GameScene should check this to suppress movement */
  dialogueActive = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    if (scene.input.keyboard) {
      this.zKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
      this.enterKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    }
  }

  /** Start showing a dialogue sequence */
  show(lines: DialogueLine[]): void {
    if (this.active || lines.length === 0) return;

    this.lines = lines;
    this.lineIndex = 0;
    this.active = true;
    this.dialogueActive = true;

    // Create the dialogue box
    this.box = this.scene.add.graphics();
    this.box.setScrollFactor(0).setDepth(500);
    this.box.fillStyle(0x000000, 0.85);
    this.box.fillRoundedRect(BOX_X, BOX_Y, BOX_WIDTH, BOX_HEIGHT, 6);
    this.box.lineStyle(1, 0x00ffcc, 0.5);
    this.box.strokeRoundedRect(BOX_X, BOX_Y, BOX_WIDTH, BOX_HEIGHT, 6);

    this.speakerText = this.scene.add.text(BOX_X + TEXT_PADDING, BOX_Y + 6, '', {
      fontSize: '11px',
      fontFamily: 'Consolas, monospace',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 1,
    }).setScrollFactor(0).setDepth(501);

    this.bodyText = this.scene.add.text(BOX_X + TEXT_PADDING, BOX_Y + 22, '', {
      fontSize: '11px',
      fontFamily: 'Arial, sans-serif',
      color: '#cccccc',
      stroke: '#000000',
      strokeThickness: 1,
      wordWrap: { width: BOX_WIDTH - TEXT_PADDING * 2 },
    }).setScrollFactor(0).setDepth(501);

    this.advanceHint = this.scene.add.text(BOX_X + BOX_WIDTH - TEXT_PADDING, BOX_Y + BOX_HEIGHT - 14, '[Z / Enter]', {
      fontSize: '9px',
      fontFamily: 'Consolas, monospace',
      color: '#667788',
      stroke: '#000000',
      strokeThickness: 1,
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(501).setAlpha(0);

    this.showCurrentLine();
  }

  /** Returns true if a dialogue is currently open */
  isActive(): boolean {
    return this.active;
  }

  /** Call each frame from GameScene.update() */
  update(_time: number, delta: number): void {
    if (!this.active) return;

    // Typewriter effect
    if (!this.lineComplete) {
      this.typewriterTimer += delta / 1000;
      const charsToShow = Math.floor(this.typewriterTimer * CHARS_PER_SEC);
      if (charsToShow > this.displayedChars) {
        this.displayedChars = Math.min(charsToShow, this.fullText.length);
        this.bodyText?.setText(this.fullText.substring(0, this.displayedChars));
      }
      if (this.displayedChars >= this.fullText.length) {
        this.lineComplete = true;
        this.advanceHint?.setAlpha(1);
      }
    }

    // Input handling
    const justPressed =
      (this.zKey && Phaser.Input.Keyboard.JustDown(this.zKey)) ||
      (this.enterKey && Phaser.Input.Keyboard.JustDown(this.enterKey));

    if (justPressed) {
      if (!this.lineComplete) {
        // Skip typewriter — show full line immediately
        this.displayedChars = this.fullText.length;
        this.bodyText?.setText(this.fullText);
        this.lineComplete = true;
        this.advanceHint?.setAlpha(1);
      } else {
        // Advance to next line or close
        this.lineIndex++;
        if (this.lineIndex < this.lines.length) {
          this.showCurrentLine();
        } else {
          this.close();
        }
      }
    }
  }

  private showCurrentLine(): void {
    const line = this.lines[this.lineIndex];
    this.fullText = line.text;
    this.displayedChars = 0;
    this.typewriterTimer = 0;
    this.lineComplete = false;

    this.speakerText?.setText(line.speaker);
    this.speakerText?.setColor(line.color ?? '#ffffff');
    this.bodyText?.setText('');
    this.advanceHint?.setAlpha(0);
  }

  private close(): void {
    this.active = false;
    this.dialogueActive = false;

    this.box?.destroy();
    this.speakerText?.destroy();
    this.bodyText?.destroy();
    this.advanceHint?.destroy();

    this.box = null;
    this.speakerText = null;
    this.bodyText = null;
    this.advanceHint = null;
  }

  destroy(): void {
    this.close();
  }
}
