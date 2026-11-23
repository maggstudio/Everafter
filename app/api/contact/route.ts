import {NextRequest,NextResponse} from 'next/server';
import {createClient} from '@supabase/supabase-js';
import {createHash} from 'node:crypto';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const fail=(error:string,status:number)=>NextResponse.json({error},{status,headers:{'Cache-Control':'no-store'}});
const db=()=>{const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;return url&&key?createClient(url,key,{auth:{persistSession:false}}):null};
const validEmail=(s:string)=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)&&s.length<=254;
export async function POST(req:NextRequest){
 const admin=db();if(!admin)return fail('Serviciul de contact nu este configurat.',503);
 const len=Number(req.headers.get('content-length')||0);if(len>12000)return fail('Mesaj prea lung.',413);
 let body:Record<string,unknown>;try{body=await req.json();if(!body||typeof body!=='object'||Array.isArray(body))throw Error()}catch{return fail('Date invalide.',400)}
 if(body.website)return NextResponse.json({ok:true});
 const get=(k:string)=>typeof body[k]==='string'?(body[k] as string).trim():'';
 const name=get('name'),email=get('email').toLowerCase(),category=get('category'),subject=get('subject'),message=get('message');
 if(name.length<2||name.length>120||!validEmail(email)||!['suggestion','problem','question','other'].includes(category)||subject.length<3||subject.length>160||message.length<10||message.length>4000)return fail('Verifică toate câmpurile formularului.',400);
 const ip=req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown';
 const salt=process.env.CONTACT_RATE_LIMIT_SECRET||process.env.SUPABASE_SERVICE_ROLE_KEY||'';
 const fingerprint=createHash('sha256').update(salt+'|'+ip+'|'+email).digest('hex');
 const {data:allowed,error:rateError}=await admin.rpc('contact_consume_limit',{p_fingerprint:fingerprint});
 if(rateError)return fail('Aplică migrarea pentru formularul de contact în Supabase.',503);
 if(!allowed)return fail('Ai trimis prea multe mesaje. Revino peste o oră.',429);
 let userId:string|null=null;
 const bearer=req.headers.get('authorization')||'';
 if(bearer.startsWith('Bearer ')){const {data:{user}}=await admin.auth.getUser(bearer.slice(7));if(user&&user.email?.toLowerCase()===email)userId=user.id}
 const {error}=await admin.from('contact_messages').insert({sender_name:name,sender_email:email,category,subject,message,user_id:userId});
 if(error){
  console.error('WEDLY contact insert failed',{code:error.code,message:error.message,details:error.details,hint:error.hint});
  if(error.code==='42P01'||error.code==='PGRST205')return fail('Formularul nu este configurat complet. Administratorul trebuie să aplice migrarea contact_support.sql.',503);
  if(error.code==='42703'||error.code==='PGRST204')return fail('Structura tabelului de contact este incompletă. Administratorul trebuie să verifice migrarea contact_support.sql.',503);
  if(error.code==='42501')return fail('Salvarea este blocată de permisiunile bazei de date. Contactează administratorul.',503);
  return fail('Mesajul nu a putut fi salvat. Cod diagnostic: '+(error.code||'DB_UNKNOWN')+'.',503);
 }
 return NextResponse.json({ok:true},{status:201,headers:{'Cache-Control':'no-store'}});
}
