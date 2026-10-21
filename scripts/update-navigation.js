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
    html = html.replace(/<header\b[\s\S]*?<\/header>/, header => header.replace('<span>StudyFlyway<small>', '<span><span class="brand-study">Study</span><span class="brand-flyway">Flyway</span><small>'));
    const prefix = entry.name === '404.html' ? '/' : '../'.repeat(path.relative(root, dir).split(path.sep).filter(Boolean).length);
    // A stable PNG favicon lets search engines use the existing StudyFlyway mark.
    html = html.replace(/<link rel="icon"[^>]*>/g, `<link rel="icon" href="${prefix}assets/favicon.png" type="image/png" sizes="96x96">`);
    if (html.includes('rel="icon"') && !html.includes('rel="apple-touch-icon"')) html = html.replace('</head>', `<link rel="apple-touch-icon" href="${prefix}assets/apple-touch-icon.png" sizes="180x180"></head>`);
    const countries = {australia:'Australia', canada:'Canada', uk:'United Kingdom', germany:'Germany', 'new-zealand':'New Zealand'};
    const dropdown = `<div class="nav-dropdown" data-destinations-menu><a href="${prefix}destinations.html" class="nav-dropdown-toggle" aria-expanded="false" aria-controls="destination-links">Destinations</a><div id="destination-links" class="nav-dropdown-panel">${Object.entries(countries).map(([slug,name])=>`<a href="${prefix}countries/${slug}.html">${name}</a>`).join('')}</div></div>`;
    html = html.replace(/<nav\b[\s\S]*?<\/nav>/, nav => {
      const home = `<a href="/"${entry.name === 'index.html' && dir === root ? ' aria-current="page"' : ''}>Home</a>`;
      if (!/>Home<\/a>/.test(nav)) nav = nav.replace(/(<nav\b[^>]*>)/, '$1' + home);
      nav = nav.replace(/<div class="nav-dropdown" data-destinations-menu>[\s\S]*?<\/div>\s*<\/div>|<a\b[^>]*>Destinations<\/a>/, dropdown);
      if (!nav.includes('>English Tests</a>')) nav = nav.replace(/<a\b[^>]*>Guides<\/a>/, link => link + `<a href="${prefix}english-tests.html"${entry.name==='english-tests.html'?' aria-current="page"':''}>English Tests</a>`);
      if (!nav.includes('>About Us</a>')) nav = nav.replace(/<a\b[^>]*class="navcta"/, link => `<a href="${prefix}about.html"${entry.name==='about.html'?' aria-current="page"':''}>About Us</a>` + link);
      return nav;
    });
    html = html.replace(/<footer\b[\s\S]*?<\/footer>/, footer => footer.includes('>English Tests</a>') ? footer : footer.replace(/<a\b[^>]*>Application guides<\/a>/, link => link + `<a href="${prefix}english-tests.html">English Tests</a>`));
    const contactLinks = '<a href="mailto:studyflyway@gmail.com">studyflyway@gmail.com</a><a href="https://www.instagram.com/studyflyway/" target="_blank" rel="noopener noreferrer">Instagram: @studyflyway<span class="sr-only"> (opens in a new tab)</span></a>';
    html = html.replace(/<footer\b[\s\S]*?<\/footer>/, footer => footer.includes('mailto:studyflyway@gmail.com') ? footer : footer.replace(/<a\b[^>]*>Contact &(?:amp;)? corrections<\/a>/, link => link + contactLinks));
    if (entry.name === 'contact.html' && !html.includes('<h2>Contact StudyFlyway</h2>')) {
      html = html.replace('<aside class="sidebar">', '<aside class="sidebar"><h2>Contact StudyFlyway</h2><p>Email us or connect with us on Instagram.</p>' + contactLinks);
    }
    if (html !== fs.readFileSync(file, 'utf8')) fs.writeFileSync(file, html);
  }
}
update(root);
