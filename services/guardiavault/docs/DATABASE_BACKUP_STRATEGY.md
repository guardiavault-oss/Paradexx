# 💾 Database Backup Strategy

## Overview

This document outlines the recommended database backup strategy for GuardiaVault production deployments.

## Backup Requirements

### Critical Data
- User accounts and authentication data
- Vault configurations
- Guardian and beneficiary information
- Recovery keys and fragments
- Check-in history
- Claim attestations
- Death verification records

### Backup Frequency
- **Daily Backups**: Full database backup
- **Hourly Incremental Backups**: Transaction logs (if supported)
- **Before Major Deployments**: Manual backup snapshot

### Retention Policy
- **Daily Backups**: Keep for 7 days
- **Weekly Backups**: Keep for 4 weeks
- **Monthly Backups**: Keep for 12 months

---

## Platform-Managed Backup (Recommended)

### Option 1: Railway PostgreSQL

Railway provides automated backups for PostgreSQL services:

1. **Automatic Backups**
   - Navigate to your PostgreSQL service in Railway
   - Backups are automatically created
   - Available in the service dashboard

2. **Manual Backup**
   ```bash
   # Connect to Railway PostgreSQL
   railway connect postgres
   
   # Create backup
   pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

3. **Restore from Backup**
   ```bash
   # Restore backup
   psql $DATABASE_URL < backup_YYYYMMDD_HHMMSS.sql
   ```

### Option 2: Neon (Serverless PostgreSQL)

Neon provides point-in-time recovery:

1. **Automatic Backups**
   - Enabled by default
   - 7-day retention (free tier)
   - Longer retention available on paid plans

2. **Point-in-Time Recovery**
   - Restore to any point in time within retention period
   - Available in Neon dashboard

3. **Manual Export**
   ```bash
   # Export from Neon
   pg_dump $NEON_DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

### Option 3: Supabase

1. **Automatic Backups**
   - Daily backups (all plans)
   - 7-day retention (free tier)
   - Extended retention on paid plans

2. **Manual Backup**
   ```bash
   # Via Supabase CLI
   supabase db dump > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

---

## Custom Backup Strategy

If using a self-managed PostgreSQL instance:

### Automated Backup Script

Create `scripts/backup-database.sh`:

```bash
#!/bin/bash
set -e

# Configuration
BACKUP_DIR="/var/backups/guardiavault"
RETENTION_DAYS=7
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/guardiavault_$TIMESTAMP.sql"

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

# Create backup
echo "Creating database backup..."
pg_dump "$DATABASE_URL" > "$BACKUP_FILE"

# Compress backup
echo "Compressing backup..."
gzip "$BACKUP_FILE"

# Remove old backups
echo "Cleaning up old backups..."
find "$BACKUP_DIR" -name "guardiavault_*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "✅ Backup completed: ${BACKUP_FILE}.gz"
```

### Cron Job Setup

Add to crontab for daily backups:

```bash
# Daily backup at 2 AM
0 2 * * * /path/to/scripts/backup-database.sh >> /var/log/backup.log 2>&1
```

### Cloud Storage Integration

Upload backups to cloud storage (AWS S3, Google Cloud Storage, etc.):

```bash
#!/bin/bash
# Add to backup-database.sh after backup creation

# Upload to S3
aws s3 cp "${BACKUP_FILE}.gz" s3://your-backup-bucket/guardiavault/ \
  --storage-class STANDARD_IA

# Upload to Google Cloud Storage
gsutil cp "${BACKUP_FILE}.gz" gs://your-backup-bucket/guardiavault/
```

---

## Backup Verification

### Automated Verification Script

Create `scripts/verify-backup.sh`:

```bash
#!/bin/bash
BACKUP_FILE=$1

if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ Backup file not found: $BACKUP_FILE"
  exit 1
fi

# Test backup integrity
echo "Verifying backup integrity..."
if pg_restore --list "$BACKUP_FILE" > /dev/null 2>&1; then
  echo "✅ Backup file is valid"
