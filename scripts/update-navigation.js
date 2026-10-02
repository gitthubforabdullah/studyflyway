/* Keep the static navigation consistent, including regenerated pages. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
function update(dir) {
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    if (['dist', '.tmp', '.git', 'node_modules'].includes(entry.name)) continue;
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) { update(file); continue; }
    if (!entry.name.endsWith('.html')) continue;
    let html = fs.readFileSync(file, 'utf8');
    const prefix = entry.name === '404.html' ? '/' : '../'.repeat(path.relative(root, dir).split(path.sep).filter(Boolean).length);
    const countries = {australia:'Australia', canada:'Canada', uk:'United Kingdom', germany:'Germany', 'new-zealand':'New Zealand'};
    const dropdown = `<div class="nav-dropdown" data-destinations-menu><button type="button" class="nav-dropdown-toggle" aria-expanded="false" aria-controls="destination-links">Destinations</button><div id="destination-links" class="nav-dropdown-panel">${Object.entries(countries).map(([slug,name])=>`<a href="${prefix}countries/${slug}.html">${name}</a>`).join('')}<a class="nav-dropdown-all" href="${prefix}destinations.html">All destinations</a></div></div>`;
    html = html.replace(/<nav\b[\s\S]*?<\/nav>/, nav => {
      nav = nav.replace(/<div class="nav-dropdown" data-destinations-menu>[\s\S]*?<\/div>\s*<\/div>|<a\b[^>]*>Destinations<\/a>/, dropdown);
      if (!nav.includes('english-tests.html')) nav = nav.replace(/<a\b[^>]*>Guides<\/a>/, link => link + `<a href="${prefix}english-tests.html"${entry.name==='english-tests.html'?' aria-current="page"':''}>English Tests</a>`);
      return nav;
    });
    html = html.replace(/<footer\b[\s\S]*?<\/footer>/, footer => footer.includes('english-tests.html') ? footer : footer.replace(/<a\b[^>]*>Application guides<\/a>/, link => link + `<a href="${prefix}english-tests.html">English Tests</a>`));
    if (html !== fs.readFileSync(file, 'utf8')) fs.writeFileSync(file, html);
  }
}
update(root);
