'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const file = path.join(root, 'assets/style.css');
const marker = '/* Shared university styles: generated from universities.css. */';
const base = fs.readFileSync(file, 'utf8').split(marker)[0].trimEnd();
const css = base + '\n\n' + marker + '\n' + fs.readFileSync(path.join(root, 'assets/universities.css'), 'utf8');
fs.writeFileSync(file, css);
const version = crypto.createHash('sha256').update(css).digest('hex').slice(0,12);
function update(dir) {
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})) {
    if(['dist','.tmp','.git','node_modules'].includes(entry.name)) continue;
    const target=path.join(dir,entry.name);
    if(entry.isDirectory()){update(target);continue;}
    if(!entry.name.endsWith('.html'))continue;
    const html=fs.readFileSync(target,'utf8');
    const updated=html.replace(/href="([^"]*assets\/style\.css)(?:\?[^" ]*)?"/g,`href="$1?v=${version}"`);
    if(html!==updated)fs.writeFileSync(target,updated);
  }
}
update(root);
module.exports=version;
