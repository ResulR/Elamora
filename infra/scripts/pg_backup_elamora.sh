#!/usr/bin/env bash
set -euo pipefail

: "${BACKUP_DIR:?BACKUP_DIR is required}"
: "${BACKUP_DB_NAME:?BACKUP_DB_NAME is required}"
: "${BACKUP_RETENTION_DAYS:?BACKUP_RETENTION_DAYS is required}"

DB_NAME="$BACKUP_DB_NAME"
RETENTION_DAYS="$BACKUP_RETENTION_DAYS"
RETENTION_MINUTES=$((RETENTION_DAYS * 24 * 60))
DATE="$(date +%F-%H%M%S)"
OUT_FILE="${BACKUP_DIR}/${DB_NAME}-${DATE}.dump"

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

sudo -u postgres pg_dump -Fc "$DB_NAME" > "$OUT_FILE"

chmod 600 "$OUT_FILE"

find "$BACKUP_DIR"   -type f   -name "${DB_NAME}-*.dump"   -mmin +"$RETENTION_MINUTES"   -delete

echo "Backup created: $OUT_FILE"
