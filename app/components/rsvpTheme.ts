import type {StudioDocument} from '../../lib/invitation-studio';
import type {CSSProperties} from 'react';
export function rsvpTheme(doc?:StudioDocument){const cover=doc?.blocks.find(b=>b.kind==='cover');const block=doc?.blocks.find(b=>b.kind==='rsvp'&&!b.hidden)||cover;return {className:'studio-public-rsvp'+(cover?.templateStyle?' studio-rsvp-'+cover.templateStyle:''),style:block?{'--rsvp-bg':block.background,'--rsvp-ink':block.color,'--rsvp-heading':block.headingFont||block.font,'--rsvp-body':block.font} as CSSProperties:undefined}}
