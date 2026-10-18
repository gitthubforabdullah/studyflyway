'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const base = process.argv.includes('--dist') ? path.join(root, 'dist') : root;
const records = [...require('../research/consultants.json').consultants, ...require('../research/additional-consultants.json').consultants, ...require('../research/specialist-consultants.json').consultants];
const icons = require('../research/consultant-icons.json');
const directory = fs.readFileSync(path.join(base, 'consultants.html'), 'utf8');
assert.equal((directory.match(/data-consultant data-search=/g) || []).length, records.length);
assert.equal(new Set(records.map(c => c.id)).size, records.length, 'Unique profile IDs');
for (const c of records) {
  const route = '/consultants/' + c.id;
  assert(directory.includes(`href="${route}"`), `Profile link: ${c.id}`);
  const html = fs.readFileSync(path.join(base, 'consultants', c.id + '.html'), 'utf8');
  assert.equal((html.match(/<h1>/g) || []).length, 1);
  for (const section of ['overview', 'destinations', 'services', 'offices', 'contact', 'fees', 'sources']) {
    assert(html.includes(`id="${section}"`), `Missing ${section}: ${c.id}`);
  }
  assert(html.includes('tel:'), `Phone: ${c.id}`);
  assert(html.includes(c.contact), `Official contact: ${c.id}`);
  assert(html.includes('href="/consultants"'), `Back link: ${c.id}`);
  assert(html.includes('/' + icons[c.id].file), `Logo: ${c.id}`);
  assert(fs.statSync(path.join(base, icons[c.id].file)).size > 100, `Logo file: ${c.id}`);
  for (const match of html.matchAll(/(?:href|src)="(\/[^"?#]*)(?:[?#][^"]*)?"/g)) {
    const target = path.join(base, match[1]);
    assert(fs.existsSync(target) || fs.existsSync(target + '.html'), `Broken local resource: ${match[1]}`);
  }
  if (base !== root) {
    const redirects = fs.readFileSync(path.join(base, '_redirects'), 'utf8');
    assert(redirects.includes(`${route} ${route}.html 200!`), `Clean URL: ${c.id}`);
  }
}
console.log(`Passed: all ${records.length} profiles, directory links, sections, contacts, logo files, local resources and deployment routes.`);
