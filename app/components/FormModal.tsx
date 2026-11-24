'use client';
import {useEffect,useRef,useId,type ReactNode} from 'react';
export default function FormModal({title,onClose,children}:{title:string;onClose:()=>void;children:ReactNode}){
 const ref=useRef<HTMLDialogElement>(null),id=useId();
 useEffect(()=>{const d=ref.current,previous=document.activeElement as HTMLElement|null;if(d&&!d.open)d.showModal();return()=>{if(d?.open)d.close();previous?.focus({preventScroll:true})}},[]);
 return <dialog ref={ref} aria-labelledby={id} onCancel={e=>{e.preventDefault();onClose()}} style={{width:'min(600px, calc(100% - 24px))',maxHeight:'85dvh',overflowY:'auto',padding:0,border:0,borderRadius:18,background:'transparent',color:'inherit',boxShadow:'0 0 0 100vmax rgba(0,0,0,.5)'}}><section className="panel" style={{margin:0,padding:20}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12}}><h2 id={id}>{title}</h2><button type="button" className="text-button" aria-label="Închide formularul" onClick={onClose}>Închide ×</button></div>{children}</section></dialog>
}
