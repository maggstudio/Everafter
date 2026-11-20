import {NextRequest,NextResponse} from 'next/server';
import {createClient} from '@supabase/supabase-js';
export const runtime='nodejs';
const prices:Record<string,number>={premium:14900,luxury:29900};
export async function POST(req:NextRequest){
 try{
 const stripeKey=process.env.STRIPE_SECRET_KEY,dbUrl=process.env.NEXT_PUBLIC_SUPABASE_URL,anon=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,service=process.env.SUPABASE_SERVICE_ROLE_KEY,site=process.env.NEXT_PUBLIC_SITE_URL;
 if(!stripeKey||!dbUrl||!anon||!service||!site)return NextResponse.json({error:'Stripe nu este configurat încă.'},{status:503});
 const authorization=req.headers.get('authorization')||'';
 if(!/^Bearer\s+\S+$/.test(authorization))return NextResponse.json({error:'Autentificare necesară.'},{status:401});
 const token=authorization.replace(/^Bearer\s+/,'').trim();
 const auth=createClient(dbUrl,anon,{auth:{autoRefreshToken:false,persistSession:false}});
 const {data:{user},error:authError}=await auth.auth.getUser(token);
 if(authError||!user)return NextResponse.json({error:'Sesiune invalidă.'},{status:401});
 const body=await req.json(),weddingId=body?.weddingId,packageId=body?.packageId;
 if(typeof weddingId!=='string'||!/^[0-9a-f-]{36}$/i.test(weddingId)||typeof packageId!=='string'||!prices[packageId])return NextResponse.json({error:'Pachet invalid.'},{status:400});
 const db=createClient(dbUrl,service,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:member,error:memberError}=await db.from('wedding_members').select('role,status').eq('wedding_id',weddingId).eq('user_id',user.id).maybeSingle();
 if(memberError||member?.role!=='owner'||member.status!=='active')return NextResponse.json({error:'Doar proprietarul poate achiziționa pachetul.'},{status:403});
 const {data:existing,error:billingError}=await db.from('wedly_billing').select('status,package_id').eq('wedding_id',weddingId).maybeSingle();
 if(billingError)return NextResponse.json({error:'Nu se poate verifica plata existentă.'},{status:503});
 if(existing?.status==='paid')return NextResponse.json({error:'Acest eveniment are deja un pachet achitat. Upgrade-ul va fi disponibil separat.'},{status:409});
 const params=new URLSearchParams();
 params.set('mode','payment');params.set('success_url',site.replace(/\/$/,'')+'/setup?checkout=success');params.set('cancel_url',site.replace(/\/$/,'')+'/setup?checkout=cancel');
 params.set('client_reference_id',weddingId);params.set('customer_email',user.email||'');
 params.set('metadata[wedding_id]',weddingId);params.set('metadata[package_id]',packageId);
 params.set('line_items[0][price_data][currency]','ron');
 params.set('line_items[0][price_data][unit_amount]',String(prices[packageId]));
 params.set('line_items[0][price_data][product_data][name]','WEDLY '+(packageId==='premium'?'Premium':'Luxury')+' – acces pentru un eveniment');
 params.set('line_items[0][quantity]','1');
 const response=await fetch('https://api.stripe.com/v1/checkout/sessions',{method:'POST',headers:{Authorization:'Bearer '+stripeKey,'Content-Type':'application/x-www-form-urlencoded'},body:params.toString(),cache:'no-store'});
 const session=await response.json();
 if(!response.ok||!session?.url||!session?.id){console.error('Stripe checkout failed',response.status,session?.error?.code);return NextResponse.json({error:'Nu s-a putut iniția plata.'},{status:502})}
 return NextResponse.json({url:session.url});
 }catch{return NextResponse.json({error:'Cerere invalidă.'},{status:400})}
}
