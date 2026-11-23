'use client';
import {useEffect,useState} from 'react';
import {useStore} from '../../lib/store';
import {supabase} from '../../lib/supabase';
import type {Guest} from '../../lib/demo';
type RecordRow={id:string;guest_id:string;status:string;party_size:number;dietary_notes:string;expires_at:string;revoked_at:string|null;responded_at:string|null};
export default function RsvpPanel({guests,onEdit,onDelete,effectiveStatus,effectiveSize}:{guests:Guest[];onEdit:(g:Guest)=>void;onDelete:(g:Guest)=>void;effectiveStatus:(g:Guest)=>Guest['status'];effectiveSize:(g:Guest)=>number}){
 const {data,ready,weddingId,can}=useStore();
 const [rows,setRows]=useState<RecordRow[]>([]),[links,setLinks]=useState<Record<string,string>>({});
 const [expanded,setExpanded]=useState<string|null>(null),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 const writable=can('guests','write');
 async function load(){if(!supabase||!weddingId)return;const {data:result,error}=await supabase.rpc('rsvp_list',{p_wedding:weddingId});if(error)setMessage(error.message);else setRows((result||[]) as RecordRow[])}
 useEffect(()=>{setLinks({});setRows([]);setExpanded(null);void load();},[weddingId,ready]);
 async function issue(g:Guest){if(!supabase||!weddingId||!writable)return;setBusy(true);setMessage('');const {data:token,error}=await supabase.rpc('rsvp_issue',{p_wedding:weddingId,p_guest_id:g.id,p_guest_name:g.name});setBusy(false);if(error||!token){setMessage(error?.message||'Nu s-a generat linkul.');return}const url=window.location.origin+'/rsvp?token='+encodeURIComponent(token as string);setLinks(p=>({...p,[g.id]:url}));setMessage('Link generat. Copiază-l acum: nu poate fi recuperat ulterior. Expiră la primul răspuns; un link nou îl invalidează pe cel anterior.');await load()}
 async function revoke(id:string){if(!supabase||!weddingId||!writable||!window.confirm('Revoci linkul RSVP?'))return;setBusy(true);const {error}=await supabase.rpc('rsvp_revoke',{p_wedding:weddingId,p_guest_id:id});setBusy(false);setMessage(error?error.message:'Link revocat.');setLinks(p=>{const next={...p};delete next[id];return next});await load()}
 function invitationMessage(name:string,url:string){const w=data.wedding,d=w.invitationDesign;const event=w.eventType==='baptism'?'Botezul '+(w.childName||'copilului'):[w.first,w.second].filter(Boolean).join(' & ');const family:string[]=[];const add=(label:string,value?:string)=>{if(value?.trim())family.push(label+': '+value.trim())};if(w.eventType==='baptism'){if(d?.showGodparents!==false)add('Nașii copilului',w.godparents);if(d?.showGrandparents!==false)add('Moșii copilului',w.childGrandparents)}else{if(d?.showParents!==false){add('Părinții miresei',w.brideParents);add('Părinții mirelui',w.groomParents)}if(d?.showGodparents!==false)add('Nașii de cununie',w.weddingGodparents)}return ['Dragă '+name+',',d?.headline||'Te invităm să sărbătorim împreună!',event,d?.message||'Te așteptăm cu drag!',...family,w.date?new Date(w.date+'T12:00:00').toLocaleDateString('ro-RO'):'Data urmează să fie confirmată',d?.time?'Ora '+d.time:'',d?.location||'',w.city||'','Confirmă participarea aici: '+url].filter(Boolean).join('\n\n')}
 function share(g:Guest,channel:'whatsapp'|'instagram'|'messenger'|'email'){
  const link=links[g.id];if(!link){setMessage('Generează mai întâi linkul RSVP pentru acest invitat.');return}
  const text=invitationMessage(g.name,link);
  if(channel==='email'){window.location.href='mailto:?subject='+encodeURIComponent('Invitație – '+g.name)+'&body='+encodeURIComponent(text);return}
  if(channel==='whatsapp'){
   const phone=(g.phone||'').replace(/\D/g,'');const normalized=phone.startsWith('0')?'40'+phone.slice(1):phone;
   window.open('https://wa.me/'+(normalized||'')+'?text='+encodeURIComponent(text),'_blank','noopener,noreferrer');return
  }
  // Instagram and Messenger do not offer a reliable web API for prefilled private messages.
  // Copy the personalized invitation and open the official inbox for manual sending.
  void navigator.clipboard.writeText(text).then(()=>setMessage('Invitația a fost copiată. Lipește mesajul în conversația deschisă.')).catch(()=>setMessage('Copiază invitația manual folosind butonul de mai jos.'));
  window.open(channel==='instagram'?'https://www.instagram.com/direct/inbox/':'https://www.messenger.com/','_blank','noopener,noreferrer');
 }
 const responseLabel=(g:Guest,r?:RecordRow)=>{if(r?.responded_at)return r.status==='confirmat'?'Confirmat online':r.status==='refuzat'?'Refuzat online':'Răspuns primit';const status=effectiveStatus(g);return status==='confirmat'?'Confirmat manual':status==='refuzat'?'Refuzat manual':'În așteptare'};
 return <div className="guest-unified-list">
 <div className="guest-list-toolbar"><span className="hint">{guests.length} invitați afișați · Deschide „Invită / RSVP” pentru link și distribuire din conturile tale.</span><button type="button" className="text-button" onClick={()=>{void load()}}>Actualizează RSVP</button></div>
 {message&&<p role="status" className="hint">{message}</p>}
 <div className="guest-table-scroll"><table className="guest-data-table"><thead><tr><th scope="col">Nume / familie</th><th scope="col">Persoane</th><th scope="col">Link RSVP</th><th scope="col">Răspuns</th><th scope="col">Acțiuni</th></tr></thead><tbody>
 {guests.map(g=>{const r=rows.find(x=>x.guest_id===g.id);const open=expanded===g.id;return <tr key={g.id} className={open?'guest-table-expanded':''}>
 <td data-label="Invitat"><strong>{g.name}</strong><small>{g.group||'Altele'}</small></td>
 <td data-label="Persoane" className="guest-table-count">{effectiveSize(g)}</td>
 <td data-label="Link RSVP"><span className="guest-status-chip guest-status-muted">{r?.responded_at?'Utilizat':r?.revoked_at?'Revocat':r?'Generat':'Negenerat'}</span></td>
 <td data-label="Răspuns"><span className={'guest-status-chip '+(effectiveStatus(g)==='confirmat'?'guest-status-ok':effectiveStatus(g)==='refuzat'?'guest-status-error':'guest-status-muted')}>{responseLabel(g,r)}</span></td>
 <td data-label="Acțiuni"><div className="guest-table-actions">{writable&&<button type="button" className="text-button" onClick={()=>onEdit(g)}>Editează</button>}<button type="button" className="text-button" aria-expanded={open} aria-controls={'guest-detail-'+g.id} onClick={()=>setExpanded(open?null:g.id)}>{open?'Închide':'Invită / RSVP'}</button></div></td>
 </tr>})}</tbody></table></div>
 {expanded&&guests.some(g=>g.id===expanded)&&(()=>{const g=guests.find(x=>x.id===expanded)!;const r=rows.find(x=>x.guest_id===g.id);return <div className="guest-rsvp-detail guest-table-detail" id={'guest-detail-'+g.id}><div className="guest-detail-header"><h3>{g.name}</h3><button type="button" className="text-button" onClick={()=>setExpanded(null)}>Închide ×</button></div><p className="hint">{[g.phone].filter(Boolean).join(' · ')||'Fără date de contact'} · {r?(r.responded_at?'Link utilizat · RSVP primit':r.revoked_at?'Link revocat':'Link RSVP activ'):'Fără link RSVP'}</p>
 {g.notes&&<p className="hint">Note: {g.notes}</p>}
 {r&&<p className="hint">Răspuns: {r.status} · {r.party_size} persoane{r.dietary_notes?' · '+r.dietary_notes:''}</p>}
 {writable&&<div className="row-controls"><button type="button" className="button" disabled={busy} onClick={()=>void issue(g)}>{r?'Generează link nou':'Generează link RSVP'}</button>{r&&!r.revoked_at&&!r.responded_at&&<button type="button" className="text-button" disabled={busy} onClick={()=>void revoke(g.id)}>Revocă linkul</button>}<button type="button" className="text-button" onClick={()=>onEdit(g)}>Editează datele</button><button type="button" className="text-button" onClick={()=>onDelete(g)}>Șterge invitatul</button></div>}
 {links[g.id]&&<div className="guest-rsvp-link"><input readOnly aria-label={'Link RSVP '+g.name} value={links[g.id]}/><div className="row-controls"><button type="button" className="text-button" onClick={()=>void navigator.clipboard.writeText(links[g.id])}>Copiază linkul</button><button type="button" className="text-button" onClick={()=>void navigator.clipboard.writeText(invitationMessage(g.name,links[g.id]))}>Copiază invitația</button></div><div className="row-controls"><button type="button" className="button secondary" onClick={()=>share(g,'whatsapp')}>WhatsApp</button><button type="button" className="button secondary" onClick={()=>share(g,'instagram')}>Instagram</button><button type="button" className="button secondary" onClick={()=>share(g,'messenger')}>Messenger</button><button type="button" className="button secondary" onClick={()=>share(g,'email')}>Email personal</button></div><p className="hint">WhatsApp pregătește mesajul. Instagram și Messenger copiază mesajul și deschid aplicația, unde îl lipești manual. Email deschide aplicația ta de email.</p></div>}
 
 </div>})()}
 </div>
}
