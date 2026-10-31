const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');

class InstanceSharing {
  generateShareCode(instanceDir) {
    if (!instanceDir || !fs.existsSync(instanceDir)) {
      throw new Error('Instance directory not found');
    }

    let instanceMeta = {};
    const configCandidates = ['instance.json', 'config.json', 'sklauncher-instance.json'];
    for (const c of configCandidates) {
      const p = path.join(instanceDir, c);
      if (fs.existsSync(p)) {
        try {
          instanceMeta = JSON.parse(fs.readFileSync(p, 'utf8'));
          break;
        } catch {}
      }
    }

    const modsDir = path.join(instanceDir, 'mods');
    const modsList = [];

    if (fs.existsSync(modsDir)) {
      const files = fs.readdirSync(modsDir);
      for (const file of files) {
        if (file.endsWith('.jar') && !file.endsWith('.disabled')) {
          const full = path.join(modsDir, file);
          const stat = fs.statSync(full);
          // Calculate quick SHA-1 hash (compatible with Modrinth hash lookup API)
          const hash = crypto.createHash('sha1').update(fs.readFileSync(full)).digest('hex');
          modsList.push({
            filename: file,
            size: stat.size,
            sha1: hash
          });
        }
      }
    }

    const payload = {
      v: 1,
      name: instanceMeta.name || path.basename(instanceDir),
      gameVersion: instanceMeta.gameVersion || instanceMeta.version || '1.21.1',
      loader: instanceMeta.loader || instanceMeta.modLoader || 'fabric',
      loaderVersion: instanceMeta.loaderVersion || null,
      mods: modsList,
      exportedAt: Date.now()
    };

    const jsonStr = JSON.stringify(payload);
    const compressed = zlib.deflateSync(Buffer.from(jsonStr, 'utf8'));
    const base64 = compressed.toString('base64url');

    return {
      success: true,
      instanceName: payload.name,
      modCount: modsList.length,
      code: `SKP1_${base64}`,
      deepLink: `sk://import?data=${base64}`
    };
  }

  parseShareCode(shareString) {
    let clean = shareString.trim();
    if (clean.startsWith('sk://import?data=')) {
      clean = clean.split('sk://import?data=')[1];
    } else if (clean.startsWith('SKP1_')) {
      clean = clean.slice(5);
    }

    try {
      const compressed = Buffer.from(clean, 'base64url');
      const decompressed = zlib.inflateSync(compressed);
      const data = JSON.parse(decompressed.toString('utf8'));
      return {
        valid: true,
        data
      };
    } catch (err) {
      return {
        valid: false,
        error: 'Invalid or corrupted share code: ' + err.message
      };
    }
  }

  registerIpc(ipcMain) {
    ipcMain.handle('instances:export-share-code', async (event, instancePath) => {
      try {
        return this.generateShareCode(instancePath);
      } catch (err) {
        return { success: false, error: err.message };
      }
    });

    ipcMain.handle('instances:import-share-code', async (event, code) => {
      return this.parseShareCode(code);
    });
  }
}

module.exports = new InstanceSharing();
