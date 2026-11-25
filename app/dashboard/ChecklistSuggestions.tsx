'use client';
import {useStore} from '../../lib/store';
import {essentialTasks,optionalTasks} from '../../lib/checklist';
import {useState} from 'react';
const normalize=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
export default function ChecklistSuggestions(){
 const {data,setData,can}=useStore();
 const [showEssential,setShowEssential]=useState(false);
 const type=data.wedding.eventType==='baptism'?'baptism':'wedding';
 const exists=(title:string)=>data.tasks.some(t=>normalize(t.title)===normalize(title));
 const available=optionalTasks[type].filter(([,title])=>!exists(title)&&!(data.wedding.dismissedSuggestions||[]).includes(title));
 const missing=essentialTasks[type].filter(([,title])=>!exists(title));
 const add=(items:string[][])=>{if(!can('tasks','write'))return;setData(d=>({...d,tasks:[...d.tasks,...items.filter(([,title])=>!d.tasks.some(t=>normalize(t.title)===normalize(title))).map(([category,title])=>({id:crypto.randomUUID(),title,category,done:false,priority:'normal' as const}))]}))};
 const list=(items:string[][])=>[...new Set(items.map(([category])=>category))].map(category=><div key={category}><h4 style={{margin:'12px 0 4px'}}>{category}</h4>{items.filter(([c])=>c===category).map(([,title])=><div className="list-row" key={title}><span>{title}</span>{can('tasks','write')&&<button type="button" className="button secondary" onClick={()=>add([[category,title]])}>+ Adaugă</button>}</div>)}</div>);
 return <details style={{margin:'12px 0'}}><summary style={{cursor:'pointer',fontWeight:600}}>Sugestii opționale ({available.length})</summary><p className="hint">Alege doar ce se potrivește evenimentului tău. Nimic nu se adaugă automat.</p>{available.length?list(available):<p>Nu mai sunt sugestii opționale disponibile.</p>}{missing.length>0&&<><button type="button" className="text-button" aria-expanded={showEssential} onClick={()=>setShowEssential(v=>!v)}>{showEssential?'Ascunde':'Vezi'} sarcinile esențiale neincluse ({missing.length})</button>{showEssential&&<div><p className="hint">Pentru evenimente existente sau sarcini șterse anterior. Adaugă doar ce ai nevoie.</p>{can('tasks','write')&&<button type="button" className="button secondary" onClick={()=>{if(window.confirm('Adaugi toate sarcinile esențiale care lipsesc?'))add(missing)}}>Adaugă toate sarcinile esențiale lipsă</button>}{list(missing)}</div>}</>}</details>
}