else
  echo "❌ Backup file is corrupted"
  exit 1
fi

# Check backup size
SIZE=$(stat -f%z "$BACKUP_FILE" 2>/dev/null || stat -c%s "$BACKUP_FILE" 2>/dev/null)
if [ "$SIZE" -lt 1000 ]; then
  echo "⚠️  Warning: Backup file is very small ($SIZE bytes)"
fi

echo "✅ Backup verification complete"
```

---

## Restore Procedure

### Emergency Restore

1. **Stop Application**
   ```bash
   # Stop the application
   pm2 stop guardiavault
   # or
   systemctl stop guardiavault
   ```

2. **Create Current State Backup** (before restore)
   ```bash
   pg_dump $DATABASE_URL > emergency_backup_$(date +%Y%m%d_%H%M%S).sql
   ```

3. **Restore from Backup**
   ```bash
   # Drop existing database (if needed)
   psql $DATABASE_URL -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
   
   # Restore backup
   psql $DATABASE_URL < backup_YYYYMMDD_HHMMSS.sql
   
   # Or restore from compressed backup
   gunzip < backup_YYYYMMDD_HHMMSS.sql.gz | psql $DATABASE_URL
   ```

4. **Verify Restore**
   ```bash
   # Check table counts
   psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"
   psql $DATABASE_URL -c "SELECT COUNT(*) FROM vaults;"
   ```

5. **Restart Application**
   ```bash
   pm2 start guardiavault
   # or
   systemctl start guardiavault
   ```

---

## Disaster Recovery Plan

### Recovery Time Objective (RTO): 4 hours
### Recovery Point Objective (RPO): 24 hours

### Steps:
1. Identify failure
2. Assess backup availability
3. Restore most recent backup
4. Verify data integrity
5. Resume operations
6. Post-mortem analysis

---

## Monitoring and Alerts

### Backup Monitoring

Set up alerts for:
- Backup failures
- Backup size anomalies
- Backup age (if backup is > 25 hours old)
- Disk space for backup storage

### Health Checks

Regularly verify:
- Backups are being created
- Backup files are not corrupted
- Restore procedure works
- Backup retention is functioning

---

## Best Practices

1. **Test Restores Regularly**
   - Monthly restore tests in staging environment
   - Document any issues encountered

2. **Multiple Backup Locations**
   - Local storage (fast restore)
   - Cloud storage (off-site backup)
   - Different geographic regions (for disaster recovery)

3. **Encrypt Backups**
   ```bash
   # Encrypt backup before storage
   pg_dump $DATABASE_URL | gzip | openssl enc -aes-256-cbc -salt -out backup_encrypted.gz
   ```

4. **Document Backup Process**
   - Update this document with platform-specific steps
   - Include contact information for database administrators
   - Document restore procedures

5. **Automate Everything**
   - Use cron jobs or scheduled tasks
   - Automate verification
   - Automate cleanup

---

## Backup Checklist

Before going to production:

- [ ] Backup strategy chosen (platform-managed or custom)
- [ ] Automated backups configured
- [ ] Backup verification script created and tested
- [ ] Restore procedure tested in staging
- [ ] Backup retention policy configured
- [ ] Monitoring and alerts set up
- [ ] Backup documentation reviewed
- [ ] Team trained on restore procedure
- [ ] Emergency contacts documented

---

## Platform-Specific Quick Reference

### Railway
- **Dashboard**: Railway Dashboard > PostgreSQL Service > Backups
- **CLI**: `railway connect postgres`
- **Documentation**: https://docs.railway.app/databases/postgresql

### Neon
- **Dashboard**: Neon Console > Project > Backups
- **Point-in-Time Recovery**: Available in dashboard
- **Documentation**: https://neon.tech/docs/guides/backup-restore

### Supabase
- **Dashboard**: Supabase Dashboard > Project > Database > Backups
- **CLI**: `supabase db dump`
- **Documentation**: https://supabase.com/docs/guides/platform/backups

---

**Last Updated**: 2024-01-XX
**Next Review**: Quarterly

