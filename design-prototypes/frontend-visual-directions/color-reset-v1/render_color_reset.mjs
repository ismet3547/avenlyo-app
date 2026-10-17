// Static design artwork only; uses existing authoring tools, no dependencies added.
import fs from 'node:fs';import path from 'node:path';import {createRequire} from 'node:module';import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url),sharp=require('sharp');
const dir=path.join(path.dirname(fileURLToPath(import.meta.url)),'mockups');
for(const f of fs.readdirSync(dir).filter(f=>f.endsWith('.svg'))) await sharp(path.join(dir,f),{density:72}).png().toFile(path.join(dir,f.replace(/\.svg$/,'.png')));
console.log('Rendered color and typography studies.');
