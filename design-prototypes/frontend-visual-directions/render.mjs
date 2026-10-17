// Rasterize only isolated design artwork. Requires sharp in the authoring environment.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url);const sharp=require('sharp');
const root=path.dirname(fileURLToPath(import.meta.url));
for(const f of fs.readdirSync(path.join(root,'mockups')).filter(f=>f.endsWith('.svg'))){
 const src=path.join(root,'mockups',f);await sharp(src,{density:72}).png().toFile(src.replace(/\.svg$/,'.png'));
}
console.log('Rendered all SVG compositions to native-size PNGs.');
