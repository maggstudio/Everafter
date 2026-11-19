'use client';
import {useState} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {supabase} from '../../lib/supabase';
export default function Login(){
 const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[mode,setMode]=useState<'login'|'signup'>('signup'),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 const router=useRouter();
 async function submit(e:React.FormEvent){e.preventDefault();if(!supabase){setMessage('Lipsesc variabilele Supabase din Vercel.');return}setBusy(true);setMessage('');
 const {data,error}=mode==='signup'?await supabase.auth.signUp({email,password,options:{emailRedirectTo:window.location.origin+'/dashboard'}}):await supabase.auth.signInWithPassword({email,password});
 setBusy(false);if(error){setMessage(error.message);return}if(data.session){router.push('/setup');router.refresh()}else setMessage('Verifică emailul pentru confirmarea contului, apoi autentifică-te.');
 }
 return <main className="shell narrow"><Link className="brand" href="/">WEDLY ✦</Link><section className="panel"><span className="eyebrow">CONTUL TĂU</span><h1>{mode==='signup'?'Creează un cont':'Autentificare'}</h1><p>Organizarea nunții tale, într-un spațiu privat.</p><form onSubmit={submit}><label>Email<input type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Parolă<input type="password" minLength={6} autoComplete={mode==='signup'?'new-password':'current-password'} required value={password} onChange={e=>setPassword(e.target.value)}/></label><button className="button full" disabled={busy}>{busy?'Se procesează...':mode==='signup'?'Creează cont':'Intră în cont'}</button></form>{message&&<p role="status">{message}</p>}<button className="text-button" onClick={()=>{setMode(mode==='signup'?'login':'signup');setMessage('')}}>{mode==='signup'?'Ai deja cont? Autentifică-te':'Nu ai cont? Înregistrează-te'}</button></section></main>
}
