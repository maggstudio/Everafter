'use client';
import SettingsRouteShell from '../components/SettingsRouteShell';
import {Activity,Users,ShieldCheck,Bell,Mail,Wallet} from 'lucide-react';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import {supabase} from '../../lib/supabase';
import PlanEditor from './PlanEditor';
import ContactInbox from './ContactInbox';
import PushMonitor from './PushMonitor';
import OperationsMonitor from './OperationsMonitor';
import SecurityMonitor from './SecurityMonitor';
import OrganizerMonitor from './OrganizerMonitor';
import PrivacyMonitor from './PrivacyMonitor';
import GovernanceMonitor from './GovernanceMonitor';
import AuthMonitor from './AuthMonitor';
import ErasureAudit from './ErasureAudit';
type Plan={code:string;label:string;price_ron:number;enabled:boolean;features:Record<string,boolean>};
type Stats={generated_at:string;users_total:number;users_active_30d:number;users_active_7d:number;events_total:number;events_created_30d:number;guests_total:number;database_bytes:number;plans:Plan[]};
export default function Admin(){
 const [tab,setTab]=useState('overview');
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
 return <SettingsRouteShell always><main className="shell admin-workspace">
  <div className="setup-intro admin-intro"><div><span className="eyebrow">WEDLY · ADMINISTRATOR</span><h2>Monitorizare platformă</h2><p>Creștere, capacitate și pregătirea monetizării.</p></div><div className="row-controls"><button className="button secondary" onClick={()=>{setState('loading');void load()}}>Actualizează</button></div></div>
  <nav className="admin-tabs" aria-label="Categorii monitorizare">{([{id:"overview",label:"Prezentare",Icon:Activity},{id:"users",label:"Utilizatori",Icon:Users},{id:"security",label:"Securitate și GDPR",Icon:ShieldCheck},{id:"push",label:"Notificări",Icon:Bell},{id:"contact",label:"Contact",Icon:Mail},{id:"plans",label:"Abonamente",Icon:Wallet}]).map(({id,label,Icon})=><button type="button" key={id} aria-pressed={tab===id} onClick={()=>setTab(id)}><Icon size={18}/>{label}</button>)}</nav><div hidden={tab!=="overview"}><div className="stats" style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))',gap:12,margin:'24px 0'}}>{items.map(([label,n,desc])=><article key={label}><span>{label}</span><strong>{n.toLocaleString('ro-RO')}</strong><small>{desc}</small></article>)}</div>
  <OperationsMonitor/>
  <section className="panel"><h2>Capacitate bază de date</h2><p>Raportare orientativă la 500 MB (Supabase Free). Dacă folosești Pro, limita trebuie actualizată.</p><strong>{(data.database_bytes/1048576).toFixed(1)} MB · {pct}%</strong><div className="progress" role="progressbar" aria-label="Capacitate bază de date" aria-valuenow={Math.min(pct,100)} aria-valuemin={0} aria-valuemax={100}><span style={{width:Math.min(pct,100)+'%'}}/></div><p>{pct>=85?'Prag critic: evaluează upgrade-ul.':pct>=70?'Avertizare: pregătește upgrade-ul.':'Sub pragul de avertizare de 70%.'}</p></section>

  <section className="panel"><h2>Monitorizare de integrat</h2><p>Monitorizarea bazei de date, a volumului de fișiere din Storage și a cozii push este disponibilă mai sus. Traficul Vercel, consumul Resend, apelurile RSVP și erorile generale ale aplicației necesită instrumentare suplimentară.</p><p>Revizuim infrastructura la 500, 1.000 și 2.000 de utilizatori activi sau la 70–85% din limitele reale.</p></section>
  </div><div hidden={tab!=="users"}><AuthMonitor/><OrganizerMonitor/></div><div hidden={tab!=="security"}><SecurityMonitor/><PrivacyMonitor/><GovernanceMonitor/><ErasureAudit/></div><div hidden={tab!=="push"}><PushMonitor/></div><div hidden={tab!=="contact"}><ContactInbox/></div><div hidden={tab!=="plans"}><PlanEditor plans={data.plans} reload={load}/></div><p className="hint">Date actualizate: {new Date(data.generated_at).toLocaleString('ro-RO')}</p>
 </main></SettingsRouteShell>;
}
