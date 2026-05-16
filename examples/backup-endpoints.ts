/**
 * BACKUP ENDPOINTS
 * Add these to your server.ts file
 */

import { 
  createBackup, 
  listBackups, 
  deleteBackup, 
  getBackupFile, 
  getBackupStats,
  scheduleDailyBackup 
} from './utils/backup';

// On server startup, schedule daily backups
scheduleDailyBackup();

// ==========================================
// BACKUP API ENDPOINTS
// ==========================================

/**
 * Get all backups
 */
app.get("/api/admin/backups", async (req, res) => {
  try {
    const backups = await listBackups();
    res.json({ backups });
  } catch (err) {
    console.error('Failed to list backups:', err);
    res.status(500).json({ error: "Failed to list backups" });
  }
});

/**
 * Get backup statistics
 */
app.get("/api/admin/backups/stats", async (req, res) => {
  try {
    const stats = await getBackupStats();
    res.json(stats);
  } catch (err) {
    console.error('Failed to get backup stats:', err);
    res.status(500).json({ error: "Failed to get stats" });
  }
});

/**
 * Create manual backup
 */
app.post("/api/admin/backups/create", async (req, res) => {
  try {
    const backup = await createBackup('manual');
    res.json({ 
      success: true, 
      backup: {
        filename: backup.filename,
        size: backup.size,
        date: backup.date
      }
    });
  } catch (err) {
    console.error('Failed to create backup:', err);
    res.status(500).json({ error: "Failed to create backup" });
  }
});

/**
 * Download backup file
 */
app.get("/api/admin/backups/download/:filename", async (req, res) => {
  const { filename } = req.params;
  
  try {
    const filePath = await getBackupFile(filename);
    res.download(filePath, filename);
  } catch (err) {
    console.error('Failed to download backup:', err);
    res.status(404).json({ error: "Backup not found" });
  }
});

/**
 * Delete backup
 */
app.delete("/api/admin/backups/:filename", async (req, res) => {
  const { filename } = req.params;
  
  try {
    await deleteBackup(filename);
    res.json({ success: true });
  } catch (err) {
    console.error('Failed to delete backup:', err);
    res.status(500).json({ error: "Failed to delete backup" });
  }
});

/**
 * Note: Restore functionality is intentionally not exposed via API
 * for security reasons. It should be done manually via command line:
 * 
 * pg_restore -h localhost -U postgres -d school_management backup_file.sql
 */
