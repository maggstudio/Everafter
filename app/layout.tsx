import './style.css';
import Providers from './providers';
import type {Metadata} from 'next';
export const metadata:Metadata = {metadataBase:new URL('https://www.wedly.ro'),title:{default:'WEDLY | Organizarea evenimentelor fără stres',template:'%s | WEDLY'},description:'Platformă de organizare a nunților și botezurilor din România',openGraph:{type:'website',locale:'ro_RO',siteName:'WEDLY',title:'WEDLY | Organizarea nunților și botezurilor',description:'Invitații digitale, RSVP, buget, mese și planificare într-un singur loc.',url:'https://www.wedly.ro'},robots:{index:true,follow:true}};
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="ro"><body><Providers>{children}</Providers></body></html>}
