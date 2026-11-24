'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {supabase} from '../../../lib/supabase';
export default function GoogleCallback(){const [error,setError]=useState(false);
 useEffect(()=>{let active=true;async function finish(){try{if(!supabase)throw Error();const query=new URLSearchParams(location.search),hash=new URLSearchParams(location.hash.slice(1));if(query.has('error')||hash.has('error'))throw Error();const {data,error}=await supabase.auth.getSession();if(error||!data.session)throw Error();if(active)location.replace('/events')}catch{if(active){history.replaceState(null,'','/auth/google');setError(true)}}}void finish();return()=>{active=false}},[]);
 return <main className="shell narrow"><section className="panel"><h1>{error?'Conectarea nu a reușit':'Finalizăm autentificarea Google…'}</h1>{error&&<><p>Încearcă din nou sau autentifică-te cu emailul.</p><Link className="button" href="/login">Înapoi la autentificare</Link></>}</section></main>
}
