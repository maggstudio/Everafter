'use client';
import {useEffect,useState} from 'react';
type InstallEvent=Event&{prompt:()=>Promise<void>;userChoice:Promise<{outcome:'accepted'|'dismissed'}>};
export default function PwaInstall(){
 const [event,setEvent]=useState<InstallEvent|null>(null),[ios,setIos]=useState(false),[standalone,setStandalone]=useState(false),[dismissed,setDismissed]=useState(true),[instructions,setInstructions]=useState(false);
 useEffect(()=>{
  const media=window.matchMedia('(display-mode: standalone)');
  const update=()=>setStandalone(media.matches||Boolean((navigator as Navigator&{standalone?:boolean}).standalone));
  update();media.addEventListener('change',update);
  setIos(/iPhone|iPad|iPod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1));
  try{setDismissed(sessionStorage.getItem('wedly-pwa-dismissed')==='1')}catch{setDismissed(false)}
  const install=(e:Event)=>{e.preventDefault();setEvent(e as InstallEvent)};
  const installed=()=>{setEvent(null);setStandalone(true)};
  window.addEventListener('beforeinstallprompt',install);window.addEventListener('appinstalled',installed);
  if('serviceWorker' in navigator)void navigator.serviceWorker.register('/sw.js',{scope:'/'}).catch(e=>console.warn('WEDLY PWA registration failed',e));
  return()=>{media.removeEventListener('change',update);window.removeEventListener('beforeinstallprompt',install);window.removeEventListener('appinstalled',installed)};
 },[]);
 function close(){setDismissed(true);try{sessionStorage.setItem('wedly-pwa-dismissed','1')}catch{}}
 async function install(){if(!event){setInstructions(true);return}try{await event.prompt();const choice=await event.userChoice;if(choice.outcome==='accepted')close()}finally{setEvent(null)}}
 if(standalone||dismissed||(!event&&!ios))return null;
 return <aside className="pwa-install" aria-label="Instalează aplicația WEDLY"><img src="/brand/wedly-icon.svg" width="44" height="44" alt=""/><div><strong>WEDLY pe telefonul tău</strong><small>Acces rapid, direct de pe ecranul principal.</small>{instructions&&<small>În Safari, apasă Partajare → Adaugă la ecranul principal.</small>}</div><button type="button" className="pwa-install-action" onClick={()=>void install()}>{ios&&!event?'Cum instalez':'Instalează'}</button><button type="button" className="pwa-install-close" onClick={close} aria-label="Închide">×</button></aside>
}
