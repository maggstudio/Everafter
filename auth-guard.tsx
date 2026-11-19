'use client';
import {useEffect,useState} from 'react';
import {useRouter} from 'next/navigation';
import {supabase} from '../lib/supabase';
export default function AuthGuard({children}:{children:React.ReactNode}){
 const [ready,setReady]=useState(false);const router=useRouter();
 useEffect(()=>{if(!supabase){router.replace('/login');return}
 let alive=true;
 supabase.auth.getSession().then(({data})=>{if(!alive)return;if(!data.session)router.replace('/login');else setReady(true)});
 const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>{if(!session){setReady(false);router.replace('/login')}});
 return()=>{alive=false;subscription.unsubscribe()};
 },[router]);
 if(!ready)return <main className="shell"><p>Verificăm autentificarea...</p></main>;
 return <>{children}</>;
}
