'use client';
import {useState} from 'react';
import {useStore} from '../../lib/store';
import type {SeatingTable,Guest} from '../../lib/demo';

const clamp=(n:number)=>Math.max(6,Math.min(94,n));
const initialPosition=(index:number)=>({x:16+(index%5)*17,y:20+(Math.floor(index/5)%4)*20});
export default function RoomPlan(){
 const {data,setData,can}=useStore();
 const tables=data.wedding.seatingTables||[];
 const guests=data.guests;
 const [selected,setSelected]=useState<string|null>(null);
 const [message,setMessage]=useState('');
 const writable=can('wedding','write');
 const guestMap=new Map(guests.map(g=>[g.id,g]));
 const count=(g:Guest)=>Number.isInteger(g.partySize)&&g.partySize!>0?g.partySize!:1;
 const update=(id:string,patch:Partial<SeatingTable>)=>{if(!writable)return;setData(d=>({...d,wedding:{...d.wedding,seatingTables:(d.wedding.seatingTables||[]).map(t=>t.id===id?{...t,...patch}:t)}}))};
 const current=tables.find(t=>t.id===selected);
 const coords=(t:SeatingTable,index:number)=>({x:typeof t.x==='number'?clamp(t.x):initialPosition(index).x,y:typeof t.y==='number'?clamp(t.y):initialPosition(index).y});
 const place=(event:React.MouseEvent<HTMLDivElement>)=>{if(!writable||!current)return;const rect=event.currentTarget.getBoundingClientRect();if(!rect.width||!rect.height)return;update(current.id,{x:clamp((event.clientX-rect.left)/rect.width*100),y:clamp((event.clientY-rect.top)/rect.height*100)});setMessage('Poziția mesei a fost actualizată.')};
 return <section className="room-plan"><div className="room-plan-heading"><div><h3>Plan vizual al sălii</h3><p>Selectează o masă, apoi atinge locul unde vrei să o poziționezi. Poți ajusta poziția și cu săgețile.</p></div><span className="hint">{tables.length} mese</span></div>
 <div className="room-canvas" role="group" aria-label="Schița sălii" onClick={place}><div className="room-stage">Zonă ring / scenă</div>{tables.map((t,index)=>{const {x,y}=coords(t,index);const occupied=t.guestIds.reduce((sum,id)=>sum+(guestMap.has(id)?count(guestMap.get(id)!):0),0);return <button type="button" key={t.id} className={'room-table '+(t.shape==='rect'?'room-rect ':'room-round ')+(selected===t.id?'room-selected':'')} style={{left:x+'%',top:y+'%'}} aria-pressed={selected===t.id} aria-label={t.name+', '+occupied+' din '+t.capacity+' locuri'} onClick={e=>{e.stopPropagation();setSelected(t.id);setMessage('')}}><strong>{t.name}</strong><small>{occupied}/{t.capacity}</small></button>})}</div>
 {tables.length===0&&<p>Adaugă mese mai sus pentru a le vedea în schiță.</p>}
 {current&&<div className="room-controls"><strong>{current.name}</strong>{writable&&<><div className="row-controls"><button type="button" onClick={()=>{const index=tables.findIndex(t=>t.id===current.id);update(current.id,{x:clamp(coords(current,index).x-3)})}} aria-label="Mută masa la stânga">←</button><button type="button" onClick={()=>{const index=tables.findIndex(t=>t.id===current.id);update(current.id,{y:clamp(coords(current,index).y-3)})}} aria-label="Mută masa în sus">↑</button><button type="button" onClick={()=>{const index=tables.findIndex(t=>t.id===current.id);update(current.id,{y:clamp(coords(current,index).y+3)})}} aria-label="Mută masa în jos">↓</button><button type="button" onClick={()=>{const index=tables.findIndex(t=>t.id===current.id);update(current.id,{x:clamp(coords(current,index).x+3)})}} aria-label="Mută masa la dreapta">→</button></div><label>Formă <select value={current.shape||'round'} onChange={e=>update(current.id,{shape:e.target.value as 'round'|'rect'})}><option value="round">Rotundă</option><option value="rect">Dreptunghiulară</option></select></label></>}<button type="button" className="text-button" onClick={()=>setSelected(null)}>Deselectează</button></div>}
 {message&&<p role="status" className="hint">{message}</p>}
 <p className="hint">Schiță orientativă, nu plan la scară. Pozițiile și formele sunt salvate împreună cu evenimentul.</p></section>;
}
