import {brandedEmail} from '../../../../lib/brand-email';
import {NextRequest,NextResponse} from 'next/server';
import {createClient} from '@supabase/supabase-js';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=60;
type Queue={id:number;wedding_id:string;guest_id:string|null;guest_name:string;response_status:string;party_size:number};
export async function GET(req:NextRequest){
 if(!process.env.CRON_SECRET||req.headers.get('authorization')!=='Bearer '+process.env.CRON_SECRET)return NextResponse.json({error:'Unauthorized'},{status:401});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY,apiKey=process.env.RESEND_API_KEY,from=process.env.RESEND_FROM_EMAIL;
 if(!url||!key||!apiKey||!from)return NextResponse.json({error:'Missing configuration'},{status:503});
 const db=createClient(url,key,{auth:{persistSession:false}});
 const {data:events,error}=await db.from('rsvp_notification_queue').select('id,wedding_id,guest_id,guest_name,response_status,party_size').is('processed_at',null).order('id',{ascending:true}).limit(30);
 if(error){let configuredRole='unavailable';try{const payload=JSON.parse(Buffer.from(key.split('.')[1],'base64url').toString('utf8')) as {role?:string};configuredRole=payload.role||'missing'}catch{}console.error('WEDLY RSVP queue read failed',{code:error.code,message:error.message,hint:error.hint,configuredRole,supabaseHost:new URL(url).hostname});return NextResponse.json({error:'Queue unavailable',code:error.code||'unknown'},{status:500})}
 let sent=0,failed=0,eligible=0,skipped=0;
 for(const event of (events||[]) as Queue[]){
  const {data:preferences,error:prefError}=await db.from('notification_preferences').select('user_id').eq('wedding_id',event.wedding_id).eq('rsvp_immediate',true);
  if(prefError){console.error('WEDLY RSVP preferences read failed',{queueId:event.id,code:prefError.code,message:prefError.message});failed++;continue}
  let complete=true;
  for(const pref of preferences||[]){
   const {data:member,error:memberError}=await db.from('wedding_members').select('role,status,permissions').eq('wedding_id',event.wedding_id).eq('user_id',pref.user_id).maybeSingle();
   if(memberError){console.error('WEDLY RSVP member lookup failed',{queueId:event.id,code:memberError.code,message:memberError.message});complete=false;continue}
   if(!member||member.status!=='active'||!(member.role==='owner'||member.permissions?.guests?.read)){skipped++;continue}eligible++;
   const {data:existing,error:lookupError}=await db.from('rsvp_notification_delivery').select('status').eq('queue_id',event.id).eq('user_id',pref.user_id).maybeSingle();
   if(lookupError){console.error('WEDLY RSVP delivery lookup failed',{queueId:event.id,code:lookupError.code,message:lookupError.message});complete=false;continue}
   if(existing)continue; // No blind retry: provider may have accepted a timed-out request.
   const {error:reserveError}=await db.from('rsvp_notification_delivery').insert({queue_id:event.id,user_id:pref.user_id,status:'processing'});
   if(reserveError){console.error('WEDLY RSVP delivery reserve failed',{queueId:event.id,code:reserveError.code,message:reserveError.message});complete=false;continue}
   try{
    const {data:recipient,error:userError}=await db.auth.admin.getUserById(pref.user_id);
    if(userError||!recipient.user?.email)throw Error('Recipient unavailable');
    const {data:wedding}=await db.from('wedding_modules').select('content').eq('wedding_id',event.wedding_id).eq('module','wedding').maybeSingle();
    const w=wedding?.content||{},eventName=w.eventType==='baptism'?'Botez '+(w.childName||''):[w.first,w.second].filter(Boolean).join(' & ')||'Eveniment WEDLY';
    const action=event.response_status==='confirmat'?'a confirmat participarea':'a refuzat participarea';
    const text=[event.guest_name+' '+action+'.',event.response_status==='confirmat'?'Număr persoane: '+event.party_size:'', 'Eveniment: '+eventName,'Detalii: https://wedly.ro/dashboard?view=guests'].filter(Boolean).join('\n');
    const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+apiKey,'Content-Type':'application/json'},body:JSON.stringify({from,to:[recipient.user.email],subject:'WEDLY RSVP – '+event.guest_name,text,html:brandedEmail('Confirmare RSVP',[event.guest_name+' '+action+'.',event.response_status==='confirmat'?'Număr persoane: '+event.party_size:'', 'Eveniment: '+eventName,'https://wedly.ro/dashboard?view=guests'].filter(Boolean))})});
    const result=await response.json().catch(()=>({}));
    if(!response.ok||!result.id)throw Error('Provider rejected email');
    await db.from('rsvp_notification_delivery').update({status:'sent',provider_id:result.id}).eq('queue_id',event.id).eq('user_id',pref.user_id);
    sent++;
   }catch(e){console.error('RSVP notification failed',event.id,e);await db.from('rsvp_notification_delivery').update({status:'failed'}).eq('queue_id',event.id).eq('user_id',pref.user_id);failed++}
  }
  if(complete){const {error:finishError}=await db.from('rsvp_notification_queue').update({processed_at:new Date().toISOString()}).eq('id',event.id).is('processed_at',null);if(finishError){console.error('WEDLY RSVP queue completion failed',{queueId:event.id,code:finishError.code,message:finishError.message});failed++}}
 }
 console.info('WEDLY RSVP processing summary',{queued:(events||[]).length,eligible,skipped,sent,failed});return NextResponse.json({processed:(events||[]).length,eligible,skipped,sent,failed});
}
