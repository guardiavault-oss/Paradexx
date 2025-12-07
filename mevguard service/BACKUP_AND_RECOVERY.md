# Backup and Disaster Recovery Guide

## Overview

This document outlines the backup and disaster recovery procedures for the MEV Protection Service.

## Backup Strategy

### 1. Database Backups

#### Automated Daily Backups

```bash
# Create backup script
cat > scripts/backup_database.sh <<'EOF'
#!/bin/bash
set -e

# Configuration
BACKUP_DIR="/app/backups/database"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_NAME="${DB_NAME:-mev_protection}"
DB_USER="${DB_USER}"
DB_PASSWORD="${DB_PASSWORD}"
RETENTION_DAYS=30

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup database
echo "Starting database backup..."
PGPASSWORD="$DB_PASSWORD" pg_dump \
    -h postgres \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --no-owner \
    --no-acl \
    --format=custom \
    --file="$BACKUP_DIR/mev_protection_${TIMESTAMP}.dump"

# Compress backup
gzip "$BACKUP_DIR/mev_protection_${TIMESTAMP}.dump"

# Remove old backups
find "$BACKUP_DIR" -name "*.dump.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completed: mev_protection_${TIMESTAMP}.dump.gz"

# Upload to S3 (if configured)
if [ -n "$AWS_S3_BUCKET" ]; then
    aws s3 cp \
        "$BACKUP_DIR/mev_protection_${TIMESTAMP}.dump.gz" \
        "s3://$AWS_S3_BUCKET/backups/database/" \
        --storage-class STANDARD_IA
    echo "Backup uploaded to S3"
fi
EOF

chmod +x scripts/backup_database.sh
```

#### Schedule with Cron

```bash
# Add to crontab
0 2 * * * /app/scripts/backup_database.sh >> /var/log/backup.log 2>&1
```

### 2. Redis Data Backup

```bash
# Redis backup script
cat > scripts/backup_redis.sh <<'EOF'
#!/bin/bash
set -e

BACKUP_DIR="/app/backups/redis"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"

# Trigger Redis BGSAVE
docker-compose exec redis redis-cli BGSAVE

# Wait for save to complete
sleep 5

# Copy RDB file
docker cp mev-protection-redis:/data/dump.rdb \
    "$BACKUP_DIR/redis_${TIMESTAMP}.rdb"

# Compress
gzip "$BACKUP_DIR/redis_${TIMESTAMP}.rdb"

echo "Redis backup completed"
EOF

chmod +x scripts/backup_redis.sh
```

### 3. Configuration Backups

```bash
# Backup configuration files
cat > scripts/backup_config.sh <<'EOF'
#!/bin/bash
set -e

BACKUP_DIR="/app/backups/config"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"

# Backup critical configuration files (excluding secrets)
tar -czf "$BACKUP_DIR/config_${TIMESTAMP}.tar.gz" \
    docker-compose.yml \
    nginx/nginx.conf \
    monitoring/prometheus.yml \
    init-db.sql \
    requirements.txt \
    alembic.ini

echo "Configuration backup completed"
EOF

chmod +x scripts/backup_config.sh
```

## Recovery Procedures

### 1. Database Recovery

#### Full Database Restore

```bash
#!/bin/bash
# Restore from backup file

BACKUP_FILE="$1"

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup_file.dump.gz>"
    exit 1
fi

# Decompress if needed
if [[ "$BACKUP_FILE" == *.gz ]]; then
    gunzip -c "$BACKUP_FILE" > /tmp/restore.dump
    BACKUP_FILE="/tmp/restore.dump"
fi

# Stop application
docker-compose stop mev-protection

# Drop and recreate database
docker-compose exec postgres psql -U postgres -c "DROP DATABASE IF EXISTS mev_protection;"
docker-compose exec postgres psql -U postgres -c "CREATE DATABASE mev_protection OWNER mev_user;"

# Restore from backup
docker-compose exec -T postgres pg_restore \
    -U mev_user \
    -d mev_protection \
    --verbose \
    < "$BACKUP_FILE"

# Restart application
docker-compose start mev-protection

echo "Database restore completed"
```

#### Point-in-Time Recovery

```bash
# If using PostgreSQL WAL archiving
pg_basebackup -h postgres -D /backup/base -P -U replication --wal-method=stream

# Configure recovery.conf for point-in-time recovery
```

### 2. Redis Recovery

```bash
#!/bin/bash
# Restore Redis from backup

BACKUP_FILE="$1"

if [[ "$BACKUP_FILE" == *.gz ]]; then
    gunzip -c "$BACKUP_FILE" > /tmp/dump.rdb
    BACKUP_FILE="/tmp/dump.rdb"
fi

# Stop Redis
docker-compose stop redis

# Copy backup file
docker cp "$BACKUP_FILE" mev-protection-redis:/data/dump.rdb

# Start Redis
docker-compose start redis

echo "Redis restore completed"
```

### 3. Full System Recovery

```bash
#!/bin/bash
# Complete disaster recovery procedure

set -e

echo "Starting disaster recovery..."

# 1. Clone repository
git clone https://github.com/yourusername/mev-protection-service.git
cd mev-protection-service

# 2. Restore environment configuration
cp /backup/config/.env .env

# 3. Restore database
./scripts/restore_database.sh /backup/database/latest.dump.gz

# 4. Restore Redis
./scripts/restore_redis.sh /backup/redis/latest.rdb.gz

# 5. Start services
docker-compose up -d

# 6. Verify services
./scripts/health_check.sh

echo "Disaster recovery completed"
```

## Disaster Recovery Plan

### RTO and RPO Targets

