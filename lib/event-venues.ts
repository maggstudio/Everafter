import type {Wedding,EventVenue} from './demo';
import {block,type StudioDocument} from './invitation-studio';
export const venueKeys=['civil','church','restaurant'] as const;
export type VenueKey=typeof venueKeys[number];
export function venueTitle(key:VenueKey,baptism:boolean){return key==='civil'?'Cununia civilă':key==='church'?(baptism?'Biserica – botez':'Cununia religioasă'):'Restaurantul'}
export function venueValue(w:Wedding,key:VenueKey):EventVenue{return w.venues?.[key]??{venue:'',address:'',date:w.date||'',time:''}}
export function syncVenues(doc:StudioDocument,w:Wedding):StudioDocument{return {...doc,blocks:doc.blocks.map(b=>{const key=venueKeys.find(k=>b.id==='event-venue-'+k);return key?{...b,venueDetails:venueValue(w,key)}:b})}}
export function prepareVenues(doc:StudioDocument,w:Wedding):StudioDocument{const keys=venueKeys.filter(k=>k!=='civil'||w.eventType!=='baptism');const existing=doc.blocks.find(b=>b.kind==='location'&&!b.id.startsWith('event-venue-'));const managed=doc.blocks.filter(b=>b.id.startsWith('event-venue-'));if(managed.length)return syncVenues(doc,w);const base=existing||block('location','venue');const added=keys.map(k=>({...base,id:'event-venue-'+k,title:venueTitle(k,w.eventType==='baptism'),text:'',venueDetails:venueValue(w,k),hidden:!(w.venues?.[k]?.venue||w.venues?.[k]?.address)}));const blocks=doc.blocks.filter(b=>b!==existing);const at=existing?doc.blocks.indexOf(existing):Math.max(0,blocks.findIndex(b=>b.kind==='rsvp'));blocks.splice(at,0,...added);return {...doc,blocks}}
