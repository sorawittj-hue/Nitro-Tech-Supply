import http from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { URL } from 'node:url';
import path from 'node:path';
import { timingSafeEqual } from 'node:crypto';

const ROOT = new URL('../', import.meta.url);
const DIST_DIR = new URL('dist/', ROOT);
loadEnvFile(new URL('.env', ROOT));
loadEnvFile(new URL('.env.local', ROOT));

const PORT = Number(process.env.NITRO_PROXY_PORT || 8787);
const HERMES_API_URL = trimSlash(process.env.HERMES_API_URL || process.env.VITE_HERMES_API_URL || '');
const HERMES_API_KEY = process.env.HERMES_API_KEY || process.env.VITE_HERMES_API_KEY || '';
const HERMES_SESSION_KEY = process.env.HERMES_SESSION_KEY || process.env.VITE_HERMES_SESSION_KEY || 'nitro-tech-jay';
const MIMO_API_URL = trimSlash(process.env.MIMO_API_BASE_URL || process.env.VITE_MIMO_API_BASE_URL || 'https://api.xiaomimimo.com/v1');
const MIMO_API_KEY = process.env.MIMO_API_KEY || process.env.VITE_MIMO_API_KEY || '';
const DATA_API_URL = trimSlash(process.env.DATA_API_URL || process.env.VITE_API_BASE_URL || 'http://127.0.0.1:3030');
const DATA_WRITE_TOKEN = process.env.NITRO_DATA_WRITE_TOKEN || process.env.NITRO_API_TOKEN || '';
const REQUIRE_DATA_WRITE_TOKEN = (process.env.NITRO_REQUIRE_DATA_WRITE_TOKEN || 'false').toLowerCase() === 'true';
const EFFECTIVE_DATA_WRITE_AUTH_REQUIRED = Boolean(DATA_WRITE_TOKEN) || REQUIRE_DATA_WRITE_TOKEN;
const DATA_ENDPOINTS = new Set([
  '/inventory',
  '/orders',
  '/affiliate',
  '/finance',
  '/customers',
  '/suppliers',
  '/quotes',
  '/invoices',
  '/payments',
  '/purchaseOrders',
  '/shipments',
  '/claims',
  '/agentTasks',
  '/auditLogs',
  '/chatMessages',
]);
const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
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
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Nitro-Write-Token');
  response.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');

  if (request.method === 'OPTIONS') {
    response.writeHead(204);
    response.end();
    return;
  }

  try {
    const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);

    if (request.method === 'GET' && url.pathname === '/health') {
      sendJson(response, 200, {
        status: 'ok',
        service: 'nitro-api-proxy',
        dataWriteAuthConfigured: Boolean(DATA_WRITE_TOKEN),
        dataWriteAuthRequired: EFFECTIVE_DATA_WRITE_AUTH_REQUIRED,
        dataWriteAuthExplicitlyRequired: REQUIRE_DATA_WRITE_TOKEN,
        auditLogEnabled: Boolean(DATA_API_URL),
      });
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

    if (request.method === 'POST' && url.pathname === '/api/transport/messages') {
      if (!canWriteData(request)) {
        const status = DATA_WRITE_TOKEN ? 401 : 503;
        writeAuditLog({
          request,
          action: 'Transport Command Rejected',
          detail: `POST ${url.pathname} rejected with ${status}`,
          status,
        });
        sendJson(response, status, {
          error: {
            message: DATA_WRITE_TOKEN
              ? 'Missing or invalid Nitro write token.'
              : 'Nitro data write token is required but not configured.',
          },
        });
        return;
      }

      const command = parseTransportCommand(await readBody(request));
      if (!command.ok) {
        writeAuditLog({
          request,
          action: 'Transport Command Rejected',
          detail: command.message,
          status: 400,
        });
        sendJson(response, 400, { error: { message: command.message } });
        return;
      }

      writeAuditLog({
        request,
        action: 'Transport Command Accepted',
        detail: summarizeTransportCommand(command.value),
        status: 202,
      });
      sendJson(response, 202, {
        ok: true,
        acceptedAt: new Date().toISOString(),
        type: command.value.type,
      });
      return;
    }

    if (isDataEndpoint(url.pathname)) {
      if (!canWriteData(request)) {
        const status = DATA_WRITE_TOKEN ? 401 : 503;
        writeAuditLog({
          request,
          action: 'Data Write Rejected',
          detail: `${request.method || 'GET'} ${url.pathname} rejected with ${status}`,
          status,
        });
        sendJson(response, status, {
          error: {
            message: DATA_WRITE_TOKEN
              ? 'Missing or invalid Nitro write token.'
              : 'Nitro data write token is required but not configured.',
          },
        });
        return;
      }

      const method = request.method || 'GET';
      const result = await proxyJson(response, `${DATA_API_URL}${url.pathname}${url.search}`, {
        method: request.method || 'GET',
        headers: {
          'Content-Type': request.headers['content-type'] || 'application/json',
        },
        body: hasRequestBody(method) ? await readBody(request) : undefined,
      }, 'Nitro data API is not configured.');

      if (UNSAFE_METHODS.has(method)) {
        writeAuditLog({
          request,
          action: 'Data Write',
          detail: `${method} ${url.pathname} completed with ${result.status}`,
          status: result.status,
        });
      }
      return;
    }

    if (request.method === 'GET') {
      serveStaticApp(response, url.pathname);
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
  if (!DATA_WRITE_TOKEN) {
    console.warn('Nitro data writes are not protected by NITRO_DATA_WRITE_TOKEN yet. Set NITRO_REQUIRE_DATA_WRITE_TOKEN=true before production writes.');
  }
});

