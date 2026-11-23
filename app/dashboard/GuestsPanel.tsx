'use client';
import {useEffect,useState} from 'react';
import {useStore} from '../../lib/store';
import CheckInPanel from './CheckInPanel';
import RsvpPanel from './RsvpPanel';
import GiftCountingPanel from './GiftCountingPanel';
import {supabase} from '../../lib/supabase';
import type {Guest} from '../../lib/demo';

const groups=['Familie','Prieteni','Colegi','Nași / Părinți spirituali','Altele'];
const statusLabels:Record<Guest['status'],string>={asteptare:'În așteptare',confirmat:'Confirmat',refuzat:'Refuzat'};
type Form={name:string;status:Guest['status'];group:string;partySize:string;phone:string;notes:string};
const empty:Form={name:'',status:'asteptare',group:'Altele',partySize:'1',phone:'',notes:''};
export default function GuestsPanel({quickAdd=0}:{quickAdd?:number}){
 const {data,setData,can,weddingId}=useStore();
 const [rsvpReplies,setRsvpReplies]=useState<Record<string,{status:string;party_size:number;responded_at:string|null;revoked_at:string|null}>>({});
 const [rsvpError,setRsvpError]=useState('');
 const [refreshing,setRefreshing]=useState(false);
 async function refreshRsvp(){if(!supabase||!weddingId)return;setRefreshing(true);const {data:records,error}=await supabase.rpc('rsvp_list',{p_wedding:weddingId});setRefreshing(false);if(error){setRsvpError('Confirmările RSVP nu au putut fi actualizate.');return}setRsvpError('');setRsvpReplies(Object.fromEntries((records||[]).map((r:{guest_id:string;status:string;party_size:number;responded_at:string|null;revoked_at:string|null})=>[r.guest_id,r])))}
 useEffect(()=>{void refreshRsvp()},[weddingId]);
 const effectiveStatus=(g:Guest):Guest['status']=>{const r=rsvpReplies[g.id];return r?.responded_at&&(r.status==='confirmat'||r.status==='refuzat')?r.status as Guest['status']:g.status};
 const effectiveSize=(g:Guest)=>{const r=rsvpReplies[g.id];return r?.responded_at&&r.status==='confirmat'?r.party_size:Math.max(1,Number.isFinite(g.partySize)?g.partySize!:1)};
 const [form,setForm]=useState<Form>(empty);
 const [showForm,setShowForm]=useState(false);
 useEffect(()=>{if(quickAdd){setShowForm(true);const t=setTimeout(()=>document.querySelector('.guest-form')?.scrollIntoView({block:'center',behavior:'smooth'}),100);return()=>clearTimeout(t)}},[quickAdd]);
 const [editing,setEditing]=useState<string|null>(null);
 const [search,setSearch]=useState('');
 const [statusFilter,setStatusFilter]=useState('all');
 const [groupFilter,setGroupFilter]=useState('all');
 const [sort,setSort]=useState('name');
 const [showCheckIn,setShowCheckIn]=useState(false);
 const [showGifts,setShowGifts]=useState(false);
 const [printOrder,setPrintOrder]=useState<'alphabetical'|'seating'>('alphabetical');
 if(!can('guests','read'))return <section className="panel"><p>Nu ai acces la invitați.</p></section>;
 const writable=can('guests','write');
 const guests=data.guests;
 const size=effectiveSize;
 const totalPeople=guests.reduce((sum,g)=>sum+size(g),0);
 const confirmedPeople=guests.filter(g=>effectiveStatus(g)==='confirmat').reduce((sum,g)=>sum+size(g),0);
 const pendingPeople=guests.filter(g=>effectiveStatus(g)==='asteptare').reduce((sum,g)=>sum+size(g),0);
 const filtered=guests.filter(g=>(statusFilter==='all'||effectiveStatus(g)===statusFilter)&&(groupFilter==='all'||(g.group||'Altele')===groupFilter)&&[g.name,g.phone||''].some(v=>v.toLocaleLowerCase('ro').includes(search.toLocaleLowerCase('ro')))).sort((a,b)=>sort==='size'?size(b)-size(a):sort==='status'?effectiveStatus(a).localeCompare(effectiveStatus(b)):a.name.localeCompare(b.name,'ro'));
 const printList=()=>{const tables=data.wedding.seatingTables||[];const names=new Map<string,string>();tables.forEach(t=>t.guestIds.forEach(id=>names.set(id,t.name)));const collator=new Intl.Collator('ro',{sensitivity:'base',numeric:true});const ordered=[...guests].sort((a,b)=>printOrder==='alphabetical'?collator.compare(a.name,b.name):((names.has(a.id)?0:1)-(names.has(b.id)?0:1)||collator.compare(names.get(a.id)||'',names.get(b.id)||'')||collator.compare(a.name,b.name)));const escapeHtml=(value:string)=>value.replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]||ch));const title=printOrder==='alphabetical'?'Lista invitaților — ordine alfabetică':'Lista invitaților — așezare la mese';const event=[data.wedding.first,data.wedding.second].filter(Boolean).join(' & ');const rows=ordered.map((g,i)=>'<tr><td>'+(i+1)+'</td><td>'+escapeHtml(g.name)+'</td><td>'+effectiveSize(g)+'</td><td>'+escapeHtml(names.get(g.id)||'Nealocat')+'</td><td>'+escapeHtml(statusLabels[effectiveStatus(g)])+'</td></tr>').join('');const people=ordered.reduce((sum,g)=>sum+effectiveSize(g),0);const brandHeader='<div style="display:flex;align-items:center;justify-content:space-between;gap:16px;border-bottom:1px solid #e8dce5;padding-bottom:14px;margin-bottom:20px"><img src="'+window.location.origin+'/brand/wedly-logo.svg" alt="WEDLY" style="width:210px;max-width:60%;height:auto"><span style="font:10px Arial,sans-serif;color:#8B617B">DOCUMENT ADMINISTRATIV</span></div>';const page=window.open('','_blank');if(!page){window.alert('Browserul a blocat fereastra de imprimare. Permite ferestrele pop-up pentru WEDLY.');return}page.document.open();page.document.write('<!doctype html><html lang="ro"><head><meta charset="utf-8"><title>'+escapeHtml(title)+'</title><style>@page{size:A4;margin:14mm}body{font:12px Arial,sans-serif;color:#222}h1{font-size:21px;margin:0 0 6px}p{color:#555;margin:0 0 15px}table{width:100%;border-collapse:collapse}th,td{padding:8px 7px;border-bottom:1px solid #ddd;text-align:left}th{background:#eee;font-size:11px}tr{break-inside:avoid}thead{display:table-header-group}.summary{margin-top:12px;font-weight:bold}.print-action{margin-bottom:20px}@media print{.print-action{display:none}}@media screen{body{max-width:900px;margin:30px auto;padding:0 20px}}</style></head><body><div class="print-action"><button onclick="window.print()">Printează / Salvează PDF</button></div>'+brandHeader+'<h1>'+escapeHtml(title)+'</h1><p>'+escapeHtml(event)+' · '+escapeHtml(data.wedding.city)+' · '+escapeHtml(data.wedding.date)+'</p><table><thead><tr><th>Nr.</th><th>Nume / familie</th><th>Persoane</th><th>Masă</th><th>Confirmare</th></tr></thead><tbody>'+rows+'</tbody></table><p class="summary">Total: '+ordered.length+' invitați / grupuri · '+people+' persoane</p></body></html>');page.document.close();page.focus();};
 const change=(key:keyof Form,value:string)=>setForm(f=>({...f,[key]:value}));
 const reset=()=>{setForm(empty);setEditing(null);setShowForm(false)};
 const edit=(g:Guest)=>{setShowForm(true);setEditing(g.id);setForm({name:g.name,status:g.status,group:g.group||'Altele',partySize:String(size(g)),phone:g.phone||'',notes:g.notes||''})};
 const save=(event:React.FormEvent)=>{event.preventDefault();if(!writable)return;const count=Number(form.partySize);if(!form.name.trim()||!Number.isInteger(count)||count<1||count>100)return;
 const existing=editing?data.guests.find(g=>g.id===editing):undefined;
 const next:Guest={...existing,id:editing||crypto.randomUUID(),name:form.name.trim().slice(0,160),status:form.status,group:form.group,partySize:count,phone:form.phone.trim().slice(0,60)||undefined,email:undefined,notes:form.notes.trim().slice(0,500)||undefined};
 setData(d=>({...d,guests:editing?d.guests.map(g=>g.id===editing?next:g):[...d.guests,next]}));reset();
 };
 return <><section className="panel"><div className="guest-page-title"><div><h2>Invitați</h2><p>Persoane, confirmări și distribuirea invitațiilor — totul într-o singură listă.</p></div><div className="row-controls">{writable&&<button type="button" className="button" onClick={()=>{reset();setShowForm(true)}}>+ Adaugă invitat</button>}<button className="button secondary" type="button" disabled={refreshing} onClick={()=>void refreshRsvp()}>{refreshing?"Se actualizează...":"Actualizează"}</button></div></div>{rsvpError&&<p role="status">{rsvpError}</p>}
 <div className="gift-module-toggle"><button type="button" className="button secondary" onClick={()=>setShowCheckIn(v=>!v)}>{showCheckIn?"Închide check-in":"Check-in prin QR"}</button></div>{showCheckIn&&<CheckInPanel key={weddingId}/>}<div className="gift-module-toggle"><button type="button" className="button secondary" aria-expanded={showGifts} onClick={()=>setShowGifts(v=>!v)}>{showGifts?'Închide numărarea darului':'💶 Numărarea darului (lei / euro)'}</button></div>{showGifts&&<GiftCountingPanel/>}
 <div className="stats"><article><span>Invitații / grupuri</span><strong>{guests.length}</strong></article><article><span>Persoane estimate</span><strong>{totalPeople}</strong></article><article><span>Persoane confirmate</span><strong>{confirmedPeople}</strong></article><article><span>În așteptare</span><strong>{pendingPeople}</strong></article></div>
 <div className="task-filters"><label>Caută<input placeholder="Nume, telefon" value={search} onChange={e=>setSearch(e.target.value)}/></label><label>Status<select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}><option value="all">Toate</option>{Object.entries(statusLabels).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label><label>Grup<select value={groupFilter} onChange={e=>setGroupFilter(e.target.value)}><option value="all">Toate grupurile</option>{groups.map(g=><option key={g}>{g}</option>)}</select></label><label>Sortare<select value={sort} onChange={e=>setSort(e.target.value)}><option value="name">Nume</option><option value="size">Număr persoane</option><option value="status">Status</option></select></label></div>
 <div className="guest-print-toolbar"><label>Listă pentru imprimare<select value={printOrder} onChange={e=>setPrintOrder(e.target.value as 'alphabetical'|'seating')}><option value="alphabetical">Ordine alfabetică</option><option value="seating">Ordinea meselor</option></select></label><button type="button" className="button secondary" disabled={guests.length===0} onClick={printList}>Printează / Salvează PDF</button><small className="hint">Se exportă lista completă, indiferent de filtre. În fereastra de imprimare poți alege „Salvare ca PDF”.</small></div>
 {filtered.length===0&&<p>Nu există invitați pentru filtrele selectate.</p>}
 <RsvpPanel guests={filtered} effectiveStatus={effectiveStatus} effectiveSize={effectiveSize} onEdit={g=>{edit(g);requestAnimationFrame(()=>document.getElementById('guest-edit-form')?.scrollIntoView({behavior:'smooth',block:'center'}))}} onDelete={g=>{if(window.confirm('Ștergi invitatul „'+g.name+'”?')){setData(d=>({...d,guests:d.guests.filter(x=>x.id!==g.id)}));if(editing===g.id)reset()}}}/>

 {writable&&showForm&&<form id="guest-edit-form" className="guest-form" onSubmit={save}><h3>{editing?'Editează invitat':'Adaugă invitat'}</h3><div className="two"><label>Nume / familie<input required maxLength={160} value={form.name} onChange={e=>change('name',e.target.value)}/></label><label>Grup<select value={form.group} onChange={e=>change('group',e.target.value)}>{groups.map(g=><option key={g}>{g}</option>)}</select></label><label>Număr persoane<input type="number" required min="1" max="100" step="1" value={form.partySize} onChange={e=>change('partySize',e.target.value)}/></label><label>Răspuns<select value={form.status} onChange={e=>change('status',e.target.value as Guest['status'])}>{Object.entries(statusLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label><label>Telefon<input type="tel" maxLength={60} value={form.phone} onChange={e=>change('phone',e.target.value)}/></label></div><label>Note<input maxLength={500} value={form.notes} onChange={e=>change('notes',e.target.value)}/></label><div className="actions"><button className="button" type="submit">{editing?'Salvează modificările':'Adaugă invitat'}</button><button className="button secondary" type="button" onClick={reset}>Anulează</button></div></form>}
 <p className="hint">Pentru invitații care au răspuns online, statusul și numărul de persoane confirmate sunt preluate din RSVP. Modificările manuale nu înlocuiesc un răspuns online. Pentru fiecare invitat, folosește butonul «Invită / RSVP» din dreptul numelui.</p>
 </section></>;
}
