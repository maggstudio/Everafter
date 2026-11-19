'use client';
import Link from 'next/link';import {useEffect,useState} from 'react';import {supabase} from '../../lib/supabase';
export default function Invite(){const [message,setMessage]=useState('Verificăm invitația...'),[busy,setBusy]=useState(false),[token,setToken]=useState('');
 useEffect(()=>{const t=new URLSearchParams(window.location.hash.slice(1)).get('token')||'';setToken(t);setMessage(t?'Autentifică-te cu adresa de email invitată, apoi acceptă invitația.':'Linkul nu conține un token valid.');},[]);
 async function accept(){if(!supabase||!token)return;setBusy(true);const {data:{user}}=await supabase.auth.getUser();if(!user){setMessage('Autentifică-te mai întâi la /login, apoi redeschide linkul din email.');setBusy(false);return}
 const {data,error}=await supabase.rpc('accept_email_invitation',{p_token:token});setBusy(false);if(error){setMessage(error.message);return}window.location.href='/dashboard?wedding='+encodeURIComponent(data)}
 return <main className="shell narrow"><Link href="/" className="brand">WEDLY ✦</Link><section className="panel"><h1>Invitație de colaborare</h1><p role="status">{message}</p><button className="button" disabled={!token||busy} onClick={accept}>{busy?'Se verifică...':'Acceptă invitația'}</button><p><Link href="/login">Autentificare / Înregistrare</Link></p></section></main>
}
