'use client';
import {useEffect} from 'react';
const families=['Cormorant Garamond','Playfair Display','Great Vibes','Lora','Montserrat','DM Serif Display'];
export default function InvitationFonts({names}:{names:string[]}){const key=families.filter(f=>names.includes(f)).join('|');useEffect(()=>{if(!key)return;const id='wedly-invitation-fonts-'+key;let link=document.getElementById(id);if(!link){link=document.createElement('link');link.id=id;link.setAttribute('rel','stylesheet');link.setAttribute('href','https://fonts.googleapis.com/css2?'+key.split('|').map(f=>'family='+encodeURIComponent(f).replace(/%20/g,'+')).join('&')+'&display=swap');document.head.appendChild(link)}},[key]);return null}
