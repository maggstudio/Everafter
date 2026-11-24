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
 const started=Date.now();
 const {data:jobs,error:claimError}=await db.rpc('wedly_push_claim',{p_limit:40});
 if(claimError)return Response.json({error:'Queue migration required'},{status:503});
 await Promise.all((jobs||[]).map(async (j:any)=>{
 const finish=async(state:string)=>{await db.from('wedly_push_queue').update({state}).eq('id',j.id).eq('attempts',j.attempts)};
 const defer=async(minutes:number)=>{await db.from('wedly_push_queue').update({available_at:new Date(Date.now()+minutes*60000).toISOString()}).eq('id',j.id).eq('attempts',j.attempts)};
 try{
 const [member,device,prefs]=await Promise.all([
 db.from('wedding_members').select('role,permissions').eq('wedding_id',j.wedding_id).eq('user_id',j.user_id).eq('status','active').maybeSingle(),
 db.from('push_subscriptions').select('subscription,updated_at').eq('endpoint',j.endpoint).eq('user_id',j.user_id).maybeSingle(),
 db.from('wedly_push_preferences').select('*').eq('wedding_id',j.wedding_id).eq('user_id',j.user_id).maybeSingle()]);
 if(member.error||device.error||prefs.error)throw Error('Lookup failed');
 const mod=j.view_name==='vendors'?'expenses':j.view_name==='overview'?'wedding':j.view_name==='calendar'?'calendar':j.view_name;
 const category=({task:'tasks',assignment:'assignments',appointment:'appointments',payment:'payments',rsvp:'rsvp',countdown:'countdown',digest:'digest'} as Record<string,string>)[j.event_key.split(':')[0]];
 const p={...defaults,...prefs.data};
 if(!member.data||!device.data||!category||!p[category]||(member.data.role!=='owner'&&member.data.permissions?.[mod]?.read!==true)){await finish('cancelled');return}
 const a=p.quiet_start,b=p.quiet_end;if(a!==b&&(a<b?hour>=a&&hour<b:hour>=a||hour<b)){await defer(15);return}
 await webpush.sendNotification(device.data.subscription,JSON.stringify({title:'WEDLY',body:j.body,url:'/dashboard?wedding='+encodeURIComponent(j.wedding_id)+'&view='+j.view_name}),{TTL:86400,timeout:5000});
 await finish('sent');sent++;
 }catch(e){failed++;const code=(e as {statusCode?:number})?.statusCode;if(code===404||code===410){await finish('cancelled')}else await defer(Math.min(360,15*Math.pow(2,Math.min(j.attempts-1,5))))}
 }));
 const lease=new Date(Date.now()+90000).toISOString();
 const {data:cursor,error:ce}=await db.from('wedly_push_cursor').update({lease_until:lease}).eq('id',1).lt('lease_until',new Date().toISOString()).select('endpoint').maybeSingle();
 if(ce||!cursor)return Response.json({sent,failed,scan:false});
 let last=cursor.endpoint;
 try{
 const {data:subs,error:se}=await db.from('push_subscriptions').select('user_id,endpoint,subscription,updated_at').gt('endpoint',last).order('endpoint').limit(100);
 if(se)return Response.json({error:'Subscriptions unavailable'},{status:500});
 for(const device of subs||[]){
 if(Date.now()-started>40000)break;
 const uid=device.user_id,devices=[device];
 let scanOk=true;
 const {data:members,error:me}=await db.from('wedding_members').select('wedding_id,role,permissions').eq('user_id',uid).eq('status','active');
 if(me){failed++;break}
 for(const m of members||[]){
 const {data:p,error:pe}=await db.from('wedly_push_preferences').select('*').eq('wedding_id',m.wedding_id).eq('user_id',uid).maybeSingle();
 if(pe){failed++;scanOk=false;continue}
 const pref={...defaults,...p};
 const a=pref.quiet_start,b=pref.quiet_end;
 if(a!==b&&(a<b?hour>=a&&hour<b:hour>=a||hour<b))continue;
 const can=(mod:string)=>m.role==='owner'||m.permissions?.[mod]?.read===true;
 const {data:rows,error:re}=await db.from('wedding_modules').select('module,content').eq('wedding_id',m.wedding_id);
 if(re){failed++;scanOk=false;continue}
 const get=(mod:string)=>rows?.find(r=>r.module===mod)?.content;
 const arr=(mod:string):any[]=>Array.isArray(get(mod))?get(mod):[];
 const w=get('wedding')||{},tasks=can('tasks')?arr('tasks'):[],appointments=can('calendar')?arr('calendar'):[],vendors=can('expenses')?arr('vendors'):[],guests=can('guests')?arr('guests'):[];
 if(distance(w.date,today)<0)continue;
 const alerts:{id:string;body:string;view:string}[]=[];
 const add=(id:string,body:string,view:string)=>alerts.push({id,body,view});
 if(pref.tasks)for(const t of tasks){const d=distance(t.deadline,today);if(!t.done&&[0,1,3].includes(d))add('task:'+t.id+':'+t.deadline+':'+d,'Termen '+(d===0?'astăzi':d===1?'mâine':'peste 3 zile')+': '+t.title,'tasks')}
 if(pref.appointments)for(const t of appointments){const d=distance(t.date,today);if(d===1||d===0&&(!t.time||hour===Math.max(0,Number(String(t.time).split(':')[0])-1)))add('appointment:'+JSON.stringify([t.id||t.name,t.date,t.time,d]),(d===1?'Mâine: ':'Astăzi: ')+t.name+(t.time?' · '+t.time:''),'calendar')}
 if(pref.payments)for(const v of vendors){const d=distance(v.dueDate,today),paid=Number(v.paidAmount||0)+(Array.isArray(v.payments)?v.payments.reduce((n:number,p:any)=>n+Number(p.amount||0),0):0);if([0,1,3,7].includes(d)&&Number(v.contractAmount)>paid)add('payment:'+v.id+':'+v.dueDate+':'+d,'Plată apropiată: '+v.name+' · '+v.dueDate,'vendors')}
 if(pref.assignments&&can('tasks'))for(const t of tasks){if(!t.done&&t.assigneeId===uid&&t.id)add('assignment:'+t.id,'Ai o sarcină atribuită: '+t.title,'tasks')}
 if(pref.rsvp&&can('guests')){
 const {data:responses,error}=await db.rpc('wedly_push_rsvp',{p_wedding:m.wedding_id});
 if(error)failed++;else for(const response of responses||[]){
 const timestamp=Date.parse(response.responded_at);
 if(!Number.isFinite(timestamp)||timestamp<Date.parse('2026-11-24T00:00:00Z')||timestamp<now.getTime()-86400000)continue;
 const guest=guests.find(g=>String(g.id)===String(response.guest_id));if(!guest)continue;
 add('rsvp:'+response.guest_id+':'+response.responded_at,guest.name+(response.status==='confirmat'?' a confirmat participarea pentru '+response.party_size+' persoane.':' nu va participa la eveniment.'),'guests');
 }
 }
 const days=distance(w.date,today);
 if(pref.countdown&&can('wedding')&&[1,7,14,30,60,90].includes(days))add('countdown:'+w.date+':'+days,'Mai '+(days===1?'este o zi':'sunt '+days+' zile')+' până la eveniment!','overview');
 if(pref.digest&&can('wedding')&&hour===pref.digest_hour){const lines:string[]=[];if(can('tasks'))lines.push(tasks.filter(t=>!t.done).length+' sarcini deschise');if(can('guests'))lines.push(guests.filter(g=>g.status==='confirmat').length+' invitați confirmați');if(can('calendar'))lines.push(appointments.filter(t=>distance(t.date,today)===0).length+' programări astăzi');if(lines.length)add('digest:'+today,lines.join(' · '),'overview')}
 for(const alert of alerts){
 const {data:legacy,error:le}=await db.from('wedly_push_delivery').select('event_key').eq('wedding_id',m.wedding_id).eq('user_id',uid).eq('event_key',alert.id).maybeSingle();
 if(le){failed++;scanOk=false;continue}
 if(legacy)continue;
 const {error:qe}=await db.from('wedly_push_queue').upsert(devices.map(d=>({wedding_id:m.wedding_id,user_id:uid,event_key:alert.id,endpoint:d.endpoint,body:alert.body.slice(0,220),view_name:alert.view})),{onConflict:'wedding_id,user_id,event_key,endpoint',ignoreDuplicates:true});
 if(qe){failed++;scanOk=false}
 }
 }
 if(!scanOk)break;
 last=device.endpoint;
 }
 if(!subs?.length)last='';
 }finally{await db.from('wedly_push_cursor').update({endpoint:last,lease_until:new Date().toISOString()}).eq('id',1).eq('lease_until',lease)}

 return Response.json({sent,failed});
}
