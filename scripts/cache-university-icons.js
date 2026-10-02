/* Cache small public site icons used to identify institutions in the directory. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),https=require('node:https'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),folder=path.join(root,'assets/university-icons');fs.mkdirSync(folder,{recursive:true});
const records=[...JSON.parse(fs.readFileSync(path.join(root,'research/universities.json'),'utf8')),...JSON.parse(fs.readFileSync(path.join(root,'research/additional-universities.json'),'utf8'))];
const manifestFile=path.join(root,'research/university-icons.json');
const manifest=fs.existsSync(manifestFile)?JSON.parse(fs.readFileSync(manifestFile,'utf8')):{};
function get(url,redirects=0){return new Promise((resolve,reject)=>{
const req=https.get(url,res=>{if(res.statusCode>=300&&res.statusCode<400&&res.headers.location&&redirects<5){res.resume();resolve(get(new URL(res.headers.location,url).href,redirects+1));return;}if(res.statusCode!==200){res.resume();reject(Error('HTTP '+res.statusCode));return;}const chunks=[];res.on('data',chunk=>chunks.push(chunk));res.on('end',()=>resolve(Buffer.concat(chunks)));res.on('error',reject);});const timer=setTimeout(()=>req.destroy(Error('Timeout')),10000);req.on('close',()=>clearTimeout(timer));req.on('error',reject);
});}
async function run(){
const generic=await get('https://www.google.com/s2/favicons?domain=nonexistent-studyflyway-example.invalid&sz=128').catch(()=>null);
let cursor=0;
await Promise.all(Array.from({length:3},async()=>{while(cursor<records.length){const u=records[cursor++];if(manifest[u.id])continue;try{
const domain=new URL(u.links.website).hostname;
let data;try{data=await get('https://www.google.com/s2/favicons?domain='+encodeURIComponent(domain)+'&sz=128'); }catch{try{data=await get('https://www.google.com/s2/favicons?domain='+encodeURIComponent(domain.replace(/^www\./,''))+'&sz=128');}catch{
const html=(await get(u.links.website)).toString('utf8');
const tag=[...html.matchAll(/<link\b[^>]*>/gi)].map(m=>m[0]).find(tag=>/rel=["'][^"']*icon[^"']*["']/i.test(tag));
const href=tag?.match(/href=["']([^"']+)["']/i)?.[1];if(!href)throw Error('No official favicon');
data=await get(new URL(href,u.links.website).href);
}}
const png=data[0]===137&&data.toString('ascii',1,4)==='PNG';
const ico=data[0]===0&&data[1]===0&&data[2]===1&&data[3]===0;
const gif=data.toString('ascii',0,3)==='GIF';
const svg=data.toString('utf8').includes('<svg');
const jpg=data[0]===255&&data[1]===216;
const webp=data.toString('ascii',0,4)==='RIFF'&&data.toString('ascii',8,12)==='WEBP';
if(!png&&!ico&&!gif&&!svg&&!jpg&&!webp)throw Error('Unrecognised image format');
if(generic && crypto.createHash('sha256').update(data).digest('hex')===crypto.createHash('sha256').update(generic).digest('hex'))throw Error('Generic icon');
const file='assets/university-icons/'+u.slug+(png?'.png':ico?'.ico':gif?'.gif':jpg?'.jpg':webp?'.webp':'.svg');fs.writeFileSync(path.join(root,file),data);
manifest[u.id]={file,website:u.links.website,source:'Public website favicon for '+domain,width:png?data.readUInt32BE(16):64,height:png?data.readUInt32BE(20):64,checked:'2026-10-02'};
}catch(error){console.log(u.name+': '+error.message);}}}));
fs.writeFileSync(path.join(root,'research/university-icons.json'),JSON.stringify(manifest,null,2)+'\n');console.log('Cached '+Object.keys(manifest).length+' institutional website icons.');
}
run().catch(error=>{console.error(error);process.exitCode=1;});
