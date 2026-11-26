import {NextRequest,NextResponse} from 'next/server';
import {createClient} from '@supabase/supabase-js';
import {liveInvitation} from '../../../../lib/live-invitation';
import {verifyPublicInvitation} from '../../../../lib/public-invitation';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const fail=(error:string,status=400)=>NextResponse.json({error},{status,headers:{'Cache-Control':'no-store'}});
export async function POST(req:NextRequest){
 try{
 const raw=await req.text();if(raw.length>16000)return fail('Cerere prea mare.',413);
 const body=JSON.parse(raw);const {token,invite,status,size,notes,answers}=body;
 if(typeof token!=='string'||!token||token.length>512||!['confirmat','refuzat'].includes(status)||!Number.isInteger(size)||size<1||size>20)return fail('Răspuns invalid.');
 const live=await liveInvitation(token);
 if(!live&&!(typeof invite==='string'&&invite.length<=12000&&verifyPublicInvitation(invite,token)))return fail('Invitația nu este disponibilă.',410);
 const config=live?.studio?.rsvp;
 if(config?.enabled===false)return fail('Confirmarea este dezactivată.',403);
 if(status==='confirmat'&&size>(config?.maxGuests??20))return fail('Numărul de persoane depășește limita.');
 const lines:string[]=[];
 if(status==='confirmat')for(const q of config?.questions||[]){const value=answers&&typeof answers[q.id]==='string'?answers[q.id].trim():'';if(q.required&&!value)return fail('Completează întrebările obligatorii.');if(value&&(value.length>60||(q.kind==='yesno'&&!['Da','Nu'].includes(value))))return fail('Răspuns suplimentar invalid.');if(value)lines.push(q.label+': '+value);}
 if(config?.notes!==false&&status==='confirmat'&&typeof notes==='string'&&notes.trim())lines.push(notes.trim());
 const combined=lines.join('\n');if(combined.length>500)return fail('Răspunsurile și observațiile trebuie să aibă împreună maximum 500 de caractere.');
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,anon=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!url||!anon)return fail('Serviciu indisponibil.',503);
 const client=createClient(url,anon,{auth:{persistSession:false}});
 const {data,error}=await client.rpc('rsvp_respond',{p_token:token,p_status:status,p_party_size:status==='refuzat'?1:size,p_dietary_notes:combined});
 if(error||!data)return fail('Răspunsul nu a putut fi salvat. Verifică dacă linkul mai este valid.',409);
 return NextResponse.json({ok:true},{headers:{'Cache-Control':'no-store'}});
 }catch{return fail('Nu am putut procesa răspunsul. Reîncearcă.',400)}
}
