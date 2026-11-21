'use client';
import {useState} from 'react';
import {useStore} from '../../lib/store';
import type {Guest} from '../../lib/demo';

const format=(amount:number,currency:'RON'|'EUR')=>new Intl.NumberFormat('ro-RO',{style:'currency',currency,maximumFractionDigits:2}).format(amount);
export default function GiftCountingPanel(){
 const {data,setData,can,saveStatus}=useStore();
 const [search,setSearch]=useState('');
 const [order,setOrder]=useState<'name'|'table'>('name');
 const [drafts,setDrafts]=useState<Record<string,string>>({});
 const [currencyDrafts,setCurrencyDrafts]=useState<Record<string,'RON'|'EUR'>>({});
 const writable=can('guests','write');
 const tables=data.wedding.seatingTables||[];
 const assigned=new Map<string,string>();
 tables.forEach(t=>t.guestIds.forEach(id=>assigned.set(id,t.name)));
 const collator=new Intl.Collator('ro',{numeric:true,sensitivity:'base'});
 const guests=[...data.guests].filter(g=>g.name.toLocaleLowerCase('ro').includes(search.toLocaleLowerCase('ro'))).sort((a,b)=>order==='name'?collator.compare(a.name,b.name):Number(!assigned.has(a.id))-Number(!assigned.has(b.id))||collator.compare(assigned.get(a.id)||'',assigned.get(b.id)||'')||collator.compare(a.name,b.name));
 const totals=data.guests.reduce((acc,g)=>{if(g.giftAmount!==undefined&&Number.isFinite(g.giftAmount)&&g.giftAmount>=0){acc[g.giftCurrency==='EUR'?'EUR':'RON']+=g.giftAmount;acc.count++}return acc},{RON:0,EUR:0,count:0});
 const save=(g:Guest)=>{if(!writable)return;const raw=drafts[g.id]??(g.giftAmount===undefined?'':String(g.giftAmount));const normalized=raw.trim().replace(',','.');if(normalized!==''&&(!/^\d+(?:\.\d{1,2})?$/.test(normalized)||Number(normalized)>1000000000)){window.alert('Introdu o sumă validă, de maximum două zecimale.');return}const amount=normalized===''?undefined:Number(normalized);const currency=currencyDrafts[g.id]??g.giftCurrency??'RON';setData(d=>({...d,guests:d.guests.map(x=>x.id===g.id?{...x,giftAmount:amount,giftCurrency:currency}:x)}));setDrafts(d=>{const n={...d};delete n[g.id];return n});setCurrencyDrafts(d=>{const n={...d};delete n[g.id];return n})};
 return <div className="gift-counting">
 <div className="module-head"><div><h3>Numărarea darului</h3><p>Înregistrează suma primită de la fiecare invitat sau familie. Valorile sunt vizibile doar în administrarea evenimentului, nu în invitația publică.</p></div></div>
 <div className="stats"><article><span>Total lei</span><strong>{format(totals.RON,'RON')}</strong></article><article><span>Total euro</span><strong>{format(totals.EUR,'EUR')}</strong></article><article><span>Daruri înregistrate</span><strong>{totals.count} / {data.guests.length}</strong></article></div>
 <p className="hint">Sumele în lei și euro sunt totalizate separat, fără conversie automată. O sumă de 0 reprezintă o înregistrare completată; câmpul gol înseamnă necompletat. {saveStatus}</p>
 <div className="guest-gift-controls"><label>Caută invitat<input type="search" placeholder="Nume / familie" value={search} onChange={e=>setSearch(e.target.value)}/></label><label>Ordine<select value={order} onChange={e=>setOrder(e.target.value as 'name'|'table')}><option value="name">Alfabetică</option><option value="table">După mese</option></select></label></div>
 <div className="guest-table-scroll"><table className="guest-data-table gift-table"><thead><tr><th>Invitat / familie</th><th>Masă</th><th>Sumă primită</th><th>Monedă</th><th>Acțiune</th></tr></thead><tbody>{guests.map(g=>{const raw=drafts[g.id]??(g.giftAmount===undefined?'':String(g.giftAmount));const currency=currencyDrafts[g.id]??g.giftCurrency??'RON';const changed=raw!==(g.giftAmount===undefined?'':String(g.giftAmount))||currency!==(g.giftCurrency??'RON');return <tr key={g.id}><td data-label="Invitat"><strong>{g.name}</strong><small>{g.partySize||1} persoane</small></td><td data-label="Masă">{assigned.get(g.id)||'Nealocat'}</td><td data-label="Sumă"><input aria-label={'Dar primit de la '+g.name} type="text" inputMode="decimal" placeholder="—" value={raw} disabled={!writable} onChange={e=>setDrafts(d=>({...d,[g.id]:e.target.value}))}/></td><td data-label="Monedă"><select aria-label={'Moneda darului pentru '+g.name} value={currency} disabled={!writable} onChange={e=>setCurrencyDrafts(d=>({...d,[g.id]:e.target.value as 'RON'|'EUR'}))}><option value="RON">Lei (RON)</option><option value="EUR">Euro (EUR)</option></select></td><td data-label="Acțiune">{writable&&<button type="button" className="button secondary" disabled={!changed} onClick={()=>save(g)}>Salvează</button>}</td></tr>})}</tbody></table></div>
 {guests.length===0&&<p>Nu există invitați pentru această căutare.</p>}
 </div>;
}
