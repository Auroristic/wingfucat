#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# wingfucat - Ubuntu 22.04 LTS Production Setup Script
#
# Target host: nei (1GB VPS)
# Domain: wingfu.duckdns.org (or $DOMAIN)
# Stack: PocketBase (unprivileged systemd service) + Stock Caddy
# ==============================================================================

PB_VERSION="${PB_VERSION:-0.25.9}"
APP_DIR="/opt/couple-chat"
APP_USER="couplechat"
APP_GROUP="couplechat"
DOMAIN="${DOMAIN:-wingfu.duckdns.org}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@wingfu.local}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-ChangeMeNow123!}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

log() {
    echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] $*"
}

error() {
    echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] ERROR: $*" >&2
}

# 1. Root and architecture verification
if [[ $EUID -ne 0 ]]; then
    error "setup.sh must be run as root (e.g. sudo bash deploy/setup.sh)"
    exit 1
fi

ARCH="$(uname -m)"
if [[ "${ARCH}" != "x86_64" ]]; then
    error "Unsupported architecture: ${ARCH}. PocketBase amd64 required."
    exit 1
fi

log "Starting couple-chat production setup for domain: ${DOMAIN}..."

# 2. Install base system dependencies
log "Updating package lists and installing required system packages..."
apt-get update -qq
apt-get install -y -qq curl unzip rsync ca-certificates gnupg debian-keyring debian-archive-keyring apt-transport-https

# 3. Install stock Caddy if not installed
if ! command -v caddy >/dev/null 2>&1; then
    log "Installing Caddy from official repository..."
    curl -1sLF 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
    curl -1sLF 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
    apt-get update -qq
    apt-get install -y -qq caddy
else
    log "Caddy is already installed ($(caddy version))."
fi

# 4. Create unprivileged system user
if ! id "${APP_USER}" >/dev/null 2>&1; then
    log "Creating unprivileged system user '${APP_USER}'..."
    useradd -r -s /usr/sbin/nologin couplechat
else
    log "User '${APP_USER}' already exists."
fi

# 5. Create application directory structure
log "Creating application directories at ${APP_DIR}..."
mkdir -p /opt/couple-chat/pb_data/backups
mkdir -p /opt/couple-chat/pb_public

# 6. Download PocketBase v0.25+ Linux amd64 binary
if [[ ! -f "/opt/couple-chat/pocketbase" ]]; then
    PB_ARCHIVE_URL="https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip"
    log "Downloading PocketBase v${PB_VERSION} from ${PB_ARCHIVE_URL}..."
    TMP_PB_DIR="$(mktemp -d)"
    curl -sSL "${PB_ARCHIVE_URL}" -o "${TMP_PB_DIR}/pocketbase.zip"
    unzip -q -o "${TMP_PB_DIR}/pocketbase.zip" -d "${TMP_PB_DIR}"
    mv "${TMP_PB_DIR}/pocketbase" "/opt/couple-chat/pocketbase"
    chmod +x "/opt/couple-chat/pocketbase"
    rm -rf "${TMP_PB_DIR}"
    log "PocketBase binary installed to /opt/couple-chat/pocketbase."
else
    log "PocketBase binary already present at /opt/couple-chat/pocketbase."
fi

