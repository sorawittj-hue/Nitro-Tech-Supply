import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { mkdir, readdir, readFile, rename, stat, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
loadEnvFile(path.join(ROOT_DIR, '.env'));
loadEnvFile(path.join(ROOT_DIR, '.env.local'));

const SOURCE_FILE = resolveWorkspacePath(process.env.NITRO_BACKUP_SOURCE || 'db.json');
const BACKUP_DIR = resolveWorkspacePath(process.env.NITRO_BACKUP_DIR || 'backups/nitro-data');
const RETENTION_DAYS = readPositiveInteger(process.env.NITRO_BACKUP_RETENTION_DAYS || '30', 'NITRO_BACKUP_RETENTION_DAYS');

async function main() {
  const raw = await readFile(SOURCE_FILE, 'utf8');
  validateJson(raw);

  const checksum = createHash('sha256').update(raw).digest('hex');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupName = `db-${timestamp}-${checksum.slice(0, 12)}.json`;
  const targetFile = path.join(BACKUP_DIR, backupName);
  const tempFile = `${targetFile}.tmp`;

  await mkdir(BACKUP_DIR, { recursive: true });
  await writeFile(tempFile, raw, { encoding: 'utf8', mode: 0o600 });
  await rename(tempFile, targetFile);

  const removed = await removeExpiredBackups(BACKUP_DIR, RETENTION_DAYS, targetFile);
  const sourceStat = await stat(SOURCE_FILE);

  console.log(JSON.stringify({
    status: 'ok',
    source: SOURCE_FILE,
    backup: targetFile,
    bytes: sourceStat.size,
    sha256: checksum,
    retentionDays: RETENTION_DAYS,
    removed,
  }));
}

function validateJson(raw) {
  try {
    JSON.parse(raw);
  } catch (error) {
    throw new Error(`Backup source is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function removeExpiredBackups(backupDir, retentionDays, currentBackup) {
  const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
  const entries = await readdir(backupDir, { withFileTypes: true });
  let removed = 0;

  await Promise.all(entries.map(async entry => {
    if (!entry.isFile() || !entry.name.startsWith('db-') || !entry.name.endsWith('.json')) return;
    const candidate = path.join(backupDir, entry.name);
    if (candidate === currentBackup) return;

    const candidateStat = await stat(candidate);
    if (candidateStat.mtimeMs >= cutoff) return;

    await unlink(candidate);
    removed += 1;
  }));

  return removed;
}

function resolveWorkspacePath(value) {
  const resolved = path.resolve(ROOT_DIR, value);
  const relative = path.relative(ROOT_DIR, resolved);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`${value} resolves outside Nitro workspace.`);
  }
  return resolved;
}

function readPositiveInteger(value, label) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${label} must be a positive integer.`);
  }
  return parsed;
}

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;
  const content = readFileSync(filePath, 'utf8');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || !line.includes('=')) continue;
    const [key, ...parts] = line.split('=');
    if (!process.env[key]) {
      process.env[key] = parts.join('=').replace(/^["']|["']$/g, '');
    }
  }
}

main().catch(error => {
  console.error(JSON.stringify({
    status: 'error',
    message: error instanceof Error ? error.message : String(error),
  }));
  process.exitCode = 1;
});
