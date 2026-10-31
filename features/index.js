const electron = (() => { try { return require('electron'); } catch { return {}; } })();
const startupGuard = require('./startup-guard');
const diskCleaner = require('./disk-cleaner');
const crashAnalyzer = require('./crash-analyzer');
const instanceSharing = require('./instance-sharing');
const modConflictScanner = require('./mod-conflict-scanner');
const screenshotTools = require('./screenshot-tools');
const updaterGuard = require('./updater-guard');
const p2pFriends = require('./p2p-friends');

class FeaturesHub {
  initEarly() {
    startupGuard.initBeforeReady();
  }

  initApp() {
    const ipcMain = electron.ipcMain;
    diskCleaner.registerIpc(ipcMain);
    crashAnalyzer.registerIpc(ipcMain);
    instanceSharing.registerIpc(ipcMain);
    modConflictScanner.registerIpc(ipcMain);
    screenshotTools.registerIpc(ipcMain);
    p2pFriends.registerIpc(ipcMain);

    console.log('[FeaturesHub] All custom features & IPC handlers registered successfully:');
    console.log(' - Startup GPU Crash Guard & Auto-Recovery');
    console.log(' - Smart AI Crash Analyzer & Fixes');
    console.log(' - Instant Instance Sharing (Short Codes / Links)');
    console.log(' - Disk Cleaner (Minecraft logs & cache cleanup)');
    console.log(' - Predictive Mod Conflict Scanner');
    console.log(' - Enhanced Screenshot Tools (Discord 1-click clipboard)');
    console.log(' - Universal P2P Friends Network (Cracked & Official accounts)');
  }

  patchUpdater(autoUpdater) {
    updaterGuard.patchAutoUpdater(autoUpdater);
  }

  notifyWindowReady() {
    startupGuard.onWindowReady();
  }
}

module.exports = new FeaturesHub();
