'use client';
import {useEffect,useState,type ReactNode} from 'react';
import Link from 'next/link';
import {CalendarDays,Settings2,Users,Bell,Palette,History,ShieldCheck,MessageCircle,ChartNoAxesCombined,LogOut,ChevronRight,ArrowLeft,type LucideIcon} from 'lucide-react';
import AccountProfile from '../components/AccountProfile';
import ThemeSettings from '../components/ThemeSettings';
import ActivityLog from './ActivityLog';
import NotificationSettingsPanel from './NotificationSettingsPanel';
type Detail='notifications'|'appearance'|'activity';
function Item({icon:Icon,title,description,href,onClick}:{icon:LucideIcon;title:string;description:string;href?:string;onClick?:()=>void}){
 const content=<><span className="settings-tile-icon"><Icon size={21} strokeWidth={1.65}/></span><span className="settings-tile-copy"><strong>{title}</strong><small>{description}</small></span><ChevronRight className="settings-tile-chevron" size={18} strokeWidth={1.5}/></>;
 return href?<Link className="settings-tile" href={href}>{content}</Link>:<button type="button" className="settings-tile" onClick={onClick}>{content}</button>;
}
function Group({title,description,children}:{title:string;description:string;children:ReactNode}){return <section className="panel settings-group"><header><h2>{title}</h2><p>{description}</p></header><div className="settings-group-items">{children}</div></section>}
export default function SettingsHub({weddingId,platformAdmin,notifications,onLogout}:{weddingId:string|null|undefined;platformAdmin:boolean;notifications:boolean;onLogout:()=>Promise<void>}){
 const [detail,setDetail]=useState<Detail|null>(notifications?'notifications':null);
 useEffect(()=>{setDetail(notifications?'notifications':null)},[notifications]);
 const open=(next:Detail|null)=>{setDetail(next);window.scrollTo({top:0,behavior:'instant'})};
 const query=weddingId?'?wedding='+encodeURIComponent(weddingId):'';
 if(detail)return <section className="settings-detail"><button type="button" className="settings-back" onClick={()=>open(null)}><ArrowLeft size={18}/> Toate setările</button><div className="settings-detail-content">{detail==='notifications'?<NotificationSettingsPanel/>:detail==='appearance'?<ThemeSettings/>:<section className="panel"><h2>Jurnal de activitate</h2><p>Urmărește modificările recente din eveniment.</p><ActivityLog key={weddingId}/></section>}</div></section>;
 return <section className="settings-workspace">
 <div className="settings-profile-card"><div><span className="settings-profile-kicker">CONTUL TĂU WEDLY</span><AccountProfile/></div><button type="button" className="settings-logout" onClick={()=>void onLogout()}><LogOut size={18}/> Deconectare</button></div>
 <div className="settings-group-grid">
 <Group title="Evenimentul meu" description="Gestionează evenimentele și persoanele implicate.">
 <Item icon={CalendarDays} title="Evenimentele mele" description="Schimbă sau gestionează evenimentele" href="/events"/>
 <Item icon={Settings2} title="Configurarea evenimentului" description="Date, buget și detalii" href={'/setup'+query}/>
 <Item icon={Users} title="Echipa și accesul" description="Colaboratori și permisiuni" href={'/team'+query}/>
 </Group>
 <Group title="Preferințe personale" description="Personalizează experiența WEDLY.">
 <Item icon={Bell} title="Notificări push" description="Alerte, rezumate și interval de liniște" onClick={()=>open('notifications')}/>
 <Item icon={Palette} title="Aspectul aplicației" description="Temă luminoasă, întunecată sau automată" onClick={()=>open('appearance')}/>
 </Group>
 <Group title="Confidențialitate și activitate" description="Controlează datele și urmărește modificările.">
 <Item icon={History} title="Jurnal de activitate" description="Istoricul modificărilor din eveniment" onClick={()=>open('activity')}/>
 <Item icon={ShieldCheck} title="Datele mele și GDPR" description="Confidențialitate și date personale" href="/privacy"/>
 </Group>
 <Group title="Ajutor și suport" description="Suntem aici pentru tine.">
 <Item icon={MessageCircle} title="Contact și suport" description="Întrebări, sugestii și feedback" href="/contact"/>
 {platformAdmin&&<Item icon={ChartNoAxesCombined} title="Monitorizare WEDLY" description="Administrarea platformei" href="/admin"/>}
 </Group>
 </div></section>
}
