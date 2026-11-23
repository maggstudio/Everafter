import Link from 'next/link';
const features=[
 {icon:'♡',title:'Invitații digitale & RSVP',description:'Personalizează invitațiile, trimite emailuri și urmărește confirmările.'},
 {icon:'▦',title:'Așezarea la mese',description:'Organizează mesele și repartizează invitații în planul evenimentului.'},
 {icon:'◷',title:'Calendar & checklist',description:'Planifică sarcinile, programările și termenele importante.'},
 {icon:'₾',title:'Buget & cheltuieli',description:'Urmărește bugetul, plățile și sumele rămase.'},
 {icon:'✍',title:'Furnizori',description:'Centralizează furnizorii, avansurile și scadențele. Gestionarea documentelor se extinde treptat.'},
 {icon:'✦',title:'Colaborare',description:'Invită partenerul sau organizatorii și controlează permisiunile.'}
];
export default function Home(){
 return <main className="landing"><header className="top"><Link className="brand" href="/" aria-label="WEDLY, prima pagină">WEDLY<span>✦</span></Link><nav aria-label="Navigare principală"><Link href="/login">Autentificare</Link></nav></header>
 <section className="hero christmas-hero">
 <div className="christmas-ribbon">🎄 OFERTĂ SPECIALĂ DE CRĂCIUN · WEDLY 2027</div>
 <span className="eyebrow">PENTRU VIITORII MIRI · ROMÂNIA</span>
 <h1>Ai nunta în 2027?<br/><em>Organizeaz-o GRATUIT!</em></h1>
 <p className="christmas-lead">Toate instrumentele de care ai nevoie pentru organizarea nunții, într-un singur loc. Creează-ți contul WEDLY și profită de accesul gratuit în perioada de lansare.</p>
 <div className="christmas-pricing" aria-label="Pachetele WEDLY disponibile gratuit în perioada de lansare">
 <article className="christmas-price-card"><span>START</span><strong>GRATUIT</strong><small>0 lei · în perioada de lansare</small></article>
 <article className="christmas-price-card christmas-price-featured"><span>PREMIUM</span><del>149 lei</del><strong>0 lei</strong><small>GRATUIT acum</small></article>
 <article className="christmas-price-card"><span>LUXURY</span><del>299 lei</del><strong>0 lei</strong><small>GRATUIT acum</small></article>
 </div>
 <div className="actions christmas-actions"><Link className="button christmas-primary" href="/login?mode=signup">🎁 Vreau cont gratuit</Link><Link className="button secondary" href="/demo">Vezi platforma înainte de înscriere</Link></div>
 <p className="christmas-trust">✓ Fără card bancar &nbsp; ✓ Fără plată la înscriere &nbsp; ✓ Acces gratuit în perioada de lansare</p>
 <p className="hint christmas-disclosure">Prețurile tăiate sunt prețuri de listă orientative pentru pachete viitoare, nu prețuri practicate anterior. Oferta de Crăciun evidențiază nunțile din 2027; gratuitatea de lansare este disponibilă momentan și pentru alte evenimente.</p>
 </section>
 <section className="christmas-benefits" aria-labelledby="christmas-benefits-title"><span className="eyebrow">CE PRIMEȘTI GRATUIT</span><h2 id="christmas-benefits-title">Mai puțin stres. Mai mult timp pentru voi.</h2><div className="christmas-benefit-grid"><div><b>♡ Invitații și confirmări</b><p>Trimite invitații digitale și urmărește răspunsurile.</p></div><div><b>▦ Planificarea meselor</b><p>Organizează invitații și așezarea la mese.</p></div><div><b>◷ Calendar și sarcini</b><p>Ține toate termenele sub control.</p></div><div><b>✦ Buget și furnizori</b><p>Urmărește cheltuieli, plăți și colaboratori.</p></div></div><Link className="button" href="/login?mode=signup">Creează-ți contul gratuit</Link></section>
 <section className="landing-product-teaser"><div><span className="eyebrow">O PRIVIRE ÎN INTERIOR</span><h2>Tot evenimentul, într-un singur loc.</h2><p>Vezi cum poți urmări invitații, sarcinile, bugetul și programările într-un spațiu simplu și organizat.</p><Link className="button secondary" href="/demo">Explorează exemplul WEDLY</Link></div><div className="landing-teaser-preview" aria-hidden="true"><span>WEDLY ✦ · Panou eveniment</span><strong>Ana & Andrei</strong><div><span>Invitați <b>86 / 150</b></span><span>Sarcini <b>12 / 20</b></span><span>Buget <b>80.000 lei</b></span></div></div></section><section id="functionalitati" aria-labelledby="features-title"><h2 id="features-title">Tot ce ai nevoie pentru organizare</h2><div className="feature-grid">{features.map(feature=><article className="feature" key={feature.title}><div className="feature-icon" aria-hidden="true">{feature.icon}</div><h3>{feature.title}</h3><p>{feature.description}</p></article>)}</div></section>
 <section className="panel landing-next"><h2>Începe cu propriul eveniment</h2><p>După înregistrare, creezi un eveniment de nuntă sau botez și alegi modulele potrivite. Poți reveni oricând la organizare din contul tău.</p><div className="actions"><Link className="button" href="/login?mode=signup">Înregistrează-te</Link><Link className="button secondary" href="/login">Am deja cont</Link></div></section>
 <footer className="public-footer"><span>© {new Date().getFullYear()} WEDLY · România</span><nav aria-label="Informații"><Link href="/confidentialitate">Confidențialitate</Link><Link href="/contact">Contact</Link></nav></footer></main>
}
