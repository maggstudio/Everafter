import {NextRequest,NextResponse} from 'next/server';
import {createClient} from '@supabase/supabase-js';

export const runtime='nodejs';
const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const secret=process.env.SUPABASE_SERVICE_ROLE_KEY;
const from=process.env.RESEND_FROM_EMAIL;
const resend=process.env.RESEND_API_KEY;
const json=(message:string,status:number)=>NextResponse.json({error:message},{status});
const escapeHtml=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]||c));
export async function POST(req:NextRequest){
 if(!url||!anon||!secret||!resend||!from)return json('Trimiterea nu este configurată pe server.',503);
 const bearer=req.headers.get('authorization')||'';
 if(!bearer.startsWith('Bearer '))return json('Autentificare necesară.',401);
 let input:{weddingId?:string;guestId?:string;rsvpUrl?:string};
 try{input=await req.json()}catch{return json('Date invalide.',400)}
 const {weddingId,guestId,rsvpUrl}=input;
 if(!weddingId||!guestId||!rsvpUrl||!/^https:\/\/wedly\.ro\/rsvp\?token=[A-Za-z0-9%_\-]+$/.test(rsvpUrl))return json('Date incomplete sau link RSVP invalid.',400);
 const client=createClient(url,anon,{global:{headers:{Authorization:bearer}},auth:{persistSession:false}});
 const admin=createClient(url,secret,{auth:{persistSession:false}});
 const {data:{user},error:authError}=await client.auth.getUser(bearer.slice(7));
 if(authError||!user)return json('Sesiune invalidă.',401);
 const {data:member,error:memberError}=await client.from('wedding_members').select('role,status,permissions').eq('wedding_id',weddingId).eq('user_id',user.id).maybeSingle();
 if(memberError||!member||member.status!=='active'||!(member.role==='owner'||member.permissions?.guests?.write))return json('Nu ai drept de trimitere.',403);
 const [{data:guestModule,error:guestError},{data:eventModule,error:eventError}]=await Promise.all([
 client.from('wedding_modules').select('content').eq('wedding_id',weddingId).eq('module','guests').maybeSingle(),
 client.from('wedding_modules').select('content').eq('wedding_id',weddingId).eq('module','wedding').maybeSingle()
 ]);
 if(guestError||eventError)return json('Datele evenimentului nu sunt disponibile.',500);
 const guest=(Array.isArray(guestModule?.content)?guestModule.content:[]).find((g:{id:string})=>g.id===guestId);
 if(!guest?.email||!/^\S+@\S+\.\S+$/.test(guest.email))return json('Invitatul nu are o adresă de email validă.',400);
 const {data:issued,error:issuedError}=await client.rpc('rsvp_list',{p_wedding:weddingId});
 if(issuedError)return json('Nu am putut verifica linkul RSVP.',500);
 const record=(issued||[]).find((r:{guest_id:string;revoked_at:string|null;expires_at:string})=>r.guest_id===guestId);
 if(!record||record.revoked_at||Date.parse(record.expires_at)<Date.now())return json('Generează un link RSVP activ înainte de trimitere.',400);
 // Tokenul nu poate fi recuperat din baza de date; expeditorul îl furnizează după generare.
 const {error:reservationError}=await admin.from('invitation_email_log').insert({wedding_id:weddingId,guest_id:guestId,recipient_email:guest.email,rsvp_url:rsvpUrl,status:'sending'});
 if(reservationError)return json('Trimitere deja rezervată sau efectuată. Verifică istoricul înainte de a încerca din nou.',409);
 const w=eventModule?.content||{},d=w.invitationDesign||{};
 const event=w.eventType==='baptism'?'Botezul '+(w.childName||'copilului'):[w.first,w.second].filter(Boolean).join(' & ')||'Evenimentul nostru';
 const date=w.date?new Date(w.date+'T12:00:00').toLocaleDateString('ro-RO'):'Data va fi comunicată';
 const lines=['Dragă '+guest.name+',',d.headline||'Te invităm să sărbătorim împreună!',event,d.message||'Te așteptăm cu drag!',date+(d.time?' · '+d.time:'')+(d.location?' · '+d.location:'')+(w.city?' · '+w.city:''),'Confirmă participarea: '+rsvpUrl];
 const plain=lines.join('\n\n');
 try{
  const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+resend,'Content-Type':'application/json'},body:JSON.stringify({from,to:[guest.email],subject:'Invitație WEDLY – '+event,text:plain,html:'<div style="font-family:Georgia,serif;max-width:560px;margin:auto;line-height:1.8;color:#334038">'+lines.slice(0,-1).map((line:string)=>'<p>'+escapeHtml(line)+'</p>').join('')+'<p><a href="'+escapeHtml(rsvpUrl)+'">Confirmă participarea</a></p></div>'})});
  const result=await response.json().catch(()=>({}));
  if(!response.ok||!result.id){await admin.from('invitation_email_log').update({status:'failed',error:'Provider rejected email'}).eq('wedding_id',weddingId).eq('guest_id',guestId);return json('Furnizorul de email a respins trimiterea. Verifică istoricul.',502)}
  await admin.from('invitation_email_log').update({status:'sent',provider_id:result.id,sent_at:new Date().toISOString()}).eq('wedding_id',weddingId).eq('guest_id',guestId);
  return NextResponse.json({ok:true});
 }catch{await admin.from('invitation_email_log').update({status:'failed',error:'Transport error'}).eq('wedding_id',weddingId).eq('guest_id',guestId);return json('Eroare de rețea la expediere. Verifică istoricul.',502)}
}
export async function GET(req:NextRequest){
 if(!url||!anon||!secret)return json('Serviciu neconfigurat.',503);
 const bearer=req.headers.get('authorization')||'';
 if(!bearer.startsWith('Bearer '))return json('Autentificare necesară.',401);
 const weddingId=new URL(req.url).searchParams.get('weddingId');
 if(!weddingId)return json('Eveniment lipsă.',400);
 const client=createClient(url,anon,{global:{headers:{Authorization:bearer}},auth:{persistSession:false}});
 const {data:{user}}=await client.auth.getUser(bearer.slice(7));
 if(!user)return json('Sesiune invalidă.',401);
 const {data:member}=await client.from('wedding_members').select('role,status,permissions').eq('wedding_id',weddingId).eq('user_id',user.id).maybeSingle();
 if(!member||member.status!=='active'||!(member.role==='owner'||member.permissions?.guests?.read))return json('Acces interzis.',403);
 const admin=createClient(url,secret,{auth:{persistSession:false}});
 const {data,error}=await admin.from('invitation_email_log').select('guest_id,recipient_email,status,sent_at,created_at').eq('wedding_id',weddingId).order('created_at',{ascending:false}).limit(500);
 if(error)return json('Istoricul nu este disponibil. Verifică migrarea SQL.',503);
 return NextResponse.json({rows:data||[]});
}
