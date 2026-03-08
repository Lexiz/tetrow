// Durable Object: singleton matchmaking queue
// Pairs players together and creates Match Durable Objects

import { DurableObject } from 'cloudflare:workers';
import type { ServerMessage } from './protocol';

interface QueuedPlayer {
  ws: WebSocket;
  userId: string;
  displayName: string;
  elo: number;
  joinedAt: number;
}

interface Env {
  MATCH: DurableObjectNamespace;
}

export class Matchmaker extends DurableObject<Env> {
  private queue: QueuedPlayer[] = [];

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
    this.ctx.acceptWebSocket(server);

    return new Response(null, { status: 101, webSocket: client });
  }

  webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    const data = JSON.parse(message as string);

    if (data.type === 'JOIN_QUEUE') {
      const { userId, displayName, elo } = data;

      // Don't allow duplicate queue entries
      if (this.queue.some(p => p.userId === userId)) {
        this.send(ws, { type: 'ERROR', message: 'Already in queue' });
        return;
      }

      const player: QueuedPlayer = { ws, userId, displayName, elo, joinedAt: Date.now() };
      this.queue.push(player);
      this.send(ws, { type: 'QUEUED' });
      this.broadcastQueueSize();

      // Try to match
      this.tryMatch();
    }

    if (data.type === 'LEAVE_QUEUE') {
      this.removeFromQueue(ws);
      this.broadcastQueueSize();
    }
  }

  webSocketClose(ws: WebSocket) {
    this.removeFromQueue(ws);
    this.broadcastQueueSize();
  }

  webSocketError(ws: WebSocket) {
    this.removeFromQueue(ws);
  }

  private removeFromQueue(ws: WebSocket) {
    this.queue = this.queue.filter(p => p.ws !== ws);
  }

  private broadcastQueueSize() {
    const msg: ServerMessage = { type: 'QUEUE_SIZE', count: this.queue.length };
    for (const p of this.queue) {
      this.send(p.ws, msg);
    }
  }

  private async tryMatch() {
    if (this.queue.length < 2) return;

    // Simple FIFO matching for now (could add ELO-based matching later)
    const p1 = this.queue.shift()!;
    const p2 = this.queue.shift()!;

    // Create a unique match ID
    const matchId = crypto.randomUUID();
    const matchStub = this.env.MATCH.get(this.env.MATCH.idFromName(matchId));

    // Tell both players they've been matched
    this.send(p1.ws, {
      type: 'MATCH_FOUND',
      matchId,
      player: 1,
      opponentName: p2.displayName,
    });
    this.send(p2.ws, {
      type: 'MATCH_FOUND',
      matchId,
      player: 2,
      opponentName: p1.displayName,
    });

    // Close matchmaker WebSockets — clients will reconnect to the Match DO
    // Give clients a moment to receive the MATCH_FOUND message
    setTimeout(() => {
      try { p1.ws.close(1000, 'Matched'); } catch {}
      try { p2.ws.close(1000, 'Matched'); } catch {}
    }, 100);

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
