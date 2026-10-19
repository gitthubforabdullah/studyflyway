/* Read-only source audit. HTTP success is not factual verification. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const {createHash} = require('node:crypto');
const https = require('node:https');
const http = require('node:http');
const root = path.resolve(__dirname, '..');
const cache = path.join(root, '.tmp', 'source-audit');
const reviewDate = new Intl.DateTimeFormat('en-CA', {timeZone: 'Asia/Karachi', year:'numeric', month:'2-digit', day:'2-digit'}).format(new Date());
const reportFile = path.join(root, 'research', process.argv.includes('--facts-only') ? 'source-audit-facts.json' : 'source-audit.json');
const previous = new Map((fs.existsSync(reportFile) ? JSON.parse(fs.readFileSync(reportFile, 'utf8')).sources : []).map(row => [row.url, row]));
fs.mkdirSync(cache, {recursive: true});
const sources = new Map();
function add(url, file) {
  url = url.replaceAll('&amp;', '&');
  if (!/^https?:\/\//.test(url)) return;
  try {
    const parsed = new URL(url); parsed.hash = '';
    if (/studyflyway|instagram|unsplash|wikimedia|google|cloudflare|umami|formsubmit|facebook|youtube|linkedin|twitter|favicon|gravatar/i.test(parsed.hostname)) return;
    if (/\.(png|jpg|jpeg|svg|webp|ico|pdf|docx?)(\?|$)/i.test(parsed.pathname)) return;
    const key = parsed.href;
    if (!sources.has(key)) sources.set(key, new Set());
    sources.get(key).add(file);
  } catch {}
}
function jsonUrls(value, file) {
  if (typeof value === 'string') add(value, file);
  else if (value && typeof value === 'object') Object.entries(value).filter(([key]) => key !== 'reviewCandidates').forEach(([,item]) => jsonUrls(item, file));
}
for (const name of fs.readdirSync(path.join(root, 'research'))) {
  if (!name.endsWith('.json') || /link-checks|source-audit|content-audit|facts-review/.test(name)) continue;
  jsonUrls(JSON.parse(fs.readFileSync(path.join(root, 'research', name), 'utf8')), 'research/' + name);
}
for (const directory of ['', 'countries', 'scholarships', 'guides']) {
  for (const name of fs.readdirSync(path.join(root, directory))) {
    if (!name.endsWith('.html')) continue;
    const file = (directory ? directory + '/' : '') + name;
    const html = fs.readFileSync(path.join(root, file), 'utf8');
    for (const match of html.matchAll(/href="(https?:[^"\s]+)"/g)) add(match[1], file);
  }
}
const factsOnly = process.argv.includes('--facts-only');
const jobs = [...sources].filter(([url]) => !factsOnly || url.includes('topuniversities.com/universities/')); const rows = []; let cursor = 0;
const clean = html => html.replace(/<(script|style|nav|header|footer)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
function download(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { request.destroy(); reject(Error('Request timeout')); }, 18000);
    const request = (url.startsWith('https:') ? https : http).get(url, {headers: {'User-Agent':'Mozilla/5.0 (compatible; StudyFlyway-source-review/1.0)'}}, response => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location && redirects < 6) {
        clearTimeout(timer); response.resume(); resolve(download(new URL(response.headers.location, url).href, redirects + 1)); return;
      }
      let body = ''; response.setEncoding('utf8');
      response.on('data', chunk => { if (body.length < 3000000) body += chunk; });
      response.on('end', () => {clearTimeout(timer); resolve({ok:response.statusCode >= 200 && response.statusCode < 300, status:response.statusCode, url, text:async () => body});});
      response.on('error', error => {clearTimeout(timer); reject(error);});
    });
    request.on('error', error => {clearTimeout(timer); reject(error);});
  });
}
async function run() {
  await Promise.all(Array.from({length: 24}, async () => {
    while (cursor < jobs.length) {
      const [url, files] = jobs[cursor++];
      const key = createHash('sha256').update(url).digest('hex').slice(0, 20);
      const row = {url, files: [...files], attemptedAt: new Date().toISOString(), cache: key};
      try {
        const response = await download(url);
        row.status = response.status; row.finalUrl = response.url;
        const html = (await response.text()).slice(0, 3000000);
        row.title = clean(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '');
        const text = clean(html);
        row.contentHash = createHash('sha256').update(text).digest('hex');
        row.changedSinceBaseline = Boolean(previous.get(url)?.contentHash && previous.get(url).contentHash !== row.contentHash);
        row.access = response.ok && !/just a moment|access denied|verify you are human|403 forbidden|request rejected/i.test(row.title) && text.length > 200 ? 'retrieved-needs-editorial-review' : 'needs-manual-access';
        fs.writeFileSync(path.join(cache, key + '.txt'), text);
        fs.writeFileSync(path.join(cache, key + '.html'), html);
      } catch (error) { row.status = 'request-failed'; row.error = error.message; row.access = 'needs-manual-access'; }
      rows.push(row);
      if (rows.length % 50 === 0) console.log(`Checked ${rows.length}/${jobs.length} source URLs`);
    }
  }));
  rows.sort((a,b) => a.url.localeCompare(b.url));
  fs.writeFileSync(reportFile, JSON.stringify({reviewDate, note: 'Retrieval results only. A successful request does not verify the factual claims. Failed requests can reflect automated-access restrictions, not broken public pages. Content changes can include navigation and other unrelated material; review before editing facts.', sources: rows}, null, 2) + '\n');
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `## Information source review · ${reviewDate}\n\nChecked ${rows.length} URLs. ${rows.filter(row => row.access === 'needs-manual-access').length} require manual access; ${rows.filter(row => row.changedSinceBaseline).length} changed since the committed baseline. Download the information-source-review artifact for details. This check does not automatically verify or publish facts.\n`);
  console.log(JSON.stringify({total: rows.length, retrieved: rows.filter(row => row.access === 'retrieved-needs-editorial-review').length, manualAccess: rows.filter(row => row.access === 'needs-manual-access').length}));
}
run().catch(error => {console.error(error); process.exitCode = 1;});
