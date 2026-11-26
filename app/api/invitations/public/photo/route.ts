import {liveInvitation} from '../../../../../lib/live-invitation';
import {NextRequest,NextResponse} from 'next/server';
import {createClient} from '@supabase/supabase-js';
import {verifyPublicInvitation} from '../../../../../lib/public-invitation';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(req:NextRequest){
 const params=new URL(req.url).searchParams;
 const headers={'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'};
 if((params.get('token')||'').length>512||(params.get('invite')||'').length>65536)return new NextResponse(null,{status:400,headers});
 const details=params.get('invite')?verifyPublicInvitation(params.get('invite')||'',params.get('token')||''):await liveInvitation(params.get('token')||'');
 const asset=params.get('asset');const live=asset?await liveInvitation(params.get('token')||''):null;
 const requested=asset?(live?.studio?.blocks.some(b=>!b.hidden&&b.photos?.includes(asset))?asset:undefined):params.get('kind')==='background'?details?.backgroundPhotoPath:details?.photoPath;
 if(!requested||!/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(jpg|png|webp)$/i.test(requested))return new NextResponse(null,{status:404,headers});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY,anon=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!url||!anon)return new NextResponse(null,{status:503,headers});
 const client=createClient(url,anon,{auth:{persistSession:false}});
 const {data:active,error:activeError}=await client.rpc('rsvp_view',{p_token:params.get('token')||''});
 if(activeError||!active)return new NextResponse(null,{status:410,headers});
 if(!url||!key)return new NextResponse(null,{status:503,headers});
 const admin=createClient(url,key,{auth:{persistSession:false}});
 const {data,error}=await admin.storage.from('wedly-invitation-photos').download(requested);
 if(error||!data)return new NextResponse(null,{status:404,headers});
 const ext=requested.split('.').pop();
 return new NextResponse(await data.arrayBuffer(),{headers:{'Content-Type':ext==='png'?'image/png':ext==='webp'?'image/webp':'image/jpeg','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}});
}
