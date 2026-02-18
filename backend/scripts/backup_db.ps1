# Database Backup Script
# Created by Antigravity at 2026-02-18

# Configuration
$DB_HOST = "localhost"
$DB_PORT = "5432"
$DB_NAME = "rentacar_db"
$DB_USER = "postgres"
# IMPORTANT: For automated tasks on Windows, setting PGPASSWORD env var is often the simplest method
# provided the script runs in a secure context. Alternatively, use .pgpass file.
$env:PGPASSWORD = "root" 

# Directory to save backups
# Use script location as base for reliability
$ScriptDir = Split-Path $MyInvocation.MyCommand.Path
$BACKUP_DIR = Join-Path $ScriptDir "..\backups"

# Ensure backup directory exists
if (-not (Test-Path -Path $BACKUP_DIR)) {
    New-Item -ItemType Directory -Path $BACKUP_DIR | Out-Null
    Write-Host "Created backup directory: $BACKUP_DIR"
}

# Timestamp for filename
$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"
$BACKUP_FILE = Join-Path $BACKUP_DIR "cr_backup_$TIMESTAMP.dump"

# Backup Command
# -Fc: Custom Format (compressed, flexible restore)
# -Z 9: Maximum Compression
# -v: Verbose mode (optional, good for logging)
$PG_DUMP_CMD = "pg_dump"
$PG_DUMP_ARGS = @("-h", $DB_HOST, "-p", $DB_PORT, "-U", $DB_USER, "-Fc", "-Z", "9", "-f", $BACKUP_FILE, $DB_NAME)

Write-Host "Starting backup for database '$DB_NAME'..."
Write-Host "Destination: $BACKUP_FILE"

try {
    & $PG_DUMP_CMD $PG_DUMP_ARGS
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Backup completed successfully!" -ForegroundColor Green
    }
    else {
        Write-Host "Backup failed with exit code $LASTEXITCODE." -ForegroundColor Red
        exit $LASTEXITCODE
    }
}
catch {
    Write-Host "Error executing pg_dump. Make sure PostgreSQL tools are in your system PATH." -ForegroundColor Red
    Write-Error $_
    exit 1
}

# Retention Policy: Delete backups older than 7 days
$RETENTION_DAYS = 7
Write-Host "Checking for old backups (older than $RETENTION_DAYS days)..."

Get-ChildItem -Path $BACKUP_DIR -Filter "*.dump" | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-$RETENTION_DAYS) } | ForEach-Object {
    Write-Host "Deleting old backup: $($_.Name)" -ForegroundColor Yellow
    Remove-Item $_.FullName
}

Write-Host "Cleanup complete."
