'use client';
import {EventSidebar} from './EventNavigation';
import {useLayoutEffect,useState,type ReactNode} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {ArrowLeft,Home,ListChecks,Wallet,Users,ScanLine,Settings} from 'lucide-react';
import {useStore} from '../../lib/store';
import SmartHomeLogo from './SmartHomeLogo';
import EventMobileNav from './EventMobileNav';
export default function SettingsRouteShell({children,always=false}:{children:ReactNode;always?:boolean}){
 const {ready,weddingId,data,can}=useStore();const router=useRouter();const [context,setContext]=useState(()=>always||(typeof window!=='undefined'&&new URLSearchParams(window.location.search).get('from')==='settings'));const [more,setMore]=useState(false);
 useLayoutEffect(()=>{setContext(always||new URLSearchParams(window.location.search).get('from')==='settings')},[always]);
 if(!context)return <>{children}</>;
 const href=(view:string)=>'/dashboard?'+new URLSearchParams({view,...(weddingId?{wedding:weddingId}:{})}).toString();
 const back=<Link className="settings-back" href={href('settings')}><ArrowLeft size={18}/> Toate setările</Link>;
 if(!ready||!weddingId||!can('wedding','read'))return <div className="settings-route-fallback">{back}{children}</div>;
 const w=data.wedding;
 return <div className="app-layout wedly-luxury-dashboard settings-route-layout"><EventSidebar view={'settings'} navigate={v=>router.push(href(v))}/><div className="main-area"><EventMobileNav view="settings" navigate={v=>{setMore(false);router.push(href(v))}} mobileMore={more} setMobileMore={setMore} platformAdmin={false}/><div className="settings-route-content">{back}{children}</div></div></div>
}
