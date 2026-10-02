/* Real Chromium integration checks using its DevTools protocol; no packages needed. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const {spawn} = require('node:child_process');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const temp = path.join(root, '.tmp', 'university-browser');
fs.mkdirSync(temp, {recursive: true});
const chromePath = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(file => fs.existsSync(file));
if (!chromePath) throw Error('Chrome or Edge is required for browser checks.');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const target = path.resolve(root, '.' + decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname));
  if (!target.startsWith(root + path.sep) || !fs.existsSync(target) || fs.statSync(target).isDirectory()) { res.writeHead(404); res.end(); return; }
  const types = {'.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.webp': 'image/webp'};
  res.setHeader('Content-Type', types[path.extname(target)] || 'application/octet-stream');
  res.end(fs.readFileSync(target));
});
async function run() {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  const profile = path.join(temp, 'profile-' + Date.now());
  const browser = spawn(chromePath, ['--headless=new', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=0', '--user-data-dir=' + profile, '--window-size=1440,1000', 'about:blank'], {stdio: 'ignore', windowsHide: true});
  let socket;
  try {
    const portFile = path.join(profile, 'DevToolsActivePort');
    for (let i = 0; i < 100 && !fs.existsSync(portFile); i++) await sleep(100);
    assert(fs.existsSync(portFile), 'Chromium DevTools endpoint did not start');
    const port = fs.readFileSync(portFile, 'utf8').split('\n')[0];
    const pages = await (await fetch('http://127.0.0.1:' + port + '/json/list')).json();
    socket = new WebSocket(pages.find(page => page.type === 'page').webSocketDebuggerUrl);
    await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, {once: true}); socket.addEventListener('error', reject, {once: true}); });
    let sequence = 0;
    const waiting = new Map();
    const runtimeErrors = [];
    socket.addEventListener('message', event => {
      const message = JSON.parse(event.data);
      if (message.id && waiting.has(message.id)) { const {resolve, reject} = waiting.get(message.id); waiting.delete(message.id); message.error ? reject(Error(JSON.stringify(message.error))) : resolve(message.result); }
      if (message.method === 'Runtime.exceptionThrown') runtimeErrors.push(message.params.exceptionDetails.text);
    });
    const send = (method, params = {}) => new Promise((resolve, reject) => { const id = ++sequence; const timer = setTimeout(() => { waiting.delete(id); reject(Error('DevTools timeout: ' + method)); }, 15000); waiting.set(id, {resolve: value => {clearTimeout(timer);resolve(value);}, reject: error => {clearTimeout(timer);reject(error);}}); socket.send(JSON.stringify({id, method, params})); });
    const evaluate = async expression => {
      const result = await send('Runtime.evaluate', {expression, returnByValue: true, awaitPromise: true});
      if (result.exceptionDetails) throw Error(JSON.stringify(result.exceptionDetails));
      return result.result.value;
    };
    await send('Page.enable');
    await send('Runtime.enable');
    await send('Network.enable');
    // Use the site's existing font fallbacks so remote font loading cannot delay scripts.
    await send('Network.setBlockedURLs', {urls: ['*fonts.googleapis.com*', '*fonts.gstatic.com*', '*pagead2.googlesyndication.com*']});
    let scriptsDisabled = false;
    const visit = async url => {
      await send('Page.navigate', {url: base + url});
      for (let i = 0; i < 150; i++) { await sleep(100); if (await evaluate(`location.pathname === ${JSON.stringify(url.split('?')[0])} && document.readyState !== 'loading' && (${scriptsDisabled ? 'true' : "document.documentElement.classList.contains('js') && (!document.querySelector('[data-university-filters]') || !document.querySelector('[data-university-filters]').hidden)"})`)) return; }
      throw Error('Page did not become readable: ' + url);
    };
    const visible = () => evaluate("[...document.querySelectorAll('[data-university]')].filter(card => !card.hidden).length");
    const filter = (q, country) => evaluate(`document.querySelector('#university-search').value=${JSON.stringify(q)};document.querySelector('#university-country').value=${JSON.stringify(country)};document.querySelector('#university-search').dispatchEvent(new Event('input',{bubbles:true}));`);
    await visit('/universities.html');
    console.log('Directory loaded; checking filters.');
    assert.equal(await visible(), 15);
    await filter('', 'canada'); assert.equal(await visible(), 3);
    await filter('TORONTO', 'canada'); assert.equal(await visible(), 1);
    await filter('toronto', 'germany'); assert.equal(await visible(), 0);
    assert.equal(await evaluate("document.querySelector('[data-university-empty]').hidden"), false);
    await evaluate("document.querySelector('[data-university-reset]').click()"); assert.equal(await visible(), 15);
    assert.equal(await evaluate('document.activeElement.id'), 'university-search');
    await filter('  british   columbia ', ''); assert.equal(await visible(), 1);
    await visit('/universities.html?country=uk'); assert.equal(await visible(), 3);
    await visit('/universities.html?country=invalid'); assert.equal(await visible(), 15);
    for (const width of [1440, 1200, 1024, 800, 390, 320]) {
      await send('Emulation.setDeviceMetricsOverride', {width, height: 900, deviceScaleFactor: 1, mobile: width < 800});
      assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth + 1'), true, 'Directory overflow at ' + width);
    }
    await send('Emulation.setDeviceMetricsOverride', {width: 390, height: 900, deviceScaleFactor: 1, mobile: true});
    await evaluate("document.querySelector('[data-menu]').click()");
    assert.equal(await evaluate("getComputedStyle(document.querySelector('[data-nav]')).display"), 'flex');
    assert.equal(await evaluate("!!document.querySelector('[data-nav] a[href=\"universities.html\"]')"), true);
    const records = JSON.parse(fs.readFileSync(path.join(root, 'research/universities.json'), 'utf8'));
    console.log('Filters and responsive directory passed; checking profiles.');
    for (const u of records) {
      await visit('/universities/' + u.slug + '.html');
      assert.equal(await evaluate('document.querySelectorAll("h1").length'), 1);
      assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth + 1'), true, u.name + ': mobile overflow');
      assert.equal(await evaluate('document.querySelectorAll(".campus-gallery img").length'), 3);
      assert.equal(await evaluate('[...document.querySelectorAll(".campus-gallery img")].every(img=>img.loading==="lazy")'), true);
    }
    await visit('/universities/university-of-melbourne.html');
    await evaluate("document.querySelector('#gallery').scrollIntoView()");
    await sleep(2000);
    const photoStatus = await evaluate('[...document.querySelectorAll("[data-campus-image]")].map(img=>({loaded:img.naturalWidth>0,complete:img.complete}))');
    console.log('Campus photo load status:', JSON.stringify(photoStatus));
    await send('Emulation.setScriptExecutionDisabled', {value: true});
    scriptsDisabled = true;
    await visit('/universities.html');
    assert.equal(await visible(), 15);
    assert.equal(await evaluate("document.querySelector('[data-university-filters]').hidden"), true);
    assert.equal(await evaluate("getComputedStyle(document.querySelector('.university-country-links')).display"), 'flex');
    await send('Emulation.setScriptExecutionDisabled', {value: false});
    scriptsDisabled = false;
    await send('Emulation.setDeviceMetricsOverride', {width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false});
    await visit('/index.html');
    const rect = await evaluate("JSON.stringify(document.querySelector('[data-destinations-menu]').getBoundingClientRect().toJSON())");
    const position = JSON.parse(rect);
    await send('Input.dispatchMouseEvent', {type: 'mouseMoved', x: position.x + position.width / 2, y: position.y + position.height / 2});
    assert.equal(await evaluate("document.querySelector('[data-destinations-menu]').classList.contains('is-open')"), true);
    assert.equal(await evaluate("document.querySelectorAll('#destination-links a').length"), 6);
    for (const page of ['/about.html','/countries/canada.html','/scholarships/pearson.html','/universities/university-of-toronto.html','/english-tests.html','/404.html']) {
      await send('Input.dispatchMouseEvent', {type:'mouseMoved', x:1, y:500});
      await visit(page);
      const box = JSON.parse(await evaluate("JSON.stringify(document.querySelector('[data-destinations-menu]').getBoundingClientRect().toJSON())"));
      await send('Input.dispatchMouseEvent', {type:'mouseMoved', x:box.x+box.width/2, y:box.y+box.height/2});
      assert.equal(await evaluate("document.querySelector('.nav-dropdown-toggle').textContent.trim()"), 'Destinations');
      assert.equal(await evaluate("document.querySelector('.nav-dropdown-toggle').getAttribute('aria-expanded')"), 'true', page);
      assert.equal(await evaluate("getComputedStyle(document.querySelector('#destination-links')).display"), 'block', page);
      await evaluate("document.querySelector('.nav-dropdown-toggle').focus()");
      await send('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowDown',code:'ArrowDown'});
      assert.equal(await evaluate("document.activeElement.textContent"), 'Australia');
      await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape'});
      assert.equal(await evaluate("document.querySelector('.nav-dropdown-toggle').getAttribute('aria-expanded')"), 'false');
    }
    await send('Emulation.setDeviceMetricsOverride',{width:390,height:900,deviceScaleFactor:1,mobile:true});
    await visit('/english-tests.html');
    await evaluate("document.querySelector('[data-menu]').click(); document.querySelector('.nav-dropdown-toggle').click()");
    assert.equal(await evaluate("getComputedStyle(document.querySelector('#destination-links')).display"),'block');
    assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth + 1'),true);
    await send('Emulation.setScriptExecutionDisabled',{value:true}); scriptsDisabled=true;
    await visit('/english-tests.html');
    assert.equal(await evaluate("document.querySelectorAll('h1').length"),1);
    assert.equal(await evaluate("document.querySelector('#ielts').innerText.includes('IELTS Academic')"),true);
    await send('Emulation.setScriptExecutionDisabled',{value:false}); scriptsDisabled=false;
    await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
    await visit('/scholarships.html');
    assert.equal(await evaluate("document.querySelectorAll('[data-scholarship]').length"), 10);
    assert.deepEqual(runtimeErrors, []);
    await visit('/universities.html');
    const screenshot = await send('Page.captureScreenshot', {format: 'png'});
    fs.writeFileSync(path.join(temp, 'directory-desktop.png'), Buffer.from(screenshot.data, 'base64'));
    await send('Emulation.setDeviceMetricsOverride', {width: 390, height: 900, deviceScaleFactor: 1, mobile: true});
    const mobile = await send('Page.captureScreenshot', {format: 'png'});
    fs.writeFileSync(path.join(temp, 'directory-mobile.png'), Buffer.from(mobile.data, 'base64'));
    console.log('Passed browser checks: search, country filters, combined empty results, reset and focus, query URLs, six viewport sizes, 15 mobile profiles, no-JavaScript content, existing dropdown and scholarship directory.');
    await send('Browser.close').catch(() => {});
  } finally {
    if (socket) socket.close();
    browser.kill();
    server.close();
  }
}
run().catch(error => { console.error(error); process.exitCode = 1; server.close(); });
