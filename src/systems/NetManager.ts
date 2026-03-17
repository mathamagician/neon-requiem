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
  facingRight: boolean;
}

export type NetMode = 'offline' | 'host' | 'client';

type NetMessage =
  | { type: 'join'; playerId: string }
  | { type: 'state'; state: NetPlayerState }
  | { type: 'leave'; playerId: string }
  | { type: 'event'; event: string; data?: unknown; playerId: string }
  | { type: 'start'; zoneId: string; selectedClass: string };

class NetManagerClass {
  mode: NetMode = 'offline';
  playerId = '';
  peers: Map<string, NetPlayerState> = new Map();
  private channel: BroadcastChannel | null = null;
  private onStateCallback: ((state: NetPlayerState) => void) | null = null;
  private onStartCallback: ((data: { zoneId: string; selectedClass: string }) => void) | null = null;
  private onPeerJoinCallback: ((peerId: string) => void) | null = null;
  private onPeerLeaveCallback: ((peerId: string) => void) | null = null;
  private roomCode = '';

  /** Generate a random 4-char room code */
  generateRoomCode(): string {
    return Math.random().toString(36).substring(2, 6).toUpperCase();
  }

  /** Host a room using BroadcastChannel (local testing) */
  hostLocal(roomCode: string) {
    this.mode = 'host';
    this.roomCode = roomCode;
    this.playerId = 'host-' + Math.random().toString(36).substring(2, 6);
    this.channel = new BroadcastChannel(`neon-requiem-${roomCode}`);
    this.channel.onmessage = (e) => this.handleMessage(e.data);
    // Announce presence
    this.send({ type: 'join', playerId: this.playerId });
  }

  /** Join a room using BroadcastChannel (local testing) */
  joinLocal(roomCode: string) {
    this.mode = 'client';
    this.roomCode = roomCode;
    this.playerId = 'peer-' + Math.random().toString(36).substring(2, 6);
    this.channel = new BroadcastChannel(`neon-requiem-${roomCode}`);
    this.channel.onmessage = (e) => this.handleMessage(e.data);
    this.send({ type: 'join', playerId: this.playerId });
  }

  /** Send local player state to all peers */
  sendState(state: NetPlayerState) {
    this.send({ type: 'state', state });
  }

  /** Send a game event (boss damage, zone transition, etc.) */
  sendEvent(event: string, data?: unknown) {
    this.send({ type: 'event', event, data, playerId: this.playerId });
  }

  /** Host sends start signal to all clients */
  sendStart(zoneId: string, selectedClass: string) {
    this.send({ type: 'start', zoneId, selectedClass });
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

  /** Disconnect and clean up */
  disconnect() {
    this.send({ type: 'leave', playerId: this.playerId });
    this.channel?.close();
    this.channel = null;
    this.peers.clear();
    this.mode = 'offline';
    this.playerId = '';
    this.roomCode = '';
    this.onStateCallback = null;
    this.onStartCallback = null;
    this.onPeerJoinCallback = null;
    this.onPeerLeaveCallback = null;
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
              className: 'vanguard',
              isAttacking: false, isDashing: false, facingRight: true,
            });
            this.onPeerJoinCallback?.(data.playerId);
          }
          // Always respond so the new peer knows about us
          this.send({ type: 'join', playerId: this.playerId });
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
          this.onPeerLeaveCallback?.(data.playerId);
        }
        break;

      case 'start':
        this.onStartCallback?.(data);
        break;
    }
  }
}

export const NetManager = new NetManagerClass();
