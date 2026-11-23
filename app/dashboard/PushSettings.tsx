'use client';
import {useEffect,useState} from 'react';
import {supabase} from '../../lib/supabase';
export default function PushSettings(){
 const [supported,setSupported]=useState(false),[enabled,setEnabled]=useState(false),[busy,setBusy]=useState(false),[status,setStatus]=useState('');
 useEffect(()=>{const ok='serviceWorker' in navigator&&'PushManager' in window&&'Notification' in window;setSupported(ok);if(ok)void navigator.serviceWorker.getRegistration().then(async r=>setEnabled(Boolean(await r?.pushManager.getSubscription())));},[]);
 async function action(kind:'subscribe'|'remove'|'test'){
 setBusy(true);setStatus('');
 try{
 const {data}=await supabase!.auth.getSession();if(!data.session)throw Error('Autentificare necesară.');
 const reg=await navigator.serviceWorker.getRegistration();if(!reg)throw Error('Redeschide aplicația pentru activarea serviciului.');
 let sub=await reg.pushManager.getSubscription();
 if(kind==='subscribe'){
 const permission=await Notification.requestPermission();if(permission!=='granted')throw Error('Permisiunea pentru notificări nu a fost acordată.');
 const {key}=await fetch('/api/push').then(r=>r.json());if(!key)throw Error('Serviciul push nu este configurat încă.');
 const bytes=Uint8Array.from(atob(key.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-key.length%4)%4)),c=>c.charCodeAt(0));
 sub=sub||await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:bytes});
 }
 if(!sub)throw Error('Activează mai întâi notificările.');
 const res=await fetch('/api/push',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+data.session.access_token},body:JSON.stringify({action:kind,subscription:sub.toJSON()})});
 const result=await res.json();if(!res.ok)throw Error(result.error||'Operațiunea a eșuat.');
 if(kind==='remove')await sub.unsubscribe();
 setEnabled(kind!=='remove');setStatus(kind==='test'?'Notificare de test trimisă.':kind==='remove'?'Notificări dezactivate.':'Notificări activate pe acest dispozitiv.');
 }catch(e){setStatus(e instanceof Error?e.message:'Operațiunea a eșuat.')}finally{setBusy(false)}
 }
 return <section className="panel"><h2>Notificări pe telefon</h2><p>Primește notificări WEDLY pe acest dispozitiv. Momentan poți activa serviciul și trimite o notificare de test.</p>{supported?<div className="actions"><button className="button" disabled={busy} onClick={()=>void action('subscribe')}>{enabled?'Reconectează':'Activează notificările'}</button>{enabled&&<><button className="button secondary" disabled={busy} onClick={()=>void action('test')}>Trimite test</button><button className="button secondary" disabled={busy} onClick={()=>void action('remove')}>Dezactivează</button></>}</div>:<p>Notificările push nu sunt disponibile în acest browser.</p>}{status&&<p role="status">{status}</p>}</section>
}
