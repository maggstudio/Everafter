import {NextRequest,NextResponse} from 'next/server';
import {createClient} from '@supabase/supabase-js';

export const runtime='nodejs';
const fail=(error:string,status:number)=>NextResponse.json({error},{status,headers:{'Cache-Control':'no-store'}});

export async function POST(req:NextRequest){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const anon=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 const secret=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!anon||!secret)return fail('Serviciul de ștergere nu este configurat.',503);
 const bearer=req.headers.get('authorization')||'';
 if(!bearer.startsWith('Bearer '))return fail('Autentificare necesară.',401);
 let body:{weddingId?:unknown;confirmation?:unknown};
 try{body=await req.json()}catch{return fail('Cerere invalidă.',400)}
 const id=body.weddingId;
 if(typeof id!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)||body.confirmation!=='STERGE DEFINITIV')return fail('Confirmarea ștergerii este invalidă.',400);
 const client=createClient(url,anon,{global:{headers:{Authorization:bearer}},auth:{persistSession:false,autoRefreshToken:false}});
 const {data:{user},error:authError}=await client.auth.getUser(bearer.slice(7));
 if(authError||!user)return fail('Sesiune invalidă.',401);
 const admin=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:owned,error:ownerError}=await admin.from('weddings').select('id').eq('id',id).eq('owner_id',user.id).maybeSingle();
 if(ownerError)return fail('Nu am putut verifica proprietarul evenimentului.',503);
 if(!owned)return fail('Doar proprietarul poate șterge evenimentul.',403);
 // Collect all invitation assets before deleting the relational event.
 const bucket='wedly-invitation-photos',files:string[]=[];
 for(let offset=0;offset<10000;offset+=100){
  const {data:list,error:listError}=await admin.storage.from(bucket).list(id,{limit:100,offset});
  if(listError)return fail('Nu am putut verifica fotografiile evenimentului. Ștergerea a fost anulată.',503);
  for(const file of list||[])if(file.name&&file.name!=='.emptyFolderPlaceholder')files.push(id+'/'+file.name);
  if((list||[]).length<100)break;
 }
 const {data:deleted,error:deleteError}=await client.rpc('delete_my_event',{p_wedding:id});
 if(deleteError||deleted!==true)return fail(deleteError?.message||'Evenimentul nu a putut fi șters. Verifică migrarea SQL.',503);
 let storageWarning=false;
 for(let i=0;i<files.length;i+=100){const {error}=await admin.storage.from(bucket).remove(files.slice(i,i+100));if(error)storageWarning=true}
 return NextResponse.json({deleted:true,storageWarning},{headers:{'Cache-Control':'no-store'}});
}
