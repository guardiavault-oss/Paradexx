# Backup & Recovery Procedures

This document outlines the backup and recovery procedures for GuardiaVault to ensure business continuity and data protection.

## Overview

GuardiaVault handles sensitive cryptographic data and requires robust backup and recovery procedures:

- **Recovery Time Objective (RTO)**: 4 hours
- **Recovery Point Objective (RPO)**: 24 hours (daily backups)
- **Critical Data**: Database (users, vaults, fragments, attestations)
- **Non-Critical Data**: Logs, temporary files

## Backup Strategy

### Database Backups

The PostgreSQL database contains all critical application data:

- User accounts and authentication
- Vault configurations
- Guardian and beneficiary information
- Encrypted fragments (metadata only)
- Check-in history
- Claims and attestations

### Backup Frequency

| Backup Type | Frequency | Retention | Location |
|-------------|-----------|-----------|----------|
| Full Backup | Daily | 30 days | Cloud Storage |
| Incremental | Every 6 hours | 7 days | Cloud Storage |
| Weekly Archive | Weekly | 12 months | Long-term Storage |
| Monthly Archive | Monthly | 7 years | Archive Storage |

## Automated Backups

### Using Docker Compose (Production)

The production `docker-compose.prod.yml` includes an automated backup service:

```yaml
backup:
  image: postgres:16-alpine
  command: >
    sh -c "while true; do
      pg_dump -h postgres -U guardiavault guardiavault > /backups/backup_$$(date +%Y%m%d_%H%M%S).sql;
      find /backups -name 'backup_*.sql' -mtime +7 -delete;
      sleep 86400;
    done"
```

### Manual Backup Script

Create a backup script `scripts/backup.sh`:

```bash
#!/bin/bash
# Backup GuardiaVault database

# Configuration
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.sql"
RETENTION_DAYS=30

# Ensure backup directory exists
mkdir -p "${BACKUP_DIR}"

# Create backup
echo "Creating database backup..."
pg_dump "${DATABASE_URL}" > "${BACKUP_FILE}"

# Compress backup
gzip "${BACKUP_FILE}"
BACKUP_FILE="${BACKUP_FILE}.gz"

# Upload to cloud storage (example using AWS S3)
if [ -n "${S3_BACKUP_BUCKET}" ]; then
  echo "Uploading to S3..."
  aws s3 cp "${BACKUP_FILE}" "s3://${S3_BACKUP_BUCKET}/backups/"
fi

# Cleanup old backups
echo "Cleaning up old backups..."
find "${BACKUP_DIR}" -name "backup_*.sql.gz" -mtime +${RETENTION_DAYS} -delete

echo "Backup completed: ${BACKUP_FILE}"
```

### Cron Job Setup

Add to crontab for automated daily backups:

```bash
# Daily backup at 2 AM
0 2 * * * /path/to/scripts/backup.sh >> /var/log/guardiavault-backup.log 2>&1
```

## Backup Procedures

### Full Database Backup

```bash
# Using pg_dump
pg_dump "${DATABASE_URL}" > backup_$(date +%Y%m%d_%H%M%S).sql

# Using Docker
docker-compose exec postgres pg_dump -U guardiavault guardiavault > backup.sql

# Compressed backup
pg_dump "${DATABASE_URL}" | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

### Backup Specific Tables

```bash
# Backup users table
pg_dump "${DATABASE_URL}" -t users > users_backup.sql

# Backup vaults and related data
pg_dump "${DATABASE_URL}" -t vaults -t parties -t fragments > vaults_backup.sql
```

### Backup with Compression

```bash
# Compressed backup
pg_dump "${DATABASE_URL}" | gzip > backup.sql.gz

# Using pg_dump with custom format (smaller, faster)
pg_dump "${DATABASE_URL}" -Fc > backup.dump
```

## Cloud Backup Storage

### AWS S3

```bash
# Upload backup to S3
aws s3 cp backup.sql.gz s3://guardiavault-backups/database/

# Download from S3
aws s3 cp s3://guardiavault-backups/database/backup.sql.gz .
```

### Google Cloud Storage

```bash
# Upload backup to GCS
gsutil cp backup.sql.gz gs://guardiavault-backups/

