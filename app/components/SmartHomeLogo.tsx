'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import {supabase} from '../../lib/supabase';
import {useStore} from '../../lib/store';
import BrandLogo from './BrandLogo';

export default function SmartHomeLogo({showMotto=false}:{showMotto?:boolean}){
 const {events,ready,weddingId}=useStore();
 const [signedIn,setSignedIn]=useState(false);
 useEffect(()=>{
  if(!supabase)return;
  let active=true;
  void supabase.auth.getSession().then(({data})=>{if(active)setSignedIn(Boolean(data.session))});
  const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>{if(active)setSignedIn(Boolean(session))});
  return()=>{active=false;subscription.unsubscribe()};
 },[]);
 const href=signedIn&&ready&&events.length>0?'/dashboard'+(weddingId?'?wedding='+encodeURIComponent(weddingId):''):'/';
 return <Link className="brand" href={href} aria-label={signedIn&&ready&&events.length>0?'WEDLY, panoul evenimentului':'WEDLY, prima pagină'}><BrandLogo showMotto={showMotto}/></Link>;
}
