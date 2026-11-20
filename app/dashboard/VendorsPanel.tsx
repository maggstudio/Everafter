'use client';
import {useState} from 'react';
import {useStore,type Vendor} from '../../lib/store';
import {money} from '../../lib/demo';
import VendorDocuments from './VendorDocuments';

const categories=['Restaurant / locație','Muzică / DJ','Foto / Video','Flori / decor','Catering / tort','Ținute / beauty','Transport','Ceremonie','Altele'];
type Form={name:string;category:string;contact:string;contractAmount:string;paidAmount:string;dueDate:string;notes:string};
const blank:Form={name:'',category:categories[0],contact:'',contractAmount:'',paidAmount:'',dueDate:'',notes:''};
const dateRO=(value:string)=>new Date(value+'T12:00:00').toLocaleDateString('ro-RO');
export default function VendorsPanel(){
 const {data,setData,can}=useStore();
 const [expanded,setExpanded]=useState<string|null>(null);
 const [form,setForm]=useState<Form>(blank),[editing,setEditing]=useState<string|null>(null),[search,setSearch]=useState(''),[filter,setFilter]=useState('all');
 const readable=can('vendors','read'),writable=can('vendors','write');
 if(!readable)return <section className="panel"><p>Nu ai acces la furnizori.</p></section>;
 const vendors=data.vendors||[];
 const contracted=vendors.reduce((s,v)=>s+v.contractAmount,0),paid=vendors.reduce((s,v)=>s+v.paidAmount,0);
 const due=vendors.filter(v=>v.dueDate&&v.contractAmount>v.paidAmount&&v.dueDate<new Date().toISOString().slice(0,10));
 const change=(key:keyof Form,value:string)=>setForm(f=>({...f,[key]:value}));
 const reset=()=>{setEditing(null);setForm(blank)};
 const edit=(v:Vendor)=>{setEditing(v.id);setForm({name:v.name,category:v.category,contact:v.contact,contractAmount:String(v.contractAmount),paidAmount:String(v.paidAmount),dueDate:v.dueDate,notes:v.notes})};
 const save=(e:React.FormEvent)=>{e.preventDefault();if(!writable)return;const amount=Number(form.contractAmount),paid=Number(form.paidAmount||0);if(!form.name.trim()||!Number.isFinite(amount)||amount<0||!Number.isFinite(paid)||paid<0||paid>amount)return;
 const item:Vendor={id:editing||crypto.randomUUID(),name:form.name.trim().slice(0,160),category:form.category,contact:form.contact.trim().slice(0,250),contractAmount:amount,paidAmount:paid,dueDate:form.dueDate,notes:form.notes.trim().slice(0,500)};
 setData(d=>({...d,vendors:editing?d.vendors.map(v=>v.id===editing?item:v):[...d.vendors,item]}));reset()};
 const filtered=vendors.filter(v=>(filter==='all'||v.category===filter)&&[v.name,v.contact,v.notes].some(x=>x.toLocaleLowerCase('ro').includes(search.toLocaleLowerCase('ro')))).sort((a,b)=>(a.dueDate||'9999').localeCompare(b.dueDate||'9999'));
 return <section className="panel"><h2>Furnizori și contracte</h2><p>Ține evidența colaboratorilor, valorilor contractate, avansurilor și scadențelor. Sumele plătite aici sunt informative; în Buget înregistrezi separat plățile efective, pentru a evita dublarea cheltuielilor.</p>
 <div className="stats"><article><span>Furnizori</span><strong>{vendors.length}</strong></article><article><span>Contractat</span><strong>{money(contracted)}</strong></article><article><span>Plătit declarat</span><strong>{money(paid)}</strong></article><article><span>De achitat</span><strong>{money(contracted-paid)}</strong></article></div>
 {due.length>0&&<p role="status" className="v09-warning">⚠ {due.length} {due.length===1?'furnizor cu scadență depășită':'furnizori cu scadențe depășite'} și sold restant.</p>}
 <div className="task-filters"><label>Caută<input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Nume, contact, observații"/></label><label>Categorie<select value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">Toate</option>{categories.map(c=><option key={c}>{c}</option>)}</select></label></div>
 {filtered.length===0&&<p>Nu există furnizori pentru filtrele selectate.</p>}
 {filtered.map(v=><div key={v.id}><div className="list-row"><div><strong>{v.name}</strong><small>{v.category}{v.contact?' · '+v.contact:''}</small><small>Contract: {money(v.contractAmount)} · Plătit: {money(v.paidAmount)} · Rest: {money(Math.max(0,v.contractAmount-v.paidAmount))}</small>{v.dueDate&&<small>Scadență: {dateRO(v.dueDate)}{v.dueDate<new Date().toISOString().slice(0,10)&&v.contractAmount>v.paidAmount?' · ÎNTÂRZIAT':''}</small>}{v.notes&&<p className="hint">{v.notes}</p>}</div><div className="row-controls"><button type="button" className="text-button" onClick={()=>setExpanded(expanded===v.id?null:v.id)}>{expanded===v.id?'Ascunde documentele':'Documente PDF'}</button>{writable&&<><button type="button" className="text-button" onClick={()=>edit(v)}>Editează</button><button type="button" className="remove" aria-label={'Șterge '+v.name} onClick={()=>{if(window.confirm('Ștergi furnizorul „'+v.name+'”?')){setData(d=>({...d,vendors:d.vendors.filter(x=>x.id!==v.id)}));if(editing===v.id)reset()}}}>×</button></>}</div></div>{expanded===v.id&&<VendorDocuments vendorId={v.id}/>}</div>)}
 {writable&&<form className="budget-form" onSubmit={save}><h3>{editing?'Editează furnizor':'Adaugă furnizor'}</h3><div className="two"><label>Nume furnizor<input required maxLength={160} value={form.name} onChange={e=>change('name',e.target.value)}/></label><label>Categorie<select value={form.category} onChange={e=>change('category',e.target.value)}>{categories.map(c=><option key={c}>{c}</option>)}</select></label><label>Contact (telefon / email)<input maxLength={250} value={form.contact} onChange={e=>change('contact',e.target.value)}/></label><label>Valoare contract (RON)<input required type="number" min="0" step="0.01" value={form.contractAmount} onChange={e=>change('contractAmount',e.target.value)}/></label><label>Plătit până acum (RON)<input type="number" min="0" max={form.contractAmount||undefined} step="0.01" value={form.paidAmount} onChange={e=>change('paidAmount',e.target.value)}/></label><label>Scadență plată<input type="date" value={form.dueDate} onChange={e=>change('dueDate',e.target.value)}/></label></div><label>Detalii contract / observații<textarea maxLength={500} rows={3} value={form.notes} onChange={e=>change('notes',e.target.value)}/></label><div className="actions"><button className="button" type="submit">{editing?'Salvează':'Adaugă furnizor'}</button>{editing&&<button className="button secondary" type="button" onClick={reset}>Anulează</button>}</div></form>}
 <p className="hint">Poți încărca și administra contracte PDF din butonul „Documente PDF” al fiecărui furnizor. Semnătura electronică va fi integrată într-o etapă ulterioară.</p></section>
}
