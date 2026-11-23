import {NextResponse} from 'next/server';
// Per-response RSVP emails were retired. Keep the endpoint inert even if an old cron still invokes it.
export async function GET(){return NextResponse.json({error:'Notificările email pentru fiecare RSVP sunt dezactivate.'},{status:410})}
