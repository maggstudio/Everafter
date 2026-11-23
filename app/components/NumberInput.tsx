'use client';
import {useState,type ComponentProps} from 'react';
type Props=Omit<ComponentProps<'input'>,'type'|'value'|'onChange'> & {value:number|string;onValueChange:(value:number)=>void};
export default function NumberInput({value,onValueChange,onBlur,onFocus,...props}:Props){
 const [draft,setDraft]=useState<string|null>(null);
 return <input {...props} type="number" value={draft??value} onFocus={e=>{setDraft(e.currentTarget.value);onFocus?.(e)}} onChange={e=>{const raw=e.currentTarget.value.replace(/^0+(?=\d)/,'');setDraft(raw);if(raw!==''&&e.currentTarget.validity.valid&&Number.isFinite(Number(raw)))onValueChange(Number(raw))}} onBlur={e=>{setDraft(null);onBlur?.(e)}}/>;
}
