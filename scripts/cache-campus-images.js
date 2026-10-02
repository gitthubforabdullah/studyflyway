/* Store reviewed, licensed Commons photographs locally for reliable delivery. */
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const https=require('node:https');
const crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const file=path.join(root,'research/campus-photos.json');
const photos=JSON.parse(fs.readFileSync(file,'utf8'));
const folder=path.join(root,'assets/campus');fs.mkdirSync(folder,{recursive:true});
function download(url,redirects=0,json=false){return new Promise((resolve,reject)=>{
  const req=https.get(url,{headers:{'User-Agent':'StudyFlyway/1.0 (licensed educational image caching)'}},res=>{
    if(res.statusCode>=300&&res.statusCode<400&&res.headers.location&&redirects<5){res.resume();resolve(download(new URL(res.headers.location,url).href,redirects+1,json));return;}
    if(res.statusCode!==200){res.resume();reject(Error('HTTP '+res.statusCode));return;}
    if(!json && !/^image\//.test(res.headers['content-type']||'')){res.resume();reject(Error('Response is not an image'));return;}
    const chunks=[];let size=0;res.on('data',data=>{size+=data.length;if(size>25000000)req.destroy(Error('Image exceeds 25 MB'));else chunks.push(data);});res.on('end',()=>resolve(Buffer.concat(chunks)));res.on('error',reject);
  });const timeout=setTimeout(()=>req.destroy(Error('Download timeout')),15000);req.on('close',()=>clearTimeout(timeout));req.on('error',reject);
});}
async function run(){
  const queue=Object.entries(photos).flatMap(([id,list])=>list.map((photo,index)=>({id,index,photo})));
  let cursor=0;
  await Promise.all(Array.from({length:2},async()=>{while(cursor<queue.length){
    const {id,index,photo}=queue[cursor++];
    if(photo.local && fs.existsSync(path.join(root,photo.local)))continue;
    const name=photo.file.replaceAll(' ','_'),hash=crypto.createHash('md5').update(name).digest('hex'),encoded=encodeURIComponent(name);
    const original=`https://upload.wikimedia.org/wikipedia/commons/${hash[0]}/${hash.slice(0,2)}/${encoded}`;
    const thumb=photo.width<=960?original:`https://upload.wikimedia.org/wikipedia/commons/thumb/${hash[0]}/${hash.slice(0,2)}/${encoded}/960px-${encoded}`;
    try{
      let data;try{data=await download(thumb.replace('upload.wikimedia.org','thumb.wikimedia.org'));}catch{try{data=await download(original);}catch{try{data=await download('https://wsrv.nl/?url='+encodeURIComponent(original)+'&w=960&output=jpg');}catch{
        const metadata=JSON.parse((await download('https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url&iiurlwidth=960&titles='+encodeURIComponent('File:'+photo.file),0,true)).toString());
        const info=Object.values(metadata.query.pages)[0].imageinfo?.[0];
        if(!info)throw Error('Commons file not found');
        data=await download('https://wsrv.nl/?url='+encodeURIComponent(info.url)+'&w=960&output=jpg');
      }}}
      const extension=data[0]===255&&data[1]===216?'.jpg':path.extname(name).toLowerCase();
      const relative='assets/campus/'+id+'-'+(index+1)+extension;
      fs.writeFileSync(path.join(root,relative),data);photo.local=relative;
      fs.writeFileSync(file,JSON.stringify(photos,null,2)+'\n');console.log('Cached '+id+' '+(index+1));
    }catch(error){console.log('Unavailable '+id+' '+(index+1)+': '+error.message);}
  }}));
  console.log('Local photographs: '+queue.filter(item=>item.photo.local).length+'/'+queue.length);
}
run().catch(error=>{console.error(error);process.exitCode=1;});
