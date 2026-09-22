import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  reactStrictMode: true,

  eslint: {
    ignoreDuringBuilds: true,
  },

  typescript: {
    ignoreBuildErrors: false,
  },

  images: {
    dangerouslyAllowSVG: true,

    contentDispositionType: 'attachment',

    contentSecurityPolicy:
      "default-src 'self'; script-src 'none'; sandbox;",

    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },

      /*
       * DHOTI AALE uploaded battle images
       *
       * Battle/admin images can be stored on PhotoTour CDN.
       */
      {
        protocol: 'https',
        hostname: 'cdn.phototourl.com',
        port: '',
        pathname: '/**',
      },

      /*
       * Supabase Storage — battle-image bucket & other uploads
       */
      {
        protocol: 'https',
        hostname: 'zlngcbefvdtbihndaeun.supabase.co',
        port: '',
        pathname: '/storage/**',
      },
    ],
  },

  // output: 'standalone',

  transpilePackages: ['motion'],

  webpack: (config, { dev }) => {
    if (dev && process.env.DISABLE_HMR === 'true') {
      config.watchOptions = {
        ignored: /.*/,
      };
    }

    return config;
  },
};

export default nextConfig;