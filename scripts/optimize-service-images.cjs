// Optional asset build: use an installed sharp package or NODE_PATH to locate it.
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');
const pages = require('./services-content.cjs');
const base = path.resolve(__dirname,'../assets/images');
(async () => {
 fs.mkdirSync(path.join(base,'services'),{recursive:true});
 for (const p of pages) {
  for (const width of [640,1200]) {
   const file = path.join(base,'services',`${p.slug}-${width}.webp`);
   await sharp(path.join(base,p.image)).rotate().resize(width,Math.round(width*.75),{fit:'cover',position:p.heroCropPosition || 'centre'}).webp({quality:80}).toFile(file);
   console.log(path.basename(file),fs.statSync(file).size);
  }
 }
})();
