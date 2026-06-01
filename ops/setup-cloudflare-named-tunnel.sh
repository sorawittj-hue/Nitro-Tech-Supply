#!/usr/bin/env bash
set -euo pipefail

TUNNEL_NAME="${NITRO_TUNNEL_NAME:-nitro-tech-supply}"
HOSTNAME="${1:-${NITRO_HOSTNAME:-}}"
ORIGIN_URL="${NITRO_ORIGIN_URL:-http://localhost:8787}"
CLOUDFLARED_BIN="${CLOUDFLARED_BIN:-/usr/local/bin/cloudflared}"
CONFIG_DIR="${CLOUDFLARED_CONFIG_DIR:-/home/ubuntu/.cloudflared}"
CONFIG_FILE="${CONFIG_DIR}/config.yml"
SERVICE_FILE="/etc/systemd/system/nitro-tunnel.service"

log() {
  printf '[nitro-cloudflare] %s\n' "$1"
}

if [[ -z "$HOSTNAME" ]]; then
  printf 'Usage: %s your-domain.example.com\n' "$0" >&2
  printf 'Example: %s nitro.yourdomain.com\n' "$0" >&2
  exit 1
fi

if [[ ! -x "$CLOUDFLARED_BIN" ]]; then
  printf 'cloudflared not found at %s\n' "$CLOUDFLARED_BIN" >&2
  exit 1
fi

mkdir -p "$CONFIG_DIR"

if [[ ! -f "${CONFIG_DIR}/cert.pem" ]]; then
  log "Cloudflare login is required once. Open the URL shown by cloudflared, choose your domain, then rerun this script."
  "$CLOUDFLARED_BIN" tunnel login
  if [[ ! -f "${CONFIG_DIR}/cert.pem" ]]; then
    printf 'Cloudflare cert.pem was not created. Rerun after login succeeds.\n' >&2
    exit 1
  fi
fi

if ! "$CLOUDFLARED_BIN" tunnel info "$TUNNEL_NAME" >/dev/null 2>&1; then
  log "Creating named tunnel: ${TUNNEL_NAME}"
  "$CLOUDFLARED_BIN" tunnel create "$TUNNEL_NAME"
else
  log "Named tunnel already exists: ${TUNNEL_NAME}"
fi

TUNNEL_ID="$("$CLOUDFLARED_BIN" tunnel info "$TUNNEL_NAME" 2>/dev/null | awk '/^[[:space:]]*ID:/ {print $2; exit}')"
if [[ -z "$TUNNEL_ID" ]]; then
  TUNNEL_ID="$("$CLOUDFLARED_BIN" tunnel list --output json | python3 -c 'import json,sys; data=json.load(sys.stdin); name=sys.argv[1]; print(next((x["id"] for x in data if x.get("name")==name), ""))' "$TUNNEL_NAME")"
fi

if [[ -z "$TUNNEL_ID" ]]; then
  printf 'Could not resolve Cloudflare tunnel ID for %s\n' "$TUNNEL_NAME" >&2
  exit 1
fi

CREDENTIALS_FILE="${CONFIG_DIR}/${TUNNEL_ID}.json"
if [[ ! -f "$CREDENTIALS_FILE" ]]; then
  printf 'Credentials file not found: %s\n' "$CREDENTIALS_FILE" >&2
  exit 1
fi

log "Writing config: ${CONFIG_FILE}"
cat > "$CONFIG_FILE" <<EOF
tunnel: ${TUNNEL_ID}
credentials-file: ${CREDENTIALS_FILE}

ingress:
  - hostname: ${HOSTNAME}
    service: ${ORIGIN_URL}
  - service: http_status:404
EOF

log "Creating DNS route: ${HOSTNAME}"
"$CLOUDFLARED_BIN" tunnel route dns "$TUNNEL_NAME" "$HOSTNAME"

log "Installing systemd service"
sudo tee "$SERVICE_FILE" >/dev/null <<EOF
[Unit]
Description=Cloudflare Named Tunnel for Nitro Tech Supply
After=network-online.target nitro-proxy.service
Wants=network-online.target

[Service]
Type=simple
User=ubuntu
Group=ubuntu
ExecStart=${CLOUDFLARED_BIN} tunnel --config ${CONFIG_FILE} run ${TUNNEL_NAME}
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable nitro-tunnel.service
sudo systemctl restart nitro-tunnel.service

log "Tunnel status"
systemctl is-active nitro-tunnel.service
log "Done: https://${HOSTNAME}"
