import {NextRequest,NextResponse} from 'next/server';
import {createClient} from '@supabase/supabase-js';
import {verifyPublicInvitation} from '../../../../../lib/public-invitation';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(req:NextRequest){
 const params=new URL(req.url).searchParams;
 const details=verifyPublicInvitation(params.get('invite')||'',params.get('token')||'');
 const requested=params.get('kind')==='background'?details?.backgroundPhotoPath:details?.photoPath;
 if(!requested||!/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(jpg|png|webp)$/i.test(requested))return new NextResponse(null,{status:404});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return new NextResponse(null,{status:503});
 const admin=createClient(url,key,{auth:{persistSession:false}});
 const {data,error}=await admin.storage.from('wedly-invitation-photos').download(requested);
 if(error||!data)return new NextResponse(null,{status:404});
 const ext=requested.split('.').pop();
 return new NextResponse(await data.arrayBuffer(),{headers:{'Content-Type':ext==='png'?'image/png':ext==='webp'?'image/webp':'image/jpeg','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}});
}
