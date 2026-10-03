/* Regenerate static university pages from the reviewed editorial records. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const styleVersion = require('./sync-university-styles');
const universities = JSON.parse(fs.readFileSync(path.join(root, 'research/universities.json'), 'utf8'));
const additional = JSON.parse(fs.readFileSync(path.join(root, 'research/additional-universities.json'), 'utf8'));
const listings = [...universities, ...additional].sort((a,b)=>a.country.localeCompare(b.country)||a.name.localeCompare(b.name));
const photos = JSON.parse(fs.readFileSync(path.join(root, 'research/campus-photos.json'), 'utf8'));
const iconFile=path.join(root,'research/university-icons.json');
const universityIcons=fs.existsSync(iconFile)?JSON.parse(fs.readFileSync(iconFile,'utf8')):{};
const countries = {australia: 'Australia', canada: 'Canada', uk: 'United Kingdom', germany: 'Germany', 'new-zealand': 'New Zealand'};
const labels = {website: 'Official university website', about: 'History and university background', subjects: 'Academic structure', campus: 'Campus locations', courses: 'Courses and study options', admissions: 'International admissions and applications', requirements: 'Current entry requirements', fees: 'Tuition fees and study costs', scholarships: 'Scholarships and funding', accommodation: 'Accommodation options', life: 'Student life and campus facilities', support: 'Student support services'};
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const anchor = (url, label, cls = '') => `<a${cls ? ` class="${cls}"` : ''} href="${escape(url)}">${escape(label)}</a>`;
const expanded = require('./university-profile-content')({escape, anchor, listings, countries});
const template = fs.readFileSync(path.join(root, 'about.html'), 'utf8');
const header = template.match(/<header[\s\S]*?<\/header>/)[0];
const footer = template.match(/<footer[\s\S]*?<\/footer>/)[0];
function chrome(part, prefix) {
  return part.replace(/href="(?!https?:|#|\/)([^"]+)"/g, `href="${prefix}$1"`).replace(/src="assets\//g, `src="${prefix}assets/`).replace(/ aria-current="page"/g, '').replace(/(<a href="[^" ]*universities.html")/, '$1 aria-current="page"');
}
function document(title, description, content, prefix, directory = false) {
  return `<!doctype html>
<html lang="en">
<head>
  <script defer src="https://cloud.umami.is/script.js" data-website-id="a0335429-6d7e-4faa-8a22-d8dede010ea7"></script>
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9576135533715323" crossorigin="anonymous"></script>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escape(title)} | StudyFlyway</title>
  <meta name="description" content="${escape(description)}">
  <meta name="theme-color" content="#5755e8">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${escape(title)} | StudyFlyway">
  <meta property="og:description" content="${escape(description)}">
  <link rel="icon" href="${prefix}assets/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="${prefix}assets/style.css?v=${styleVersion}">
  <script src="${prefix}assets/app.js" defer></script>
  ${directory ? '<script src="assets/universities.js" defer></script>' : ''}
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
${chrome(header, prefix)}
<main id="main">
${content}
</main>
${chrome(footer, prefix)}
<!-- Cloudflare Web Analytics --><script type='module' src='https://static.cloudflareinsights.com/beacon.min.js' data-cf-beacon='{"token": "07d8341858dd49e6ba9de3b370754367"}'></script><!-- End Cloudflare Web Analytics -->
</body>
</html>
`;
}
function imageUrl(photo, size) {
  if(photo.local) return '/' + photo.local;
  const filename = photo.file.replaceAll(' ', '_');
  const hash = crypto.createHash('md5').update(filename).digest('hex');
  const encoded = encodeURIComponent(filename);
  // The original is used for small images to avoid upscaling.
  const base = `https://upload.wikimedia.org/wikipedia/commons/${hash[0]}/${hash.slice(0, 2)}/${encoded}`;
  return photo.width <= size ? base : `https://upload.wikimedia.org/wikipedia/commons/thumb/${hash[0]}/${hash.slice(0, 2)}/${encoded}/${size}px-${encoded}`;
}
function image(photo, size, lazy = true) {
  return `<img src="${imageUrl(photo, size)}" alt="${escape(photo.caption)}" width="${photo.width}" height="${photo.height}" ${lazy ? 'loading="lazy"' : 'fetchpriority="high"'} decoding="async" data-campus-image>`;
}
function credit(photo) {
  let licenseUrl, licenseName;
  if (photo.license === 'pd') { licenseUrl = photo.source + '#Licensing'; licenseName = 'Public domain'; }
  else if (photo.license === 'free') { licenseUrl = photo.source + '#Licensing'; licenseName = 'Copyright holder permits free use'; }
  else if (photo.license === 'zero') { licenseUrl = 'https://creativecommons.org/publicdomain/zero/1.0/'; licenseName = 'CC0 1.0'; }
  else { licenseUrl = `https://creativecommons.org/licenses/${photo.license}/`; licenseName = `CC ${photo.license.replace('by-sa', 'BY-SA').replace('by/', 'BY ').replace('/', ' ')}`; }
  return `Photo: ${anchor(photo.source, photo.author)} / Wikimedia Commons · ${anchor(licenseUrl, licenseName)}.`;
}
function figure(photo, size, lazy = true) {
  return `<figure class="campus-photo">
  ${image(photo, size, lazy)}
  <figcaption>${escape(photo.caption)} <span class="credit">${credit(photo)}</span></figcaption>
</figure>`;
}
const profileDir = path.join(root, 'universities');
fs.mkdirSync(profileDir, {recursive: true});
function identity(u) {
  const siteIcon=universityIcons[u.id];
  if(siteIcon) return `<span class="university-identity university-identity-icon"><img src="/${siteIcon.file}" alt="${escape(u.name)} website icon" width="${siteIcon.width}" height="${siteIcon.height}" loading="lazy" decoding="async"></span>`;
  const photo=photos[u.id]?.[0];
  if(photo?.local) return `<span class="university-identity university-identity-photo">${image(photo,96)}<span class="sr-only">Campus photograph; credits in university profile</span></span>`;
  const initials=u.name.split(/\s+/).filter(word=>!['of','the','and'].includes(word.toLowerCase())).map(word=>word[0]).slice(0,4).join('');
  return `<span class="university-identity" aria-hidden="true">${escape(initials)}</span>`;
}
function icon(kind) {
  const paths={location:'M12 21s7-7 7-12a7 7 0 0 0-14 0c0 5 7 12 7 12z M15 9a3 3 0 1 1-6 0 3 3 0 0 1 6 0',study:'M2 8l10-5 10 5-10 5-10-5z M6 10v7c4 3 8 3 12 0v-7 M22 8v9',funding:'M4 5h16v14H4z M8 9h8 M8 13h6'};
  return `<svg class="university-fact-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[kind]}"></path></svg>`;
}
function profileHeader(u,photo) {
  const country=countries[u.country];
  const initials=identity(u).replace('university-identity','university-profile-lettermark');
  return `<div class="page-top university-profile-top"><div class="wrap"><div class="crumb">${anchor('../index.html','Home')} / ${anchor('../universities.html','Universities')} / ${anchor('../countries/'+u.country+'.html',country)} / ${escape(u.name)}</div>
  <div class="university-profile-hero"><div class="university-profile-heading"><span class="eyebrow">Explore your university options</span><div class="university-title-row">${identity(u)}<h1>${escape(u.name)}</h1></div><p>${escape(u.city)} · ${country}</p><div class="actions">${anchor(u.links.website,'Visit official website','btn')}${anchor(u.links.courses||'#academic-options',u.links.courses?'View official courses':'Explore study options','btn secondary')}</div><p class="university-reviewed">Core details checked <time datetime="${u.checked}">2 October 2026</time> &middot; Profile expanded ${expanded.date}</p></div>${photo?figure(photo,960,false):initials}</div></div></div>`;
}
for (const university of universities) {
  const u = university;
  const country = countries[u.country];
  const gallery = photos[u.id];
  if (!gallery || gallery.length < 3) throw Error(`Missing reviewed gallery for ${u.name}`);
  const sourceLinks = Object.entries(u.links).filter(([key, url], index, all) => all.findIndex(([, value]) => value === url) === index).map(([key, url]) => `<li>${anchor(url, labels[key])}</li>`).join('\n');
  const regional = u.country === 'uk' || u.country === 'germany';
  const related = u.related.map(slug => {
    const source = fs.readFileSync(path.join(root, 'scholarships', slug + '.html'), 'utf8');
    const title = source.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)[1].replace(/<[^>]*>/g, '');
    return `<li>${anchor('../scholarships/' + slug + '.html', title)}</li>`;
  }).join('\n');
  const content = `${profileHeader(u, gallery[0])}
<section class="section">
  <div class="wrap article-layout university-layout">
    <article class="article university-article">
      <section id="introduction"><h2>Meet ${escape(u.name)}</h2><p>${escape(u.intro)}</p><p class="credit">Source: ${anchor(u.links.about, 'Official university background')}${u.links.campus ? ' · ' + anchor(u.links.campus, 'Campus information') : ''}.</p></section>
      ${expanded.studyFit(u)}
      ${expanded.rankings(u)}
      <section id="key-information">
        <h2>Key information</h2>
        <dl class="university-facts">
          <div><dt>Institution type</dt><dd>${escape(u.type)}</dd></div>
          <div><dt>Founded</dt><dd>${escape(u.founded)}</dd></div>
          <div><dt>Study levels</dt><dd>Undergraduate · postgraduate taught · doctoral research</dd></div>
          <div><dt>Teaching language</dt><dd>${escape(u.language)}</dd></div>
          <div class="university-fact-wide"><dt>Main campus location</dt><dd>${escape(u.campus)}</dd></div>
        </dl>
        <p class="credit">Confirm location and language on the ${anchor(u.links.courses, 'official programme listing')}.</p>
      </section>
      <section id="academic-options"><h2>Academic options</h2><p>Subject areas to explore include:</p><ul class="university-subjects">${u.subjects.map(subject => `<li>${escape(subject)}</li>`).join('')}</ul><p>These are broad subject areas, not a complete course list. Check the degree title, study level, campus and teaching language before shortlisting.</p><div class="actions">${anchor(u.links.courses, 'Browse official course listings', 'btn secondary')}</div>${u.links.subjects ? '<p class="credit list-space">' + anchor(u.links.subjects, 'Official academic structure') + '</p>' : ''}</section>
      <section id="admissions"><h2>International admissions</h2><p>${escape(u.admissionsNote)}</p><p>Requirements vary by programme. Pakistani applicants should compare academic prerequisites, qualification recognition, language evidence, required documents and deadlines for their intended intake. Postgraduate taught and research applications may follow different routes; contact the university if your qualification is not clearly covered.</p><ul class="source-list"><li>${anchor(u.links.admissions, 'Official application guidance')}</li><li>${anchor(u.links.requirements, 'Current entry requirements')}</li></ul><p class="credit list-space">${anchor('../guides/application-checklist.html', 'Prepare your application documents')} · ${anchor('../guides/choosing-a-course.html', 'Choose a course')}</p></section>
      ${expanded.applicationPlan(u)}
  <section id="tuition"><h2>Tuition and scholarships</h2><p>Use the university’s current fee information for your exact programme, study year and fee status. Include compulsory student charges, housing, insurance, course materials and travel in your budget. Scholarship eligibility, coverage and application dates must be checked separately.</p>${u.id === 'rwth' ? '<p>RWTH’s student union publishes semester contributions and funding advice. International Academy programmes can charge separate tuition fees: check the exact programme rather than applying the standard contribution information to every course.</p>' : ''}<ul class="source-list"><li>${anchor(u.links.fees, u.id === 'rwth' ? 'Official student-union semester contribution information' : 'Official tuition and fee information')}</li><li>${anchor(u.links.scholarships, 'Official scholarships and funding guidance')}</li></ul><p class="notice">No numerical tuition estimate is published here. Obtain the current fee for your programme and year directly from the university. StudyFlyway is an independent information portal.</p>${related ? `<h3>${regional ? 'Related funding guides' : 'Related scholarship guide'}</h3><ul class="source-list">${related}</ul>${regional ? '<p class="credit list-space">These are country-level funding starting points. A university listing does not establish that every programme participates or that you are eligible.</p>' : ''}` : ''}<p class="list-space">${anchor('../scholarships.html?country=' + u.country, 'Explore ' + country + ' scholarships')} · ${anchor('../guides/study-budget.html', 'Build a study budget')}</p></section>
      ${expanded.budgetPlan(u)}
      <section id="campus-life"><h2>Life on campus</h2><p>${escape(u.life)}</p><p>Compare accommodation contracts, room facilities, commute and application dates directly with the provider. Availability and support arrangements can change.</p><ul class="source-list"><li>${anchor(u.links.accommodation, 'Accommodation and housing options')}</li><li>${anchor(u.links.life, 'Official student life and campus guide')}</li>${u.links.support ? '<li>' + anchor(u.links.support, 'Student support services') + '</li>' : ''}</ul></section>
      <section id="gallery"><h2>A closer look at campus</h2><p>Genuine photographs of university buildings and grounds. Photographs may predate current facilities; captions identify historical views where relevant.</p><div class="campus-gallery">${gallery.map(photo => figure(photo, 960)).join('\n')}</div><p class="credit">Images are displayed at responsive sizes; header and directory previews may be cropped by the layout. Each photograph retains its linked reuse licence. ${anchor('../credits.html#university-photos', 'University photo credits')}</p></section>
      ${expanded.related(u)}
      <section id="official-links"><h2>Official university links</h2><div class="actions">${anchor(u.links.website, 'Visit official university website', 'btn')}</div><ul class="source-list list-space">${['admissions', 'courses', 'scholarships', 'accommodation'].map(key => '<li>' + anchor(u.links[key], labels[key]) + '</li>').join('')}</ul></section>
      <section id="sources"><h2>Sources and last checked date</h2><p>Last checked <time datetime="${u.checked}">2 October 2026</time>. Original summaries draw on these official university resources${u.id === 'rwth' ? ' and official student-union guidance' : ''}. Programme details, fees and services can change; the official provider has the final information.</p><ul class="source-list">${sourceLinks}</ul><p class="credit list-space">Photo descriptions and licences: the Wikimedia Commons source linked beneath each image. This directory is a starting point for research, not a ranking or endorsement.</p></section>
    </article>
    ${expanded.navigation(u, true)}
  </div>
</section>`;
  fs.writeFileSync(path.join(profileDir, u.slug + '.html'), document(u.name + ' — Study, Admissions and Campus Guide', `Explore ${u.name} in ${country}: academic options, international admissions, official fees and scholarships, accommodation and credited campus photographs.`, content, '../'));
}
for (const u of additional) {
  const country=countries[u.country];
  const resources=Object.entries(u.links).filter(([key])=>key!=='website').map(([key,url])=>`<li>${anchor(url,labels[key])}</li>`).join('');
  const content=`${profileHeader(u)}
  <section class="section"><div class="wrap article-layout university-layout"><article class="article university-article">
  ${expanded.studyFit(u)}
  ${expanded.rankings(u)}
  <section id="academic-options"><h2>Academic options and admissions</h2><p>Start with the university's official course information and select your intended programme and study level. Requirements vary by programme. Pakistani applicants should confirm qualification recognition, subject prerequisites, English or other teaching-language requirements, documents and deadlines directly with admissions.</p>${u.links.courses?'<p>'+anchor(u.links.courses,'Browse official courses and study options')+'</p>':''}${u.links.admissions?'<p>'+anchor(u.links.admissions,'Official admissions information')+'</p>':''}<p>${anchor('../english-tests.html','IELTS and PTE guidance')} · ${anchor('../guides/application-checklist.html','Application checklist')}</p></section>
  ${expanded.applicationPlan(u)}
  <section id="tuition"><h2>Tuition and scholarships</h2><p>Compare the fee for your specific course, intake and international fee status. Ask the university about compulsory charges and scholarship eligibility before making a budget. No numerical tuition estimate or funding guarantee is given here.</p>${u.links.fees?'<p>'+anchor(u.links.fees,'Official tuition and fee information')+'</p>':''}${u.links.scholarships?'<p>'+anchor(u.links.scholarships,'Official scholarships and funding information')+'</p>':''}<p>${anchor('../scholarships.html?country='+u.country,'Explore '+country+' scholarship guides')} · ${anchor('../guides/study-budget.html','Plan your study budget')}</p></section>
  ${expanded.budgetPlan(u)}
  <section id="campus-life"><h2>Campus and accommodation planning</h2><p>Check the teaching campus for your course before choosing housing. Use the university's current student information to compare accommodation availability, library access, study facilities, societies, sport and international student support. Confirm contracts, commuting costs and support arrangements directly.</p>${u.links.accommodation?'<p>'+anchor(u.links.accommodation,'Official accommodation information')+'</p>':''}${u.links.life?'<p>'+anchor(u.links.life,'Official student life information')+'</p>':''}</section>
  ${expanded.related(u)}
  <section id="sources"><h2>Official links and sources</h2><div class="actions">${anchor(u.links.website,'Visit official university website','btn')}</div>${resources?'<ul class="source-list list-space">'+resources+'</ul>':''}<p class="credit list-space">Institution and official website checked <time datetime="${u.checked}">2 October 2026</time>. University context and comparison guidance expanded ${expanded.date}, with research sources linked in the profile. Programme requirements, fees and deadlines must be checked for your intake.</p><p>StudyFlyway is an independent information portal. Listings do not establish partnerships or guaranteed admissions.</p></section>
  </article>${expanded.navigation(u)}</div></section>`;
  fs.writeFileSync(path.join(profileDir,u.slug+'.html'),document(u.name+' - Courses, Admissions and Student Guide',`Explore ${u.name} in ${country}. Compare its academic setting, campus choices, application preparation, costs, funding and accommodation.`,content,'../'));
}
function card(u) {
  const profile='universities/'+u.slug+'.html';
  return `<article class="card university-card" id="university-${u.slug}" data-university data-country="${u.country}" data-university-name="${escape(u.name)}">
    <div class="university-card-content"><span class="badge">${countries[u.country]}</span>${identity(u)}<h2>${anchor(profile,u.name)}</h2>
    <p class="university-course-link">${anchor(u.links.courses||profile+'#academic-options',u.links.courses?'View official courses':'Explore study options')}</p>
    <ul class="university-card-facts"><li>${icon('location')}<span>${escape(u.city)}</span></li><li>${icon('study')}${anchor(u.links.admissions||profile+'#academic-options','International application information')}</li><li>${icon('funding')}${anchor(profile+'#tuition','Tuition and scholarship guidance')}</li></ul>
    <div class="university-card-bottom">${anchor(profile,'View details','btn secondary')}</div></div>
  </article>`;
}
const directory = `<div class="page-top"><div class="wrap"><div class="crumb">${anchor('index.html', 'Home')} / Universities</div><span class="eyebrow">Find your place to learn</span><h1>Explore universities abroad</h1><p>Discover ${listings.length} universities: 20 each in Australia, Canada, the UK and Germany, plus all eight universities in New Zealand. Compare official study and application resources before building your shortlist.</p><p class="university-reviewed">Independent information for Pakistani students · Last checked 2 October 2026</p></div></div>
<section class="section"><div class="wrap">
  <form class="university-filters" data-university-filters hidden aria-label="Search and filter universities">
    <div><label for="university-search">University name</label><input id="university-search" type="search" name="q" placeholder="Search university names" autocomplete="off" aria-controls="university-results"></div>
    <div><label for="university-country">Country</label><select id="university-country" name="country" aria-controls="university-results"><option value="">All countries</option>${Object.entries(countries).map(([key, label]) => `<option value="${key}">${label}</option>`).join('')}</select></div>
    <button class="btn secondary" type="reset">Reset filters</button>
  </form>
  <noscript><p class="notice">All universities are listed below. Use the country links to jump to a destination; enable JavaScript to search and filter.</p></noscript>
  <nav class="nav-secondary university-country-links" aria-label="Jump to a country">${Object.entries(countries).map(([key, label]) => anchor('#university-' + listings.find(u=>u.country===key).slug, label, '')).join('')}</nav>
  <div class="filter-top list-space"><p data-university-count role="status" aria-live="polite" aria-atomic="true">${listings.length} universities</p><span>One directory · Five destinations</span></div>
  <p class="credit">New Zealand has eight universities; all eight are listed. ${anchor('https://www.universitiesnz.ac.nz/universities','Source: Universities New Zealand')}.</p>
  <div id="university-results" class="university-directory-grid">${listings.map(card).join('\n')}</div>
  <div class="empty" data-university-empty hidden><h2>No universities match</h2><p>Try another university name or choose a different country.</p><button class="btn" type="button" data-university-reset>Reset search and filters</button></div>
  <p class="notice">StudyFlyway is an independent study abroad information portal. These listings are starting points, not rankings, admission guarantees or partnership claims. Confirm all programme details with the university.</p>
</div></section>`;
fs.writeFileSync(path.join(root, 'universities.html'), document('Universities Abroad — Directory', 'Search 88 universities: 20 each in Australia, Canada, the UK and Germany, plus all eight in New Zealand. Find study and admissions resources.', directory, '', true));
// Preserve country-guide text while adding internal profile links.
for (const [key, label] of Object.entries(countries)) {
  const file = path.join(root, 'countries', key + '.html');
  let html = fs.readFileSync(file, 'utf8');
  html = html.replace(/<section id="universities">[\s\S]*?<\/section>/, section => {
    for (const u of universities.filter(item => item.country === key)) {
      section = section.replace(new RegExp(`<a href="${u.links.website.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>${u.name}[\\s\\S]*?<\\/a>`), anchor('../universities/' + u.slug + '.html', u.name));
    }
    const browse = `<p class="list-space">${anchor('../universities.html?country=' + key, 'Browse universities in ' + label)}</p>`;
    return section.includes('Browse universities in ') ? section : section.replace('</section>', browse + '</section>');
  });
  fs.writeFileSync(file, html);
}
// Central, per-photograph credits also remain visible in the existing credits page.
const creditsPath = path.join(root, 'credits.html');
let credits = fs.readFileSync(creditsPath, 'utf8');
credits = credits.replace(/<section id="university-photos"[^>]*>[\s\S]*?<\/section>/, '');
credits = credits.replace(/<section id="university-icons"[^>]*>[\s\S]*?<\/section>/, '');
const photoCredits = `<section id="university-photos" class="section"><div class="wrap reading"><h2>University campus photographs</h2><p>Authentic campus photographs sourced from Wikimedia Commons. Each photo has its own reuse permission, creator credit and source page. Images are displayed at responsive sizes; card and header previews may be cropped. Historical photographs do not establish current accommodation or facility availability.</p>${universities.map(u => `<h3>${anchor('universities/' + u.slug + '.html', u.name)}</h3><ul class="source-list">${photos[u.id].map(photo => `<li>${escape(photo.caption)} ${credit(photo)}</li>`).join('')}</ul>`).join('')}</div></section>`;
credits = credits.replace('</main>', photoCredits + '</main>');
const iconCredits=`<section id="university-icons" class="section"><div class="wrap reading"><h2>University website icons</h2><p>Small public website icons identify institutions in the university directory. They are cached locally for reliable display and remain the marks of their respective owners. Their use does not establish a partnership or endorsement. Campus photographs have separate creator credits and licences above.</p><ul class="source-list">${listings.filter(u=>universityIcons[u.id]).map(u=>`<li>${anchor(universityIcons[u.id].website,u.name)}</li>`).join('')}</ul></div></section>`;
credits = credits.replace('</main>',iconCredits+'</main>');
fs.writeFileSync(creditsPath, credits);
console.log(`Generated ${listings.length} static university profiles and the directory.`);
