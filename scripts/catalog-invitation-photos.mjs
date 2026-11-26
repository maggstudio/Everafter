import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
const categories={"floral":"Floral","wedding":"Nuntă","elegant":"Elegant","nature":"Natură","baptism":"Botez","celestial":"Celestial","minimal":"Minimalist"};
const root='public/invitation-photos';
const catalog={};
for(const [folder,category] of Object.entries(categories)){
 const dir=path.join(root,folder);
 if(!fs.existsSync(dir))continue;
 for(const entry of fs.readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){
  if(!entry.isFile()||!/\\.(webp|jpe?g|png)$/i.test(entry.name))continue;
  const key='manual-'+createHash('sha256').update(folder+'/'+entry.name).digest('hex').slice(0,24);
  catalog[key]={label:entry.name.replace(/\\.[^.]+$/,'').replace(/[-_]+/g,' '),category,url:'/invitation-photos/'+folder+'/'+encodeURIComponent(entry.name)};
 }
}
fs.writeFileSync('lib/manual-invitation-photos.json',JSON.stringify(catalog,null,2));
console.log('Manual invitation photos:',Object.keys(catalog).length);
