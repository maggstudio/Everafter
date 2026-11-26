'use client';
import {useEffect,useState,type ReactNode} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {ArrowLeft,Home,ListChecks,Wallet,Users,ScanLine,Settings} from 'lucide-react';
import {useStore} from '../../lib/store';
import SmartHomeLogo from './SmartHomeLogo';
import EventMobileNav from './EventMobileNav';
export default function SettingsRouteShell({children,always=false}:{children:ReactNode;always?:boolean}){
 const {ready,weddingId,data,can}=useStore();const router=useRouter();const [context,setContext]=useState(always);const [more,setMore]=useState(false);
 useEffect(()=>{setContext(always||new URLSearchParams(window.location.search).get('from')==='settings')},[always]);
 if(!context)return <>{children}</>;
 const href=(view:string)=>'/dashboard?'+new URLSearchParams({view,...(weddingId?{wedding:weddingId}:{})}).toString();
 const back=<Link className="settings-back" href={href('settings')}><ArrowLeft size={18}/> Toate setările</Link>;
 if(!ready||!weddingId||!can('wedding','read'))return <div className="settings-route-fallback">{back}{children}</div>;
 const w=data.wedding;
 const items=[{id:'overview',label:'Prezentare',Icon:Home,visible:can('wedding','read')},{id:can('tasks','read')?'tasks':'calendar',label:'Planificare',Icon:ListChecks,visible:can('tasks','read')||can('calendar','read')},{id:can('expenses','read')?'budget':'vendors',label:'Buget și furnizori',Icon:Wallet,visible:can('expenses','read')||can('vendors','read')},{id:'guests',label:'Invitați și invitații',Icon:Users,visible:can('guests','read')},{id:'reception',label:'Ziua evenimentului',Icon:ScanLine,visible:can('guests','read')},{id:'settings',label:'Setări',Icon:Settings,visible:true}];
 return <div className="app-layout wedly-luxury-dashboard settings-route-layout"><aside className="sidebar"><SmartHomeLogo/><p className="eyebrow">SPAȚIUL EVENIMENTULUI</p><h3>{w.eventType==='baptism'?w.childName||'Botez':w.first+' & '+w.second}</h3><p>{w.city}</p><p className="sidebar-section-label">ORGANIZARE</p><nav className="side-nav" aria-label="Navigare organizare">{items.filter(i=>i.visible).map(({id,label,Icon})=><Link key={id} href={href(id)} className={id==='settings'?'active':''} aria-current={id==='settings'?'page':undefined}><Icon size={19} strokeWidth={1.7}/><span>{label}</span></Link>)}</nav></aside><div className="main-area"><EventMobileNav view="settings" navigate={v=>{setMore(false);router.push(href(v))}} mobileMore={more} setMobileMore={setMore} platformAdmin={false}/><div className="settings-route-content">{back}{children}</div></div></div>
}
