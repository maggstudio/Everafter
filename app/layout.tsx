import './style.css';
import Providers from './providers';
import type {Metadata,Viewport} from 'next';
import {ThemeController} from './components/ThemeSettings';
import PwaInstall from './components/PwaInstall';
export const viewport:Viewport={themeColor:'#50205E',viewportFit:'cover'};
export const metadata:Metadata = {manifest:'/manifest.webmanifest',appleWebApp:{capable:true,title:'WEDLY',statusBarStyle:'default'},icons:{apple:'/pwa/icon/180',icon:'/brand/wedly-icon.svg'},metadataBase:new URL('https://www.wedly.ro'),title:{default:'WEDLY | Organizarea evenimentelor fără stres',template:'%s | WEDLY'},description:'Platformă de organizare a nunților și botezurilor din România',openGraph:{type:'website',locale:'ro_RO',siteName:'WEDLY',title:'WEDLY | Organizarea nunților și botezurilor',description:'Invitații digitale, RSVP, buget, mese și planificare într-un singur loc.',url:'https://www.wedly.ro'},robots:{index:true,follow:true}};
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="ro" suppressHydrationWarning><body><Providers><ThemeController/>{children}<PwaInstall/></Providers></body></html>}
