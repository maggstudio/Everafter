/** @type {import('next').NextConfig} */
const config = {
 async headers() {
  return [{source:'/:path*',headers:[
   {key:'X-Content-Type-Options',value:'nosniff'},
   {key:'Referrer-Policy',value:'no-referrer'},
   {key:'X-Frame-Options',value:'SAMEORIGIN'},
   {key:'Permissions-Policy',value:'microphone=(), geolocation=()'}
  ]},...['/privacy/:path*','/events/:path*','/team/:path*','/setup/:path*','/reset-password/:path*','/dashboard/:path*','/admin/:path*','/login/:path*','/rsvp/:path*','/api/:path*'].map(source=>({source,headers:[{key:'X-Robots-Tag',value:'noindex, nofollow, noarchive'}]}))];
 }
};
export default config;
