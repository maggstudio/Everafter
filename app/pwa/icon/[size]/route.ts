import {ImageResponse} from 'next/og';
import {createElement as h} from 'react';
export const runtime='edge';
export async function GET(req:Request,{params}:{params:Promise<{size:string}>}){
 const {size}=await params;const n=Number(size);if(![180,192,512].includes(n))return new Response(null,{status:404});
 const maskable=new URL(req.url).searchParams.has('maskable'),symbol=n*(maskable ? .65 : .83);
 const icon=h('svg',{width:symbol,height:symbol,viewBox:'0 0 512 512'},
 h('path',{d:'M95 177 C120 151 139 158 145 191 L166 320 C170 339 177 341 189 324 L253 219 C268 194 283 191 289 217 L309 312 C313 333 321 333 334 309 L396 194',fill:'none',stroke:'#FFFFFF',strokeWidth:29,strokeLinecap:'round',strokeLinejoin:'round'}),
 h('path',{d:'M334 170 C346 144 370 145 381 163 C392 142 419 145 428 167 C439 195 414 212 381 238 C349 214 322 195 334 170Z',fill:'none',stroke:'#FFE9EF',strokeWidth:12,strokeLinejoin:'round'}),
 h('path',{d:'M351 230 Q384 214 426 220',fill:'none',stroke:'#FFE9EF',strokeWidth:10,strokeLinecap:'round'}));
 return new ImageResponse(h('div',{style:{display:'flex',width:'100%',height:'100%',alignItems:'center',justifyContent:'center',background:'linear-gradient(135deg,#EC6788,#B52B85,#50205E)',borderRadius:maskable?0:n*.18}},icon),{width:n,height:n,headers:{'Cache-Control':'public, max-age=86400'}});
}
