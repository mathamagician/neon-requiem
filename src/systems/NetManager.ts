/**
 * NetManager — Lightweight P2P networking for co-op.
 * Sends/receives player state (position, animation, HP) each frame.
 * Uses BroadcastChannel for local testing, WebRTC for remote play.
 */

export interface NetPlayerState {
  id: string;
  x: number;
  y: number;
  velX: number;
  velY: number;
  flipX: boolean;
  hp: number;
  maxHp: number;
  className: string;
  isAttacking: boolean;
  isDashing: boolean;
  isUsingUltimate: boolean;
  isDowned: boolean;
  facingRight: boolean;
}

export type NetMode = 'offline' | 'host' | 'client';

/** Lobby-specific peer info tracked separately from in-game state */
export interface LobbyPeerInfo {
  playerId: string;
  className: string;
  ready: boolean;
}

type NetMessage =
  | { type: 'join'; playerId: string; className?: string }
  | { type: 'state'; state: NetPlayerState }
  | { type: 'leave'; playerId: string }
  | { type: 'event'; event: string; data?: unknown; playerId: string }
  | { type: 'start'; zoneId: string; selectedClass: string }
  | { type: 'lobby-ready'; playerId: string; ready: boolean; className: string }
  | { type: 'lobby-info-request'; playerId: string }
  | { type: 'lobby-info-response'; playerId: string; className: string; ready: boolean };

class NetManagerClass {
  mode: NetMode = 'offline';
  playerId = '';
  peers: Map<string, NetPlayerState> = new Map();
  lobbyPeers: Map<string, LobbyPeerInfo> = new Map();
  private channel: BroadcastChannel | null = null;
  private onStateCallback: ((state: NetPlayerState) => void) | null = null;
  private onStartCallback: ((data: { zoneId: string; selectedClass: string }) => void) | null = null;
  private onPeerJoinCallback: ((peerId: string) => void) | null = null;
  private onPeerLeaveCallback: ((peerId: string) => void) | null = null;
  private onEventCallback: ((event: string, data: unknown, playerId: string) => void) | null = null;
  private onLobbyUpdateCallback: (() => void) | null = null;
  private roomCode = '';
  private localClassName = 'vanguard';
  private localReady = false;

  /** Generate a random 4-char room code */
  generateRoomCode(): string {
    return Math.random().toString(36).substring(2, 6).toUpperCase();
  }

  /** Host a room using BroadcastChannel (local testing) */
  hostLocal(roomCode: string) {
    this.mode = 'host';
    this.roomCode = roomCode;
    this.playerId = 'host-' + Math.random().toString(36).substring(2, 6);
    this.localReady = false;
    this.lobbyPeers.clear();
    this.channel = new BroadcastChannel(`neon-requiem-${roomCode}`);
    this.channel.onmessage = (e) => this.handleMessage(e.data);
    // Announce presence
    this.send({ type: 'join', playerId: this.playerId, className: this.localClassName });
  }

  /** Join a room using BroadcastChannel (local testing) */
  joinLocal(roomCode: string) {
    this.mode = 'client';
    this.roomCode = roomCode;
    this.playerId = 'peer-' + Math.random().toString(36).substring(2, 6);
    this.localReady = false;
    this.lobbyPeers.clear();
    this.channel = new BroadcastChannel(`neon-requiem-${roomCode}`);
    this.channel.onmessage = (e) => this.handleMessage(e.data);
    this.send({ type: 'join', playerId: this.playerId, className: this.localClassName });
  }

  /** Send local player state to all peers */
  sendState(state: NetPlayerState) {
    this.send({ type: 'state', state });
  }

  /** Send a game event (boss damage, zone transition, revive, etc.) */
  sendEvent(event: string, data?: unknown) {
    this.send({ type: 'event', event, data, playerId: this.playerId });
  }

  /** Host sends start signal to all clients */
  sendStart(zoneId: string, selectedClass: string) {
    this.send({ type: 'start', zoneId, selectedClass });
  }

  /** Send lobby ready state */
  sendLobbyReady(ready: boolean, className: string) {
    this.localReady = ready;
    this.localClassName = className;
    this.send({ type: 'lobby-ready', playerId: this.playerId, ready, className });
  }

  /** Request lobby info from all peers (used when joining) */
  sendLobbyInfoRequest() {
    this.send({ type: 'lobby-info-request', playerId: this.playerId });
  }

  /** Set local class name (for lobby display) */
  setLocalClassName(className: string) {
    this.localClassName = className;
  }

  getLocalClassName(): string { return this.localClassName; }
  isLocalReady(): boolean { return this.localReady; }

  /** Check if all lobby peers are ready */
  allPeersReady(): boolean {
    if (this.lobbyPeers.size === 0) return false;
    for (const [, info] of this.lobbyPeers) {
      if (!info.ready) return false;
    }
    return true;
  }

