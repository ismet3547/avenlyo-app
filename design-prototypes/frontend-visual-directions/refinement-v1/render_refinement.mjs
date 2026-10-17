// Render the six new Direction 3 SVGs only. Original artwork is never written.
import fs from 'node:fs';import path from 'node:path';import {createRequire} from 'node:module';import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url);const sharp=require('sharp');const dir=path.join(path.dirname(fileURLToPath(import.meta.url)),'mockups');
for(const f of fs.readdirSync(dir).filter(f=>f.endsWith('.svg'))) await sharp(path.join(dir,f),{density:72}).png().toFile(path.join(dir,f.replace(/\.svg$/,'.png')));
console.log('Rendered six refined mockups.');
