'use client';
import {useState} from 'react';
import {useStore,type Appointment} from '../../lib/store';
import {paidTotal} from './VendorPayments';

const categories=['Ceremonii','Furnizori','Pregătiri personale','Familie','Altele'];
type Form={name:string;date:string;time:string;category:string;notes:string};
const blank:Form={name:'',date:'',time:'',category:'Altele',notes:''};
const dayString=(date:Date)=>[date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');
const formatDate=(value:string)=>new Date(value+'T12:00:00').toLocaleDateString('ro-RO',{day:'numeric',month:'long',year:'numeric'});

const icsEscape=(value:string)=>value.replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');
const icsDate=(date:string,time?:string)=>date.replace(/-/g,'')+(time?'T'+time.replace(':','')+'00':'');
const icsEvent=(id:string,name:string,date:string,time:string|undefined,details:string)=>[
 'BEGIN:VEVENT','UID:'+icsEscape(id)+'@wedly.ro','DTSTAMP:'+new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,''),
 ...(time&&/^([01]\\d|2[0-3]):[0-5]\\d$/.test(time)?['DTSTART:'+icsDate(date)+'T'+time.replace(':','')+'00','DURATION:PT1H']:['DTSTART;VALUE=DATE:'+icsDate(date)]),
 'SUMMARY:'+icsEscape(name),
 'DESCRIPTION:'+icsEscape(details),'END:VEVENT'
].join('\r\n');

