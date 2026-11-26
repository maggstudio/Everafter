'use client';
import {Home,ListChecks,Users,CalendarDays,Wallet,Store,Mail,LayoutGrid,Settings,ScanLine} from 'lucide-react';
import {useStore} from '../../lib/store';
import SmartHomeLogo from './SmartHomeLogo';
export type View='overview'|'tasks'|'budget'|'guests'|'calendar'|'seating'|'invitations'|'vendors'|'notifications'|'settings'|'reception';
export function useEventNavigation(){const {can}=useStore();
const nav:[View,string][]=[['overview','Prezentare'],['tasks','Planificare'],['budget','Buget și furnizori'],['guests','Invitați și invitații'],['reception','Ziua evenimentului'],['settings','Setări']];
const moduleFor={overview:'wedding',tasks:'tasks',budget:'expenses',vendors:'vendors',guests:'guests',invitations:'wedding',seating:'wedding',reception:'wedding',calendar:'calendar',notifications:'wedding',settings:'wedding'} as const;
const group=(v:View|'team'):View=>v==='team'||v==='notifications'?'settings':v==='calendar'?'tasks':v==='vendors'?'budget':v==='invitations'||v==='seating'?'guests':v;
const visibleNav=nav.filter(([id])=>id==='tasks'?can('tasks','read')||can('calendar','read'):id==='budget'?can('expenses','read')||can('vendors','read'):can(moduleFor[id],'read')&&(!['invitations','seating','reception'].includes(id)||can('guests','read')));
const target=(v:View):View=>v==='tasks'&&!can('tasks','read')?'calendar':v==='budget'&&!can('expenses','read')?'vendors':v;
const mobileIcons={overview:Home,tasks:ListChecks,guests:Users,calendar:CalendarDays,budget:Wallet,vendors:Store,invitations:Mail,seating:LayoutGrid,reception:ScanLine,settings:Settings,notifications:Settings};

return {visibleNav,group,target,mobileIcons};
}
export function EventSidebar({view,navigate}:{view:View|'team';navigate:(v:View)=>void}){
const {data}=useStore();const w=data.wedding;const isBaptism=w.eventType==='baptism';const {visibleNav,group,target,mobileIcons}=useEventNavigation();
return <aside className="sidebar"><SmartHomeLogo/><p className="eyebrow">{isBaptism?'SPAȚIUL BOTEZULUI':'SPAȚIUL NUNȚII'}</p><h3>{isBaptism?(w.childName||'Botez'):`${w.first} & ${w.second}`}</h3><p>{w.city}{w.date?' · '+new Date(w.date+'T12:00:00').toLocaleDateString('ro-RO'):''}</p><p className="sidebar-section-label">ORGANIZARE</p><nav className="side-nav" aria-label="Navigare organizare">{visibleNav.map(([id,label])=>{const Icon=mobileIcons[id];return <button type="button" key={id} className={group(view)===id?'active':''} aria-current={group(view)===id?'page':undefined} onClick={()=>navigate(target(id))}><Icon size={19} strokeWidth={1.6} aria-hidden="true"/><span>{label}</span></button>})}</nav></aside>
}
