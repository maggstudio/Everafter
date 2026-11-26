'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {Home,ListChecks,Users,CalendarDays,Menu,X,Wallet,Store,Mail,LayoutGrid,Settings,FolderOpen,ChartNoAxesCombined,MessageCircle,LogOut,ScanLine} from 'lucide-react';
import {supabase} from '../../lib/supabase';
import {useStore} from '../../lib/store';
import SmartHomeLogo from './SmartHomeLogo';
import AccountProfile from './AccountProfile';
import GlobalSearch from '../dashboard/GlobalSearch';
type View='overview'|'tasks'|'budget'|'guests'|'calendar'|'seating'|'invitations'|'vendors'|'notifications'|'settings'|'reception';
async function logoutDevice(){
 try{
  if(supabase&&'serviceWorker' in navigator){
   const {data}=await supabase.auth.getSession();
   const registration=await navigator.serviceWorker.getRegistration();
   const subscription=await registration?.pushManager.getSubscription();
   if(subscription){
    try{if(data.session)await fetch('/api/push',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+data.session.access_token},body:JSON.stringify({action:'remove',subscription:subscription.toJSON()}),signal:AbortSignal.timeout(5000)})}finally{await subscription.unsubscribe()}
   }
  }
 }catch(e){console.warn('Push logout cleanup incomplete')}
 await supabase?.auth.signOut();
 window.location.href='/login';
}

export default function EventMobileNav({view,navigate,mobileMore,setMobileMore,platformAdmin}:{view:View|'team';navigate:(v:View)=>void;mobileMore:boolean;setMobileMore:React.Dispatch<React.SetStateAction<boolean>>;platformAdmin:boolean}){
const {can}=useStore();
const nav:[View,string][]=[['overview','Prezentare'],['tasks','Planificare'],['budget','Buget și furnizori'],['guests','Invitați'],['invitations','Invitații digitale'],['seating','Mese'],['reception','Ziua evenimentului'],['settings','Setări']];
const moduleFor={overview:'wedding',tasks:'tasks',budget:'expenses',vendors:'vendors',guests:'guests',invitations:'wedding',seating:'wedding',reception:'wedding',calendar:'calendar',notifications:'wedding',settings:'wedding'} as const;
const group=(v:View):View=>v==='calendar'?'tasks':v==='vendors'?'budget':v;
const visibleNav=nav.filter(([id])=>id==='tasks'?can('tasks','read')||can('calendar','read'):id==='budget'?can('expenses','read')||can('vendors','read'):can(moduleFor[id],'read')&&(!['invitations','seating','reception'].includes(id)||can('guests','read')));
const target=(v:View):View=>v==='tasks'&&!can('tasks','read')?'calendar':v==='budget'&&!can('expenses','read')?'vendors':v;
const mobileIcons={overview:Home,tasks:ListChecks,guests:Users,calendar:CalendarDays,budget:Wallet,vendors:Store,invitations:Mail,seating:LayoutGrid,reception:ScanLine,settings:Settings,notifications:Settings};
return <><div className="mobile-head"><SmartHomeLogo/><div className="mobile-head-actions"><GlobalSearch navigate={navigate}/><button type="button" aria-label="Setări" onClick={()=>navigate("settings")}>⚙</button></div></div><nav className="mobile-nav" aria-label="Navigare mobilă">{([['overview','Acasă'],['tasks','Planificare'],['guests','Invitați'],['budget','Buget']] as [View,string][]).filter(([id])=>visibleNav.some(([v])=>v===id)).map(([id,label])=><button type="button" key={id} className={group(view as View)===id?'active':''} aria-current={group(view as View)===id?'page':undefined} onClick={()=>navigate(target(id))}>{(()=>{const Icon=mobileIcons[id];return <Icon className="pwa-nav-icon" size={22} aria-hidden="true"/>})()}<span>{label}</span></button>)}<button type="button" className={mobileMore||!['overview','tasks','guests','budget'].includes(group(view as View))?'active':''} aria-expanded={mobileMore} aria-controls="mobile-more-modules" onClick={()=>{setMobileMore(v=>!v)}}>{mobileMore?<X className="pwa-nav-icon" size={22}/>:<Menu className="pwa-nav-icon" size={22}/>}<span>Mai multe</span></button></nav>{mobileMore&&<button className="pwa-menu-backdrop" aria-label="Închide meniul" onClick={()=>setMobileMore(false)}/>}{mobileMore&&<nav id="mobile-more-modules" className="mobile-more-modules" aria-label="Alte module"><div style={{gridColumn:"1 / -1"}}><AccountProfile/></div>{visibleNav.filter(([id])=>!['overview','tasks','guests','budget'].includes(id)).map(([id,label])=><button type="button" key={id} onClick={()=>navigate(target(id))}>{(()=>{const Icon=mobileIcons[id];return <Icon className="pwa-nav-icon" size={22} aria-hidden="true"/>})()}<span>{label}</span></button>)}<Link href="/events"><FolderOpen className="pwa-nav-icon" size={22}/><span>Evenimentele mele</span></Link>{platformAdmin&&<Link href="/admin"><ChartNoAxesCombined className="pwa-nav-icon" size={22}/><span>Monitorizare WEDLY</span></Link>}<Link href="/privacy" className="pwa-only-link"><Settings size={22}/><span>Datele mele și GDPR</span></Link><Link href="/contact" className="pwa-only-link"><MessageCircle size={22}/><span>Contact și suport</span></Link><button className="pwa-only-link" type="button" onClick={()=>void logoutDevice()}><LogOut size={22}/><span>Deconectare</span></button></nav>}</>;
}
