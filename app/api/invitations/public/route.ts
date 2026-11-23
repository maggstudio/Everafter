import {createClient} from '@supabase/supabase-js';
import {NextRequest,NextResponse} from 'next/server';
import {verifyPublicInvitation} from '../../../../lib/public-invitation';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(req:NextRequest){
 const url=new URL(req.url),token=url.searchParams.get('token')||'',invite=url.searchParams.get('invite')||'';
 const details=verifyPublicInvitation(invite,token);
 if(!details)return NextResponse.json({error:'Invitația nu este validă sau a expirat.'},{status:404,headers:{'Cache-Control':'no-store'}});
 const dbUrl=process.env.NEXT_PUBLIC_SUPABASE_URL,anon=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!dbUrl||!anon)return NextResponse.json({error:'Serviciu indisponibil.'},{status:503});
 const client=createClient(dbUrl,anon,{auth:{persistSession:false}});
 const {data:active,error}=await client.rpc('rsvp_view',{p_token:token});
 if(error||!active)return NextResponse.json({error:'Linkul RSVP a fost folosit, revocat sau a expirat.'},{status:410,headers:{'Cache-Control':'no-store'}});
 const {tokenHash,expires,...publicDetails}=details;
 return NextResponse.json(publicDetails,{headers:{'Cache-Control':'no-store','Referrer-Policy':'no-referrer'}});
}
