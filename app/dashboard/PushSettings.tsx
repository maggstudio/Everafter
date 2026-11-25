'use client';
import {useEffect,useRef,useState} from 'react';
import {supabase} from '../../lib/supabase';
async function send(action:'subscribe'|'remove',sub:PushSubscription){
 const {data}=await supabase!.auth.getSession();if(!data.session)throw Error('Autentificare necesară.');
 const res=await fetch('/api/push',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+data.session.access_token},body:JSON.stringify({action,subscription:sub.toJSON()})});
 if(!res.ok)throw Error('Nu am putut actualiza notificările. Încearcă din nou.');
}
export default function PushSettings(){
 const [supported,setSupported]=useState(false),[enabled,setEnabled]=useState(false),[busy,setBusy]=useState(true),[status,setStatus]=useState('');
 const lock=useRef(false);
 useEffect(()=>{let active=true;const ok='serviceWorker' in navigator&&'PushManager' in window&&'Notification' in window;setSupported(ok);
 (async()=>{try{if(!ok)return;const reg=await navigator.serviceWorker.getRegistration();const sub=await reg?.pushManager.getSubscription();if(!active)return;
 if(sub&&Notification.permission==='granted'){setEnabled(true);try{await send('subscribe',sub)}catch{if(active)setStatus('Sincronizarea notificărilor nu a reușit. Redeschide setările pentru a reîncerca.');}}
 else if(sub){try{await send('remove',sub)}finally{await sub.unsubscribe()}}
 }catch{if(active)setStatus('Nu am putut verifica notificările. Încearcă din nou.')}finally{if(active)setBusy(false)}})();return()=>{active=false}},[]);
 async function toggle(next:boolean){
 if(lock.current||busy)return;lock.current=true;setBusy(true);setStatus('');
 let created:PushSubscription|null=null;
 try{
 if(next){const permission=await Notification.requestPermission();if(permission!=='granted')throw Error(permission==='denied'?'Notificările sunt blocate. Permite-le din setările browserului sau telefonului.':'Permisiunea nu a fost acordată.');}
 const reg=await navigator.serviceWorker.getRegistration();if(!reg)throw Error('Redeschide aplicația și încearcă din nou.');
 let sub=await reg.pushManager.getSubscription();
 if(next){
 if(!sub){const res=await fetch('/api/push');const {key}=await res.json();if(!res.ok||!key)throw Error('Notificările sunt temporar indisponibile.');
 const bytes=Uint8Array.from(atob(key.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-key.length%4)%4)),c=>c.charCodeAt(0));
 sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:bytes});created=sub;}
 await send('subscribe',sub);setEnabled(true);
 }else{if(sub){await send('remove',sub);await sub.unsubscribe()}setEnabled(false);}
 }catch(e){if(created){try{await created.unsubscribe()}catch{}}setStatus(e instanceof Error?e.message:'Operațiunea a eșuat.');}finally{lock.current=false;setBusy(false)}
 }
 return <section className="panel"><label style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,margin:0}}><span><strong>Primește notificări pe acest dispozitiv</strong><small style={{display:'block',marginTop:4}}>Mementouri și actualizări despre eveniment.</small></span><input type="checkbox" role="switch" checked={enabled} disabled={busy||!supported} onChange={e=>void toggle(e.target.checked)}/></label>{busy&&<small role="status">Se actualizează…</small>}{!busy&&!supported&&<small>Notificările nu sunt disponibile în acest browser. Pe iPhone, deschide aplicația instalată pe ecranul principal.</small>}{status&&<p role="status">{status}</p>}</section>
}
