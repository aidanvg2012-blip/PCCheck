const fs = require('node:fs');
const path = require('node:path');

const sourceRoot = path.resolve(__dirname, '..', '..');
const output = path.resolve(__dirname, '..', 'www');
const files = ['index.html','styles.css','app.js','manifest.webmanifest','icon.svg','guides.html','privacy.html'];
fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });
for (const file of files) {
  const from = path.join(sourceRoot, file);
  if (!fs.existsSync(from)) throw new Error('Missing PCCheck web asset: ' + file);
  fs.copyFileSync(from, path.join(output, file));
}
console.log('Prepared PCCheck mobile web bundle in mobile/www');
