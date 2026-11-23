import BrandLogo from '../components/BrandLogo';
'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {supabase} from '../../lib/supabase';

export default function ResetPassword(){
 const router=useRouter();
 const [ready,setReady]=useState(false),[busy,setBusy]=useState(false),[password,setPassword]=useState(''),[confirm,setConfirm]=useState(''),[message,setMessage]=useState('');
 useEffect(()=>{
  if(!supabase){setMessage('Autentificarea nu este configurată.');return}
  const client=supabase;
  let mounted=true;
  const {data:{subscription}}=client.auth.onAuthStateChange((event,session)=>{
   if(!mounted)return;
   if(event==='PASSWORD_RECOVERY'&&session)setReady(true);
  });
  void (async()=>{
   const params=new URLSearchParams(window.location.search);
   const code=params.get('code');
   if(code){
    const {error}=await client.auth.exchangeCodeForSession(code);
    if(error&&mounted)setMessage('Linkul de resetare este invalid sau a expirat. Solicită unul nou.');
    else if(mounted)setReady(true);
   }else{
    const {data:{session}}=await client.auth.getSession();
    if(mounted&&session)setReady(true);
    else if(mounted)setMessage('Deschide linkul de resetare primit pe email. Dacă a expirat, solicită altul.');
   }
  })();
  return()=>{mounted=false;subscription.unsubscribe()};
 },[]);
 async function submit(e:React.FormEvent){
  e.preventDefault();
  if(!supabase||!ready)return;
  if(password.length<8){setMessage('Parola trebuie să aibă minimum 8 caractere.');return}
  if(password!==confirm){setMessage('Parolele nu coincid.');return}
  setBusy(true);setMessage('');
  const {error}=await supabase.auth.updateUser({password});
  setBusy(false);
  if(error){setMessage(error.message);return}
  setMessage('Parola a fost actualizată. Te poți autentifica folosind noua parolă.');
  setReady(false);
  await supabase.auth.signOut();
  router.replace('/login');
 }
 return <main className="shell narrow"><Link className="brand" href="/"><BrandLogo/></Link><section className="panel"><span className="eyebrow">SECURITATE CONT</span><h1>Parolă nouă</h1>{ready&&<form onSubmit={submit}><label>Parolă nouă<input type="password" autoComplete="new-password" minLength={8} required value={password} onChange={e=>setPassword(e.target.value)}/></label><label>Confirmă parola<input type="password" autoComplete="new-password" minLength={8} required value={confirm} onChange={e=>setConfirm(e.target.value)}/></label><button className="button full" disabled={busy} type="submit">{busy?'Se actualizează...':'Salvează parola nouă'}</button></form>}{message&&<p role="status">{message}</p>}<p><Link href="/login">Înapoi la autentificare</Link></p></section></main>
}