function hermesHeaders() {
  return HERMES_API_KEY ? { Authorization: `Bearer ${HERMES_API_KEY}` } : {};
}

async function proxyJson(response, url, init, missingConfigMessage) {
  if (!url || url.startsWith('/')) {
    sendJson(response, 503, { error: { message: missingConfigMessage } });
    return { status: 503, contentType: 'application/json', text: JSON.stringify({ error: { message: missingConfigMessage } }) };
  }

  const upstream = await fetch(url, init).catch(error => {
    throw new Error(`Upstream request failed: ${error instanceof Error ? error.message : String(error)}`);
  });
  const text = await upstream.text();
  const contentType = upstream.headers.get('content-type') || 'application/json';
  response.writeHead(upstream.status, {
    'Content-Type': contentType,
  });
  response.end(text);
  return { status: upstream.status, contentType, text };
}

function sendJson(response, status, payload) {
  response.writeHead(status, { 'Content-Type': 'application/json' });
  response.end(JSON.stringify(payload));
}

function parseTransportCommand(rawBody) {
  let value;
  try {
    value = JSON.parse(rawBody);
  } catch {
    return { ok: false, message: 'Transport command body must be valid JSON.' };
  }

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { ok: false, message: 'Transport command body must be an object.' };
  }

  const type = value.type;
  if (!isAllowedTransportCommandType(type)) {
    return { ok: false, message: `Unsupported transport command type: ${String(type || 'missing')}.` };
  }

  if (type.startsWith('agent.') && typeof value.agentId !== 'string') {
    return { ok: false, message: `${type} requires agentId.` };
  }

  if (type === 'agent.task.assign' && typeof value.title !== 'string') {
    return { ok: false, message: 'agent.task.assign requires title.' };
  }

  if (type === 'chat.send' && typeof value.text !== 'string') {
    return { ok: false, message: 'chat.send requires text.' };
  }

  return { ok: true, value };
}

function isAllowedTransportCommandType(type) {
  return type === 'webview.ready'
    || type === 'agent.wake'
    || type === 'agent.task.assign'
    || type === 'agent.skill.update'
    || type === 'chat.send'
    || type === 'layout.save'
    || type === 'diagnostics.request';
}

