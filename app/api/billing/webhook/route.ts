import {NextRequest,NextResponse} from 'next/server';
import {createHmac,timingSafeEqual} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
export const runtime='nodejs';
export const dynamic='force-dynamic';
function verified(payload:string,signature:string,secret:string){
 const parts=signature.split(',').map(x=>x.trim().split('='));
 const timestamp=parts.find(x=>x[0]==='t')?.[1];
 if(!timestamp||!/^\d+$/.test(timestamp)||Math.abs(Date.now()/1000-Number(timestamp))>300)return false;
 const expected=createHmac('sha256',secret).update(timestamp+'.'+payload).digest('hex');
 return parts.filter(x=>x[0]==='v1').some(x=>{try{const a=Buffer.from(x[1]||'','hex'),b=Buffer.from(expected,'hex');return a.length===b.length&&timingSafeEqual(a,b)}catch{return false}});
}
export async function POST(req:NextRequest){
 const secret=process.env.STRIPE_WEBHOOK_SECRET,key=process.env.SUPABASE_SERVICE_ROLE_KEY,url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 if(!secret||!key||!url)return NextResponse.json({error:'Configuration missing'},{status:503});
 const payload=await req.text();
 if(!verified(payload,req.headers.get('stripe-signature')||'',secret))return NextResponse.json({error:'Invalid signature'},{status:400});
 let event:any;try{event=JSON.parse(payload)}catch{return NextResponse.json({error:'Invalid payload'},{status:400})}
 if(event.type!=='checkout.session.completed'&&event.type!=='checkout.session.async_payment_succeeded')return NextResponse.json({received:true});
 const session=event.data?.object;
 if(!session||session.mode!=='payment'||session.payment_status!=='paid'||session.currency!=='ron')return NextResponse.json({received:true});
 const weddingId=session.metadata?.wedding_id,packageId=session.metadata?.package_id;
 const prices:Record<string,number>={premium:14900,luxury:29900};
 if(!weddingId||!prices[packageId]||session.client_reference_id!==weddingId||session.amount_total!==prices[packageId]||typeof session.id!=='string')return NextResponse.json({error:'Invalid checkout metadata'},{status:400});
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:existing,error:lookupError}=await db.from('wedly_billing').select('status,stripe_checkout_session_id').eq('wedding_id',weddingId).maybeSingle();
 if(lookupError)return NextResponse.json({error:'Database unavailable'},{status:500});
 if(existing?.status==='paid')return NextResponse.json({received:true});
 const {error}=await db.from('wedly_billing').upsert({wedding_id:weddingId,package_id:packageId,status:'paid',stripe_checkout_session_id:session.id,stripe_customer_id:typeof session.customer==='string'?session.customer:null,stripe_payment_intent_id:typeof session.payment_intent==='string'?session.payment_intent:null,amount_total:session.amount_total,currency:'ron',paid_at:new Date().toISOString(),updated_at:new Date().toISOString()},{onConflict:'wedding_id'});
 if(error){console.error('Stripe billing persist failed',error.code);return NextResponse.json({error:'Database unavailable'},{status:500})}
 return NextResponse.json({received:true});
}
