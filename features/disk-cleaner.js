const fs = require('fs');
const path = require('path');
const electron = (() => { try { return require('electron'); } catch { return {}; } })();

class DiskCleaner {
  constructor() {
    this.appData = process.env.APPDATA || (process.platform === 'darwin' ? path.join(process.env.HOME, 'Library', 'Application Support') : path.join(process.env.HOME, '.config'));
    this.skDir = path.join(this.appData, '.sklauncher');
    this.mcDir = path.join(this.appData, '.minecraft');
  }

  scan() {
    const results = {
      minecraftLogs: { count: 0, bytes: 0, paths: [] },
      instanceLogs: { count: 0, bytes: 0, paths: [] },
      crashReports: { count: 0, bytes: 0, paths: [] },
      downloadCache: { count: 0, bytes: 0, paths: [] },
      webCache: { count: 0, bytes: 0, paths: [] },
      totalBytes: 0,
      totalCount: 0
    };

    // 1. Scan .minecraft/logs
    const mcLogsDir = path.join(this.mcDir, 'logs');
    if (fs.existsSync(mcLogsDir)) {
      this._scanDirForExtension(mcLogsDir, ['.log.gz', '.log'], results.minecraftLogs);
    }

    // 2. Scan instances logs & crash reports
    const instancesDir = path.join(this.skDir, 'instances');
    if (fs.existsSync(instancesDir)) {
      try {
        const instances = fs.readdirSync(instancesDir);
        for (const inst of instances) {
          const instLogDir = path.join(instancesDir, inst, 'logs');
          if (fs.existsSync(instLogDir)) {
            this._scanDirForExtension(instLogDir, ['.log.gz'], results.instanceLogs);
          }
          const instCrashDir = path.join(instancesDir, inst, 'crash-reports');
          if (fs.existsSync(instCrashDir)) {
            this._scanDirForExtension(instCrashDir, ['.txt'], results.crashReports);
          }
        }
      } catch (e) {
        console.warn('[DiskCleaner] Error reading instances directory:', e.message);
      }
    }

    // 3. Scan launcher cache
    const cacheDir = path.join(this.skDir, 'cache');
    if (fs.existsSync(cacheDir)) {
      this._scanAllFiles(cacheDir, results.downloadCache);
    }

    // 4. Scan Electron/Chromium web cache
    try {
      const userData = electron.app.getPath('userData');
      for (const sub of ['Cache', 'Code Cache', 'GPUCache', 'DawnCache']) {
        const subPath = path.join(userData, sub);
        if (fs.existsSync(subPath)) {
          this._scanAllFiles(subPath, results.webCache);
        }
      }
    } catch {}

    results.totalBytes = results.minecraftLogs.bytes + results.instanceLogs.bytes +
      results.crashReports.bytes + results.downloadCache.bytes + results.webCache.bytes;
    results.totalCount = results.minecraftLogs.count + results.instanceLogs.count +
      results.crashReports.count + results.downloadCache.count + results.webCache.count;

    return results;
  }

  clean(selectedCategories = ['minecraftLogs', 'instanceLogs', 'crashReports', 'downloadCache', 'webCache']) {
    const scanResult = this.scan();
    let freedBytes = 0;
    let deletedFiles = 0;

    for (const cat of selectedCategories) {
      if (scanResult[cat] && scanResult[cat].paths) {
        for (const filePath of scanResult[cat].paths) {
          try {
            if (fs.existsSync(filePath)) {
              const stat = fs.statSync(filePath);
              fs.unlinkSync(filePath);
              freedBytes += stat.size;
              deletedFiles++;
            }
          } catch (e) {
            console.warn('[DiskCleaner] Failed to delete file:', filePath, e.message);
          }
        }
      }
    }

    return {
      success: true,
      freedBytes,
      freedMB: (freedBytes / 1024 / 1024).toFixed(2),
      deletedFiles
    };
  }

  _scanDirForExtension(dir, extensions, target) {
    try {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const full = path.join(dir, file);
        const stat = fs.statSync(full);
        if (stat.isFile() && extensions.some(ext => file.endsWith(ext))) {
          target.count++;
          target.bytes += stat.size;
          target.paths.push(full);
        }
      }
    } catch {}
  }

  _scanAllFiles(dir, target) {
    try {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const full = path.join(dir, item);
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
          this._scanAllFiles(full, target);
        } else if (stat.isFile()) {
          target.count++;
          target.bytes += stat.size;
          target.paths.push(full);
        }
      }
    } catch {}
  }

  registerIpc(ipcMain) {
    ipcMain.handle('storage:scan-disk-cleanup', async () => {
      return this.scan();
    });

    ipcMain.handle('storage:run-disk-cleanup', async (event, categories) => {
      return this.clean(categories);
    });
  }
}

module.exports = new DiskCleaner();
