import http from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { URL } from 'node:url';

const ROOT = new URL('../', import.meta.url);
loadEnvFile(new URL('.env', ROOT));
loadEnvFile(new URL('.env.local', ROOT));

const PORT = Number(process.env.NITRO_PROXY_PORT || 8787);
const HERMES_API_URL = trimSlash(process.env.HERMES_API_URL || process.env.VITE_HERMES_API_URL || '');
const HERMES_API_KEY = process.env.HERMES_API_KEY || process.env.VITE_HERMES_API_KEY || '';
const HERMES_SESSION_KEY = process.env.HERMES_SESSION_KEY || process.env.VITE_HERMES_SESSION_KEY || 'nitro-tech-jay';
const MIMO_API_URL = trimSlash(process.env.MIMO_API_BASE_URL || process.env.VITE_MIMO_API_BASE_URL || 'https://api.xiaomimimo.com/v1');
const MIMO_API_KEY = process.env.MIMO_API_KEY || process.env.VITE_MIMO_API_KEY || '';
const configuredOrigins = (process.env.NITRO_ALLOWED_ORIGINS || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);
const ALLOWED_ORIGINS = new Set([
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  ...configuredOrigins,
]);

const server = http.createServer(async (request, response) => {
  const origin = request.headers.origin || '';
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    response.setHeader('Access-Control-Allow-Origin', origin);
    response.setHeader('Vary', 'Origin');
  }
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  response.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');

  if (request.method === 'OPTIONS') {
    response.writeHead(204);
    response.end();
    return;
  }

  try {
    const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);

    if (request.method === 'GET' && url.pathname === '/health') {
      sendJson(response, 200, { status: 'ok', service: 'nitro-api-proxy' });
      return;
    }

    if (request.method === 'GET' && url.pathname === '/api/hermes/health') {
      await proxyJson(response, `${HERMES_API_URL}/v1/health`, {
        method: 'GET',
        headers: hermesHeaders(),
      }, 'Hermes is not configured.');
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/hermes/chat') {
      await proxyJson(response, `${HERMES_API_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          ...hermesHeaders(),
          'Content-Type': 'application/json',
          'X-Hermes-Session-Key': HERMES_SESSION_KEY,
        },
        body: await readBody(request),
      }, 'Hermes is not configured.');
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/mimo/chat') {
      await proxyJson(response, `${MIMO_API_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': MIMO_API_KEY,
        },
        body: await readBody(request),
      }, 'MiMo is not configured.');
      return;
    }

    sendJson(response, 404, { error: { message: 'Endpoint not found.' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected proxy error.';
    sendJson(response, 500, { error: { message } });
  }
});

server.listen(PORT, () => {
  console.log(`Nitro API proxy listening on http://localhost:${PORT}`);
});

function hermesHeaders() {
  return HERMES_API_KEY ? { Authorization: `Bearer ${HERMES_API_KEY}` } : {};
}

async function proxyJson(response, url, init, missingConfigMessage) {
  if (!url || url.startsWith('/')) {
    sendJson(response, 503, { error: { message: missingConfigMessage } });
    return;
  }

  const upstream = await fetch(url, init).catch(error => {
    throw new Error(`Upstream request failed: ${error instanceof Error ? error.message : String(error)}`);
  });
  const text = await upstream.text();
  response.writeHead(upstream.status, {
    'Content-Type': upstream.headers.get('content-type') || 'application/json',
  });
  response.end(text);
}

function sendJson(response, status, payload) {
  response.writeHead(status, { 'Content-Type': 'application/json' });
  response.end(JSON.stringify(payload));
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.setEncoding('utf8');
    request.on('data', chunk => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error('Request body is too large.'));
        request.destroy();
      }
    });
    request.on('end', () => resolve(body));
    request.on('error', reject);
  });
}

function loadEnvFile(fileUrl) {
  if (!existsSync(fileUrl)) return;
  const content = readFileSync(fileUrl, 'utf8');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || !line.includes('=')) continue;
    const [key, ...parts] = line.split('=');
    if (!process.env[key]) {
      process.env[key] = parts.join('=').replace(/^["']|["']$/g, '');
    }
  }
}

function trimSlash(value) {
  return value.replace(/\/$/, '');
}
