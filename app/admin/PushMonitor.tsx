'use client';
import {useEffect,useState} from 'react';
import {supabase} from '../../lib/supabase';
type Metrics={generated_at:string;devices:number;users:number;devices_7d:number;pending:number;sent:number;cancelled:number;retry:number;attempts:number;legacy:number;categories:{category:string;sent:number;pending:number;cancelled:number}[]};
const names:Record<string,string>={task:'Sarcini',assignment:'Atribuiri',appointment:'Programări',payment:'Plăți',rsvp:'RSVP',countdown:'Numărătoare inversă',digest:'Rezumat'};
export default function PushMonitor(){
 const [data,setData]=useState<Metrics|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 async function load(){setBusy(true);setError('');try{if(!supabase)throw Error('Supabase indisponibil.');const {data,error}=await supabase.rpc('wedly_admin_push_overview');if(error)throw Error(error.message);setData(data as Metrics)}catch(e){setError(e instanceof Error?e.message:'Date indisponibile.')}finally{setBusy(false)}}
 useEffect(()=>{void load();const timer=setInterval(()=>{void load()},60000);return()=>clearInterval(timer)},[]);
 const items=data?[
 ['Dispozitive abonate',data.devices,'Abonamente înregistrate'],
 ['Utilizatori abonați',data.users,'Conturi distincte'],
 ['Abonamente actualizate (7 zile)',data.devices_7d,'Nu reprezintă activitate în aplicație'],
 ['Acceptate de serviciul push',data.sent,'Livrări individuale, nu confirmări de citire'],
 ['În așteptare',data.pending,'Include reîncercările'],
 ['În reîncercare',data.retry,'Cel puțin două preluări'],
 ['Anulate',data.cancelled,'Permisiuni, abonamente sau preferințe'],
 ['Încercări de procesare',data.attempts,'Include amânări și reîncercări']
 ] as [string,number,string][]:[];
 return <section className="panel" id="push-monitor"><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap'}}><div><h2>Notificări push</h2><p>Abonamente, livrări și starea cozii automate.</p></div><button className="button secondary" disabled={busy} onClick={()=>void load()}>Actualizează</button></div>
 {error&&<p role="alert">Monitorizare indisponibilă: {error}. Verifică migrarea admin_push_metrics.sql.</p>}
 {!data&&!error&&<p>Se încarcă…</p>}
 {data&&<><div className="stats" style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:12,margin:'16px 0'}}>{items.map(([label,n,desc])=><article key={label}><span>{label}</span><strong>{n.toLocaleString('ro-RO')}</strong><small>{desc}</small></article>)}</div>
 <h3>Distribuție pe categorii</h3>{data.categories.length===0?<p>Nu există încă înregistrări în coadă.</p>:<div style={{overflowX:'auto'}}><table style={{width:'100%',textAlign:'left'}}><thead><tr><th>Categorie</th><th>Acceptate</th><th>În așteptare</th><th>Anulate</th></tr></thead><tbody>{data.categories.map(c=><tr key={c.category}><td>{names[c.category]||c.category}</td><td>{c.sent}</td><td>{c.pending}</td><td>{c.cancelled}</td></tr>)}</tbody></table></div>}
 <p className="hint">Înregistrări din sistemul anterior: {data.legacy}. Acestea nu sunt incluse în totalurile cozii. Actualizare automată la 60 secunde. Ultima citire: {new Date(data.generated_at).toLocaleString('ro-RO')}.</p></>}
 </section>;
}
