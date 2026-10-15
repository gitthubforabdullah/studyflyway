/* Netlify build: plain HTML/CSS/JS, no packages or framework required. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
// Validate before generating files so a deployment cannot silently omit ads.txt.
const adsFile = path.join(root, 'ads.txt');
const adsContent = fs.readFileSync(adsFile, 'utf8').replace(/^\uFEFF/, '').trim();
if (!adsContent.split(/\r?\n/).some(line => /^google\.com,\s*pub-9576135533715323,\s*DIRECT,\s*f08c47fec0942fa0\s*$/.test(line))) {
  throw Error('ads.txt must contain the StudyFlyway AdSense publisher declaration.');
}
require('./scripts/update-navigation');
require('./scripts/sync-university-styles');
require('./scripts/build-universities');
require('./scripts/build-country-background');
require('./scripts/enhance-destinations');
require('./scripts/clean-site-links');
const output = path.join(root, 'dist');
const supplied = process.argv.find(arg => arg.startsWith('--url='));
const origin = supplied ? supplied.slice(6) : (process.env.SITE_URL || process.env.URL || '');
let base = '';
if(origin) {
  const parsed = new URL(origin);
  if(!['https:','http:'].includes(parsed.protocol)) throw Error('Use a valid https:// website address.');
  base = parsed.origin;
}
if(!base) console.warn('Local build: no public URL set. Canonical URLs and sitemap will be added on Netlify using its URL environment variable.');
fs.rmSync(output, {recursive:true, force:true});
fs.mkdirSync(output, {recursive:true});
const folders=['assets','countries','scholarships','guides','universities'];
for(const folder of folders) fs.cpSync(path.join(root,folder),path.join(output,folder),{recursive:true});
for(const file of fs.readdirSync(root)) if(file.endsWith('.html')) fs.copyFileSync(path.join(root,file),path.join(output,file));
// Preserve the publisher declaration alongside the generated website.
fs.writeFileSync(path.join(output, 'ads.txt'), adsContent + '\n', 'utf8');
const htmlFiles=[];
function collect(dir) {
  for(const ent of fs.readdirSync(dir,{withFileTypes:true})) {
    const file=path.join(dir,ent.name);
    if(ent.isDirectory()) collect(file); else if(file.endsWith('.html')) htmlFiles.push(file);
  }
}
collect(output);
// Explicit legacy redirects preserve bookmarks; rewrites serve clean page URLs.
const routes = [];
for (const file of htmlFiles) {
  const relative = path.relative(output, file).split(path.sep).join('/');
  if (/^google[a-f0-9]+\.html$/.test(relative) || relative === '404.html') continue;
  const clean = relative === 'index.html' ? '/' : relative === 'privacy.html' ? '/privacy-policy' : '/' + relative.slice(0, -5);
  routes.push(`/${relative} ${clean} 301!`);
}
for (const file of htmlFiles) {
  const relative = path.relative(output, file).split(path.sep).join('/');
  if (/^google[a-f0-9]+\.html$/.test(relative) || ['404.html', 'index.html'].includes(relative)) continue;
  routes.push(relative === 'privacy.html' ? '/privacy /privacy-policy 301!' : `/${relative.slice(0, -5)} /${relative} 200!`);
}
fs.writeFileSync(path.join(output, '_redirects'), routes.join('\n') + '\n');
const links=[];
function escapeXml(value) {return value.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');}
for(const file of htmlFiles) {
  let html=fs.readFileSync(file,'utf8');
  const relative=path.relative(output,file).split(path.sep).join('/');
  // Google verification files must retain their supplied content and stay out of the sitemap.
  if (/^google[a-f0-9]+\.html$/.test(relative)) continue;
  const noindex=html.includes('name="robots" content="noindex');
  // Netlify Pretty URLs removes .html; use the final URL as canonical.
  const url=base+'/'+(relative==='index.html'?'':relative.replace(/\.html$/,''));
  if(base && !noindex) {
    const metadata=(html.includes('rel="canonical"')?'':`<link rel="canonical" href="${escapeXml(url)}">`)+(html.includes('property="og:url"')?'':`<meta property="og:url" content="${escapeXml(url)}">`);
    // The homepage owns its WebSite identity, including its production URL.
    // Preserve that block for local builds and avoid duplicating it on deployment.
    const schema=['index.html','about.html'].includes(relative)?null:{
      '@context':'https://schema.org','@type':'WebPage',name:(html.match(/<title>(.*?)<\/title>/s)||[])[1],url,inLanguage:'en'};
    const structuredData=schema?'<script type="application/ld+json">'+JSON.stringify(schema).replaceAll('<','\\u003c')+'</script>':'';
    html=html.replace('</head>',metadata+structuredData+'</head>');
    links.push(url);
  }
  fs.writeFileSync(file,html);
}
if(base) fs.writeFileSync(path.join(output,'sitemap.xml'),'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+links.map(url=>`  <url><loc>${escapeXml(url)}</loc></url>`).join('\n')+'\n</urlset>\n');
fs.writeFileSync(path.join(output,'robots.txt'),'User-agent: *\nAllow: /\n'+(base?'\nSitemap: '+base+'/sitemap.xml\n':''));
fs.writeFileSync(path.join(output,'_headers'),'/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  X-Frame-Options: SAMEORIGIN\n/assets/*\n  Cache-Control: public, max-age=3600\n');
console.log(`Built ${htmlFiles.length} HTML pages in dist. ${base?'Sitemap and canonical URLs configured for '+base: 'Local preview ready.'}`);
