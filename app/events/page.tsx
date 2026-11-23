'use client';
import SmartHomeLogo from '../components/SmartHomeLogo';
import AuthLoading from '../components/AuthLoading';
import Link from 'next/link';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {useStore} from '../../lib/store';
import {supabase} from '../../lib/supabase';
export default function EventsPage(){
 const {events,ready,saveStatus,selectEvent,refresh}=useStore();const router=useRouter();
 const [deleting,setDeleting]=useState<string|null>(null),[deleteConfirm,setDeleteConfirm]=useState(''),[deleteBusy,setDeleteBusy]=useState(false);
 const [type,setType]=useState<'wedding'|'baptism'>('wedding');const [createOpen,setCreateOpen]=useState(false);
 const [first,setFirst]=useState(''),[second,setSecond]=useState(''),[date,setDate]=useState(''),[city,setCity]=useState('');
 const [child,setChild]=useState(''),[godparents,setGodparents]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[opening,setOpening]=useState<string|null>(null);
 async function openEvent(id:string){
  if(opening)return;
  setOpening(id);setError('');
  try{
   const ok=await selectEvent(id);
   if(ok)router.push('/dashboard?wedding='+encodeURIComponent(id));
   else setError('Nu am putut schimba evenimentul. Verifică mesajul de sincronizare și încearcă din nou.');
  }catch{setError('A apărut o eroare la încărcarea evenimentului.');}
  finally{setOpening(null)}
 }
 async function deleteEvent(){if(!supabase||!deleting||deleteConfirm!=='STERGE DEFINITIV'||deleteBusy)return;
  const event=events.find(x=>x.id===deleting);if(!event||event.role!=='owner')return;
  setDeleteBusy(true);setError('');
  try{const {data:{session}}=await supabase.auth.getSession();if(!session)throw new Error('Autentificare necesară.');
   const response=await fetch('/api/events/delete',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+session.access_token},body:JSON.stringify({weddingId:deleting,confirmation:deleteConfirm})});
   const result=await response.json();if(!response.ok)throw new Error(result.error||'Ștergerea a eșuat.');
   setDeleting(null);setDeleteConfirm('');await refresh();
   if(result.storageWarning)setError('Evenimentul a fost șters, dar unele fotografii nu au putut fi eliminate din stocare. Contactează suportul.');
  }catch(e){setError(e instanceof Error?e.message:'Eroare la ștergere.');}finally{setDeleteBusy(false)}
 }
 async function create(e:React.FormEvent){e.preventDefault();if(!supabase||busy)return;setBusy(true);setError('');
  const {data,error:rpcError}=await supabase.rpc('create_my_event',{p_type:type,p_first:first.trim(),p_second:second.trim(),p_date:date,p_city:city.trim(),p_child_name:type==='baptism'?child.trim():'',p_godparents:type==='baptism'?godparents.trim():''});
  if(rpcError||!data){setError(rpcError?.message||'Nu am putut crea evenimentul. Verifică migrarea v08.sql.');setBusy(false);return}
  try{sessionStorage.setItem('wedly-discover-new-event',String(data))}catch{};
  window.location.href='/dashboard?wedding='+encodeURIComponent(data);
 }
 if(!ready)return <AuthLoading message={saveStatus}/>;
 return <main className="shell narrow"><SmartHomeLogo/>
 <div className="panel"><span className="eyebrow">SPAȚIILE TALE</span><h1>Evenimentele mele</h1>{error&&<p role="alert" style={{color:"crimson"}}>{error}</p>}
 {events.length===0?<p>Nu ai încă evenimente accesibile.</p>:<div>{events.map(event=><div className="list-row" key={event.id}><div><b>{event.name}</b><div><small>{event.type==='baptism'?'Botez':'Nuntă'} · {event.city||'Oraș nespecificat'} · {event.date||'Fără dată'} · {event.role==='owner'?'Organizator':'Colaborator'}</small></div></div><div className="row-controls"><button type="button" className="button" disabled={Boolean(opening)||deleteBusy} onClick={()=>void openEvent(event.id)}>{opening===event.id?'Se deschide...':'Deschide'}</button>{event.role==='owner'&&<button type="button" className="button secondary" disabled={deleteBusy||Boolean(opening)} onClick={()=>{setDeleting(event.id);setDeleteConfirm('');setError('')}}>Șterge</button>}</div></div>)}</div>}
 {deleting&&<div className="event-delete-overlay" role="presentation"><section className="event-delete-dialog" role="dialog" aria-modal="true" aria-labelledby="event-delete-title"><h2 id="event-delete-title">Ștergi definitiv evenimentul?</h2><p><strong>{events.find(e=>e.id===deleting)?.name}</strong></p><p><strong>Atenție: această acțiune este ireversibilă.</strong> Vor fi șterse definitiv toate datele asociate evenimentului: invitați, răspunsuri RSVP, invitații digitale, fotografii, bugete, cheltuieli, sarcini, furnizori, programări, echipă și celelalte informații salvate. Linkurile invitaților nu vor mai funcționa.</p><p>Confirmă că înțelegi pierderea definitivă a datelor introducând <strong>STERGE DEFINITIV</strong>:</p><label>Confirmare ștergere<input autoFocus autoComplete="off" value={deleteConfirm} onChange={e=>setDeleteConfirm(e.target.value)} placeholder="STERGE DEFINITIV" disabled={deleteBusy}/></label><div className="row-controls"><button type="button" className="button secondary" disabled={deleteBusy} onClick={()=>{setDeleting(null);setDeleteConfirm('')}}>Anulează, păstrează evenimentul</button><button type="button" className="button event-delete-danger" disabled={deleteBusy||deleteConfirm!=='STERGE DEFINITIV'} onClick={()=>void deleteEvent()}>{deleteBusy?'Se șterge...':'Da, șterge definitiv toate datele'}</button></div></section></div>}
 </div><div className="panel"><div className="christmas-offer"><strong>🎄 Cadou de Crăciun pentru nunțile din 2027</strong><p>Pachetele WEDLY sunt gratuite în perioada de lansare. Premium: <del>149 lei</del> <b>0 lei</b> · Luxury: <del>299 lei</del> <b>0 lei</b>. Sumele tăiate sunt prețuri de listă orientative.</p></div><h2>Începe un eveniment nou</h2><p>Completează câteva detalii de bază. Restul le poți adăuga ulterior.</p>{!createOpen&&<button type="button" className="button" onClick={()=>setCreateOpen(true)}>+ Creează eveniment</button>}{createOpen&&<>
 <form onSubmit={create}><label>Tip eveniment<select value={type} onChange={e=>setType(e.target.value as 'wedding'|'baptism')}><option value="wedding">Nuntă</option><option value="baptism">Botez</option></select></label>
 <div className="two"><label>{type==='baptism'?'Primul părinte':'Primul partener'}<input required maxLength={100} value={first} onChange={e=>setFirst(e.target.value)}/></label>
 <label>{type==='baptism'?'Al doilea părinte':'Al doilea partener'}<input required maxLength={100} value={second} onChange={e=>setSecond(e.target.value)}/></label>
 {type==='baptism'&&<><label>Numele copilului<input required maxLength={100} value={child} onChange={e=>setChild(e.target.value)}/></label><label>Nașii copilului<input maxLength={200} value={godparents} onChange={e=>setGodparents(e.target.value)}/></label></>}
 <label>Data evenimentului<input type="date" required value={date} onChange={e=>setDate(e.target.value)}/></label><label>Oraș<input required maxLength={120} value={city} onChange={e=>setCity(e.target.value)}/></label></div>

 <button className="button full" disabled={busy}>{busy?'Se creează...':'Creează eveniment'}</button></form><button type="button" className="text-button" onClick={()=>setCreateOpen(false)}>Anulează</button></>}</div></main>
}
