import {createClient} from '@supabase/supabase-js';
import webpush from 'web-push';
export const runtime='nodejs';
export async function GET(){return Response.json({key:process.env.VAPID_PUBLIC_KEY||null})}
export async function POST(req:Request){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,anon=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,secret=process.env.SUPABASE_SERVICE_ROLE_KEY;
 const pub=process.env.VAPID_PUBLIC_KEY,priv=process.env.VAPID_PRIVATE_KEY;
 if(!url||!anon||!secret||!pub||!priv)return Response.json({error:'Notificările nu sunt configurate încă.'},{status:503});
 const token=req.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];
 if(!token)return Response.json({error:'Autentificare necesară.'},{status:401});
 const {data:{user}}=await createClient(url,anon,{auth:{persistSession:false}}).auth.getUser(token);
 if(!user)return Response.json({error:'Sesiune expirată.'},{status:401});
 const db=createClient(url,secret,{auth:{persistSession:false}});
 let body;try{body=await req.json()}catch{return Response.json({error:'Date invalide.'},{status:400})}
 const sub=body?.subscription,endpoint=sub?.endpoint;
 if(typeof endpoint!=='string'||endpoint.length>2048)return Response.json({error:'Abonament invalid.'},{status:400});
 let u:URL;try{u=new URL(endpoint)}catch{return Response.json({error:'Adresă invalidă.'},{status:400})}
 if(u.protocol!=='https:'||u.username||u.password||u.port||!['fcm.googleapis.com','updates.push.services.mozilla.com','web.push.apple.com'].some(h=>u.hostname===h||u.hostname.endsWith('.'+h)))return Response.json({error:'Serviciu push neacceptat.'},{status:400});
 if(body.action==='remove'){const {error}=await db.from('push_subscriptions').delete().eq('endpoint',endpoint).eq('user_id',user.id);return Response.json({ok:!error},{status:error?500:200})}
 if(body.action==='test'){
 const {data,error}=await db.from('push_subscriptions').select('subscription').eq('endpoint',endpoint).eq('user_id',user.id).maybeSingle();
 if(error||!data)return Response.json({error:'Activează mai întâi notificările.'},{status:400});
 try{webpush.setVapidDetails('mailto:contact@wedly.ro',pub,priv);await webpush.sendNotification(data.subscription,JSON.stringify({title:'WEDLY',body:'Notificările funcționează!',url:'/dashboard?view=settings'}),{TTL:60});return Response.json({ok:true})}catch{return Response.json({error:'Notificarea nu a putut fi trimisă.'},{status:502})}
 }
 if(body.action!=='subscribe'||typeof sub.keys?.p256dh!=='string'||typeof sub.keys?.auth!=='string'||sub.keys.p256dh.length>200||sub.keys.auth.length>100)return Response.json({error:'Abonament invalid.'},{status:400});
 const {error}=await db.from('push_subscriptions').upsert({endpoint,user_id:user.id,subscription:{endpoint,keys:{p256dh:sub.keys.p256dh,auth:sub.keys.auth}},updated_at:new Date().toISOString()});
 return Response.json(error?{error:'Abonamentul nu a putut fi salvat.'}:{ok:true},{status:error?500:200});
}
