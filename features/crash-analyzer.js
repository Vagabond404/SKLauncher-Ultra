const fs = require('fs');
const path = require('path');

class CrashAnalyzer {
  analyzeLogContent(logText) {
    if (!logText || typeof logText !== 'string') {
      return {
        detected: false,
        title: 'No Crash Information Available',
        message: 'The log file is empty or could not be read.',
        suggestions: []
      };
    }

    // 1. OptiFine & Sodium / Iris / Embeddium conflict
    if ((logText.includes('OptiFine') || logText.includes('optifine')) &&
        (logText.includes('sodium') || logText.includes('Sodium') || logText.includes('iris') || logText.includes('embeddium'))) {
      return {
        detected: true,
        severity: 'HIGH',
        category: 'MOD_CONFLICT',
        title: 'Incompatible Rendering Mods (OptiFine Conflict)',
        message: 'OptiFine was detected alongside Sodium, Iris, or Embeddium. These mods rewrite the rendering engine in conflicting ways and cannot run together.',
        solution: 'Disable or remove OptiFine. Keep Sodium and Iris for vastly superior performance and shader support on modern versions.',
        fix: {
          type: 'DISABLE_MOD_KEYWORD',
          keyword: 'optifine',
          actionText: 'Disable OptiFine in this instance'
        }
      };
    }

    // 2. Out of Memory (OOM)
    if (logText.includes('java.lang.OutOfMemoryError') || logText.includes('Could not reserve enough space for') || logText.includes('GC overhead limit exceeded')) {
      return {
        detected: true,
        severity: 'HIGH',
        category: 'MEMORY_LIMIT',
        title: 'Minecraft Ran Out of Memory (RAM)',
        message: 'The game exhausted the allocated Java heap memory and crashed.',
        solution: 'Increase the allocated RAM in the instance settings. For modded instances with 50+ mods, 6 GB to 8 GB is recommended.',
        fix: {
          type: 'INCREASE_RAM',
          recommendedMb: 6144,
          actionText: 'Configure Instance RAM to 6 GB'
        }
      };
    }

    // 3. Java Runtime Version Mismatch
    const javaVersionMatch = logText.match(/has been compiled by a more recent version of the Java Runtime \(class file version ([0-9.]+)\)/);
    if (javaVersionMatch || logText.includes('UnsupportedClassVersionError')) {
      const classVersion = javaVersionMatch ? javaVersionMatch[1] : '';
      let requiredJava = 'Java 17 or Java 21';
      if (classVersion.startsWith('65')) requiredJava = 'Java 21';
      else if (classVersion.startsWith('61')) requiredJava = 'Java 17';
      else if (classVersion.startsWith('60')) requiredJava = 'Java 16';

      return {
        detected: true,
        severity: 'CRITICAL',
        category: 'JAVA_VERSION',
        title: 'Incompatible Java Version',
        message: `This Minecraft version or mod was compiled for a newer Java runtime (${requiredJava}), but the instance is using an older Java version.`,
        solution: `Change the Java executable in Instance Settings to ${requiredJava}.`,
        fix: {
          type: 'SWITCH_JAVA',
          recommendedVersion: requiredJava,
          actionText: `Select ${requiredJava} in Instance Settings`
        }
      };
    }

    // 4. Missing Dependencies (e.g. Fabric API)
    const depMatch = logText.match(/requires (?:mod '([^']+)'|'([^']+)')/i) ||
                     logText.match(/Failed to find required mod: ([a-zA-Z0-9_-]+)/i) ||
                     logText.match(/Mod '([^']+)' requires/i);
    if (depMatch || logText.includes('requires fabric') || logText.includes('requires fabric-api')) {
      const missingMod = depMatch ? (depMatch[1] || depMatch[2]) : 'Fabric API';
      return {
        detected: true,
        severity: 'HIGH',
        category: 'MISSING_DEPENDENCY',
        title: `Missing Required Dependency: ${missingMod}`,
        message: `A mod in this instance depends on '${missingMod}', which is not currently installed in the mods folder.`,
        solution: `Install '${missingMod}' from the Mods tab (Modrinth/CurseForge) and restart the game.`,
        fix: {
          type: 'SEARCH_MODRINTH',
          query: missingMod,
          actionText: `Search and Install '${missingMod}'`
        }
      };
    }

    // 5. Duplicate Mod Versions
    const dupMatch = logText.match(/Duplicate mod ID: '([^']+)'/i) || logText.match(/Duplicate mod: '([^']+)'/i);
    if (dupMatch) {
      const modId = dupMatch[1];
      return {
        detected: true,
        severity: 'HIGH',
        category: 'DUPLICATE_MOD',
        title: `Duplicate Mod Versions: ${modId}`,
        message: `Multiple JAR files containing the same mod ID '${modId}' were found in the mods directory.`,
        solution: 'Delete the older duplicate JAR file from your mods folder.',
        fix: {
          type: 'RESOLVE_DUPLICATE',
          modId,
          actionText: 'Resolve duplicate mod files'
        }
      };
    }

    // 6. Failed Mixin Injection
    const mixinMatch = logText.match(/org\.spongepowered\.asm\.mixin\.transformer\.throwables\.MixinTransformerError:.*in target \(.*?\) from (.*?)/);
    if (mixinMatch) {
      return {
        detected: true,
        severity: 'MEDIUM',
        category: 'MIXIN_ERROR',
        title: 'Mixin Injection Failure',
        message: `A mod failed to inject its mixins into Minecraft: ${mixinMatch[1]}. This is usually caused by an outdated mod or a collision between two mods modifying the same game code.`,
        solution: `Check for an update for the mod '${mixinMatch[1]}' or temporarily disable it.`,
        fix: {
          type: 'INSPECT_MOD',
          modHint: mixinMatch[1],
          actionText: 'Inspect or disable the conflicting mod'
        }
      };
    }

    return {
      detected: false,
      severity: 'UNKNOWN',
      title: 'Crash Detected (Generic Exception)',
      message: 'A crash was recorded, but no known automatic pattern matched the log. You can inspect the full crash report or share it with support.',
      solution: 'Review recent mod additions or check the full log file for details.',
      fix: null
    };
  }

  applyFix(fixData, instanceDir) {
    if (!fixData || !instanceDir || !fs.existsSync(instanceDir)) {
      return { success: false, error: 'Invalid parameters or instance directory not found' };
    }

    const modsDir = path.join(instanceDir, 'mods');

    if (fixData.type === 'DISABLE_MOD_KEYWORD' && fs.existsSync(modsDir)) {
      const kw = fixData.keyword.toLowerCase();
      const files = fs.readdirSync(modsDir);
      let disabledCount = 0;

      for (const file of files) {
        if (file.toLowerCase().includes(kw) && file.endsWith('.jar')) {
          const oldPath = path.join(modsDir, file);
          const newPath = path.join(modsDir, file + '.disabled');
          fs.renameSync(oldPath, newPath);
          disabledCount++;
        }
      }

      return {
        success: disabledCount > 0,
        message: `Successfully disabled ${disabledCount} mod file(s) matching '${fixData.keyword}'.`
      };
    }

    return { success: false, message: 'Automatic action not supported for this fix type' };
  }

  registerIpc(ipcMain) {
    ipcMain.handle('game:smart-analyze-crash', async (event, logContent) => {
      return this.analyzeLogContent(logContent);
    });

    ipcMain.handle('game:apply-smart-fix', async (event, fixData, instancePath) => {
      return this.applyFix(fixData, instancePath);
    });
  }
}

module.exports = new CrashAnalyzer();
