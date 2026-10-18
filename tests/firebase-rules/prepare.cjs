/* The CLI forbids rules outside its project directory. Copy, never modify, the full rules. */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const source = path.resolve(__dirname, '../../firebase/production-with-secret-atlas.rules.json');
const target = path.join(__dirname, 'merged.rules.json');
fs.copyFileSync(source, target);
assert(fs.readFileSync(source).equals(fs.readFileSync(target)), 'Emulator rules must exactly match full merged rules');
console.log('Prepared byte-identical full rules inside emulator project directory');
