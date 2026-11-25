import {NextRequest,NextResponse} from 'next/server';
import {createClient} from '@supabase/supabase-js';
export const runtime='nodejs';
export async function POST(request:NextRequest){
 try{
  const origin=process.env.NEXT_PUBLIC_SITE_URL;
  const supabaseUrl=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publicKey=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const resendKey=process.env.RESEND_API_KEY;
  const from=process.env.RESEND_FROM_EMAIL;
  if(!origin||!supabaseUrl||!publicKey||!resendKey||!from) return NextResponse.json({error:'Configurarea emailurilor lipsește.'},{status:503});
  const authorization=request.headers.get('authorization')||'';
  if(!/^Bearer\s+\S+$/.test(authorization))return NextResponse.json({error:'Autentificare necesară'},{status:401});
  const client=createClient(supabaseUrl,publicKey,{auth:{autoRefreshToken:false,persistSession:false},global:{headers:{Authorization:authorization}}});
  const {data:{user},error:authError}=await client.auth.getUser(authorization.replace(/^Bearer\s+/,'').trim());
  if(authError||!user)return NextResponse.json({error:'Sesiune invalidă'},{status:401});
  const payload=await request.json();
  const {weddingId,email,role,permissions}=payload||{};
  if(typeof weddingId!=='string'||typeof email!=='string'||email.length>254||!['partner','planner','collaborator'].includes(role)||!permissions||typeof permissions!=='object'||Array.isArray(permissions))return NextResponse.json({error:'Date invalide'},{status:400});
  const {data:token,error}=await client.rpc('create_email_invitation',{p_wedding:weddingId,p_email:email,p_role:role,p_permissions:permissions});
  if(error||!token)return NextResponse.json({error:error?.message||'Nu s-a putut crea invitația'},{status:403});
  const inviteLink=`${origin.replace(/\/$/,'')}/invite#token=${encodeURIComponent(token)}`;
  const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${resendKey}`,'Content-Type':'application/json'},body:JSON.stringify({from,to:[email],subject:'Invitație de colaborare pe WEDLY',html:`<div style="font-family:Arial,sans-serif;max-width:540px;margin:auto"><img src="https://www.wedly.ro/brand/wedly-icon.png" width="64" height="64" alt="WEDLY" style="display:block;width:64px;height:64px;margin:0 0 12px"/><h1 style="color:#472443;letter-spacing:3px;margin:0">WEDLY</h1><p style="color:#8B617B;font-size:12px">Planifică. Organizează. Celebrează.</p><p>Ai fost invitat(ă) să colaborezi la organizarea unui eveniment.</p><p><a href="${inviteLink}" style="background:#254b43;color:white;padding:12px 20px;text-decoration:none">Acceptă invitația</a></p><p>Linkul expiră în 7 zile. Autentifică-te cu aceeași adresă de email la care ai primit invitația.</p></div>`})});
  if(!response.ok){return NextResponse.json({error:'Invitația a fost creată, dar emailul nu a putut fi trimis. Revocă invitația și încearcă din nou.'},{status:502})}
  return NextResponse.json({ok:true});
 }catch{return NextResponse.json({error:'Cerere invalidă sau serviciu indisponibil'},{status:400})}
}
