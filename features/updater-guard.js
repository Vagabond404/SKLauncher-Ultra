const fs = require('fs');
const path = require('path');

class UpdaterGuard {
  patchAutoUpdater(autoUpdater) {
    if (!autoUpdater) return;

    try {
      // Prevent unexpected automatic downloads and restarts on startup
      autoUpdater.autoDownload = false;
      autoUpdater.autoInstallOnAppQuit = false;

      console.log('[UpdaterGuard] AutoUpdater protected: automatic background download/restart loop disabled.');
    } catch (err) {
      console.warn('[UpdaterGuard] Could not patch autoUpdater:', err.message);
    }
  }
}

module.exports = new UpdaterGuard();
