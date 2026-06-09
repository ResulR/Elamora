#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="/var/backups/elamora"
DB_NAME="elamora_db"
RETENTION_DAYS=14
DATE="$(date +%F-%H%M%S)"
OUT_FILE="${BACKUP_DIR}/${DB_NAME}-${DATE}.dump"

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

sudo -u postgres pg_dump -Fc "$DB_NAME" > "$OUT_FILE"

chmod 600 "$OUT_FILE"

find "$BACKUP_DIR" -type f -name "${DB_NAME}-*.dump" -mtime +"$RETENTION_DAYS" -delete

echo "Backup created: $OUT_FILE"