# Download from GCS
gsutil cp gs://guardiavault-backups/backup.sql.gz .
```

### Encrypted Backups

For sensitive data, encrypt backups:

```bash
# Encrypt before uploading
pg_dump "${DATABASE_URL}" | gzip | openssl enc -aes-256-cbc -salt -k "${BACKUP_PASSWORD}" > backup.sql.gz.enc

# Decrypt backup
openssl enc -d -aes-256-cbc -k "${BACKUP_PASSWORD}" < backup.sql.gz.enc | gunzip > backup.sql
```

## Recovery Procedures

### Full Database Restore

```bash
# From SQL file
psql "${DATABASE_URL}" < backup.sql

# From compressed backup
gunzip < backup.sql.gz | psql "${DATABASE_URL}"

# Using Docker
docker-compose exec -T postgres psql -U guardiavault guardiavault < backup.sql
```

### Restore Specific Tables

```bash
# Restore users table
psql "${DATABASE_URL}" -c "DROP TABLE IF EXISTS users CASCADE;"
psql "${DATABASE_URL}" < users_backup.sql
```

### Point-in-Time Recovery

For point-in-time recovery, you'll need:

1. **Base backup** (full database dump)
2. **WAL archives** (write-ahead logs)
3. **PostgreSQL configuration** with WAL archiving enabled

**Example Configuration** (`postgresql.conf`):
```conf
wal_level = replica
archive_mode = on
archive_command = 'cp %p /path/to/wal_archive/%f'
```

## Disaster Recovery Plan

### Scenario 1: Database Corruption

1. **Stop the application**:
   ```bash
   docker-compose stop app
   ```

2. **Identify the issue**:
   ```bash
   docker-compose exec postgres psql -U guardiavault -c "\l"
   ```

3. **Restore from backup**:
   ```bash
   # Find latest backup
   ls -lt backups/ | head -5
   
   # Restore
   gunzip < backups/backup_YYYYMMDD_HHMMSS.sql.gz | docker-compose exec -T postgres psql -U guardiavault guardiavault
   ```

4. **Run migrations** (if needed):
   ```bash
   docker-compose exec app pnpm run db:migrate
   ```

5. **Verify data**:
   ```bash
   docker-compose exec postgres psql -U guardiavault -c "SELECT COUNT(*) FROM users;"
   ```

6. **Restart application**:
   ```bash
   docker-compose start app
   ```

### Scenario 2: Complete System Failure

1. **Provision new infrastructure**
2. **Restore database**:
   ```bash
   # Download latest backup from cloud storage
   aws s3 cp s3://guardiavault-backups/latest/backup.sql.gz .
   
   # Restore
   gunzip < backup.sql.gz | psql "${DATABASE_URL}"
   ```

3. **Restore application**:
   ```bash
   # Deploy application
   docker-compose up -d
   ```

4. **Run migrations**:
   ```bash
   docker-compose exec app pnpm run db:migrate
   ```

5. **Verify health**:
   ```bash
   curl http://your-domain/health
   curl http://your-domain/ready
   ```

### Scenario 3: Partial Data Loss

1. **Identify affected data**
2. **Restore specific tables**:
   ```bash
   # Restore users table only
   psql "${DATABASE_URL}" < users_backup.sql
   ```

3. **Reconcile data** (may require manual intervention)
4. **Verify integrity**

## Backup Verification

### Automated Backup Testing

Create a script to verify backups:

```bash
#!/bin/bash
# Verify backup integrity

BACKUP_FILE=$1

if [ -z "${BACKUP_FILE}" ]; then
  echo "Usage: verify_backup.sh <backup_file>"
  exit 1
fi

# Create temporary database
TEMP_DB="guardiavault_verify_$$"
createdb "${TEMP_DB}"

# Restore backup to temp database
echo "Restoring backup to temporary database..."
gunzip < "${BACKUP_FILE}" | psql "${TEMP_DB}"

