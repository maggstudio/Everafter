'use client';
import {createContext,useContext,useEffect,useRef,useState} from 'react';
import {defaultWedding,initialPackages,type Wedding,type Task,type Expense,type Guest} from './demo';
import {supabase} from './supabase';
export type Module='wedding'|'tasks'|'expenses'|'guests'|'calendar'|'packages';
export type Permissions=Record<string,{read:boolean;write:boolean}>;
export type Member={wedding_id:string;user_id:string;role:'owner'|'partner'|'planner';status:'active'|'pending';permissions:Permissions};
type Package={id:string;name:string;price:number;features:string[]};
type Data={wedding:Wedding;tasks:Task[];expenses:Expense[];guests:Guest[];packages:Package[];appointments:{name:string;date:string}[]};
const initial:Data={wedding:defaultWedding,tasks:[],expenses:[],guests:[],packages:initialPackages,appointments:[]};
const modules:Module[]=['wedding','tasks','expenses','guests','packages','calendar'];
const field:Record<Module,keyof Data>={wedding:'wedding',tasks:'tasks',expenses:'expenses',guests:'guests',packages:'packages',calendar:'appointments'};
export type EventSummary={id:string;name:string;type:string;date:string;city:string;role:string};
type Store={events:EventSummary[];data:Data;setData:React.Dispatch<React.SetStateAction<Data>>;ready:boolean;saveStatus:string;weddingId:string|null;members:Member[];pending:Member[];isOwner:boolean;can:(module:Module,action:'read'|'write')=>boolean;refresh:()=>Promise<void>};
const Context=createContext<Store|null>(null);
export function StoreProvider({children}:{children:React.ReactNode}){
 const [data,setData]=useState<Data>(initial),[ready,setReady]=useState(false),[saveStatus,setSaveStatus]=useState('Se încarcă...');
 const [events,setEvents]=useState<EventSummary[]>([]);
 const [weddingId,setWeddingId]=useState<string|null>(null),[members,setMembers]=useState<Member[]>([]),[pending,setPending]=useState<Member[]>([]),[userId,setUserId]=useState<string|null>(null);
 const saved=useRef<Data>(initial),loaded=useRef(false),version=useRef(0),isSaving=useRef(false);
 const current=members.find(m=>m.user_id===userId&&m.wedding_id===weddingId&&m.status==='active');
 const isOwner=current?.role==='owner';
 const can=(module:Module,action:'read'|'write')=>Boolean(isOwner||current?.permissions?.[module]?.[action]);
 async function refresh(){if(!supabase)return;const client=supabase;const v=++version.current;loaded.current=false;setReady(false);setSaveStatus('Se încarcă...');
 const {data:{user},error:authError}=await client.auth.getUser();if(v!==version.current)return;
 if(authError||!user){setSaveStatus('Autentificare necesară');return}setUserId(user.id);
 const {data:owned,error:bootstrapError}=await client.rpc('ensure_my_wedding');if(v!==version.current)return;
 if(bootstrapError){setSaveStatus('Migrarea v0.5 lipsește sau a eșuat: '+bootstrapError.message);return}
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
 const chosen=active.find((m:Member)=>m.wedding_id===selected)||active.find((m:Member)=>m.wedding_id===owned)||active[0];
 if(!chosen){setSaveStatus('Nu există o nuntă accesibilă');return}
 const id=chosen.wedding_id;setWeddingId(id);
 const {data:team}=await client.from('wedding_members').select('*').eq('wedding_id',id);
 if(v!==version.current)return;setMembers((team||[chosen]) as Member[]);
 const {data:rows,error}=await client.from('wedding_modules').select('module,content').eq('wedding_id',id);
 if(v!==version.current)return;if(error){setSaveStatus(error.message);return}
 const next:Data={...initial};for(const row of rows||[]){const mod=row.module as Module;if(modules.includes(mod)){(next as any)[field[mod]]=mod==='wedding'?{...defaultWedding,...row.content}:row.content}}
 // Missing modules are not permission to use demo data: empty lists are intentional.
 saved.current=next;setData(next);loaded.current=true;setReady(true);setSaveStatus('Date sincronizate');
 }
 useEffect(()=>{void refresh();if(!supabase)return;const {data:{subscription}}=supabase.auth.onAuthStateChange(event=>{if(event==='SIGNED_OUT'){version.current++;loaded.current=false;setReady(false);setUserId(null);setWeddingId(null);setEvents([]);setData(initial)} });return()=>subscription.unsubscribe()},[]);
 useEffect(()=>{if(!ready||!loaded.current||!weddingId||!supabase||isSaving.current)return;
 const changed=modules.filter(m=>JSON.stringify(data[field[m]])!==JSON.stringify(saved.current[field[m]]));if(!changed.length)return;
 const denied=changed.filter(m=>!can(m,'write'));if(denied.length){setSaveStatus('Nu ai drept de modificare: '+denied.join(', '));return}
 const client=supabase,id=weddingId;const snapshot=data;setSaveStatus('Se salvează...');
 const timeout=setTimeout(async()=>{isSaving.current=true;let errorText='';for(const mod of changed){const {error}=await client.from('wedding_modules').upsert({wedding_id:id,module:mod,content:snapshot[field[mod]],updated_at:new Date().toISOString()},{onConflict:'wedding_id,module'});if(error){errorText=error.message;break}}
 if(!errorText){saved.current=snapshot;setSaveStatus('Salvat în cloud')}else setSaveStatus('Eroare: '+errorText);isSaving.current=false;
 },800);return()=>clearTimeout(timeout);
 },[data,ready,weddingId,members,userId]);

 useEffect(()=>{if(!weddingId||!ready)return;
 const interval=setInterval(()=>{if(!isSaving.current&&JSON.stringify(data)===JSON.stringify(saved.current))void refresh()},30000);
 return()=>clearInterval(interval);
 },[weddingId,ready,data]);
 return <Context.Provider value={{events,data,setData,ready,saveStatus,weddingId,members,pending,isOwner,can,refresh}}>{children}</Context.Provider>
}
export function useStore(){const x=useContext(Context);if(!x)throw new Error('StoreProvider lipsă');return x}
