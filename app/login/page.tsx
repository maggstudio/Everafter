'use client';
import {PublicThemeControl} from '../components/ThemeSettings';
import SmartHomeLogo from '../components/SmartHomeLogo';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {supabase} from '../../lib/supabase';

export default function Login(){
 const [email,setEmail]=useState(''),[password,setPassword]=useState('');
 const [mode,setMode]=useState<'login'|'signup'|'forgot'>('login');
 const [message,setMessage]=useState(''),[busy,setBusy]=useState(false),[showPassword,setShowPassword]=useState(false);
 const [accepted,setAccepted]=useState(false);
 const router=useRouter();
 useEffect(()=>{if(new URLSearchParams(window.location.search).get('mode')==='signup')setMode('signup')},[]);
 async function submit(e:React.FormEvent){
  e.preventDefault();if(!supabase){setMessage('Serviciul de autentificare nu este configurat.');return}
  setBusy(true);setMessage('');
  try{
   if(mode==='forgot'){
    const {error}=await supabase.auth.resetPasswordForEmail(email.trim(),{redirectTo:window.location.origin+'/reset-password'});
    if(error)throw error;
    setMessage('Dacă adresa este asociată unui cont, vei primi un email cu instrucțiuni pentru resetarea parolei. Verifică și Spam.');
    return;
   }
   if(mode==='signup'){
    if(!accepted){setMessage('Acceptă termenii pentru a crea contul.');return;}
    const {data,error}=await supabase.auth.signUp({email:email.trim(),password,options:{emailRedirectTo:window.location.origin+'/events',data:{terms_version:'2026-11-24-v1',terms_accepted_at:new Date().toISOString()}}});
    if(error)throw error;
    if(data.session){router.replace('/events');return}
    setMessage('Verifică emailul pentru confirmarea contului. Dacă ai deja un cont, folosește Autentificare sau Ai uitat parola.');
    return;
   }
   const {error}=await supabase.auth.signInWithPassword({email:email.trim(),password});
   if(error){
    if(error.message.toLowerCase().includes('email not confirmed'))setMessage('Adresa de email nu este confirmată. Verifică mesajul de confirmare din Inbox sau Spam.');
    else if(error.message.toLowerCase().includes('invalid login credentials'))setMessage('Email sau parolă incorectă. Poți folosi „Ai uitat parola?” pentru recuperare.');
    else setMessage(error.message);
    return;
   }
   router.replace('/events');
  }catch(err){setMessage(err instanceof Error?err.message:'A apărut o eroare. Încearcă din nou.')}
  finally{setBusy(false)}
 }
 return <main className="shell narrow"><header className="top"><SmartHomeLogo/><PublicThemeControl/></header><section className="panel"><span className="eyebrow">CONTUL TĂU</span><h1>{mode==='signup'?'Creează un cont':mode==='forgot'?'Resetează parola':'Autentificare'}</h1><p>{mode==='forgot'?'Introdu adresa de email și îți trimitem un link pentru a alege o parolă nouă.':'Organizarea evenimentului tău, într-un spațiu privat.'}</p><form onSubmit={submit}><label>Email<input type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label>{mode!=='forgot'&&<label>Parolă<input type={showPassword?"text":"password"} minLength={6} autoComplete={mode==='signup'?'new-password':'current-password'} required value={password} onChange={e=>setPassword(e.target.value)}/></label>}{mode!=='forgot'&&<label className="password-visibility"><input type="checkbox" checked={showPassword} onChange={e=>setShowPassword(e.target.checked)}/> Afișează parola</label>}{mode==='signup'&&<label className="password-visibility"><input type="checkbox" required checked={accepted} onChange={e=>setAccepted(e.target.checked)}/> <span>Am minimum 18 ani și accept <Link href="/termeni" target="_blank" rel="noopener">Termenii și condițiile</Link>.</span></label>}<p className="hint">Consultă <Link href="/confidentialitate" target="_blank" rel="noopener">Politica de confidențialitate</Link>.</p><button className="button full" type="submit" disabled={busy||(mode==='signup'&&!accepted)}>{busy?'Se procesează...':mode==='signup'?'Creează cont':mode==='forgot'?'Trimite linkul de resetare':'Intră în cont'}</button></form>{message&&<p role="status" aria-live="polite">{message}</p>}<div className="auth-links">{mode==='login'&&<button type="button" className="text-button" onClick={()=>{setMode('forgot');setMessage('')}}>Ai uitat parola?</button>}{mode!=='login'&&<button type="button" className="text-button" onClick={()=>{setMode('login');setMessage('')}}>Înapoi la autentificare</button>}{mode!=='signup'&&<button type="button" className="text-button" onClick={()=>{setMode('signup');setMessage('')}}>Nu ai cont? Înregistrează-te</button>}</div></section></main>
}
