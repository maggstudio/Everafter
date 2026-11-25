import type {CSSProperties} from 'react';
export const invitationFonts=[
 ['default','Fontul designului','inherit'],['georgia','Georgia','Georgia, serif'],['times','Times New Roman','"Times New Roman", serif'],['palatino','Palatino','"Palatino Linotype", Palatino, serif'],['garamond','Garamond','Garamond, Georgia, serif'],['baskerville','Baskerville','Baskerville, Georgia, serif'],['arial','Arial','Arial, sans-serif'],['verdana','Verdana','Verdana, sans-serif'],['trebuchet','Trebuchet','"Trebuchet MS", sans-serif'],['tahoma','Tahoma','Tahoma, sans-serif'],['script','Script','"Segoe Script", "Apple Chancery", cursive'],['cursive','Caligrafic','"Brush Script MT", cursive'],['century','Century Gothic','"Century Gothic", sans-serif']
] as const;
export type TextStyle={font?:string;color?:string;align?:'left'|'center'|'right';spacing?:number;size?:number;text?:string};
export type InvitationTextStyles=Record<string,TextStyle>;
export function invitationTextStyle(styles:InvitationTextStyles|undefined,key:string):CSSProperties{
 const s=styles?.[key];if(!s)return {};
 return {fontFamily:invitationFonts.find(f=>f[0]===s.font)?.[2],color:typeof s.color==='string'&&/^#[0-9a-f]{6}$/i.test(s.color)?s.color:undefined,textAlign:['left','center','right'].includes(s.align||'')?s.align:undefined,marginTop:typeof s.spacing==='number'?Math.max(0,Math.min(48,s.spacing)):undefined,fontSize:typeof s.size==='number'?Math.max(70,Math.min(160,s.size))+'%':undefined,overflowWrap:'anywhere'};
}
export function invitationText(styles:InvitationTextStyles|undefined,key:string,fallback:string){const t=styles?.[key]?.text;return typeof t==='string'&&t.trim()?t.slice(0,600):fallback}
