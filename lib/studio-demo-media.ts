export const demoMedia={"timeless":"Flori","editorial":"Mătase","botanical":"Frunze","midnight":"Stele","romance":"Petale","terracotta":"Arcadă","champagne":"Auriu","royal":"Ornament","cloud":"Nori","star":"Lună","venue":"Grădină","bouquet":"Buchet","baby":"Pastel","baby2":"Steluțe"} as const;
export type DemoMediaKey=keyof typeof demoMedia;
export function isDemoMedia(v:unknown):v is DemoMediaKey{return typeof v==='string'&&Object.prototype.hasOwnProperty.call(demoMedia,v)}
export function demoUrl(key:DemoMediaKey){return '/invitation-backgrounds/'+key+'.svg'}
export function defaultMedia(index:number,kind:string,baptism:boolean):DemoMediaKey[]{const main=(Object.keys(demoMedia) as DemoMediaKey[])[index]||'timeless';return kind==='cover'?[main]:kind==='text'?[baptism?'baby':'bouquet']:kind==='location'?['venue']:kind==='gallery'?[main,'bouquet',baptism?'baby2':'venue']:[]}

export const mediaCategories=['Toate','Floral','Elegant','Natură','Botez','Celestial'] as const;
export const mediaCategory:Record<DemoMediaKey,typeof mediaCategories[number]>={timeless:'Floral',editorial:'Elegant',botanical:'Natură',midnight:'Celestial',romance:'Floral',terracotta:'Elegant',champagne:'Elegant',royal:'Elegant',cloud:'Botez',star:'Celestial',venue:'Natură',bouquet:'Floral',baby:'Botez',baby2:'Botez'};
