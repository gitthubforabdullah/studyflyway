'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const output = process.argv.includes('--dist') ? path.join(root, 'dist') : root;
const records = JSON.parse(fs.readFileSync(path.join(root, 'research/universities.json'), 'utf8'));
const photos = JSON.parse(fs.readFileSync(path.join(root, 'research/campus-photos.json'), 'utf8'));
const files = [];
function collect(dir) {
  for (const ent of fs.readdirSync(dir, {withFileTypes: true})) {
    if (['dist', 'node_modules', '.git', '.tmp'].includes(ent.name)) continue;
    const target = path.join(dir, ent.name);
    if (ent.isDirectory()) collect(target);
    else if (ent.name.endsWith('.html') && !/^google[a-f0-9]+\.html$/.test(ent.name)) files.push(target);
  }
}
collect(output);
const errors = [];
const titles = new Set();
for (const file of files) {
  const html = fs.readFileSync(file, 'utf8');
  const rel = path.relative(output, file);
  assert.equal((html.match(/data-destinations-menu/g)||[]).length,1, rel+': shared dropdown');
  assert(html.includes('>Destinations</button>'),rel+': no dropdown arrow');
  assert.equal((html.match(/href="[^"]*english-tests.html"/g)||[]).length,2,rel+': English Tests navigation and footer');
  const head=html.match(/<head>[\s\S]*?<\/head>/)[0];
  assert.equal((head.match(/adsbygoogle.js\?client=ca-pub-9576135533715323/g)||[]).length,1,rel+': AdSense preserved');
  if (!/<nav id="navigation"[\s\S]*?>Universities<\/a>/.test(html)) errors.push(`${rel}: missing navigation link`);
  if (!/<footer[\s\S]*?>Universities<\/a>/.test(html)) errors.push(`${rel}: missing footer link`);
  for (const [, attr, url] of html.matchAll(/\b(href|src)="([^"]+)"/g)) {
    if (/^(https?:|mailto:|tel:|data:)/.test(url)) continue;
    const decoded = url.replaceAll('&amp;', '&');
    const [targetWithQuery, hash] = decoded.split('#');
    const target = targetWithQuery.split('?')[0];
    const resolved = !target ? file : target.startsWith('/') ? path.join(output, target.slice(1)) : path.resolve(path.dirname(file), target);
    if (!fs.existsSync(resolved)) { errors.push(`${rel}: broken ${attr} ${url}`); continue; }
    if (hash && resolved.endsWith('.html')) {
      const destination = fs.readFileSync(resolved, 'utf8');
      if (!destination.includes(`id="${hash}"`)) errors.push(`${rel}: missing anchor ${url}`);
    }
  }
  if (rel === 'universities.html' || rel.startsWith('universities' + path.sep)) {
    assert.equal((html.match(/<h1\b/g) || []).length, 1, `${rel}: one H1`);
    const title = html.match(/<title>(.*?)<\/title>/)[1];
    assert(!titles.has(title), `${rel}: duplicate title`);
    titles.add(title);
    assert(/<meta name="description" content="[^"]+"/.test(html), `${rel}: meta description`);
    assert(!/<style\b|\bstyle\s*=/.test(html), `${rel}: external CSS only`);
    for (const img of html.matchAll(/<img\b[^>]*data-campus-image[^>]*>/g)) {
      assert(/alt="[^"]+"/.test(img[0]), `${rel}: image alt text`);
      assert(/width="\d+"/.test(img[0]) && /height="\d+"/.test(img[0]), `${rel}: image dimensions`);
    }
  }
}
assert.equal(records.length, 15);
for (const u of records) {
  assert(fs.existsSync(path.join(output, 'universities', u.slug + '.html')));
  assert.equal(photos[u.id].length, 3);
  assert(photos[u.id].every(photo => photo.author && photo.license && photo.source));
  const guide = fs.readFileSync(path.join(output, 'countries', u.country + '.html'), 'utf8');
  assert(guide.includes('../universities/' + u.slug + '.html'), `${u.name}: linked country guide`);
}
const directory = fs.readFileSync(path.join(output, 'universities.html'), 'utf8');
assert.equal((directory.match(/data-university-name=/g) || []).length, 15);
const sitemapPath = path.join(output, 'sitemap.xml');
if (output !== root && fs.existsSync(sitemapPath)) {
  const sitemap = fs.readFileSync(sitemapPath, 'utf8');
  assert(sitemap.includes('/universities</loc>'));
  assert(sitemap.includes('/english-tests</loc>'));
  for (const u of records) {
    assert(sitemap.includes('/universities/' + u.slug + '</loc>'));
    const html = fs.readFileSync(path.join(output, 'universities', u.slug + '.html'), 'utf8');
    assert(html.includes('rel="canonical"'));
    assert(html.includes('application/ld+json'));
  }
}
assert.deepEqual(errors, [], errors.join('\n'));
console.log(`Verified ${files.length} HTML pages, internal links and anchors, 15 profiles, 45 credited gallery photos${output !== root ? ', and Netlify output' : ''}.`);
