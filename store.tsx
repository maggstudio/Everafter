'use client';
import {createContext,useContext,useEffect,useRef,useState} from 'react';
import {defaultWedding,initialTasks,initialExpenses,initialGuests,initialPackages,type Wedding,type Task,type Expense,type Guest} from './demo';
import {supabase} from './supabase';
type Package={id:string;name:string;price:number;features:string[]};
type Data={wedding:Wedding;tasks:Task[];expenses:Expense[];guests:Guest[];packages:Package[]};
const initial:Data={wedding:defaultWedding,tasks:initialTasks,expenses:initialExpenses,guests:initialGuests,packages:initialPackages};
type Store={data:Data;setData:React.Dispatch<React.SetStateAction<Data>>;ready:boolean;saveStatus:string};
const Context=createContext<Store|null>(null);
export function StoreProvider({children}:{children:React.ReactNode}){
 const [data,setData]=useState<Data>(initial),[ready,setReady]=useState(false),[userId,setUserId]=useState<string|null>(null),[saveStatus,setSaveStatus]=useState('Se conectează...');
 const generation=useRef(0),skipFirst=useRef(true);
 useEffect(()=>{
   if(!supabase){setSaveStatus('Supabase neconfigurat');return}
   const client=supabase;let active=true;
   async function load(id:string){const token=++generation.current;setReady(false);setSaveStatus('Se încarcă datele...');
     const {data:row,error}=await client.from('wedding_workspaces').select('wedding_data').eq('user_id',id).maybeSingle();
     if(!active||token!==generation.current)return;
     if(error){setSaveStatus('Eroare la încărcare: '+error.message);return}
     skipFirst.current=true;setData(row?.wedding_data?{...initial,...row.wedding_data}:initial);setUserId(id);setReady(true);setSaveStatus('Date încărcate');
   }
   client.auth.getUser().then(({data:{user}})=>{if(active&&user)load(user.id)});
   const {data:{subscription}}=client.auth.onAuthStateChange((event,session)=>{
     if(event==='SIGNED_OUT'){generation.current++;setReady(false);setUserId(null);setData(initial);setSaveStatus('Deconectat')}
     if(event==='SIGNED_IN'&&session?.user&&session.user.id!==userId)load(session.user.id);
   });
   return()=>{active=false;subscription.unsubscribe()};
 },[]);
 useEffect(()=>{
   if(!ready||!userId||!supabase)return;
   if(skipFirst.current){skipFirst.current=false;return}
   const client=supabase;const id=userId;
   setSaveStatus('Se salvează...');
   const timeout=setTimeout(async()=>{
     const {error}=await client.from('wedding_workspaces').upsert({user_id:id,wedding_data:data,updated_at:new Date().toISOString()},{onConflict:'user_id'});
     setSaveStatus(error?'Eroare la salvare: '+error.message:'Salvat în cloud');
   },700);
   return()=>clearTimeout(timeout);
 },[data,ready,userId]);
 return <Context.Provider value={{data,setData,ready,saveStatus}}>{children}</Context.Provider>;
}
export function useStore(){const value=useContext(Context);if(!value)throw new Error('StoreProvider lipsă');return value}
