'use client';
import {useEffect,useState} from 'react';
import {supabase} from '../../lib/supabase';
import {useStore} from '../../lib/store';
import RemindersPanel from './RemindersPanel';
type Key='rsvp_immediate'|'daily_digest'|'task_reminders'|'appointment_reminders'|'payment_reminders';
type Preferences=Record<Key,boolean>&{digest_hour:number};
const defaults:Preferences={rsvp_immediate:false,daily_digest:false,task_reminders:false,appointment_reminders:false,payment_reminders:false,digest_hour:9};
const options:{key:Key;title:string;description:string;module:'guests'|'tasks'|'calendar'|'vendors'|null}[]=[
 {key:'rsvp_immediate',title:'Fiecare răspuns RSVP',description:'Email când un invitat confirmă, refuză sau își modifică răspunsul.',module:'guests'},
 {key:'daily_digest',title:'Rezumat zilnic',description:'Situația evenimentului într-un singur email pe zi.',module:null},
 {key:'task_reminders',title:'Termene checklist',description:'Alerte pentru sarcinile cu termen apropiat sau depășit.',module:'tasks'},
 {key:'appointment_reminders',title:'Programări',description:'Alerte pentru programările viitoare.',module:'calendar'},
 {key:'payment_reminders',title:'Scadențe furnizori',description:'Alerte pentru plățile scadente sau întârziate.',module:'vendors'}
];
export default function NotificationSettingsPanel(){
 const {weddingId,can}=useStore();
 const [prefs,setPrefs]=useState<Preferences>(defaults),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[status,setStatus]=useState('');
 const [email,setEmail]=useState('');
 useEffect(()=>{let active=true;setLoading(true);setStatus('');setPrefs(defaults);
 (async()=>{if(!supabase||!weddingId){if(active){setStatus('Conexiunea nu este disponibilă.');setLoading(false)}return}
 const {data:{user}}=await supabase.auth.getUser();if(!active)return;if(!user){setStatus('Autentificare necesară.');setLoading(false);return}
 setEmail(user.email||'');
 const {data,error}=await supabase.from('notification_preferences').select('rsvp_immediate,daily_digest,task_reminders,appointment_reminders,payment_reminders,digest_hour').eq('wedding_id',weddingId).eq('user_id',user.id).maybeSingle();
 if(!active)return;if(error)setStatus('Nu se pot încărca preferințele. Aplică migrarea SQL pentru notificări. '+error.message);
 else if(data)setPrefs({...defaults,...data});setLoading(false);
 })();return()=>{active=false}},[weddingId]);
 async function save(){if(!supabase||!weddingId||saving)return;setSaving(true);setStatus('');
 const {data:{user}}=await supabase.auth.getUser();if(!user){setStatus('Sesiune expirată.');setSaving(false);return}
 const {error}=await supabase.from('notification_preferences').upsert({wedding_id:weddingId,user_id:user.id,...prefs,updated_at:new Date().toISOString()},{onConflict:'wedding_id,user_id'});
 setStatus(error?'Nu s-au salvat setările: '+error.message:'Preferințele au fost salvate pentru contul tău și acest eveniment.');setSaving(false)}
 return <><section className="panel"><h2>Preferințele mele de notificare</h2><p>Fiecare membru al echipei își alege separat ce mesaje dorește să primească. Setările se aplică numai contului tău și evenimentului curent.</p><p><strong>Destinatar:</strong> {email||'Se încarcă...'}</p>
 <p className="hint">Configurarea preferințelor este disponibilă acum. Expedierea automată a acestor emailuri va fi activată într-o etapă separată; bifarea unei opțiuni nu pornește încă trimiterea.</p>
 {loading?<p>Se încarcă preferințele...</p>:<><div className="guest-unified-list">{options.map(o=><label key={o.key} className="list-row"><span><strong>{o.title}</strong><small>{o.description}{o.module&&!can(o.module==='vendors'?'vendors':o.module,'read')?' · Nu ai acces la modulul asociat':''}</small></span><input type="checkbox" checked={prefs[o.key]} disabled={Boolean(o.module&&!can(o.module,'read'))} onChange={e=>setPrefs(p=>({...p,[o.key]:e.target.checked}))}/></label>)}</div>
 {prefs.daily_digest&&<label>Ora preferată pentru rezumat (ora României) <select value={prefs.digest_hour} onChange={e=>setPrefs(p=>({...p,digest_hour:Number(e.target.value)}))}>{Array.from({length:24},(_,i)=><option key={i} value={i}>{String(i).padStart(2,'0')}:00</option>)}</select></label>}
 <div className="actions"><button type="button" className="button" disabled={saving} onClick={save}>{saving?'Se salvează...':'Salvează preferințele'}</button></div></>}
 {status&&<p role="status">{status}</p>}</section><RemindersPanel/></>;
}
