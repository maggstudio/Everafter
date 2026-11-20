'use client';
import {useEffect,useState} from 'react';
import {useStore} from '../../lib/store';
import RsvpPanel from './RsvpPanel';
import {supabase} from '../../lib/supabase';
import type {Guest} from '../../lib/demo';

const groups=['Familie','Prieteni','Colegi','Nași / Părinți spirituali','Altele'];
const statusLabels:Record<Guest['status'],string>={asteptare:'În așteptare',confirmat:'Confirmat',refuzat:'Refuzat'};
type Form={name:string;status:Guest['status'];group:string;partySize:string;phone:string;email:string;notes:string};
const empty:Form={name:'',status:'asteptare',group:'Altele',partySize:'1',phone:'',email:'',notes:''};
export default function GuestsPanel(){
 const {data,setData,can,weddingId}=useStore();
 const [rsvpReplies,setRsvpReplies]=useState<Record<string,{status:string;party_size:number;responded_at:string|null;revoked_at:string|null}>>({});
 const [rsvpError,setRsvpError]=useState('');
 const [refreshing,setRefreshing]=useState(false);
 async function refreshRsvp(){if(!supabase||!weddingId)return;setRefreshing(true);const {data:records,error}=await supabase.rpc('rsvp_list',{p_wedding:weddingId});setRefreshing(false);if(error){setRsvpError('Confirmările RSVP nu au putut fi actualizate.');return}setRsvpError('');setRsvpReplies(Object.fromEntries((records||[]).map((r:{guest_id:string;status:string;party_size:number;responded_at:string|null;revoked_at:string|null})=>[r.guest_id,r])))}
 useEffect(()=>{void refreshRsvp()},[weddingId]);
 const effectiveStatus=(g:Guest):Guest['status']=>{const r=rsvpReplies[g.id];return r?.responded_at&&!r.revoked_at&&(r.status==='confirmat'||r.status==='refuzat')?r.status as Guest['status']:g.status};
 const effectiveSize=(g:Guest)=>{const r=rsvpReplies[g.id];return r?.responded_at&&!r.revoked_at&&r.status==='confirmat'?r.party_size:Math.max(1,Number.isFinite(g.partySize)?g.partySize!:1)};
 const [form,setForm]=useState<Form>(empty);
 const [showForm,setShowForm]=useState(false);
 const [editing,setEditing]=useState<string|null>(null);
 const [search,setSearch]=useState('');
 const [statusFilter,setStatusFilter]=useState('all');
 const [groupFilter,setGroupFilter]=useState('all');
 const [sort,setSort]=useState('name');
 if(!can('guests','read'))return <section className="panel"><p>Nu ai acces la invitați.</p></section>;
 const writable=can('guests','write');
 const guests=data.guests;
 const size=effectiveSize;
 const totalPeople=guests.reduce((sum,g)=>sum+size(g),0);
 const confirmedPeople=guests.filter(g=>effectiveStatus(g)==='confirmat').reduce((sum,g)=>sum+size(g),0);
 const pendingPeople=guests.filter(g=>effectiveStatus(g)==='asteptare').reduce((sum,g)=>sum+size(g),0);
 const filtered=guests.filter(g=>(statusFilter==='all'||effectiveStatus(g)===statusFilter)&&(groupFilter==='all'||(g.group||'Altele')===groupFilter)&&[g.name,g.phone||'',g.email||''].some(v=>v.toLocaleLowerCase('ro').includes(search.toLocaleLowerCase('ro')))).sort((a,b)=>sort==='size'?size(b)-size(a):sort==='status'?effectiveStatus(a).localeCompare(effectiveStatus(b)):a.name.localeCompare(b.name,'ro'));
 const change=(key:keyof Form,value:string)=>setForm(f=>({...f,[key]:value}));
 const reset=()=>{setForm(empty);setEditing(null);setShowForm(false)};
 const edit=(g:Guest)=>{setShowForm(true);setEditing(g.id);setForm({name:g.name,status:g.status,group:g.group||'Altele',partySize:String(size(g)),phone:g.phone||'',email:g.email||'',notes:g.notes||''})};
 const save=(event:React.FormEvent)=>{event.preventDefault();if(!writable)return;const count=Number(form.partySize);if(!form.name.trim()||!Number.isInteger(count)||count<1||count>100)return;
 const next:Guest={id:editing||crypto.randomUUID(),name:form.name.trim().slice(0,160),status:form.status,group:form.group,partySize:count,phone:form.phone.trim().slice(0,60)||undefined,email:form.email.trim().slice(0,180)||undefined,notes:form.notes.trim().slice(0,500)||undefined};
 setData(d=>({...d,guests:editing?d.guests.map(g=>g.id===editing?next:g):[...d.guests,next]}));reset();
 };
 return <><section className="panel"><div className="guest-page-title"><div><h2>Invitați</h2><p>Persoane, confirmări și emailuri — totul într-o singură listă.</p></div><div className="row-controls">{writable&&<button type="button" className="button" onClick={()=>{reset();setShowForm(true)}}>+ Adaugă invitat</button>}<button className="button secondary" type="button" disabled={refreshing} onClick={()=>void refreshRsvp()}>{refreshing?"Se actualizează...":"Actualizează"}</button></div></div>{rsvpError&&<p role="status">{rsvpError}</p>}
 <div className="stats"><article><span>Invitații / grupuri</span><strong>{guests.length}</strong></article><article><span>Persoane estimate</span><strong>{totalPeople}</strong></article><article><span>Persoane confirmate</span><strong>{confirmedPeople}</strong></article><article><span>În așteptare</span><strong>{pendingPeople}</strong></article></div>
 <div className="task-filters"><label>Caută<input placeholder="Nume, telefon, email" value={search} onChange={e=>setSearch(e.target.value)}/></label><label>Status<select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}><option value="all">Toate</option>{Object.entries(statusLabels).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label><label>Grup<select value={groupFilter} onChange={e=>setGroupFilter(e.target.value)}><option value="all">Toate grupurile</option>{groups.map(g=><option key={g}>{g}</option>)}</select></label><label>Sortare<select value={sort} onChange={e=>setSort(e.target.value)}><option value="name">Nume</option><option value="size">Număr persoane</option><option value="status">Status</option></select></label></div>
 {filtered.length===0&&<p>Nu există invitați pentru filtrele selectate.</p>}
 <RsvpPanel guests={filtered} renderGuest={g=><div className="list-row"><div><strong>{g.name}</strong><small>{g.group||'Altele'} · {size(g)} {size(g)===1?'persoană':'persoane'} · {statusLabels[effectiveStatus(g)]}{rsvpReplies[g.id]?.responded_at&&!rsvpReplies[g.id]?.revoked_at?' · Răspuns RSVP online':''}</small>{(g.phone||g.email)&&<small>{[g.phone,g.email].filter(Boolean).join(' · ')}</small>}{g.notes&&<p className="hint">{g.notes}</p>}</div><div className="guest-actions">{writable&&<><select aria-label={'Status '+g.name} value={g.status} onChange={e=>setData(d=>({...d,guests:d.guests.map(x=>x.id===g.id?{...x,status:e.target.value as Guest['status']}:x)}))}>{Object.entries(statusLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select><div className="row-controls"><button className="text-button" type="button" onClick={()=>edit(g)}>Editează</button><button className="remove" type="button" aria-label={'Șterge '+g.name} onClick={()=>{if(window.confirm('Ștergi invitatul „'+g.name+'”?')){setData(d=>({...d,guests:d.guests.filter(x=>x.id!==g.id)}));if(editing===g.id)reset()}}}>×</button></div></>}</div></div>}/>

 {writable&&showForm&&<form className="guest-form" onSubmit={save}><h3>{editing?'Editează invitat':'Adaugă invitat'}</h3><div className="two"><label>Nume / familie<input required maxLength={160} value={form.name} onChange={e=>change('name',e.target.value)}/></label><label>Grup<select value={form.group} onChange={e=>change('group',e.target.value)}>{groups.map(g=><option key={g}>{g}</option>)}</select></label><label>Număr persoane<input type="number" required min="1" max="100" step="1" value={form.partySize} onChange={e=>change('partySize',e.target.value)}/></label><label>Răspuns<select value={form.status} onChange={e=>change('status',e.target.value as Guest['status'])}>{Object.entries(statusLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label><label>Telefon<input type="tel" maxLength={60} value={form.phone} onChange={e=>change('phone',e.target.value)}/></label><label>Email<input type="email" maxLength={180} value={form.email} onChange={e=>change('email',e.target.value)}/></label></div><label>Note<input maxLength={500} value={form.notes} onChange={e=>change('notes',e.target.value)}/></label><div className="actions"><button className="button" type="submit">{editing?'Salvează modificările':'Adaugă invitat'}</button><button className="button secondary" type="button" onClick={reset}>Anulează</button></div></form>}
 <p className="hint">Pentru invitații care au răspuns online, statusul și numărul de persoane confirmate sunt preluate din RSVP. Modificările manuale nu înlocuiesc un răspuns online. Pentru fiecare invitat, folosește butonul «RSVP și email» din dreptul numelui.</p>
 </section></>;
}
