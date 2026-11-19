'use client';
import {useState} from 'react';
import {useStore} from '../../lib/store';
import RoomPlan from './RoomPlan';
import type {Guest,SeatingTable} from '../../lib/demo';

const count=(g:Guest)=>Number.isInteger(g.partySize)&&g.partySize!>0?g.partySize!:1;
export default function SeatingPanel(){
 const {data,setData,can}=useStore();
 const [name,setName]=useState('');
 const [capacity,setCapacity]=useState('10');
 const [error,setError]=useState('');
 const [includePending,setIncludePending]=useState(true);
 if(!can('guests','read')||!can('wedding','read'))return <section className="panel"><p>Nu ai acces la planificarea meselor.</p></section>;
 const writable=can('wedding','write');
 const tables=data.wedding.seatingTables||[];
 const guests=data.guests;
 const eligible=guests.filter(g=>g.status!=='refuzat'&&(includePending||g.status==='confirmat'));
 const guestById=new Map(guests.map(g=>[g.id,g]));
 const assignedIds=new Set(tables.flatMap(t=>t.guestIds));
 const occupied=(t:SeatingTable)=>t.guestIds.reduce((sum,id)=>sum+(guestById.has(id)?count(guestById.get(id)!):0),0);
 const allocated=eligible.filter(g=>assignedIds.has(g.id)).reduce((sum,g)=>sum+count(g),0);
 const total=eligible.reduce((sum,g)=>sum+count(g),0);
 const update=(next:SeatingTable[])=>setData(d=>({...d,wedding:{...d.wedding,seatingTables:next}}));
 const add=(event:React.FormEvent)=>{event.preventDefault();setError('');const seats=Number(capacity);if(!name.trim()||!Number.isInteger(seats)||seats<1||seats>1000){setError('Completează numele și o capacitate între 1 și 1000.');return}if(tables.some(t=>t.name.toLocaleLowerCase('ro')===name.trim().toLocaleLowerCase('ro'))){setError('Există deja o masă cu acest nume.');return}update([...tables,{id:crypto.randomUUID(),name:name.trim().slice(0,80),capacity:seats,guestIds:[]}]);setName('')};
 const move=(guestId:string,destination:string)=>{if(!writable)return;setError('');const guest=guestById.get(guestId);if(!guest||guest.status==='refuzat'){setError('Invitatul nu este disponibil pentru alocare.');return}const target=tables.find(t=>t.id===destination);if(target&&occupied(target)+count(guest)>target.capacity&&!target.guestIds.includes(guestId)){setError('Masa '+target.name+' nu are suficiente locuri pentru întregul grup.');return}update(tables.map(t=>({...t,guestIds:destination===t.id?[...t.guestIds.filter(id=>id!==guestId),guestId]:t.guestIds.filter(id=>id!==guestId)})))};
 const rename=(table:SeatingTable)=>{const value=window.prompt('Numele mesei',table.name);if(value===null||!value.trim())return;const next=value.trim().slice(0,80);if(tables.some(t=>t.id!==table.id&&t.name.toLocaleLowerCase('ro')===next.toLocaleLowerCase('ro'))){setError('Numele mesei există deja.');return}update(tables.map(t=>t.id===table.id?{...t,name:next}:t));setError('')};
 const resize=(table:SeatingTable)=>{const value=window.prompt('Numărul de locuri',String(table.capacity));if(value===null)return;const seats=Number(value);if(!Number.isInteger(seats)||seats<occupied(table)||seats>1000||seats<1){setError('Capacitatea trebuie să fie un număr întreg, cel puțin egal cu locurile ocupate.');return}update(tables.map(t=>t.id===table.id?{...t,capacity:seats}:t));setError('')};
 return <section className="panel"><h2>Planificarea meselor</h2><p>Organizează invitații pe mese. Fiecare invitat sau familie ocupă numărul de locuri din lista de invitați.</p>
 <div className="stats"><article><span>Mese</span><strong>{tables.length}</strong></article><article><span>Locuri disponibile</span><strong>{tables.reduce((s,t)=>s+t.capacity,0)}</strong></article><article><span>Persoane alocate</span><strong>{allocated}</strong></article><article><span>Persoane nealocate</span><strong>{total-allocated}</strong></article></div>
 <label className="seating-toggle"><input type="checkbox" checked={includePending} onChange={e=>setIncludePending(e.target.checked)}/> Include invitații în așteptarea confirmării în statistici și în lista de alocare</label>
 {error&&<p className="v09-warning" role="alert">{error}</p>}
 {writable&&<form className="inline-form" onSubmit={add}><input required maxLength={80} value={name} onChange={e=>setName(e.target.value)} placeholder="Ex: Masa 1"/><label>Locuri<input required type="number" min="1" max="1000" step="1" value={capacity} onChange={e=>setCapacity(e.target.value)}/></label><button className="button" type="submit">Adaugă masă</button></form>}
 <RoomPlan/>
 <h3>Invitați nealocați</h3>{eligible.filter(g=>!assignedIds.has(g.id)).length===0?<p>Nu există invitați nealocați în selecția curentă.</p>:eligible.filter(g=>!assignedIds.has(g.id)).map(g=><div className="list-row" key={g.id}><span>{g.name}<small>{count(g)} {count(g)===1?'loc':'locuri'} · {g.status}</small></span>{writable&&<select aria-label={'Alocă '+g.name} value="" onChange={e=>move(g.id,e.target.value)}><option value="">Alege masa</option>{tables.filter(t=>t.capacity-occupied(t)>=count(g)).map(t=><option value={t.id} key={t.id}>{t.name} · {t.capacity-occupied(t)} libere</option>)}</select>}</div>)}
 <div className="seating-grid">{tables.map(t=><article className="seating-table" key={t.id}><div className="seating-heading"><div><h3>{t.name}</h3><small>{occupied(t)} / {t.capacity} locuri ocupate</small></div>{writable&&<div className="row-controls"><button type="button" className="text-button" onClick={()=>rename(t)}>Redenumește</button><button type="button" className="text-button" onClick={()=>resize(t)}>Locuri</button><button type="button" className="remove" aria-label={'Șterge '+t.name} onClick={()=>{if(window.confirm('Ștergi masa „'+t.name+'”? Invitații vor deveni nealocați.'))update(tables.filter(x=>x.id!==t.id))}}>×</button></div>}</div><div className="progress"><span style={{width:Math.min(100,occupied(t)/t.capacity*100)+'%'}}/></div>{t.guestIds.length===0&&<p>Masa este liberă.</p>}{t.guestIds.map(id=>{const g=guestById.get(id);if(!g)return <p className="hint" key={id}>Un invitat șters nu mai există în listă.</p>;return <div className="list-row" key={id}><span>{g.name}<small>{count(g)} {count(g)===1?'loc':'locuri'} · {g.status}</small></span>{writable&&<select aria-label={'Mută '+g.name} value={t.id} onChange={e=>move(id,e.target.value)}><option value={t.id}>{t.name}</option><option value="">Nealocat</option>{tables.filter(other=>other.id!==t.id&&other.capacity-occupied(other)>=count(g)).map(other=><option key={other.id} value={other.id}>{other.name}</option>)}</select>}</div>})}</article>)}</div>
 {tables.length===0&&<p>Adaugă prima masă pentru a începe așezarea invitaților.</p>}
 <p className="hint">Planul este salvat în configurația evenimentului. Modificarea numărului de persoane sau a statusului RSVP poate afecta ulterior ocuparea meselor; verifică planul după actualizarea listei.</p>
 </section>;
}