- **Recovery Time Objective (RTO)**: 4 hours
- **Recovery Point Objective (RPO)**: 24 hours

### Disaster Scenarios

#### 1. Database Failure

**Detection**: Database connection errors, query timeouts

**Recovery Steps**:
1. Check database logs: `docker-compose logs postgres`
2. Attempt restart: `docker-compose restart postgres`
3. If restart fails, restore from latest backup
4. Verify data integrity
5. Resume application

**Estimated Recovery Time**: 30-60 minutes

#### 2. Application Server Failure

**Detection**: Health check failures, 502/503 errors

**Recovery Steps**:
1. Check application logs: `docker-compose logs mev-protection`
2. Restart application: `docker-compose restart mev-protection`
3. If issues persist, redeploy from latest image
4. Verify functionality

**Estimated Recovery Time**: 15-30 minutes

#### 3. Complete Infrastructure Failure

**Detection**: All services down, no response

**Recovery Steps**:
1. Provision new infrastructure
2. Deploy from version control
3. Restore database from backup
4. Restore Redis from backup
5. Restore configuration
6. Verify all services
7. Update DNS if needed

**Estimated Recovery Time**: 2-4 hours

### Data Loss Scenarios

#### 1. Accidental Data Deletion

**Recovery Steps**:
1. Stop application immediately
2. Identify deletion time
3. Restore database to point before deletion
4. Extract missing data
5. Merge data back to production
6. Resume operations

#### 2. Corruption Detection

**Recovery Steps**:
1. Isolate corrupted data
2. Identify last known good state
3. Restore from backup
4. Replay transactions if available
5. Validate data integrity
6. Resume operations

## Backup Verification

### Monthly Backup Testing

```bash
#!/bin/bash
# Test backup integrity monthly

# 1. Create test environment
docker-compose -f docker-compose.test.yml up -d

# 2. Restore latest backup to test environment
./scripts/restore_database.sh latest_backup.dump.gz --test

# 3. Run verification queries
docker-compose -f docker-compose.test.yml exec postgres psql -U mev_user -d mev_protection_test -c "
SELECT COUNT(*) as threat_count FROM mev_threats;
SELECT COUNT(*) as protection_count FROM transaction_protections;
"

# 4. Clean up test environment
docker-compose -f docker-compose.test.yml down -v

echo "Backup verification completed"
```

## Backup Storage

### Local Storage

- Location: `/app/backups/`
- Retention: 30 days
- Automatic cleanup enabled

### Remote Storage (S3)

```bash
# Configure AWS CLI
aws configure

# Upload backups
aws s3 sync /app/backups/ s3://your-backup-bucket/mev-protection/ \
    --storage-class GLACIER \
    --exclude "*" \
    --include "*.dump.gz" \
    --include "*.rdb.gz"

# Set lifecycle policy
aws s3api put-bucket-lifecycle-configuration \
    --bucket your-backup-bucket \
    --lifecycle-configuration file://lifecycle-policy.json
```

**Lifecycle Policy** (`lifecycle-policy.json`):
```json
{
  "Rules": [
    {
      "Id": "Archive old backups",
      "Status": "Enabled",
      "Transitions": [
        {
          "Days": 30,
          "StorageClass": "GLACIER"
        },
        {
          "Days": 90,
          "StorageClass": "DEEP_ARCHIVE"
        }
      ],
      "Expiration": {
        "Days": 365
      }
    }
  ]
}
```

## Monitoring and Alerts

### Backup Monitoring

```bash
# Check if backups are running
*/30 * * * * /app/scripts/check_backup_status.sh

# Alert if backup is older than 25 hours
if [ $(find /app/backups/database/ -name "*.dump.gz" -mtime -1 | wc -l) -eq 0 ]; then
    echo "ALERT: No recent database backup found" | mail -s "Backup Alert" admin@example.com
fi
```

### Recovery Testing Schedule

- **Weekly**: Test database backup restore
- **Monthly**: Full disaster recovery drill
- **Quarterly**: Cross-region recovery test

## Contacts

### Emergency Contacts

- **Primary On-Call**: +1-XXX-XXX-XXXX
- **Secondary On-Call**: +1-XXX-XXX-XXXX
- **Database Admin**: dba@example.com
- **DevOps Lead**: devops@example.com

### Escalation Procedure

1. **Level 1**: On-call engineer (0-30 min)
2. **Level 2**: Team lead (30-60 min)
3. **Level 3**: Director of Engineering (60+ min)

## Checklist

### Pre-Disaster Preparation

- [ ] All backup scripts tested and working
- [ ] Backup verification passes monthly tests
- [ ] Recovery procedures documented and tested
- [ ] Team trained on recovery procedures
- [ ] Emergency contacts up to date
- [ ] Off-site backups configured
- [ ] Monitoring alerts configured
- [ ] Backup retention policies configured

### Post-Recovery Verification

- [ ] All services running and healthy
- [ ] Database connectivity verified
- [ ] Redis connectivity verified
- [ ] API endpoints responding
- [ ] Monitoring systems operational
- [ ] No data loss confirmed
- [ ] Performance metrics normal
- [ ] Security checks passed

## Appendix

### Useful Commands

```bash
# Check database size
docker-compose exec postgres psql -U mev_user -d mev_protection -c "
SELECT pg_size_pretty(pg_database_size('mev_protection'));
"

# List recent backups
ls -lh /app/backups/database/ | tail -10

# Test database connection
docker-compose exec postgres pg_isready -U mev_user -d mev_protection

# Export specific table
docker-compose exec postgres pg_dump -U mev_user -d mev_protection -t mev_threats > mev_threats.sql
```

