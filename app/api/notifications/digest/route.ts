import {NextRequest,NextResponse} from 'next/server';
import {createClient} from '@supabase/supabase-js';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const localDate=(d:Date)=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Bucharest',year:'numeric',month:'2-digit',day:'2-digit'}).format(d);
const localHour=(d:Date)=>Number(new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Bucharest',hour:'2-digit',hourCycle:'h23'}).format(d));
const esc=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]||c));
export async function GET(req:NextRequest){
 const authorization=req.headers.get('authorization');
 if(!process.env.CRON_SECRET||authorization!=='Bearer '+process.env.CRON_SECRET)return NextResponse.json({error:'Unauthorized'},{status:401});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY,apiKey=process.env.RESEND_API_KEY,from=process.env.RESEND_FROM_EMAIL;
 if(!url||!key||!apiKey||!from)return NextResponse.json({error:'Missing server configuration'},{status:503});
 const db=createClient(url,key,{auth:{persistSession:false}});
 const now=new Date(),day=localDate(now),hour=localHour(now);
 const {data:preferences,error:prefError}=await db.from('notification_preferences').select('wedding_id,user_id,digest_hour').eq('daily_digest',true).eq('digest_hour',hour).limit(500);
 if(prefError)return NextResponse.json({error:'Preference query failed'},{status:500});
 let sent=0,skipped=0,failed=0;
 for(const pref of preferences||[]){
  const {data:member}=await db.from('wedding_members').select('role,status,permissions').eq('wedding_id',pref.wedding_id).eq('user_id',pref.user_id).maybeSingle();
  if(!member||member.status!=='active'||!(member.role==='owner'||member.permissions?.wedding?.read)){skipped++;continue}
  const {data:existing}=await db.from('notification_delivery').select('status').eq('wedding_id',pref.wedding_id).eq('user_id',pref.user_id).eq('kind','daily_digest').eq('delivery_date',day).maybeSingle();
  if(existing){skipped++;continue}
  const {error:reserveError}=await db.from('notification_delivery').insert({wedding_id:pref.wedding_id,user_id:pref.user_id,kind:'daily_digest',delivery_date:day,status:'processing'});
  if(reserveError){skipped++;continue}
  try{
   const {data:userResult,error:userError}=await db.auth.admin.getUserById(pref.user_id);
   if(userError||!userResult.user?.email)throw Error('Recipient unavailable');
   const {data:rows,error:moduleError}=await db.from('wedding_modules').select('module,content').eq('wedding_id',pref.wedding_id).in('module',['wedding','tasks','expenses','guests','calendar','vendors']);
   if(moduleError)throw Error('Event data unavailable');
   const content=(name:string)=>rows?.find(r=>r.module===name)?.content;
   const w=content('wedding')||{},tasks=Array.isArray(content('tasks'))?content('tasks'):[],guests=Array.isArray(content('guests'))?content('guests'):[],expenses=Array.isArray(content('expenses'))?content('expenses'):[],appointments=Array.isArray(content('calendar'))?content('calendar'):[],vendors=Array.isArray(content('vendors'))?content('vendors'):[];
   const title=w.eventType==='baptism'?'Botez '+(w.childName||''):[w.first,w.second].filter(Boolean).join(' & ')||'Eveniment WEDLY';
   const lines:string[]=['Rezumat zilnic WEDLY – '+title,'Data: '+day];
   if(member.role==='owner'||member.permissions?.tasks?.read)lines.push('Checklist: '+tasks.filter((t:any)=>t.done).length+'/'+tasks.length+' finalizate; '+tasks.filter((t:any)=>!t.done&&t.deadline&&t.deadline<day).length+' întârziate');
   if(member.role==='owner'||member.permissions?.guests?.read)lines.push('Invitați: '+guests.filter((g:any)=>g.status==='confirmat').length+' confirmați, '+guests.filter((g:any)=>g.status==='asteptare').length+' în așteptare, '+guests.filter((g:any)=>g.status==='refuzat').length+' refuzați');
   if(member.role==='owner'||member.permissions?.expenses?.read)lines.push('Cheltuieli: '+expenses.reduce((n:number,e:any)=>n+(Number(e.amount)||0),0).toLocaleString('ro-RO')+' RON din '+(Number(w.budget)||0).toLocaleString('ro-RO')+' RON');
   if(member.role==='owner'||member.permissions?.calendar?.read)lines.push('Programări viitoare: '+appointments.filter((a:any)=>a.date>=day).length);
   if(member.role==='owner'||member.permissions?.expenses?.read)lines.push('Furnizori înregistrați: '+vendors.length);
   lines.push('Deschide panoul: https://wedly.ro/dashboard');
   const body=lines.join('\n');
   const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+apiKey,'Content-Type':'application/json'},body:JSON.stringify({from,to:[userResult.user.email],subject:'Rezumat zilnic WEDLY – '+title,text:body,html:'<div style="font-family:Arial,sans-serif;line-height:1.7"><h2>'+esc(lines[0])+'</h2>'+lines.slice(1).map(l=>'<p>'+esc(l)+'</p>').join('')+'</div>'})});
   const result=await response.json().catch(()=>({}));
   if(!response.ok||!result.id)throw Error('Email provider failed');
   await db.from('notification_delivery').update({status:'sent',provider_id:result.id,updated_at:new Date().toISOString()}).eq('wedding_id',pref.wedding_id).eq('user_id',pref.user_id).eq('kind','daily_digest').eq('delivery_date',day);
   sent++;
  }catch(error){console.error('WEDLY digest:',error);await db.from('notification_delivery').update({status:'failed',updated_at:new Date().toISOString()}).eq('wedding_id',pref.wedding_id).eq('user_id',pref.user_id).eq('kind','daily_digest').eq('delivery_date',day);failed++}
 }
 return NextResponse.json({date:day,hour,processed:(preferences||[]).length,sent,skipped,failed});
}
