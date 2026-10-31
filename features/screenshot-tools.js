const fs = require('fs');
const path = require('path');
const electron = (() => { try { return require('electron'); } catch { return {}; } })();

class ScreenshotTools {
  copyToClipboard(filePath) {
    if (!filePath || !fs.existsSync(filePath)) {
      return { success: false, error: 'File does not exist' };
    }

    try {
      const image = electron.nativeImage.createFromPath(filePath);
      if (image.isEmpty()) {
        return { success: false, error: 'Could not load image file' };
      }

      electron.clipboard.writeImage(image);
      return {
        success: true,
        message: 'Screenshot copied to clipboard! You can now paste directly into Discord with Ctrl+V.'
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  revealInFolder(filePath) {
    if (!filePath || !fs.existsSync(filePath)) {
      return { success: false, error: 'File does not exist' };
    }

    try {
      electron.shell.showItemInFolder(filePath);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  registerIpc(ipcMain) {
    ipcMain.handle('screenshots:copy-image-to-clipboard', async (event, filePath) => {
      return this.copyToClipboard(filePath);
    });

    ipcMain.handle('screenshots:reveal-in-folder', async (event, filePath) => {
      return this.revealInFolder(filePath);
    });
  }
}

module.exports = new ScreenshotTools();