# Run integrity checks
echo "Running integrity checks..."
psql "${TEMP_DB}" <<EOF
-- Check table counts
SELECT 'users' as table_name, COUNT(*) FROM users
UNION ALL
SELECT 'vaults', COUNT(*) FROM vaults
UNION ALL
SELECT 'parties', COUNT(*) FROM parties;
EOF

# Cleanup
dropdb "${TEMP_DB}"

echo "Backup verification complete!"
```

### Manual Verification

```bash
# Check backup file integrity
file backup.sql.gz
gzip -t backup.sql.gz

# Preview backup contents
gunzip < backup.sql.gz | head -100

# Check backup size
ls -lh backup.sql.gz
```

## Recovery Testing

### Regular Recovery Drills

Perform recovery testing quarterly:

1. **Create test environment**
2. **Restore latest backup**
3. **Verify application functionality**
4. **Document issues and improvements**
5. **Update procedures as needed**

### Test Checklist

- [ ] Backup restore successful
- [ ] Application starts correctly
- [ ] Database integrity verified
- [ ] User authentication works
- [ ] Vault data accessible
- [ ] All services operational
- [ ] Performance acceptable
- [ ] Documentation updated

## Backup Monitoring

### Backup Status Monitoring

Set up monitoring for backup jobs:

```bash
# Check last backup time
ls -lt backups/ | head -1

# Verify backup was created today
find backups/ -name "*.sql.gz" -mtime -1

# Send alert if no backup in 24 hours
if [ $(find backups/ -name "*.sql.gz" -mtime -1 | wc -l) -eq 0 ]; then
  echo "ALERT: No backup created in last 24 hours!"
  # Send notification (email, Slack, etc.)
fi
```

### Health Checks

Add backup verification to health checks:

```bash
# In monitoring script
LAST_BACKUP=$(find backups/ -name "*.sql.gz" -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -d' ' -f2)
BACKUP_AGE=$(( ($(date +%s) - $(stat -c %Y "$LAST_BACKUP")) / 3600 ))

if [ $BACKUP_AGE -gt 24 ]; then
  echo "WARNING: Last backup is $BACKUP_AGE hours old"
fi
```

## Security Considerations

### Backup Encryption

- Encrypt backups at rest
- Use strong encryption keys
- Rotate encryption keys regularly
- Store keys separately from backups

### Access Control

- Limit backup access to authorized personnel
- Use least privilege principle
- Audit backup access logs
- Secure backup storage locations

### Backup Retention

- Follow data retention policies
- Securely delete old backups
- Document deletion procedures
- Verify deletion completion

## Compliance Requirements

### Data Retention

- **Active Backups**: 30 days
- **Archive Backups**: 7 years (for compliance)
- **Deleted User Data**: Follow GDPR/privacy requirements

### Audit Trail

- Log all backup operations
- Track backup access
- Document recovery procedures
- Maintain recovery test records

## Backup Storage Locations

### Primary Storage

- **Cloud Storage**: AWS S3, Google Cloud Storage, Azure Blob
- **Replication**: Multi-region replication for redundancy
- **Access**: Restricted to authorized systems only

### Secondary Storage

- **Off-site Archives**: Long-term storage for compliance
- **Local Copies**: For quick recovery (encrypted)

## RTO/RPO Targets

### Recovery Time Objective (RTO)

- **Target**: 4 hours
- **Critical**: Restore database and application
- **Non-Critical**: Restore logs, metrics (24 hours)

### Recovery Point Objective (RPO)

- **Target**: 24 hours (daily backups)
- **Critical Systems**: Consider more frequent backups (6 hours)
- **Acceptable Loss**: Maximum 24 hours of data

## Backup Automation Script

See `scripts/backup.sh` for a complete automated backup script.

## Additional Resources

- **PostgreSQL Backup Documentation**: https://www.postgresql.org/docs/current/backup.html
- **AWS RDS Backup Guide**: https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_WorkingWithAutomatedBackups.html
- **Docker Backup Guide**: https://docs.docker.com/storage/volumes/#backup-restore-or-migrate-data-volumes

---

**Important**: Test your backup and recovery procedures regularly. A backup is only as good as your ability to restore it!

