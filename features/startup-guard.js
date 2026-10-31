const fs = require('fs');
const path = require('path');
const electron = (() => { try { return require('electron'); } catch { return {}; } })();

class StartupGuard {
  constructor() {
    this.crashFlagPath = null;
    this.userDataPath = null;
  }

  initBeforeReady() {
    try {
      const args = process.argv || [];
      const forceNoGpu = args.some(arg => ['--disable-gpu', '--no-gpu', '--safe-mode'].includes(arg.toLowerCase()));

      // Try to determine userData directory
      try {
        this.userDataPath = electron.app.getPath('userData');
      } catch {
        const appData = process.env.APPDATA || (process.platform === 'darwin' ? path.join(process.env.HOME, 'Library', 'Application Support') : path.join(process.env.HOME, '.config'));
        this.userDataPath = path.join(appData, '.sklauncher', 'bin');
      }

      if (!fs.existsSync(this.userDataPath)) {
        fs.mkdirSync(this.userDataPath, { recursive: true });
      }

      this.crashFlagPath = path.join(this.userDataPath, 'startup-crash.flag');

      const hadPreviousCrash = fs.existsSync(this.crashFlagPath);
      const disableGpu = forceNoGpu || hadPreviousCrash;

      if (disableGpu) {
        console.warn('[StartupGuard] Disabling hardware acceleration (reason: ' + (forceNoGpu ? 'CLI flag' : 'previous crash detected') + ')');
        electron.app.disableHardwareAcceleration();
        electron.app.commandLine.appendSwitch('disable-gpu');
        electron.app.commandLine.appendSwitch('disable-software-rasterizer');

        // Clear corrupted GPU shader caches
        this.clearGpuCache();
      }

      // Write crash flag. It will be cleared once the main window successfully shows
      fs.writeFileSync(this.crashFlagPath, new Date().toISOString(), 'utf8');

      // Intercept GPU process crashes gracefully so the app does not terminate
      electron.app.on('gpu-process-crashed', (event, killed) => {
        console.warn('[StartupGuard] GPU process crashed (killed: ' + killed + '). Falling back to software rendering.');
      });

    } catch (err) {
      console.error('[StartupGuard] Initialization error:', err);
    }
  }

  clearGpuCache() {
    if (!this.userDataPath) return;
    const targets = ['GPUCache', 'DawnCache', 'ShaderCache'];
    for (const target of targets) {
      const p = path.join(this.userDataPath, target);
      try {
        if (fs.existsSync(p)) {
          fs.rmSync(p, { recursive: true, force: true });
          console.log('[StartupGuard] Cleared corrupted cache folder:', target);
        }
      } catch (e) {
        console.warn('[StartupGuard] Could not delete ' + target + ':', e.message);
      }
    }
  }

  onWindowReady() {
    try {
      if (this.crashFlagPath && fs.existsSync(this.crashFlagPath)) {
        fs.unlinkSync(this.crashFlagPath);
        console.log('[StartupGuard] App started successfully, cleared startup-crash flag.');
      }
    } catch (err) {
      console.error('[StartupGuard] Failed to clear crash flag:', err);
    }
  }
}

module.exports = new StartupGuard();
