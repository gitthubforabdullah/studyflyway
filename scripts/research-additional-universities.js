/* Fetch public official pages and retain source links for editorial review. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const https = require('node:https');
const http = require('node:http');
const file = path.resolve(__dirname, '../research/additional-universities.json');
const records = JSON.parse(fs.readFileSync(file, 'utf8'));
const clean = value => value.replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&').replace(/&#39;|&apos;/g,"'").replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();
const patterns = {courses:/^(find (a |your )?(course|program)|courses|degree programmes|programs|programmes|study options|course finder|course search|program search|undergraduate programs|programme offerings)$/i, admissions:/^(international students|international admissions|international|prospective international students|apply|admissions|applying|how to apply)$/i, fees:/^(tuition( and fees| \+ scholarships)?|fees( and (funding|scholarships)| & payments)?|tuition fees|tuition \+ scholarships)$/i, scholarships:/^(scholarships( and (funding|bursaries))?|funding|fees and scholarships)$/i, accommodation:/^(accommodation|housing|residence|residences|student accommodation|student housing)$/i, life:/^(student life|campus life|student services|student support)$/i};
function download(url,redirects=0) {
  return new Promise((resolve,reject)=>{
    const client=new URL(url).protocol==='http:'?http:https;
    const req=client.get(url,{headers:{'User-Agent':'Mozilla/5.0'}},res=>{
      if(res.statusCode>=300 && res.statusCode<400 && res.headers.location && redirects<6){res.resume();resolve(download(new URL(res.headers.location,url).href,redirects+1));return;}
      let body='';res.setEncoding('utf8');res.on('data',chunk=>body+=chunk);res.on('end',()=>resolve({ok:res.statusCode===200,status:res.statusCode,url,text:async()=>body}));res.on('error',reject);
    });
    req.setTimeout(15000,()=>req.destroy(Error('Request timeout')));req.on('error',reject);
  });
}
async function collect(record) {
  try {
    const response = await download(record.links.website);
    if (!response.ok) throw Error('HTTP '+response.status);
    const html = await response.text();
    const links = [...html.matchAll(/<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)].map(([,href,label]) => {
      try { return {url:new URL(href.replaceAll('&amp;','&'),response.url).href,label:clean(label)}; } catch { return null; }
    }).filter(link=>link && /^https?:/.test(link.url) && !link.url.includes('#') && !/login|sign.?in/i.test(link.label));
    const host = new URL(response.url).hostname.replace(/^www\./,'');
    record.links.website=response.url;
    record.reviewCandidates=links.filter(link=>new URL(link.url).hostname.replace(/^www\./,'').endsWith(host) && /international|course|program|admission|scholarship|accommodation|housing|fees|tuition|student life/i.test(link.label)).slice(0,60);
    for (const [key,pattern] of Object.entries(patterns)) {
      const link=record.reviewCandidates.find(link=>pattern.test(link.label));
      if (link) record.links[key]=link.url;
    }
    record.sourceTitle=clean((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)||[])[1]||'');
    record.fetchStatus='Official homepage retrieved';
  } catch(error) {record.fetchStatus=error.message;}
  fs.writeFileSync(file,JSON.stringify(records,null,2)+'\n');
}
async function run() {
  if(process.argv.includes('--check-links')) {
    const resources=records.flatMap(record=>Object.entries(record.links).map(([kind,url])=>({name:record.name,kind,url})));
    const checks=[];let cursor=0;
    await Promise.all(Array.from({length:6},async()=>{while(cursor<resources.length){
      const item=resources[cursor++];
      try{const result=await download(item.url);checks.push({...item,status:result.status});}
      catch(error){checks.push({...item,status:error.message});}
    }}));
    fs.writeFileSync(path.resolve(__dirname,'../research/university-link-checks.json'),JSON.stringify(checks,null,2)+'\n');
    for(const check of checks)if(check.status!==200)console.log(check.name+' '+check.kind+': '+check.status);
    console.log('Checked '+checks.length+' official resource URLs.');return;
  }
  let index=0;
  await Promise.all(Array.from({length:6},async()=>{while(index<records.length){const r=records[index++];await collect(r);console.log(r.name+': '+r.fetchStatus);}}));
  fs.writeFileSync(file,JSON.stringify(records,null,2)+'\n');
}
run().catch(error=>{console.error(error);process.exitCode=1;});
