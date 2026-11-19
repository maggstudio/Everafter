'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import {useStore} from '../lib/store';
import {supabase} from '../lib/supabase';

const features=[
 {icon:'♡',title:'Invitații & RSVP',description:'Trimite invitații digitale și urmărește răspunsurile RSVP ale invitaților.'},
 {icon:'▦',title:'Planificarea meselor',description:'Pregătește lista invitaților. Distribuirea vizuală la mese este în dezvoltare.'},
 {icon:'◷',title:'Calendar & programări',description:'Notează ceremonii, întâlniri și programări cu datele lor importante.'},
 {icon:'₾',title:'Buget & cheltuieli',description:'Monitorizează bugetul, cheltuielile și suma disponibilă.'},
 {icon:'✍',title:'Furnizori & contracte',description:'Urmărește furnizorii, sumele contractate, avansurile și scadențele. Documentele sunt în dezvoltare.'},
 {icon:'✦',title:'Pachete flexibile',description:'Compară pachetele și alege modulele opționale pentru evenimentul tău.'}
];
export default function Home(){
 const {events,ready}=useStore();
 const [loggedIn,setLoggedIn]=useState<boolean|null>(null);
 useEffect(()=>{
  let mounted=true;
  if(!supabase){setLoggedIn(false);return}
  void supabase.auth.getSession().then(({data})=>{if(mounted)setLoggedIn(Boolean(data.session))});
  const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>{if(mounted)setLoggedIn(Boolean(session))});
  return()=>{mounted=false;subscription.unsubscribe()};
 },[]);
 const href=loggedIn===false?'/login':!ready?'/events':events.length===0?'/events':events.length===1?'/dashboard':'/events';
 const label=loggedIn===false?'Începe organizarea':!ready?'Evenimentele mele':events.length===0?'Creează primul eveniment':'Evenimentele mele';
 return <main className="landing"><header className="top"><strong className="brand">WEDLY<span>✦</span></strong><nav><Link href="/events">Evenimente</Link><Link href="/dashboard">Dashboard</Link></nav></header><section className="hero"><span className="eyebrow">ORGANIZARE EVENIMENTE · ROMÂNIA</span><h1>Ziua voastră specială.<br/><em>Perfect organizată.</em></h1><p>Nunți și botezuri: invitați, buget, calendar, furnizori și toate detaliile evenimentului, într-un singur loc.</p><div className="actions"><Link className="button" href={href}>{label}</Link><Link className="button secondary" href="/events">Vezi evenimentele</Link></div></section><section className="feature-grid">{features.map(feature=><article className="feature" key={feature.title}><div className="feature-icon">{feature.icon}</div><h3>{feature.title}</h3><p>{feature.description}</p></article>)}</section><footer>WEDLY · România · v1.0.3</footer></main>
}
