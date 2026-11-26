'use client';
import SettingsRouteShell from '../components/SettingsRouteShell';
import LegalGate from '../components/LegalGate';
import SmartHomeLogo from '../components/SmartHomeLogo';
import EventsContent from './EventsContent';
export default function EventsPage(){return <LegalGate><SettingsRouteShell><main className="shell narrow"><SmartHomeLogo/><EventsContent/></main></SettingsRouteShell></LegalGate>}
