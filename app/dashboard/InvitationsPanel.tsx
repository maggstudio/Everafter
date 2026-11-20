'use client';
import Link from 'next/link';
import {useState} from 'react';
import {useStore} from '../../lib/store';
import type {InvitationDesign} from '../../lib/demo';
const defaults:InvitationDesign={theme:'classic',headline:'Te invităm să sărbătorim împreună!',message:'Cu mult drag, te așteptăm să fii alături de noi într-o zi specială.',location:'',time:''};
export default function InvitationsPanel(){
 const {data,setData,can,saveStatus}=useStore();
 const design={...defaults,...data.wedding.invitationDesign};
 const [previewName,setPreviewName]=useState('');
 if(!can('wedding','read')||!can('guests','read'))return <section className="panel"><p>Nu ai acces la invitații.</p></section>;
 const writable=can('wedding','write');
 const baptism=data.wedding.eventType==='baptism';
 const eventName=baptism?'Botezul '+(data.wedding.childName||'copilului'):[data.wedding.first,data.wedding.second].filter(Boolean).join(' & ')||'Nunta noastră';
 const date=data.wedding.date?new Date(data.wedding.date+'T12:00:00').toLocaleDateString('ro-RO',{day:'numeric',month:'long',year:'numeric'}):'Data urmează să fie stabilită';
 const update=(patch:Partial<InvitationDesign>)=>{if(!writable)return;setData(d=>({...d,wedding:{...d.wedding,invitationDesign:{...defaults,...d.wedding.invitationDesign,...patch}}}))};
 const sample=previewName.trim()||data.guests[0]?.name||'Dragă invitat';
 return <section className="panel"><h2>Invitații digitale personalizate</h2><p>Personalizează aspectul și mesajul invitației. Designul se salvează pentru evenimentul selectat.</p><p className="hint">{saveStatus}</p>
 <div className="invitation-layout"><div className="invitation-editor">
 <h3>Personalizare</h3><label>Șablon<select value={design.theme} disabled={!writable} onChange={e=>update({theme:e.target.value as InvitationDesign['theme']})}><option value="classic">Clasic elegant</option><option value="modern">Modern minimalist</option><option value="floral">Floral romantic</option></select></label>
 <label>Titlu<input maxLength={120} disabled={!writable} value={design.headline} onChange={e=>update({headline:e.target.value})}/></label>
 <label>Mesaj<textarea maxLength={600} rows={5} disabled={!writable} value={design.message} onChange={e=>update({message:e.target.value})}/></label>
 <label>Locație<input maxLength={160} disabled={!writable} value={design.location} placeholder="Restaurant, adresă" onChange={e=>update({location:e.target.value})}/></label>
 <label>Ora evenimentului<input type="time" disabled={!writable} value={design.time} onChange={e=>update({time:e.target.value})}/></label>
 <label>Nume pentru previzualizare<select value={previewName} onChange={e=>setPreviewName(e.target.value)}><option value="">Exemplu</option>{data.guests.map(g=><option value={g.name} key={g.id}>{g.name}</option>)}</select></label>
 <p className="hint">Numele evenimentului și data provin din setările evenimentului. Le poți modifica din secțiunea de organizare.</p>
 </div><div className={'invitation-preview invitation-'+design.theme}><span className="invitation-kicker">WEDLY ✦ INVITAȚIE</span><span className="invitation-greeting">{sample}</span><h3>{design.headline}</h3><h2>{eventName}</h2><p>{design.message}</p><div className="invitation-details"><strong>{date}</strong>{design.time&&<span>Ora {design.time}</span>}{design.location&&<span>{design.location}</span>}{data.wedding.city&&<span>{data.wedding.city}</span>}</div><span className="invitation-footer">Confirmarea participării se face prin linkul RSVP individual.</span></div></div>
 <div className="invitation-next"><h3>Trimitere și confirmări</h3><p>Generează linkuri RSVP, trimite emailuri și urmărește răspunsurile direct în secțiunea Invitați. Șablonul selectat aici este folosit automat în emailuri.</p><Link href="/dashboard?view=guests" className="button">Deschide Invitați</Link></div>
 </section>;
}
