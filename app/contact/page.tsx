'use client';
import SettingsRouteShell from '../components/SettingsRouteShell';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import SmartHomeLogo from '../components/SmartHomeLogo';
import {supabase} from '../../lib/supabase';
export default function Contact(){
 const [name,setName]=useState(''),[email,setEmail]=useState(''),[category,setCategory]=useState('question'),[subject,setSubject]=useState(''),[message,setMessage]=useState(''),[website,setWebsite]=useState('');
 const [busy,setBusy]=useState(false),[notice,setNotice]=useState(''),[success,setSuccess]=useState(false);
 useEffect(()=>{void supabase?.auth.getUser().then(({data})=>{if(data.user?.email)setEmail(data.user.email)})},[]);
 async function submit(e:React.FormEvent){e.preventDefault();if(busy)return;setBusy(true);setNotice('');setSuccess(false);
  try{const {data}=await supabase?.auth.getSession()||{data:{session:null}};const r=await fetch('/api/contact',{method:'POST',headers:{'Content-Type':'application/json',...(data.session?{Authorization:'Bearer '+data.session.access_token}:{})},body:JSON.stringify({name,email,category,subject,message,website})});const v=await r.json();if(!r.ok)throw Error(v.error||'Trimiterea a eșuat.');setSuccess(true);setNotice('Mesajul tău a fost înregistrat. Îți vom răspunde pe email.');setMessage('');setSubject('')}catch(err){setNotice(err instanceof Error?err.message:'A apărut o eroare.')}finally{setBusy(false)}
 }
 return <SettingsRouteShell><main className="shell narrow" style={{paddingTop:28,paddingBottom:60}}><SmartHomeLogo/><section className="panel" style={{marginTop:24}}><span className="eyebrow">WEDLY · SUNTEM AICI SĂ TE AJUTĂM</span><h1>Contact și sugestii</h1><p>Ai o idee pentru WEDLY, ai găsit o problemă sau ai nevoie de ajutor? Scrie-ne și îți răspundem pe email. Nu este necesar să ai cont.</p><form onSubmit={submit} className="contact-form">
 <label>Numele tău<input required minLength={2} maxLength={120} autoComplete="name" value={name} onChange={e=>setName(e.target.value)} placeholder="Nume și prenume"/></label>
 <label>Adresa de email<input required type="email" maxLength={254} autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="nume@exemplu.ro"/></label>
 <label>Cu ce te putem ajuta?<select value={category} onChange={e=>setCategory(e.target.value)}><option value="suggestion">Sugestie sau idee</option><option value="problem">Raportează o problemă</option><option value="question">Întrebare sau ajutor</option><option value="other">Alt subiect</option></select></label>
 <label>Subiect<input required minLength={3} maxLength={160} value={subject} onChange={e=>setSubject(e.target.value)} placeholder="Pe scurt, despre ce este vorba?"/></label>
 <label>Mesaj<textarea required minLength={10} maxLength={4000} rows={7} value={message} onChange={e=>setMessage(e.target.value)} placeholder="Descrie sugestia sau problema cât mai clar..."/></label>
 <div aria-hidden="true" style={{position:'absolute',left:'-9999px'}}><label>Website<input tabIndex={-1} autoComplete="off" value={website} onChange={e=>setWebsite(e.target.value)}/></label></div>
 <p className="hint">Nu trimite parole, date bancare sau informații sensibile. Datele introduse sunt folosite pentru gestionarea solicitării și răspunsul la aceasta. <Link href="/confidentialitate">Politica de confidențialitate</Link>.</p>
 <button type="submit" className="button" disabled={busy}>{busy?'Se trimite...':'Trimite mesajul'}</button>{notice&&<p role="status" style={{color:success?'#286c48':'#a33d35'}}>{notice}</p>}
 </form></section><p><Link href="/">← Înapoi la WEDLY</Link></p></main></SettingsRouteShell>;
}
