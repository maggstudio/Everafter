'use client';
import {useEffect} from 'react';
import {useStore} from '../../lib/store';
import {supabase} from '../../lib/supabase';
const categories=['restaurant','photographer','music','decor','cake','beauty','transport','planner'];
export default function AutoVendorDiscovery(){
 const {weddingId,ready}=useStore();
 useEffect(()=>{if(!ready||!weddingId||!supabase)return;let pending='';try{pending=sessionStorage.getItem('wedly-discover-new-event')||''}catch{return}if(pending!==weddingId)return;let cancelled=false;const run=async()=>{const {data:{session}}=await supabase!.auth.getSession();if(!session||cancelled)return;try{sessionStorage.removeItem('wedly-discover-new-event')}catch{};for(const category of categories){if(cancelled)break;try{const response=await fetch('/api/vendors/discover',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+session.access_token},body:JSON.stringify({weddingId,category})});if(!response.ok)continue;const payload=await response.json();if(!cancelled&&Array.isArray(payload.results)){sessionStorage.setItem('wedly-discover-'+weddingId+'-'+category,JSON.stringify({source:payload.source||'Google Maps',results:payload.results}))}}catch{}}};void run();return()=>{cancelled=true}},[ready,weddingId]);
 return null;
}
