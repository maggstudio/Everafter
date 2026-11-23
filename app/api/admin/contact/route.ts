import {NextRequest,NextResponse} from 'next/server';
import {createClient} from '@supabase/supabase-js';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const fail=(error:string,status:number)=>NextResponse.json({error},{status,headers:{'Cache-Control':'no-store'}});
async function authorized(req:NextRequest){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,secret=process.env.SUPABASE_SERVICE_ROLE_KEY,anon=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!url||!secret||!anon)return {error:fail('Serviciu neconfigurat.',503)};
 const token=(req.headers.get('authorization')||'').replace(/^Bearer /,'');
 if(!token)return {error:fail('Autentificare necesară.',401)};
 const auth=createClient(url,anon,{auth:{persistSession:false},global:{headers:{Authorization:'Bearer '+token}}});
 const {data:{user},error:userError}=await auth.auth.getUser(token);
 if(userError||!user)return {error:fail('Sesiune invalidă.',401)};
 const {data:allowed,error:checkError}=await auth.rpc('wedly_platform_admin');
 if(checkError||allowed!==true)return {error:fail('Acces interzis.',403)};
 return {admin:createClient(url,secret,{auth:{persistSession:false}})};
}
export async function GET(req:NextRequest){
 const a=await authorized(req);if(!a.admin)return a.error!;
 const page=Math.max(0,Math.min(1000,Number(new URL(req.url).searchParams.get('page'))||0));
 const {data,error,count}=await a.admin.from('contact_messages').select('id,sender_name,sender_email,category,subject,message,user_id,status,created_at,answered_at,reply_text,reply_error',{count:'exact'}).order('created_at',{ascending:false}).range(page*30,page*30+29);
 if(error)return fail('Nu am putut încărca mesajele.',503);
 return NextResponse.json({messages:data||[],count:count||0,page},{headers:{'Cache-Control':'no-store'}});
}
export async function POST(req:NextRequest){
 const a=await authorized(req);if(!a.admin)return a.error!;
 let body:Record<string,unknown>;try{body=await req.json()}catch{return fail('Date invalide.',400)}
 const id=typeof body.id==='string'?body.id:'',reply=typeof body.reply==='string'?body.reply.trim():'';
 if(!/^[0-9a-f-]{36}$/i.test(id)||reply.length<2||reply.length>6000)return fail('Răspuns invalid (2–6000 caractere).',400);
 const apiKey=process.env.RESEND_API_KEY,from=process.env.RESEND_FROM_EMAIL;
 if(!apiKey||!from)return fail('Resend nu este configurat.',503);
 const {data:reserved,error:reserveError}=await a.admin.from('contact_messages').update({status:'processing',reply_error:null}).eq('id',id).eq('status','new').select('id,sender_name,sender_email,subject').maybeSingle();
 if(reserveError)return fail('Nu am putut rezerva mesajul.',503);
 if(!reserved)return fail('Mesajul a fost deja preluat sau răspuns.',409);
 try{
  const result=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+apiKey,'Content-Type':'application/json'},body:JSON.stringify({from,to:[reserved.sender_email],subject:'Re: '+reserved.subject.slice(0,150),text:'Bună, '+reserved.sender_name+'!\n\n'+reply+'\n\nEchipa WEDLY\nhttps://www.wedly.ro'})});
  const payload=await result.json().catch(()=>({}));
  if(!result.ok||!payload.id)throw Error('Resend: '+result.status);
  const {error:saveError}=await a.admin.from('contact_messages').update({status:'answered',reply_text:reply,reply_provider_id:payload.id,answered_at:new Date().toISOString()}).eq('id',id).eq('status','processing');
  if(saveError){console.error('Reply sent but database update failed',id,saveError.code);return fail('Email trimis, dar actualizarea statusului a eșuat. Nu retrimite înainte de verificare.',503)}
  return NextResponse.json({ok:true},{headers:{'Cache-Control':'no-store'}});
 }catch(e){
  console.error('Contact reply error',e);
  await a.admin.from('contact_messages').update({status:'new',reply_error:'Trimiterea a eșuat. Verifică Resend înainte de reîncercare.'}).eq('id',id).eq('status','processing');
  return fail('Emailul nu a putut fi trimis. Verifică setările Resend.',502);
 }
}
