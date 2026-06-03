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
const HERMES_COMMAND_TIMEOUT_MS = readPositiveIntegerEnv('HERMES_COMMAND_TIMEOUT_MS', 60_000);
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
  '/agentRuns',
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

    if (request.method === 'GET' && url.pathname === '/api/hermes/runs') {
      if (!HERMES_API_URL || HERMES_API_URL.startsWith('/')) {
        sendJson(response, 503, { error: { message: 'Hermes is not configured.' } });
        return;
      }
      const runsUrl = new URL(`${HERMES_API_URL}/v1/runs`);
      const sessionKey = url.searchParams.get('session_key') || HERMES_SESSION_KEY;
      runsUrl.searchParams.set('session_key', sessionKey);
      for (const [key, value] of url.searchParams.entries()) {
        if (key !== 'session_key') runsUrl.searchParams.set(key, value);
      }
      await proxyJson(response, runsUrl.toString(), {
        method: 'GET',
        headers: {
          ...hermesHeaders(),
          'X-Hermes-Session-Key': sessionKey,
        },
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
      const agentRun = await createAgentRun(command.value).catch(error => {
        console.warn(`Failed to create agent run: ${error instanceof Error ? error.message : String(error)}`);
        return null;
      });
      const hermesForward = await forwardTransportCommandToHermes(command.value);
      const businessActions = await materializeBusinessActions(command.value, hermesForward, agentRun).catch(error => {
        const message = error instanceof Error ? error.message : String(error);
        console.warn(`Failed to materialize business action: ${message}`);
        return [{
          type: 'agent_task',
          id: typeof command.value.taskId === 'string' ? command.value.taskId : agentRun?.id ?? 'unknown',
          status: 'failed',
          detail: message,
        }];
      });
      const actionEvidence = businessActions.map(action => `business action ${action.status}: ${action.type}/${action.id}`);
      if (agentRun) {
        await updateAgentRun(agentRun.id, {
          status: normalizeAgentRunStatus(hermesForward.status),
          hermesForwarded: hermesForward.forwarded,
          hermesStatus: hermesForward.status,
          result: hermesForward.result,
          evidence: [...(hermesForward.evidence ?? []), ...actionEvidence],
          businessActions,
          completedAt: hermesForward.forwarded ? new Date().toISOString() : undefined,
          errorMessage: hermesForward.errorMessage,
          updatedAt: new Date().toISOString(),
        }).catch(error => {
          console.warn(`Failed to update agent run ${agentRun.id}: ${error instanceof Error ? error.message : String(error)}`);
        });
      }
      sendJson(response, 202, {
        ok: true,
        runId: agentRun?.id ?? null,
        acceptedAt: new Date().toISOString(),
        type: command.value.type,
        hermesForwarded: hermesForward.forwarded,
        hermesStatus: hermesForward.status,
        result: hermesForward.result ?? null,
        evidence: [...(hermesForward.evidence ?? []), ...actionEvidence],
        businessActions,
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

async function forwardTransportCommandToHermes(command) {
  if (!shouldForwardTransportCommand(command.type)) {
    return { forwarded: false, status: 'not_forwardable', evidence: ['Command type is not configured for Hermes forwarding.'] };
  }

  if (!HERMES_API_URL || HERMES_API_URL.startsWith('/')) {
    return { forwarded: false, status: 'not_configured', evidence: ['HERMES_API_URL is not configured on the Nitro proxy.'] };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), HERMES_COMMAND_TIMEOUT_MS);

  try {
    const response = await fetch(`${HERMES_API_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        ...hermesHeaders(),
        'Content-Type': 'application/json',
        'X-Hermes-Session-Key': HERMES_SESSION_KEY,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: 'hermes-agent',
        messages: [
          {
            role: 'system',
            content: nitroTransportSystemPrompt(),
          },
          {
            role: 'user',
            content: formatTransportCommandForHermes(command),
          },
        ],
        stream: false,
      }),
    });

    const status = response.ok ? 'forwarded' : `hermes_${response.status}`;
    const text = await response.text().catch(() => '');
    if (!response.ok) {
      console.warn(`Hermes transport forward failed: ${response.status} ${text.slice(0, 300)}`);
      return {
        forwarded: false,
        status,
        errorMessage: extractErrorMessage(text) ?? `Hermes returned HTTP ${response.status}.`,
        evidence: [
          `POST ${HERMES_API_URL}/v1/chat/completions`,
          `HTTP ${response.status}`,
        ],
      };
    }
    const result = extractOpenAiMessageContent(text);
    return {
      forwarded: true,
      status,
      result,
      evidence: [
        `POST ${HERMES_API_URL}/v1/chat/completions`,
        `session ${HERMES_SESSION_KEY}`,
        result ? 'assistant response captured' : 'assistant response empty',
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`Hermes transport forward failed: ${message}`);
    return {
      forwarded: false,
      status: 'forward_failed',
      errorMessage: message,
      evidence: [`Hermes forward exception: ${message}`],
    };
  } finally {
    clearTimeout(timeout);
  }
}

function extractOpenAiMessageContent(text) {
  if (!text.trim()) return undefined;
  try {
    const payload = JSON.parse(text);
    const firstChoice = Array.isArray(payload.choices) ? payload.choices[0] : undefined;
    const content = firstChoice?.message?.content;
    if (typeof content === 'string' && content.trim()) return content.trim();
    const textContent = firstChoice?.text;
    if (typeof textContent === 'string' && textContent.trim()) return textContent.trim();
    return undefined;
  } catch (error) {
    console.warn(`Unable to parse Hermes response JSON: ${error instanceof Error ? error.message : String(error)}`);
    return text.slice(0, 2_000);
  }
}

function extractErrorMessage(text) {
  if (!text.trim()) return undefined;
  try {
    const payload = JSON.parse(text);
    if (typeof payload.error?.message === 'string') return payload.error.message;
    if (typeof payload.message === 'string') return payload.message;
    return undefined;
  } catch {
    return text.slice(0, 500);
  }
}

async function createAgentRun(command) {
  if (!DATA_API_URL || DATA_API_URL.startsWith('/')) return null;
  const now = new Date().toISOString();
  const run = {
    id: makeAgentRunId(),
    commandType: command.type,
    agentId: typeof command.agentId === 'string' ? command.agentId : undefined,
    taskId: typeof command.taskId === 'string' ? command.taskId : undefined,
    title: typeof command.title === 'string' ? command.title : undefined,
    status: 'accepted',
    hermesForwarded: false,
    hermesStatus: 'pending',
    createdAt: now,
    updatedAt: now,
    detail: summarizeTransportCommand(command),
  };

  const response = await fetch(`${DATA_API_URL}/agentRuns`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(run),
  });

  if (!response.ok) {
    throw new Error(`agentRuns API returned ${response.status}`);
  }
  return run;
}

async function updateAgentRun(id, patch) {
  if (!DATA_API_URL || DATA_API_URL.startsWith('/')) return;
  const response = await fetch(`${DATA_API_URL}/agentRuns/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  if (!response.ok) {
    throw new Error(`agentRuns/${id} API returned ${response.status}`);
  }
}

async function materializeBusinessActions(command, hermesForward, agentRun) {
  if (!DATA_API_URL || DATA_API_URL.startsWith('/')) return [];
  if (command.type === 'purchase.order.draft') {
    return materializePurchaseOrderDraft(command, hermesForward, agentRun);
  }
  if (command.type === 'quote.draft') {
    return materializeQuoteDraft(command, hermesForward, agentRun);
  }
  if (command.type !== 'agent.task.assign') return [];
  if (typeof command.agentId !== 'string' || typeof command.title !== 'string') return [];

  const taskId = typeof command.taskId === 'string' && command.taskId.trim()
    ? command.taskId.trim()
    : makeAgentTaskId(agentRun?.id);
  const priority = normalizeTaskPriority(command.priority);
  const detailParts = [
    hermesForward.forwarded ? 'Hermes accepted this CEO task.' : `Hermes status: ${hermesForward.status}.`,
  ];
  if (typeof command.detail === 'string' && command.detail.trim()) {
    detailParts.push(command.detail.trim());
  }
  if (typeof hermesForward.result === 'string' && hermesForward.result.trim()) {
    detailParts.push(`Hermes: ${hermesForward.result.trim().slice(0, 500)}`);
  }

  const taskPayload = {
    id: taskId,
    agentId: command.agentId,
    title: command.title.trim(),
    status: 'todo',
    priority,
    source: 'hermes',
    createdAt: new Date().toISOString(),
    dueAt: typeof command.dueAt === 'string' ? command.dueAt : undefined,
  };

  const existingTasks = await fetchJsonData(`/agentTasks?id=${encodeURIComponent(taskId)}`);
  const existing = Array.isArray(existingTasks) && existingTasks.length > 0 ? existingTasks[0] : null;
  if (existing && typeof existing.id === 'string') {
    const updatePayload = {
      agentId: taskPayload.agentId,
      title: taskPayload.title,
      priority: taskPayload.priority,
      source: taskPayload.source,
      dueAt: taskPayload.dueAt,
    };
    await writeDataRecord(`/agentTasks/${encodeURIComponent(existing.id)}`, 'PATCH', updatePayload);
    return [{
      type: 'agent_task',
      id: taskId,
      status: 'updated',
      detail: `Updated agent task for ${command.agentId}: ${taskPayload.title}`,
    }];
  }

  await writeDataRecord('/agentTasks', 'POST', taskPayload);
  return [{
    type: 'agent_task',
    id: taskId,
    status: 'created',
    detail: detailParts.join(' '),
  }];
}

async function materializeQuoteDraft(command, hermesForward, agentRun) {
  if (typeof command.customerId !== 'string' || typeof command.totalValue !== 'number' || typeof command.grossMargin !== 'number') return [];

  const customerId = command.customerId.trim();
  const quoteId = typeof command.quoteId === 'string' && command.quoteId.trim()
    ? command.quoteId.trim()
    : makeQuoteId(agentRun?.id);
  const description = typeof command.description === 'string' && command.description.trim()
    ? command.description.trim()
    : typeof command.title === 'string' && command.title.trim()
      ? command.title.trim()
      : 'Hermes drafted quote';
  const customer = await fetchJsonData(`/customers/${encodeURIComponent(customerId)}`);
  if (!customer || typeof customer.id !== 'string') {
    throw new Error(`Customer ${customerId} was not found. Create the customer before drafting this quote.`);
  }
  const marginGuard = command.grossMargin < 0.1
    ? 'Margin below 10%. CEO review recommended before sending.'
    : 'Margin guard passed.';
  const payload = {
    id: quoteId,
    customerId,
    status: 'Draft',
    description,
    totalValue: command.totalValue,
    grossMargin: command.grossMargin,
    createdAt: new Date().toISOString(),
    validUntil: typeof command.validUntil === 'string' ? command.validUntil : undefined,
  };

  const existingQuotes = await fetchJsonData(`/quotes?id=${encodeURIComponent(quoteId)}`);
  const existing = Array.isArray(existingQuotes) && existingQuotes.length > 0 ? existingQuotes[0] : null;
  if (existing && typeof existing.id === 'string') {
    await writeDataRecord(`/quotes/${encodeURIComponent(existing.id)}`, 'PATCH', {
      customerId: payload.customerId,
      status: payload.status,
      description: payload.description,
      totalValue: payload.totalValue,
      grossMargin: payload.grossMargin,
      validUntil: payload.validUntil,
    });
    return [{
      type: 'quote',
      id: quoteId,
      status: 'updated',
      detail: `Updated draft quote for customer ${customerId}. ${marginGuard}`,
    }];
  }

  await writeDataRecord('/quotes', 'POST', payload);
  return [{
    type: 'quote',
    id: quoteId,
    status: 'created',
    detail: `Created draft quote for customer ${customerId}. Total THB ${command.totalValue}. Gross margin ${(command.grossMargin * 100).toFixed(1)}%. ${marginGuard} Hermes: ${(hermesForward.result || '').slice(0, 240)}`,
  }];
}

async function materializePurchaseOrderDraft(command, hermesForward, agentRun) {
  if (typeof command.supplierId !== 'string' || typeof command.totalCost !== 'number') return [];

  const supplierId = command.supplierId.trim();
  const purchaseOrderId = typeof command.purchaseOrderId === 'string' && command.purchaseOrderId.trim()
    ? command.purchaseOrderId.trim()
    : makePurchaseOrderId(agentRun?.id);
  const description = typeof command.description === 'string' && command.description.trim()
    ? command.description.trim()
    : typeof command.title === 'string' && command.title.trim()
      ? command.title.trim()
      : 'Hermes drafted purchase order';
  const requiresApproval = command.totalCost > 50_000;
  const approvalStatus = requiresApproval ? 'pending' : 'not_required';
  const approvalReason = requiresApproval
    ? 'CEO approval required for purchase orders above THB 50,000.'
    : 'Below CEO approval threshold.';

  const supplier = await fetchJsonData(`/suppliers/${encodeURIComponent(supplierId)}`);
  if (!supplier || typeof supplier.id !== 'string') {
    throw new Error(`Supplier ${supplierId} was not found. Create the supplier before drafting this PO.`);
  }

  const payload = {
    id: purchaseOrderId,
    supplierId,
    status: 'Draft',
    description,
    totalCost: command.totalCost,
    createdAt: new Date().toISOString(),
    expectedAt: typeof command.expectedAt === 'string' ? command.expectedAt : undefined,
    approvalStatus,
    approvalReason,
  };

  const existingOrders = await fetchJsonData(`/purchaseOrders?id=${encodeURIComponent(purchaseOrderId)}`);
  const existing = Array.isArray(existingOrders) && existingOrders.length > 0 ? existingOrders[0] : null;
  if (existing && typeof existing.id === 'string') {
    await writeDataRecord(`/purchaseOrders/${encodeURIComponent(existing.id)}`, 'PATCH', {
      supplierId: payload.supplierId,
      status: payload.status,
      description: payload.description,
      totalCost: payload.totalCost,
      expectedAt: payload.expectedAt,
      approvalStatus: payload.approvalStatus,
      approvalReason: payload.approvalReason,
    });
    return [{
      type: 'purchase_order',
      id: purchaseOrderId,
      status: 'updated',
      detail: `Updated draft PO for supplier ${supplierId}. Approval: ${approvalStatus}.`,
    }];
  }

  await writeDataRecord('/purchaseOrders', 'POST', payload);
  return [{
    type: 'purchase_order',
    id: purchaseOrderId,
    status: 'created',
    detail: `Created draft PO for supplier ${supplierId}. Total THB ${command.totalCost}. Approval: ${approvalStatus}. Hermes: ${(hermesForward.result || '').slice(0, 240)}`,
  }];
}

async function fetchJsonData(pathname) {
  const response = await fetchWithRetry(`${DATA_API_URL}${pathname}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`${pathname} returned ${response.status}`);
  return response.json();
}

async function writeDataRecord(pathname, method, payload) {
  const response = await fetchWithRetry(`${DATA_API_URL}${pathname}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(`${method} ${pathname} returned ${response.status}`);
}

async function fetchWithRetry(url, init, attempts = 3) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fetch(url, init);
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await delay(150 * attempt);
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function normalizeAgentRunStatus(status) {
  if (status === 'forwarded') return 'forwarded';
  if (status === 'not_forwardable') return 'not_forwardable';
  if (status === 'not_configured') return 'not_configured';
  if (status === 'forward_failed') return 'forward_failed';
  return status.startsWith('hermes_') ? 'failed' : 'failed';
}

function shouldForwardTransportCommand(type) {
  return type === 'agent.wake'
    || type === 'agent.task.assign'
    || type === 'agent.skill.update'
    || type === 'chat.send'
    || type === 'purchase.order.draft'
    || type === 'quote.draft'
    || type === 'diagnostics.request';
}

function nitroTransportSystemPrompt() {
  return [
    'You are Hermes Agent, the company brain for Nitro Tech Supply.',
    'The CEO is Jay / Sorawit. Treat dashboard transport commands as real company operating events.',
    'Route the command to the most appropriate Nitro agent from swarm.yaml.',
    'Respect approval gates: purchases above THB 50,000, destructive changes, external messages, credential changes, and production deploys need CEO approval.',
    'Reply internally and concisely as AgentName (Title): action, risk, next step.',
  ].join('\n');
}

function formatTransportCommandForHermes(command) {
  const lines = [
    'Nitro dashboard transport command received.',
    `type: ${command.type}`,
  ];

  appendIfString(lines, 'agentId', command.agentId);
  appendIfString(lines, 'taskId', command.taskId);
  appendIfString(lines, 'title', command.title);
  appendIfString(lines, 'detail', command.detail);
  appendIfString(lines, 'priority', command.priority);
  appendIfString(lines, 'source', command.source);
  appendIfString(lines, 'text', command.text);
  appendIfString(lines, 'sessionKey', command.sessionKey);
  appendIfString(lines, 'supplierId', command.supplierId);
  appendIfString(lines, 'customerId', command.customerId);
  appendIfString(lines, 'quoteId', command.quoteId);
  appendIfString(lines, 'description', command.description);
  appendIfString(lines, 'expectedAt', command.expectedAt);
  appendIfString(lines, 'validUntil', command.validUntil);
  if (typeof command.totalCost === 'number') lines.push(`totalCost: ${command.totalCost}`);
  if (typeof command.totalValue === 'number') lines.push(`totalValue: ${command.totalValue}`);
  if (typeof command.grossMargin === 'number') lines.push(`grossMargin: ${command.grossMargin}`);

  if (command.type === 'agent.skill.update') {
    lines.push(`individualSkillUpdated: ${typeof command.individualSkill === 'string'}`);
    lines.push(`sharedSkillUpdated: ${typeof command.sharedSkill === 'string'}`);
  }

  return lines.join('\n');
}

function appendIfString(lines, label, value) {
  if (typeof value === 'string' && value.trim()) {
    lines.push(`${label}: ${value.slice(0, 1000)}`);
  }
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

  if (type === 'purchase.order.draft') {
    if (typeof value.supplierId !== 'string' || !value.supplierId.trim()) {
      return { ok: false, message: 'purchase.order.draft requires supplierId.' };
    }
    if (typeof value.totalCost !== 'number' || !Number.isFinite(value.totalCost) || value.totalCost < 0) {
      return { ok: false, message: 'purchase.order.draft requires non-negative totalCost.' };
    }
  }

  if (type === 'quote.draft') {
    if (typeof value.customerId !== 'string' || !value.customerId.trim()) {
      return { ok: false, message: 'quote.draft requires customerId.' };
    }
    if (typeof value.totalValue !== 'number' || !Number.isFinite(value.totalValue) || value.totalValue < 0) {
      return { ok: false, message: 'quote.draft requires non-negative totalValue.' };
    }
    if (typeof value.grossMargin !== 'number' || !Number.isFinite(value.grossMargin) || value.grossMargin < 0 || value.grossMargin > 1) {
      return { ok: false, message: 'quote.draft requires grossMargin between 0 and 1.' };
    }
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
    || type === 'purchase.order.draft'
    || type === 'quote.draft'
    || type === 'diagnostics.request';
}

function summarizeTransportCommand(command) {
  const parts = [command.type];
  if (typeof command.agentId === 'string') parts.push(`agent=${command.agentId}`);
  if (typeof command.taskId === 'string') parts.push(`task=${command.taskId}`);
  if (typeof command.purchaseOrderId === 'string') parts.push(`po=${command.purchaseOrderId}`);
  if (typeof command.quoteId === 'string') parts.push(`quote=${command.quoteId}`);
  if (typeof command.supplierId === 'string') parts.push(`supplier=${command.supplierId}`);
  if (typeof command.customerId === 'string') parts.push(`customer=${command.customerId}`);
  if (typeof command.title === 'string') parts.push(`title=${command.title.slice(0, 120)}`);
  if (typeof command.description === 'string') parts.push(`description=${command.description.slice(0, 120)}`);
  return parts.join(' ');
}

function normalizeTaskPriority(value) {
  return value === 'low' || value === 'medium' || value === 'high' ? value : 'medium';
}

function makeAgentTaskId(runId) {
  return `task-${runId || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`}`;
}

function makePurchaseOrderId(runId) {
  return `po-${runId || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`}`;
}

function makeQuoteId(runId) {
  return `quote-${runId || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`}`;
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

function readPositiveIntegerEnv(key, fallback) {
  const rawValue = process.env[key];
  if (!rawValue) return fallback;
  const parsed = Number(rawValue);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    console.warn(`${key} must be a positive integer. Falling back to ${fallback}.`);
    return fallback;
  }
  return parsed;
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

function makeAgentRunId() {
  return `run-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
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
