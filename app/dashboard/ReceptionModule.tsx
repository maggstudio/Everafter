'use client';
import {useState} from 'react';
import {Users,Settings,QrCode,Wallet} from 'lucide-react';
import {useStore} from '../../lib/store';
import ReceptionPanel from './ReceptionPanel';
import GiftCountingPanel from './GiftCountingPanel';
import CheckInPanel from './CheckInPanel';
export default function ReceptionModule(){
 const {can,weddingId}=useStore();const [tab,setTab]=useState<'live'|'settings'|'poster'|'gifts'>('live');
 if(!can('wedding','read')||!can('guests','read'))return <section className="panel">Nu ai acces la recepție.</section>;
 return <div className="reception-module"><section className="panel"><span className="eyebrow">ZIUA EVENIMENTULUI</span><h2>Ziua evenimentului</h2><p>Gestionează sosirile, codul QR și registrul darurilor.</p><nav className="reception-tabs" aria-label="Secțiuni recepție">{([{id:'live',label:'Recepție live',Icon:Users},{id:'settings',label:'Pagină publică',Icon:Settings},{id:'poster',label:'Afiș & QR',Icon:QrCode},{id:'gifts',label:'Numărarea darului',Icon:Wallet}] as const).map(({id,label,Icon})=><button key={id} type="button" className={'button '+(tab===id?'':'secondary')} aria-pressed={tab===id} onClick={()=>setTab(id)}><Icon size={20}/>{label}</button>)}</nav></section>{tab==='gifts'?<section className="panel"><GiftCountingPanel key={weddingId}/></section>:tab==='live'?<CheckInPanel key={weddingId}/>:<ReceptionPanel key={weddingId+tab} mode={tab==='settings'?'settings':'poster'}/>}</div>
}
