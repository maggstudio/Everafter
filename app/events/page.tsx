'use client';
import Link from 'next/link';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {useStore} from '../../lib/store';
import {supabase} from '../../lib/supabase';
export default function EventsPage(){
 const {events,ready,saveStatus}=useStore();const router=useRouter();
 const [type,setType]=useState<'wedding'|'baptism'>('wedding');
 const [first,setFirst]=useState(''),[second,setSecond]=useState(''),[date,setDate]=useState(''),[city,setCity]=useState('');
 const [child,setChild]=useState(''),[godparents,setGodparents]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 async function create(e:React.FormEvent){e.preventDefault();if(!supabase||busy)return;setBusy(true);setError('');
  const {data,error:rpcError}=await supabase.rpc('create_my_event',{p_type:type,p_first:first.trim(),p_second:second.trim(),p_date:date,p_city:city.trim(),p_child_name:type==='baptism'?child.trim():'',p_godparents:type==='baptism'?godparents.trim():''});
  if(rpcError||!data){setError(rpcError?.message||'Nu am putut crea evenimentul. Verifică migrarea v08.sql.');setBusy(false);return}
  window.location.href='/dashboard?wedding='+encodeURIComponent(data);
 }
 return <main className="shell narrow"><Link href="/dashboard" className="brand">WEDLY ✦</Link>
 <div className="panel"><span className="eyebrow">SPAȚIILE TALE</span><h1>Evenimentele mele</h1>
 {!ready?<p>{saveStatus}</p>:events.length===0?<p>Nu ai încă evenimente accesibile.</p>:<div>{events.map(event=><div className="list-row" key={event.id}><div><b>{event.name}</b><div><small>{event.type==='baptism'?'Botez':'Nuntă'} · {event.city||'Oraș nespecificat'} · {event.date||'Fără dată'} · {event.role==='owner'?'Organizator':'Colaborator'}</small></div></div><Link className="button" href={'/dashboard?wedding='+encodeURIComponent(event.id)}>Deschide</Link></div>)}</div>}
 </div><div className="panel"><h2>Creează un eveniment nou</h2><p>Fiecare eveniment are invitați, buget, sarcini și colaboratori separați.</p>
 <form onSubmit={create}><label>Tip eveniment<select value={type} onChange={e=>setType(e.target.value as 'wedding'|'baptism')}><option value="wedding">Nuntă</option><option value="baptism">Botez</option></select></label>
 <div className="two"><label>{type==='baptism'?'Primul părinte':'Primul partener'}<input required maxLength={100} value={first} onChange={e=>setFirst(e.target.value)}/></label>
 <label>{type==='baptism'?'Al doilea părinte':'Al doilea partener'}<input required maxLength={100} value={second} onChange={e=>setSecond(e.target.value)}/></label>
 {type==='baptism'&&<><label>Numele copilului<input required maxLength={100} value={child} onChange={e=>setChild(e.target.value)}/></label><label>Nașii copilului<input maxLength={200} value={godparents} onChange={e=>setGodparents(e.target.value)}/></label></>}
 <label>Data evenimentului<input type="date" required value={date} onChange={e=>setDate(e.target.value)}/></label><label>Oraș<input required maxLength={120} value={city} onChange={e=>setCity(e.target.value)}/></label></div>
 {error&&<p role="alert" style={{color:'crimson'}}>{error}</p>}
 <button className="button full" disabled={busy}>{busy?'Se creează...':'Creează eveniment'}</button></form></div></main>
}
