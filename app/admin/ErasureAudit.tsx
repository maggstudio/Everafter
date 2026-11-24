'use client';
import {useState} from 'react';
import {supabase} from '../../lib/supabase';
export default function ErasureAudit(){const [data,setData]=useState<unknown>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 async function load(){if(!supabase||busy)return;setBusy(true);setError('');try{const r=await supabase.rpc('wedly_admin_erasure_audit');if(r.error)throw r.error;setData(r.data)}catch{setError('Audit indisponibil. Verifică migrarea admin_erasure_audit.sql.')}finally{setBusy(false)}}
 function download(){const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='wedly-erasure-audit.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
 return <section className="panel"><h2>Audit ștergere cont</h2><p>Verifică relațiile bazei de date, coloanele candidate și volumele Storage. Raportul nu conține înregistrările utilizatorilor și nu șterge nimic.</p><button className="button secondary" disabled={busy} onClick={()=>void load()}>Rulează audit</button>{error&&<p role="alert">{error}</p>}{data!==null&&<><button className="button secondary" onClick={download}>Descarcă raport JSON</button><pre style={{maxHeight:360,overflow:'auto',whiteSpace:'pre-wrap'}}>{JSON.stringify(data,null,2)}</pre></>}</section>}
