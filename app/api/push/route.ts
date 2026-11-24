import {createClient} from '@supabase/supabase-js';
import webpush from 'web-push';
import {createECDH} from 'node:crypto';
export const runtime='nodejs';
export async function GET(){return Response.json({key:process.env.VAPID_PUBLIC_KEY||null})}
export async function POST(req:Request){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,anon=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,secret=process.env.SUPABASE_SERVICE_ROLE_KEY;
 const pub=process.env.VAPID_PUBLIC_KEY,priv=process.env.VAPID_PRIVATE_KEY;
 if(!url||!anon)return Response.json({error:'Configurarea autentificării push este incompletă.'},{status:503});
 const token=req.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];
 if(!token)return Response.json({error:'Autentificare necesară.'},{status:401});
 const {data:{user}}=await createClient(url,anon,{auth:{persistSession:false}}).auth.getUser(token);
 if(!user)return Response.json({error:'Sesiune expirată.'},{status:401});
 const missing=[!secret?'SUPABASE_SERVICE_ROLE_KEY':null,!pub?'VAPID_PUBLIC_KEY':null,!priv?'VAPID_PRIVATE_KEY':null].filter(Boolean);
 if(!secret||!pub||!priv)return Response.json({error:'Configurare push incompletă: '+missing.join(', ')},{status:503});
 const db=createClient(url,secret,{auth:{persistSession:false}});
 let body;try{const reader=req.body?.getReader();if(!reader)throw Error('Missing body');const chunks:Uint8Array[]=[];let size=0;while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>8192){await reader.cancel();return Response.json({error:'Cerere prea mare.'},{status:413})}chunks.push(value)}body=JSON.parse(Buffer.concat(chunks).toString('utf8'))}catch{return Response.json({error:'Date invalide.'},{status:400})}
 const sub=body?.subscription,endpoint=sub?.endpoint;
 if(typeof endpoint!=='string'||endpoint.length>2048)return Response.json({error:'Abonament invalid.'},{status:400});
 let u:URL;try{u=new URL(endpoint)}catch{return Response.json({error:'Adresă invalidă.'},{status:400})}
 if(u.protocol!=='https:'||u.username||u.password||u.port||!['fcm.googleapis.com','updates.push.services.mozilla.com','web.push.apple.com'].some(h=>u.hostname===h||u.hostname.endsWith('.'+h)))return Response.json({error:'Serviciu push neacceptat.'},{status:400});
 if(body.action==='remove'){const {error}=await db.from('push_subscriptions').delete().eq('endpoint',endpoint).eq('user_id',user.id);return Response.json({ok:!error},{status:error?500:200})}
 if(body.action==='test'||body.action==='subscribe'){
 const limit=await db.rpc('wedly_consume_push_limit',{p_user:user.id,p_action:body.action});
 if(limit.error&&limit.error.code!=='PGRST202')return Response.json({error:'Serviciu temporar indisponibil.'},{status:503});
 if(!limit.error&&limit.data!==true)return Response.json({error:'Prea multe cereri. Încearcă mai târziu.'},{status:429,headers:{'Retry-After':'3600'}});
 }
 if(body.action==='test'){
 const {data,error}=await db.from('push_subscriptions').select('subscription').eq('endpoint',endpoint).eq('user_id',user.id).maybeSingle();
 if(error||!data)return Response.json({error:'Activează mai întâi notificările.'},{status:400});
 try{const ecdh=createECDH('prime256v1');if(!/^[A-Za-z0-9_-]{43}$/.test(priv)||!/^[A-Za-z0-9_-]{87}$/.test(pub))return Response.json({error:'Format VAPID invalid pe server. Verifică valorile din Vercel.'},{status:503});ecdh.setPrivateKey(Buffer.from(priv,'base64url'));if(ecdh.getPublicKey().toString('base64url')!==pub)return Response.json({error:'Cheile VAPID din Vercel nu corespund.'},{status:503});webpush.setVapidDetails('mailto:contact@wedly.ro',pub,priv);await webpush.sendNotification(data.subscription,JSON.stringify({title:'WEDLY',body:'Notificările funcționează!',url:'/dashboard?view=settings'}),{TTL:60,timeout:5000});return Response.json({ok:true})}catch(e:unknown){const code=(e as {statusCode?:number})?.statusCode;const rawCode=(e as {code?:unknown})?.code;const safeCode=typeof rawCode==='string'&&/^(?:ERR_[A-Z0-9_]{1,60}|ECONNRESET|ECONNREFUSED|ETIMEDOUT|ENOTFOUND|EAI_AGAIN|EPIPE)$/.test(rawCode)?rawCode:null;console.error('Push delivery failed',{statusCode:code,code:safeCode,name:e instanceof Error?e.name:'Unknown'});const detail=code===401||code===403?'Chei VAPID respinse sau incompatibile cu abonamentul.':code===404||code===410?'Abonament expirat. Dezactivează notificările și activează-le din nou.':code===429?'Limită temporară a serviciului push.':typeof code==='number'?'Serviciul push a răspuns cu HTTP '+code+'.':'Verifică formatul și perechea cheilor VAPID sau conexiunea serverului.';return Response.json({error:'Notificarea nu a putut fi trimisă. '+detail+(safeCode?' Cod: '+safeCode:'')},{status:502})}
 }
 if(body.action!=='subscribe'||typeof sub.keys?.p256dh!=='string'||typeof sub.keys?.auth!=='string'||!/^[A-Za-z0-9_-]{87}$/.test(sub.keys.p256dh)||!/^[A-Za-z0-9_-]{22}$/.test(sub.keys.auth))return Response.json({error:'Abonament invalid.'},{status:400});
 const {error}=await db.from('push_subscriptions').upsert({endpoint,user_id:user.id,subscription:{endpoint,keys:{p256dh:sub.keys.p256dh,auth:sub.keys.auth}},updated_at:new Date().toISOString()});
 return Response.json(error?{error:'Abonamentul nu a putut fi salvat.'}:{ok:true},{status:error?500:200});
}
