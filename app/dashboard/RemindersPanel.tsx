'use client';
import {useMemo,useState} from 'react';
import {useStore} from '../../lib/store';
import {paidTotal} from './VendorPayments';
type Alert={id:string;date:string;title:string;detail:string;kind:'task'|'appointment'|'vendor';overdue:boolean};
const localDate=(d:Date)=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
export default function RemindersPanel(){
 const {data,can,weddingId}=useStore();
 const [days,setDays]=useState(7);
 const [showAll,setShowAll]=useState(false);
 const today=localDate(new Date());
 const until=localDate(new Date(new Date().getFullYear(),new Date().getMonth(),new Date().getDate()+days));
 const alerts=useMemo(()=>{
  const rows:Alert[]=[];
  if(can('tasks','read'))for(const t of data.tasks){if(!t.done&&t.deadline&&t.deadline<=until)rows.push({id:'task:'+t.id,date:t.deadline,title:t.title,detail:'Sarcină · '+t.category,kind:'task',overdue:t.deadline<today})}
  if(can('calendar','read'))for(const a of data.appointments){if(a.date&&a.date>=today&&a.date<=until)rows.push({id:'appointment:'+(a.id||a.name+a.date),date:a.date,title:a.name,detail:'Programare'+(a.time?' · '+a.time:'')+' · '+(a.category||'Altele'),kind:'appointment',overdue:false})}
  if(can('vendors','read'))for(const v of data.vendors||[]){if(v.dueDate&&v.dueDate<=until&&v.contractAmount>paidTotal(v))rows.push({id:'vendor:'+v.id,date:v.dueDate,title:v.name,detail:'Plată furnizor · Rest '+new Intl.NumberFormat('ro-RO',{style:'currency',currency:'RON'}).format(v.contractAmount-paidTotal(v)),kind:'vendor',overdue:v.dueDate<today})}
  return rows.sort((a,b)=>a.date.localeCompare(b.date)||a.title.localeCompare(b.title,'ro'));
 // Permission checks are derived from the active membership on each render.
 },[data,can,today,until]);
 const [dismissed,setDismissed]=useState<Record<string,boolean>>({});
 const key=(a:Alert)=>[weddingId,a.id,a.date,a.kind==='vendor'?(data.vendors||[]).find(v=>'vendor:'+v.id===a.id)?.paidAmount:''].join(':');
 const visible=alerts.filter(a=>!dismissed[key(a)]);
 const displayed=showAll?visible:visible.slice(0,6);
 return <section className="panel"><div className="module-head"><h2>Centru de notificări</h2><label>Interval <select aria-label="Interval notificări" value={days} onChange={e=>setDays(Number(e.target.value))}><option value={3}>3 zile</option><option value={7}>7 zile</option><option value={14}>14 zile</option><option value={30}>30 zile</option></select></label></div>
 <p>Termene și programări calculate automat din datele evenimentului. Alertele sunt afișate aici când deschizi panoul. Notificările pe telefon se configurează în preferințele push.</p>
 <div className="stats two-stats"><article><span>Necesită atenție</span><strong>{visible.filter(a=>a.overdue).length}</strong></article><article><span>În intervalul ales</span><strong>{visible.length}</strong></article></div>
 {visible.length===0&&<p>Nu ai notificări pentru intervalul selectat.</p>}
 {displayed.map(a=><div className="list-row" key={a.id}><div><strong>{a.overdue?'⚠ Întârziat · ':''}{a.title}</strong><small>{a.detail} · {new Date(a.date+'T12:00:00').toLocaleDateString('ro-RO')}</small></div><button type="button" className="text-button" onClick={()=>setDismissed(old=>({...old,[key(a)]:true}))}>Ascunde</button></div>)}
 {visible.length>6&&<button type="button" className="button secondary" onClick={()=>setShowAll(v=>!v)}>{showAll?'Arată mai puține':'Arată toate ('+visible.length+')'}</button>}
 <p className="hint">„Ascunde” se aplică doar în sesiunea curentă. Pentru eliminarea definitivă a unei alerte, actualizează sarcina, programarea sau plata din modulul corespunzător.</p>
 </section>;
}
