'use client';
import {useEffect,useState} from 'react';
import {RefreshCw} from 'lucide-react';
import {useStore} from '../../lib/store';
export default function PullRefresh(){
 const {refreshInPlace}=useStore();const [busy,setBusy]=useState(false);const [pull,setPull]=useState(0);
 useEffect(()=>{let start:number|null=null,x=0,distance=0,running=false;const media=matchMedia('(display-mode: standalone) and (max-width:900px)');
 const reset=()=>{start=null;distance=0;setPull(0)};
 const begin=(e:TouchEvent)=>{if(!media.matches||running||window.scrollY>1||e.touches.length!==1||!(e.target instanceof Element)||e.target.closest('input,textarea,select,button,[role=dialog],.notification-popover,.room-canvas'))return;start=e.touches[0].clientY;x=e.touches[0].clientX};
 const move=(e:TouchEvent)=>{if(start===null)return;const dy=e.touches[0].clientY-start;if(Math.abs(e.touches[0].clientX-x)>45||dy<0||window.scrollY>1){reset();return}distance=dy;setPull(Math.min(70,dy*.45));if(dy>10&&e.cancelable)e.preventDefault()};
 const end=()=>{const trigger=start!==null&&distance>=100;reset();if(!trigger||running)return;running=true;setBusy(true);void Promise.all([refreshInPlace(),new Promise(resolve=>setTimeout(resolve,450))]).catch(()=>{}).finally(()=>{running=false;setBusy(false)})};
 document.addEventListener('touchstart',begin,{passive:true});document.addEventListener('touchmove',move,{passive:false});document.addEventListener('touchend',end);document.addEventListener('touchcancel',reset);return()=>{document.removeEventListener('touchstart',begin);document.removeEventListener('touchmove',move);document.removeEventListener('touchend',end);document.removeEventListener('touchcancel',reset)}},[refreshInPlace]);
 return busy||pull>8?<div className="wedly-refresh-indicator" role="status" aria-label="Actualizare date" style={{transform:'translate(-50%,'+(busy?12:pull-35)+'px)'}}><RefreshCw size={22} className={busy?'wedly-spinning':''}/></div>:null
}
