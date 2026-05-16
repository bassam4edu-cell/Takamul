/**
 * Database Backup Utility
 * Provides automated daily backups and manual backup functionality
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

const execAsync = promisify(exec);

// Configuration
const BACKUP_DIR = process.env.BACKUP_DIR || '/var/backups/school-db';
const DB_NAME = process.env.DATABASE_NAME || 'school_management';
const DB_USER = process.env.DATABASE_USER || 'postgres';
const DB_HOST = process.env.DATABASE_HOST || 'localhost';
const DB_PORT = process.env.DATABASE_PORT || '5432';
const MAX_BACKUPS = parseInt(process.env.MAX_BACKUPS || '30'); // Keep last 30 days

interface BackupInfo {
  filename: string;
  path: string;
  size: number;
  date: Date;
  type: 'auto' | 'manual';
}

/**
 * Ensure backup directory exists
 */
async function ensureBackupDir(): Promise<void> {
  try {
    await fs.mkdir(BACKUP_DIR, { recursive: true });
  } catch (err) {
    console.error('Failed to create backup directory:', err);
    throw err;
  }
}

/**
 * Format file size in human-readable format
 */
function formatSize(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Create database backup
 */
export async function createBackup(type: 'auto' | 'manual' = 'auto'): Promise<BackupInfo> {
  await ensureBackupDir();

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `backup_${type}_${timestamp}.sql`;
  const backupPath = path.join(BACKUP_DIR, filename);

  console.log(`Creating ${type} backup: ${filename}`);

  try {
    // Use pg_dump to create backup
    const command = `PGPASSWORD="${process.env.DATABASE_PASSWORD}" pg_dump -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -F c -b -v -f "${backupPath}"`;
    
    await execAsync(command, { maxBuffer: 1024 * 1024 * 100 }); // 100MB buffer

    // Get file stats
    const stats = await fs.stat(backupPath);

    const backupInfo: BackupInfo = {
      filename,
      path: backupPath,
      size: stats.size,
      date: new Date(),
      type
    };

    console.log(`✅ Backup created successfully: ${filename} (${formatSize(stats.size)})`);

    // Clean old backups
    await cleanOldBackups();

    return backupInfo;
  } catch (err) {
    console.error('Backup failed:', err);
    throw new Error(`Failed to create backup: ${err}`);
  }
}

/**
 * List all available backups
 */
export async function listBackups(): Promise<BackupInfo[]> {
  await ensureBackupDir();

  try {
    const files = await fs.readdir(BACKUP_DIR);
    const backups: BackupInfo[] = [];

    for (const file of files) {
      if (file.endsWith('.sql')) {
        const filePath = path.join(BACKUP_DIR, file);
        const stats = await fs.stat(filePath);
        
        // Determine type from filename
        const type = file.includes('_manual_') ? 'manual' : 'auto';

        backups.push({
          filename: file,
          path: filePath,
          size: stats.size,
          date: stats.mtime,
          type
        });
      }
    }

    // Sort by date (newest first)
    backups.sort((a, b) => b.date.getTime() - a.date.getTime());

    return backups;
  } catch (err) {
    console.error('Failed to list backups:', err);
    return [];
  }
}

/**
 * Delete old backups (keep only MAX_BACKUPS most recent)
 */
async function cleanOldBackups(): Promise<void> {
  try {
    const backups = await listBackups();

    if (backups.length > MAX_BACKUPS) {
      const toDelete = backups.slice(MAX_BACKUPS);
      
      for (const backup of toDelete) {
        await fs.unlink(backup.path);
        console.log(`🗑️ Deleted old backup: ${backup.filename}`);
      }
    }
  } catch (err) {
    console.error('Failed to clean old backups:', err);
  }
}

/**
 * Restore from backup
 */
export async function restoreBackup(filename: string): Promise<void> {
  const backupPath = path.join(BACKUP_DIR, filename);

  if (!existsSync(backupPath)) {
    throw new Error(`Backup file not found: ${filename}`);
  }

  console.log(`Restoring from backup: ${filename}`);

  try {
    // Drop existing connections
    const dropConnections = `PGPASSWORD="${process.env.DATABASE_PASSWORD}" psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${DB_NAME}' AND pid <> pg_backend_pid();"`;
    await execAsync(dropConnections);

    // Drop and recreate database
    const dropDb = `PGPASSWORD="${process.env.DATABASE_PASSWORD}" psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d postgres -c "DROP DATABASE IF EXISTS ${DB_NAME};"`;
    await execAsync(dropDb);

    const createDb = `PGPASSWORD="${process.env.DATABASE_PASSWORD}" psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d postgres -c "CREATE DATABASE ${DB_NAME};"`;
    await execAsync(createDb);

    // Restore from backup
    const restore = `PGPASSWORD="${process.env.DATABASE_PASSWORD}" pg_restore -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -v "${backupPath}"`;
    await execAsync(restore, { maxBuffer: 1024 * 1024 * 100 });

    console.log(`✅ Database restored successfully from: ${filename}`);
  } catch (err) {
    console.error('Restore failed:', err);
    throw new Error(`Failed to restore backup: ${err}`);
  }
}

/**
 * Delete a specific backup
 */
export async function deleteBackup(filename: string): Promise<void> {
  const backupPath = path.join(BACKUP_DIR, filename);

  if (!existsSync(backupPath)) {
    throw new Error(`Backup file not found: ${filename}`);
  }

  try {
    await fs.unlink(backupPath);
    console.log(`🗑️ Deleted backup: ${filename}`);
  } catch (err) {
    console.error('Failed to delete backup:', err);
    throw err;
  }
}

/**
 * Download backup file
 */
export async function getBackupFile(filename: string): Promise<string> {
  const backupPath = path.join(BACKUP_DIR, filename);

  if (!existsSync(backupPath)) {
    throw new Error(`Backup file not found: ${filename}`);
  }

  return backupPath;
}

/**
 * Schedule daily backup (call this on server startup)
 */
export function scheduleDailyBackup(): void {
  // Run at 2 AM every day
  const schedule = require('node-schedule');
  
  const rule = new schedule.RecurrenceRule();
  rule.hour = 2;
  rule.minute = 0;

  schedule.scheduleJob(rule, async () => {
    console.log('⏰ Running scheduled daily backup...');
    try {
      await createBackup('auto');
      console.log('✅ Scheduled backup completed successfully');
    } catch (err) {
      console.error('❌ Scheduled backup failed:', err);
    }
  });

  console.log('📅 Daily backup scheduled at 2:00 AM');
}

/**
 * Get backup statistics
 */
export async function getBackupStats(): Promise<{
  total: number;
  totalSize: number;
  oldest: Date | null;
  newest: Date | null;
  auto: number;
  manual: number;
}> {
  const backups = await listBackups();

  if (backups.length === 0) {
    return {
      total: 0,
      totalSize: 0,
      oldest: null,
      newest: null,
      auto: 0,
      manual: 0
    };
  }

  const totalSize = backups.reduce((sum, b) => sum + b.size, 0);
  const auto = backups.filter(b => b.type === 'auto').length;
  const manual = backups.filter(b => b.type === 'manual').length;

  return {
    total: backups.length,
    totalSize,
    oldest: backups[backups.length - 1].date,
    newest: backups[0].date,
    auto,
    manual
  };
}
