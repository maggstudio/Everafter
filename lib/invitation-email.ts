/** Email-safe invitation template; no external images or fonts required. */
export type InvitationTheme='classic'|'modern'|'floral';
type InvitationEmail={guestName:string;eventName:string;headline:string;message:string;date:string;time?:string;location?:string;city?:string;rsvpUrl:string;theme?:string};
const esc=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]||c));
const palettes={
 classic:{bg:'#f7f2e9',panel:'#fffdf8',ink:'#493a32',accent:'#a17b4e',line:'#dfcdb5',font:'Georgia,serif'},
 modern:{bg:'#edf2f0',panel:'#ffffff',ink:'#203c37',accent:'#28695f',line:'#cbded8',font:'Arial,sans-serif'},
 floral:{bg:'#fbf0f1',panel:'#fffafa',ink:'#6b414e',accent:'#a7617a',line:'#e8c9d1',font:'Georgia,serif'}
};
export function renderInvitationEmail(input:InvitationEmail){
 const theme=(input.theme==='modern'||input.theme==='floral'?input.theme:'classic') as InvitationTheme;
 const p=palettes[theme];
 const name=esc(input.guestName),event=esc(input.eventName),headline=esc(input.headline),message=esc(input.message).replace(/\n/g,'<br>'),date=esc(input.date);
 const details=[date,input.time?'Ora '+esc(input.time):'',input.location?esc(input.location):'',input.city?esc(input.city):''].filter(Boolean);
 const ornament=theme==='floral'?'❀ &nbsp; ✿ &nbsp; ❀':theme==='classic'?'✦ &nbsp; ✦ &nbsp; ✦':'— WEDLY —';
 return `<!doctype html><html lang="ro"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:32px 12px;background:${p.bg};"><div style="display:none;max-height:0;overflow:hidden;opacity:0;">${headline} · ${event}</div><table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:620px;margin:0 auto;border-collapse:collapse"><tr><td style="padding:42px 28px;background:${p.panel};border:1px solid ${p.line};text-align:center;color:${p.ink};font-family:${p.font}"><div style="font:12px Arial,sans-serif;letter-spacing:4px;color:${p.accent};">WEDLY · INVITAȚIE</div><div style="padding:25px 0 12px;font-size:20px;color:${p.accent};">${ornament}</div><p style="font-size:17px;margin:12px 0 26px;">Dragă ${name},</p><h2 style="font-size:23px;font-weight:normal;line-height:1.4;margin:0 0 16px;">${headline}</h2><h1 style="font-size:36px;line-height:1.2;margin:0 0 24px;color:${p.accent};">${event}</h1><p style="font-size:17px;line-height:1.8;margin:0 auto 28px;max-width:440px;">${message}</p><div style="border-top:1px solid ${p.line};border-bottom:1px solid ${p.line};padding:20px 0;margin:0 auto 32px;">${details.map(d=>`<div style="font-size:16px;line-height:1.9;">${d}</div>`).join('')}</div><a href="${esc(input.rsvpUrl)}" style="display:inline-block;padding:16px 30px;background:${p.accent};color:#fff;text-decoration:none;font:600 15px Arial,sans-serif;border-radius:4px;">Confirmă participarea</a><p style="font:12px/1.7 Arial,sans-serif;color:${p.ink};margin:28px 0 0;">Acest link RSVP este personal și destinat doar ție.</p></td></tr><tr><td style="padding:16px;text-align:center;font:12px Arial,sans-serif;color:${p.ink};">Cu drag, WEDLY</td></tr></table></body></html>`;
}
