import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../../shared/constants';
import { NetManager } from '../systems/NetManager';
import { playSound } from '../systems/SoundManager';

const MONO = 'Consolas, "Courier New", monospace';
const FONT = 'Arial, Helvetica, sans-serif';

type LobbyState = 'menu' | 'hosting' | 'joining' | 'waiting';

export class LobbyScene extends Phaser.Scene {
  private lobbyState: LobbyState = 'menu';
  private selectedIndex = 0;
  private menuItems: Phaser.GameObjects.Text[] = [];
  private cursor!: Phaser.GameObjects.Text;

  // Hosting UI
  private roomCodeText: Phaser.GameObjects.Text | null = null;
  private peerCountText: Phaser.GameObjects.Text | null = null;
  private startButton: Phaser.GameObjects.Text | null = null;
  private statusText: Phaser.GameObjects.Text | null = null;

  // Player list UI
  private playerListTexts: Phaser.GameObjects.Text[] = [];

  // Ready button
  private readyButton: Phaser.GameObjects.Text | null = null;
  private isReady = false;

  // Joining UI
  private joinInput = '';
  private joinInputDisplay: Phaser.GameObjects.Text | null = null;
  private joinPrompt: Phaser.GameObjects.Text | null = null;

  // All dynamic objects for cleanup
  private dynamicObjects: Phaser.GameObjects.GameObject[] = [];

  constructor() {
    super({ key: 'LobbyScene' });
  }

  create() {
    this.lobbyState = 'menu';
    this.selectedIndex = 0;
    this.joinInput = '';
    this.dynamicObjects = [];
    this.playerListTexts = [];
    this.isReady = false;

    // Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x050510, 0x050510, 0x0a0a2e, 0x0a0a2e, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Neon grid lines
    const grid = this.add.graphics();
    grid.lineStyle(1, COLORS.neon, 0.08);
    for (let i = 0; i < 20; i++) {
      const x = GAME_WIDTH / 2 + (i - 10) * 30;
      grid.lineBetween(x, GAME_HEIGHT * 0.7, GAME_WIDTH / 2 + (i - 10) * 8, GAME_HEIGHT);
    }
    for (let i = 0; i < 4; i++) {
      const y = GAME_HEIGHT * 0.7 + i * 20;
      grid.lineBetween(0, y, GAME_WIDTH, y);
    }

    // Title
    this.add.text(GAME_WIDTH / 2, 60, 'MULTIPLAYER', {
      fontSize: '32px', fontFamily: MONO, color: '#00ffcc',
      fontStyle: 'bold', stroke: '#003333', strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 95, 'Co-op via BroadcastChannel (same browser)', {
      fontSize: '11px', fontFamily: FONT, color: '#556677',
      stroke: '#000000', strokeThickness: 1,
    }).setOrigin(0.5);

    // Menu
    this.buildMenu();

    // Controls hint
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 30, 'UP/DOWN: Select  |  Z/ENTER: Confirm  |  ESC: Back', {
      fontSize: '11px', fontFamily: MONO, color: '#555566',
      stroke: '#000000', strokeThickness: 1,
    }).setOrigin(0.5);

    // Input handlers
    this.input.keyboard!.on('keydown-UP', () => this.onUp());
    this.input.keyboard!.on('keydown-DOWN', () => this.onDown());
    this.input.keyboard!.on('keydown-Z', () => this.onConfirm());
    this.input.keyboard!.on('keydown-ENTER', () => this.onConfirm());
    this.input.keyboard!.on('keydown-ESC', () => this.onBack());
    this.input.keyboard!.on('keydown-BACKSPACE', () => this.onBackspace());
    this.input.keyboard!.on('keydown-R', () => this.onToggleReady());

    // Typing handler for join code
    this.input.keyboard!.on('keydown', (e: KeyboardEvent) => {
      if (this.lobbyState !== 'joining') return;
      if (e.key.length === 1 && /^[a-zA-Z0-9]$/.test(e.key) && this.joinInput.length < 4) {
        this.joinInput += e.key.toUpperCase();
        this.updateJoinDisplay();
        playSound('menuSelect');
      }
    });
  }

