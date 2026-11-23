import {createHmac,timingSafeEqual} from 'node:crypto';
export type PublicInvitation={eventName:string;headline:string;message:string;date:string;time:string;location:string;city:string;theme:string;accentColor?:string;fontStyle?:string;ornament?:string;backgroundStyle?:string;family:{label:string;names:string}[];expires:number;photoPath?:string;backgroundPhotoPath?:string;photoPositionX?:number;photoPositionY?:number;photoZoom?:number;tokenHash:string};
const key=()=>process.env.INVITATION_LINK_SECRET||process.env.SUPABASE_SERVICE_ROLE_KEY;
const digest=(token:string)=>createHmac('sha256',key()||'').update(token).digest('hex');
export function signPublicInvitation(details:Omit<PublicInvitation,'tokenHash'|'expires'>,token:string,expires:number){
 if(!key())throw new Error('Invitation signing secret missing');
 const payload:PublicInvitation={...details,expires,tokenHash:digest(token)};
 const body=Buffer.from(JSON.stringify(payload)).toString('base64url');
 const signature=createHmac('sha256',key()!).update(body).digest('base64url');
 return body+'.'+signature;
}
export function verifyPublicInvitation(value:string,token:string):PublicInvitation|null{
 if(!key()||value.length>12000||!token||token.length>1000)return null;
 const [body,sig,...extra]=value.split('.');
 if(extra.length||!body||!sig||!/^[A-Za-z0-9_-]+$/.test(body))return null;
 const expected=createHmac('sha256',key()!).update(body).digest();
 let actual:Buffer;try{actual=Buffer.from(sig,'base64url')}catch{return null}
 if(actual.length!==expected.length||!timingSafeEqual(actual,expected))return null;
 let payload:PublicInvitation;try{payload=JSON.parse(Buffer.from(body,'base64url').toString('utf8'))}catch{return null}
 if(!payload||typeof payload.expires!=='number'||Date.now()>payload.expires||typeof payload.tokenHash!=='string')return null;
 const actualToken=Buffer.from(digest(token),'hex'),bound=Buffer.from(payload.tokenHash,'hex');
 if(actualToken.length!==bound.length||!timingSafeEqual(actualToken,bound))return null;
 return payload;
}
