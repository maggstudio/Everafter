'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import {supabase} from '../../lib/supabase';
type Plan={code:string;label:string;price_ron:number;enabled:boolean;features:Record<string,boolean>};
type Stats={generated_at:string;users_total:number;users_active_30d:number;users_active_7d:number;events_total:number;events_created_30d:number;guests_total:number;database_bytes:number;plans:Plan[]};
export default function Admin(){
 const [data,setData]=useState<Stats|null>(null),[state,setState]=useState('loading'),[error,setError]=useState('');
 async function load(){
  if(!supabase){setError('Supabase nu este configurat.');setState('error');return}
  const {data:session}=await supabase.auth.getSession();
  if(!session.session){setState('denied');return}
  const {data:allowed,error:accessError}=await supabase.rpc('wedly_platform_admin');
  if(accessError){setError('Aplică mai întâi migrarea supabase/platform_admin.sql în Supabase.');setState('error');return}
  if(allowed!==true){setState('denied');return}
  const {data:overview,error:metricsError}=await supabase.rpc('wedly_admin_overview');
  if(metricsError||!overview){setError(metricsError?.message||'Nu putem încărca datele.');setState('error');return}
  setData(overview as Stats);setState('ready');
 }
 useEffect(()=>{void load()},[]);
 if(state==='loading')return <main className="shell narrow"><section className="panel"><h1>Verificăm accesul…</h1></section></main>;
 if(state==='denied')return <main className="shell narrow"><section className="panel"><h1>Acces restricționat</h1><p>Acest panou este disponibil doar administratorului WEDLY.</p><Link href="/dashboard">Înapoi</Link></section></main>;
 if(state==='error')return <main className="shell narrow"><section className="panel"><h1>Configurare necesară</h1><p role="alert">{error}</p><button className="button" onClick={()=>{setState('loading');void load()}}>Reîncearcă</button></section></main>;
 if(!data)return null;
 const items:[string,number,string][]=[['Conturi înregistrate',data.users_total,'Total conturi'],['Active în 30 zile',data.users_active_30d,'Autentificări recente (estimare MAU)'],['Active în 7 zile',data.users_active_7d,'Autentificări recente'],['Evenimente',data.events_total,'Total evenimente'],['Evenimente noi (30 zile)',data.events_created_30d,'Create recent'],['Invitați în liste',data.guests_total,'În toate evenimentele']];
 const pct=Math.round(data.database_bytes/(500*1024*1024)*100);
 return <main className="shell" style={{paddingTop:32}}>
  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:16}}><div><span className="eyebrow">WEDLY · ADMINISTRATOR</span><h1>Monitorizare platformă</h1><p>Creștere, capacitate și pregătirea monetizării.</p></div><div className="row-controls"><button className="button secondary" onClick={()=>{setState('loading');void load()}}>Actualizează</button><Link className="button secondary" href="/dashboard">Dashboard</Link></div></div>
  <div className="stats" style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))',gap:12,margin:'24px 0'}}>{items.map(([label,n,desc])=><article key={label}><span>{label}</span><strong>{n.toLocaleString('ro-RO')}</strong><small>{desc}</small></article>)}</div>
  <section className="panel"><h2>Capacitate bază de date</h2><p>Raportare orientativă la 500 MB (Supabase Free). Dacă folosești Pro, limita trebuie actualizată.</p><strong>{(data.database_bytes/1048576).toFixed(1)} MB · {pct}%</strong><div className="progress" role="progressbar" aria-label="Capacitate bază de date" aria-valuenow={Math.min(pct,100)} aria-valuemin={0} aria-valuemax={100}><span style={{width:Math.min(pct,100)+'%'}}/></div><p>{pct>=85?'Prag critic: evaluează upgrade-ul.':pct>=70?'Avertizare: pregătește upgrade-ul.':'Sub pragul de avertizare de 70%.'}</p></section>
  <section className="panel"><h2>Pachete pregătite</h2><p>Doar configurație pentru viitor: nu sunt active plățile, verificarea drepturilor pe eveniment sau emailurile de invitație trimise de platformă.</p><div className="admin-grid">{data.plans.map(p=><article key={p.code} className="admin-package"><h3>{p.label}</h3><strong>{p.price_ron?p.price_ron+' lei / eveniment':'Gratuit'}</strong><p>{p.enabled?'Definiție activă':'Nelansat'}</p><small>{Object.keys(p.features).filter(k=>p.features[k]).join(' · ')}</small></article>)}</div></section>
  <section className="panel"><h2>Monitorizare de integrat</h2><p>Trafic Vercel, Supabase Storage, consum Resend, apeluri RSVP, erori și latență: necesită integrarea API-urilor sau instrumentare. Nu afișăm valori estimate ca fiind măsurate.</p><p>Revizuim infrastructura la 500, 1.000 și 2.000 de utilizatori activi sau la 70–85% din limitele reale.</p></section>
  <p className="hint">Date actualizate: {new Date(data.generated_at).toLocaleString('ro-RO')}</p>
 </main>;
}
