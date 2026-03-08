// Durable Object: one per active match
// Holds authoritative game state, relays actions via WebSocket

import { DurableObject } from 'cloudflare:workers';
import type { Owner } from '../../shared/types';
import { createInitialState, gameReducer, type GameState, type Action } from '../../shared/game/engine';
import { getGravityMs } from '../../shared/game/engine';
import type { ClientGameState, ServerMessage } from './protocol';

interface PlayerConn {
  ws: WebSocket;
  userId: string;
  displayName: string;
  elo: number;
}

export class Match extends DurableObject {
  private players: Map<Owner, PlayerConn> = new Map();
  private state: GameState | null = null;
  private gravityAlarm: number | null = null;

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

    if (playerNum !== 1 && playerNum !== 2) {
      return new Response('Invalid player number', { status: 400 });
    }

    this.ctx.acceptWebSocket(server);

    this.players.set(playerNum, { ws: server, userId, displayName, elo });

    // When both players connected, start the game
    if (this.players.size === 2) {
      this.startGame();
    }

    return new Response(null, { status: 101, webSocket: client });
  }

  private startGame() {
    this.state = createInitialState();
    // Send initial state to both players
    this.broadcastState();
    // Start gravity for player 1
    this.scheduleGravity();
  }

  private toClientState(forPlayer: Owner): ClientGameState {
    const s = this.state!;
    const myNext = forPlayer === 1 ? s.p1Next : s.p2Next;
    // Hide opponent's next piece until P2 has placed (opening visibility rule)
    const opponentNext = forPlayer === 1
      ? (s.p2HasPlaced ? s.p2Next : null)
      : s.p1Next; // P2 can always see P1's next

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

  private scheduleGravity() {
    if (!this.state || this.state.phase === 'ended') return;
    const activeScore = this.state.scores[this.state.active - 1];
    const ms = getGravityMs(activeScore);
    this.ctx.storage.setAlarm(Date.now() + ms);
  }

  async alarm() {
    if (!this.state || this.state.phase === 'ended') return;
    this.state = gameReducer(this.state, { type: 'GRAVITY' });

    // If grounded, schedule lock delay
    if (this.state.isGrounded) {
      // Use a shorter alarm for lock
      this.ctx.storage.setAlarm(Date.now() + 500);
      this.broadcastState();
      return;
    }

    this.broadcastState();
    this.scheduleGravity();
  }

  webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    if (!this.state) return;
    const data = JSON.parse(message as string);

    if (data.type === 'ACTION') {
      // Find which player this WebSocket belongs to
      let sender: Owner | null = null;
      for (const [playerNum, conn] of this.players) {
        if (conn.ws === ws) { sender = playerNum; break; }
      }
      if (!sender) return;

      // Only the active player can send actions
      if (sender !== this.state.active) {
        this.send(ws, { type: 'ERROR', message: 'Not your turn' });
        return;
      }

      const action = data.action as Action;
      // Validate action type
      const validTypes = ['MOVE', 'ROTATE', 'SOFT_DROP', 'HARD_DROP'];
      if (!validTypes.includes(action.type)) return;

      const prevActive = this.state.active;
      this.state = gameReducer(this.state, action);
      this.broadcastState();

      // If game ended, notify
      if (this.state.phase === 'ended') {
        for (const [, conn] of this.players) {
          this.send(conn.ws, {
            type: 'GAME_END',
            winner: this.state.winner,
            scores: this.state.scores,
            stats: this.state.stats,
          });
        }
        return;
      }

      // If turn changed (hard drop locked piece), reschedule gravity
      if (this.state.active !== prevActive || action.type === 'HARD_DROP') {
        this.scheduleGravity();
      }
    }
  }

  webSocketClose(ws: WebSocket) {
    // Find which player disconnected
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
