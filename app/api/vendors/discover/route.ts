import {NextRequest,NextResponse} from 'next/server';
import {createClient} from '@supabase/supabase-js';
export const runtime='nodejs';
const fail=(error:string,status:number)=>NextResponse.json({error},{status});
const queries:Record<string,string>={restaurant:'sala de nunti restaurante evenimente',photographer:'fotograf nunta videograf',music:'formatie nunta DJ evenimente',decor:'floraria decoratiuni nunta',cake:'cofetarie tort nunta catering',beauty:'machiaj mireasa coafor nunta',transport:'inchiriere masini nunta',planner:'organizator nunti wedding planner'};
export async function POST(req:NextRequest){
 const key=process.env.GOOGLE_PLACES_API_KEY,url=process.env.NEXT_PUBLIC_SUPABASE_URL,anon=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!key)return fail('Căutarea Google nu este configurată. Adaugă GOOGLE_PLACES_API_KEY în Vercel.',503);
 if(!url||!anon)return fail('Autentificarea nu este configurată.',503);
 const bearer=req.headers.get('authorization')||'';if(!bearer.startsWith('Bearer '))return fail('Autentificare necesară.',401);
 const client=createClient(url,anon,{global:{headers:{Authorization:bearer}},auth:{persistSession:false}});
 const {data:{user}}=await client.auth.getUser(bearer.slice(7));if(!user)return fail('Sesiune invalidă.',401);
 let body:{weddingId?:string;category?:string};try{body=await req.json()}catch{return fail('Cerere invalidă.',400)}
 if(!body.weddingId||!/^[0-9a-f-]{36}$/i.test(body.weddingId)||!body.category||!queries[body.category])return fail('Parametri invalizi.',400);
 const {data:member}=await client.from('wedding_members').select('role,status,permissions').eq('wedding_id',body.weddingId).eq('user_id',user.id).maybeSingle();
 if(!member||member.status!=='active'||!(member.role==='owner'||member.permissions?.vendors?.read||member.permissions?.expenses?.read))return fail('Nu ai acces la furnizori.',403);
 const {data:mod}=await client.from('wedding_modules').select('content').eq('wedding_id',body.weddingId).eq('module','wedding').maybeSingle();
 const city=typeof mod?.content?.city==='string'?mod.content.city.trim():'';
 if(!city||city.length>100)return fail('Configurează mai întâi orașul evenimentului.',400);
 const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),9000);
 try{
 const response=await fetch('https://places.googleapis.com/v1/places:searchText',{method:'POST',headers:{'Content-Type':'application/json','X-Goog-Api-Key':key,'X-Goog-FieldMask':'places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.internationalPhoneNumber,places.rating,places.userRatingCount,places.websiteUri,places.googleMapsUri'},body:JSON.stringify({textQuery:queries[body.category]+' in '+city+', Romania',languageCode:'ro',regionCode:'RO',pageSize:20}),signal:controller.signal,cache:'no-store'});
 if(!response.ok)return fail('Google Places nu a putut furniza rezultate. Verifică API-ul, facturarea și restricțiile cheii.',502);
 const json=await response.json();const results=(Array.isArray(json.places)?json.places:[]).map((p:any)=>({id:String(p.id||''),name:String(p.displayName?.text||''),address:String(p.formattedAddress||''),phone:String(p.internationalPhoneNumber||p.nationalPhoneNumber||''),rating:typeof p.rating==='number'?p.rating:null,reviews:typeof p.userRatingCount==='number'?p.userRatingCount:null,website:String(p.websiteUri||''),maps:String(p.googleMapsUri||'')})).filter((p:{id:string;name:string})=>p.id&&p.name);
 return NextResponse.json({city,results},{headers:{'Cache-Control':'private, no-store'}});
 }catch{return fail('Căutarea nu a putut fi finalizată. Încearcă din nou.',502)}finally{clearTimeout(timeout)}
}
