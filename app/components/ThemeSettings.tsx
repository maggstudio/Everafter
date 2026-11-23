'use client';
import {useEffect,useState} from 'react';
import {Sun,Moon,Monitor} from 'lucide-react';
type Theme='light'|'dark'|'system';
const storageKey='wedly-theme';
function apply(theme:Theme){const dark=theme==='dark'||(theme==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.wedlyTheme=dark?'dark':'light';}
function read():Theme{try{const v=localStorage.getItem(storageKey);return v==='dark'||v==='light'?v:'system'}catch{return 'system'}}
export function ThemeController(){useEffect(()=>{const media=window.matchMedia('(prefers-color-scheme: dark)');const sync=()=>apply(read());sync();media.addEventListener('change',sync);window.addEventListener('storage',sync);return()=>{media.removeEventListener('change',sync);window.removeEventListener('storage',sync)}},[]);return null}
export default function ThemeSettings(){const [theme,setTheme]=useState<Theme>('system');useEffect(()=>{setTheme(read())},[]);const options=[{id:'light',label:'Luminos',Icon:Sun},{id:'dark',label:'Întunecat',Icon:Moon},{id:'system',label:'Automat',Icon:Monitor}] as const;return <section className="panel"><h2>Aspectul aplicației</h2><p>Alege tema preferată. Setarea este memorată pe acest dispozitiv și nu schimbă designul invitațiilor.</p><div className="theme-options" role="group" aria-label="Tema aplicației">{options.map(({id,label,Icon})=><button type="button" key={id} aria-pressed={theme===id} onClick={()=>{setTheme(id);try{localStorage.setItem(storageKey,id)}catch{}apply(id)}}><Icon size={22}/><span>{label}</span></button>)}</div></section>}