# 7. Deploy frontend static assets (if built)
if [[ -d "${PROJECT_DIR}/frontend/dist" ]]; then
    log "Deploying built React frontend from ${PROJECT_DIR}/frontend/dist to /opt/couple-chat/pb_public..."
    cp -r "${PROJECT_DIR}/frontend/dist"/* "/opt/couple-chat/pb_public/"
else
    log "Notice: No frontend/dist found. Ensure 'npm run build' is run before deployment."
    if [[ ! -f "/opt/couple-chat/pb_public/index.html" ]]; then
        echo "<h1>Couple Chat</h1><p>Frontend assets pending build.</p>" > "/opt/couple-chat/pb_public/index.html"
    fi
fi

# 8. Seed initial superuser / admin
log "Ensuring PocketBase superuser exists..."
if [[ -x "/opt/couple-chat/pocketbase" ]]; then
    # PocketBase v0.25+ supports 'superuser create' CLI command
    "/opt/couple-chat/pocketbase" superuser create "${ADMIN_EMAIL}" "${ADMIN_PASSWORD}" --dir="/opt/couple-chat/pb_data" 2>/dev/null || true
fi

# 9. Set strict directory permissions
log "Setting ownership and permissions for ${APP_DIR}..."
chown -R "${APP_USER}:${APP_GROUP}" "${APP_DIR}"
chmod 750 "${APP_DIR}"
chmod 700 /opt/couple-chat/pb_data

# 10. Install systemd service
log "Installing couple-chat.service to /etc/systemd/system/..."
cp "${SCRIPT_DIR}/couple-chat.service" /etc/systemd/system/couple-chat.service
systemctl daemon-reload
systemctl enable couple-chat.service
systemctl restart couple-chat.service
log "couple-chat.service enabled and started."

# 11. Configure and reload Caddy
log "Deploying Caddyfile to /etc/caddy/Caddyfile..."
cp "${SCRIPT_DIR}/Caddyfile" /etc/caddy/Caddyfile

# Allow overriding DOMAIN via /etc/default/caddy environment file
mkdir -p /etc/default
cat << ENV_EOF > /etc/default/caddy
DOMAIN=${DOMAIN}
ENV_EOF

systemctl daemon-reload
systemctl enable caddy
systemctl reload caddy || systemctl restart caddy
log "Caddy reloaded successfully."

# 12. Install backup sync script
log "Installing backup sync script..."
cp "${SCRIPT_DIR}/backup-sync.sh" /usr/local/bin/couple-chat-backup-sync
chmod +x /usr/local/bin/couple-chat-backup-sync

# 13. Configure PocketBase settings (core rate limits & daily backups)
log "Waiting for PocketBase service to become responsive on 127.0.0.1:8090..."
for _ in {1..15}; do
    if curl -s "http://127.0.0.1:8090/api/health" >/dev/null 2>&1; then
        break
    fi
    sleep 1
done

AUTH_TOKEN=$(curl -s -X POST "http://127.0.0.1:8090/api/collections/_superusers/auth-with-password" \
    -H "Content-Type: application/json" \
    -d "{\"identity\":\"${ADMIN_EMAIL}\",\"password\":\"${ADMIN_PASSWORD}\"}" \
    | grep -o '"token":"[^"]*"' | cut -d'"' -f4 || true)

if [[ -z "${AUTH_TOKEN}" ]]; then
    AUTH_TOKEN=$(curl -s -X POST "http://127.0.0.1:8090/api/admins/auth-with-password" \
        -H "Content-Type: application/json" \
        -d "{\"identity\":\"${ADMIN_EMAIL}\",\"password\":\"${ADMIN_PASSWORD}\"}" \
        | grep -o '"token":"[^"]*"' | cut -d'"' -f4 || true)
fi

if [[ -n "${AUTH_TOKEN}" ]]; then
    log "Configuring PocketBase rate limits and backup schedule via API..."
    curl -s -X PATCH "http://127.0.0.1:8090/api/settings" \
        -H "Authorization: ${AUTH_TOKEN}" \
        -H "Content-Type: application/json" \
        -d '{
            "backups": {
                "cron": "0 3 * * *",
                "cronMaxKeep": 7
            },
            "rateLimits": {
                "enabled": true,
                "rules": [
                    {
                        "label": "/api/collections/users/auth-with-password",
                        "audience": "",
                        "duration": 60,
                        "maxRequests": 5
                    }
                ]
            }
        }' >/dev/null || log "Notice: Settings PATCH returned non-zero, check admin UI."

    # Run schema and seed if node is installed and scripts are available
    if command -v node >/dev/null 2>&1; then
        if [[ -f "${PROJECT_DIR}/backend/setup_schema.js" ]]; then
            log "Configuring collections and security rules..."
            node "${PROJECT_DIR}/backend/setup_schema.js" "http://127.0.0.1:8090" "${ADMIN_EMAIL}" "${ADMIN_PASSWORD}" || true
        fi
        if [[ -f "${PROJECT_DIR}/backend/seed.js" ]]; then
            log "Seeding partner accounts..."
            node "${PROJECT_DIR}/backend/seed.js" "http://127.0.0.1:8090" "${ADMIN_EMAIL}" "${ADMIN_PASSWORD}" || true
        fi
    fi
else
    log "Superuser API authentication not ready yet. Schema & settings can be applied post-boot."
fi

log "======================================================================"
log "Production deployment setup complete!"
log "App URL: https://${DOMAIN}"
log "Admin dashboard is blocked externally. Access via SSH tunnel:"
log "  ssh -L 8090:127.0.0.1:8090 user@${DOMAIN}"
log "  Then browse: http://localhost:8090/_/"
log "======================================================================"
