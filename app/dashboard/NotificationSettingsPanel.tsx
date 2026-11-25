'use client';
import {useEffect,useState} from 'react';
import {supabase} from '../../lib/supabase';
import {useStore} from '../../lib/store';
import PushSettings from './PushSettings';
const defaults={rsvp:true,tasks:true,appointments:true,payments:true,assignments:true,countdown:true,digest:false,digest_hour:9,quiet_start:22,quiet_end:8};
type Prefs=typeof defaults;
const options=[['rsvp','Răspunsuri RSVP','guests'],['tasks','Termene sarcini','tasks'],['appointments','Programări','calendar'],['payments','Scadențe plăți','vendors'],['assignments','Sarcini atribuite','tasks'],['countdown','Numărătoare inversă','wedding'],['digest','Rezumat zilnic','wedding']] as const;
export default function NotificationSettingsPanel(){
 const {weddingId,can}=useStore();
 const [prefs,setPrefs]=useState<Prefs>(defaults),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[status,setStatus]=useState('');
 useEffect(()=>{let active=true;setLoading(true);setPrefs(defaults);setStatus('');
 (async()=>{try{if(!supabase||!weddingId)throw Error('Eveniment indisponibil.');
 const {data:{user}}=await supabase.auth.getUser();if(!user)throw Error('Autentificare necesară.');
 const {data,error}=await supabase.from('wedly_push_preferences').select('rsvp,tasks,appointments,payments,assignments,countdown,digest,digest_hour,quiet_start,quiet_end').eq('wedding_id',weddingId).eq('user_id',user.id).maybeSingle();
 if(error)throw Error('Preferințele push nu sunt încă disponibile.');
 if(active&&data)setPrefs({...defaults,...data});
 }catch(e){if(active)setStatus(e instanceof Error?e.message:'Eroare de încărcare.')}finally{if(active)setLoading(false)}})();return()=>{active=false}},[weddingId]);
 async function save(){if(!supabase||!weddingId||saving)return;setSaving(true);setStatus('');
 try{const {data:{user}}=await supabase.auth.getUser();if(!user)throw Error('Sesiune expirată.');
 const {error}=await supabase.from('wedly_push_preferences').upsert({wedding_id:weddingId,user_id:user.id,...prefs},{onConflict:'wedding_id,user_id'});
 if(error)throw Error('Preferințele nu au putut fi salvate.');setStatus('Preferințele push au fost salvate.');
 }catch(e){setStatus(e instanceof Error?e.message:'Eroare de salvare.')}finally{setSaving(false)}}
 return <><PushSettings/><section className="panel"><h2>Preferințele mele de notificare push</h2><p>Setări individuale pentru contul tău și evenimentul curent. Notificările automate necesită activarea serviciului pe dispozitiv.</p>
 {loading?<p>Se încarcă...</p>:<><div className="guest-unified-list">{options.map(([key,title,module])=><label className="list-row" key={key}><span>{title}</span><input type="checkbox" checked={prefs[key]} disabled={saving||!can(module,'read')} onChange={e=>setPrefs(p=>({...p,[key]:e.target.checked}))}/></label>)}</div>
 {([['digest_hour','Ora rezumatului'],['quiet_start','Început interval de liniște'],['quiet_end','Sfârșit interval de liniște']] as const).filter(([key])=>key!=='digest_hour'||prefs.digest).map(([key,title])=><label key={key}>{title} (ora României)<select disabled={saving} value={prefs[key]} onChange={e=>setPrefs(p=>({...p,[key]:Number(e.target.value)}))}>{Array.from({length:24},(_,i)=><option key={i} value={i}>{String(i).padStart(2,'0')}:00</option>)}</select></label>)}
 <p className="hint">Ore identice dezactivează intervalul de liniște.</p><button type="button" className="button" disabled={saving} onClick={save}>{saving?'Se salvează...':'Salvează preferințele'}</button></>}
 {status&&<p role="status">{status}</p>}</section></>;
}