  /** Register callback for receiving peer state updates */
  onPeerState(cb: (state: NetPlayerState) => void) {
    this.onStateCallback = cb;
  }

  /** Register callback for game start (clients) */
  onStart(cb: (data: { zoneId: string; selectedClass: string }) => void) {
    this.onStartCallback = cb;
  }

  /** Register callback for peer join */
  onPeerJoin(cb: (peerId: string) => void) {
    this.onPeerJoinCallback = cb;
  }

  /** Register callback for peer leave */
  onPeerLeave(cb: (peerId: string) => void) {
    this.onPeerLeaveCallback = cb;
  }

  /** Register callback for game events (revive, etc.) */
  onEvent(cb: (event: string, data: unknown, playerId: string) => void) {
    this.onEventCallback = cb;
  }

  /** Register callback for lobby state changes */
  onLobbyUpdate(cb: () => void) {
    this.onLobbyUpdateCallback = cb;
  }

  /** Disconnect and clean up */
  disconnect() {
    this.send({ type: 'leave', playerId: this.playerId });
    this.channel?.close();
    this.channel = null;
    this.peers.clear();
    this.lobbyPeers.clear();
    this.mode = 'offline';
    this.playerId = '';
    this.roomCode = '';
    this.localReady = false;
    this.onStateCallback = null;
    this.onStartCallback = null;
    this.onPeerJoinCallback = null;
    this.onPeerLeaveCallback = null;
    this.onEventCallback = null;
    this.onLobbyUpdateCallback = null;
  }

  isOnline(): boolean { return this.mode !== 'offline'; }
  getRoomCode(): string { return this.roomCode; }
  getPeerCount(): number { return this.peers.size; }

  private send(data: NetMessage) {
    if (this.channel) {
      this.channel.postMessage(data);
    }
  }

  private handleMessage(data: NetMessage) {
    if (!data || !data.type) return;
    switch (data.type) {
      case 'join':
        if (data.playerId !== this.playerId) {
          // Only add if not already tracked
          if (!this.peers.has(data.playerId)) {
            this.peers.set(data.playerId, {
              id: data.playerId,
              x: 0, y: 0, velX: 0, velY: 0,
              flipX: false, hp: 100, maxHp: 100,
              className: data.className ?? 'vanguard',
              isAttacking: false, isDashing: false, isUsingUltimate: false,
              isDowned: false, facingRight: true,
            });
            // Also add to lobby peers
            this.lobbyPeers.set(data.playerId, {
              playerId: data.playerId,
              className: data.className ?? 'vanguard',
              ready: false,
            });
            this.onPeerJoinCallback?.(data.playerId);
            this.onLobbyUpdateCallback?.();
          }
          // Always respond so the new peer knows about us
          this.send({ type: 'join', playerId: this.playerId, className: this.localClassName });
          // Also send our lobby state so new peer gets our ready status
          this.send({
            type: 'lobby-info-response',
            playerId: this.playerId,
            className: this.localClassName,
            ready: this.localReady,
          });
        }
        break;

      case 'state':
        if (data.state && data.state.id !== this.playerId) {
          this.peers.set(data.state.id, data.state);
          this.onStateCallback?.(data.state);
        }
        break;

      case 'leave':
        if (data.playerId !== this.playerId) {
          this.peers.delete(data.playerId);
          this.lobbyPeers.delete(data.playerId);
          this.onPeerLeaveCallback?.(data.playerId);
          this.onLobbyUpdateCallback?.();
        }
        break;

      case 'event':
        if (data.playerId !== this.playerId) {
          this.onEventCallback?.(data.event, data.data, data.playerId);
        }
        break;

      case 'start':
        this.onStartCallback?.(data);
        break;

      case 'lobby-ready':
        if (data.playerId !== this.playerId) {
          const existing = this.lobbyPeers.get(data.playerId);
          if (existing) {
            existing.ready = data.ready;
            existing.className = data.className;
          } else {
            this.lobbyPeers.set(data.playerId, {
              playerId: data.playerId,
              className: data.className,
              ready: data.ready,
            });
          }
          this.onLobbyUpdateCallback?.();
        }
        break;

      case 'lobby-info-request':
        if (data.playerId !== this.playerId) {
          // Respond with our current lobby state
          this.send({
            type: 'lobby-info-response',
            playerId: this.playerId,
            className: this.localClassName,
            ready: this.localReady,
          });
        }
        break;

      case 'lobby-info-response':
        if (data.playerId !== this.playerId) {
          const existing = this.lobbyPeers.get(data.playerId);
          if (existing) {
            existing.className = data.className;
            existing.ready = data.ready;
          } else {
            this.lobbyPeers.set(data.playerId, {
              playerId: data.playerId,
              className: data.className,
              ready: data.ready,
            });
          }
          this.onLobbyUpdateCallback?.();
        }
        break;
    }
  }
}

export const NetManager = new NetManagerClass();
