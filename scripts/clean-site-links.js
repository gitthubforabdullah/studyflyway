/* Run after page generators so published and source pages share clean URLs. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const files = [];
function collect(dir) {
  for (const entry of fs.readdirSync(dir, {withFileTypes:true})) {
    if (['dist', '.git', '.tmp', 'node_modules'].includes(entry.name)) continue;
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) collect(file);
    else if (entry.name.endsWith('.html') && !/^google[a-f0-9]+\.html$/.test(entry.name)) files.push(file);
  }
}
collect(root);
for (const file of files) {
  let html = fs.readFileSync(file, 'utf8');
  const prefix = path.basename(file) === '404.html' ? '/' : '../'.repeat(path.relative(root, path.dirname(file)).split(path.sep).filter(Boolean).length);
  const icon = (name, href, label) => `<a href="${href}" class="social-icon" aria-label="${label}" title="${label}"${name === 'instagram' ? ' target="_blank" rel="noopener noreferrer"' : ''}><img src="${prefix}assets/${name}.svg" alt="" width="32" height="32"></a>`;
  html = html.replace(/<a\b[^>]*href="(?:\.\.\/)*mailto:studyflyway@gmail\.com"[^>]*>[\s\S]*?<\/a>/g, icon('gmail', 'mailto:studyflyway@gmail.com', 'Email StudyFlyway at studyflyway@gmail.com'));
  html = html.replace(/<a\b[^>]*href="https:\/\/www\.instagram\.com\/studyflyway\/"[^>]*>[\s\S]*?<\/a>/g, icon('instagram', 'https://www.instagram.com/studyflyway/', 'StudyFlyway on Instagram (opens in a new tab)'));
  html = html.replace(/<footer\b[\s\S]*?<\/footer>/, footer => {
    if (!footer.includes('mailto:studyflyway@gmail.com')) {
      footer = footer.replace(/<a\b[^>]*>Contact &(?:amp;)? corrections<\/a>/, link => link + icon('gmail', 'mailto:studyflyway@gmail.com', 'Email StudyFlyway at studyflyway@gmail.com') + icon('instagram', 'https://www.instagram.com/studyflyway/', 'StudyFlyway on Instagram (opens in a new tab)'));
    }
    const editorial = footer.match(/<a\b[^>]*href="[^"]*editorial-policy(?:\.html)?"[^>]*>Editorial policy<\/a>/);
    if (!editorial) return footer;
    return footer.replace(editorial[0], '').replace(/<a\b[^>]*href="mailto:studyflyway@gmail\.com"/, editorial[0] + '$&');
  });
  // Resolve only our own existing HTML pages; external providers keep their URLs.
  html = html.replace(/(["'])([^"'<>\s]*\.html(?:[?#][^"'<>\s]*)?)\1/g, (match, quote, value) => {
    if (/^(?:https?:)?\/\//.test(value) && !/^https?:\/\/(?:www\.)?studyflyway\.online\//.test(value)) return match;
    const local = value.replace(/^https?:\/\/(?:www\.)?studyflyway\.online/, '');
    const pathname = local.split(/[?#]/)[0];
    const target = pathname.startsWith('/') ? path.join(root, pathname.slice(1)) : path.resolve(path.dirname(file), pathname);
    if (!target.startsWith(root + path.sep) || !fs.existsSync(target) || /^google[a-f0-9]+\.html$/.test(path.basename(target))) return match;
    const relative = path.relative(root, target).split(path.sep).join('/');
    const clean = relative === 'index.html' ? '/' : '/' + relative.slice(0, -5);
    const suffix = local.slice(pathname.length);
    const origin = value.match(/^https?:\/\/[^/]+/);
    return quote + (origin ? origin[0] : '') + clean + suffix + quote;
  });
  fs.writeFileSync(file, html);
}
console.log(`Updated clean links and social icons on ${files.length} pages.`);
