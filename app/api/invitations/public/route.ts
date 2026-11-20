import {NextRequest,NextResponse} from 'next/server';
import {verifyPublicInvitation} from '../../../../lib/public-invitation';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(req:NextRequest){
 const url=new URL(req.url),token=url.searchParams.get('token')||'',invite=url.searchParams.get('invite')||'';
 const details=verifyPublicInvitation(invite,token);
 if(!details)return NextResponse.json({error:'Invitația nu este validă sau a expirat.'},{status:404,headers:{'Cache-Control':'no-store'}});
 const {tokenHash,expires,...publicDetails}=details;
 return NextResponse.json(publicDetails,{headers:{'Cache-Control':'no-store','Referrer-Policy':'no-referrer'}});
}
