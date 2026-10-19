/* Static build: plain HTML/CSS/JS, no packages or framework required. */
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
require('./scripts/build-consultants');
require('./scripts/build-country-background');
require('./scripts/enhance-destinations');
require('./scripts/clean-site-links');
const output = path.join(root, 'dist');
const supplied = process.argv.find(arg => arg.startsWith('--url='));
const origin = supplied ? supplied.slice(6) : (process.env.SITE_URL || 'https://' + fs.readFileSync(path.join(root, 'CNAME'), 'utf8').trim());
let base = '';
if(origin) {
  const parsed = new URL(origin);
  if(!['https:','http:'].includes(parsed.protocol)) throw Error('Use a valid https:// website address.');
  base = parsed.origin;
}
if(!base) console.warn('Set SITE_URL or pass --url=https://your-domain to generate canonical URLs and a sitemap.');
fs.rmSync(output, {recursive:true, force:true});
fs.mkdirSync(output, {recursive:true});
const folders=['assets','countries','scholarships','guides','universities','consultants'];
for(const folder of folders) fs.cpSync(path.join(root,folder),path.join(output,folder),{recursive:true});
for(const file of fs.readdirSync(root)) if(file.endsWith('.html')) fs.copyFileSync(path.join(root,file),path.join(output,file));
// Preserve the publisher declaration alongside the generated website.
fs.writeFileSync(path.join(output, 'ads.txt'), adsContent + '\n', 'utf8');
fs.copyFileSync(path.join(root, 'CNAME'), path.join(output, 'CNAME'));
fs.writeFileSync(path.join(output, '.nojekyll'), '');
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
  // Google verification files must retain their supplied content and stay out of the sitemap.
  if (/^google[a-f0-9]+\.html$/.test(relative)) continue;
  const noindex=html.includes('name="robots" content="noindex');
  // Extensionless addresses also have directory index files for static hosting.
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
  if (!['index.html', '404.html'].includes(relative)) {
    const directory = path.join(output, relative.slice(0, -5));
    fs.mkdirSync(directory, {recursive: true});
    // Preserve relative asset resolution when serving a page from its new directory.
    const parent = path.posix.dirname('/' + relative);
    const alias = html.replace('<head>', '<head><base href="' + (parent === '/' ? '/' : parent + '/') + '">');
    fs.writeFileSync(path.join(directory, 'index.html'), alias);
  }
}
if(base) fs.writeFileSync(path.join(output,'sitemap.xml'),'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+links.map(url=>`  <url><loc>${escapeXml(url)}</loc></url>`).join('\n')+'\n</urlset>\n');
fs.writeFileSync(path.join(output,'robots.txt'),'User-agent: *\nAllow: /\n'+(base?'\nSitemap: '+base+'/sitemap.xml\n':''));
// Fail deployment if a consultant profile, local logo, or clean route is missing.
require('node:child_process').execFileSync(process.execPath, [path.join(root, 'scripts/check-consultants.js'), '--dist'], {stdio: 'inherit'});
console.log(`Built ${htmlFiles.length} HTML pages in dist. ${base?'Sitemap and canonical URLs configured for '+base: 'Local preview ready.'}`);
