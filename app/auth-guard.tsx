'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import BrandLogo from './components/BrandLogo';
import {useRouter} from 'next/navigation';
import {supabase} from '../lib/supabase';
export default function AuthGuard({children}:{children:React.ReactNode}){
 const [ready,setReady]=useState(false),[problem,setProblem]=useState('');
 const router=useRouter();
 useEffect(()=>{
  if(!supabase){setProblem('Autentificarea nu este configurată.');return}
  let alive=true;
  const timeout=setTimeout(()=>{if(alive)setProblem(v=>v||'Verificarea sesiunii durează prea mult. Poți reîncerca.')},8000);
  void supabase.auth.getSession().then(({data,error})=>{
   if(!alive)return;
   if(error){setProblem('Nu am putut verifica sesiunea. Încearcă din nou.');return}
   if(!data.session){clearTimeout(timeout);router.replace('/login');return}
   clearTimeout(timeout);setReady(true);setProblem('');
  }).catch(()=>{if(alive)setProblem('Verificarea autentificării a eșuat. Încearcă din nou.')});
  const {data:{subscription}}=supabase.auth.onAuthStateChange((event,session)=>{if(event==='SIGNED_OUT'||(event==='INITIAL_SESSION'&&!session)){setReady(false);router.replace('/login')}});
  return()=>{alive=false;clearTimeout(timeout);subscription.unsubscribe()};
 },[router]);
 if(!ready)return <main className="wedly-splash" aria-busy={!problem}><div className="wedly-splash-inner"><BrandLogo showMotto/>{!problem?<div className="wedly-splash-progress" role="status" aria-label="Se încarcă WEDLY"><span/></div>:<section className="wedly-splash-recovery" role="alert"><h2>Nu putem verifica accesul</h2><p>{problem}</p><div className="actions"><Link className="button" href="/login">Autentificare</Link><button className="button secondary" type="button" onClick={()=>window.location.reload()}>Reîncearcă</button><Link className="button secondary" href="/">Prima pagină</Link></div></section>}<noscript>Activează JavaScript pentru accesarea contului.</noscript></div></main>;
 return <>{children}</>;
}
