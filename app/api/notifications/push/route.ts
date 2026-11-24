import {createClient} from '@supabase/supabase-js';
import webpush from 'web-push';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=60;
const defaults={rsvp:true,tasks:true,appointments:true,payments:true,assignments:true,countdown:true,digest:false,digest_hour:9,quiet_start:22,quiet_end:8};
const date=(d:Date)=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Bucharest',year:'numeric',month:'2-digit',day:'2-digit'}).format(d);
const distance=(v:unknown,today:string)=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)?Math.round((Date.parse(v+'T12:00:00Z')-Date.parse(today+'T12:00:00Z'))/86400000):NaN;
export async function GET(req:Request){
 if(!process.env.CRON_SECRET||req.headers.get('authorization')!=='Bearer '+process.env.CRON_SECRET)return Response.json({error:'Unauthorized'},{status:401});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY,pub=process.env.VAPID_PUBLIC_KEY,priv=process.env.VAPID_PRIVATE_KEY;
 if(!url||!key||!pub||!priv)return Response.json({error:'Missing configuration'},{status:503});
 const db=createClient(url,key,{auth:{persistSession:false}});
 webpush.setVapidDetails('mailto:contact@wedly.ro',pub,priv);
 const now=new Date(),today=date(now),hour=Number(new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Bucharest',hour:'2-digit',hourCycle:'h23'}).format(now));
 let sent=0,failed=0;
 const {data:subs,error:se}=await db.from('push_subscriptions').select('user_id,endpoint,subscription,updated_at').limit(1000);
 if(se)return Response.json({error:'Subscriptions unavailable'},{status:500});
 for(const uid of Array.from(new Set((subs||[]).map(s=>s.user_id)))){
 const devices=(subs||[]).filter(s=>s.user_id===uid);
 const {data:members,error:me}=await db.from('wedding_members').select('wedding_id,role,permissions').eq('user_id',uid).eq('status','active');
 if(me){failed++;continue}
 for(const m of members||[]){
 const {data:p,error:pe}=await db.from('wedly_push_preferences').select('*').eq('wedding_id',m.wedding_id).eq('user_id',uid).maybeSingle();
 if(pe){failed++;continue}
 const pref={...defaults,...p};
 const a=pref.quiet_start,b=pref.quiet_end;
 if(a!==b&&(a<b?hour>=a&&hour<b:hour>=a||hour<b))continue;
 const can=(mod:string)=>m.role==='owner'||m.permissions?.[mod]?.read===true;
 const {data:rows,error:re}=await db.from('wedding_modules').select('module,content').eq('wedding_id',m.wedding_id);
 if(re){failed++;continue}
 const get=(mod:string)=>rows?.find(r=>r.module===mod)?.content;
 const arr=(mod:string):any[]=>Array.isArray(get(mod))?get(mod):[];
 const w=get('wedding')||{},tasks=can('tasks')?arr('tasks'):[],appointments=can('calendar')?arr('calendar'):[],vendors=can('expenses')?arr('vendors'):[],guests=can('guests')?arr('guests'):[];
 if(distance(w.date,today)<0)continue;
 const alerts:{id:string;body:string;view:string}[]=[];
 const add=(id:string,body:string,view:string)=>alerts.push({id,body,view});
 if(pref.tasks)for(const t of tasks){const d=distance(t.deadline,today);if(!t.done&&[0,1,3].includes(d))add('task:'+t.id+':'+t.deadline+':'+d,'Termen '+(d===0?'astăzi':d===1?'mâine':'peste 3 zile')+': '+t.title,'tasks')}
 if(pref.appointments)for(const t of appointments){const d=distance(t.date,today);if(d===1||d===0&&(!t.time||hour===Math.max(0,Number(String(t.time).split(':')[0])-1)))add('appointment:'+JSON.stringify([t.id||t.name,t.date,t.time,d]),(d===1?'Mâine: ':'Astăzi: ')+t.name+(t.time?' · '+t.time:''),'calendar')}
 if(pref.payments)for(const v of vendors){const d=distance(v.dueDate,today),paid=Number(v.paidAmount||0)+(Array.isArray(v.payments)?v.payments.reduce((n:number,p:any)=>n+Number(p.amount||0),0):0);if([0,1,3,7].includes(d)&&Number(v.contractAmount)>paid)add('payment:'+v.id+':'+v.dueDate+':'+d,'Plată apropiată: '+v.name+' · '+v.dueDate,'vendors')}
 const days=distance(w.date,today);
 if(pref.countdown&&can('wedding')&&[1,7,14,30,60,90].includes(days))add('countdown:'+w.date+':'+days,'Mai '+(days===1?'este o zi':'sunt '+days+' zile')+' până la eveniment!','overview');
 if(pref.digest&&can('wedding')&&hour===pref.digest_hour){const lines:string[]=[];if(can('tasks'))lines.push(tasks.filter(t=>!t.done).length+' sarcini deschise');if(can('guests'))lines.push(guests.filter(g=>g.status==='confirmat').length+' invitați confirmați');if(can('calendar'))lines.push(appointments.filter(t=>distance(t.date,today)===0).length+' programări astăzi');if(lines.length)add('digest:'+today,lines.join(' · '),'overview')}
 for(const alert of alerts){
 const {error:reserve}=await db.from('wedly_push_delivery').insert({wedding_id:m.wedding_id,user_id:uid,event_key:alert.id});
 if(reserve){if(reserve.code!=='23505')failed++;continue}
 let delivered=false;
 for(const device of devices){try{await webpush.sendNotification(device.subscription,JSON.stringify({title:'WEDLY',body:alert.body.slice(0,220),url:'/dashboard?wedding='+encodeURIComponent(m.wedding_id)+'&view='+alert.view}),{TTL:3600,timeout:5000});delivered=true;sent++}catch(e){failed++;const code=(e as {statusCode?:number})?.statusCode;if(code===404||code===410)await db.from('push_subscriptions').delete().eq('endpoint',device.endpoint).eq('user_id',uid).eq('updated_at',device.updated_at)}}
 if(!delivered)await db.from('wedly_push_delivery').delete().eq('wedding_id',m.wedding_id).eq('user_id',uid).eq('event_key',alert.id);
 }
 }
 }
 return Response.json({sent,failed});
}
