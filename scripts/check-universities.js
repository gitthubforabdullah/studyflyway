'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const output = process.argv.includes('--dist') ? path.join(root, 'dist') : root;
const records = JSON.parse(fs.readFileSync(path.join(root, 'research/universities.json'), 'utf8'));
const additional = JSON.parse(fs.readFileSync(path.join(root, 'research/additional-universities.json'), 'utf8'));
const listings = [...records, ...additional];
const editorial = require('../research/university-editorial-content.json');
const alumni = require('../research/university-alumni.json');
assert.equal(Object.keys(alumni).length, listings.length, 'Every university has alumni records');
const researchSources = require('../research/university-profile-sources.json');
const detailedFacts = new Map(require('../research/university-detailed-facts.json').map(record => [record.id, record]));
assert.equal(Object.keys(editorial).length, listings.length, 'Every university has editorial content');
assert.equal(new Set(Object.values(editorial).map(item => item.overview)).size, listings.length, 'University overviews are distinct');
for (const u of listings) {
  assert(editorial[u.id]?.checks.length >= 2, u.name + ': individual comparison guidance');
  assert(researchSources.find(item => item.id === u.id)?.sources.length, u.name + ': research sources');
  const html = fs.readFileSync(path.join(output, 'universities', u.slug + '.html'), 'utf8');
  const facts = detailedFacts.get(u.id);
  assert(facts?.ranking && facts.internationalStudents, u.name + ': ranking and international-student data');
  assert(html.includes('id="rankings-and-community"'), u.name + ': ranking and international-student section');
  assert(html.includes(facts.ranking.position), u.name + ': ranking position rendered');
  assert(html.includes(Number(facts.internationalStudents.total).toLocaleString('en-US')), u.name + ': international-student total rendered');
  const graduates = alumni[u.id];
  assert(graduates?.people.length >= 2, u.name + ': at least two notable alumni required');
  assert.equal(new Set(graduates.people.map(person => person.name)).size, graduates.people.length, u.name + ': no duplicate alumni');
  const alumniSection = html.match(/<section id="notable-alumni">([\s\S]*?)<\/section>/)?.[1];
  assert(alumniSection, u.name + ': alumni section rendered');
  const escape = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
  for (const person of graduates.people) {
    assert(person.name && person.connection && person.achievement && /^https:\/\//.test(person.source), u.name + ': complete sourced alumni entry');
    assert(alumniSection.includes(escape(person.name)), u.name + ': alumnus rendered');
    assert(alumniSection.includes(escape(person.source)), u.name + ': alumni source rendered');
  }
  assert(html.includes('href="#notable-alumni"'), u.name + ': alumni navigation');
  for (const id of ['study-fit', 'rankings-and-community', 'notable-alumni', 'application-planning', 'offer-planning', 'compare-universities']) {
    assert.equal((html.match(new RegExp('id="' + id + '"', 'g')) || []).length, 1, u.name + ': ' + id);
  }
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length, u.name + ': unique section IDs');
}
if (output !== root && fs.existsSync(path.join(root, 'ads.txt'))) {
  assert.equal(fs.readFileSync(path.join(output, 'ads.txt'), 'utf8'), fs.readFileSync(path.join(root, 'ads.txt'), 'utf8'), 'Build preserves ads.txt');
}
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
  assert(/class="nav-dropdown-toggle"[^>]*>Destinations<\/a>/.test(html),rel+': no dropdown arrow');
  assert.equal(((html.match(/<nav id="navigation"[\s\S]*?<\/nav>/)[0]+html.match(/<footer[\s\S]*?<\/footer>/)[0]).match(/href="[^"]*english-tests.html"/g)||[]).length,2,rel+': English Tests navigation and footer');
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
  assert(photos[u.id].every(photo => photo.author && photo.license && photo.source && photo.local && fs.existsSync(path.join(output, photo.local))),u.name+': locally hosted, credited photographs');
  const guide = fs.readFileSync(path.join(output, 'countries', u.country + '.html'), 'utf8');
  assert(guide.includes('../universities/' + u.slug + '.html'), `${u.name}: linked country guide`);
}
const directory = fs.readFileSync(path.join(output, 'universities.html'), 'utf8');
assert.equal((directory.match(/data-university-name=/g) || []).length, 88);
assert.equal(listings.length,88);
assert.equal(new Set(listings.map(u=>u.slug)).size,88);
for (const [country,total] of Object.entries({australia:20,canada:20,uk:20,germany:20,'new-zealand':8})) {
  assert.equal(listings.filter(u=>u.country===country).length,total,country+': required count');
}
for (const u of additional) {
  assert(fs.existsSync(path.join(output,'universities',u.slug+'.html')),u.name+': static profile');
  assert(u.intro && u.links.website.startsWith('https://'),u.name+': reviewed directory content');
}
assert(directory.includes('class="university-directory-grid"'));
assert(!directory.includes('data-university-country'));
const sitemapPath = path.join(output, 'sitemap.xml');
if (output !== root && fs.existsSync(sitemapPath)) {
  const sitemap = fs.readFileSync(sitemapPath, 'utf8');
  assert(sitemap.includes('/universities</loc>'));
  assert(sitemap.includes('/english-tests</loc>'));
  for (const u of listings) {
    assert(sitemap.includes('/universities/' + u.slug + '</loc>'));
    const html = fs.readFileSync(path.join(output, 'universities', u.slug + '.html'), 'utf8');
    assert(html.includes('rel="canonical"'));
    assert(html.includes('application/ld+json'));
  }
}
assert.deepEqual(errors, [], errors.join('\n'));
console.log(`Verified ${files.length} HTML pages, internal links and anchors, 88 profiles, country totals, a continuous directory grid and 45 credited gallery photos${output !== root ? ', and Netlify output' : ''}.`);
