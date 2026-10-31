const fs = require('fs');
const path = require('path');
const yauzl = require('yauzl');

class ModConflictScanner {
  async scanInstanceMods(instanceDir) {
    const modsDir = path.join(instanceDir, 'mods');
    if (!fs.existsSync(modsDir)) {
      return { safeToLaunch: true, scannedMods: 0, warnings: [], missingDependencies: [], conflicts: [] };
    }

    const files = fs.readdirSync(modsDir).filter(f => f.endsWith('.jar') && !f.endsWith('.disabled'));
    const installedMods = new Map(); // id -> { name, version, file, depends, breaks }

    for (const file of files) {
      const fullPath = path.join(modsDir, file);
      try {
        const meta = await this._readModMetadata(fullPath);
        if (meta && meta.id) {
          if (installedMods.has(meta.id)) {
            // Duplicate detected!
            installedMods.get(meta.id).duplicates = installedMods.get(meta.id).duplicates || [];
            installedMods.get(meta.id).duplicates.push(file);
          } else {
            installedMods.set(meta.id, {
              ...meta,
              file
            });
          }
        }
      } catch (err) {
        // Silently skip corrupted or unreadable JARs
      }
    }

    const warnings = [];
    const missingDependencies = [];
    const conflicts = [];

    // Check duplicates
    for (const [id, mod] of installedMods.entries()) {
      if (mod.duplicates && mod.duplicates.length > 0) {
        warnings.push({
          type: 'DUPLICATE',
          message: `Duplicate files found for mod '${mod.name || id}': ${mod.file} and ${mod.duplicates.join(', ')}`
        });
      }
    }

    // Check missing dependencies
    for (const [id, mod] of installedMods.entries()) {
      if (mod.depends) {
        for (const depId of Object.keys(mod.depends)) {
          // Ignore minecraft, java, and standard runtime loaders
          if (['minecraft', 'java', 'fabricloader', 'forge', 'quilt_loader', 'neoforge'].includes(depId.toLowerCase())) {
            continue;
          }
          if (!installedMods.has(depId) && !installedMods.has(depId.toLowerCase())) {
            missingDependencies.push({
              sourceMod: mod.name || id,
              sourceFile: mod.file,
              missingId: depId
            });
          }
        }
      }

      // Check declared conflicts/breaks
      if (mod.breaks) {
        for (const breakId of Object.keys(mod.breaks)) {
          if (installedMods.has(breakId) || installedMods.has(breakId.toLowerCase())) {
            const brokenMod = installedMods.get(breakId) || installedMods.get(breakId.toLowerCase());
            conflicts.push({
              modA: mod.name || id,
              modB: brokenMod.name || breakId,
              reason: `Mod '${mod.name || id}' explicitly declares conflict with '${brokenMod.name || breakId}'`
            });
          }
        }
      }
    }

    const safeToLaunch = missingDependencies.length === 0 && conflicts.length === 0;

    return {
      safeToLaunch,
      scannedMods: installedMods.size,
      warnings,
      missingDependencies,
      conflicts
    };
  }

  _readModMetadata(jarPath) {
    return new Promise((resolve) => {
      yauzl.open(jarPath, { lazyEntries: true }, (err, zipfile) => {
        if (err || !zipfile) return resolve(null);

        let resolved = false;

        zipfile.readEntry();
        zipfile.on('entry', (entry) => {
          if (entry.fileName === 'fabric.mod.json' || entry.fileName === 'quilt.mod.json') {
            zipfile.openReadStream(entry, (sErr, readStream) => {
              if (sErr) { zipfile.readEntry(); return; }
              const chunks = [];
              readStream.on('data', chunk => chunks.push(chunk));
              readStream.on('end', () => {
                try {
                  const data = JSON.parse(Buffer.concat(chunks).toString('utf8'));
                  resolved = true;
                  zipfile.close();
                  resolve({
                    id: data.id,
                    name: data.name || data.id,
                    version: data.version,
                    depends: data.depends || {},
                    breaks: data.breaks || {}
                  });
                } catch {
                  zipfile.readEntry();
                }
              });
            });
          } else {
            zipfile.readEntry();
          }
        });

        zipfile.on('end', () => {
          if (!resolved) resolve(null);
        });

        zipfile.on('error', () => {
          if (!resolved) resolve(null);
        });
      });
    });
  }

  registerIpc(ipcMain) {
    ipcMain.handle('content:predict-mod-conflicts', async (event, instancePath) => {
      return this.scanInstanceMods(instancePath);
    });
  }
}

module.exports = new ModConflictScanner();
