#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${NITRO_APP_DIR:-/home/ubuntu/Nitro-Tech-Supply}"
SCHEDULE="${NITRO_BACKUP_CRON:-17 * * * *}"
LOG_FILE="${NITRO_BACKUP_LOG:-$APP_DIR/logs/nitro-backup.log}"
MARKER="Nitro Tech Supply data backup"

log() {
  printf '[nitro-backup-cron] %s\n' "$1"
}

if [[ ! -d "$APP_DIR/.git" ]]; then
  printf 'Nitro app repo not found at %s\n' "$APP_DIR" >&2
  exit 1
fi

if [[ ! -f "$APP_DIR/server/nitro-data-backup.mjs" ]]; then
  printf 'Backup script not found at %s/server/nitro-data-backup.mjs\n' "$APP_DIR" >&2
  exit 1
fi

NPM_BIN="$(command -v npm || true)"
if [[ -z "$NPM_BIN" ]]; then
  printf 'npm command not found in PATH\n' >&2
  exit 1
fi

mkdir -p "$APP_DIR/logs"

current_cron="$(mktemp)"
next_cron="$(mktemp)"
trap 'rm -f "$current_cron" "$next_cron"' EXIT

crontab -l > "$current_cron" 2>/dev/null || true
grep -vF "$MARKER" "$current_cron" > "$next_cron" || true
printf '%s cd %s && %s run backup:data >> %s 2>&1 # %s\n' \
  "$SCHEDULE" \
  "$APP_DIR" \
  "$NPM_BIN" \
  "$LOG_FILE" \
  "$MARKER" >> "$next_cron"

crontab "$next_cron"

log "Installed cron entry:"
crontab -l | grep -F "$MARKER"
