'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import {supabase} from '../../lib/supabase';
import {useStore} from '../../lib/store';
export default function AccountNavLink(){
 const {events,ready,weddingId}=useStore();
 const [signedIn,setSignedIn]=useState(false);
 useEffect(()=>{
  if(!supabase)return;
  let active=true;
  void supabase.auth.getSession().then(({data})=>{if(active)setSignedIn(Boolean(data.session))});
  const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>{if(active)setSignedIn(Boolean(session))});
  return()=>{active=false;subscription.unsubscribe()};
 },[]);
 if(!signedIn)return <Link href="/login">Autentificare</Link>;
 return <Link href={ready&&events.length>0?'/dashboard'+(weddingId?'?wedding='+encodeURIComponent(weddingId):''):'/events'}>{ready&&events.length>0?'Dashboard':'Evenimentele mele'}</Link>;
}
