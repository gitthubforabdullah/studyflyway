/* Generate the consultant directory and profiles from reviewed provider records. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const original = require('../research/consultants.json');
const additional = require('../research/additional-consultants.json');
const icons = require('../research/consultant-icons.json');
const specialist = require('../research/specialist-consultants.json');
const records = [...original.consultants, ...additional.consultants, ...specialist.consultants];
const template = fs.readFileSync(path.join(root, 'about.html'), 'utf8');
const sharedVersion = require('./sync-university-styles');
const version = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, 'assets/consultants.css'))).digest('hex').slice(0,12);
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const link = (url, text, cls = '') => `<a${cls ? ` class="${cls}"` : ''} href="${escape(url)}">${escape(text)}</a>`;
function chrome(tag) {
  return template.match(new RegExp(`<${tag}[\\s\\S]*?</${tag}>`))[0]
    .replace(/ aria-current="page"/g, '')
    .replace(/(<a href="\/consultants")/g, '$1 aria-current="page"')
    .replace(/(src|href)="assets\//g, '$1="/assets/');
}
function document(title, description, content, directory = false) {
  return `<!doctype html>
<html lang="en"><head>
<script defer src="https://cloud.umami.is/script.js" data-website-id="147d6584-700d-4054-a0ed-f9371a75cb59"></script>
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9576135533715323" crossorigin="anonymous"></script>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escape(title)} | StudyFlyway</title><meta name="description" content="${escape(description)}">
<meta name="theme-color" content="#5755e8"><meta property="og:type" content="website"><meta property="og:title" content="${escape(title)} | StudyFlyway"><meta property="og:description" content="${escape(description)}">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/assets/style.css?v=${sharedVersion}"><link rel="stylesheet" href="/assets/consultants.css?v=${version}">
<script src="/assets/app.js" defer></script>${directory ? '<script src="/assets/consultants.js" defer></script>' : ''}
</head><body><a class="skip" href="#main">Skip to content</a>${chrome('header')}<main id="main">${content}</main>${chrome('footer')}
<!-- Cloudflare Web Analytics --><script type="module" src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token":"07d8341858dd49e6ba9de3b370754367"}'></script>
</body></html>\n`;
}
function logo(c) {
  const icon = icons[c.id];
  if (!icon || !fs.existsSync(path.join(root, icon.file))) throw Error(`Missing consultant image: ${c.id}`);
  return `<span class="consultant-logo"><img src="/${icon.file}" alt="${escape(c.name)} logo" width="64" height="48" loading="lazy" decoding="async"></span>`;
}
const notice = '<div class="notice">Listings are informational, not endorsements or service-quality verification. StudyFlyway is independent and has no declared partnership with these organisations. We do not receive their applications or fees.</div>';
const profileUrl = c => '/consultants/' + c.id;
const phone = value => link('tel:' + value.replace(/\s/g, ''), value);
function card(c) {
  const url = profileUrl(c);
  return `<article class="card university-card consultant-card" id="${c.id}" data-consultant data-search="${escape([c.name,c.summary,c.destinations,c.location || c.office].join(' '))}">
<div class="university-card-content"><span class="badge">External consultancy</span><a href="${url}">${logo(c)}</a><h2>${link(url, c.name)}</h2><p>${escape(c.summary)}</p>
<p class="consultant-location">${escape(c.location || ({'abn-overseas':'Pakistan offices & online','fes-consultants':'Offices across Pakistan','edwise-education':'Karachi','dignosco':'Lahore, Karachi & Islamabad','iec-consultancy':'Karachi & London'}[c.id]) || 'Pakistan')}</p>
<div class="university-card-bottom">${link(url, 'View details', 'btn secondary')}</div></div></article>`;
}
const directory = `<div class="page-top"><div class="wrap"><div class="crumb">${link('/', 'Home')} / Consultants</div><span class="eyebrow">Explore application support</span><h1>Find study abroad consultants</h1><p>Explore ${records.length} external consultants serving Pakistani students. Open a profile to compare destinations, services, offices and contact details.</p></div></div>
<section class="section"><div class="wrap">${notice}
<form class="consultant-search list-space" data-consultant-search hidden role="search"><label for="consultant-query">Search by consultant, destination or city<input id="consultant-query" name="q" type="search" placeholder="Try IDP, Germany or Lahore" aria-controls="consultant-results"></label><button class="btn secondary" type="reset">Reset search</button></form>
<div class="filter-top list-space"><p data-consultant-count role="status" aria-live="polite" aria-atomic="true">${records.length} consultants found</p><span>Independent provider directory</span></div>
<div id="consultant-results" class="university-directory-grid consultant-directory-grid">${records.map(card).join('\n')}</div>
<div class="empty" data-consultant-empty hidden><h2>No consultants match</h2><p>Try a different name, destination or city.</p><button class="btn" type="button" data-consultant-reset>Reset search</button></div>
<div class="callout list-space"><div><h2>Make an informed choice.</h2><p>Compare written fees, refund terms and university relationships before choosing support.</p></div>${link('/guides/choosing-a-consultant', 'Read our checklist', 'btn')}</div></div></section>`;
fs.writeFileSync(path.join(root, 'consultants.html'), document('Study Abroad Consultant Directory', `Compare ${records.length} study abroad consultants serving Pakistani students, with individual profiles, services, destinations, office details and official contacts.`, directory, true));
fs.mkdirSync(path.join(root, 'consultants'), {recursive:true});
for (const c of records) {
  const checked = c.checked || (original.consultants.includes(c) ? original.checked : specialist.consultants.includes(c) ? specialist.checked : additional.checked);
  const sources = [...new Set(c.sources || [c.website, c.contact])];
  const content = `<div class="page-top"><div class="wrap"><div class="crumb">${link('/', 'Home')} / ${link('/consultants', 'Consultants')} / ${escape(c.name)}</div><span class="eyebrow">External consultant profile</span><div class="consultant-title">${logo(c)}<h1>${escape(c.name)}</h1></div><p>${escape(c.summary)}</p><div class="actions">${link(c.website, 'Visit official website', 'btn')}${link('#contact', 'Contact details', 'btn secondary')}</div><p class="university-reviewed">Details checked <time datetime="${checked}">18 October 2026</time></p></div></div>
<section class="section"><div class="wrap">${notice}<div class="article-layout list-space"><article class="article">
<section id="overview"><h2>About ${escape(c.name)}</h2><p>${escape(c.summary)}</p><p>This profile summarises the provider’s published information. Confirm that its current services match your course, destination and application stage.</p></section>
<section id="destinations"><h2>Study destinations</h2><p>${escape(c.destinations)}</p></section>
<section id="services"><h2>Services and application support</h2><p>${escape(c.services)}</p></section>
<section id="offices"><h2>Office locations</h2><p>${escape(c.office)}</p><p>${link(c.contact, 'View official office and contact information')}. Confirm your appointment and the current address before visiting.</p></section>
<section id="contact"><h2>Contact details</h2><p><strong>Phone:</strong> ${phone(c.phone)}${c.otherPhone ? ' / ' + phone(c.otherPhone) : ''}${c.phoneNote ? '<br>' + escape(c.phoneNote) : ''}</p>
${c.email ? `<p><strong>Email:</strong> ${link('mailto:' + c.email, c.email)}${c.emailNote ? '<br>' + escape(c.emailNote) : ''}</p>` : `<p><strong>Online enquiry:</strong> ${link(c.contact, 'Use the official contact page')} for a counselling appointment or the appropriate branch email.</p>`}
<p><strong>Website:</strong> ${link(c.website, new URL(c.website).hostname)}</p></section>
<section id="fees"><h2>Fees and choosing a consultant</h2><p>Request a current written quote and refund terms directly. Ask which services are included and whether university application charges, test fees and visa charges are separate.</p><p>Ask which universities the consultant represents and who controls your application account. Admission, scholarships and visa decisions remain with the relevant institution or authority.</p>${link('/guides/choosing-a-consultant', 'Read the consultant selection checklist')}</section>
<section id="sources"><h2>Official sources</h2><p>Reviewed <time datetime="${checked}">18 October 2026</time>. Services and contact details may change.</p><ul class="source-list">${sources.map(url => '<li>' + link(url, url === c.website ? 'Official website and services' : url === c.contact ? 'Official contact and office details' : 'Additional official provider information') + '</li>').join('')}</ul><p class="credit">Logo or website icon: ${link(icons[c.id].website, c.name)}. Marks belong to their respective owners; use here identifies the provider.</p></section>
</article><aside class="sidebar" aria-label="On this profile"><h2>On this profile</h2>${[['overview','Overview'],['destinations','Study destinations'],['services','Services'],['offices','Office locations'],['contact','Contact details'],['fees','Fees and checklist'],['sources','Official sources']].map(([id,label])=>link('#'+id,label)).join('')}${link('/consultants','All consultants','btn')}</aside></div></div></section>`;
  fs.writeFileSync(path.join(root, 'consultants', c.id + '.html'), document(c.name + ' — Services & Contact Details', c.summary + ' Explore destinations, services, offices and official contacts.', content));
}
console.log(`Generated ${records.length} consultant profiles and the directory.`);
