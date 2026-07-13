import type {NextConfig} from 'next';

const config: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  images: {formats: ['image/avif', 'image/webp'], remotePatterns: [{protocol: 'https', hostname: 'images.igdb.com', pathname: '/igdb/image/upload/**'}]},
  async headers() { const immutable=[{key:'Cache-Control',value:'public, max-age=31536000, immutable'}];return [
    {source: '/:path*', headers: [{key: 'X-Content-Type-Options', value: 'nosniff'}, {key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin'}, {key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()'}]},
    {source:'/covers/:path*',headers:immutable},{source:'/gameplay/:path*',headers:immutable},{source:'/media/:path*',headers:immutable}
  ]; },
};
export default config;
