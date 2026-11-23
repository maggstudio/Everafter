'use client';
import {useEffect,useState} from 'react';
import {Bell,X,CheckCheck,CalendarDays,ListChecks,Users} from 'lucide-react';
import {useStore} from '../../lib/store';
import {supabase} from '../../lib/supabase';
type Target='tasks'|'calendar'|'guests';
type Alert={id:string;title:string;detail:string;target:Target};
const day=(offset=0)=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Bucharest',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(Date.now()+offset*86400000));
export default function NotificationCenter({navigate}:{navigate:(target:Target)=>void}){
 const {data,can,weddingId}=useStore();const [open,setOpen]=useState(false);const [user,setUser]=useState('');const [seen,setSeen]=useState<string[]>([]);const [loaded,setLoaded]=useState('');const [clock,setClock]=useState(0);
 useEffect(()=>{let active=true;void supabase?.auth.getUser().then(({data})=>{if(active)setUser(data.user?.id||'')});const timer=setInterval(()=>setClock(v=>v+1),60000);return()=>{active=false;clearInterval(timer)}},[]);
 const key=user&&weddingId?'wedly-alerts:'+user+':'+weddingId:'';
 useEffect(()=>{setOpen(false);let ids:string[]=[];try{const value=JSON.parse(localStorage.getItem(key)||'[]');if(Array.isArray(value))ids=value.filter(v=>typeof v==='string')}catch{}setSeen(ids);setLoaded(key)},[key]);
 useEffect(()=>{if(!open)return;const close=(e:KeyboardEvent)=>{if(e.key==='Escape')setOpen(false)};window.addEventListener('keydown',close);return()=>window.removeEventListener('keydown',close)},[open]);
 const today=day(),soon=day(7);void clock;const alerts:Alert[]=[];
 if(can('tasks','read'))for(const t of data.tasks){if(t.done)continue;const late=!!t.deadline&&t.deadline<today;if(late||t.priority==='urgent'||(t.deadline&&t.deadline<=soon)){alerts.push({id:'task:'+t.id+':'+(t.deadline||'')+':'+(late?'late':t.priority||'due'),title:t.title,detail:late?'Sarcină restantă · '+t.deadline:t.priority==='urgent'?'Sarcină urgentă':'Termen apropiat · '+t.deadline,target:'tasks'})}}
 if(can('calendar','read'))for(const a of data.appointments){if(a.date>=today&&a.date<=soon)alerts.push({id:'appointment:'+JSON.stringify([a.id||a.name,a.date,a.time]),title:a.name,detail:'Programare · '+a.date+(a.time?' · '+a.time:''),target:'calendar'})}
 if(can('guests','read'))for(const g of data.guests){if(g.status!=='asteptare')alerts.push({id:'guest:'+g.id+':'+g.status,title:g.name,detail:g.status==='confirmat'?'Participare confirmată':'Participare refuzată',target:'guests'})}
 const ready=!!key&&loaded===key;const unread=ready?alerts.filter(a=>!seen.includes(a.id)).length:0;
 function mark(ids:string[]){if(!ready)return;const next=Array.from(new Set([...seen,...ids]));setSeen(next);try{localStorage.setItem(key,JSON.stringify(next))}catch{}}
 return <div className="notification-center"><button type="button" className="notification-bell" aria-label={'Notificări, '+unread+' necitite'} aria-expanded={open} onClick={()=>setOpen(v=>!v)}><Bell size={23}/>{unread>0&&<span className="notification-count">{unread>99?'99+':unread}</span>}</button>{open&&<><button className="notification-backdrop" aria-label="Închide notificările" onClick={()=>setOpen(false)}/><section className="notification-popover" aria-label="Centrul de notificări"><header><h2>Notificări</h2><button type="button" aria-label="Închide" onClick={()=>setOpen(false)}><X size={20}/></button></header><p className="hint">Alertele evenimentului · {unread} necitite</p><button type="button" className="text-button notification-mark" disabled={!unread} onClick={()=>mark(alerts.map(a=>a.id))}><CheckCheck size={18}/> Marchează toate ca citite</button><div className="notification-list">{!alerts.length&&<p>Nu ai alerte momentan.</p>}{alerts.map(a=>{const Icon=a.target==='tasks'?ListChecks:a.target==='calendar'?CalendarDays:Users;return <button type="button" key={a.id} className={'notification-item'+(!seen.includes(a.id)?' unread':'')} onClick={()=>{mark([a.id]);setOpen(false);navigate(a.target)}}><Icon size={21}/><span><strong>{a.title}</strong><small>{a.detail}</small></span>{!seen.includes(a.id)&&<i aria-label="Necitită"/>}</button>})}</div></section></>}</div>
}
