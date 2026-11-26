'use client';
import {Heart} from 'lucide-react';
import {EventSidebar} from '../components/EventNavigation';
import EventDetailsFields from '../components/EventDetailsFields';

import BrandLogo from '../components/BrandLogo';
import {useEffect,useState} from 'react';
import EventMobileNav from '../components/EventMobileNav';
import Link from 'next/link';
import AuthLoading from '../components/AuthLoading';
import {supabase} from '../../lib/supabase';
import {useRouter} from 'next/navigation';import {useStore} from '../../lib/store';
export default function Setup(){const {data,setData,ready,can,weddingId,saveStatus}=useStore();const [mobileMore,setMobileMore]=useState(false);const [platformAdmin,setPlatformAdmin]=useState(false);useEffect(()=>{let active=true;void supabase?.rpc('wedly_platform_admin').then(({data,error})=>{if(active&&!error)setPlatformAdmin(data===true)});return()=>{active=false}},[]);const w=data.wedding;const isBaptism=w.eventType==='baptism';const router=useRouter();if(!ready)return <AuthLoading message={saveStatus}/>;
 
 const href=(id:string)=>'/dashboard?'+new URLSearchParams({...weddingId?{wedding:weddingId}:{},...id?{view:id}:{}}).toString();
 return <div className="app-layout wedly-luxury-dashboard"><EventSidebar view={'settings'} navigate={v=>{setMobileMore(false);router.push(href(v==='overview'?'':v))}}/><main className="main-area"><EventMobileNav view="settings" navigate={v=>{setMobileMore(false);router.push(href(v==="overview"?"":v))}} mobileMore={mobileMore} setMobileMore={setMobileMore} platformAdmin={platformAdmin}/><Link className="settings-back" href={href("settings")}>← Toate setările</Link><header className="page-head"><div><span className="eyebrow">ADMINISTRARE EVENIMENT</span><h1>Configurarea evenimentului</h1></div><span className="pill">{saveStatus}</span></header>{!can('wedding','read')?<section className="panel"><p>Nu ai acces la detaliile evenimentului.</p></section>:<div className="setup-workspace"><div className="setup-intro"><div><span className="eyebrow">DETALIILE CARE CONTEAZĂ</span><h2>{isBaptism?'Botezul copilului':'Povestea voastră'}</h2><p>Actualizează informațiile de bază ale evenimentului. Acestea sunt folosite și în celelalte module.</p></div><span className="setup-intro-icon"><Heart size={28} strokeWidth={1.4}/></span></div><EventDetailsFields/><div className="setup-footer"><span role="status" aria-live="polite">{saveStatus}</span><button className="button" onClick={()=>router.push(href(new URLSearchParams(window.location.search).get('return')==='invitations'?'invitations':new URLSearchParams(window.location.search).get('from')==='settings'?'settings':''))} disabled={!w.first.trim()||!w.second.trim()||!w.date||!w.city.trim()||(isBaptism&&!w.childName?.trim())}>Finalizează →</button></div></div>}</main></div>}
