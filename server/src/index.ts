// Cloudflare Worker entry point
// Routes WebSocket connections to Matchmaker or Match Durable Objects

export { Matchmaker } from './matchmaker';
export { Match } from './match';

interface Env {
  MATCHMAKER: DurableObjectNamespace;
  MATCH: DurableObjectNamespace;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders(),
      });
    }

    // Health check
    if (url.pathname === '/health') {
      return json({ status: 'ok' });
    }

    // Matchmaking WebSocket: /api/queue
    if (url.pathname === '/api/queue') {
      // Route to the singleton Matchmaker Durable Object
      const id = env.MATCHMAKER.idFromName('global');
      const stub = env.MATCHMAKER.get(id);
      const res = await stub.fetch(new Request(new URL('/ws', url.origin), {
        headers: request.headers,
      }));
      return addCors(res);
    }

    // Match WebSocket: /api/match/:matchId?player=1&userId=...&displayName=...&elo=...
    if (url.pathname.startsWith('/api/match/')) {
      const matchId = url.pathname.split('/')[3];
      if (!matchId) return json({ error: 'Missing match ID' }, 400);

      const id = env.MATCH.idFromName(matchId);
      const stub = env.MATCH.get(id);

      const matchUrl = new URL('/ws', url.origin);
      matchUrl.search = url.search;

      const res = await stub.fetch(new Request(matchUrl, {
        headers: request.headers,
      }));
      return addCors(res);
    }

    return json({ error: 'Not found' }, 404);
  },
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
  });
}

function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Upgrade, Connection, Sec-WebSocket-Key, Sec-WebSocket-Version, Sec-WebSocket-Protocol',
  };
}

function addCors(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [k, v] of Object.entries(corsHeaders())) {
    headers.set(k, v);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
    webSocket: (response as any).webSocket,
  });
}
