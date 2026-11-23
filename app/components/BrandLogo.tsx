import Image from 'next/image';
type Props={compact?:boolean;showMotto?:boolean;className?:string};
export default function BrandLogo({compact=false,showMotto=false,className=''}:Props){
 return <span className={'wedly-brand '+(compact?'wedly-brand-compact ':'')+className}>
  <Image src="/brand/wedly-icon.svg" width={42} height={42} alt="" aria-hidden="true" className="wedly-brand-symbol" unoptimized/>
  <span className="wedly-brand-copy"><span className="wedly-brand-name">WEDLY</span>{showMotto&&<span className="wedly-brand-motto">Planifică. Organizează. Celebrează.</span>}</span>
 </span>;
}
