'use client';
import {useEffect,useState,useRef} from 'react';
import {Search,X} from 'lucide-react';
import {useStore} from '../../lib/store';
type Target='guests'|'tasks'|'vendors'|'budget'|'calendar';
const normalize=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('ro');
export default function GlobalSearch({navigate}:{navigate:(target:Target)=>void}){
 const {data,can,weddingId}=useStore();const [open,setOpen]=useState(false),[query,setQuery]=useState('');const input=useRef<HTMLInputElement>(null);
 useEffect(()=>{setOpen(false);setQuery('')},[weddingId]);
 useEffect(()=>{if(!open)return;input.current?.focus();const close=(e:KeyboardEvent)=>{if(e.key==='Escape')setOpen(false)};window.addEventListener('keydown',close);return()=>window.removeEventListener('keydown',close)},[open]);
 const items:{id:string;title:string;detail:string;target:Target;label:string}[]=[];
 if(can('guests','read'))data.guests.forEach(g=>items.push({id:g.id,title:g.name,detail:g.group||g.status,target:'guests',label:'Invitați'}));
 if(can('tasks','read'))data.tasks.forEach(t=>items.push({id:t.id,title:t.title,detail:t.category,target:'tasks',label:'Sarcini'}));
 if(can('vendors','read'))data.vendors.forEach(v=>items.push({id:v.id,title:v.name,detail:v.category,target:'vendors',label:'Furnizori'}));
 if(can('expenses','read'))data.expenses.forEach(e=>items.push({id:e.id,title:e.name,detail:e.category||'',target:'budget',label:'Buget'}));
 if(can('calendar','read'))data.appointments.forEach((a,i)=>items.push({id:a.id||String(i),title:a.name,detail:a.date,target:'calendar',label:'Calendar'}));
 const q=normalize(query.trim());const results=q?items.filter(i=>q.split(/\s+/).every(w=>normalize(i.title+' '+i.detail+' '+i.label).includes(w))):[];
 return <div className="global-search"><button type="button" className="notification-bell" aria-label="Caută în eveniment" aria-expanded={open} onClick={()=>{setQuery('');setOpen(true)}}><Search size={22}/></button>{open&&<><button type="button" className="global-search-backdrop" aria-label="Închide căutarea" onClick={()=>setOpen(false)}/><section className="global-search-dialog" role="dialog" aria-label="Căutare globală"><header><h2>Caută în eveniment</h2><button type="button" aria-label="Închide" onClick={()=>setOpen(false)}><X size={22}/></button></header><input ref={input} type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Invitat, sarcină, furnizor..." aria-label="Termen de căutare"/><p className="hint">{q?results.length+' rezultate':'Caută în modulele la care ai acces.'}</p><div className="global-search-results">{results.slice(0,50).map(i=><button type="button" key={i.target+':'+i.id} onClick={()=>{setOpen(false);navigate(i.target)}}><strong>{i.title}</strong><small>{i.label} · {i.detail}</small></button>)}{q&&!results.length&&<p>Nu am găsit rezultate.</p>}{results.length>50&&<p>Restrânge căutarea pentru mai multe rezultate relevante.</p>}</div></section></>}</div>
}
