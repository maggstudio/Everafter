// 100 built-in vector backgrounds: 10 wedding motifs × 10 palettes.
// Generated locally, shared across editor and RSVP; no per-event uploads or third-party image requests.
export const backgroundFamilies=[
 {name:'Flori romantice',kind:'floral'},
 {name:'Grădină botanică',kind:'leaves'},
 {name:'Auriu elegant',kind:'gold'},
 {name:'Acuarelă',kind:'watercolor'},
 {name:'Marmură',kind:'marble'},
 {name:'Dantelă',kind:'lace'},
 {name:'Art Deco',kind:'deco'},
 {name:'Cer înstelat',kind:'stars'},
 {name:'Rustic natural',kind:'rustic'},
 {name:'Minimalist',kind:'minimal'}
] as const;
const palettes=[
 ['#fffaf2','#a78057','#d9ba8e'],['#fff2f2','#a76e7e','#e4b3bb'],
 ['#f1f7ef','#527b64','#b4cba9'],['#f4f5fb','#68729c','#b8bde0'],
 ['#fff4e9','#bb7859','#ebc1a2'],['#f8f0fc','#896c9d','#d4bde0'],
 ['#f5f2e9','#777360','#c8b994'],['#eaf5f6','#528b92','#b1d6d9'],
 ['#fff7f0','#a36b69','#e6c1a9'],['#f8f8f6','#5b6461','#c9d0c9']
] as const;
const escape=(s:string)=>s.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
export const weddingBackgrounds=backgroundFamilies.flatMap((family,f)=>palettes.map((_,p)=>({
 id:'w'+String(f*10+p+1).padStart(3,'0'),
 name:family.name+' · '+(p+1),
 family:family.name
})));
export function weddingBackground(id?:string){
 const match=/^w(\d{3})$/.exec(id||'');if(!match)return undefined;
 const index=Number(match[1])-1;if(index<0||index>=100)return undefined;
 const f=Math.floor(index/10),p=index%10,[base,ink,soft]=palettes[p];
 const border='<rect x="24" y="24" width="552" height="852" rx="8" fill="none" stroke="'+ink+'" stroke-width="1.5" opacity=".4"/>';
 const sprig='<path d="M0 0 Q30 -35 60 -125 M18 -24 Q-18 -50 4 -77 M33 -54 Q68 -83 64 -105 M48 -93 Q17 -117 29 -142" fill="none" stroke="'+ink+'" stroke-width="3"/><ellipse cx="4" cy="-77" rx="14" ry="28" fill="'+soft+'" transform="rotate(-28 4 -77)"/><ellipse cx="64" cy="-105" rx="14" ry="28" fill="'+soft+'" transform="rotate(35 64 -105)"/>';
 const flower='<g stroke="'+ink+'" stroke-width="1.2"><circle r="12" fill="'+ink+'"/>'+Array.from({length:7},(_,i)=>'<ellipse cx="0" cy="-27" rx="13" ry="22" fill="'+soft+'" transform="rotate('+(i*360/7)+')"/>').join('')+'<circle r="11" fill="'+ink+'"/></g>';
 let art='';
 if(f===0)art='<g transform="translate(90 150)">'+sprig+'<g transform="translate(55 -125)">'+flower+'</g></g><g transform="translate(510 750) rotate(180)">'+sprig+'<g transform="translate(55 -125)">'+flower+'</g></g>';
 if(f===1)art='<g transform="translate(80 200)">'+sprig+'</g><g transform="translate(520 700) rotate(180)">'+sprig+'</g><g transform="translate(510 140) rotate(75)">'+sprig+'</g>';
 if(f===2)art='<g fill="none" stroke="'+ink+'" opacity=".65"><rect x="42" y="42" width="516" height="816" rx="160" stroke-width="3"/><rect x="55" y="55" width="490" height="790" rx="145"/><path d="M160 115 Q300 20 440 115 M160 785 Q300 880 440 785"/></g>';
 if(f===3)art='<circle cx="55" cy="140" r="160" fill="'+soft+'" opacity=".28"/><circle cx="545" cy="730" r="180" fill="'+ink+'" opacity=".12"/><circle cx="510" cy="90" r="100" fill="'+soft+'" opacity=".24"/>';
 if(f===4)art='<g fill="none" stroke="'+soft+'" stroke-width="5" opacity=".45"><path d="M-30 170 Q160 210 220 50 T630 140"/><path d="M-40 650 Q200 570 290 770 T650 700"/><path d="M30 900 Q90 720 180 600"/></g>';
 if(f===5)art=Array.from({length:12},(_,i)=>'<circle cx="'+(40+i*47)+'" cy="70" r="19" fill="none" stroke="'+ink+'" opacity=".28"/><circle cx="'+(40+i*47)+'" cy="830" r="19" fill="none" stroke="'+ink+'" opacity=".28"/>').join('');
 if(f===6)art='<g fill="none" stroke="'+ink+'" opacity=".55"><path stroke-width="3" d="M70 260 V80 H250 M350 80 H530 V260 M70 640 V820 H250 M350 820 H530 V640"/><path d="M90 220 V100 H210 M390 100 H510 V220 M90 680 V800 H210 M390 800 H510 V680"/></g>';
 if(f===7)art=Array.from({length:42},(_,i)=>{const x=(i*127+31)%560+20,y=(i*191+17)%850+25;return '<path d="M'+x+' '+(y-4)+'v8 m-4 -4h8" stroke="'+ink+'" stroke-width="'+(i%4===0?2:1)+'" opacity=".45"/>'}).join('');
 if(f===8)art='<g transform="translate(90 170)">'+sprig+'</g><g transform="translate(510 730) rotate(180)">'+sprig+'</g><path d="M55 450 h80 M465 450 h80" stroke="'+ink+'" stroke-width="2" opacity=".4"/>';
 if(f===9)art='<path d="M200 125 H400 M200 775 H400" stroke="'+ink+'" stroke-width="2"/><circle cx="300" cy="125" r="6" fill="'+ink+'"/><circle cx="300" cy="775" r="6" fill="'+ink+'"/>';
 const svg='<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900" viewBox="0 0 600 900"><rect width="600" height="900" fill="'+base+'"/>'+border+art+'</svg>';
 return 'url("data:image/svg+xml,'+encodeURIComponent(svg)+'")';
}
