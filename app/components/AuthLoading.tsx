'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {supabase} from '../../lib/supabase';
import {useStore} from '../../lib/store';
import BrandLogo from './BrandLogo';
export default function AuthLoading({message}:{message?:string}){
 const {refresh}=useStore();
 const [state,setState]=useState<'checking'|'unauthenticated'|'delayed'>('checking');
 const [attempt,setAttempt]=useState(0);
 useEffect(()=>{let active=true;const timer=setTimeout(()=>{if(active)setState(v=>v==='checking'?'delayed':v)},10000);
 void (async()=>{if(!supabase){if(active)setState('delayed');return}try{const {data:{session},error}=await supabase.auth.getSession();if(active&&!session&&!error)setState('unauthenticated')}catch{if(active)setState('delayed')}})();
 return()=>{active=false;clearTimeout(timer)}},[attempt]);
 return <main className="wedly-splash" aria-busy={state==='checking'}><div className="wedly-splash-inner"><BrandLogo showMotto/>{state==='checking'?<div className="wedly-splash-progress" role="status" aria-label="Se încarcă WEDLY"><span/></div>:<section className="wedly-splash-recovery"><h2>{state==='unauthenticated'?'Autentificare necesară':'Încărcarea durează mai mult'}</h2><p>{state==='unauthenticated'?'Conectează-te pentru a accesa evenimentul.':message||'Verifică conexiunea la internet.'}</p><div className="actions"><Link className="button" href="/login">Autentificare</Link><button type="button" className="button secondary" onClick={()=>{setState('checking');setAttempt(v=>v+1);void refresh()}}>Reîncearcă</button><Link className="button secondary" href="/">Prima pagină</Link></div></section>}</div></main>
}
