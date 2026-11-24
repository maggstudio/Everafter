'use client';
import {useEffect,useState} from 'react';
import {supabase} from '../../lib/supabase';
export default function OrganizerMonitor(){
 const [data,setData]=useState<{total:number;events:number;latest:string|null}|null>(null),[error,setError]=useState('');
 async function load(){if(!supabase)return;setError('');const {data,error}=await supabase.rpc('wedly_admin_organizer_acceptances');if(error){setError('Registrul nu este disponibil. Verifică migrarea organizer_responsibility.sql.');return}setData(data)}
 useEffect(()=>{void load()},[]);
 return <section className="panel"><h2>Declarații de responsabilitate</h2><button className="button secondary" onClick={()=>void load()}>Actualizează</button>{error&&<p role="status">{error}</p>}{data&&<><p>Declarații înregistrate: <strong>{data.total}</strong> · Evenimente: <strong>{data.events}</strong></p><p>Ultima acceptare: {data.latest?new Date(data.latest).toLocaleString('ro-RO'):'—'}</p></>}<p className="hint">Declarațiile sunt înregistrate cu ora serverului. Evenimentele anterioare migrării pot să nu aibă declarații.</p></section>
}
