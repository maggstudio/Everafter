
'use client';
import Link from 'next/link';
import {useState} from 'react';
import {useStore,type Vendor} from '../../lib/store';
import {money} from '../../lib/demo';
export default function Vendors(){
 const {data,setData,ready,can,saveStatus,weddingId}=useStore();
 const [name,setName]=useState(''),[category,setCategory]=useState('Restaurant'),[contact,setContact]=useState(''),[amount,setAmount]=useState(''),[paid,setPaid]=useState(''),[due,setDue]=useState(''),[notes,setNotes]=useState('');
 const [editing,setEditing]=useState<string|null>(null);
 if(!ready)return <main className="shell narrow"><p>Se încarcă furnizorii...</p></main>;
 if(!can('vendors','read'))return <main className="shell narrow"><Link href="/dashboard">← Dashboard</Link><p>Nu ai permisiune de acces la furnizori. Este necesară permisiunea Buget – citire.</p></main>;
 const writable=can('vendors','write');
 const vendors=data.vendors||[];
 const contracted=vendors.reduce((s,v)=>s+v.contractAmount,0),paidTotal=vendors.reduce((s,v)=>s+v.paidAmount,0);
 const reset=()=>{setName('');setCategory('Restaurant');setContact('');setAmount('');setPaid('');setDue('');setNotes('');setEditing(null)};
 const save=(e:React.FormEvent)=>{e.preventDefault();if(!writable)return;const total=Number(amount),advance=Number(paid||0);if(!name.trim()||!Number.isFinite(total)||total<0||!Number.isFinite(advance)||advance<0||advance>total)return;
 const v:Vendor={id:editing||crypto.randomUUID(),name:name.trim().slice(0,120),category,contact:contact.trim().slice(0,180),contractAmount:total,paidAmount:advance,dueDate:due,notes:notes.trim().slice(0,1000)};
 setData(d=>({...d,vendors:editing?d.vendors.map(x=>x.id===editing?v:x):[...d.vendors,v]}));reset()};
 const edit=(v:Vendor)=>{setEditing(v.id);setName(v.name);setCategory(v.category);setContact(v.contact);setAmount(String(v.contractAmount));setPaid(String(v.paidAmount));setDue(v.dueDate);setNotes(v.notes)};
 return <main className="shell narrow"><Link href="/dashboard">← Înapoi la dashboard</Link><section className="panel"><h1>Furnizori și contracte</h1><p>Furnizorii aparțin exclusiv evenimentului selectat. Accesul este asociat permisiunii Buget.</p><p className="hint">{saveStatus}</p>
 <div className="stats two-stats"><article><span>Contractat</span><strong>{money(contracted)}</strong></article><article><span>Plătit / Rămas</span><strong>{money(paidTotal)} / {money(contracted-paidTotal)}</strong></article></div>
 <p className="hint">Valorile de aici sunt evidență contractuală separată și NU sunt adăugate automat în Buget. Înregistrează plățile efective în Buget doar o dată.</p>
 {vendors.length===0?<p>Nu există furnizori pentru acest eveniment.</p>:vendors.map(v=><div className="list-row" key={v.id}><div><strong>{v.name}</strong><br/><small>{v.category} · {v.contact||'Fără contact'}{v.dueDate?' · Scadență '+v.dueDate:''}</small>{v.notes&&<p className="hint">{v.notes}</p>}</div><div style={{textAlign:'right'}}><strong>{money(v.contractAmount)}</strong><br/><small>Plătit {money(v.paidAmount)} · Rest {money(v.contractAmount-v.paidAmount)}</small>{writable&&<div><button className="text-button" onClick={()=>edit(v)}>Editează</button> <button className="remove" aria-label={'Șterge '+v.name} onClick={()=>{if(window.confirm('Ștergi furnizorul '+v.name+'?'))setData(d=>({...d,vendors:d.vendors.filter(x=>x.id!==v.id)}))}}>×</button></div>}</div></div>)}
 {writable&&<form onSubmit={save}><h2>{editing?'Modifică furnizor':'Adaugă furnizor'}</h2><div className="two"><label>Nume furnizor<input required maxLength={120} value={name} onChange={e=>setName(e.target.value)}/></label><label>Categorie<select value={category} onChange={e=>setCategory(e.target.value)}>{['Restaurant','Foto / Video','Muzică / DJ','Flori / Decor','Tort / Candy bar','Ținute','Transport','Altele'].map(c=><option key={c}>{c}</option>)}</select></label><label>Contact<input maxLength={180} value={contact} onChange={e=>setContact(e.target.value)} placeholder="Email sau telefon"/></label><label>Termen plată<input type="date" value={due} onChange={e=>setDue(e.target.value)}/></label><label>Valoare contract (RON)<input type="number" min="0" step="0.01" required value={amount} onChange={e=>setAmount(e.target.value)}/></label><label>Total plătit (RON)<input type="number" min="0" step="0.01" value={paid} onChange={e=>setPaid(e.target.value)}/></label></div><label>Note<input maxLength={1000} value={notes} onChange={e=>setNotes(e.target.value)}/></label><div className="actions" style={{marginTop:16}}><button className="button" type="submit">{editing?'Salvează modificările':'Adaugă furnizor'}</button>{editing&&<button className="button secondary" type="button" onClick={reset}>Anulează</button>}</div></form>}
 </section></main>
}
