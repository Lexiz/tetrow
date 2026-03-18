// Durable Object: singleton matchmaking queue
// Uses WebSocket attachments to survive hibernation (in-memory state is lost between events)

import { DurableObject } from 'cloudflare:workers';
import type { ServerMessage } from './protocol';
import type { GameMode } from '../../shared/types';

interface PlayerAttachment {
  userId: string;
  displayName: string;
  elo: number;
  joinedAt: number;
  inQueue: boolean; // false once matched
  gameMode: GameMode;
}

interface Env {
  MATCH: DurableObjectNamespace;
}

export class Matchmaker extends DurableObject<Env> {

  /** Get all WebSockets that are currently queued */
  private getQueue(): { ws: WebSocket; att: PlayerAttachment }[] {
    const all = this.ctx.getWebSockets();
    const result: { ws: WebSocket; att: PlayerAttachment }[] = [];
    for (const ws of all) {
      const att = ws.deserializeAttachment() as PlayerAttachment | null;
      if (att?.inQueue) {
        result.push({ ws, att });
      }
    }
    // Sort by join time for FIFO
    result.sort((a, b) => a.att.joinedAt - b.att.joinedAt);
    return result;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // HTTP endpoint: return lobby count
    if (url.pathname === '/lobby') {
      const all = this.ctx.getWebSockets();
      const queue = this.getQueue();
      return new Response(JSON.stringify({ count: all.length, searching: queue.length }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (url.pathname !== '/ws') {
      return new Response('Not found', { status: 404 });
    }

    const upgradeHeader = request.headers.get('Upgrade');
    if (upgradeHeader !== 'websocket') {
      return new Response('Expected WebSocket', { status: 426 });
    }

    const { 0: client, 1: server } = new WebSocketPair();
    // Attach empty state — will be populated on JOIN_QUEUE message
    this.ctx.acceptWebSocket(server);

    return new Response(null, { status: 101, webSocket: client });
  }

  webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    const data = JSON.parse(message as string);

    if (data.type === 'JOIN_QUEUE') {
      const { userId, displayName, elo, gameMode } = data;

      // Don't allow duplicate queue entries
      const queue = this.getQueue();
      if (queue.some(p => p.att.userId === userId)) {
        this.send(ws, { type: 'ERROR', message: 'Already in queue' });
        return;
      }

      // Store player info as WebSocket attachment (survives hibernation)
      const att: PlayerAttachment = { userId, displayName, elo, joinedAt: Date.now(), inQueue: true, gameMode: gameMode ?? 'classic' };
      ws.serializeAttachment(att);

      this.send(ws, { type: 'QUEUED' });
      this.broadcastQueueSize();

      // Try to match
      this.tryMatch();
    }

    if (data.type === 'LEAVE_QUEUE') {
      this.markNotQueued(ws);
      this.broadcastQueueSize();
    }
  }

  webSocketClose(ws: WebSocket) {
    this.markNotQueued(ws);
    this.broadcastQueueSize();
  }

  webSocketError(ws: WebSocket) {
    this.markNotQueued(ws);
  }

  private markNotQueued(ws: WebSocket) {
    const att = ws.deserializeAttachment() as PlayerAttachment | null;
    if (att) {
      att.inQueue = false;
      ws.serializeAttachment(att);
    }
  }

  private broadcastQueueSize() {
    const queue = this.getQueue();
    const msg: ServerMessage = { type: 'QUEUE_SIZE', count: queue.length };
    for (const { ws } of queue) {
      this.send(ws, msg);
    }
  }

  private async tryMatch() {
    const queue = this.getQueue();
    if (queue.length < 2) return;

    // Partition queue by gameMode and try to match within each partition
    const byMode = new Map<string, typeof queue>();
    for (const p of queue) {
      const mode = p.att.gameMode ?? 'classic';
      if (!byMode.has(mode)) byMode.set(mode, []);
      byMode.get(mode)!.push(p);
    }

    for (const [mode, modePlayers] of byMode) {
      if (modePlayers.length < 2) continue;

      const p1 = modePlayers[0]!;
      const p2 = modePlayers[1]!;

      // Mark both as no longer in queue
      this.markNotQueued(p1.ws);
      this.markNotQueued(p2.ws);

      // Create a unique match ID
      const matchId = crypto.randomUUID();
      const gameMode = mode as import('../../shared/types').GameMode;

      // Tell both players they've been matched
      this.send(p1.ws, {
        type: 'MATCH_FOUND',
        matchId,
        player: 1,
        opponentName: p2.att.displayName,
        gameMode,
      });
      this.send(p2.ws, {
        type: 'MATCH_FOUND',
        matchId,
        player: 2,
        opponentName: p1.att.displayName,
        gameMode,
      });

      // Close matchmaker WebSockets — clients will reconnect to the Match DO
      setTimeout(() => {
        try { p1.ws.close(1000, 'Matched'); } catch {}
        try { p2.ws.close(1000, 'Matched'); } catch {}
      }, 100);
    }

    this.broadcastQueueSize();
  }

  private send(ws: WebSocket, msg: ServerMessage) {
    try {
      ws.send(JSON.stringify(msg));
    } catch {
      // Connection may be closed
    }
  }
}
