import './style.css';
import Providers from './providers';
export const metadata = {title:'EVERAFTER | Planificarea nunții',description:'Platforma de organizare a nunților din România'};
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="ro"><body><Providers>{children}</Providers></body></html>}
