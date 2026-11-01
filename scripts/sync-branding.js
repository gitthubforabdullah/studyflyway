'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
// Apply after page generators so every published page keeps the shared branding.
function update(dir) {
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    if (['dist', '.tmp', '.git', 'node_modules'].includes(entry.name)) continue;
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) { update(file); continue; }
    if (!entry.name.endsWith('.html')) continue;
    let html = fs.readFileSync(file, 'utf8');
    if (!html.includes('</head>')) continue;
    const prefix = path.relative(path.dirname(file), root).split(path.sep).join('/');
    const assets = (prefix ? prefix + '/' : '') + 'assets/';
    html = html.replace(/<link\b(?=[^>]*\brel="icon")[^>]*>/g, '');
    html = html.replace('</head>', `<link rel="icon" href="${assets}favicon.svg?v=original-logo-2" type="image/svg+xml"><link rel="icon" href="${assets}favicon.png?v=original-logo-2" type="image/png" sizes="96x96"></head>`);
    html = html.replace(/<span>StudyFlyway<small>/g, '<span><span class="brand-study">Study</span><span class="brand-flyway">Flyway</span><small>');
    html = html.replace(/(?:original-logo-1|blue-black-1)/g, 'original-logo-2');
    html = html.replace(/assets\/gmail\.svg(?:\?[^" ]*)?/g, 'assets/gmail.svg?v=refined-1');
    html = html.replace(/(<meta name="theme-color" content=")[^"]+/g, '$1#5755e8');
    if (html !== fs.readFileSync(file, 'utf8')) fs.writeFileSync(file, html);
  }
}
update(root);
