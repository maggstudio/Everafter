// Unsplash source identifiers; review model/property releases before commercial rollout.
export const demoMedia={
 timeless:'Snma3Iln1Mo',editorial:'F37-35tkYdY',botanical:'5ICctTdtgjI',midnight:'wJll9v7WLiU',romance:'cWLEzYAcI3Q',terracotta:'W8rsj2zL1nA',champagne:'pd7QlQfZmF0',royal:'GW7EDvttDzk',cloud:'LcJARfBVhW8',star:'AjixQZhASIA',venue:'zjJiX9txwRU',bouquet:'gTrfIjppVQc',baby:'NfE2M4Z9rME',baby2:'B0227D4PufE'
} as const;
export type DemoMediaKey=keyof typeof demoMedia;
export function isDemoMedia(v:unknown):v is DemoMediaKey{return typeof v==='string'&&Object.prototype.hasOwnProperty.call(demoMedia,v)}
export function demoUrl(key:DemoMediaKey){return 'https://unsplash.com/photos/'+demoMedia[key]+'/download?force=true&w=1400'}
export function defaultMedia(index:number,kind:string,baptism:boolean):DemoMediaKey[]{const main=(['timeless','editorial','botanical','midnight','romance','terracotta','champagne','royal','cloud','star'] as const)[index]||'timeless';const baby=baptism||index>=8;const cover=baby?(index===9?'star':'cloud'):main;return kind==='cover'?[cover]:kind==='text'?[baby?'baby':'bouquet']:kind==='location'?['venue']:kind==='gallery'?(baby?[cover,'baby','baby2']: [cover,'bouquet','venue']):[]}
