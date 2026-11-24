'use client';
import FormModal from '../components/FormModal';
import {useState} from 'react';
import {useStore,type Vendor,type VendorPayment} from '../../lib/store';
import {money} from '../../lib/demo';
export const paidTotal=(v:Vendor)=>Number(v.paidAmount||0)+(v.payments||[]).reduce((s,p)=>s+p.amount,0);
export default function VendorPayments({vendor}:{vendor:Vendor}){
 const {data,setData,can}=useStore();
 const writable=can('vendors','write')&&can('expenses','write');
 const [show,setShow]=useState(false);
 const [amount,setAmount]=useState(''),[date,setDate]=useState(new Date().toISOString().slice(0,10)),[notes,setNotes]=useState(''),[error,setError]=useState('');
 const total=paidTotal(vendor),remaining=Math.max(0,vendor.contractAmount-total);
 function add(e:React.FormEvent){e.preventDefault();if(!writable)return;const n=Number(amount);if(!Number.isFinite(n)||n<=0||n>remaining||!/^\d{4}-\d{2}-\d{2}$/.test(date)){setError('Introdu o sumă pozitivă, cel mult soldul rămas, și o dată validă.');return}
 const id=crypto.randomUUID(),expenseId=crypto.randomUUID();const payment:VendorPayment={id,amount:n,date,notes:notes.trim().slice(0,300),expenseId};
 setData(d=>({...d,vendors:d.vendors.map(v=>v.id===vendor.id?{...v,payments:[...(v.payments||[]),payment]}:v),expenses:[...d.expenses,{id:expenseId,name:'Plată furnizor: '+vendor.name,amount:n,date,category:'Altele',notes:notes.trim().slice(0,300),vendorId:vendor.id,vendorPaymentId:id}]}));setAmount('');setNotes('');setError('');setShow(false)}
 function remove(p:VendorPayment){if(!writable||!window.confirm('Ștergi această plată și cheltuiala asociată din Buget?'))return;setData(d=>({...d,vendors:d.vendors.map(v=>v.id===vendor.id?{...v,payments:(v.payments||[]).filter(x=>x.id!==p.id)}:v),expenses:d.expenses.filter(e=>e.vendorPaymentId!==p.id)}))}
 return <div className="budget-form"><h4>Plăți și avansuri</h4><p className="hint">Contract: {money(vendor.contractAmount)} · Plătit: {money(total)} · Rest: {money(remaining)}</p>
 {(vendor.paidAmount||0)>0&&<p className="hint">Sold inițial declarat: {money(vendor.paidAmount)}. Nu este înregistrat automat ca o cheltuială nouă în Buget.</p>}
 {(vendor.payments||[]).length===0&&<p className="hint">Nu există încă plăți înregistrate individual.</p>}
 {(vendor.payments||[]).map(p=><div className="list-row" key={p.id}><div><strong>{money(p.amount)}</strong><small>{new Date(p.date+'T12:00:00').toLocaleDateString('ro-RO')}{p.notes?' · '+p.notes:''}</small></div>{writable&&<button type="button" className="text-button" onClick={()=>remove(p)}>Șterge plata</button>}</div>)}
 
 {writable&&remaining>0&&<button type="button" className="button" onClick={()=>{setError('');setShow(true)}}>+ Înregistrează plata</button>}{writable&&remaining>0&&show&&<FormModal title="Înregistrează plata" onClose={()=>setShow(false)}><form onSubmit={add}><div className="two"><label>Sumă (RON)<input required type="number" min="0.01" max={remaining} step="0.01" value={amount} onChange={e=>setAmount(e.target.value.replace(/^0+(?=\d)/,''))}/></label><label>Data plății<input required type="date" value={date} onChange={e=>setDate(e.target.value)}/></label></div><label>Detalii / tranșă<input maxLength={300} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Avans, tranșa 2, plată finală..."/></label><button type="submit" className="button">Înregistrează plata și adaugă în Buget</button>{error&&<p role="alert">{error}</p>}</form></FormModal>}
 <p className="hint">Plățile introduse aici sunt sincronizate cu Bugetul. Pentru corectare, șterge plata din acest istoric și reînregistreaz-o.</p></div>
}