export default function CalendarPanel(){
 const {data,setData,can}=useStore();
 const [month,setMonth]=useState(()=>{const d=new Date();return new Date(d.getFullYear(),d.getMonth(),1)});
 const [form,setForm]=useState<Form>(blank);
 const [showForm,setShowForm]=useState(false);

 const [editing,setEditing]=useState<number|null>(null);
 const [categoryFilter,setCategoryFilter]=useState('all');
 const [selectedDay,setSelectedDay]=useState<string|null>(null);
 const canRead=can('calendar','read'),canWrite=can('calendar','write'),canReadTasks=can('tasks','read');
 if(!canRead)return <section className="panel"><p>Nu ai acces la calendar.</p></section>;
 const appointments=data.appointments;
 const tasks=canReadTasks?data.tasks.filter(t=>Boolean(t.deadline)):[];
 const vendorDues=can('vendors','read')?(data.vendors||[]).filter(v=>v.dueDate&&v.contractAmount>paidTotal(v)):[];
 const today=dayString(new Date());
 const start=new Date(month.getFullYear(),month.getMonth(),1);
 const leading=(start.getDay()+6)%7;
 const daysInMonth=new Date(month.getFullYear(),month.getMonth()+1,0).getDate();
 const cells=Array.from({length:Math.ceil((leading+daysInMonth)/7)*7},(_,index)=>{const day=index-leading+1;return day>0&&day<=daysInMonth?day:null});
 const countFor=(date:string)=>appointments.filter(a=>a.date===date&&(categoryFilter==='all'||(a.category||'Altele')===categoryFilter)).length+tasks.filter(t=>t.deadline===date).length+vendorDues.filter(v=>v.dueDate===date).length;
 const visibleAppointments=appointments.map((a,index)=>({a,index})).filter(({a})=>(categoryFilter==='all'||(a.category||'Altele')===categoryFilter)&&(!selectedDay||a.date===selectedDay)).sort((x,y)=>x.a.date.localeCompare(y.a.date)||(x.a.time||'').localeCompare(y.a.time||''));
 const visibleVendorDues=vendorDues.filter(v=>!selectedDay||v.dueDate===selectedDay).sort((a,b)=>a.dueDate.localeCompare(b.dueDate));
 const visibleTasks=tasks.filter(t=>!selectedDay||t.deadline===selectedDay).sort((a,b)=>(a.deadline||'').localeCompare(b.deadline||''));
 const upcoming=appointments.filter(a=>a.date>=today&&a.date<=dayString(new Date(new Date().getFullYear(),new Date().getMonth(),new Date().getDate()+7))).length;
 const exportCalendar=()=>{const events:string[]=[];
 for(const a of appointments){if(/^\d{4}-\d{2}-\d{2}$/.test(a.date))events.push(icsEvent(a.id||a.name+'-'+a.date,a.name,a.date,a.time,a.notes||'Programare WEDLY'))}
 for(const t of tasks){if(t.deadline&&/^\d{4}-\d{2}-\d{2}$/.test(t.deadline))events.push(icsEvent(t.id,t.title,t.deadline,undefined,'Termen sarcină WEDLY'+(t.done?' (finalizată)':'')))}
 for(const v of vendorDues){if(/^\d{4}-\d{2}-\d{2}$/.test(v.dueDate))events.push(icsEvent(v.id,'Scadență: '+v.name,v.dueDate,undefined,'Rest de plată: '+new Intl.NumberFormat('ro-RO',{style:'currency',currency:'RON'}).format(v.contractAmount-paidTotal(v))))}
 const content=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//WEDLY//Event Calendar//RO','CALSCALE:GREGORIAN','METHOD:PUBLISH',...events,'END:VCALENDAR'].join('\r\n')+'\r\n';
 const blob=new Blob([content],{type:'text/calendar;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='wedly-calendar.ics';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
 };
 const change=(key:keyof Form,value:string)=>setForm(prev=>({...prev,[key]:value}));
 const reset=()=>{setShowForm(false);setEditing(null);setForm(blank)};
 const save=(event:React.FormEvent)=>{event.preventDefault();if(!canWrite||!form.name.trim()||!form.date)return;
 const item:Appointment={...(editing!==null?appointments[editing]:{}),id:editing!==null?appointments[editing]?.id||crypto.randomUUID():crypto.randomUUID(),name:form.name.trim().slice(0,160),date:form.date,time:form.time||undefined,category:form.category,notes:form.notes.trim().slice(0,500)||undefined};
 setData(prev=>({...prev,appointments:editing===null?[...prev.appointments,item]:prev.appointments.map((a,i)=>i===editing?item:a)}));reset();
 };
 const edit=(a:Appointment,index:number)=>{setShowForm(true);setEditing(index);setForm({name:a.name,date:a.date,time:a.time||'',category:a.category||'Altele',notes:a.notes||''})};
 return <section className="panel"><div className="module-head"><h2>Calendar și programări</h2><div className="row-controls"><button type="button" className="button secondary" onClick={exportCalendar}>Exportă calendar (.ics)</button>{canWrite&&<button type="button" className="button" onClick={()=>{reset();setShowForm(true)}}>+ Adaugă programare</button>}</div></div><p>Programările și termenele sarcinilor sunt afișate împreună, dar se editează în modulele lor respective.</p>
 <div className="stats two-stats"><article><span>Programări viitoare (7 zile)</span><strong>{upcoming}</strong></article><article><span>Programări înregistrate</span><strong>{appointments.length}</strong></article></div>
 <h3>Scadențe furnizori</h3>{visibleVendorDues.length?visibleVendorDues.map(v=><div className="list-row" key={v.id}><span>{v.name} · Rest de plată: {new Intl.NumberFormat('ro-RO',{style:'currency',currency:'RON'}).format(v.contractAmount-paidTotal(v))}</span><small>{formatDate(v.dueDate)}</small></div>):<p>Nu există scadențe de furnizori pentru selecția curentă.</p>}
 <div className="calendar-toolbar"><div className="row-controls"><button type="button" onClick={()=>setMonth(d=>new Date(d.getFullYear(),d.getMonth()-1,1))} aria-label="Luna precedentă">‹</button><strong>{month.toLocaleDateString('ro-RO',{month:'long',year:'numeric'})}</strong><button type="button" onClick={()=>setMonth(d=>new Date(d.getFullYear(),d.getMonth()+1,1))} aria-label="Luna următoare">›</button></div><label>Categoria programărilor<select value={categoryFilter} onChange={e=>setCategoryFilter(e.target.value)}><option value="all">Toate</option>{categories.map(c=><option key={c}>{c}</option>)}</select></label><button type="button" className="text-button" onClick={()=>{const d=new Date();setMonth(new Date(d.getFullYear(),d.getMonth(),1));setSelectedDay(null)}}>Astăzi / toate zilele</button></div>
 <div className="calendar-grid">{['Lu','Ma','Mi','Jo','Vi','Sâ','Du'].map(d=><strong className="calendar-weekday" key={d}>{d}</strong>)}{cells.map((day,index)=>{if(day===null)return <span className="calendar-empty" key={'empty-'+index}/>;const date=dayString(new Date(month.getFullYear(),month.getMonth(),day));const count=countFor(date);return <button type="button" key={date} className={'calendar-day'+(date===today?' is-today':'')+(date===selectedDay?' is-selected':'')} onClick={()=>setSelectedDay(selectedDay===date?null:date)} aria-label={formatDate(date)+(count?' · '+count+' activități':'')}><span>{day}</span>{count>0&&<small>{count} {count===1?'activitate':'activități'}</small>}</button>})}</div>
 <h3>{selectedDay?'Activități pentru '+formatDate(selectedDay):'Programări și termene'}</h3>
 {visibleAppointments.length===0&&visibleTasks.length===0&&<p>Nu există activități pentru selecția curentă.</p>}
 {visibleAppointments.map(({a,index})=><div className="list-row" key={a.id||'legacy-'+index}><div><strong>{a.name}</strong><small>{formatDate(a.date)}{a.time?' · '+a.time:''} · {a.category||'Altele'}</small>{a.notes&&<p className="hint">{a.notes}</p>}</div>{canWrite&&<div className="row-controls"><button type="button" className="text-button" onClick={()=>edit(a,index)}>Editează</button><button type="button" className="remove" aria-label={'Șterge '+a.name} onClick={()=>{if(window.confirm('Ștergi programarea „'+a.name+'”?')){setData(prev=>({...prev,appointments:prev.appointments.filter((_,i)=>i!==index)}));if(editing===index)reset()}}}>×</button></div>}</div>)}
 {visibleTasks.map(t=><div className="list-row" key={'task-'+t.id}><span>{t.title}<small>Termen checklist · {formatDate(t.deadline!)} · {t.done?'Finalizată':'În lucru'}</small></span></div>)}
 {canWrite&&showForm&&<form className="calendar-form" onSubmit={save}><h3>{editing===null?'Adaugă programare':'Editează programarea'}</h3><div className="two"><label>Denumire<input required maxLength={160} value={form.name} onChange={e=>change('name',e.target.value)}/></label><label>Data<input required type="date" value={form.date} onChange={e=>change('date',e.target.value)}/></label><label>Ora (opțional)<input type="time" value={form.time} onChange={e=>change('time',e.target.value)}/></label><label>Categorie<select value={form.category} onChange={e=>change('category',e.target.value)}>{categories.map(c=><option key={c}>{c}</option>)}</select></label></div><label>Note (opțional)<input maxLength={500} value={form.notes} onChange={e=>change('notes',e.target.value)}/></label><div className="actions"><button type="submit" className="button">{editing===null?'Adaugă programare':'Salvează modificările'}</button><button type="button" className="button secondary" onClick={reset}>Anulează</button></div></form>}
 </section>;
}
