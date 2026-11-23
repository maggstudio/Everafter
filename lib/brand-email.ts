/** Brand wrapper for WEDLY operational emails ONLY. Never use for wedding/baptism invitations. */
const escapeHtml=(value:string)=>value.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]||c));
export function brandedEmail(title:string,lines:string[]){
 const header='<img src="https://www.wedly.ro/brand/wedly-logo.svg" width="270" alt="WEDLY — Planifică. Organizează. Celebrează." style="display:block;width:270px;max-width:100%;height:auto;margin:0 0 25px" />';
 const content=lines.map(line=>line.startsWith('https://')?'<p><a href="'+escapeHtml(line)+'" style="color:#963578">'+escapeHtml(line)+'</a></p>':'<p style="margin:0 0 12px">'+escapeHtml(line)+'</p>').join('');
 return '<!doctype html><html lang="ro"><body style="margin:0;padding:24px 12px;background:#f9f5f8"><div style="max-width:580px;margin:auto;background:white;padding:30px;border:1px solid #f0e4ec;border-radius:16px;font:15px/1.65 Arial,sans-serif;color:#472443">'+header+'<h1 style="font-size:23px;margin:0 0 18px">'+escapeHtml(title)+'</h1>'+content+'<p style="margin:24px 0 0;font-size:12px;color:#8B617B">WEDLY · Planifică. Organizează. Celebrează.</p></div></body></html>';
}
