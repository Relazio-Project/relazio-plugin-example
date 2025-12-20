import fs from 'fs';
import { manifest } from './manifest.js';

const output = JSON.stringify(manifest, null, 2);
fs.writeFileSync('manifest.json', output);

console.log('✅ Generated manifest.json');
console.log('');
console.log(output);

