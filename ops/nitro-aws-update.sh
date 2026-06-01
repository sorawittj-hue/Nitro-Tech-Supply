#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${NITRO_APP_DIR:-/home/ubuntu/Nitro-Tech-Supply}"
PLUGIN_NAME="${NITRO_PLUGIN_NAME:-nitro-tech-supply}"
REPO="${NITRO_REPO:-sorawittj-hue/Nitro-Tech-Supply}"
HERMES_BIN="${HERMES_BIN:-/home/ubuntu/.local/bin/hermes}"

export PATH="/home/ubuntu/hermes-agent/venv/bin:/home/ubuntu/.local/bin:${PATH}"

log() {
  printf '[nitro-update] %s\n' "$1"
}

if [[ ! -d "$APP_DIR/.git" ]]; then
  printf 'App repo not found at %s\n' "$APP_DIR" >&2
  exit 1
fi

if [[ ! -x "$HERMES_BIN" ]]; then
  printf 'Hermes binary not found at %s\n' "$HERMES_BIN" >&2
  exit 1
fi

log "Updating frontend repo"
git -C "$APP_DIR" fetch origin main
git -C "$APP_DIR" pull --ff-only origin main

log "Installing dependencies"
npm --prefix "$APP_DIR" install

log "Building frontend"
npm --prefix "$APP_DIR" run build

log "Updating Hermes plugin from GitHub"
"$HERMES_BIN" plugins install "$REPO" --force --enable

log "Restarting services"
sudo systemctl restart hermes-gateway.service
sudo systemctl restart nitro-proxy.service
sudo systemctl restart nitro-tunnel.service || true

log "Status"
systemctl is-active hermes-gateway.service
systemctl is-active nitro-proxy.service
systemctl is-active nitro-tunnel.service || true

log "Done"
