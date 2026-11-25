'use client';
import {useEffect,useState} from 'react';
import {supabase} from './supabase';
import {useStore} from './store';
export function useTaskMemberNames(){
 const {weddingId,members,can}=useStore();
 const allowed=can('tasks','read');
 const signature=members.filter(m=>m.status==='active'&&(m.role==='owner'||m.permissions?.tasks?.read)).map(m=>m.user_id).sort().join(',');
 const [result,setResult]=useState<{key:string;names:Record<string,string>}>({key:'',names:{}});
 const key=allowed?weddingId+':'+signature:'';
 useEffect(()=>{if(!supabase||!weddingId||!allowed)return;let active=true;void supabase.rpc('wedly_task_member_names',{p_wedding:weddingId}).then(({data,error})=>{if(active&&!error)setResult({key,names:Object.fromEntries(((data||[]) as {user_id:string;display_name:string|null}[]).map(m=>[m.user_id,m.display_name||'Nume nesetat']))})});return()=>{active=false}},[key,weddingId,allowed]);
 return (id?:string)=>!id?'Neatribuit':result.key===key&&allowed?result.names[id]||'Nume indisponibil':'Nume indisponibil';
}
