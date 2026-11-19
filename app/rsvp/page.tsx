'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import {supabase} from '../../lib/supabase';
type Invitation={guest_name:string;status:string;party_size:number;dietary_notes:string;expires_at:string};
export default function PublicRsvp(){
 const [token,setToken]=useState(''),[invitation,setInvitation]=useState<Invitation|null>(null),[busy,setBusy]=useState(true),[message,setMessage]=useState('');
 const [status,setStatus]=useState('confirmat'),[size,setSize]=useState(1),[notes,setNotes]=useState('');
 useEffect(()=>{const t=new URLSearchParams(window.location.search).get('token')||'';setToken(t);
 if(!supabase||!t){setMessage('Link invalid.');setBusy(false);return}
 void supabase.rpc('rsvp_view',{p_token:t}).then(({data,error})=>{if(error||!data){setMessage('Invitația nu este disponibilă sau a expirat.')}else{const x=data as Invitation;setInvitation(x);setStatus(x.status==='refuzat'?'refuzat':'confirmat');setSize(Math.max(1,x.party_size||1));setNotes(x.dietary_notes||'')}setBusy(false)})},[]);
 async function submit(e:React.FormEvent){e.preventDefault();if(!supabase||!token)return;setBusy(true);setMessage('');const {data,error}=await supabase.rpc('rsvp_respond',{p_token:token,p_status:status,p_party_size:size,p_dietary_notes:notes});setBusy(false);if(error||!data){setMessage(error?.message||'Linkul nu mai este valid.');return}setMessage('Răspunsul a fost salvat. Mulțumim!');setInvitation(v=>v?{...v,status,party_size:size,dietary_notes:notes}:v)}
 return <main className="shell narrow"><Link className="brand" href="/">WEDLY ✦</Link><section className="panel"><h1>Confirmă participarea</h1>{busy&&!invitation?<p>Se verifică invitația...</p>:null}{invitation&&<><p>Salut, <strong>{invitation.guest_name}</strong>! Te rugăm să confirmi participarea.</p><form onSubmit={submit}><label>Răspuns<select value={status} onChange={e=>setStatus(e.target.value)}><option value="confirmat">Particip</option><option value="refuzat">Nu pot participa</option></select></label>{status==='confirmat'&&<><label>Număr persoane (inclusiv tu)<input type="number" min="1" max="20" value={size} onChange={e=>setSize(Number(e.target.value))} required/></label><label>Restricții alimentare / observații<textarea maxLength={500} value={notes} onChange={e=>setNotes(e.target.value)}/></label></>}<button className="button" disabled={busy} type="submit">{busy?'Se salvează...':'Trimite răspunsul'}</button></form></>}{message&&<p role="status">{message}</p>}</section></main>
}
