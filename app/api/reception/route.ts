import {NextRequest,NextResponse} from 'next/server';
import {createClient} from '@supabase/supabase-js';
import {createHash} from 'node:crypto';
import type {Wedding,Guest} from '../../../lib/demo';
export const dynamic='force-dynamic';
const json=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'no-store'}});
const norm=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('ro').trim().replace(/\s+/g,' ');
export async function POST(req:NextRequest){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return json({error:'Recepția nu este disponibilă.'},503);
 let b:any;try{b=await req.json()}catch{return json({error:'Cerere invalidă.'},400)}
 if(typeof b?.event!=='string'||typeof b?.token!=='string'||!/^[0-9a-f-]{36}$/i.test(b.event)||!/^[0-9a-f-]{36}$/i.test(b.token))return json({error:'Link invalid.'},404);
 const db=createClient(url,key,{auth:{persistSession:false}});
 const ip=req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown';
 const fingerprint=createHash('sha256').update(key+'|'+ip+'|'+b.event).digest('hex');
 const limit=await db.rpc('wedly_reception_limit',{p_fingerprint:fingerprint});if(limit.error){console.error('Reception rate limit failed',{code:limit.error.code,message:limit.error.message});return json({error:'Recepția nu este configurată. Cod diagnostic: '+(limit.error.code||'DB_UNKNOWN')},503);}if(!limit.data)return json({error:'Prea multe căutări. Încearcă peste un minut.'},429);
 const w=await db.from('wedding_modules').select('content').eq('wedding_id',b.event).eq('module','wedding').maybeSingle();
 if(w.error){console.error('Reception event lookup failed',{code:w.error.code,message:w.error.message});return json({error:'Evenimentul nu poate fi încărcat. Cod diagnostic: '+(w.error.code||'DB_UNKNOWN')},503);}
 const event=w.data?.content as Wedding|undefined;const config=event?.reception;
 if(!event||!config?.enabled||config.token!==b.token)return json({error:'Recepția nu este activă.'},404);
 const now=new Date().toISOString();if(config.from&&now<config.from||config.until&&now>config.until)return json({error:'Recepția nu este activă în acest moment.'},404);
 const info={title:event.eventType==='baptism'?(event.childName||'Botez'):[event.first,event.second].join(' & '),date:event.date,message:config.message,accent:config.accent};
 if(typeof b.query!=='string'||!b.query.trim())return json({info,results:[]});
 const q=norm(b.query);if(q.length<3||q.length>160)return json({info,results:[]});
 const g=await db.from('wedding_modules').select('content').eq('wedding_id',b.event).eq('module','guests').maybeSingle();if(g.error)return json({error:'Căutarea nu este disponibilă.'},503);
 const tables=event.seatingTables||[];const guests=(Array.isArray(g.data?.content)?g.data.content:[]) as Guest[];
 const results=guests.filter(g=>g.status!=='refuzat'&&q.split(' ').every(s=>norm(g.name).includes(s))).slice(0,8).map(g=>({name:g.name,table:tables.find(t=>t.guestIds.includes(g.id))?.id||null}));
 return json({info,results,tables:tables.map((t,i)=>({id:t.id,name:t.name,x:typeof t.x==='number'?Math.max(6,Math.min(94,t.x)):16+(i%5)*17,y:typeof t.y==='number'?Math.max(6,Math.min(94,t.y)):20+(Math.floor(i/5)%4)*20,shape:t.shape||'round'}))});
}
