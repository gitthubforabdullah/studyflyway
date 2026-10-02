/* Netlify build: plain HTML/CSS/JS, no packages or framework required. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
require('./scripts/build-universities');
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
const htmlFiles=[];
function collect(dir) {
  for(const ent of fs.readdirSync(dir,{withFileTypes:true})) {
    const file=path.join(dir,ent.name);
    if(ent.isDirectory()) collect(file); else if(file.endsWith('.html')) htmlFiles.push(file);
  }
}
collect(output);
const links=[];
function escapeXml(value) {return value.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');}
for(const file of htmlFiles) {
  let html=fs.readFileSync(file,'utf8');
  const relative=path.relative(output,file).split(path.sep).join('/');
  const noindex=html.includes('name="robots" content="noindex');
  // Netlify Pretty URLs removes .html; use the final URL as canonical.
  const url=base+'/'+(relative==='index.html'?'':relative.replace(/\.html$/,''));
  if(base && !noindex) {
    const metadata=`<link rel="canonical" href="${escapeXml(url)}"><meta property="og:url" content="${escapeXml(url)}">`;
    const schema=relative==='index.html'?{
      '@context':'https://schema.org','@type':'WebSite',name:'StudyFlyway',url:base+'/',inLanguage:'en',description:'Independent study abroad and scholarship information for Pakistani students.'
    }:{'@context':'https://schema.org','@type':'WebPage',name:(html.match(/<title>(.*?)<\/title>/s)||[])[1],url,inLanguage:'en'};
    html=html.replace('</head>',metadata+'<script type="application/ld+json">'+JSON.stringify(schema).replaceAll('<','\\u003c')+'</script></head>');
    links.push(url);
  }
  fs.writeFileSync(file,html);
}
if(base) fs.writeFileSync(path.join(output,'sitemap.xml'),'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+links.map(url=>`  <url><loc>${escapeXml(url)}</loc></url>`).join('\n')+'\n</urlset>\n');
fs.writeFileSync(path.join(output,'robots.txt'),'User-agent: *\nAllow: /\n'+(base?'\nSitemap: '+base+'/sitemap.xml\n':''));
fs.writeFileSync(path.join(output,'_headers'),'/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  X-Frame-Options: SAMEORIGIN\n/assets/*\n  Cache-Control: public, max-age=3600\n');
console.log(`Built ${htmlFiles.length} HTML pages in dist. ${base?'Sitemap and canonical URLs configured for '+base: 'Local preview ready.'}`);
