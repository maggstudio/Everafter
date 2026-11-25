'use client';
import {createContext,useContext,useEffect,useRef,useState} from 'react';
import {defaultWedding,initialPackages,type Wedding,type Task,type Expense,type Guest} from './demo';
import {supabase} from './supabase';
export type Module='wedding'|'tasks'|'expenses'|'guests'|'calendar'|'packages'|'vendors';
export type Permissions=Record<string,{read:boolean;write:boolean}>;
export type Member={wedding_id:string;user_id:string;role:'owner'|'partner'|'planner'|'collaborator';status:'active'|'pending';permissions:Permissions};
type Package={id:string;name:string;price:number;features:string[]};
export type VendorPayment={id:string;amount:number;date:string;notes:string;expenseId:string};
export type Vendor={id:string;name:string;category:string;contact:string;contractAmount:number;paidAmount:number;dueDate:string;notes:string;payments?:VendorPayment[]};
export type Appointment={id?:string;name:string;date:string;time?:string;category?:string;notes?:string};
type Data={vendors:Vendor[];wedding:Wedding;tasks:Task[];expenses:Expense[];guests:Guest[];packages:Package[];appointments:Appointment[]};
const initial:Data={vendors:[],wedding:defaultWedding,tasks:[],expenses:[],guests:[],packages:initialPackages,appointments:[]};
const modules:Module[]=['wedding','tasks','expenses','guests','packages','calendar','vendors'];
const field:Record<Module,keyof Data>={wedding:'wedding',tasks:'tasks',expenses:'expenses',guests:'guests',packages:'packages',calendar:'appointments',vendors:'vendors'};
export type EventSummary={id:string;name:string;type:string;date:string;city:string;role:string};
type Store={events:EventSummary[];data:Data;setData:React.Dispatch<React.SetStateAction<Data>>;ready:boolean;saveStatus:string;weddingId:string|null;members:Member[];pending:Member[];isOwner:boolean;can:(module:Module,action:'read'|'write')=>boolean;refresh:()=>Promise<void>;refreshInPlace:()=>Promise<void>;selectEvent:(id:string)=>Promise<boolean>};
const Context=createContext<Store|null>(null);
export function StoreProvider({children}:{children:React.ReactNode}){
 const [data,setData]=useState<Data>(initial),[ready,setReady]=useState(false),[saveStatus,setSaveStatus]=useState('Se încarcă...');
 const [events,setEvents]=useState<EventSummary[]>([]);
 const [weddingId,setWeddingId]=useState<string|null>(null),[members,setMembers]=useState<Member[]>([]),[pending,setPending]=useState<Member[]>([]),[userId,setUserId]=useState<string|null>(null);
 const selectedEvent=useRef<string|null>(null);
 const saved=useRef<Data>(initial),loaded=useRef(false),version=useRef(0),isSaving=useRef(false);
 const dataRef=useRef(data),polling=useRef(false),authUser=useRef<string|null>(null),booting=useRef(false);dataRef.current=data;
 const current=members.find(m=>m.user_id===userId&&m.wedding_id===weddingId&&m.status==='active');
 const isOwner=current?.role==='owner';
 const can=(module:Module,action:'read'|'write')=>Boolean(isOwner||current?.permissions?.[module==='vendors'?'expenses':module]?.[action]);
 async function selectEvent(id:string):Promise<boolean>{
  if(!supabase||!events.some(e=>e.id===id))return false;
  if(id===weddingId&&ready)return true;
  // Never discard local changes or an in-flight save during a switch.
  if(isSaving.current||!loaded.current||modules.some(m=>JSON.stringify(data[field[m]])!==JSON.stringify(saved.current[field[m]]))){
   setSaveStatus('Așteaptă salvarea modificărilor înainte să schimbi evenimentul.');return false;
  }
  const client=supabase;const v=++version.current;
  loaded.current=false;setReady(false);setSaveStatus('Se deschide evenimentul...');
  // Load only the selected event; do not re-bootstrap the account or reload all events.
  const [teamResult,moduleResult]=await Promise.all([
   client.from('wedding_members').select('*').eq('wedding_id',id),
   client.from('wedding_modules').select('module,content').eq('wedding_id',id)
  ]);
  if(v!==version.current)return false;
  if(teamResult.error||moduleResult.error){setSaveStatus('Eroare la schimbarea evenimentului: '+(teamResult.error?.message||moduleResult.error?.message));return false}
  const team=(teamResult.data||[]) as Member[];
  const mine=team.find(m=>m.user_id===userId&&m.status==='active');
  if(!mine||(mine.role!=='owner'&&!mine.permissions?.wedding?.read)){
   setSaveStatus('Nu ai acces la acest eveniment.');return false;
  }
  const next:Data={...initial};
  for(const row of moduleResult.data||[]){const mod=row.module as Module;if(modules.includes(mod)){
   (next as any)[field[mod]]=mod==='wedding'?{...defaultWedding,...row.content}:row.content;
  }}
  selectedEvent.current=id;try{localStorage.setItem('wedly-event:'+userId,id)}catch{}saved.current=next;setMembers(team);setWeddingId(id);setData(next);
  loaded.current=true;setReady(true);setSaveStatus('Date sincronizate');
  return true;
 }
 async function refreshInPlace(){if(!loaded.current||polling.current||isSaving.current||JSON.stringify(dataRef.current)!==JSON.stringify(saved.current))return;polling.current=true;try{await refresh(true)}finally{polling.current=false}}
 async function refresh(background=false){if(!supabase)return;const client=supabase;const v=++version.current;if(!background){loaded.current=false;setReady(false);setSaveStatus('Se încarcă...');}
 const {data:{user},error:authError}=await client.auth.getUser();if(v!==version.current)return;
 if(authError||!user){const {data:{session},error:sessionError}=await client.auth.getSession();if(v!==version.current)return;const expired=!session&&!sessionError;if(expired){loaded.current=false;authUser.current=null;selectedEvent.current=null;setReady(false);setUserId(null);setWeddingId(null);setMembers([]);setPending([]);setEvents([]);saved.current=initial;setData(initial);setSaveStatus('Autentificare necesară')}else{setSaveStatus('Sincronizare în așteptare')}return}authUser.current=user.id;setUserId(user.id);
 // Never bootstrap a new event on refresh: an account may intentionally have zero events.
 const {data:allMembers,error:memberError}=await client.from('wedding_members').select('*').eq('user_id',user.id);
 if(v!==version.current)return;if(memberError){setSaveStatus(memberError.message);return}
 const active=(allMembers||[]).filter((m:Member)=>m.status==='active');const invitations=(allMembers||[]).filter((m:Member)=>m.status==='pending');
 setPending(invitations as Member[]);
 // List only events where this user has an active membership and wedding read permission.
 const eventIds=active.filter((m:Member)=>m.role==='owner'||Boolean(m.permissions?.wedding?.read)).map((m:Member)=>m.wedding_id);
 const {data:eventRows}=eventIds.length?await client.from('wedding_modules').select('wedding_id,content').eq('module','wedding').in('wedding_id',eventIds):{data:[]};
 if(v!==version.current)return;
 const summaries:EventSummary[]=active.filter((m:Member)=>eventIds.includes(m.wedding_id)).map((m:Member)=>{
  const info=(eventRows||[]).find((r:any)=>r.wedding_id===m.wedding_id)?.content||{};
  const type=info.eventType||'wedding';
  return {id:m.wedding_id,type,date:info.date||'',city:info.city||'',role:m.role,
   name:type==='baptism'?'Botezul '+(info.childName||'fără nume'):(info.first&&info.second?info.first+' & '+info.second:'Nuntă fără nume')};
 });
 setEvents(summaries);

 // Owner's wedding is the default; a shared wedding can be selected with ?wedding=<uuid>.
 const selected=typeof window!=='undefined'?new URLSearchParams(window.location.search).get('wedding'):null;
 let remembered:string|null=null;try{remembered=localStorage.getItem('wedly-event:'+user.id)}catch{}
 const preferred=selected||selectedEvent.current||remembered;
 const chosen=active.filter((m:Member)=>eventIds.includes(m.wedding_id)).find((m:Member)=>m.wedding_id===preferred)||active.find((m:Member)=>eventIds.includes(m.wedding_id)&&m.role==='owner')||active.find((m:Member)=>eventIds.includes(m.wedding_id));
 if(!chosen){
  selectedEvent.current=null;saved.current=initial;loaded.current=true;setWeddingId(null);setMembers([]);setData(initial);setReady(true);
  setSaveStatus('Nu ai evenimente. Poți crea unul nou din Evenimentele mele.');return;
 }
 const id=chosen.wedding_id;const switching=selectedEvent.current!==id;if(background&&switching){setSaveStatus('Evenimentul selectat nu mai este disponibil.');return}
 const {data:team}=await client.from('wedding_members').select('*').eq('wedding_id',id);
 if(v!==version.current)return;
 const {data:rows,error}=await client.from('wedding_modules').select('module,content').eq('wedding_id',id);
 if(v!==version.current)return;if(error){setSaveStatus(error.message);return}
 const next:Data={...initial};for(const row of rows||[]){const mod=row.module as Module;if(modules.includes(mod)){(next as any)[field[mod]]=mod==='wedding'?{...defaultWedding,...row.content}:row.content}}
 // Missing modules are not permission to use demo data: empty lists are intentional.
 if(background&&(isSaving.current||JSON.stringify(dataRef.current)!==JSON.stringify(saved.current)))return;
 selectedEvent.current=id;try{localStorage.setItem('wedly-event:'+user.id,id)}catch{}setWeddingId(id);setMembers((team||[chosen]) as Member[]);saved.current=next;setData(next);loaded.current=true;setReady(true);setSaveStatus('Date sincronizate');
 }
 useEffect(()=>{
  booting.current=true;void refresh().finally(()=>{booting.current=false});if(!supabase)return;
  const {data:{subscription}}=supabase.auth.onAuthStateChange((event,session)=>{
   if(event==='SIGNED_OUT'){
    version.current++;authUser.current=null;selectedEvent.current=null;loaded.current=false;setReady(false);setSaveStatus('Autentificare necesară');
    setUserId(null);setWeddingId(null);setMembers([]);setEvents([]);setData(initial);
   }else if((event==='SIGNED_IN'||event==='TOKEN_REFRESHED')&&session){
    // Auth state may become available after the initial getUser call.
    // Defer Supabase queries until the auth callback has completed.
    setTimeout(()=>{if(authUser.current===session.user.id&&loaded.current){void refreshInPlace();return}if(booting.current&&(!authUser.current||authUser.current===session.user.id))return;booting.current=true;void refresh().finally(()=>{booting.current=false})},0);
   }
  });return()=>subscription.unsubscribe()
 },[]);
 useEffect(()=>{if(!ready||!loaded.current||!weddingId||!supabase||isSaving.current)return;
 const changed=modules.filter(m=>JSON.stringify(data[field[m]])!==JSON.stringify(saved.current[field[m]]));if(!changed.length)return;
 const denied=changed.filter(m=>!can(m,'write'));if(denied.length){setSaveStatus('Nu ai drept de modificare: '+denied.join(', '));return}
 const client=supabase,id=weddingId;const snapshot=data;setSaveStatus('Se salvează...');
 const timeout=setTimeout(async()=>{isSaving.current=true;let errorText='';for(const mod of changed){const {error}=await client.from('wedding_modules').upsert({wedding_id:id,module:mod,content:snapshot[field[mod]],updated_at:new Date().toISOString()},{onConflict:'wedding_id,module'});if(error){errorText=error.message;break}}
 if(!errorText){saved.current=snapshot;setSaveStatus('Salvat în cloud')}else setSaveStatus('Eroare: '+errorText);isSaving.current=false;
 },800);return()=>clearTimeout(timeout);
 },[data,ready,weddingId,members,userId]);

 useEffect(()=>{if(!weddingId||!ready)return;
 const interval=setInterval(()=>{if(polling.current||isSaving.current||JSON.stringify(dataRef.current)!==JSON.stringify(saved.current))return;polling.current=true;void refresh(true).finally(()=>{polling.current=false})},30000);
 const resume=()=>{if(document.visibilityState==='visible')void refreshInPlace()};document.addEventListener('visibilitychange',resume);window.addEventListener('online',resume);return()=>{clearInterval(interval);document.removeEventListener('visibilitychange',resume);window.removeEventListener('online',resume)};
 },[weddingId,ready,data]);
 return <Context.Provider value={{events,data,setData,ready,saveStatus,weddingId,members,pending,isOwner,can,refresh,refreshInPlace,selectEvent}}>{children}</Context.Provider>
}
export function useStore(){const x=useContext(Context);if(!x)throw new Error('StoreProvider lipsă');return x}
