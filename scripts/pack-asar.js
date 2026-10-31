const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const outputFile = path.join(rootDir, 'dist', 'app.asar');
const unpackedPatterns = ['resources/icon.png', 'resources/tray/'];

if (!fs.existsSync(path.join(rootDir, 'dist'))) {
  fs.mkdirSync(path.join(rootDir, 'dist'), { recursive: true });
}

function createAsar(srcDir, outputFile) {
  const fileEntries = [];
  let currentOffset = 0n;

  function buildTree(dir, relPath = '') {
    const tree = {};
    const items = fs.readdirSync(dir);
    for (const item of items) {
      if (item === 'dist' || item === 'scripts' || item.endsWith('.readable.js') || item.endsWith('.map')) {
        continue; // Exclude build artifacts and developer tools from the production ASAR
      }
      const fullPath = path.join(dir, item);
      const itemRel = relPath ? relPath + '/' + item : item;
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        tree[item] = { files: buildTree(fullPath, itemRel) };
      } else {
        const isUnpacked = unpackedPatterns.some(p => itemRel.startsWith(p));
        if (isUnpacked) {
          tree[item] = { size: stat.size, unpacked: true };
        } else if (stat.size === 0) {
          tree[item] = { size: 0 };
        } else {
          tree[item] = {
            size: stat.size,
            offset: currentOffset.toString()
          };
          fileEntries.push({ fullPath, size: stat.size });
          currentOffset += BigInt(stat.size);
        }
      }
    }
    return tree;
  }

  const rootTree = { files: buildTree(srcDir) };
  const jsonBuf = Buffer.from(JSON.stringify(rootTree), 'utf8');

  const jsonLen = jsonBuf.length;
  const padding = (4 - (jsonLen % 4)) % 4;
  const paddedJsonBuf = Buffer.concat([jsonBuf, Buffer.alloc(padding)]);

  const headerSize = paddedJsonBuf.length;
  const headerBuf = Buffer.alloc(16);
  headerBuf.writeUInt32LE(4, 0);
  headerBuf.writeUInt32LE(headerSize + 8, 4);
  headerBuf.writeUInt32LE(headerSize + 4, 8);
  headerBuf.writeUInt32LE(jsonLen, 12);

  const outStream = fs.createWriteStream(outputFile);
  outStream.write(headerBuf);
  outStream.write(paddedJsonBuf);

  for (const entry of fileEntries) {
    const data = fs.readFileSync(entry.fullPath);
    outStream.write(data);
  }
  outStream.end();

  return new Promise((resolve, reject) => {
    outStream.on('finish', () => resolve(outputFile));
    outStream.on('error', reject);
  });
}

console.log('Packaging SKLauncher 4.0 into dist/app.asar...');
const t0 = Date.now();
createAsar(rootDir, outputFile)
  .then(() => {
    const stat = fs.statSync(outputFile);
    console.log(`Success! Packed into: ${outputFile} (${(stat.size / 1024 / 1024).toFixed(2)} MB in ${Date.now() - t0}ms)`);
  })
  .catch(err => {
    console.error('Packaging failed:', err);
    process.exit(1);
  });
