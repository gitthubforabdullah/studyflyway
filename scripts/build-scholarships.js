'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const records = require('../research/scholarships.json');
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const dateLabel = iso => new Date(iso + 'T12:00:00Z').toLocaleDateString('en-GB', {day:'numeric', month:'long', year:'numeric', timeZone:'UTC'});
const credit = record => `<p class="credit">Checked <time datetime="${record.checked}">${escape(record.checked)}</time>. Dates describe the named intake; confirm any later changes with the provider.</p>`;
function attrs(tag, record) {
  for (const [key, value] of Object.entries({status: record.status, opens: record.opens || '', closes: record.closes || '', 'review-expires': record.reviewExpires || '2026-11-02T00:00:00Z'})) {
    const pattern = new RegExp(` data-${key}="[^"]*"`, 'g');
    tag = tag.replace(pattern, '');
    tag = tag.replace(/>$/, ` data-${key}="${escape(value)}">`);
  }
  return tag;
}
for (const record of records) {
  const file = path.join(root, 'scholarships', record.slug + '.html');
  let html = fs.readFileSync(file, 'utf8');
  html = html.replace(/<div class="meta" data-scholarship[^>]*>/, tag => attrs(tag, record));
  html = html.replace(/(<span class="badge[^"]*" data-status-label>)[^<]*/, '$1' + record.status);
  html = html.replace(/Reviewed \d+ [A-Za-z]+ \d{4}/, 'Reviewed ' + dateLabel(record.checked));
  for (const [id, heading, text] of [['eligibility', 'Who should explore this?', record.eligibility], ['coverage', 'What does it cover?', record.coverage], ['dates', 'Application dates', record.dates]]) {
    const content = `<section id="${id}"><h2>${heading}</h2><p>${escape(text)}</p>${id === 'dates' ? credit(record) : ''}</section>`;
    html = html.replace(new RegExp(`<section id="${id}">[\\s\\S]*?<\\/section>`), content);
  }
  html = html.replace(/(<section id="apply"><h2>Your next steps<\/h2>)<ol>[\s\S]*?<\/ol>/, '$1<ol>' + record.steps.map(step => `<li>${escape(step)}</li>`).join('') + '</ol>');
  html = html.replace(/(<h2>Source<\/h2>)<ul class="source-list">[\s\S]*?<\/ul>/, '$1<ul class="source-list">' + record.sources.map(source => `<li><a href="${escape(source.url)}" target="_blank" rel="noopener noreferrer">${escape(source.label)}<span class="sr-only"> (opens in a new tab)</span></a></li>`).join('') + '</ul>');
  // Keep the main application link current when a provider moves its page.
  html = html.replace(/(<div class="actions"><a href=")[^"]+/, '$1' + escape(record.sources[0].url));
  fs.writeFileSync(file, html);
}
for (const name of ['scholarships.html', 'index.html']) {
  const file = path.join(root, name);
  let html = fs.readFileSync(file, 'utf8');
  html = html.replace(/<article\b[^>]*data-scholarship[^>]*>[\s\S]*?<\/article>/g, card => {
    const slug = card.match(/href="\/?scholarships\/([^"#.?]+)/)?.[1];
    const record = records.find(item => item.slug === slug);
    if (!record) throw Error('Unrecognised scholarship card: ' + slug);
    card = card.replace(/^<article[^>]*>/, tag => attrs(tag, record));
    card = card.replace(/(<span class="badge[^"]*" data-status-label>)[^<]*/, '$1' + record.status);
    card = card.replace(/<small>(?:Official source linked|Reviewed \d+ [A-Za-z]+ \d{4})<\/small>/, '<small>Reviewed ' + dateLabel(record.checked) + '</small>');
    return card;
  });
  html = html.replace(/(?:Scholarship sources|Sources) reviewed \d+ [A-Za-z]+ \d{4}\./g, 'Review dates are shown on individual scholarship listings.');
  fs.writeFileSync(file, html);
}
console.log(`Updated ${records.length} scholarship profiles and their directory/homepage cards.`);
