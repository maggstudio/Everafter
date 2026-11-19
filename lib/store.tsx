'use client';
import {createContext,useContext,useEffect,useState} from 'react';
import {defaultWedding,initialTasks,initialExpenses,initialGuests,initialPackages,type Wedding,type Task,type Expense,type Guest} from './demo';
type Package={id:string;name:string;price:number;features:string[]};
type Data={wedding:Wedding;tasks:Task[];expenses:Expense[];guests:Guest[];packages:Package[]};
const initial:Data={wedding:defaultWedding,tasks:initialTasks,expenses:initialExpenses,guests:initialGuests,packages:initialPackages};
type Store={data:Data;setData:React.Dispatch<React.SetStateAction<Data>>;ready:boolean};
const Context=createContext<Store|null>(null);
export function StoreProvider({children}:{children:React.ReactNode}){const [data,setData]=useState<Data>(initial);const [ready,setReady]=useState(false);useEffect(()=>{try{const raw=localStorage.getItem('everafter-demo-v03');if(raw){const parsed=JSON.parse(raw);setData({...initial,...parsed})}}catch{}setReady(true)},[]);useEffect(()=>{if(ready)localStorage.setItem('everafter-demo-v03',JSON.stringify(data))},[data,ready]);return <Context.Provider value={{data,setData,ready}}>{children}</Context.Provider>}
export function useStore(){const value=useContext(Context);if(!value)throw new Error('StoreProvider lipsă');return value}
