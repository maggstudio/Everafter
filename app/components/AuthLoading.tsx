'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {supabase} from '../../lib/supabase';
import {useStore} from '../../lib/store';
export default function AuthLoading({message}:{message?:string}){
 const {refresh}=useStore();
 const [state,setState]=useState<'checking'|'unauthenticated'|'delayed'>('checking');
 useEffect(()=>{let active=true;const timer=setTimeout(()=>{if(active)setState(v=>v==='checking'?'delayed':v)},8000);
 void (async()=>{if(!supabase){if(active)setState('unauthenticated');return}try{const {data:{session}}=await supabase.auth.getSession();if(active&&!session)setState('unauthenticated')}catch{if(active)setState('delayed')}})();
 return()=>{active=false;clearTimeout(timer)}},[]);
 return <main className="shell narrow wedly-auth-loading"><section className="panel" role="status"><h1>{state==='unauthenticated'?'Autentificare necesară':state==='delayed'?'Încărcarea durează mai mult':'Se verifică accesul...'}</h1><p>{state==='unauthenticated'?'Conectează-te pentru a vedea evenimentele și datele tale.':message||'Verificăm sesiunea și încărcăm informațiile evenimentului.'}</p><div className="actions"><Link className="button" href="/login">Autentificare</Link><button type="button" className="button secondary" onClick={()=>{setState('checking');void refresh()}}>Reîncearcă</button><Link className="button secondary" href="/">Prima pagină</Link></div><noscript><p>Pentru accesarea contului este necesar JavaScript. Activează-l în browser și reîncarcă pagina.</p></noscript></section></main>
}
