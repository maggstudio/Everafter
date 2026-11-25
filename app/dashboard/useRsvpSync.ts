'use client';
import {useEffect,useState,useRef,useCallback} from 'react';
import {supabase} from '../../lib/supabase';
export type RecordRow={id:string;guest_id:string;status:string;party_size:number;dietary_notes:string;expires_at:string;revoked_at:string|null;responded_at:string|null};
export function useRsvpSync(weddingId:string|null,allowed:boolean){
 const [snapshot,setSnapshot]=useState<{id:string;rows:RecordRow[];error:string}>({id:'',rows:[],error:''});
 const generation=useRef(0),sequence=useRef(0);
 const refresh=useCallback(async()=>{if(!supabase||!weddingId||!allowed)return;const gen=generation.current,seq=++sequence.current;try{const {data,error}=await supabase.rpc('rsvp_list',{p_wedding:weddingId});if(gen!==generation.current||seq!==sequence.current)return;if(error)throw error;setSnapshot({id:weddingId,rows:(data||[]) as RecordRow[],error:''})}catch{if(gen===generation.current&&seq===sequence.current)setSnapshot(old=>({id:weddingId,rows:old.id===weddingId?old.rows:[],error:'Confirmările RSVP nu au putut fi sincronizate. Reîncercăm automat.'}))}},[weddingId,allowed]);
 useEffect(()=>{generation.current++;if(!weddingId||!allowed)return;const resume=()=>{if(document.visibilityState==='visible'&&navigator.onLine)void refresh()};resume();const timer=setInterval(resume,30000);document.addEventListener('visibilitychange',resume);window.addEventListener('online',resume);window.addEventListener('focus',resume);return()=>{generation.current++;clearInterval(timer);document.removeEventListener('visibilitychange',resume);window.removeEventListener('online',resume);window.removeEventListener('focus',resume)}},[refresh,weddingId,allowed]);
 return {rows:allowed&&snapshot.id===weddingId?snapshot.rows:[],error:allowed&&snapshot.id===weddingId?snapshot.error:'',refresh};
}
