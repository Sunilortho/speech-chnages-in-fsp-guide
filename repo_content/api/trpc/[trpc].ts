import type { IncomingMessage, ServerResponse } from 'http';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '../../backend/trpc/app-router';
import { createContext } from '../../backend/trpc/create-context';

// Node.js runtime handler for Vercel serverless functions
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-trpc-source');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  try {
    // Read body for POST requests
    const body = await new Promise<string>((resolve) => {
      if (req.method === 'GET' || req.method === 'HEAD') {
        resolve('');
        return;
      }
      let data = '';
      req.on('data', (chunk: Buffer) => { data += chunk.toString(); });
      req.on('end', () => resolve(data));
    });

    // Build Web API Request from Node.js IncomingMessage
    const protocol = (req.headers['x-forwarded-proto'] as string) || 'https';
    const host = req.headers.host || 'localhost';
    const url = `${protocol}://${host}${req.url}`;

    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value) headers.set(key, Array.isArray(value) ? value.join(',') : value);
    }

    const webReq = new Request(url, {
      method: req.method || 'GET',
      headers,
      body: body || undefined,
    });

    // Handle tRPC request
    const response = await fetchRequestHandler({
      endpoint: '/api/trpc',
      req: webReq,
      router: appRouter,
      createContext,
      onError({ error, path }) {
        console.error(`[tRPC] Error on ${path ?? 'unknown'}:`, error.message);
      },
    });

    // Write response
    res.statusCode = response.status;
    response.headers.forEach((val, key) => {
      res.setHeader(key, val);
    });
    // Re-apply CORS (in case tRPC overrides)
    res.setHeader('Access-Control-Allow-Origin', '*');

    const text = await response.text();
    res.end(text);
  } catch (error) {
    console.error('[tRPC Handler] Unexpected error:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
}
