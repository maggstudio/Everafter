import type {Metadata} from 'next';
export const metadata:Metadata={title:'Panoul evenimentului',robots:{index:false,follow:false}};
import AuthGuard from '../auth-guard';
export default function Layout({children}:{children:React.ReactNode}){return <AuthGuard>{children}</AuthGuard>}
