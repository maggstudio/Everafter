import {NextRequest,NextResponse} from 'next/server';
import {createHmac,timingSafeEqual} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';

export const runtime='nodejs';
type ResendEvent={type?:string;data?:{email_id?:string;id?:string}};
function verify(body:string,headers:Headers,secret:string){
 const id=headers.get('svix-id'),timestamp=headers.get('svix-timestamp'),signature=headers.get('svix-signature');
 if(!id||!timestamp||!signature)return false;
 const seconds=Number(timestamp);
 if(!Number.isFinite(seconds)||Math.abs(Date.now()/1000-seconds)>300)return false;
 const key=secret.startsWith('whsec_')?secret.slice(6):secret;
 let bytes:Buffer;
 try{bytes=Buffer.from(key,'base64');if(bytes.length<16)return false}catch{return false}
 const digest=createHmac('sha256',bytes).update(id+'.'+timestamp+'.'+body).digest();
 return signature.split(' ').some(item=>{if(!item.startsWith('v1,'))return false;try{const candidate=Buffer.from(item.slice(3),'base64');return candidate.length===digest.length&&timingSafeEqual(candidate,digest)}catch{return false}});
}
export async function POST(req:NextRequest){
 const secret=process.env.RESEND_WEBHOOK_SECRET;
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!secret||!url||!key)return NextResponse.json({error:'Webhook not configured'},{status:503});
 const raw=await req.text();
 if(!verify(raw,req.headers,secret))return NextResponse.json({error:'Invalid signature'},{status:401});
 let event:ResendEvent;
 try{event=JSON.parse(raw)}catch{return NextResponse.json({error:'Invalid JSON'},{status:400})}
 const statuses:Record<string,string>={'email.delivered':'delivered','email.bounced':'bounced','email.complained':'complained','email.failed':'failed'};
 const status=event.type?statuses[event.type]:undefined;
 const emailId=event.data?.email_id||event.data?.id;
 if(!status||!emailId)return NextResponse.json({ok:true,ignored:true});
 const admin=createClient(url,key,{auth:{persistSession:false}});
 const {data:row,error:lookupError}=await admin.from('invitation_email_log').select('id,status').eq('provider_id',emailId).maybeSingle();
 if(lookupError){console.error('Resend webhook lookup',lookupError.code);return NextResponse.json({error:'Database unavailable'},{status:503})}
 if(!row)return NextResponse.json({ok:true,ignored:true});
 // Delivery events may arrive out of order; never overwrite a final status with an earlier one.
 if(['delivered','bounced','complained'].includes(row.status)&&status==='failed')return NextResponse.json({ok:true,ignored:true});
 if(row.status==='complained'&&status!=='complained')return NextResponse.json({ok:true,ignored:true});
 const {error}=await admin.from('invitation_email_log').update({status,error:status==='failed'?'Delivery failed':status==='bounced'?'Email bounced':status==='complained'?'Spam complaint':null}).eq('id',row.id);
 if(error){console.error('Resend webhook update',error.code);return NextResponse.json({error:'Database unavailable'},{status:503})}
 return NextResponse.json({ok:true});
}
