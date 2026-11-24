'use client';
import {MoreVertical, Users, Send, Pencil, Trash2, X, Link2, Copy, Share2, Mail, Instagram, LoaderCircle} from 'lucide-react';
import {useEffect,useState,useRef} from 'react';
import FormModal from '../components/FormModal';
import {useStore} from '../../lib/store';
import {supabase} from '../../lib/supabase';
import type {Guest} from '../../lib/demo';
type RecordRow={id:string;guest_id:string;status:string;party_size:number;dietary_notes:string;expires_at:string;revoked_at:string|null;responded_at:string|null};
export default function RsvpPanel({guests,onEdit,onDelete,effectiveStatus,effectiveSize}:{guests:Guest[];onEdit:(g:Guest)=>void;onDelete:(g:Guest)=>void;effectiveStatus:(g:Guest)=>Guest['status'];effectiveSize:(g:Guest)=>number}){
 const {data,ready,weddingId,can}=useStore();
 const [rows,setRows]=useState<RecordRow[]>([]),[links,setLinks]=useState<Record<string,string>>({});
 const [expanded,setExpanded]=useState<string|null>(null),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 const [actions,setActions]=useState<Guest|null>(null);
 const dialogRef=useRef<HTMLDialogElement>(null);
 const opener=useRef<HTMLButtonElement|null>(null);
 const selected=guests.find(g=>g.id===expanded);
 useEffect(()=>{const dialog=dialogRef.current;if(selected&&dialog&&!dialog.open)dialog.showModal();else if(!selected&&dialog?.open)dialog.close()},[selected,expanded]);
 function closeDetail(){if(busy)return;setExpanded(null);setMessage('');requestAnimationFrame(()=>opener.current?.focus())}
 const writable=can('guests','write');
 async function load(){if(!supabase||!weddingId)return;const {data:result,error}=await supabase.rpc('rsvp_list',{p_wedding:weddingId});if(error)setMessage(error.message);else setRows((result||[]) as RecordRow[])}
 useEffect(()=>{setLinks({});setRows([]);setExpanded(null);void load();},[weddingId,ready]);
 async function issue(g:Guest){
  if(!supabase||!weddingId||!writable)return;
  setBusy(true);setMessage('');setLinks(p=>{const next={...p};delete next[g.id];return next});
  try{
   const {data:token,error}=await supabase.rpc('rsvp_share_link',{p_wedding:weddingId,p_guest_id:g.id,p_guest_name:g.name});
   if(error||!token){setMessage(error?.message||'Nu am putut pregăti invitația.');return}
   const url=window.location.origin+'/rsvp?token='+encodeURIComponent(token as string);
   setLinks(p=>({...p,[g.id]:url}));
   setMessage('');
   await load();
  }catch{setMessage('Invitația nu a putut fi pregătită. Încearcă din nou.')}finally{setBusy(false)}
 }
 async function revoke(id:string){
  if(!supabase||!weddingId||!writable||!window.confirm('Anulezi această invitație? Linkul nu va mai putea fi folosit.'))return;
  setBusy(true);
  try{
   const {error}=await supabase.rpc('rsvp_cancel_shared_link',{p_wedding:weddingId,p_guest_id:id});
   setMessage(error?error.message:'Invitația a fost anulată.');
   if(!error){setLinks(p=>{const next={...p};delete next[id];return next});setExpanded(null)}
   await load();
  }finally{setBusy(false)}
 }
 function invitationMessage(name:string,url:string){const w=data.wedding,d=w.invitationDesign;const event=w.eventType==='baptism'?(w.childName?.trim()?'Botezul lui '+w.childName.trim():'Botezul copilului'):[w.first,w.second].filter(Boolean).join(' & ');const family:string[]=[];const add=(label:string,value?:string)=>{if(value?.trim())family.push(label+': '+value.trim())};if(w.eventType==='baptism'){if(d?.showParents!==false)add('Părinții copilului',[w.first,w.second].filter(Boolean).join(' și '));if(d?.showGodparents!==false)add('Nașii copilului',w.godparents);if(d?.showGrandparents!==false)add('Moșii copilului',w.childGrandparents)}else{if(d?.showParents!==false){add('Părinții miresei',w.brideParents);add('Părinții mirelui',w.groomParents)}if(d?.showGodparents!==false)add('Nașii de cununie',w.weddingGodparents)}return ['Dragă '+name+',',d?.headline||'Te invităm să sărbătorim împreună!',event,d?.message||'Te așteptăm cu drag!',...family,w.date?new Date(w.date+'T12:00:00').toLocaleDateString('ro-RO'):'Data urmează să fie confirmată',d?.time?'Ora '+d.time:'',d?.location||'',w.city||'','Confirmă participarea aici: '+url].filter(Boolean).join('\n\n')}
 async function share(g:Guest,channel:'whatsapp'|'instagram'|'messenger'|'email'){
  const link=links[g.id];if(!link){setMessage('Apasă «Invită» pentru a pregăti invitația.');return}
  const text=invitationMessage(g.name,link);
  if(channel==='email'){window.location.href='mailto:?subject='+encodeURIComponent('Invitație – '+g.name)+'&body='+encodeURIComponent(text);return}
  if(channel==='whatsapp'){
   const phone=(g.phone||'').replace(/\D/g,'');const normalized=phone.startsWith('0')?'40'+phone.slice(1):phone;
   window.open('https://wa.me/'+(normalized||'')+'?text='+encodeURIComponent(text),'_blank','noopener,noreferrer');return
  }
  if(navigator.share){try{await navigator.share({text});return}catch(e){if(e instanceof Error&&e.name==='AbortError')return}}
  try{await navigator.clipboard.writeText(text);setMessage('Mesaj copiat. Deschide '+(channel==='messenger'?'Messenger':'Instagram')+' și lipește invitația în conversație.')}catch{setMessage('Partajarea nu este disponibilă. Încearcă să copiezi linkul.')}

 }
 const rowMap=new Map(rows.map(r=>[r.guest_id,r]));
 const responseLabel=(g:Guest,r?:RecordRow)=>{if(r?.responded_at)return r.status==='confirmat'?'Confirmat online':r.status==='refuzat'?'Refuzat online':'Răspuns primit';const status=effectiveStatus(g);return status==='confirmat'?'Confirmat manual':status==='refuzat'?'Refuzat manual':'În așteptare'};
 return <div className="guest-unified-list">
 <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:8,margin:'12px 0'}}><strong>{guests.length} invitați / grupuri</strong><button type="button" className="text-button" onClick={()=>void load()}>Actualizează RSVP</button></div>
 {message&&!expanded&&<p role="status" className="hint">{message}</p>}
 <div style={{border:'1px solid var(--border, #aaa6)',borderRadius:12,overflow:'hidden'}}>
 {guests.map(g=>{const r=rowMap.get(g.id);const active=!!r&&!r.revoked_at&&!r.responded_at&&new Date(r.expires_at).getTime()>Date.now();const status=effectiveStatus(g);return <div key={g.id} style={{display:'grid',gridTemplateColumns:'minmax(0,1fr) 38px 36px',alignItems:'center',gap:6,padding:'7px 9px',minHeight:52,borderBottom:'1px solid var(--border, #aaa4)'}}>
 <div style={{minWidth:0}}><strong style={{display:'block',fontSize:14,lineHeight:1.25,overflowWrap:'anywhere'}}>{g.name}</strong><div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap',fontSize:11,lineHeight:1.3}}><span className={'guest-status-chip '+(status==='confirmat'?'guest-status-ok':status==='refuzat'?'guest-status-error':'guest-status-muted')} style={{padding:'1px 5px',fontSize:11}}>{status==='confirmat'?'Confirmat':status==='refuzat'?'Refuzat':'În așteptare'}</span><span className="hint">{r?.responded_at?'Online':r?.revoked_at?'Anulată':active?'Pregătită':r?'Expirată':'Neinvitat'}</span></div></div>
 <span title="Număr persoane" style={{display:'flex',alignItems:'center',justifyContent:'center',gap:3,fontSize:12}}><Users size={14}/>{effectiveSize(g)}</span>
 {writable&&<button type="button" aria-label={'Acțiuni pentru '+g.name} className="text-button" style={{display:'grid',placeItems:'center',width:36,height:40,padding:0}} onClick={e=>{opener.current=e.currentTarget;setActions(g)}}><MoreVertical size={20}/></button>}
 </div>})}
 </div>
 {actions&&<FormModal title={actions.name} onClose={()=>setActions(null)}><div style={{display:'grid',gap:10}}>{!rowMap.get(actions.id)?.responded_at&&<button type="button" className="button" disabled={busy} onClick={()=>{const g=actions;setActions(null);setMessage('');setExpanded(g.id);void issue(g)}}><Send size={17}/> {rowMap.get(actions.id)&&!rowMap.get(actions.id)?.revoked_at?'Distribuie invitația':'Invită'}</button>}<button type="button" className="button secondary" onClick={()=>{const g=actions;setActions(null);onEdit(g)}}><Pencil size={17}/> Editează</button><button type="button" className="button secondary" onClick={()=>{const g=actions;setActions(null);onDelete(g)}}><Trash2 size={17}/> Șterge invitatul</button></div></FormModal>}
 <dialog ref={dialogRef} id="guest-invite-dialog" aria-labelledby="guest-invite-title" onCancel={e=>{e.preventDefault();closeDetail()}} style={{width:'min(440px, calc(100% - 32px))',maxHeight:'85dvh',overflowY:'auto',padding:0,border:0,borderRadius:24,background:'transparent',boxShadow:'0 0 0 100vmax rgba(0,0,0,.55)'}}>
 {selected&&(()=>{const g=selected;const r=rows.find(x=>x.guest_id===g.id);const count=effectiveSize(g);const available=writable&&!busy&&!r?.responded_at&&!r?.revoked_at&&!!links[g.id];
 const copy=async(full:boolean)=>{try{await navigator.clipboard.writeText(full?invitationMessage(g.name,links[g.id]):links[g.id]);setMessage(full?'Invitație copiată.':'Link copiat.')}catch{setMessage('Copierea nu a reușit. Încearcă din nou.')}};
 const tile={display:'flex',flexDirection:'column' as const,alignItems:'center',justifyContent:'center',gap:8,minHeight:84,padding:'12px 4px',borderRadius:14,fontSize:13,fontWeight:600,width:'100%'};
 return <section className="panel" style={{margin:0,padding:20,border:0,borderRadius:24}}>
 <header style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12}}><div><h2 id="guest-invite-title" style={{margin:'0 0 5px',fontSize:22,lineHeight:1.2,overflowWrap:'anywhere'}}>{g.name}</h2><small className="hint">{count} {count===1?'persoană':'persoane'} · {responseLabel(g,r)}</small></div><button type="button" className="button secondary" aria-label="Închide" disabled={busy} onClick={closeDetail} style={{padding:8,minWidth:40,minHeight:40,borderRadius:12}}><X size={20}/></button></header>
 {busy&&<p role="status" style={{display:'flex',alignItems:'center',gap:8}}><LoaderCircle size={18}/> Se pregătește invitația…</p>}
 {message&&<p role="status" className="hint" style={{margin:'12px 0'}}>{message}</p>}
 {writable&&!busy&&!r?.responded_at&&!links[g.id]&&<button type="button" className="button" onClick={()=>void issue(g)}>Încearcă din nou</button>}
 {available&&<div style={{display:'grid',gap:12,marginTop:20}}>
 <button type="button" className="button" style={{display:'flex',justifyContent:'center',alignItems:'center',gap:8,width:'100%'}} onClick={async()=>{try{const text=invitationMessage(g.name,links[g.id]);if(navigator.share)await navigator.share({title:'Invitație WEDLY',text});else await copy(true)}catch(e){if(!(e instanceof Error&&e.name==='AbortError'))setMessage('Partajarea nu a reușit.')}}}><Share2 size={19}/> Partajează invitația</button>
 <div style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:8}}>
 <button type="button" className="button secondary" style={tile} onClick={()=>share(g,'whatsapp')}><svg width="28" height="28" viewBox="0 0 24 24" fill="#25D366" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.7 15L2 22l5.1-1.3A10 10 0 1 0 12 2Z"/><path fill="white" d="M8 6.5c-.7 0-1.5 1-1.5 2.2 0 3.6 4.4 7.7 8 8.1 1.3.1 2.8-.8 2.8-2l-.1-.5-2.6-1.3c-.4-.2-.7 0-1.2.8-.2.3-.5.4-.9.2-1.8-.8-3-2-3.7-3.5-.2-.4.1-.6.4-1 .3-.3.3-.6.1-1l-1-2z"/></svg>WhatsApp</button>
 <button type="button" className="button secondary" style={tile} onClick={()=>void share(g,'messenger')}><svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true"><path fill="#0866FF" d="M12 2C6.4 2 2 6.1 2 11.5c0 3 1.4 5.6 3.7 7.3V22l3.3-1.8c1 .3 2 .5 3 .5 5.6 0 10-4 10-9.2S17.6 2 12 2Z"/><path fill="white" d="m5.8 14.4 4.1-5.2 3.4 2.6 4.8-2.6-4.2 5.3-3.4-2.6z"/></svg>Messenger</button>
 <button type="button" className="button secondary" style={tile} onClick={()=>void share(g,'instagram')}><Instagram size={28} color="#D62976"/>Instagram</button>
 <button type="button" className="button secondary" style={tile} onClick={()=>share(g,'email')}><Mail size={28}/>Email</button>
 <button type="button" className="button secondary" style={tile} onClick={()=>void copy(false)}><Link2 size={24}/>Copiază linkul</button>
 <button type="button" className="button secondary" style={tile} onClick={()=>void copy(true)}><Copy size={24}/>Copiază mesajul</button>
 </div><small className="hint" style={{lineHeight:1.45}}>Pentru Messenger și Instagram, alege aplicația din meniul de partajare al telefonului. Dacă nu este disponibilă, copiază mesajul.</small>
 <button type="button" className="button secondary" style={{width:'100%',color:'#b45353',marginTop:4}} onClick={()=>void revoke(g.id)}>Anulează invitația</button>
 </div>}
 </section>})()}
 </dialog>
 </div>
}
