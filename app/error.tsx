'use client';
import {useEffect} from 'react';
export default function ErrorPage({error,reset}:{error:Error & {digest?:string};reset:()=>void}){useEffect(()=>{console.error('WEDLY route error',error.digest||'client');},[error]);return <main className="shell narrow"><section className="panel"><span className="eyebrow">WEDLY</span><h1>A apărut o eroare</h1><p>Încearcă din nou. Dacă problema persistă, contactează echipa WEDLY.</p><button className="button" onClick={reset}>Reîncearcă</button><a className="button secondary" href="/">Prima pagină</a></section></main>}
