const fs = require('fs');
const path = require('path');

const asarPath = process.argv[2] || path.join(__dirname, '..', 'dist', 'app.asar');
const destDir = process.argv[3] || path.join(__dirname, '..', 'unpacked');

if (!fs.existsSync(asarPath)) {
  console.error(`ASAR file not found: ${asarPath}`);
  process.exit(1);
}

const fd = fs.openSync(asarPath, 'r');
const buf = Buffer.alloc(16);
fs.readSync(fd, buf, 0, 16, 0);
const headerBlockSize = buf.readUInt32LE(4);
const baseOffset = 8 + headerBlockSize;
const headerSize = buf.readUInt32LE(12);
const headerBuf = Buffer.alloc(headerSize);
fs.readSync(fd, headerBuf, 0, headerSize, 16);
const header = JSON.parse(headerBuf.toString('utf8'));

let count = 0;
function extract(node, curPath) {
  if (node.files) {
    if (!fs.existsSync(curPath)) fs.mkdirSync(curPath, { recursive: true });
    for (const [name, child] of Object.entries(node.files)) {
      extract(child, path.join(curPath, name));
    }
  } else {
    const dir = path.dirname(curPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (node.unpacked || node.size === 0 || node.offset === undefined) {
      fs.writeFileSync(curPath, Buffer.alloc(0));
    } else {
      const b = Buffer.alloc(node.size);
      fs.readSync(fd, b, 0, node.size, baseOffset + parseInt(node.offset, 10));
      fs.writeFileSync(curPath, b);
    }
    count++;
  }
}

console.log(`Extracting ${asarPath} to ${destDir}...`);
for (const [name, child] of Object.entries(header.files)) {
  extract(child, path.join(destDir, name));
}
fs.closeSync(fd);
console.log(`Successfully extracted ${count} files!`);
