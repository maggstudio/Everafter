'use client';
import {useEffect,useState} from 'react';
import {supabase} from '../../lib/supabase';
type Ops={generated_at:string;growth:{date:string;users:number;events:number}[];modules:{module:string;events:number;items:number}[];tables:{name:string;bytes:number}[];storage:{bucket_id:string;objects:number;bytes:number;unknown_sizes:number}[];queue_ready:number;queue_deferred:number};
const mb=(n:number)=>(n/1048576).toLocaleString('ro-RO',{maximumFractionDigits:2})+' MB';
export default function OperationsMonitor(){
 const [data,setData]=useState<Ops|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 async function load(){if(!supabase)return;setBusy(true);try{const r=await supabase.rpc('wedly_admin_operations');if(r.error)throw Error(r.error.message);setData(r.data as Ops);setError('')}catch(e){setError(e instanceof Error?e.message:'Date indisponibile')}finally{setBusy(false)}}
 useEffect(()=>{void load()},[]);
 const peak=Math.max(1,...(data?.growth||[]).flatMap(d=>[d.users,d.events]));
 return <section className="panel"><div style={{display:'flex',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}><h2>Infrastructură și evoluție</h2><button className="button secondary" disabled={busy} onClick={()=>void load()}>Actualizează</button></div>
 {error&&<p role="alert">Monitorizare indisponibilă: {error}. Verifică admin_operations.sql.</p>}
 {!data&&!error&&<p>Se încarcă…</p>}
 {data&&<><div className="stats" style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:12}}><article><span>Notificări eligibile acum</span><strong>{data.queue_ready}</strong></article><article><span>Notificări amânate</span><strong>{data.queue_deferred}</strong></article><article><span>Stocare obiecte</span><strong>{mb(data.storage.reduce((n,b)=>n+Number(b.bytes),0))}</strong><small>Dimensiuni cunoscute din metadate</small></article></div>
 <h3>Conturi și evenimente noi · 30 zile</h3><p>Albastru: conturi · Verde: evenimente</p><div style={{display:'flex',alignItems:'end',gap:3,height:120}}>{data.growth.map(d=><div key={d.date} title={d.date+': '+d.users+' conturi, '+d.events+' evenimente'} style={{flex:1,display:'flex',alignItems:'end',height:'100%',gap:1}}><span style={{flex:1,height:100*d.users/peak+'%',background:'#6479c5'}}/><span style={{flex:1,height:100*d.events/peak+'%',background:'#31936e'}}/></div>)}</div><p className="hint">{data.growth[0]?.date} — {data.growth[data.growth.length-1]?.date} · {data.growth.reduce((n,d)=>n+d.users,0)} conturi · {data.growth.reduce((n,d)=>n+d.events,0)} evenimente</p>
 <h3>Module salvate</h3><div style={{overflowX:'auto'}}><table style={{width:'100%',textAlign:'left'}}><thead><tr><th>Modul</th><th>Evenimente</th><th>Elemente în liste</th></tr></thead><tbody>{data.modules.map(m=><tr key={m.module}><td>{m.module}</td><td>{m.events}</td><td>{m.items}</td></tr>)}</tbody></table></div><p className="hint">Date salvate, nu frecvența accesării modulelor.</p>
 <h3>Top 10 tabele după dimensiune</h3>{data.tables.map(t=><p key={t.name}>{t.name} · {mb(t.bytes)}</p>)}
 <h3>Supabase Storage</h3>{data.storage.length?data.storage.map(b=><p key={b.bucket_id}>{b.bucket_id} · {b.objects} obiecte · {mb(b.bytes)}{b.unknown_sizes?' · '+b.unknown_sizes+' fără dimensiune cunoscută':''}</p>):<p>Nu există obiecte înregistrate.</p>}
 <p className="hint">Ultima citire: {new Date(data.generated_at).toLocaleString('ro-RO')}</p></>}
 </section>;
}
