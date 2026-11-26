'use client';
import {useEffect,useRef,useId,type ReactNode} from 'react';
export default function FormModal({title,onClose,children}:{title:string;onClose:()=>void;children:ReactNode}){
 const ref=useRef<HTMLDialogElement>(null),id=useId();
 useEffect(()=>{const d=ref.current,previous=document.activeElement as HTMLElement|null;if(d&&!d.open)d.showModal();return()=>{if(d?.open)d.close();previous?.focus({preventScroll:true})}},[]);
 return <dialog ref={ref} className="wedly-form-sheet" aria-labelledby={id} onCancel={e=>{e.preventDefault();onClose()}}><section className="panel wedly-form-sheet-panel"><header className="wedly-form-sheet-header"><div><small>ORGANIZARE EVENIMENT</small><h2 id={id}>{title}</h2></div><button type="button" className="wedly-form-sheet-close" aria-label="Închide formularul" onClick={onClose}>×</button></header><div className="wedly-form-sheet-body">{children}</div></section></dialog>
}
