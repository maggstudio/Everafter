import {NextRequest,NextResponse} from 'next/server';
import {createClient} from '@supabase/supabase-js';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=60;
type Kind='task_reminders'|'appointment_reminders'|'payment_reminders';
type Entry={date:string;label:string};
const kinds:Kind[]=['task_reminders','appointment_reminders','payment_reminders'];
const dayInRomania=(d:Date)=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Bucharest',year:'numeric',month:'2-digit',day:'2-digit'}).format(d);
const plusDays=(day:string,n:number)=>new Date(Date.parse(day+'T12:00:00Z')+n*86400000).toISOString().slice(0,10);
const validDate=(v:unknown)=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v);
const hasRead=(m:{role:string;permissions:any},module:string)=>m.role==='owner'||m.permissions?.[module]?.read===true||(module==='vendors'&&m.permissions?.expenses?.read===true);
export async function GET(req:NextRequest){
 if(!process.env.CRON_SECRET||req.headers.get('authorization')!=='Bearer '+process.env.CRON_SECRET)return NextResponse.json({error:'Unauthorized'},{status:401});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY,apiKey=process.env.RESEND_API_KEY,from=process.env.RESEND_FROM_EMAIL;
 if(!url||!key||!apiKey||!from)return NextResponse.json({error:'Missing configuration'},{status:503});
 const db=createClient(url,key,{auth:{persistSession:false}});
 const today=dayInRomania(new Date()),soon=plusDays(today,3),tomorrow=plusDays(today,1);
 const {data:preferences,error:prefError}=await db.from('notification_preferences').select('wedding_id,user_id,task_reminders,appointment_reminders,payment_reminders').or('task_reminders.eq.true,appointment_reminders.eq.true,payment_reminders.eq.true').limit(500);
 if(prefError){console.error('WEDLY reminder preferences failed',{code:prefError.code,message:prefError.message});return NextResponse.json({error:'Preferences unavailable'},{status:500})}
 let sent=0,failed=0,skipped=0;
 for(const pref of preferences||[]){
  const {data:member,error:memberError}=await db.from('wedding_members').select('role,status,permissions').eq('wedding_id',pref.wedding_id).eq('user_id',pref.user_id).maybeSingle();
  if(memberError){console.error('WEDLY reminder member lookup failed',{code:memberError.code,message:memberError.message});failed++;continue}
  if(!member||member.status!=='active'){skipped++;continue}
  const {data:modules,error:modulesError}=await db.from('wedding_modules').select('module,content').eq('wedding_id',pref.wedding_id).in('module',['wedding','tasks','calendar','vendors']);
  if(modulesError){console.error('WEDLY reminder modules failed',{code:modulesError.code,message:modulesError.message});failed++;continue}
  const get=(name:string)=>modules?.find(m=>m.module===name)?.content;
  const tasks=Array.isArray(get('tasks'))?get('tasks'):[],appointments=Array.isArray(get('calendar'))?get('calendar'):[],vendors=Array.isArray(get('vendors'))?get('vendors'):[];
  const w=get('wedding')||{},eventName=w.eventType==='baptism'?'Botez '+(w.childName||''):[w.first,w.second].filter(Boolean).join(' & ')||'Eveniment WEDLY';
  const alerts:Record<Kind,Entry[]>={
   task_reminders:tasks.filter((t:any)=>!t.done&&validDate(t.deadline)&&t.deadline<=soon).map((t:any)=>({date:t.deadline,label:String(t.title||'Sarcină')})),
   appointment_reminders:appointments.filter((a:any)=>validDate(a.date)&&a.date>=today&&a.date<=tomorrow).map((a:any)=>({date:a.date,label:String(a.name||'Programare')+(a.time?' · '+a.time:'')})),
   payment_reminders:vendors.filter((v:any)=>validDate(v.dueDate)&&v.dueDate<=soon&&Number(v.contractAmount||0)>Number(v.paidAmount||0)+(Array.isArray(v.payments)?v.payments.reduce((n:number,p:any)=>n+Number(p.amount||0),0):0)).map((v:any)=>({date:v.dueDate,label:String(v.name||'Furnizor')+' · rest '+(Number(v.contractAmount||0)-Number(v.paidAmount||0)-(Array.isArray(v.payments)?v.payments.reduce((n:number,p:any)=>n+Number(p.amount||0),0):0)).toFixed(2)+' RON'}))
  };
  for(const kind of kinds){
   const module=kind==='task_reminders'?'tasks':kind==='appointment_reminders'?'calendar':'vendors';
   if(!pref[kind]||!hasRead(member,module)||alerts[kind].length===0)continue;
   const {data:existing,error:checkError}=await db.from('notification_delivery').select('status').eq('wedding_id',pref.wedding_id).eq('user_id',pref.user_id).eq('kind',kind).eq('delivery_date',today).maybeSingle();
   if(checkError){console.error('WEDLY reminder ledger read failed',{code:checkError.code,message:checkError.message});failed++;continue}
   if(existing){skipped++;continue}
   const {error:reserveError}=await db.from('notification_delivery').insert({wedding_id:pref.wedding_id,user_id:pref.user_id,kind,delivery_date:today,status:'processing'});
   if(reserveError){console.error('WEDLY reminder ledger insert failed',{code:reserveError.code,message:reserveError.message});failed++;continue}
   try{
    const {data:user,error:userError}=await db.auth.admin.getUserById(pref.user_id);
    if(userError||!user.user?.email)throw Error('Recipient unavailable');
    const heading=kind==='task_reminders'?'Sarcini și termene':kind==='appointment_reminders'?'Programări apropiate':'Plăți furnizori';
    const lines=alerts[kind].sort((a,b)=>a.date.localeCompare(b.date)).slice(0,30).map(a=>(a.date<today?'ÎNTÂRZIAT · ':'')+a.date+' · '+a.label);
    const text=['WEDLY – '+heading,eventName,'',...lines,'','Deschide WEDLY: https://wedly.ro/dashboard'].join('\n');
    const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+apiKey,'Content-Type':'application/json'},body:JSON.stringify({from,to:[user.user.email],subject:'WEDLY · '+heading+' · '+eventName,text})});
    const result=await response.json().catch(()=>({}));
    if(!response.ok||!result.id)throw Error('Resend rejected email: HTTP '+response.status);
    const {error:finishError}=await db.from('notification_delivery').update({status:'sent',provider_id:result.id,updated_at:new Date().toISOString()}).eq('wedding_id',pref.wedding_id).eq('user_id',pref.user_id).eq('kind',kind).eq('delivery_date',today);
    if(finishError)throw Error('Delivery ledger update failed: '+finishError.message);
    sent++;
   }catch(e){console.error('WEDLY reminder send failed',{kind,error:String(e)});await db.from('notification_delivery').update({status:'failed',updated_at:new Date().toISOString()}).eq('wedding_id',pref.wedding_id).eq('user_id',pref.user_id).eq('kind',kind).eq('delivery_date',today);failed++}
  }
 }
 console.info('WEDLY reminders summary',{date:today,preferences:preferences?.length||0,sent,failed,skipped});
 return NextResponse.json({date:today,preferences:preferences?.length||0,sent,failed,skipped});
}
