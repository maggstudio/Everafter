import {NextResponse} from 'next/server';
// Invitation delivery is organizer-owned. No platform email is sent to guests.
export async function POST(){return NextResponse.json({error:'Trimiterea invitațiilor prin WEDLY a fost dezactivată. Folosește distribuirea din contul organizatorului.'},{status:410})}
export async function GET(){return NextResponse.json({error:'Istoricul trimiterilor prin platformă nu mai este disponibil.'},{status:410})}
