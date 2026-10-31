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
  let target = path.resolve(root, '.' + decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname));
  if (!path.extname(target) && fs.existsSync(target + '.html')) target += '.html';
  if (!target.startsWith(root + path.sep) || !fs.existsSync(target) || fs.statSync(target).isDirectory()) { res.writeHead(404); res.end(); return; }
  const types = {'.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.ico':'image/x-icon'};
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
    await send('Network.setBlockedURLs', {urls: ['https://*']});
    let scriptsDisabled = false;
    const visit = async url => {
      await send('Page.navigate', {url: base + url});
      for (let i = 0; i < 150; i++) { await sleep(100); if (await evaluate(`location.pathname === ${JSON.stringify(url.split('?')[0])} && document.readyState !== 'loading' && (${scriptsDisabled ? 'true' : "document.documentElement.classList.contains('js') && (!document.querySelector('[data-university-filters]') || !document.querySelector('[data-university-filters]').hidden)"})`)) return; }
      throw Error('Page did not become readable: ' + url);
    };

    for (const width of [1440, 768, 390]) {
      await send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<600});
      for (const page of ['/index.html','/destinations.html','/countries/germany.html','/universities.html','/universities/technical-university-of-munich.html','/scholarships.html','/guides.html','/english-tests.html','/contact.html']) {
        await visit(page);
        assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth + 1'),true,page+' overflow at '+width);
        assert.equal(await evaluate('document.querySelectorAll("h1").length'),1,page+' heading');
        assert.equal(await evaluate('getComputedStyle(document.documentElement).getPropertyValue("--primary").trim()'),'#0059b9');
        if (true) {
          await sleep(400);
          const body = JSON.parse(await evaluate('JSON.stringify(document.body.getBoundingClientRect().toJSON())'));
          const height = await evaluate('document.documentElement.scrollHeight');
          const shot=await send('Page.captureScreenshot',width===1440 ? {format:'png',captureBeyondViewport:true,clip:{x:Math.max(0,body.x),y:0,width:body.width,height:Math.min(height,2400),scale:1}} : {format:'png'});
          fs.writeFileSync(path.join(temp,page.slice(1,-5).replaceAll('/','-')+'-'+width+'.png'),Buffer.from(shot.data,'base64'));
        }
      }
    }
    await visit('/universities.html');
    assert.equal(await evaluate("[...document.querySelectorAll('[data-university]')].filter(x=>!x.hidden).length"),5);
    const firstPageName = await evaluate("document.querySelector('[data-university]:not([hidden])').dataset.universityName");
    await evaluate("document.querySelector('.reference-pagination button:last-child').click()");
    assert.equal(await evaluate("document.querySelector('#university-results').dataset.page"),'2');
    assert.notEqual(await evaluate("document.querySelector('[data-university]:not([hidden])').dataset.universityName"),firstPageName);
    await evaluate("document.querySelector('.reference-pagination button').click()");
    await evaluate("document.querySelector('[data-save]').click()");
    assert.equal(await evaluate("document.querySelector('[data-save]').getAttribute('aria-pressed')"),'true');
    await evaluate("document.querySelector('[data-header-search]').click()");
    assert.equal(await evaluate("document.querySelector('#header-search').hidden"),false);
    await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape'});
    assert.equal(await evaluate("document.querySelector('#header-search').hidden"),true);
    await evaluate("document.querySelector('[data-refine-country=\"germany\"]').click()");
    assert.equal(await evaluate("document.querySelector('#university-country').value"),'germany');
    await evaluate('document.querySelector("#university-search").value="Munich";document.querySelector("#university-search").dispatchEvent(new Event("input",{bubbles:true}))');
    assert(await evaluate('[...document.querySelectorAll("[data-university]")].filter(x=>!x.hidden).length > 0'));
    await visit('/scholarships.html');
    assert.equal(await evaluate("document.querySelectorAll('.scholarship-visual img').length"),10);
    await evaluate("document.querySelector('#q').value='Chevening';document.querySelector('#q').dispatchEvent(new Event('input',{bubbles:true}))");
    assert.equal(await evaluate("document.querySelector('.reference-result-list').dataset.matchCount"),'1');
    await evaluate("document.querySelector('[data-reset]').click()");
    await evaluate("document.querySelector('[data-filters] [name=country]').value='canada';document.querySelector('[data-filters] [name=country]').dispatchEvent(new Event('change',{bubbles:true}))");
    assert.equal(await evaluate("[...document.querySelectorAll('[data-scholarship]')].filter(x=>!x.hidden).length"),2);
    await visit('/destinations.html');
    await evaluate("document.querySelector('#directory-search').value='Germany';document.querySelector('#directory-search').dispatchEvent(new Event('input',{bubbles:true}))");
    assert.equal(await evaluate("[...document.querySelectorAll('[data-country-card]')].filter(x=>!x.hidden).length"),1);
    await visit('/countries/germany.html');
    await evaluate("document.querySelector('.reference-tabs a[href=\"#costs\"]').click()");
    assert.equal(await evaluate("document.querySelector('.reference-full-guide').open"),true);
    await visit('/universities/technical-university-of-munich.html');
    await evaluate("document.querySelector('.reference-campus-preview').click()");
    assert.equal(await evaluate("document.querySelector('.reference-full-guide').open"),true);
    await visit('/english-tests.html');
    await evaluate("document.querySelector('#test-overview a[href=\"#ielts\"]').click()");
    assert.equal(await evaluate("document.querySelector('.reference-full-guide').open"),true);
    await visit('/index.html');
    assert.equal(await evaluate('document.querySelector(".hero-search").getAttribute("action")'),'/universities');
    await evaluate("document.querySelector('#home-search').value='Germany';document.querySelector('.hero-search').requestSubmit()");
    for(let attempt=0;attempt<50;attempt++){if(await evaluate("location.pathname==='/countries/germany'"))break;await sleep(100);}
    assert.equal(await evaluate('location.pathname'),'/countries/germany');
    await visit('/index.html');
    await evaluate('document.querySelector("[data-menu]").click()');
    assert.equal(await evaluate('document.querySelector("[data-nav]").classList.contains("expanded")'),true);
    assert.deepEqual(runtimeErrors,[]);
    console.log('Passed reference checks: nine page types at desktop/tablet/phone widths, university and scholarship keyword/country filters, five-row pagination, saved items, header search, destination search, expandable source guides, and mobile navigation.');
    await send('Browser.close').catch(() => {});
  } finally {
    if (socket) socket.close();
    browser.kill();
    server.close();
  }
}
run().catch(error => { console.error(error); process.exitCode = 1; server.close(); });