function summarizeTransportCommand(command) {
  const parts = [command.type];
  if (typeof command.agentId === 'string') parts.push(`agent=${command.agentId}`);
  if (typeof command.taskId === 'string') parts.push(`task=${command.taskId}`);
  if (typeof command.title === 'string') parts.push(`title=${command.title.slice(0, 120)}`);
  return parts.join(' ');
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

function isDataEndpoint(pathname) {
  return DATA_ENDPOINTS.has(pathname) || [...DATA_ENDPOINTS].some(endpoint => pathname.startsWith(`${endpoint}/`));
}

function hasRequestBody(method) {
  return method === 'POST' || method === 'PUT' || method === 'PATCH';
}

function canWriteData(request) {
  const method = request.method || 'GET';
  if (!UNSAFE_METHODS.has(method)) return true;
  if (!DATA_WRITE_TOKEN) return !REQUIRE_DATA_WRITE_TOKEN;

  const token = readWriteToken(request);
  return safeEqual(token, DATA_WRITE_TOKEN);
}

function writeAuditLog({ request, action, detail, status }) {
  if (!DATA_API_URL || DATA_API_URL.startsWith('/')) return;

  const entry = {
    id: makeAuditId(),
    timestamp: new Date().toISOString(),
    action,
    detail,
    method: request.method || 'GET',
    status,
    sourceIp: readClientIp(request),
  };

  fetch(`${DATA_API_URL}/auditLogs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry),
  }).catch(error => {
    console.warn(`Failed to write Nitro audit log: ${error instanceof Error ? error.message : String(error)}`);
  });
}

function makeAuditId() {
  return `audit-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function readClientIp(request) {
  const forwardedFor = request.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
    return forwardedFor.split(',')[0]?.trim() || 'unknown';
  }
  return request.socket.remoteAddress || 'unknown';
}

function readWriteToken(request) {
  const directToken = request.headers['x-nitro-write-token'];
  if (typeof directToken === 'string' && directToken) return directToken;

  const authorization = request.headers.authorization || '';
  if (authorization.startsWith('Bearer ')) return authorization.slice('Bearer '.length).trim();
  return '';
}

function safeEqual(left, right) {
  if (!left || !right) return false;
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

function serveStaticApp(response, pathname) {
  const safePath = normalizeStaticPath(pathname);
  const candidate = new URL(safePath, DIST_DIR);
  const fileUrl = existsSync(candidate) && statSync(candidate).isFile()
    ? candidate
    : new URL('index.html', DIST_DIR);

  if (!existsSync(fileUrl)) {
    sendJson(response, 404, { error: { message: 'Frontend build not found. Run npm run build first.' } });
    return;
  }

  const content = readFileSync(fileUrl);
  response.writeHead(200, {
    'Content-Type': contentType(fileUrl.pathname),
    'Cache-Control': cacheControl(fileUrl.pathname),
  });
  response.end(content);
}

function normalizeStaticPath(pathname) {
  const decoded = decodeURIComponent(pathname);
  const clean = path.posix.normalize(decoded).replace(/^(\.\.(\/|\\|$))+/, '');
  if (clean === '/' || clean === '.') return 'index.html';
  return clean.replace(/^\//, '');
}

function contentType(filename) {
  if (filename.endsWith('.html')) return 'text/html; charset=utf-8';
  if (filename.endsWith('.js')) return 'text/javascript; charset=utf-8';
  if (filename.endsWith('.css')) return 'text/css; charset=utf-8';
  if (filename.endsWith('.svg')) return 'image/svg+xml';
  if (filename.endsWith('.png')) return 'image/png';
  if (filename.endsWith('.ico')) return 'image/x-icon';
  if (filename.endsWith('.json')) return 'application/json; charset=utf-8';
  return 'application/octet-stream';
}

function cacheControl(filename) {
  if (filename.endsWith('.html')) return 'no-store';
  return 'public, max-age=60';
}
