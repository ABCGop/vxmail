# VxMail Backup & Disaster Recovery Specification

## Backup Strategy Summary

| Data Layer | Storage Mechanism | Backup Frequency | Retention Policy | Target Location |
| :--- | :--- | :--- | :--- | :--- |
| **PostgreSQL Database** | Logical dump (`pg_dump`) + WAL archiving | Daily full, continuous WAL | 30 days daily, 12 months monthly | Offsite S3 Bucket (Glacier) |
| **Redis Cache/Queues** | RDB snapshots + AOF | Every 5 minutes (AOF every 1s) | 7 days | Local persistent volume |
| **Email Attachments** | Object storage (S3/MinIO) | Continuous object versioning | Indefinite / until account deletion | Geo-replicated S3 bucket |
| **Stalwart Configuration** | Git repository + encrypted secret archive | Upon every change | Indefinite | Encrypted backup archive |
| **DKIM Private Keys** | Encrypted keyfile (`chmod 600`) | Static backup upon rotation | Indefinite | Offline air-gapped vault |

---

## 1. Automated PostgreSQL Backup Script

Run via cron on the database server:

```bash
#!/bin/bash
set -eo pipefail

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/var/backups/vxmail"
FILENAME="vxmail_db_${TIMESTAMP}.sql.gz"

mkdir -p "${BACKUP_DIR}"

# Execute pg_dump with compression
PGPASSWORD="${POSTGRES_PASSWORD}" pg_dump -h localhost -U vxmail -d vxmail -F c -b -v | gzip > "${BACKUP_DIR}/${FILENAME}"

# Sync to encrypted offsite cloud storage
aws s3 cp "${BACKUP_DIR}/${FILENAME}" "s3://vxmail-backups/postgres/${FILENAME}" --storage-class STANDARD_IA

# Clean local backups older than 7 days
find "${BACKUP_DIR}" -type f -name "vxmail_db_*.sql.gz" -mtime +7 -delete

echo "[VxMail Backup] Database backup completed: ${FILENAME}"
```

---

## 2. Restoring PostgreSQL from Backup

In case of catastrophic database loss:

```bash
# 1. Stop services writing to DB
docker compose stop web worker stalwart

# 2. Re-create clean database
docker compose exec -T postgres dropdb -U vxmail vxmail || true
docker compose exec -T postgres createdb -U vxmail vxmail

# 3. Restore from backup dump
gunzip -c vxmail_db_20260926.sql.gz | docker compose exec -T postgres pg_restore -U vxmail -d vxmail -v

# 4. Restart services
docker compose start web worker stalwart
```

---

## 3. DKIM Private Key Backup & Emergency Vault

DKIM keys are critical for email deliverability. If lost, outbound emails will be rejected by foreign MTAs.

```bash
# Backup key with GPG encryption
gpg --symmetric --cipher-algo AES256 /opt/stalwart-mail/etc/dkim/vxmail2026.private.key
# Securely store vxmail2026.private.key.gpg in password manager / cold storage
```
