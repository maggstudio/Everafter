import {NextRequest,NextResponse} from 'next/server';
import {createClient} from '@supabase/supabase-js';
export const runtime='nodejs';
const url=process.env.NEXT_PUBLIC_SUPABASE_URL,anon=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,secret=process.env.SUPABASE_SERVICE_ROLE_KEY;
const fail=(message:string,status:number)=>NextResponse.json({error:message},{status});
export async function POST(req:NextRequest){
 if(!url||!anon||!secret)return fail('Serviciu neconfigurat.',503);
 const bearer=req.headers.get('authorization')||'';
 if(!bearer.startsWith('Bearer '))return fail('Autentificare necesară.',401);
 const client=createClient(url,anon,{global:{headers:{Authorization:bearer}},auth:{persistSession:false}});
 const {data:{user}}=await client.auth.getUser(bearer.slice(7));if(!user)return fail('Sesiune invalidă.',401);
 let form:FormData;try{form=await req.formData()}catch{return fail('Fișier invalid.',400)}
 const weddingId=form.get('weddingId'),file=form.get('file');
 if(typeof weddingId!=='string'||!/^[0-9a-f-]{36}$/i.test(weddingId)||!(file instanceof File))return fail('Date invalide.',400);
 const {data:member}=await client.from('wedding_members').select('role,status,permissions').eq('wedding_id',weddingId).eq('user_id',user.id).maybeSingle();
 if(!member||member.status!=='active'||!(member.role==='owner'||member.permissions?.wedding?.write))return fail('Nu ai drept de editare.',403);
 if(file.size===0||file.size>5*1024*1024)return fail('Fotografia trebuie să aibă maximum 5 MB.',400);
 const bytes=new Uint8Array(await file.arrayBuffer());
 const jpeg=bytes.length>3&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
 const png=bytes.length>8&&[137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v);
 const webp=bytes.length>12&&String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP';
 const mime=jpeg?'image/jpeg':png?'image/png':webp?'image/webp':null;
 if(!mime)return fail('Sunt acceptate doar fotografii JPEG, PNG sau WebP.',400);
 const path=weddingId+'/'+crypto.randomUUID()+(jpeg?'.jpg':png?'.png':'.webp');
 const admin=createClient(url,secret,{auth:{persistSession:false}});
 const {error}=await admin.storage.from('wedly-invitation-photos').upload(path,bytes,{contentType:mime,upsert:false,cacheControl:'3600'});
 if(error)return fail('Încărcarea a eșuat. Verifică migrarea pentru bucket.',503);
 return NextResponse.json({path});
}
