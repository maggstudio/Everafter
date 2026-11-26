'use client';
import {RotateCcw} from 'lucide-react';
export default function ResetFilters({active,onReset}:{active:boolean;onReset:()=>void}){return active?<button type="button" className="wedly-reset-filters" onClick={onReset}><RotateCcw size={14} aria-hidden="true"/> Resetează filtrele</button>:null}
