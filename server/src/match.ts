// Durable Object: one per active match
// Holds authoritative game state, relays actions via WebSocket
// Flow: waiting → confirming (15s timeout) → countdown (3,2,1) → playing → ended

import { DurableObject } from 'cloudflare:workers';
import type { Owner } from '../../shared/types';
import { createInitialState, gameReducer, type GameState, type Action } from '../../shared/game/engine';
import { getGravityMs } from '../../shared/game/engine';
import type { ClientGameState, ServerMessage } from './protocol';

const CONFIRM_TIMEOUT_MS = 15_000;

interface PlayerConn {
  ws: WebSocket;
  userId: string;
  displayName: string;
  elo: number;
}

type MatchPhase = 'waiting' | 'confirming' | 'countdown' | 'playing' | 'ended';

export class Match extends DurableObject {
  private players: Map<Owner, PlayerConn> = new Map();
  private state: GameState | null = null;
  private matchPhase: MatchPhase = 'waiting';
  private confirmed: Set<Owner> = new Set();
  private countdownValue: number = 3;
  private matchId: string = '';
  private gameStartedAt: number = 0;
  private rematchRequests: Set<Owner> = new Set();
  private forfeit: Owner | null = null;

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname !== '/ws') {
      return new Response('Not found', { status: 404 });
    }

    const upgradeHeader = request.headers.get('Upgrade');
    if (upgradeHeader !== 'websocket') {
      return new Response('Expected WebSocket', { status: 426 });
    }

    const { 0: client, 1: server } = new WebSocketPair();
    const userId = url.searchParams.get('userId') ?? '';
    const displayName = url.searchParams.get('displayName') ?? 'Player';
    const elo = parseInt(url.searchParams.get('elo') ?? '1200', 10);
    const playerNum = parseInt(url.searchParams.get('player') ?? '0', 10) as Owner;
    if (!this.matchId) this.matchId = url.searchParams.get('matchId') ?? '';

    if (playerNum !== 1 && playerNum !== 2) {
      return new Response('Invalid player number', { status: 400 });
    }

    this.ctx.acceptWebSocket(server);

    this.players.set(playerNum, { ws: server, userId, displayName, elo });

    // When both players connected, enter confirmation phase
    if (this.players.size === 2) {
      this.startConfirmPhase();
    }

    return new Response(null, { status: 101, webSocket: client });
  }

  private startConfirmPhase() {
    this.matchPhase = 'confirming';
    this.confirmed.clear();

    const p1 = this.players.get(1 as Owner)!;
    const p2 = this.players.get(2 as Owner)!;

    // Tell each player about the confirmation phase
    this.send(p1.ws, {
      type: 'CONFIRM_PHASE',
      p1Name: p1.displayName,
      p2Name: p2.displayName,
      myPlayer: 1 as Owner,
      timeoutMs: CONFIRM_TIMEOUT_MS,
    });
    this.send(p2.ws, {
      type: 'CONFIRM_PHASE',
      p1Name: p1.displayName,
      p2Name: p2.displayName,
      myPlayer: 2 as Owner,
      timeoutMs: CONFIRM_TIMEOUT_MS,
    });

    // Set timeout alarm
    this.ctx.storage.put('alarmType', 'confirm-timeout');
    this.ctx.storage.setAlarm(Date.now() + CONFIRM_TIMEOUT_MS);
  }

  private handleConfirm(player: Owner) {
    if (this.matchPhase !== 'confirming') return;

    this.confirmed.add(player);

    // Broadcast that this player confirmed
    for (const [, conn] of this.players) {
      this.send(conn.ws, { type: 'PLAYER_CONFIRMED', player });
    }

    // If both confirmed, start countdown
    if (this.confirmed.size === 2) {
      this.startCountdown();
    }
  }

  private startCountdown() {
    this.matchPhase = 'countdown';
    this.countdownValue = 3;

    const p1 = this.players.get(1 as Owner)!;
    const p2 = this.players.get(2 as Owner)!;

    // Send BOTH_CONFIRMED to each player
    this.send(p1.ws, {
      type: 'BOTH_CONFIRMED',
      myPlayer: 1 as Owner,
      p1Name: p1.displayName,
      p2Name: p2.displayName,
    });
    this.send(p2.ws, {
      type: 'BOTH_CONFIRMED',
      myPlayer: 2 as Owner,
      p1Name: p1.displayName,
      p2Name: p2.displayName,
    });

    // Start countdown: first tick after 1 second
    this.ctx.storage.put('alarmType', 'countdown');
    this.ctx.storage.setAlarm(Date.now() + 1000);
  }

  private startGame() {
    this.matchPhase = 'playing';
    this.state = createInitialState();
    this.gameStartedAt = Date.now();
    this.rematchRequests.clear();
    this.forfeit = null;
    this.broadcastState();
    this.scheduleGravity();
  }

  private toClientState(forPlayer: Owner): ClientGameState {
    const s = this.state!;
    const myNext = forPlayer === 1 ? s.p1Next : s.p2Next;
    const opponentNext = forPlayer === 1
      ? (s.p2HasPlaced ? s.p2Next : null)
      : s.p1Next;

    return {
      board: s.board,
      active: s.active,
      piece: s.piece,
      scores: s.scores,
      phase: s.phase,
      toppedOut: s.toppedOut,
      winner: s.winner,
      myNext,
      opponentNext,
      lastClear: s.lastClear,
      clearedRows: s.clearedRows,
      stats: s.stats,
    };
  }

  private broadcastState() {
    if (!this.state) return;
    for (const [playerNum, conn] of this.players) {
      this.send(conn.ws, {
        type: 'GAME_STATE',
        state: this.toClientState(playerNum),
      });
    }
  }

  private send(ws: WebSocket, msg: ServerMessage) {
    try {
      ws.send(JSON.stringify(msg));
    } catch {
      // Connection may be closed
    }
  }

  private sendToPlayer(player: Owner, msg: ServerMessage) {
    const conn = this.players.get(player);
    if (conn) this.send(conn.ws, msg);
  }

  private broadcastGameEnd(overrideWinner?: Owner | null) {
    if (!this.state) return;
    const p1 = this.players.get(1 as Owner);
    const p2 = this.players.get(2 as Owner);
    const durationMs = this.gameStartedAt ? Date.now() - this.gameStartedAt : 0;
    const msg: ServerMessage = {
      type: 'GAME_END',
      winner: overrideWinner !== undefined ? overrideWinner : this.state.winner,
      toppedOut: this.state.toppedOut,
      forfeit: this.forfeit,
      scores: this.state.scores,
      stats: this.state.stats,
      matchId: this.matchId,
      durationMs,
      p1Id: p1?.userId ?? '',
      p1Name: p1?.displayName ?? 'Player 1',
      p2Id: p2?.userId ?? '',
      p2Name: p2?.displayName ?? 'Player 2',
      p1Elo: p1?.elo ?? 1200,
      p2Elo: p2?.elo ?? 1200,
    };
    for (const [, conn] of this.players) {
      this.send(conn.ws, msg);
    }
  }

  private scheduleGravity(extraDelayMs = 0) {
    if (!this.state || this.state.phase === 'ended') return;
    const activeScore = this.state.scores[this.state.active - 1];
    const ms = getGravityMs(activeScore);
    this.ctx.storage.put('alarmType', 'gravity');
    this.ctx.storage.setAlarm(Date.now() + ms + extraDelayMs);
  }

  async alarm() {
    const alarmType = await this.ctx.storage.get('alarmType') as string | undefined;

    // Confirmation timeout
    if (alarmType === 'confirm-timeout') {
      if (this.matchPhase === 'confirming') {
        for (const [, conn] of this.players) {
          this.send(conn.ws, { type: 'CONFIRM_TIMEOUT' });
        }
        // Close connections after a short delay
        for (const [, conn] of this.players) {
          try { conn.ws.close(1000, 'Confirm timeout'); } catch {}
        }
        this.matchPhase = 'ended';
      }
      return;
    }

    // Countdown ticks
    if (alarmType === 'countdown') {
      if (this.matchPhase !== 'countdown') return;

      // Send current countdown value
      for (const [, conn] of this.players) {
        this.send(conn.ws, { type: 'COUNTDOWN', count: this.countdownValue });
      }

      this.countdownValue--;

      if (this.countdownValue > 0) {
        // Next tick
        this.ctx.storage.put('alarmType', 'countdown');
        this.ctx.storage.setAlarm(Date.now() + 1000);
      } else {
        // Countdown finished, start game after a brief pause
        this.ctx.storage.put('alarmType', 'countdown-done');
        this.ctx.storage.setAlarm(Date.now() + 1000);
      }
      return;
    }

    // Countdown done → start game
    if (alarmType === 'countdown-done') {
      this.startGame();
      return;
    }

    // Gravity alarm (playing phase)
    if (alarmType === 'gravity') {
      if (!this.state || this.state.phase === 'ended') return;
      this.state = gameReducer(this.state, { type: 'GRAVITY' });

      if (this.state.isGrounded) {
        // Piece can't fall further — schedule lock (not more gravity)
        this.ctx.storage.put('alarmType', 'lock');
        this.ctx.storage.setAlarm(Date.now() + 500);
        this.broadcastState();
        return;
      }

      this.broadcastState();
      this.scheduleGravity();
    }

    // Lock alarm — piece was grounded, now lock it in place
    if (alarmType === 'lock') {
      if (!this.state || this.state.phase === 'ended') return;

      // If piece was moved off the ground (move/rotate), resume gravity instead
      if (!this.state.isGrounded) {
        this.scheduleGravity();
        return;
      }

      const prevActive = this.state.active;
      this.state = gameReducer(this.state, { type: 'LOCK' });
      this.broadcastState();

      if (this.state.phase === 'ended') {
        this.matchPhase = 'ended';
        this.broadcastGameEnd();
        return;
      }

      // Delay gravity: 1.5s for line clears (animation), 2s for equalizer (warning)
      const delay = this.state.phase === 'equalizer' ? 2000
        : this.state.clearedRows.length > 0 ? 1500 : 0;
      this.scheduleGravity(delay);
    }
  }

  webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    const data = JSON.parse(message as string);

    // Handle confirmation
    if (data.type === 'CONFIRM') {
      let sender: Owner | null = null;
      for (const [playerNum, conn] of this.players) {
        if (conn.ws === ws) { sender = playerNum; break; }
      }
      if (sender) this.handleConfirm(sender);
      return;
    }

    // Handle rematch request
    if (data.type === 'REMATCH_REQUEST') {
      if (this.matchPhase !== 'ended') return;
      let sender: Owner | null = null;
      for (const [playerNum, conn] of this.players) {
        if (conn.ws === ws) { sender = playerNum; break; }
      }
      if (!sender) return;

      this.rematchRequests.add(sender);
      this.send(ws, { type: 'REMATCH_WAITING' });

      // Both players want rematch → restart confirmation phase
      if (this.rematchRequests.size === 2) {
        this.rematchRequests.clear();
        this.startConfirmPhase();
      }
      return;
    }

    // Handle quit (forfeit)
    if (data.type === 'QUIT') {
      if (!this.state || this.matchPhase !== 'playing') return;
      let sender: Owner | null = null;
      for (const [playerNum, conn] of this.players) {
        if (conn.ws === ws) { sender = playerNum; break; }
      }
      if (!sender) return;

      this.forfeit = sender;
      const winner: Owner = sender === 1 ? 2 : 1;
      this.matchPhase = 'ended';
      this.broadcastGameEnd(winner);
      return;
    }

    if (data.type === 'ACTION') {
      if (!this.state || this.matchPhase !== 'playing') return;

      let sender: Owner | null = null;
      for (const [playerNum, conn] of this.players) {
        if (conn.ws === ws) { sender = playerNum; break; }
      }
      if (!sender) return;

      if (sender !== this.state.active) {
        this.send(ws, { type: 'ERROR', message: 'Not your turn' });
        return;
      }

      const action = data.action as Action;
      const validTypes = ['MOVE', 'ROTATE', 'SOFT_DROP', 'HARD_DROP'];
      if (!validTypes.includes(action.type)) return;

      const prevActive = this.state.active;
      this.state = gameReducer(this.state, action);
      this.broadcastState();

      if (this.state.phase === 'ended') {
        this.matchPhase = 'ended';
        this.broadcastGameEnd();
        return;
      }

      if (this.state.active !== prevActive || action.type === 'HARD_DROP') {
        // Turn changed (hard drop locked the piece), schedule gravity for next player
        // Delay for line clear animation or equalizer warning
        const delay = this.state.phase === 'equalizer' ? 2000
          : this.state.clearedRows.length > 0 ? 1500 : 0;
        this.scheduleGravity(delay);
      } else if (this.state.isGrounded) {
        // Piece is grounded after move/rotate/soft_drop — schedule lock
        this.ctx.storage.put('alarmType', 'lock');
        this.ctx.storage.setAlarm(Date.now() + 500);
      } else {
        // Piece moved but not grounded — reschedule gravity
        this.scheduleGravity();
      }
    }
  }

  webSocketClose(ws: WebSocket) {
    let disconnected: Owner | null = null;
    for (const [playerNum, conn] of this.players) {
      if (conn.ws === ws) {
        disconnected = playerNum;
        this.players.delete(playerNum);
        break;
      }
    }

    if (disconnected) {
      const other: Owner = disconnected === 1 ? 2 : 1;
      this.sendToPlayer(other, { type: 'OPPONENT_DISCONNECTED' });
    }
  }

  webSocketError(ws: WebSocket) {
    this.webSocketClose(ws);
  }
}
