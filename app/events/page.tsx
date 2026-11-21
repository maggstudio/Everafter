'use client';
import AuthLoading from '../components/AuthLoading';
import Link from 'next/link';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {useStore} from '../../lib/store';
import {supabase} from '../../lib/supabase';
export default function EventsPage(){
 const {events,ready,saveStatus,selectEvent}=useStore();const router=useRouter();
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
 async function create(e:React.FormEvent){e.preventDefault();if(!supabase||busy)return;setBusy(true);setError('');
  const {data,error:rpcError}=await supabase.rpc('create_my_event',{p_type:type,p_first:first.trim(),p_second:second.trim(),p_date:date,p_city:city.trim(),p_child_name:type==='baptism'?child.trim():'',p_godparents:type==='baptism'?godparents.trim():''});
  if(rpcError||!data){setError(rpcError?.message||'Nu am putut crea evenimentul. Verifică migrarea v08.sql.');setBusy(false);return}
  window.location.href='/dashboard?wedding='+encodeURIComponent(data);
 }
 if(!ready)return <AuthLoading message={saveStatus}/>;
 return <main className="shell narrow"><Link href="/dashboard" className="brand">WEDLY ✦</Link>
 <div className="panel"><span className="eyebrow">SPAȚIILE TALE</span><h1>Evenimentele mele</h1>{error&&<p role="alert" style={{color:"crimson"}}>{error}</p>}
 {events.length===0?<p>Nu ai încă evenimente accesibile.</p>:<div>{events.map(event=><div className="list-row" key={event.id}><div><b>{event.name}</b><div><small>{event.type==='baptism'?'Botez':'Nuntă'} · {event.city||'Oraș nespecificat'} · {event.date||'Fără dată'} · {event.role==='owner'?'Organizator':'Colaborator'}</small></div></div><button type="button" className="button" disabled={Boolean(opening)} onClick={()=>void openEvent(event.id)}>{opening===event.id?'Se deschide...':'Deschide'}</button></div>)}</div>}
 </div><div className="panel"><h2>Începe un eveniment nou</h2><p>Completează câteva detalii de bază. Restul le poți adăuga ulterior.</p>{!createOpen&&<button type="button" className="button" onClick={()=>setCreateOpen(true)}>+ Creează eveniment</button>}{createOpen&&<>
 <form onSubmit={create}><label>Tip eveniment<select value={type} onChange={e=>setType(e.target.value as 'wedding'|'baptism')}><option value="wedding">Nuntă</option><option value="baptism">Botez</option></select></label>
 <div className="two"><label>{type==='baptism'?'Primul părinte':'Primul partener'}<input required maxLength={100} value={first} onChange={e=>setFirst(e.target.value)}/></label>
 <label>{type==='baptism'?'Al doilea părinte':'Al doilea partener'}<input required maxLength={100} value={second} onChange={e=>setSecond(e.target.value)}/></label>
 {type==='baptism'&&<><label>Numele copilului<input required maxLength={100} value={child} onChange={e=>setChild(e.target.value)}/></label><label>Nașii copilului<input maxLength={200} value={godparents} onChange={e=>setGodparents(e.target.value)}/></label></>}
 <label>Data evenimentului<input type="date" required value={date} onChange={e=>setDate(e.target.value)}/></label><label>Oraș<input required maxLength={120} value={city} onChange={e=>setCity(e.target.value)}/></label></div>

 <button className="button full" disabled={busy}>{busy?'Se creează...':'Creează eveniment'}</button></form><button type="button" className="text-button" onClick={()=>setCreateOpen(false)}>Anulează</button></>}</div></main>
}
