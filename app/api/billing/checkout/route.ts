import {NextResponse} from 'next/server';

export const runtime='nodejs';

// Checkout is intentionally disabled during the free launch.
// Do not retain unreachable Stripe code: TypeScript still checks it during builds.
export async function POST(){
 return NextResponse.json({error:'WEDLY este gratuit în perioada de lansare. Plățile sunt dezactivate.'},{status:403});
}