  private buildMenu() {
    this.menuItems = [];

    const menuY = 150;
    const spacing = 32;

    const hostItem = this.add.text(GAME_WIDTH / 2, menuY, 'HOST GAME', {
      fontSize: '16px', fontFamily: MONO, color: '#00ffcc',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5);
    this.menuItems.push(hostItem);

    const joinItem = this.add.text(GAME_WIDTH / 2, menuY + spacing, 'JOIN GAME', {
      fontSize: '16px', fontFamily: MONO, color: '#ffffff',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5);
    this.menuItems.push(joinItem);

    this.cursor = this.add.text(0, 0, '>', {
      fontSize: '16px', fontFamily: MONO, color: '#ffffff',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5);

    this.updateMenuHighlight();
  }

  private updateMenuHighlight() {
    if (this.lobbyState !== 'menu') return;
    for (let i = 0; i < this.menuItems.length; i++) {
      this.menuItems[i].setAlpha(i === this.selectedIndex ? 1 : 0.5);
    }
    const sel = this.menuItems[this.selectedIndex];
    if (sel) {
      this.cursor.setPosition(sel.x - 80, sel.y);
      this.cursor.setVisible(true);
    }
  }

  private onUp() {
    if (this.lobbyState === 'menu') {
      this.selectedIndex = (this.selectedIndex - 1 + this.menuItems.length) % this.menuItems.length;
      playSound('menuSelect');
      this.updateMenuHighlight();
    }
  }

  private onDown() {
    if (this.lobbyState === 'menu') {
      this.selectedIndex = (this.selectedIndex + 1) % this.menuItems.length;
      playSound('menuSelect');
      this.updateMenuHighlight();
    }
  }

  private onConfirm() {
    if (this.lobbyState === 'menu') {
      playSound('menuConfirm');
      if (this.selectedIndex === 0) {
        this.startHosting();
      } else {
        this.startJoining();
      }
    } else if (this.lobbyState === 'joining' && this.joinInput.length === 4) {
      this.connectToRoom();
    } else if (this.lobbyState === 'hosting') {
      // Start the game if host and all peers ready
      if (NetManager.mode === 'host' && NetManager.getPeerCount() > 0 && NetManager.allPeersReady() && this.isReady) {
        this.launchGame();
      }
    }
  }

  private onBack() {
    if (this.lobbyState === 'menu') {
      // Return to title
      this.scene.start('TitleScene');
    } else {
      // Go back to menu, disconnect if connected
      if (NetManager.isOnline()) {
        NetManager.disconnect();
      }
      this.clearDynamic();
      this.lobbyState = 'menu';
      this.isReady = false;
      this.cursor.setVisible(true);
      this.updateMenuHighlight();
    }
  }

  private onBackspace() {
    if (this.lobbyState === 'joining' && this.joinInput.length > 0) {
      this.joinInput = this.joinInput.slice(0, -1);
      this.updateJoinDisplay();
    }
  }

  private onToggleReady() {
    if (this.lobbyState !== 'hosting' && this.lobbyState !== 'waiting') return;
    if (!NetManager.isOnline()) return;

    this.isReady = !this.isReady;
    playSound('menuSelect');
    NetManager.sendLobbyReady(this.isReady, NetManager.getLocalClassName());
    this.updateReadyButton();
    this.updatePlayerList();
    this.updateStartButton();
  }

  // -- Hosting --

  private startHosting() {
    this.lobbyState = 'hosting';
    this.cursor.setVisible(false);
    this.clearDynamic();
    this.isReady = false;

    const code = NetManager.generateRoomCode();
    NetManager.hostLocal(code);

    // Listen for peer events to update display
    NetManager.onPeerJoin(() => {
      this.updateHostDisplay();
      this.updatePlayerList();
      this.updateStartButton();
    });
    NetManager.onPeerLeave(() => {
      this.updateHostDisplay();
      this.updatePlayerList();
      this.updateStartButton();
    });
    NetManager.onLobbyUpdate(() => {
      this.updatePlayerList();
      this.updateStartButton();
    });

    const labelY = 140;

    const label = this.add.text(GAME_WIDTH / 2, labelY, 'ROOM CODE:', {
      fontSize: '14px', fontFamily: MONO, color: '#888899',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5);
    this.dynamicObjects.push(label);

    this.roomCodeText = this.add.text(GAME_WIDTH / 2, labelY + 26, code, {
      fontSize: '36px', fontFamily: MONO, color: '#00ffcc',
      fontStyle: 'bold', stroke: '#003333', strokeThickness: 4,
    }).setOrigin(0.5);
    this.dynamicObjects.push(this.roomCodeText);

    // Pulsing glow on room code
    this.tweens.add({
      targets: this.roomCodeText,
      alpha: { from: 0.7, to: 1 },
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    this.peerCountText = this.add.text(GAME_WIDTH / 2, labelY + 58, 'Waiting for players...', {
      fontSize: '12px', fontFamily: MONO, color: '#667788',
      stroke: '#000000', strokeThickness: 1,
    }).setOrigin(0.5);
    this.dynamicObjects.push(this.peerCountText);

    this.statusText = this.add.text(GAME_WIDTH / 2, labelY + 76, 'Share this code — open another tab and JOIN', {
      fontSize: '11px', fontFamily: FONT, color: '#556677',
      stroke: '#000000', strokeThickness: 1,
    }).setOrigin(0.5);
    this.dynamicObjects.push(this.statusText);

    // Ready button
    this.readyButton = this.add.text(GAME_WIDTH / 2 - 70, GAME_HEIGHT - 80, '[R] READY', {
      fontSize: '14px', fontFamily: MONO, color: '#667788',
      stroke: '#000000', strokeThickness: 2,
      backgroundColor: '#111122',
      padding: { x: 8, y: 4 },
    }).setOrigin(0.5);
    this.dynamicObjects.push(this.readyButton);

    // Start button (host only)
    this.startButton = this.add.text(GAME_WIDTH / 2 + 70, GAME_HEIGHT - 80, 'START GAME', {
      fontSize: '14px', fontFamily: MONO, color: '#00ffcc',
      stroke: '#000000', strokeThickness: 2,
      backgroundColor: '#111122',
      padding: { x: 8, y: 4 },
    }).setOrigin(0.5).setAlpha(0.3);
    this.dynamicObjects.push(this.startButton);

    // Initial player list
    this.updatePlayerList();
  }

  private updateHostDisplay() {
    const count = NetManager.getPeerCount();
    const total = count + 1; // Include self
    if (this.peerCountText) {
      this.peerCountText.setText(`${total} player${total > 1 ? 's' : ''} connected`);
      this.peerCountText.setColor(count > 0 ? '#00ffcc' : '#667788');
    }
  }

  private updateReadyButton() {
    if (!this.readyButton) return;
    if (this.isReady) {
      this.readyButton.setText('[R] READY!');
      this.readyButton.setColor('#00ff88');
      this.readyButton.setBackgroundColor('#003322');
    } else {
      this.readyButton.setText('[R] READY');
      this.readyButton.setColor('#667788');
      this.readyButton.setBackgroundColor('#111122');
    }
  }

  private updateStartButton() {
    if (!this.startButton) return;
    const canStart = NetManager.getPeerCount() > 0 && NetManager.allPeersReady() && this.isReady;
    this.startButton.setAlpha(canStart ? 1 : 0.3);
  }

  private updatePlayerList() {
    // Clear existing player list
    for (const t of this.playerListTexts) t.destroy();
    this.playerListTexts = [];

    const listY = 228;
    const lineH = 18;
    let idx = 0;

    // Header
    const header = this.add.text(GAME_WIDTH / 2, listY, '— PLAYERS —', {
      fontSize: '10px', fontFamily: MONO, color: '#556677',
      stroke: '#000000', strokeThickness: 1,
    }).setOrigin(0.5);
    this.playerListTexts.push(header);
    this.dynamicObjects.push(header);
    idx++;

    // Local player (self)
    const selfReady = this.isReady ? ' [READY]' : '';
    const selfClass = NetManager.getLocalClassName().toUpperCase();
    const selfLabel = NetManager.mode === 'host' ? 'YOU (HOST)' : 'YOU';
    const selfText = this.add.text(GAME_WIDTH / 2, listY + lineH * idx, `${selfLabel} — ${selfClass}${selfReady}`, {
      fontSize: '11px', fontFamily: MONO,
      color: this.isReady ? '#00ff88' : '#cccccc',
      stroke: '#000000', strokeThickness: 1,
    }).setOrigin(0.5);
    this.playerListTexts.push(selfText);
    this.dynamicObjects.push(selfText);
    idx++;

    // Remote peers
    for (const [peerId, info] of NetManager.lobbyPeers) {
      const peerReady = info.ready ? ' [READY]' : '';
      const peerClass = info.className.toUpperCase();
      const shortId = peerId.substring(0, 8);
      const peerText = this.add.text(GAME_WIDTH / 2, listY + lineH * idx, `${shortId} — ${peerClass}${peerReady}`, {
        fontSize: '11px', fontFamily: MONO,
        color: info.ready ? '#00ff88' : '#888899',
        stroke: '#000000', strokeThickness: 1,
      }).setOrigin(0.5);
      this.playerListTexts.push(peerText);
      this.dynamicObjects.push(peerText);
      idx++;
    }
  }

  // -- Joining --

  private startJoining() {
    this.lobbyState = 'joining';
    this.joinInput = '';
    this.cursor.setVisible(false);
    this.clearDynamic();

    const labelY = 160;

    this.joinPrompt = this.add.text(GAME_WIDTH / 2, labelY, 'ENTER ROOM CODE:', {
      fontSize: '14px', fontFamily: MONO, color: '#888899',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5);
    this.dynamicObjects.push(this.joinPrompt);

    this.joinInputDisplay = this.add.text(GAME_WIDTH / 2, labelY + 35, '____', {
      fontSize: '36px', fontFamily: MONO, color: '#00ffcc',
      fontStyle: 'bold', stroke: '#003333', strokeThickness: 4,
    }).setOrigin(0.5);
    this.dynamicObjects.push(this.joinInputDisplay);

    // Blinking cursor effect
    this.tweens.add({
      targets: this.joinInputDisplay,
      alpha: { from: 0.6, to: 1 },
      duration: 500,
      yoyo: true,
      repeat: -1,
    });

    const hint = this.add.text(GAME_WIDTH / 2, labelY + 75, 'Type A-Z / 0-9 (4 chars) then press ENTER', {
      fontSize: '11px', fontFamily: FONT, color: '#556677',
      stroke: '#000000', strokeThickness: 1,
    }).setOrigin(0.5);
    this.dynamicObjects.push(hint);
  }

  private updateJoinDisplay() {
    if (!this.joinInputDisplay) return;
    const display = this.joinInput.padEnd(4, '_');
    // Add spacing between chars for readability
    this.joinInputDisplay.setText(display.split('').join(' '));
  }

  private connectToRoom() {
    NetManager.joinLocal(this.joinInput);
    this.lobbyState = 'waiting';
    this.isReady = false;

    // Listen for start signal
    NetManager.onStart((data) => {
      this.scene.start('GameScene', {
        selectedClass: data.selectedClass as 'vanguard' | 'gunner' | 'wraith',
        zoneId: data.zoneId,
      });
    });

    // Listen for lobby updates
    NetManager.onLobbyUpdate(() => {
      this.updatePlayerList();
    });

    NetManager.onPeerJoin(() => {
      this.updatePlayerList();
    });

    NetManager.onPeerLeave(() => {
      this.updatePlayerList();
    });

    // Request lobby info from existing peers
    NetManager.sendLobbyInfoRequest();

    // Update display
    this.clearDynamic();

    const labelY = 140;

    const connectedLabel = this.add.text(GAME_WIDTH / 2, labelY, `JOINED ROOM: ${this.joinInput}`, {
      fontSize: '14px', fontFamily: MONO, color: '#00ffcc',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5);
    this.dynamicObjects.push(connectedLabel);

    this.statusText = this.add.text(GAME_WIDTH / 2, labelY + 30, 'Waiting for host to start...', {
      fontSize: '12px', fontFamily: MONO, color: '#667788',
      stroke: '#000000', strokeThickness: 1,
    }).setOrigin(0.5);
    this.dynamicObjects.push(this.statusText);

    // Ready button
    this.readyButton = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 80, '[R] READY', {
      fontSize: '14px', fontFamily: MONO, color: '#667788',
      stroke: '#000000', strokeThickness: 2,
      backgroundColor: '#111122',
      padding: { x: 8, y: 4 },
    }).setOrigin(0.5);
    this.dynamicObjects.push(this.readyButton);

    // Pulsing dots animation
    let dots = 0;
    this.time.addEvent({
      delay: 500,
      loop: true,
      callback: () => {
        if (this.statusText && this.lobbyState === 'waiting') {
          dots = (dots + 1) % 4;
          this.statusText.setText('Waiting for host to start' + '.'.repeat(dots));
        }
      },
    });

    // Initial player list
    this.updatePlayerList();
  }

  // -- Game Launch --

  private launchGame() {
    playSound('menuConfirm');

    // Tell clients to start
    NetManager.sendStart('foundry', 'vanguard');

    // Small delay so the message gets sent before we transition
    this.time.delayedCall(100, () => {
      this.scene.start('GameScene', {
        selectedClass: 'vanguard' as const,
        zoneId: 'foundry',
      });
    });
  }

  // -- Helpers --

  private clearDynamic() {
    for (const obj of this.dynamicObjects) {
      obj.destroy();
    }
    this.dynamicObjects = [];
    this.playerListTexts = [];
    this.roomCodeText = null;
    this.peerCountText = null;
    this.startButton = null;
    this.statusText = null;
    this.joinInputDisplay = null;
    this.joinPrompt = null;
    this.readyButton = null;
  }
}
