'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const countries = require('../research/country-background.json');
const universities = [...require('../research/universities.json'), ...require('../research/additional-universities.json')];
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const link = (url, label) => '<a href="' + escape(url) + '">' + escape(label) + '</a>';
const references = sources => sources.map(([label, url]) => link(url, label)).join(' · ');
const start = '<!-- country-background:start -->';
const end = '<!-- country-background:end -->';
for (const [slug, country] of Object.entries(countries)) {
  const file = path.join(root, 'countries', slug + '.html');
  let html = fs.readFileSync(file, 'utf8');
  const content = `${start}
<section id="country-overview"><h2>Get to know ${escape(country.name)}</h2><p>${escape(country.overview)}</p></section>
<section id="country-history"><h2>A brief history of ${escape(country.name)}</h2><p>${escape(country.historyIntro)}</p>
<ol>${country.timeline.map(([period, text]) => `<li><strong>${escape(period)}:</strong> ${escape(text)}</li>`).join('')}</ol>
<p class="credit">History sources: ${references(country.historySources)}.</p></section>
<section id="major-cities"><h2>Major cities and student destinations</h2><p>These cities offer different settings for daily life. This is a selection of destinations, not a population ranking or a complete list of places to study.</p>
<nav aria-label="Cities in ${escape(country.name)}"><p>${country.cities.map(([name], index) => link('#city-' + index, name)).join(' · ')}</p></nav>
${country.cities.map(([name, region, description, tip, universitySlug], index) => {
  const university = universitySlug && universities.find(record => record.slug === universitySlug);
  if (universitySlug && (!university || university.country !== slug)) throw Error('Invalid city university link: ' + universitySlug);
  return `<div id="city-${index}"><h3>${escape(name)} — ${escape(region)}</h3><p>${escape(description)}</p><p><strong>For your study plans:</strong> ${escape(tip)}</p>${university ? '<p>' + link('../universities/' + universitySlug + '.html', 'Explore ' + university.name) + '</p>' : ''}</div>`;
}).join('\n')}
<p class="credit">Regional background: ${references(country.citySources)}. Practical comparison questions are StudyFlyway planning suggestions.</p></section>
<section id="destination-planning"><h2>Before choosing your city</h2><p>${escape(country.planning)}</p><p>Compare your exact campus, housing contract, daily travel and total budget before committing. ${link('../guides/study-budget.html', 'Use the study-budget checklist')} and ${link('../universities.html?country=' + slug, 'compare university profiles')}.</p><p class="credit">Country background reviewed <time datetime="${escape(country.checked)}">4 October 2026</time>. Follow the linked sources to explore the history and regions in more detail.</p></section>
${end}`.replace(/(<(?:section|div) id="(?:country-overview|country-history|major-cities|destination-planning|city-\d+)")/g, '$1 style="scroll-margin-top:45px"');
  if (html.includes(start)) {
    const first = html.indexOf(start), last = html.indexOf(end, first);
    if (last < 0) throw Error('Incomplete country content markers: ' + slug);
    html = html.slice(0, first) + content + html.slice(last + end.length);
  } else {
    if (!html.includes('<section id="admissions">')) throw Error('Missing country insertion point: ' + slug);
    html = html.replace('<section id="admissions">', content + '<section id="admissions">');
  }
  const sidebar = '<aside class="sidebar"><h2>In this guide</h2>';
  if (!html.includes('href="#country-overview"')) {
    if (!html.includes(sidebar)) throw Error('Missing country sidebar: ' + slug);
    html = html.replace(sidebar, sidebar + link('#country-overview', 'Country overview') + link('#country-history', 'History') + link('#major-cities', 'Major cities') + link('#destination-planning', 'Choosing your city'));
  }
  fs.writeFileSync(file, html);
}
console.log('Updated background, history and ' + Object.values(countries).reduce((sum, country) => sum + country.cities.length, 0) + ' city guides across five destinations.');
