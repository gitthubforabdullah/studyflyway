'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const scholarships = require('../research/scholarships.json');
test('scholarship detail pages and cards agree with the reviewed records', () => {
  const directory = fs.readFileSync('scholarships.html', 'utf8');
  for (const r of scholarships) {
    const html = fs.readFileSync('scholarships/' + r.slug + '.html', 'utf8');
    const card = [...directory.matchAll(/<article\b[^>]*data-scholarship[^>]*>[\s\S]*?<\/article>/g)].map(m=>m[0]).find(c=>c.includes('/scholarships/' + r.slug + '"'));
    assert(card, r.slug + ': directory card');
    for (const text of [card, html]) {assert(text.includes(`data-status="${r.status}"`), r.slug + ': status'); assert(text.includes(`data-closes="${r.closes || ''}"`), r.slug + ': cutoff');}
    for (const source of r.sources) assert(html.includes(source.url.replaceAll('&','&amp;')), r.slug + ': source rendered');
    assert(html.includes(r.checked), r.slug + ': actual review date');
  }
});
test('Commonwealth uses the earlier Pakistan nomination cutoff', () => {
  const r = scholarships.find(r=>r.slug === 'commonwealth-masters');
  assert.equal(new Date(r.closes).toISOString(), '2026-10-20T11:00:00.000Z');
  assert(r.dates.includes('BOTH')); assert(r.dates.includes('20:00'));
});
test('expired and unconfirmed opening statuses do not stay Open', () => {
  const code = fs.readFileSync('assets/app.js','utf8').match(/document\.querySelectorAll\('\[data-scholarship\]'\)\.forEach\(card => \{[\s\S]*?\n\}\);/)[0];
  for (const [dataset, now, expected] of [
    [{status:'Open', closes:'2026-10-20T11:00:00Z'}, Date.parse('2026-10-20T11:00:01Z'), 'Closed'],
    [{status:'Open', reviewExpires:'2026-11-02T00:00:00Z'}, Date.parse('2026-11-03T00:00:00Z'), 'Check dates'],
    [{status:'Upcoming', opens:'2026-10-21T00:00:00Z'}, Date.parse('2026-10-22T00:00:00Z'), 'Check dates']
  ]) {const badge={}; const card={dataset, querySelector:()=>badge}; vm.runInNewContext(code,{now,document:{querySelectorAll:()=>[card]}}); assert.equal(card.dataset.status,expected); assert.equal(badge.textContent,expected);}
});
test('reviewed university figures agree with publisher evidence without resetting old reviews', () => {
  const facts = require('../research/university-detailed-facts.json');
  const reviews = require('../research/university-facts-review.json');
  assert.equal(facts.length,88);
  for (const r of reviews) {const f=facts.find(f=>f.id===r.id); assert.equal(f.ranking.position,r.position); assert.equal(f.ranking.edition,r.edition); if(r.internationalStudents)assert.equal(f.internationalStudents.total,r.internationalStudents);}
  const hamburg=facts.find(f=>f.id==='university-of-hamburg'); assert.equal(hamburg.checked,'2026-10-04');
  const ucl=facts.find(f=>f.id==='university-college-london'); assert.equal(ucl.ranking.position,'=8'); assert.equal(ucl.internationalStudents.total,29881);
});
